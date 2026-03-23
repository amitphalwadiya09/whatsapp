import { Server } from "socket.io";
import User from "../Models/User.Model.js";
import Message from "../Models/Message.model.js";
import Conversation from "../Models/Conversation.model.js";

const onlineUsers = new Map();

const typingUsers = new Map();

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:5173",
            credentials: true,
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        },
        pingTimeout: 10000,
    });


    io.on("connection", (socket) => {
        console.log(`user connected with this id${socket.id} `);
        let userId = null;

        socket.on("join chat", (conversationId) => {
            socket.join(conversationId);
        });


        socket.on("user_connected", async (connectingUserId) => {
            try {
                userId = connectingUserId;
                onlineUsers.set(userId, socket.id);
                socket.join(userId);

                // // #region agent log
                // fetch('http://127.0.0.1:7664/ingest/1695883e-214c-4843-933a-6e94364e575a', {
                //     method: 'POST',
                //     headers: {
                //         'Content-Type': 'application/json',
                //         'X-Debug-Session-Id': 'e36628'
                //     },
                //     body: JSON.stringify({
                //         sessionId: 'e36628',
                //         runId: 'run1',
                //         hypothesisId: 'H1',
                //         location: 'socketService.js:37',
                //         message: 'user_connected received on server',
                //         data: { userId, socketId: socket.id },
                //         timestamp: Date.now()
                //     })
                // }).catch(() => { });
                // // #endregion agent log

                //update backend
                await User.findByIdAndUpdate(userId, {
                    isOnline: true,
                    lastSeen: new Date(),
                });

                //update in frontend
                const statusPayload = { userId, isOnline: true };

                // #region agent log
                fetch('http://127.0.0.1:7664/ingest/1695883e-214c-4843-933a-6e94364e575a', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Debug-Session-Id': 'e36628'
                    },
                    body: JSON.stringify({
                        sessionId: 'e36628',
                        runId: 'run1',
                        hypothesisId: 'H1',
                        location: 'socketService.js:49',
                        message: 'emitting user_status online',
                        data: statusPayload,
                        timestamp: Date.now()
                    })
                }).catch(() => { });
                // #endregion agent log

                io.emit('user_status', statusPayload);

            } catch (error) {
                console.error("error handling user connection", error)

            }
        })

        //return online status of requested user 

        socket.on("get_user_status", (requestedUserId, callback) => {
            const isOnline = onlineUsers.has(requestedUserId);
            callback({
                userId: requestedUserId,
                isOnline,
                lastSeen: isOnline ? new Date() : null,
            })
        })

        //forword message to receiver if online
        socket.on("send_message", async (messageData) => {
            try {
                const message = await Message.create(messageData);

                // Update Conversation with lastMessage and unreadCount
                const conversation = await Conversation.findById(message.conversation);
                if (conversation) {
                    conversation.lastMessage = message._id;
                    conversation.unreadCount = (conversation.unreadCount || 0) + 1;
                    await conversation.save();

                    const populatedMessage = await Message.findById(message._id)
                        .populate("sender", "username profilePicture")
                        .populate("receiver", "username profilePicture")
                        .populate({
                            path: "conversation",
                            populate: {
                                path: "participants",
                                select: "username profilePicture isOnline"
                            }
                        });


                    conversation.participants.forEach((participantId) => {
                        if (participantId.toString() !== message.sender.toString()) {
                            const pSocketId = onlineUsers.get(participantId.toString());
                            if (pSocketId) {
                                io.to(pSocketId).emit("receive_message", populatedMessage);
                            }
                        }
                    });

                    socket.emit("message_send", populatedMessage);
                }
            } catch (error) {
                console.error("Error creating message:", error);
                socket.emit("message_error", { error: "Failed to send message" });
            }
        });

        //update message read status

        socket.on("message_read", async ({ messageIds, senderId }) => {
            try {
                await Message.updateMany(
                    { _id: { $in: messageIds } },
                    { $set: { messageStatus: "read" } }
                )

                if (messageIds && messageIds.length > 0) {
                    const msg = await Message.findById(messageIds[0]);
                    if (msg) {
                        await Conversation.findByIdAndUpdate(msg.conversation, { unreadCount: 0 });
                    }
                }

                const senderSocketId = onlineUsers.get(senderId);
                if (senderSocketId) {
                    messageIds.forEach((messageId) => {
                        io.to(senderSocketId).emit("message_Status_update", {
                            messageId,
                            messageStatus: "read"
                        })
                    })
                }
            } catch (error) {
                console.error("error updating message read status", error)
            }
        })

        // handle typing start event and auto stop
        socket.on("typing_status", ({ conversationId, receiverId }) => {

            if (!userId || !conversationId || !receiverId) {
                return;
            }

            if (!typingUsers.has(userId)) {
                typingUsers.set(userId, {});
            }

            const userTyping = typingUsers.get(userId);

            userTyping[conversationId] = true;

            if (userTyping[`${conversationId}_timeout`]) {
                clearTimeout(userTyping[`${conversationId}_timeout`]);
            }

            socket.to(receiverId).emit("user_typing", {
                userId,
                conversationId,
                isTyping: true
            });

            // auto stop typing after 3 seconds
            userTyping[`${conversationId}_timeout`] = setTimeout(() => {

                userTyping[conversationId] = false;

                socket.to(receiverId).emit("user_typing", {
                    userId,
                    conversationId,
                    isTyping: false
                });

            }, 3000);

        });

        socket.on("typing_stop", (conversationId, receiverId) => {
            if (!userId || !conversationId || !receiverId) {
                return;
            }

            if (typingUsers.has(userId)) {
                const userTyping = typingUsers.get(userId);
                userTyping[conversationId] = false

                if (userTyping[`${conversationId}_timeout`]) {
                    clearTimeout(userTyping[`${conversationId}_timeout`]);
                    delete userTyping[`${conversationId}_timeout`];
                }
            };

            socket.to(receiverId).emit("user_typing", {
                userId,
                conversationId,
                isTyping: false
            })
        })

        //add or update reaction on message 
        socket.on("add_reaction", async ({ messageId, emoji, userId, reactionUserId }) => {
            try {
                const message = await Message.findById(messageId);
                if (!message) {
                    return
                }

                const exitingIndex = message.reactions.findIndex(
                    (r) => r.user.toString() === reactionUserId
                )

                if (exitingIndex > -1) {
                    const exiting = message.reactions[exitingIndex]
                    if (exiting.emoji === emoji) {
                        //remove same emojis
                        message.reactions.splice(exitingIndex, 1)
                    }
                    else {
                        //change emoji
                        message.reactions[exitingIndex].emoji = emoji;
                    }
                }

                else {
                    //add new reaction
                    message.reactions.push({ user: reactionUserId, emoji })
                }

                await message.save();


                // const populatedMessage = await Message.findById(message._id)
                const populatedMessage = await Message.findById(message._id)
                    .populate("sender", "username profilePicture")
                    .populate("receiver", "username profilePicture")
                    .populate("reactions.user", "username");

                const reactionUpdated = {
                    messageId,
                    reactions: populatedMessage.reactions,
                }

                const senderSocket = onlineUsers.get(populatedMessage.sender._id.toString());
                const receiverSocket = onlineUsers.get(populatedMessage.receiver?._id.toString());

                if (senderSocket) {
                    io.to(senderSocket).emit("reaction_update", reactionUpdated)
                }
                if (receiverSocket) {
                    io.to(receiverSocket).emit("reaction_update", reactionUpdated)
                }


            } catch (error) {
                console.error("error handling reaction", error)
            }
        })

        socket.on("delete_conversation", async ({ conversationId }) => {
            try {

                const conversation = await Conversation.findById(conversationId);

                if (!conversation) return;

                // notify all participants
                conversation.participants.forEach((participant) => {

                    const socketId = onlineUsers.get(participant._id.toString());

                    if (socketId) {
                        io.to(socketId).emit("conversation_deleted", conversationId);
                    }

                });

            } catch (error) {
                console.error("Error deleting conversation", error);
            }
        });

        socket.on("delete_message", async ({ messageId, conversationId }) => {

            try {

                await Message.findByIdAndDelete(messageId);

                io.to(conversationId).emit("message_deleted", messageId);

            } catch (error) {

                socket.emit("message_error", {
                    error: "Failed to delete message"
                });

            }

        });

        // WebRTC Signaling
        socket.on("call_user", ({ userToCall, offer, from }) => {
            const socketId = onlineUsers.get(userToCall);
            if (socketId) {
                io.to(socketId).emit("incoming_call", { offer, from });
            }
        });

        socket.on("answer_call", ({ to, answer }) => {
            const socketId = onlineUsers.get(to);
            if (socketId) {
                io.to(socketId).emit("call_answered", { answer });
            }
        });

        socket.on("ice_candidate", ({ to, candidate }) => {
            const socketId = onlineUsers.get(to);
            if (socketId) {
                io.to(socketId).emit("ice_candidate", { candidate });
            }
        });

        socket.on("reject_call", ({ to }) => {
            const socketId = onlineUsers.get(to);
            if (socketId) {
                io.to(socketId).emit("call_rejected");
            }
        });

        socket.on("end_call", ({ to }) => {
            const socketId = onlineUsers.get(to);
            if (socketId) {
                io.to(socketId).emit("call_ended");
            }
        });

        //handle disconnection and mark user offline

        const handleDisconnection = async () => {
            if (!userId) {
                return;
            }
            try {
                onlineUsers.delete(userId);
                //clear all typing timeout
                if (typingUsers.has(userId)) {
                    const userTyping = typingUsers.get(userId);
                    Object.keys(userTyping).forEach((key) => {
                        if (key.endsWith('_timeout')) {
                            clearTimeout(userTyping[key])
                        }
                    })
                    typingUsers.delete(userId);
                }


                await User.findByIdAndUpdate(userId, {
                    isOnline: false,
                    lastSeen: new Date(),
                })
                const statusPayload = {
                    userId,
                    isOnline: false,
                    lastSeen: new Date()
                };

                // #region agent log
                fetch('http://127.0.0.1:7664/ingest/1695883e-214c-4843-933a-6e94364e575a', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Debug-Session-Id': 'e36628'
                    },
                    body: JSON.stringify({
                        sessionId: 'e36628',
                        runId: 'run1',
                        hypothesisId: 'H1',
                        location: 'socketService.js:302',
                        message: 'emitting user_status offline',
                        data: statusPayload,
                        timestamp: Date.now()
                    })
                }).catch(() => { });
                // #endregion agent log
                await User.findByIdAndUpdate(userId, {
                    isOnline: false,
                    lastSeen: new Date(),
                })
                io.emit("user_status", statusPayload)

                socket.leave(userId);
                console.log(`user ${userId} disconnected`)

            } catch (error) {
                console.error("error handling disconnection", error)
            }


        }

        socket.on("disconnect", handleDisconnection)

    })



    //attach the online user map to the socket server for external user
    io.socketUserMap = onlineUsers;

    return io;

}

export default initializeSocket;