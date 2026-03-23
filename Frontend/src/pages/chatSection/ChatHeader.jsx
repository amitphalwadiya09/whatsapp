import { Box, Typography } from "@mui/material";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import React, { useState } from "react";
import CreateGroup from "../GroupSection/CreateGroup";

const ChatHeader = () => {

    const [showCreateGroup, setShowCreateGroup] = useState(false);

    return (
        <>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    p: 2,
                    bgcolor: "white",
                    justifyContent: "space-between",
                }}
            >
                <Typography
                    sx={{
                        color: "rgb(30, 170, 97)",
                        fontWeight: "700",
                        fontSize: "24px",
                    }}
                >
                    WhatsApp
                </Typography>

                <Box>
                    <ChatBubbleOutlineIcon sx={{ mx: 2 }} />

                    <AddCircleIcon
                        sx={{ cursor: "pointer", color: "rgb(30, 170, 97)", }}
                        onClick={() => setShowCreateGroup(true)}
                    />
                </Box>
            </Box>

            {showCreateGroup && (
                <CreateGroup
                    onClose={() => setShowCreateGroup(false)}
                />
            )}
        </>
    );
};

export default ChatHeader;