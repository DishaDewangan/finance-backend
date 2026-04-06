const express = require("express");
const {
  getSummary,
  getCategoryBreakdown,
  getMonthlyTrends,
  getWeeklySummary,
} = require("../controllers/dashboard.controller");
const protect = require("../middleware/auth");
const { analystAndAbove } = require("../middleware/roleCheck");

const router = express.Router();

// viewers don't get dashboard analytics — analyst and admin only
router.use(protect, analystAndAbove);

router.get("/summary", getSummary);
router.get("/categories", getCategoryBreakdown);
router.get("/trends", getMonthlyTrends);
router.get("/weekly", getWeeklySummary);

module.exports = router;
