const Transaction = require("../models/Transaction");

// GET /api/dashboard/summary
// returns the big-picture numbers: total income, total expense, net balance
const getSummary = async (req, res, next) => {
  try {
    const result = await Transaction.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    let totalIncome = 0;
    let totalExpenses = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    result.forEach((item) => {
      if (item._id === "income") {
        totalIncome = item.total;
        incomeCount = item.count;
      } else if (item._id === "expense") {
        totalExpenses = item.total;
        expenseCount = item.count;
      }
    });

    const netBalance = totalIncome - totalExpenses;

    // grab the 5 most recent transactions for the "recent activity" section
    const recentActivity = await Transaction.find()
      .sort({ date: -1 })
      .limit(5)
      .populate("createdBy", "name");

    res.status(200).json({
      success: true,
      summary: {
        totalIncome,
        totalExpenses,
        netBalance,
        incomeCount,
        expenseCount,
        recentActivity,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/categories
// breaks down spending/income by category — useful for pie charts etc
const getCategoryBreakdown = async (req, res, next) => {
  try {
    const { type } = req.query; // optional filter by income or expense

    const matchStage = { isDeleted: false };
    if (type) matchStage.type = type;

    const breakdown = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { category: "$category", type: "$type" },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { total: -1 },
      },
      {
        $project: {
          _id: 0,
          category: "$_id.category",
          type: "$_id.type",
          total: 1,
          count: 1,
        },
      },
    ]);

    res.status(200).json({ success: true, breakdown });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/trends
// monthly aggregation — shows how income/expense moved over time
const getMonthlyTrends = async (req, res, next) => {
  try {
    const { year } = req.query;
    const targetYear = parseInt(year) || new Date().getFullYear();

    const trends = await Transaction.aggregate([
      {
        $match: {
          isDeleted: false,
          date: {
            $gte: new Date(`${targetYear}-01-01`),
            $lte: new Date(`${targetYear}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$date" },
            type: "$type",
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.month": 1 } },
      {
        $project: {
          _id: 0,
          month: "$_id.month",
          type: "$_id.type",
          total: 1,
          count: 1,
        },
      },
    ]);

    // reshape into a cleaner format grouped by month number
    const monthlyData = {};
    trends.forEach(({ month, type, total, count }) => {
      if (!monthlyData[month]) monthlyData[month] = { month, income: 0, expense: 0 };
      monthlyData[month][type] = total;
    });

    res.status(200).json({
      success: true,
      year: targetYear,
      trends: Object.values(monthlyData),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/weekly
// last 7 days summary — quick snapshot
const getWeeklySummary = async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weekly = await Transaction.aggregate([
      {
        $match: {
          isDeleted: false,
          date: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            type: "$type",
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.day": 1 } },
      {
        $project: {
          _id: 0,
          day: "$_id.day",
          type: "$_id.type",
          total: 1,
        },
      },
    ]);

    res.status(200).json({ success: true, weekly });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSummary, getCategoryBreakdown, getMonthlyTrends, getWeeklySummary };
