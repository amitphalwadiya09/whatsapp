import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { createStatus, deleteStatus, getStatus, viewStatus, addStatusReaction } from "../Controller/statusController.js";
import { uploadFileMiddleware } from "../Config/cloudinaryconfig.js";
import protect from "../middleware/Protect.js";


const statusRouter = express.Router();

statusRouter.post('/', protect, uploadFileMiddleware, createStatus)
statusRouter.get('/', protect, getStatus)


statusRouter.put('/:statusId/view', protect, viewStatus);
statusRouter.post('/:statusId/reaction', protect, addStatusReaction);
statusRouter.delete('/:statusId', protect, deleteStatus)



export default statusRouter;