import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from "react-redux";
import ChatHeader from './ChatHeader'
import SearchUser from './SearchUser'
import { getAllUsers } from '../../services/userService'
import { getUserConversations } from '../../services/conversation.service';
import { setChats, selectChat, setCurrentUserId } from "../../Slices/chatSlice";
import { setInitialOnlineUsers } from "../../Slices/userSlice";
import { Box, Typography, Avatar } from "@mui/material";


const ChatList = () => {
    const [allUsers, setAllUsers] = useState([]);
    const dispatch = useDispatch();
    const { chats } = useSelector((state) => state.chats);
    const currentUser = JSON.parse(localStorage.getItem("user"));

    useEffect(() => {
        if (currentUser?._id) {
            dispatch(setCurrentUserId(currentUser._id));
        }
    }, [dispatch, currentUser?._id]);

    useEffect(() => {
        const fetchAllUsers = async () => {
            try {
                const result = await getAllUsers();
                if (result.status === "success") {
                    setAllUsers(result.data);
                    const onlineIds = result.data
                        .filter(u => u.isOnline)
                        .map(u => String(u._id));
                    dispatch(setInitialOnlineUsers(onlineIds));
                }
            } catch (error) {
                console.log(error);
            }
        };

        fetchAllUsers();
    }, []);

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const conversation = await getUserConversations();
                if (conversation.status === "success") {
                    dispatch(setChats(conversation.data));
                }
            } catch (error) {
                console.log(error);
            }
        };

        fetchConversations();
    }, [dispatch]);

    const handleOpenChat = async (chat) => {
        dispatch(selectChat(chat));
    };

    const truncateText = (text, limit = 15) => {
        if (!text) return "";
        if (text.length <= limit) return text;

        return text.substring(0, text.lastIndexOf(" ", limit)) + "...";
    };
    const formatTime = (date) => {
        if (!date) return "";

        const messageDate = new Date(date);
        const now = new Date();

        const isToday =
            messageDate.toDateString() === now.toDateString();

        if (isToday) {
            return messageDate.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            });
        }

        return messageDate.toLocaleDateString();
    };
    return (
        <>
            <Box>
                <Box>
                    <ChatHeader></ChatHeader>
                    <SearchUser allUsers={allUsers} setAllUsers={setAllUsers} />
                </Box>

                <Box sx={{ bgcolor: "#fff", overflowY: "auto" }}>
                    {chats?.map((chat) => {
                        const isGroup = chat.isGroupChat;
                        // console.log(chat.lastMessage)

                        const otherUser = chat?.participants?.find(
                            (p) => p && p._id !== currentUser?._id
                        );
                        // console.log(otherUser)

                        const displayName = isGroup
                            ? chat.chatName
                            : otherUser?.username;

                        const avatarLetter = isGroup
                            ? chat.chatName?.charAt(0)
                            : otherUser?.username?.charAt(0);

                        return (
                            <Box
                                key={chat._id}
                                onClick={() => handleOpenChat(chat)}
                                sx={{
                                    display: "flex",
                                    px: 1,
                                    py: 1,
                                    cursor: "pointer",
                                    borderBottom: "1px solid #f0f0f0",
                                    "&:hover": { bgcolor: "#f5f5f5" },
                                }}
                            >
                                <Box sx={{ px: 2 }}>
                                    <Avatar
                                        sx={{
                                            bgcolor: isGroup ? "#1976d2" : "#25D366",
                                            width: 50,
                                            height: 50,
                                            fontSize: "18px",
                                        }}
                                        src={isGroup ? chat.groupPic : otherUser?.profilePicture}

                                    >
                                        {avatarLetter}
                                    </Avatar>
                                </Box>

                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontWeight: 500 }}>
                                        {displayName}
                                    </Typography>

                                    <Typography
                                        variant="body2"
                                        noWrap
                                        sx={{ fontSize: "12px", color: "gray", display: "flex", alignItems: "center", gap: 0.5 }}
                                    >
                                        {chat.lastMessage?.contentType === "text" && (
                                            truncateText(chat.lastMessage?.content || "")
                                        )}

                                        {chat.lastMessage?.contentType === "image" && (
                                            <>
                                                📷 Photo
                                            </>
                                        )}

                                        {chat.lastMessage?.contentType === "video" && (
                                            <>
                                                🎥 Video
                                            </>
                                        )}

                                        {chat.lastMessage?.contentType === "audio" && (
                                            <>
                                                🎵 Audio
                                            </>
                                        )}

                                        {chat.lastMessage?.contentType === "file" && (
                                            <>
                                                📄 Document
                                            </>
                                        )}
                                    </Typography>
                                </Box>
                                <Box sx={{

                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "flex-end",
                                    justifyContent: "space-between",
                                    height: "100%",
                                }}>

                                    <Typography sx={{
                                        fontSize: "11px",
                                        color: "gray",
                                        lineHeight: 1,
                                    }}>
                                        {formatTime(chat.lastMessage?.createdAt || "")}
                                    </Typography>

                                    {chat.unreadCount > 0 && chat.lastMessage?.sender?._id !== currentUser?._id && (
                                        <Box
                                            sx={{
                                                mt: 1,
                                                minWidth: 20,
                                                height: 20,
                                                px: 1,
                                                bgcolor: "#25D366",
                                                color: "#fff",
                                                borderRadius: "999px",
                                                fontSize: "11px",
                                                fontWeight: 500,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            {chat.unreadCount}
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        );
                    })}
                    {/* {showDetails && (
                        <CreateGroup onClose={() => setShowDetails(false)} />
                    )} */}

                </Box>

            </Box>
        </>
    )
}

export default ChatList