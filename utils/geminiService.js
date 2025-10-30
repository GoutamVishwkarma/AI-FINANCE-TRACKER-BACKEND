const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Get AI-powered financial suggestion based on user's expense data
 * @param {Object} userData - User's financial data
 * @returns {Promise<string>} AI-generated suggestion
 */
const getFinancialSuggestion = async (userData) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Build context from user data
        const { totalExpenses, totalIncome, expensesByCategory, recentExpenses } = userData;
        
        const prompt = `You are a friendly and helpful personal finance advisor. Analyze the following financial data and provide ONE practical, actionable suggestion to help improve spending habits. Keep it short (2-3 sentences), friendly, and specific.

Financial Summary:
- Total Monthly Income: ₹${totalIncome || 0}
- Total Monthly Expenses: ₹${totalExpenses || 0}
- Savings: ₹${(totalIncome || 0) - (totalExpenses || 0)}

Expense Breakdown:
${expensesByCategory && expensesByCategory.length > 0 
    ? expensesByCategory.map(cat => `- ${cat.category}: ₹${cat.total}`).join('\n')
    : '- No expense data available'}

Recent Expenses:
${recentExpenses && recentExpenses.length > 0 
    ? recentExpenses.slice(0, 5).map(exp => `- ${exp.category}: ₹${exp.amount} (${new Date(exp.date).toLocaleDateString()})`).join('\n')
    : '- No recent expenses'}

Provide a personalized tip to help manage money better. Focus on one specific area for improvement.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const suggestion = response.text();
        
        return suggestion.trim();
    } catch (error) {
        console.error("Error generating financial suggestion:", error);
        throw new Error("Failed to generate AI suggestion");
    }
};

/**
 * Handle chatbot conversation about personal finances
 * @param {string} userMessage - User's message
 * @param {Object} userData - User's financial data for context
 * @param {Array} conversationHistory - Previous conversation messages
 * @returns {Promise<string>} AI response
 */
const getChatbotResponse = async (userMessage, userData, conversationHistory = []) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const { totalExpenses, totalIncome, expensesByCategory } = userData;

        // Build context for the chatbot
        let contextPrompt = `You are a friendly personal finance assistant helping users manage their money. Be conversational, helpful, and encouraging.

User's Financial Context:
- Monthly Income: ₹${totalIncome || 0}
- Monthly Expenses: ₹${totalExpenses || 0}
- Current Savings: ₹${(totalIncome || 0) - (totalExpenses || 0)}

Expense Categories:
${expensesByCategory && expensesByCategory.length > 0 
    ? expensesByCategory.map(cat => `- ${cat.category}: ₹${cat.total}`).join('\n')
    : '- No expense data yet'}

Previous conversation:
${conversationHistory.length > 0 
    ? conversationHistory.slice(-4).map(msg => `${msg.role}: ${msg.content}`).join('\n')
    : 'This is the start of the conversation'}

User's question: ${userMessage}

Provide a helpful, friendly response. Keep it concise (3-4 sentences max) and actionable. If the user asks about their finances, use the data provided above.`;

        const result = await model.generateContent(contextPrompt);
        const response = await result.response;
        const botReply = response.text();
        
        return botReply.trim();
    } catch (error) {
        console.error("Error generating chatbot response:", error);
        throw new Error("Failed to generate chatbot response");
    }
};

module.exports = {
    getFinancialSuggestion,
    getChatbotResponse
};
