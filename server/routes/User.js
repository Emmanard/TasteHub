import { verifyToken, isAdmin }from "../middleware/verifyUser.js";
import {
  forgotPassword,
  UserLogin,
  UserRegister,
  addToCart,
  addToFavorites,
  getAllCartItems,
  getAllOrders,
  getUserFavorites,
  placeOrder,
  completeOrder,
  removeFromCart,
  removeFromFavorites,
  resetPassword,
  getAllOrdersForAdmin,
  updateDeliveryStatus,
  verifyOTP
} from "../controllers/User.js";
import {
  initializePayment,
  verifyPayment, 
  handleWebhook
} from "../controllers/Payment.js"; 
import express from "express";
import { authLimiter, otpLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// User Auth
router.post("/signup", authLimiter, (req, res, next) => {
  req.body.role = "user";
  return UserRegister(req, res, next);
});
router.post("/signin", authLimiter, (req, res, next) => {
  req.body.loginAs = "user";
  return UserLogin(req, res, next);
});
router.post("/forgot-password", otpLimiter, forgotPassword);
router.post("/verify-otp", otpLimiter, verifyOTP);
router.post("/reset-password", otpLimiter, resetPassword);

// Admin Auth
router.post("/admin/signin", authLimiter, (req, res, next) => {
  req.body.loginAs = "admin";
  return UserLogin(req, res, next);
});
router.patch("/admin/orders/:orderId/delivery-status", verifyToken, isAdmin, updateDeliveryStatus);

// Cart routes
router.post("/cart", verifyToken, addToCart);
router.get("/cart", verifyToken, getAllCartItems);
router.patch("/cart", verifyToken, removeFromCart);

// Favorite routes
router.post("/favorite", verifyToken, addToFavorites);
router.get("/favorite", verifyToken, getUserFavorites);
router.patch("/favorite", verifyToken, removeFromFavorites);

// Order routes
router.post("/order", verifyToken, placeOrder);
router.get("/order", verifyToken, getAllOrders);
router.post("/order/complete", verifyToken, completeOrder);

// Admin routes
router.get("/admin/orders", verifyToken, isAdmin, getAllOrdersForAdmin);

// Payment routes
router.post("/payment/initialize", verifyToken, initializePayment);
router.get("/payment/verify/:reference", verifyToken, verifyPayment);
router.post("/payment/webhook", handleWebhook);

export default router;
