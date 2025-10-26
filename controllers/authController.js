const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { deleteImageFromS3 } = require("../utils/s3Utils");

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });
}

exports.registerUser = async (req, res) => {
    
    const { fullName, email, password, profileImageUrl } = req.body;

    if(!req.body){
        return res.status(400).json({ message: "Request Body is empty" });
    }

    if(!fullName || !email || !password){
        return res.status(400).json({ message: "All fields are required" });
    }

    try {   
        const existingUser = await User.findOne({ email });
        if(existingUser){
            return res.status(400).json({ message: "Email already exists" });
        }
        const user = await User.create({ fullName, email, password, profileImageUrl });

        res.status(201).json({id: user._id, user, token: generateToken(user._id) });
    } catch (error) {
        res.status(500).json({ message: "Error registering user", error: error.message });
    }
    
}

exports.loginUser = async (req, res) => {
   const { email, password } = req.body;

   if(!req.body){
    return res.status(400).json({ message: "Request Body is empty" });
   }

   if(!email || !password){
    return res.status(400).json({ message: "All fields are required" });
   }

   try {
    const user = await User.findOne({ email });
    if(!user || !(await user.comparePassword(password))){
        return res.status(400).json({ message: "Invalid email or password" });
    }

    res.status(200).json({id: user._id, user, token: generateToken(user._id) });
   } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
   }
}

exports.getUserInfo = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if(!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: "Error fetching user info", error: error.message });
    }
}

exports.updateUserInfo = async (req, res) => {
    const { fullName, profileImageUrl, password, email } = req.body;

    try {
        const user = await User.findById(req.user.id);
        if(!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update fields if provided
        if(fullName) user.fullName = fullName;
        if(profileImageUrl) {
            // Delete old image from S3 if exists
            if(user.profileImageUrl) {
                await deleteImageFromS3(user.profileImageUrl);
            }
            user.profileImageUrl = profileImageUrl;
        }
        if(email) {
            // Check if email is already taken by another user
            const existingUser = await User.findOne({ email });
            if(existingUser && existingUser._id.toString() !== req.user.id) {
                return res.status(400).json({ message: "Email already in use" });
            }
            user.email = email;
        }
        if(password) {
            user.password = password; // Will be hashed by pre-save middleware
        }

        await user.save();

        res.status(200).json({ 
            message: "User info updated successfully",
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                profileImageUrl: user.profileImageUrl
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Error updating user info", error: error.message });
    }
}