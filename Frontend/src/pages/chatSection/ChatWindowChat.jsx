import React, { useEffect, useRef } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import Lottie from "lottie-react";
import typingAnimation from "../../assets/Typing.json";
import bg from "../../assets/bg.jpeg";
import { deleteMessage, getMessages, markMessagesAsRead } from "../../services/message.service";
import { setMessages } from "../../Slices/messageSlice";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useState } from "react";
import { getSocket } from "../../services/chat.service";

const ChatWindowChat = () => {
    const dispatch = useDispatch();
    const selectedChat = useSelector((state) => state.chats.selectedChat);
    const messages = useSelector((state) => state.messages.messages);
    const typingUsers = useSelector((state) => state.messages.typingUsers);
    const socket = getSocket();

    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedMsg, setSelectedMsg] = useState(null);

    const userInfo = JSON.parse(localStorage.getItem("user"));
    const messagesEndRef = useRef(null);

    const isTyping =
        !!selectedChat?._id &&
        !!userInfo?._id &&
        !!typingUsers[selectedChat._id] &&
        Object.keys(typingUsers[selectedChat._id]).some(
            (userId) => userId !== String(userInfo._id)
        );

    // mark messages as read for current user
    useEffect(() => {
        const markSeen = async () => {
            if (!messages.length || !userInfo?._id) return;

            const unreadMessages = messages
                .filter(
                    (m) =>
                        (m.receiver === userInfo._id ||
                            (typeof m.receiver === "object" &&
                                m.receiver._id === userInfo._id)) &&
                        m.messageStatus !== "read"
                )
                .map((m) => m._id);

            if (!unreadMessages.length) return;

            try {
                await markMessagesAsRead(unreadMessages);
            } catch (e) {
                console.error("Error marking messages as read:", e);
            }
        };

        markSeen();
    }, [messages, userInfo]);

    // fetch messages when chat changes
    useEffect(() => {
        const fetchMessages = async () => {
            if (!selectedChat?._id) return;
            try {
                const data = await getMessages(selectedChat._id);
                dispatch(setMessages(data.data));
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };

        if (selectedChat) {
            fetchMessages();
        }
    }, [selectedChat, dispatch]);

    // auto scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const getDateLabel = (date) => {
        const messageDate = new Date(date);
        const today = new Date();
        const yesterday = new Date();

        yesterday.setDate(today.getDate() - 1);

        const isToday =
            messageDate.toDateString() === today.toDateString();

        const isYesterday =
            messageDate.toDateString() === yesterday.toDateString();

        if (isToday) return "Today";
        if (isYesterday) return "Yesterday";

        const diffInDays =
            (today - messageDate) / (1000 * 60 * 60 * 24);

        if (diffInDays < 7) {
            return messageDate.toLocaleDateString(undefined, {
                weekday: "long",
            });
        }

        return messageDate.toLocaleDateString();
    };

    return (
        <>
            <Box
                sx={{
                    flex: 1,
                    overflowY: "auto",
                    px: 2,
                    py: 2,
                    pb: 12,
                    backgroundImage: `url(${bg})`,
                    backgroundRepeat: "repeat",
                }}
            >
                {messages.map((msg, index) => {
                    const currentDate = new Date(msg.createdAt).toDateString();
                    const previousDate =
                        index > 0
                            ? new Date(
                                messages[index - 1].createdAt
                            ).toDateString()
                            : null;

                    const shouldShowDate = currentDate !== previousDate;

                    const senderId =
                        typeof msg.sender === "object"
                            ? msg.sender._id
                            : msg.sender;

                    const currentUserId = userInfo?._id;

                    const isMyMessage =
                        String(senderId) === String(currentUserId);

                    const time = new Date(msg.createdAt).toLocaleTimeString(
                        [],
                        {
                            hour: "2-digit",
                            minute: "2-digit",
                        }
                    );

                    return (
                        <Box
                            key={msg._id}
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: isMyMessage
                                    ? "flex-end"
                                    : "flex-start",
                                mb: 1,
                            }}
                        >
                            {shouldShowDate && (
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "center",
                                        my: 2,
                                        width: "100%",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            px: 2,
                                            py: 0.5,
                                            bgcolor: "#e1f3fb",
                                            borderRadius: "20px",
                                            fontSize: "12px",
                                            color: "#555",
                                        }}
                                    >
                                        {getDateLabel(msg.createdAt)}
                                    </Box>
                                </Box>
                            )}

                            <Box
                                sx={{
                                    position: "relative",
                                    maxWidth: "65%",
                                    pr: 3,
                                    pl: 2,
                                    pt:
                                        selectedChat?.isGroupChat &&
                                            !isMyMessage
                                            ? 2
                                            : 1.2,
                                    pb: 2,
                                    borderRadius: 3,
                                    borderTopRightRadius: isMyMessage ? 0 : 12,
                                    borderTopLeftRadius: isMyMessage ? 12 : 0,
                                    bgcolor: isMyMessage
                                        ? "#dcf8c6"
                                        : "#ffffff",
                                    boxShadow:
                                        "0 1px 0.5px rgba(0,0,0,0.13)",
                                    wordBreak: "break-word",
                                }}
                            >
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        setAnchorEl(e.currentTarget);
                                        setSelectedMsg(msg);
                                    }}
                                    sx={{
                                        position: "absolute",
                                        top: 2,
                                        right: 2,
                                    }}
                                >
                                    ⋮
                                </IconButton>

                                <Menu
                                    anchorEl={anchorEl}
                                    open={Boolean(anchorEl)}
                                    onClose={() => setAnchorEl(null)}
                                >
                                    <MenuItem onClick={() => {
                                        navigator.clipboard.writeText(selectedMsg?.content || "");
                                        setAnchorEl(null);
                                    }}>
                                        Copy
                                    </MenuItem>


                                    {selectedMsg &&
                                        (typeof selectedMsg.sender === "object"
                                            ? selectedMsg.sender._id
                                            : selectedMsg.sender) === userInfo?._id && (
                                            <MenuItem
                                                onClick={async () => {
                                                    try {
                                                        await deleteMessage({ messageId: selectedMsg._id });

                                                        // emit socket event
                                                        socket.emit("message_delete", {
                                                            messageId: selectedMsg._id,
                                                            conversationId: selectedChat._id
                                                        });

                                                        setAnchorEl(null);
                                                    } catch (err) {
                                                        console.log(err);
                                                    }
                                                }}
                                            >
                                                Delete
                                            </MenuItem>
                                        )}
                                </Menu>
                                {selectedChat?.isGroupChat && !isMyMessage && (
                                    <Typography
                                        sx={{
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            color: "#1976d2",
                                            mb: 0.5,
                                        }}
                                    >
                                        {typeof msg.sender === "object"
                                            ? msg.sender.username
                                            : selectedChat.participants.find(
                                                (p) => p._id === msg.sender
                                            )?.username}
                                    </Typography>
                                )}

                                <Box sx={{ fontSize: "14px", pr: 5 }}>
                                    {msg.contentType === "text" && (
                                        <Typography sx={{ fontSize: "14px", pr: 5 }}>
                                            {msg.content}
                                        </Typography>
                                    )}

                                    {msg.contentType === "image" && (
                                        <img
                                            src={msg.imageOrVideoUrl}
                                            alt="img"
                                            style={{
                                                maxWidth: "200px",
                                                borderRadius: "10px"
                                            }}
                                        />
                                    )}

                                    {msg.contentType === "video" && (
                                        <video
                                            src={msg.imageOrVideoUrl}
                                            controls
                                            style={{
                                                maxWidth: "200px",
                                                borderRadius: "10px"
                                            }}
                                        />
                                    )}
                                </Box>

                                <Box
                                    sx={{
                                        position: "absolute",
                                        bottom: 4,
                                        right: 8,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.5,
                                    }}
                                >
                                    <Typography sx={{ fontSize: "11px" }}>
                                        {time}
                                    </Typography>

                                    {isMyMessage && (
                                        <Typography
                                            sx={{
                                                fontSize: "11px",
                                                color:
                                                    msg.messageStatus ===
                                                        "read"
                                                        ? "#4fc3f7"
                                                        : "gray",
                                            }}
                                        >
                                            ✓✓
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    );
                })}
                {isTyping && (
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "flex-start",
                            mb: 1,
                        }}
                    >
                        <Box
                            sx={{
                                bgcolor: "#ffffff",
                                px: 2,
                                py: 1.2,
                                borderRadius: 3,
                                maxWidth: "100%",
                                boxShadow: "0 1px 0.5px rgba(0,0,0,0.13)",
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    width: "100%",
                                }}
                            >
                                <Lottie
                                    animationData={typingAnimation}
                                    loop
                                    autoplay
                                    style={{ height: 24, width: 50 }}
                                />
                            </Box>
                        </Box>
                    </Box>
                )}

                <div ref={messagesEndRef} />
            </Box>
        </>
    );
};

export default ChatWindowChat;

