import React, { useState, useEffect } from "react";
import TextField from "@mui/material/TextField";
import SearchIcon from "@mui/icons-material/Search";
import Autocomplete from "@mui/material/Autocomplete";
import { useDispatch, useSelector } from "react-redux";
import { setChats, selectChat } from "../../Slices/chatSlice";
import { addOrUpdateChat } from "../../Slices/chatSlice";
import { Avatar, Typography, Divider, Box } from "@mui/material";
import { createConversation } from "../../services/conversation.service";

const SearchUser = ({ allUsers, setAllUsers }) => {

    const dispatch = useDispatch();
    const chats = useSelector((state) => state.chats.chats);

    const [searchText, setSearchText] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    const currentUser = JSON.parse(localStorage.getItem("user"));


    useEffect(() => {
        if (!searchText) {
            const filtered = allUsers.filter(
                (user) => user._id !== currentUser?._id
            );
            setSearchResults(filtered);
        }
    }, [allUsers]);


    const handleSearch = (value) => {

        setSearchText(value);

        if (!value) {
            const filtered = allUsers.filter(
                (user) => user._id !== currentUser?._id
            );
            setSearchResults(filtered);
            return;
        }

        const filtered = allUsers.filter((user) =>
            user.username
                ?.toLowerCase()
                .includes(value.toLowerCase())
        );

        setSearchResults(filtered);
    };


    // CREATE CONVERSATION
    const handleCreateConversation = async (userId) => {

        try {

            const result = await createConversation(userId);

            const chat = result.data;

            const exists = chats.find((c) => c._id === chat._id);

            if (!exists) {
                dispatch(addOrUpdateChat(chat));
            }

            socket.emit("join chat", chat._id);
            // dispatch(addOrUpdateChat(chat));
            dispatch(selectChat(chat));

            setSearchText("");

        } catch (error) {
            console.log(error);
        }
    };


    return (
        <Box sx={{ display: "flex", alignItems: "center", p: 1 }}>

            <SearchIcon sx={{ color: "#667781", fontSize: 20, mr: 1.5 }} />

            <Autocomplete
                freeSolo
                options={searchResults}
                inputValue={searchText}
                sx={{ flex: 1 }}
                getOptionLabel={(option) =>
                    typeof option === "string"
                        ? option
                        : option?.username || ""
                }

                onInputChange={(event, newValue) => {
                    handleSearch(newValue);
                }}

                onChange={(event, value) => {
                    if (value && value._id) {
                        handleCreateConversation(value._id);
                    }
                }}

                renderOption={(props, option) => (
                    <Box component="li" {...props} sx={{ p: 0 }}>
                        <Box sx={{
                            display: "flex",
                            alignItems: "center",
                            width: "100%",
                            px: 1.5,
                            py: 1
                        }}>

                            <Box sx={{ position: "relative" }}>
                                <Avatar src={option.profilePicture} />
                                {option.isOnline && (
                                    <Box sx={{
                                        position: "absolute",
                                        bottom: 0,
                                        right: 0,
                                        width: 10,
                                        height: 10,
                                        bgcolor: "#25D366",
                                        borderRadius: "50%",
                                        border: "2px solid white"
                                    }} />
                                )}
                            </Box>

                            <Box sx={{ flex: 1, ml: 4 }}>
                                <Typography sx={{ fontWeight: 500 }}>
                                    {option.username}
                                </Typography>

                                <Typography
                                    variant="body2"
                                    sx={{ color: "gray", fontSize: "12px" }}
                                >
                                    About:  {option.about || "Hey there! I'm using WhatsApp"}
                                </Typography>
                            </Box>
                        </Box>

                        {/* 🔹 Divider */}
                        <Divider sx={{ ml: 7 }} />
                    </Box>
                )}

                renderInput={(params) => (
                    <TextField
                        {...params}
                        placeholder="Search or start new chat"
                        variant="standard"
                        fullWidth
                        InputProps={{
                            ...params.InputProps,
                            disableUnderline: true,
                        }}
                        sx={{
                            "& input": {
                                padding: 0,
                                fontSize: 14,
                            },
                        }}
                    />
                )}
            />

        </Box>
    );
};

export default SearchUser;