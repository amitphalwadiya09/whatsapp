import multer from "multer";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
});

// Ensure uploads directory exists for temporary storage
const uploadsDir = path.resolve("uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const safeName = file.originalname.replace(/\s+/g, "_");
        cb(null, `${timestamp}_${safeName}`);
    },
});

export const uploadFileToCloudinary = async (file) => {
    try {
        if (!file || !file.path) {
            throw new Error("No file provided for upload");
        }

        // Determine resource type based on file extension
        const ext = path.extname(file.originalname).toLowerCase();
        let resourceType = "auto";
        
        if ([".mp4", ".avi", ".mov", ".mkv"].includes(ext)) {
            resourceType = "video";
        } else if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)) {
            resourceType = "image";
        }

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(file.path, {
            resource_type: resourceType,
            public_id: `whatsapp-clone/${Date.now()}_${path.parse(file.originalname).name}`,
            folder: "whatsapp-clone",
            use_filename: true,
            unique_filename: true,
        });

        // Delete the temporary file after successful upload
        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }

        return {
            secure_url: result.secure_url,
            public_id: result.public_id,
            resource_type: result.resource_type,
        };
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        
        // Delete the temporary file in case of error
        if (file && file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
        
        throw new Error(`Failed to upload file to Cloudinary: ${error.message}`);
    }
};

export const multerMiddleware = multer({ storage }).single("profilePicture");

export const uploadFileMiddleware = multer({ storage }).single("file");
