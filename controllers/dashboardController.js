const Income = require("../models/Income");
const Expense = require("../models/Expense");
const { isValidObjectId, Types } = require("mongoose");

exports.getDashboardData = async (req, res) => {
    try {
        const userId = req.user.id;
        const userObjectId = new Types.ObjectId(String(userId));

        //Fetch total income & expenses
        const totalIncome = await Income.aggregate([
            { $match: { userId: userObjectId }},
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
                                                
        
        const totalExpense = await Expense.aggregate([
            { $match: { userId: userObjectId }},
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        // Handle empty aggregation results safely
        const incomeTotal = (totalIncome[0]?.total) || 0;
        const expenseTotal = (totalExpense[0]?.total) || 0;

        //Fetch income transactions in the last 60 days
        const last60DaysIncomeTransactions = await Income.find({
            userId,
            date: {
                $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
            }
        }).sort({ date: -1 });

        //Fetch total income for last 60 days
        const incomeLast60Days = last60DaysIncomeTransactions.reduce((total, income) => total + income.amount, 0);

        //Fetch expense transactions in the last 30 days
        const last30DaysExpenseTransactions = await Expense.find({
            userId,
            date: {
                $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
        }).sort({ date: -1 });

        //Fetch total expense for last 30 days
        const expenseLast30Days = last30DaysExpenseTransactions.reduce((total, expense) => total + expense.amount, 0);
       
        //Fetch last 5 transactions ( income & expense )
        const lastTransactions = [
            ...((await Income.find({ userId }).sort({ date: -1 }).limit(5)).map(
                (txn) => ({
                    ...txn.toObject(),
                    type: "income"
                })
            )
        ),
            ...((await Expense.find({ userId }).sort({ date: -1 }).limit(5)).map(
                (txn) => ({
                    ...txn.toObject(),
                    type: "expense"
                })
            )
        )
        ].sort((a, b) => b.date - a.date);

        //Final api response ---
        res.status(200).json({
            totalBalance: incomeTotal - expenseTotal,
            totalIncome: incomeTotal,
            totalExpenses: expenseTotal,
           last30DaysExpenses: {
            total: expenseLast30Days,
            transactions: last30DaysExpenseTransactions
           },
           last60DaysIncome: {
            total: incomeLast60Days,
            transactions: last60DaysIncomeTransactions
           },
           recentTransactions: lastTransactions
        });

    } catch (error) {
        res.status(500).json({ message: "Error fetching dashboard data", error: error.message });
    }
};