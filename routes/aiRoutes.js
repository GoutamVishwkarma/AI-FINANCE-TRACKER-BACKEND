const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getDailySuggestion, chatWithBot } = require("../controllers/aiController");

/**
 * @route   GET /api/v1/ai/suggestion
 * @desc    Get AI-powered daily financial suggestion
 * @access  Private
 */
router.get("/suggestion", protect, getDailySuggestion);

/**
 * @route   POST /api/v1/ai/chat
 * @desc    Chat with AI financial assistant
 * @access  Private
 * @body    { message: string, conversationHistory: array (optional) }
 */
router.post("/chat", protect, chatWithBot);

module.exports = router;
