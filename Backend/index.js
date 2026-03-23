import express from "express";
import cors from "cors";
import dotenv from "dotenv"
import cookieParser from "cookie-parser";
import connectDB from "./Config/DBConfig.js";
import bodyParser from "body-parser";
import authRouter from "./Routes/authRoute.js";
import chatRouter from "./Routes/chatRoute.js";
import http from "http";
import initializeSocket from "./Service/socketService.js";
import statusRouter from "./Routes/statusRoute.js";
import conversationRouter from "./Routes/conversationRoute.js";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import path from "path";

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();




const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))

app.use(express.static(join(__dirname, "../Frontend/build")));

app.get(/.*/, (req, res) => {
    res.sendFile(join(__dirname, "../Frontend/build/index.html"));
});
//middleware
app.use(express.json())
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

//database connection
connectDB();

// serve local uploads (images/videos)
app.use("/uploads", express.static("uploads"));

//create server
const server = http.createServer(app);

const io = initializeSocket(server);


//apply socket middleware
app.use((req, res, next) => {
    req.io = io;
    req.socketUserMap = io.socketUserMap
    next();
})

//Routes

app.use('/api/auth', authRouter)
app.use('/api/chat', chatRouter)
app.use('/api/status', statusRouter)
app.use("/api/conversations", conversationRouter);
// app.use('*', (req, res) => {
//     res.redirect('/welcome');
// });


server.listen(PORT, () => {
    console.log("server is running")
})

