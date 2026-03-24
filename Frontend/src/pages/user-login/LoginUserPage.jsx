import React, { useState } from 'react'
import countries from '../../utils/countriles';
import { Divider } from "@mui/material";
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from "react-redux";
import { loginStart, loginSuccess, loginFailure } from "../../Slices/authSlice";
import Spinner from "../../utils/Spinner";
import { Box, Paper, Typography, TextField, Button, Select, MenuItem, InputAdornment } from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { useNavigate } from "react-router-dom";
import { loginUserApi, registerUserApi } from '../../services/userService';
import OtpInputPage from './OtpInputPage';

const LoginUserPage = () => {
    const [showMpin, setShowMpin] = useState(false);
    const [showEmail, setShowEmail] = useState(true);
    const [showPhoneNumber, setShowPhoneNumber] = useState(true);
    const [isLoginMode, setIsLoginMode] = useState(true);
    const navigate = useNavigate();
    const [loginInfo, setLoginInfo] = useState({
        countryCode: countries[0].dialCode,
        phoneNumber: "",
        email: "",
        mpin: "",
    })
    const [error, setError] = useState({
        email: "",
        phoneNumber: "",
        mpin: ""
    })
    const [userData, setUserData] = useState("");

    const dispatch = useDispatch();
    const { loading } = useSelector((state) => state.auth);

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const phoneRegex = /^[0-9\s]{10,10}$/;

    //handle the change in a state
    const handleChange = (e) => {
        const { name, value } = e.target;

        setLoginInfo((prev) => ({
            ...prev,
            [name]: value
        }));
        if (name === "email") {
            setError((prev) => {
                return {
                    ...prev,
                    email: emailRegex.test(value.trim())
                        ? ""
                        : "Invalid email format",
                };
            });
        }

        if (name === "phoneNumber") {
            setError((prev) => {
                return {
                    ...prev, phoneNumber: phoneRegex.test(value.trim()) ? "" : "Invalid phone number"
                }
            })
        }
    };


    const handleNextClick = async () => {
        if (!loginInfo.email && !loginInfo.phoneNumber) {
            toast.error("Enter email or phone number");
            return;
        }

        if (loginInfo.phoneNumber && !phoneRegex.test(loginInfo.phoneNumber)) {
            toast.error("Enter valid phone number");
            return;
        }

        if (loginInfo.email && loginInfo.phoneNumber) {
            toast.error("Enter only one field");
            return;
        }

        setShowEmail(false);
        setShowPhoneNumber(false);
        setShowMpin(true)
        setUserData(loginInfo.email ? loginInfo.email : `${loginInfo.countryCode}${loginInfo.phoneNumber}`);
    }

    const onMpinSubmit = async (e) => {
        e.preventDefault();
        
        if (loginInfo.mpin.length < 6) {
            toast.error("Enter a 6-digit MPIN");
            return;
        }

        dispatch(loginStart());

        try {
            let response;

            if (isLoginMode) {
                response = await loginUserApi(
                    loginInfo.phoneNumber ? `${loginInfo.countryCode}${loginInfo.phoneNumber}` : null, 
                    loginInfo.email || null, 
                    loginInfo.mpin
                );
            } else {
                response = await registerUserApi(
                    loginInfo.phoneNumber || null,
                    loginInfo.countryCode || null,
                    loginInfo.email || null,
                    loginInfo.mpin
                );
            }
            
            if (response.status === "success") {

                const { token, user } = response.data;

                dispatch(loginSuccess({ user, token }));

                localStorage.setItem("token", token);
                localStorage.setItem("user", JSON.stringify(user));
                
                toast.success(isLoginMode ? "Login successful" : "Account created successfully");

                if (user?.username && user.username.trim() !== "") {
                    navigate("/home");
                } else {
                    navigate("/register");
                }
            }
        } catch (error) {
            dispatch(loginFailure(error.message || error));
            toast.error(error.message || (isLoginMode ? "Login failed. Check your MPIN." : "Registration failed."));
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                bgcolor: "#F0F2F5",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {/* Header */}
            <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <WhatsAppIcon sx={{ color: "#25D366", fontSize: 32 }} />
                <Typography fontWeight={600}>WhatsApp</Typography>
            </Box>

            {/* Center Card */}
            <Box
                sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        width: 420,
                        p: 4,
                        borderRadius: 2,
                        border: "1px solid #E9EDEF",
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            mb: 3
                        }}
                    >
                        <WhatsAppIcon
                            sx={{
                                fontSize: 90,
                                color: "#25D366",
                                mb: 1
                            }}
                        />

                        <Typography
                            sx={{
                                fontSize: 20,
                                fontWeight: 600,
                                color: "#111B21",
                                mb: 0.5
                            }}
                        >
                            WhatsApp
                        </Typography>

                        <Typography
                            sx={{
                                color: "#667781",
                                fontSize: 14
                            }}
                        >
                            {isLoginMode ? "Log in" : "Register"}
                        </Typography>
                    </Box>
                    
                    {/* Phone */}
                    {showPhoneNumber ? (<><TextField
                        fullWidth
                        label="Phone Number"
                        name="phoneNumber"
                        value={loginInfo.phoneNumber}
                        onChange={handleChange}
                        error={!!error.phoneNumber}
                        helperText={error.phoneNumber}

                        sx={{ mb: 1 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Select
                                        value={loginInfo.countryCode}
                                        name="countryCode"
                                        onChange={handleChange}
                                        variant="standard"
                                        disableUnderline
                                        sx={{
                                            minWidth: 90,
                                            fontSize: 14,
                                        }}
                                    >
                                        {countries.map((item) => (
                                            <MenuItem key={item.name} value={item.dialCode}>
                                                {item.flag}{item.dialCode} {item.alpha2}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </InputAdornment>
                            ),
                        }}
                    />
                    </>) : ""}


                    {/* divider in between */}
                    {(showPhoneNumber && showEmail) && (
                        <Divider sx={{ color: "gray", fontSize: 14 }}>
                            <Typography
                                variant="body2"
                                sx={{ color: "text.secondary", fontWeight: 500 }}
                            >
                                Or
                            </Typography>
                        </Divider>
                    )}
                    
                    {showMpin && (
                        <Box
                            sx={{
                                mt: 2,
                                mb: 3,
                                textAlign: "center",
                                px: 2
                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize: 14,
                                    color: "#667781",
                                    lineHeight: 1.5
                                }}
                            >
                                {isLoginMode ? "Enter your 6-digit MPIN for" : "Create a 6-digit MPIN for"}
                            </Typography>

                            <Typography
                                sx={{ fontSize: 15, fontWeight: 500, color: "#111B21", mt: 0.5 }}>
                                {userData}
                            </Typography>
                        </Box>
                    )}


                    {/* email iput field */}

                    {showEmail ? (
                        <TextField
                            fullWidth
                            label="Email"
                            name="email"
                            value={loginInfo.email}
                            onChange={handleChange}
                            error={!!error.email}
                            helperText={error.email}

                            sx={{ my: 1 }} />
                        ) : ""}
                    
                    {/* Password (appears after Next) */}
                    {showMpin && (
                        <OtpInputPage
                            length={6}
                            onChangeOtp={(value) =>
                                setLoginInfo((prev) => ({
                                    ...prev,
                                    mpin: value
                                }))
                            }
                        />
                    )}

                    {!showMpin ? (
                        <Button
                            fullWidth
                            variant="contained"
                            sx={{
                                bgcolor: "#25D366",
                                color: "#000",
                                fontWeight: 600,
                                "&:hover": { bgcolor: "#1EBE5D" },
                                mt: 2
                            }}
                            onClick={handleNextClick}
                        >
                            Next
                        </Button>
                    ) : (<>
                        <Button
                            fullWidth
                            variant="contained"
                            sx={{
                                bgcolor: "#25D366",
                                color: "#000",
                                fontWeight: 600,
                                "&:hover": { bgcolor: "#1EBE5D" },
                                mt: 2
                            }}
                            type='submit'
                            onClick={onMpinSubmit}
                        >
                            {loading ? <Spinner size="small" /> : (isLoginMode ? "Log in" : "Register")}
                        </Button>
                    </>
                    )}

                    {!showMpin && (
                        <Box sx={{ mt: 3, textAlign: "center" }}>
                            <Typography sx={{ fontSize: 14, color: "#667781" }}>
                                {isLoginMode ? "Don't have an account?" : "Already have an account?"}
                                <Button
                                    variant="text"
                                    onClick={() => setIsLoginMode(!isLoginMode)}
                                    sx={{
                                        color: "#25D366",
                                        textTransform: "none",
                                        fontWeight: 600,
                                        ml: 1
                                    }}
                                >
                                    {isLoginMode ? "Register here" : "Log in here"}
                                </Button>
                            </Typography>
                        </Box>
                    )}

                </Paper>
            </Box>

            {/* Footer */}
            <Box sx={{ textAlign: "center", py: 2 }}>
                <Typography sx={{ fontSize: 12, color: "#667781" }}>
                    Your personal messages are end-to-end encrypted
                </Typography>
            </Box>
        </Box>
    )
}

export default LoginUserPage