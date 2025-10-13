
const Expense = require("../models/Expense");
const xlsx = require("xlsx");

//Add User Expense
exports.addExpense = async (req, res) => {
    const userId = req.user.id;
    if(!req.body){
        return res.status(400).json({ message: "Request Body is empty" });
    }

    try {
        const { icon, category, amount, date } = req.body;
        if(!category || !amount || !date){
            return res.status(400).json({ message: "All fields are required" });
        }
        const newExpense = new Expense({
            userId,
            icon,
            category,
            amount,
            date: new Date(date)
        });

        await newExpense.save();
        res.status(201).json(newExpense);
    } catch (error) {
        res.status(500).json({ message: "Error adding expense", error: error.message });
    }
};

//Get All User Expense
exports.getAllExpense = async (req, res) => {
    const userId = req.user.id;
    if(!userId){
        return res.status(400).json({ message: "User ID is required" });
    }

    try {
        const expense = await Expense.find({ userId }).sort({ date: -1 });
        res.status(200).json(expense);
    } catch (error) {
        res.status(500).json({ message: "Error fetching expense", error: error.message });
    }
};

//Delete User Expense
exports.deleteExpense = async (req, res) => {
    if(!req.params.id){
        return res.status(400).json({ message: "Expense ID is required" });
    }
    try {
        const expense = await Expense.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Expense deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting expense", error: error.message });
    }
};

//Download User Expense
exports.downloadExpenseExcel = async (req, res) => {
    const userId = req.user.id;
    if(!userId){
        return res.status(400).json({ message: "User ID is required" });
    }
    
    try {
        const expense = await Expense.find({ userId }).sort({ date: -1 });
        const data = expense && expense.map((item) => ({
            category: item.category,
            amount: item.amount,
            date: item.date
        }));

        if(!data){
            return res.status(400).json({ message: "No expense data found" });
        }

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(data);
        xlsx.utils.book_append_sheet(wb, ws, "Expense");
        xlsx.writeFile(wb, "expense_details.xlsx");
        res.download("expense_details.xlsx");
    } catch (error) {
        res.status(500).json({ message: "Error downloading expense", error: error.message });
    }
};

    