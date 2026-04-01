import React, { useState, useCallback, useRef, useEffect } from "react";
import {
    Box,
    IconButton,
    TextField,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { useDispatch, useSelector } from "react-redux";
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import { getSocket } from "../../services/chat.service";
import EmojiPicker from "emoji-picker-react";
import { useTheme, useMediaQuery } from "@mui/material";
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { addStatusReaction } from "../../services/status.service";
import { sendMessage } from "../../services/message.service";

const StatusReaction = ({ status, onTypingChange, onBack, onStatusUpdate }) => {
    const [showEmoji, setShowEmoji] = useState(false);
    const selectedChat = useSelector((state) => state.chats.selectedChat);
    const [newMessage, setNewMessage] = useState("");
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const [likestatus, setLikeStatus] = useState(false);

    const currentUser = JSON.parse(localStorage.getItem("user"));

    useEffect(() => {
        const myReaction = status?.statusReactions?.find(
            (r) => String(r.user?._id || r.user) === String(currentUser?._id)
        );
        setLikeStatus(!!myReaction?.like);
    }, [status, currentUser?._id]);
    const socket = getSocket();
    // console.log("StatusReaction rendered with statusId:", status);

    const handleSend = async () => {
        if (!newMessage.trim() || !currentUser?._id) return;

        const receiverId = status?.user?._id;
        if (!receiverId || receiverId === currentUser._id) {
            return;
        }

        const messageData = {
            senderId: currentUser._id,
            receiverId,
            content: newMessage,
            contentType: "statusReaction"
        };

        try {
            // 1) send chat message flagged as status reaction
            const res = await sendMessage(messageData);
            if (res.status === "success") {
                // console.log("Status reaction message sent via chat:", res.data);
            } else {
                console.error("Failed to send status chat message:", res.error);
            }

            // 2) mark in status reactions table
            const statusRes = await addStatusReaction({
                statusId: status._id,
                message: newMessage,
                emoji: "",
                like: false
            });

            if (statusRes.status === "success") {
                // console.log("Status reaction registered:", statusRes.data);
                if (typeof onStatusUpdate === "function") {
                    onStatusUpdate(statusRes.data);
                }
            }

            setNewMessage("");
            setShowEmoji(false);

        } catch (error) {
            console.error("Failed to send status reaction:", error);
        }
    };

    const handleLike = async () => {
        const nextLikeStatus = !likestatus;
        setLikeStatus(nextLikeStatus);

        const emoji = nextLikeStatus ? "❤️" : "";

        try {
            const statusRes = await addStatusReaction({
                statusId: status._id,
                like: nextLikeStatus,
                emoji,
                message: ""
            });

            if (statusRes?.status === "success" && typeof onStatusUpdate === "function") {
                onStatusUpdate(statusRes.data);
            }

            if (status?.user?._id && status.user._id !== currentUser._id) {
                const receiverId = status.user._id;
                const messageData = {
                    senderId: currentUser._id,
                    receiverId,
                    content: nextLikeStatus ? "❤️" : "",
                    contentType: "statusReaction"
                };
                await sendMessage(messageData);
            }

            setNewMessage("");

        } catch (err) {
            console.error("Failed to add reaction:", err);
        }
    };

    const handleEmojiClick = (e) => {
        setNewMessage(newMessage + e.emoji);
    }

    const emojiRef = useRef(null);

    const handleInputFocus = () => {
        if (onTypingChange) {
            onTypingChange(true);
        }
    };

    const handleInputBlur = () => {
        if (onTypingChange) {
            onTypingChange(false);
        }
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (
                emojiRef.current &&
                !emojiRef.current.contains(event.target)
            ) {
                setShowEmoji(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);


    return (
        <>
            <Box ref={emojiRef} sx={{ position: "absolute", bottom: 80, left: isMobile ? "55%" : "70%", width: "100vw", transform: "translateX(-50%)", zIndex: 10 }}>
                {showEmoji ? (<EmojiPicker onEmojiClick={handleEmojiClick}></EmojiPicker>) : null}</Box>

            <Box sx={{ display: "flex", flexDirection: "row", width: "100%" }}>
                {/*Typing Area*/}
                <Box
                    sx={{
                        position: "absolute",
                        bottom: 15,
                        left: "45%",
                        transform: "translateX(-50%)",
                        width: "85%",
                        display: "flex",
                        alignItems: "center",
                        py: .5,
                        backgroundColor: "rgba(255,255,255,0.95)",
                        backdropFilter: "blur(6px)",
                        borderRadius: "30px",
                        boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
                        zIndex: 10,
                    }}
                >
                    <Box sx={{ display: "flex", flexDirection: "row", gap: .5 }}>
                        <IconButton sx={{ pl: 3, m: 0 }} onClick={() => { if (showEmoji == true) { setShowEmoji(false) } else { setShowEmoji(true) } }}><SentimentSatisfiedIcon></SentimentSatisfiedIcon></IconButton>
                    </Box>

                    <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        placeholder="Replay to status..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        sx={{
                            backgroundColor: "#fff",
                            borderRadius: "20px",
                            "& .MuiOutlinedInput-root": {
                                borderRadius: "20px",
                                padding: "2px 12px",
                            },
                            "& fieldset": { border: "none" },
                        }}
                    />
                    <IconButton
                        onClick={handleSend}
                        sx={{
                            width: 38,
                            height: 38,
                            bgcolor: "#25D366",
                            color: "#fff",
                            borderRadius: "50%",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                            mr: 1,
                            transition: "all 0.2s ease",
                            "&:hover": {
                                bgcolor: "#20bd5a",
                            },
                            "&:active": {
                                transform: "scale(0.9)",
                            },
                        }}
                    >
                        <SendIcon sx={{ fontSize: 18 }} />

                    </IconButton>
                </Box>
                {/* like and unlike button */}
                <Box
                    sx={{
                        position: "absolute",
                        bottom: 5,
                        left: "93%",
                        transform: "translateX(-50%)",
                        width: "10%",
                        display: "flex",
                        alignItems: "center",
                        py: 1,
                        zIndex: 10,
                    }}
                >
                    <IconButton onClick={handleLike}>
                        {likestatus ? (
                            <FavoriteIcon sx={{ color: "red", fontSize: "38px" }} />
                        ) : (
                            <FavoriteBorderIcon sx={{ color: "white", fontSize: "38px" }} />
                        )}
                    </IconButton>

                </Box>
            </Box>
        </>
    )
}

export default StatusReaction