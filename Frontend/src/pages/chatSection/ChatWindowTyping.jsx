import React, { useState } from "react";
import {
    Box,
    IconButton,
    TextField,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { useDispatch, useSelector } from "react-redux";
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import AddIcon from '@mui/icons-material/Add';
import MicIcon from '@mui/icons-material/Mic';
import ShowFolder from "./ShowFolder";
import { getSocket } from "../../services/chat.service";


const ChatWindowTyping = () => {
    const dispatch = useDispatch();
    const [showFolder, setShowFolder] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    const selectedChat = useSelector((state) => state.chats.selectedChat);
    const [newMessage, setNewMessage] = useState("");

    const currentUser = JSON.parse(localStorage.getItem("user"));
    const socket = getSocket();

    const typingHandler = (e) => {
        setNewMessage(e.target.value);

        if (!selectedChat?._id || !currentUser?._id) return;

        const receiver = selectedChat.participants
            ? selectedChat.participants.find(
                (p) => String(p._id) !== String(currentUser._id)
            )
            : null;

        if (!receiver?._id) return;

        socket.emit("typing_status", {
            conversationId: selectedChat._id,
            receiverId: receiver._id,
        });
    };

    const handleSend = async () => {

        if (!newMessage.trim() || !selectedChat || !currentUser?._id) return;

        const receiver = selectedChat.participants.find(
            (p) => String(p._id) !== String(currentUser._id)
        );

        if (!receiver?._id) return;

        const messageData = {
            sender: currentUser._id,
            receiver: receiver._id,
            conversation: selectedChat._id,
            content: newMessage,
            contentType: "text"
        };

        socket.emit("send_message", messageData);

        setNewMessage("");
    };

    const handleAudio = async () => {

    }
    return (
        <>
            {/*show file folder*/}

            {showFolder && (
                <ShowFolder onClose={() => setShowFolder(false)} setShowFolder={setShowFolder} />
            )}

            {/*Typing Area*/}
            <Box
                sx={{
                    position: "absolute",
                    bottom: 10,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "95%",
                    display: "flex",
                    alignItems: "center",
                    py: 1,
                    backgroundColor: "rgba(255,255,255,0.95)",
                    backdropFilter: "blur(6px)",
                    borderRadius: "30px",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
                    zIndex: 10,
                }}
            >
                <Box sx={{ display: "flex", flexDirection: "row", gap: .5 }}>
                    <IconButton sx={{ p: 0.1, ml: 1 }} onClick={() => { if (showFolder == true) { setShowFolder(false) } else { setShowFolder(true) } }}>  <AddIcon sx={{ ml: 1 }}></AddIcon></IconButton>

                    <IconButton sx={{ p: 0.1, m: 0 }} onClick={() => { if (showEmoji == true) { setShowEmoji(false) } else { setShowEmoji(true) } }}><SentimentSatisfiedIcon></SentimentSatisfiedIcon></IconButton>

                </Box>

                <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    placeholder="Type a message"
                    value={newMessage}
                    onChange={typingHandler}
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
                            padding: "6px 12px",
                        },
                        "& fieldset": { border: "none" },
                    }}
                />
                <IconButton
                    onClick={!newMessage ? handleAudio : handleSend}
                    sx={{
                        width: 45,
                        height: 45,
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
                            transform: "scale(0.9)", // 🔥 press effect
                        },
                    }}
                >
                    {!newMessage ? (
                        <MicIcon sx={{ fontSize: 24 }} />
                    ) : (
                        <SendIcon sx={{ fontSize: 22 }} />
                    )}
                </IconButton>
            </Box>

        </>
    )
}

export default ChatWindowTyping

