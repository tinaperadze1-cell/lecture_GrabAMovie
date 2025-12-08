const { query } = require("./db");

/**
 * Middleware to check if user is an admin
 * Expects userId in req.body or req.params
 */
async function requireAdmin(req, res, next) {
  try {
    // Get userId from body, params, or query
    const userId = req.body?.userId || req.params?.userId || req.query?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User ID required" });
    }

    // Check if user exists and is admin
    const result = await query(
      "SELECT id, username, is_admin, is_banned FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];

    if (user.is_banned) {
      return res.status(403).json({ error: "User is banned" });
    }

    if (!user.is_admin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Attach user info to request
    req.adminUser = user;
    next();
  } catch (error) {
    console.error("Error in admin middleware:", error);
    res.status(500).json({ error: "Failed to verify admin status" });
  }
}

/**
 * Log admin action to database
 * @param {number} adminId - Admin user ID
 * @param {string} actionType - Type of action (e.g., 'DELETE_MOVIE', 'BAN_USER')
 * @param {string} targetType - Type of target (e.g., 'movie', 'user', 'comment')
 * @param {number} targetId - ID of the target
 * @param {string} description - Description of the action
 */
async function logAdminAction(adminId, actionType, targetType, targetId, description) {
  try {
    await query(
      `INSERT INTO admin_logs (admin_id, action_type, target_type, target_id, description)
       VALUES ($1, $2, $3, $4, $5)`,
      [adminId, actionType, targetType, targetId, description]
    );
  } catch (error) {
    console.error("Error logging admin action:", error);
    // Don't throw - logging failure shouldn't break the main action
  }
}

/**
 * Helper to check if user is admin (non-middleware version)
 * @param {number} userId - User ID to check
 * @returns {Promise<boolean>} - True if user is admin
 */
async function isAdmin(userId) {
  try {
    const result = await query(
      "SELECT is_admin FROM users WHERE id = $1 AND is_admin = true",
      [userId]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

module.exports = {
  requireAdmin,
  logAdminAction,
  isAdmin,
};

