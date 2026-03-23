import Conversation from "../Models/Conversation.model.js";
import Message from "../Models/Message.model.js";
import response from "../Utils/responseHandler.js";
import { uploadFileToCloudinary } from "../Config/cloudinaryconfig.js";

// CREATE OR GET ONE‑TO‑ONE CONVERSATION
export const createConversation = async (req, res) => {
    try {

        const senderId = req.user._id;
        const { receiverId } = req.body;

        if (!receiverId) {
            return response(res, 400, "ReceiverId required");
        }

        const participants = [senderId, receiverId].sort();

        let conversation = await Conversation.findOne({
            participants: { $all: participants, $size: 2 },
            isGroupChat: false
        })
            .populate(
                "participants",
                "username profilePicture about phoneNumber phoneSuffix isOnline lastSeen"
            )
            .populate({
                path: "lastMessage",
                populate: {
                    path: "sender receiver",
                    select: "username profilePicture isOnline"
                }
            });

        if (conversation) {
            return response(res, 200, "conversation exists", conversation);
        }

        conversation = await Conversation.create({
            participants,
            unreadCount: 0,
            isGroupChat: false
        });

        const fullConversation = await Conversation.findById(conversation._id)
            .populate(
                "participants",
                "username profilePicture about phoneNumber phoneSuffix isOnline lastSeen"
            )
            .populate({
                path: "lastMessage",
                populate: {
                    path: "sender receiver",
                    select: "username profilePicture isOnline"
                }
            });

        req.io.to(receiverId).emit("new_conversation", fullConversation);

        return response(res, 201, "conversation created", fullConversation);

    } catch (error) {
        console.error(error);
        return response(res, 500, "cannot create conversation");
    }
};

// CREATE GROUP CONVERSATION
export const createGroupConversation = async (req, res) => {
    try {
        const creatorId = req.user._id;
        const { name, users } = req.body;

        if (!name || !name.trim()) {
            return response(res, 400, "Group name is required");
        }

        if (!Array.isArray(users) || users.length < 2) {
            return response(res, 400, "Add at least 2 members");
        }

        const uniqueParticipants = Array.from(
            new Set([creatorId.toString(), ...users.map((u) => u.toString())])
        );

        const conversation = await Conversation.create({
            chatName: name.trim(),
            participants: uniqueParticipants,
            unreadCount: 0,
            isGroupChat: true,
            groupAdmin: creatorId,
        });

        const fullConversation = await Conversation.findById(conversation._id)
            .populate(
                "participants",
                "username profilePicture about phoneNumber phoneSuffix isOnline lastSeen"
            )
            .populate({
                path: "lastMessage",
                populate: {
                    path: "sender receiver",
                    select: "username profilePicture isOnline",
                },
            });

        if (req.io && req.socketUserMap) {
            uniqueParticipants
                .filter((id) => id.toString() !== creatorId.toString())
                .forEach((participantId) => {
                    const socketId = req.socketUserMap.get(participantId);
                    if (socketId) {
                        req.io.to(socketId).emit("new_conversation", fullConversation);
                    }
                });
        }

        return response(res, 201, "group conversation created", fullConversation);
    } catch (error) {
        console.error(error);
        return response(res, 500, "cannot create group conversation");
    }
};

// GET USER CONVERSATIONS
export const getUserConversations = async (req, res) => {

    try {

        const userId = req.user._id;

        let conversation = await Conversation.find({
            participants: userId
        })
            .populate("participants", "username profilePicture isOnline about")
            .populate({
                path: "lastMessage",
                populate: {
                    path: "sender receiver",
                    select: "username profilePicture isOnline about"
                }
            })
            .sort({ updatedAt: -1 });

        return response(res, 200, "conversations fetched", conversation);

    } catch (error) {
        console.error(error);
        return response(res, 500, "cannot get conversations");
    }
};

// DELETE CONVERSATION
export const deleteConversation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id.toString();

        const conversation = await Conversation.findById(id);
        if (!conversation) {
            return res.status(404).json({ status: "error", message: "Conversation not found" });
        }

        if (conversation.isGroupChat && conversation.groupAdmin?.toString() !== userId) {
            return res.status(403).json({ status: "error", message: "Only admin can delete the group" });
        }

        await Message.deleteMany({ conversation: id });
        await Conversation.findByIdAndDelete(id);

        return res.status(200).json({
            status: "success",
            message: "Conversation deleted"
        });

    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};

