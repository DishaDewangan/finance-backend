const express = require("express");
const { body } = require("express-validator");
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/user.controller");
const protect = require("../middleware/auth");
const { adminOnly } = require("../middleware/roleCheck");

const router = express.Router();

// all user management routes are admin-only
router.use(protect, adminOnly);

router.get("/", getAllUsers);
router.get("/:id", getUserById);

router.post(
  "/",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("role")
      .optional()
      .isIn(["viewer", "analyst", "admin"])
      .withMessage("Invalid role"),
  ],
  createUser
);

router.patch(
  "/:id",
  [
    body("role")
      .optional()
      .isIn(["viewer", "analyst", "admin"])
      .withMessage("Invalid role"),
    body("status")
      .optional()
      .isIn(["active", "inactive"])
      .withMessage("Status must be active or inactive"),
  ],
  updateUser
);

router.delete("/:id", deleteUser);

module.exports = router;
