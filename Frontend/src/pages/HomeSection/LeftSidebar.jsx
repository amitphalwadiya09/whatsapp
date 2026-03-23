import Box from '@mui/material/Box';
import SettingsIcon from '@mui/icons-material/Settings';
import Divider from '@mui/material/Divider';
import PanoramaFishEyeIcon from '@mui/icons-material/PanoramaFishEye';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { Avatar } from "@mui/material";
import LogoutIcon from '@mui/icons-material/Logout';
import { Navigate, useNavigate } from 'react-router-dom';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import Lottie from "lottie-react";
import Chatbot from "../../assets/Chatbot.json";
import { useTheme, useMediaQuery } from "@mui/material";




const LeftSidebar = ({ isMobile }) => {
    const navigate = useNavigate();
    const iconStyle = {
        fontSize: "25px", height: "30px", color: "black"
    }
    const theme = useTheme();


    const userInfo = JSON.parse(localStorage.getItem("user"));
    return (
        <Box
            sx={{
                width: isMobile ? "100%" : 70,
                height: isMobile ? 60 : "100%",
                position: isMobile ? "fixed" : "relative",
                bottom: isMobile ? 0 : "auto",
                bgcolor: "rgb(194, 200, 204)",

                display: "flex",
                alignItems: "center",
                justifyContent: isMobile ? "space-evenly" : "space-between",
                flexDirection: isMobile ? "row" : "column",
                zIndex: 10
            }}
        >
            <Box sx={{ display: "flex", width: "100%", flexDirection: isMobile ? "row" : "column", justifyContent: isMobile ? "space-evenly" : "space-between", gap: 2.5, p: isMobile ? 0 : 2, my: "20px" }}>
                <p onClick={() => {
                    navigate('/home');
                }} style={{ margin: 0 }}><WhatsAppIcon sx={{ ...iconStyle, color: "rgb(30, 170, 97)", }}></WhatsAppIcon ></p>

                <p onClick={() => {
                    navigate('/status');
                }} style={{ margin: 0 }}><PanoramaFishEyeIcon sx={iconStyle}></PanoramaFishEyeIcon></p>

                {!isMobile ? (<Divider sx={{ color: "black" }}></Divider>) : <></>}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                    }}
                    onClick={() => { navigate('/home') }}
                >
                    <Lottie
                        animationData={Chatbot}
                        loop
                        autoplay
                        style={{ height: 24, width: 50 }}
                    />
                </Box>

            </Box>



            <Box sx={{ display: "flex", width: "100%", flexDirection: isMobile ? "row" : "column", justifyContent: isMobile ? "space-evenly" : "space-between", gap: 2.5, p: isMobile ? 0 : 2, my: "20px", alignItems: "center" }}>
                <p onClick={() => { navigate('/setting') }} style={{ margin: 0 }}><SettingsIcon sx={iconStyle}></SettingsIcon></p>
                <Avatar
                    src={userInfo?.profilePicture}
                    sx={{
                        fontSize: "25px", height: "30px",
                        width: "30px",
                        cursor: "pointer"
                    }}
                    onClick={() => navigate('/user-profile')}
                />
                <p onClick={() => {
                    localStorage.removeItem("token");
                    navigate('/')
                }} style={{ margin: 0 }}><LogoutIcon sx={iconStyle}></LogoutIcon></p>
            </Box>

        </Box >

    );
};

export default LeftSidebar;