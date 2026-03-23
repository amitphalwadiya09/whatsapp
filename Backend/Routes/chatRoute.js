import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { deleteMessage, getConversation, getMessages, markAsRead, sendMessage } from "../Controller/chatController.js";
import { multerMiddleware } from "../Config/cloudinaryconfig.js";
import protect from "../middleware/Protect.js";

const chatRouter = express.Router();

chatRouter.post('/send-message', protect, multerMiddleware, sendMessage)
chatRouter.get('/conversations', protect, getConversation)
chatRouter.get('/conversations/:conversationId/messages', protect, getMessages)

chatRouter.put('/messages/read', protect, markAsRead);
chatRouter.delete('/messages/:messageId', protect, deleteMessage)



export default chatRouter;