const express = require("express");
const { body } = require("express-validator");
const {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = require("../controllers/transaction.controller");
const protect = require("../middleware/auth");
const { adminOnly, allRoles } = require("../middleware/roleCheck");

const router = express.Router();

router.use(protect);

// viewers, analysts, and admins can all read transactions
router.get("/", allRoles, getTransactions);
router.get("/:id", allRoles, getTransactionById);

// only admins can create, update, or delete
router.post(
  "/",
  adminOnly,
  [
    body("amount")
      .isFloat({ gt: 0 })
      .withMessage("Amount must be a positive number"),
    body("type")
      .isIn(["income", "expense"])
      .withMessage("Type must be income or expense"),
    body("category").trim().notEmpty().withMessage("Category is required"),
    body("date").optional().isISO8601().withMessage("Invalid date format"),
    body("notes")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Notes cannot exceed 500 characters"),
  ],
  createTransaction
);

router.patch(
  "/:id",
  adminOnly,
  [
    body("amount")
      .optional()
      .isFloat({ gt: 0 })
      .withMessage("Amount must be a positive number"),
    body("type")
      .optional()
      .isIn(["income", "expense"])
      .withMessage("Type must be income or expense"),
    body("date").optional().isISO8601().withMessage("Invalid date format"),
  ],
  updateTransaction
);

router.delete("/:id", adminOnly, deleteTransaction);

module.exports = router;
