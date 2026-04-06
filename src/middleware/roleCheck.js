// role hierarchy: admin > analyst > viewer
const ROLE_LEVELS = {
  viewer: 1,
  analyst: 2,
  admin: 3,
};

// checks if the logged-in user has at least one of the allowed roles
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    const userRole = req.user.role;
    const hasPermission = allowedRoles.some(
      (role) => ROLE_LEVELS[userRole] >= ROLE_LEVELS[role]
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This action requires one of: [${allowedRoles.join(", ")}] role`,
      });
    }

    next();
  };
};

// shortcut helpers — makes routes more readable
const adminOnly = authorize("admin");
const analystAndAbove = authorize("analyst");
const allRoles = authorize("viewer");

module.exports = { authorize, adminOnly, analystAndAbove, allRoles };
