const { GoogleGenAI } = require("@google/genai");

if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY not found in environment");
    throw new Error("Missing GEMINI_API_KEY");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const getFinancialSuggestion = async (userData) => {
    try {
        console.log("generating financial suggestion...");

        const { totalExpenses, totalIncome, expensesByCategory, recentTransactions, topCategories } = userData;
        const savings = Math.max(0, (totalIncome || 0) - (totalExpenses || 0));
        const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;
        
        // Calculate average spending per day
        const daysInMonth = 30; // Standard month for calculation
        const dailySpending = totalExpenses / daysInMonth;
        
        // Build prompt with enhanced financial data
        const prompt = `You are a friendly and helpful personal finance advisor. Analyze the following financial data and provide a personalized, actionable suggestion to help improve financial health. 

Financial Snapshot:
- Monthly Income: ₹${totalIncome || 0}
- Monthly Expenses: ₹${totalExpenses || 0}
- Monthly Savings: ₹${savings} (${savingsRate}% of income)
- Daily Average Spending: ₹${dailySpending.toFixed(2)}

Top Spending Categories:
${topCategories && topCategories.length > 0 
    ? topCategories.map((cat, index) => 
        `${index + 1}. ${cat.category}: ₹${cat.total} (${cat.percentage}% of expenses)`
      ).join('\n')
    : '- No category data available'}

Recent Transactions:
${recentTransactions && recentTransactions.length > 0 
    ? recentTransactions.slice(0, 5).map(tx => 
        `- ${tx.type === 'expense' ? '🛒' : '💰'} ${tx.category || 'Uncategorized'}: ₹${tx.amount} (${new Date(tx.date).toLocaleDateString()})`
      ).join('\n')
    : '- No recent transactions'}

Please provide a personalized financial suggestion that:
1. Acknowledges their current financial position
2. Highlights one key area for improvement
3. Provides a specific, actionable tip
4. Is encouraging and positive
5. Is 2-3 sentences maximum

Focus on their top spending categories and suggest practical ways to optimize those expenses while maintaining quality of life.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });
        
        const suggestion = response.text;
        
        if (!suggestion || suggestion.trim().length === 0) {
            throw new Error("got empty response from gemini");
        }

        return suggestion.trim();

    } catch (error) {
        if (error.status) console.error("status:", error.status);
        throw new Error(`failed to generate suggestion: ${error.message}`);
    }
};

const getChatbotResponse = async (userMessage, userData, conversationHistory = []) => {
    try {
        console.log("generating chatbot response...");

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

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contextPrompt
        });
        
        const botReply = response.text;
        
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