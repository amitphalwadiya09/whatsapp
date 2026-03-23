import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getSocket } from "./chat.service";
import {
    updateLastMessage,
    removeChat,
    selectChat,
} from "../Slices/chatSlice";
import { addOrUpdateChat } from "../Slices/chatSlice";
import {
    addMessage,
    markMessagesSeen,
    addReaction,
    deleteMessage,
    userTyping,
} from "../Slices/messageSlice";

import { setOnlineUsers } from "../Slices/userSlice";

const SocketManager = () => {

    const socket = getSocket();

    const dispatch = useDispatch();
    const selectedChat = useSelector((state) => state.chats.selectedChat);

    const selectedChatRef = useRef(null);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user"));

        if (user?._id) {
            socket.emit("user_connected", user._id);
        }
    }, [socket]);

    useEffect(() => {
        selectedChatRef.current = selectedChat;
    }, [selectedChat]);


    useEffect(() => {

        const handleReceiveMessage = (message) => {
            // console.log("New message:", message);

            const convId = message.conversation?._id || message.conversation;

            dispatch(updateLastMessage({
                conversationId: convId,
                message
            }));

            if (selectedChatRef.current?._id === convId) {
                dispatch(addMessage(message));

                const currentUser = JSON.parse(localStorage.getItem("user"));
                const currentUserId = currentUser?._id;
                const senderId = message.sender?._id || message.sender;

                if (senderId !== currentUserId) {
                    socket.emit("message_read", {
                        messageIds: [message._id],
                        senderId: senderId
                    });
                }
            }
        };

        const handleMessageStatusUpdate = ({ messageId, messageStatus }) => {

            if (messageStatus === "read") {
                dispatch(markMessagesSeen(messageId));
            }
        };

        const handleUserStatus = ({ userId, isOnline }) => {
            dispatch(setOnlineUsers({ userId, isOnline }));
        };

        const handleReactionUpdate = ({ messageId, reactions }) => {

            dispatch(addReaction({ messageId, reactions }))
        };

        const handleConversationDeleted = (conversationId) => {

            dispatch(removeChat(conversationId));

            if (selectedChatRef.current?._id === conversationId) {
                dispatch(selectChat(null));
            }
        };

        const handleTyping = ({ userId, conversationId, isTyping }) => {

            dispatch(userTyping({ userId, conversationId, isTyping }));
        };

        const handleMessageSend = (message) => {
            dispatch(addMessage(message));
        };

        const handleMessageDeleted = (deletemessageId) => {
            dispatch(deleteMessage(deletemessageId))
        };

        const handleMessageError = (error) => {
            console.error(error);
        };
        const handleNewConversation = (conversation) => {
            dispatch(addOrUpdateChat(conversation));
        };
        const handleUserRemoved = ({ conversationId, userId, updatedConversation }) => {

            const currentUser = JSON.parse(localStorage.getItem("user"));

            // If YOU were removed
            if (currentUser._id === userId) {

                dispatch(removeChat(conversationId));

                if (selectedChatRef.current?._id === conversationId) {
                    dispatch(selectChat(null));
                }

                return;
            }

            // Otherwise update conversation
            dispatch(addOrUpdateChat(updatedConversation));

            if (selectedChatRef.current?._id === conversationId) {
                dispatch(selectChat(updatedConversation));
            }
        };
        const handleConversationUpdated = (conversation) => {
            dispatch(addOrUpdateChat(conversation));

            if (selectedChatRef.current?._id === conversation._id) {
                dispatch(selectChat(conversation));
            }
        };

        socket.on("receive_message", handleReceiveMessage);
        socket.on("message_Status_update", handleMessageStatusUpdate);
        socket.on("user_status", handleUserStatus);
        socket.on("reaction_update", handleReactionUpdate);
        socket.on("user_typing", handleTyping);
        socket.on("conversation_deleted", handleConversationDeleted);
        socket.on("message_send", handleMessageSend);
        socket.on("message_delete", handleMessageDeleted);
        socket.on("message_error", handleMessageError);
        socket.on("new_conversation", handleNewConversation);
        socket.on("userRemoved", handleUserRemoved);
        socket.on("conversation_updated", handleConversationUpdated);

        return () => {
            socket.off("receive_message", handleReceiveMessage);
            socket.off("message_Status_update", handleMessageStatusUpdate);
            socket.off("user_status", handleUserStatus);
            socket.off("reaction_update", handleReactionUpdate);
            socket.off("user_typing", handleTyping);
            socket.off("conversation_deleted", handleConversationDeleted);
            socket.off("message_send", handleMessageSend);
            socket.off("message_delete", handleMessageDeleted);
            socket.off("message_error", handleMessageError);
            socket.off("new_conversation", handleNewConversation);
            socket.off("userRemoved", handleUserRemoved);
            socket.off("conversation_updated", handleConversationUpdated);
        };

    }, [dispatch, socket]);

    useEffect(() => {

        if (selectedChat?._id) {
            socket.emit("join chat", selectedChat._id);
        }

    }, [selectedChat, socket]);

    return null;
};

export default SocketManager;