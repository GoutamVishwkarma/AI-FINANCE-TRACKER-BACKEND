const express = require("express");

const { registerUser, loginUser, getUserInfo, updateUserInfo } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const router = express.Router();

router.post("/register", upload.single("profileImage"), registerUser);
router.post("/login", loginUser);
router.get("/getUser", protect, getUserInfo);
router.put("/updateUser", protect, upload.single("profileImage"), updateUserInfo);

router.post("/upload-image", upload.single("image"), (req, res) => {
    if(!req.file){
        return res.status(400).json({message: "No file uploaded"});
    }
    const imageUrl = req.file.location; // S3 URL
    res.status(200).json({message: "File uploaded successfully", imageUrl});
})

module.exports = router;
