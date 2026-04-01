import mongoose, { Schema } from "mongoose";

const statusSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    contentType: { type: String, enum: ['image', 'video', 'text'], default: 'text' },
    viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    statusReactions: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        like: { type: Boolean, default: false },
        emoji: String,
        message: String
    }],
    expiresAt: { type: Date, required: true },
}, { timestamps: true });

const Status = mongoose.model('Status', statusSchema);
export default Status;