require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const ImageKit = require("imagekit");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Khởi tạo ImageKit
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// API endpoint để lấy authentication parameters
app.post('/api/auth', (req, res) => {
    try {
        const { userId } = req.body;
        const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const authParams = imagekit.getAuthenticationParameters();
        res.json(authParams);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint để upload ảnh
const multer = require('multer');
const upload = multer(); 
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { originalname: fileName, buffer: fileBuffer } = req.file;
        const { folder = '/' } = req.body;

        const result = await imagekit.upload({
            file: fileBuffer,
            fileName: fileName,
            folder: folder,
            useUniqueFileName: true
        });

        res.json({
            url: result.url,
            fileId: result.fileId,
            width: result.width,
            height: result.height
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: 'Upload failed' });
    }
});


// Thay đổi endpoint delete để hỗ trợ cả JSON và form-urlencoded
app.post('/api/delete', express.json(), express.urlencoded({ extended: true }), async (req, res) => {
    try {
        // Lấy fileId từ cả JSON body và form-data
        
        if (!fileId) {
            return res.status(400).json({ 
                success: false,
                message: "fileId is required" 
            });
        }

        console.log("Deleting file with ID:", fileId);
        await imagekit.deleteFile(fileId);
        
        res.json({ success: true });
    } catch (error) {
        console.error("Deletion error:", error);
        res.status(500).json({ 
            success: false,
            message: error.message || "Failed to delete file"
        });
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});