// RESET UNREAD COUNT
export const resetUnreadCount = async (req, res) => {

    try {

        const { conversationId } = req.body;

        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return response(res, 404, "conversation not found");
        }

        conversation.unreadCount = 0;

        await conversation.save();

        return response(res, 200, "unread count reset");

    } catch (error) {
        console.error(error);
        return response(res, 500, "cannot reset unread count");
    }
};

export const addUserToGroup = async (req, res) => {
    try {

        const { conversationId, userIds } = req.body;

        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        if (!conversation.isGroupChat) {
            return res.status(400).json({ message: "Not a group chat" });
        }

        const existing = conversation.participants.map(id => id.toString());

        const newMembers = userIds.filter(
            id => !existing.includes(id)
        );

        if (!conversation.participants.includes(req.user._id)) {
            return res.status(403).json({ message: "Only members can add users" });
        }

        conversation.participants.push(...newMembers);

        await conversation.save();

        const updatedConversation = await Conversation.findById(conversationId)
            .populate("participants", "username phoneNumber phoneSuffix profilePicture isOnline lastSeen")
            .populate("groupAdmin", "username")
            .populate({
                path: "lastMessage",
                populate: {
                    path: "sender receiver",
                    select: "username profilePicture isOnline"
                }
            });

        if (req.io && req.socketUserMap) {
            newMembers.forEach((newMemberId) => {
                const socketId = req.socketUserMap.get(newMemberId.toString());
                if (socketId) {
                    req.io.to(socketId).emit("new_conversation", updatedConversation);
                }
            });

            existing.forEach((existingMemberId) => {
                const socketId = req.socketUserMap.get(existingMemberId.toString());
                if (socketId) {
                    req.io.to(socketId).emit("conversation_updated", updatedConversation);
                }
            });
        }

        res.status(200).json(updatedConversation);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error adding members" });
    }
};
export const removeUserFromGroup = async (req, res) => {

    try {

        const { conversationId, userId } = req.body;
        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        const adminId = conversation.groupAdmin?.toString();
        const requestUserId = req.user._id.toString();

        if (adminId !== requestUserId && requestUserId !== userId) {
            return res.status(403).json({
                message: "Only admin can remove others. You can only remove yourself."
            });
        }

        conversation.participants =
            conversation.participants.filter(
                id => id.toString() !== userId
            );

        await conversation.save();

        const updatedConversation = await Conversation.findById(conversationId)
            .populate("participants", "username phoneNumber phoneSuffix profilePicture about")
            .populate("groupAdmin", "username");


        req.io.to(conversationId).emit("userRemoved", {
            conversationId,
            userId,
            updatedConversation
        });


        res.status(200).json(updatedConversation);

    } catch (error) {

        console.error(error);
        res.status(500).json({ message: "Error removing member" });

    }
};

export const updateGroup = async (req, res) => {
    try {
        const { chatId, chatName } = req.body;
        const file = req.file;
        console.log(chatId)
        console.log(chatName)
        const conversation = await Conversation.findById(chatId);

        console.log(conversation)
        if (!conversation || !conversation.isGroupChat) {
            return response(res, 400, "Group not found");
        }

        if (!conversation.participants.includes(req.user._id)) {
            return response(res, 403, "Not authorized");
        }

        if (chatName) {
            conversation.chatName = chatName;
            // return response(res, 400, "New name can not be same as old");
        }

        if (file) {
            const uploadFile = await uploadFileToCloudinary(file);
            if (uploadFile?.secure_url) {
                conversation.groupPic = uploadFile.secure_url;
            }
        }

        await conversation.save();

        const updatedConversation = await Conversation.findById(chatId)
            .populate(
                "participants",
                "username profilePicture about phoneNumber phoneSuffix isOnline lastSeen"
            )
            .populate("groupAdmin", "username")
            .populate({
                path: "lastMessage",
                populate: {
                    path: "sender receiver",
                    select: "username profilePicture isOnline"
                }
            });

        if (req.io && req.socketUserMap) {
            conversation.participants.forEach((participantId) => {
                const socketId = req.socketUserMap.get(participantId.toString());
                if (socketId) {
                    req.io.to(socketId).emit("conversation_updated", updatedConversation);
                }
            });
        }
        console.log(updatedConversation)
        return response(res, 200, "Group updated", updatedConversation);
    } catch (error) {
        console.error(error);
        return response(res, 500, "Cannot update group");
    }
};