const { getFinancialSuggestion, getChatbotResponse } = require("../utils/geminiService");
const Expense = require("../models/Expense");
const Income = require("../models/Income");
const { Types } = require("mongoose");

const getDailySuggestion = async (req, res) => {
    try {
        const userId = req.user._id;
        const userObjectId = new Types.ObjectId(String(userId));

        // Get current month's data
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const dateFilter = { $gte: startOfMonth, $lte: endOfMonth };

        // Fetch user's financial data for the current month
        const expenses = await Expense.find({
            userId: userObjectId,
            date: dateFilter
        }).sort({ date: -1 });

        // Use aggregation to calculate totals for the current month
        const totalExpensesResult = await Expense.aggregate([
            { $match: { userId: userObjectId, date: dateFilter } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const totalIncomeResult = await Income.aggregate([
            { $match: { userId: userObjectId, date: dateFilter } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const totalExpenses = totalExpensesResult[0]?.total || 0;
        const totalIncome = totalIncomeResult[0]?.total || 0;

        // Group expenses by category
        const expensesByCategory = expenses.reduce((acc, exp) => {
            if (!exp || !exp.category) return acc;
            
            const existing = acc.find(item => item && item.category === exp.category);
            if (existing) {
                existing.total += exp.amount || 0;
            } else {
                acc.push({ 
                    category: exp.category, 
                    total: exp.amount || 0 
                });
            }
            return acc;
        }, []);

        // Sort categories by spending (highest first)
        expensesByCategory.sort((a, b) => (b?.total || 0) - (a?.total || 0));

        // Prepare recent expenses data
        const recentExpenses = expenses.slice(0, 10).map(exp => ({
            category: exp.category || 'Uncategorized',
            amount: exp.amount || 0,
            date: exp.date || new Date()
        }));

        console.log('Sending data to Gemini service:', {
            totalExpenses,
            totalIncome,
            expensesByCategory: expensesByCategory.slice(0, 3), // Log first 3 categories
            recentExpenses: recentExpenses.slice(0, 2) // Log first 2 recent expenses
        });

        // Prepare data for AI
        const userData = {
            totalExpenses,
            totalIncome,
            expensesByCategory,
            recentExpenses
        };

        // Generate AI suggestion
        const suggestion = await getFinancialSuggestion(userData);

        res.status(200).json({
            success: true,
            suggestion,
            financialSummary: {
                totalIncome,
                totalExpenses,
                savings: totalIncome - totalExpenses,
                topCategories: expensesByCategory.slice(0, 3)
            }
        });
    } catch (error) {
        console.error("Error in getDailySuggestion:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate suggestion",
            error: error.message
        });
    }
};

/**
 * Handle chatbot conversation
 * Accepts user message and returns AI response with financial context
 */
const chatWithBot = async (req, res) => {
    try {
        const userId = req.user._id;
        const { message, conversationHistory } = req.body;

        // Validate input
        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Message is required"
            });
        }

        // Get current month's financial data for context
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const expenses = await Expense.find({
            userId,
            date: { $gte: startOfMonth, $lte: endOfMonth }
        });

        const incomes = await Income.find({
            userId,
            date: { $gte: startOfMonth, $lte: endOfMonth }
        });

        // Calculate financial summary
        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);

        const expensesByCategory = expenses.reduce((acc, exp) => {
            const existing = acc.find(item => item.category === exp.category);
            if (existing) {
                existing.total += exp.amount;
            } else {
                acc.push({ category: exp.category, total: exp.amount });
            }
            return acc;
        }, []);

        // Prepare user data for chatbot context
        const userData = {
            totalExpenses,
            totalIncome,
            expensesByCategory
        };

        // Get AI response
        const botResponse = await getChatbotResponse(
            message, 
            userData, 
            conversationHistory || []
        );

        res.status(200).json({
            success: true,
            response: botResponse,
            timestamp: new Date()
        });
    } catch (error) {
        console.error("Error in chatWithBot:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get chatbot response",
            error: error.message
        });
    }
};

module.exports = {
    getDailySuggestion,
    chatWithBot
};
