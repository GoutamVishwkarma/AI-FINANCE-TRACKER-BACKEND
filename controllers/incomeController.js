
const Income = require("../models/Income");
const xlsx = require("xlsx");

//Add User Income
exports.addIncome = async (req, res) => {
    const userId = req.user.id;
    if(!req.body){
        return res.status(400).json({ message: "Request Body is empty" });
    }

    try {
        const { icon, source, amount, date } = req.body;
        if(!source || !amount || !date){
            return res.status(400).json({ message: "All fields are required" });
        }
        const newIcome = new Income({
            userId,
            icon,
            source,
            amount,
            date: new Date(date)
        });

        await newIcome.save();
        res.status(201).json(newIcome);
    } catch (error) {
        res.status(500).json({ message: "Error adding income", error: error.message });
    }
};

//Get All User Income
exports.getAllIncome = async (req, res) => {
    const userId = req.user.id;
    if(!userId){
        return res.status(400).json({ message: "User ID is required" });
    }

    try {
        const income = await Income.find({ userId }).sort({ date: -1 });
        res.status(200).json(income);
    } catch (error) {
        res.status(500).json({ message: "Error fetching income", error: error.message });
    }
};

//Delete User Income
exports.deleteIncome = async (req, res) => {
    if(!req.params.id){
        return res.status(400).json({ message: "Income ID is required" });
    }
    try {
        const income = await Income.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Income deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting income", error: error.message });
    }
};

//Download User Income
exports.downloadIncomeExcel = async (req, res) => {
    const userId = req.user.id;
    if(!userId){
        return res.status(400).json({ message: "User ID is required" });
    }
    
    try {
        const income = await Income.find({ userId }).sort({ date: -1 });
        const data = income && income.map((item) => ({
            source: item.source,
            amount: item.amount,
            date: item.date
        }));

        if(!data){
            return res.status(400).json({ message: "No income data found" });
        }

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(data);
        xlsx.utils.book_append_sheet(wb, ws, "Income");
        xlsx.writeFile(wb, "income_details.xlsx");
        res.download("income_details.xlsx");
    } catch (error) {
        res.status(500).json({ message: "Error downloading income", error: error.message });
    }
};

    