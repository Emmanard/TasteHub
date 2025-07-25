import jwt from "jsonwebtoken";
import { createError } from "../error.js";

export const verifyToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(createError(401, "Not authenticated - missing or invalid token format"));
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return next(createError(403, "Token is invalid or expired"));
      }
      
      // Set user info to request object for use in controllers
      req.user = user;
      next();
    });
  } catch (err) {
    return next(createError(500, "Error verifying token"));
  }
};

export const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return next(createError(401, "Not authenticated"));
  if (!allowedRoles.includes(req.user.role)) {
    return next(createError(403, `Access denied. Requires role: ${allowedRoles.join(", ")}`));
  }
  next();
};

/** Convenience middleware for admin-only routes */
export const isAdmin = requireRole("admin")