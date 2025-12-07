import jwt from "jsonwebtoken";
import ApiError from "../config/APIError.js";

export const authorize = (role) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new ApiError(401, "Unauthorized: No token provided");
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 🔥 FIX: Map your JWT payload → req.user
      req.user = {
        id: decoded.userId,   // this matches your token
        role: decoded.type    // this matches your token
      };

      // Role checking
      if (role && req.user.role !== role) {
        throw new ApiError(403, "Forbidden: You don't have permission");
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
