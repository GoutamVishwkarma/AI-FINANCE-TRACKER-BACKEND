const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY not found in environment");
    throw new Error("Missing GEMINI_API_KEY");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getFinancialSuggestion = async (userData) => {
    try {
        console.log("generating financial suggestion...");

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const { totalExpenses, totalIncome, expensesByCategory, recentExpenses } = userData;
        
        // build prompt with user's financial data
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

        console.log("calling gemini api...");
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const suggestion = response.text();
        
        if (!suggestion || suggestion.trim().length === 0) {
            throw new Error("got empty response from gemini");
        }

        console.log("suggestion generated");
        return suggestion.trim();

    } catch (error) {
        console.error("error in getFinancialSuggestion:", error.message);
        if (error.status) console.error("status:", error.status);
        throw new Error(`failed to generate suggestion: ${error.message}`);
    }
};

const getChatbotResponse = async (userMessage, userData, conversationHistory = []) => {
    try {
        console.log("generating chatbot response...");

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const { totalExpenses, totalIncome, expensesByCategory } = userData;

        // build context with user's financial info
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
        
        if (!botReply || botReply.trim().length === 0) {
            throw new Error("empty response from chatbot");
        }

        console.log("chatbot response ready");
        return botReply.trim();

    } catch (error) {
        console.error("error in getChatbotResponse:", error.message);
        throw new Error(`chatbot failed: ${error.message}`);
    }
};

module.exports = {
    getFinancialSuggestion,
    getChatbotResponse
};