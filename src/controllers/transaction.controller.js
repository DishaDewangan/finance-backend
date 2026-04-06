const { validationResult } = require("express-validator");
const Transaction = require("../models/Transaction");

// GET /api/transactions — all authenticated users can view, with filters
const getTransactions = async (req, res, next) => {
  try {
    const {
      type,
      category,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 10,
      sortBy = "date",
      order = "desc",
    } = req.query;

    const filter = {};

    if (type) filter.type = type;
    if (category) filter.category = new RegExp(category, "i");
    if (search) filter.notes = new RegExp(search, "i");

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === "asc" ? 1 : -1;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate("createdBy", "name email role")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      transactions,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/transactions/:id
const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );

    if (!transaction) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found" });
    }

    res.status(200).json({ success: true, transaction });
  } catch (err) {
    next(err);
  }
};

// POST /api/transactions — admin only
const createTransaction = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { amount, type, category, date, notes } = req.body;

    const transaction = await Transaction.create({
      amount,
      type,
      category,
      date: date || Date.now(),
      notes,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Transaction created",
      transaction,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/transactions/:id — admin only
const updateTransaction = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const allowedFields = ["amount", "type", "category", "date", "notes"];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Transaction updated", transaction });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/transactions/:id — soft delete, admin only
const deleteTransaction = async (req, res, next) => {
  try {
    // using findOne bypassing the pre-hook to find already deleted ones too if needed
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found" });
    }

    transaction.isDeleted = true;
    transaction.deletedAt = new Date();
    await transaction.save();

    res
      .status(200)
      .json({ success: true, message: "Transaction deleted successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
