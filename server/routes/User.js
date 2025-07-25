import { verifyToken, isAdmin }from "../middleware/verifyUser.js";
import {
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
  getAllOrdersForAdmin,
  updateDeliveryStatus
} from "../controllers/User.js";
import {
  initializePayment,
  verifyPayment, 
  handleWebhook
} from "../controllers/Payment.js"; 
import express from "express";

const router = express.Router();

// User Auth
router.post("/signup", (req, res, next) => {
  req.body.role = "user";
  return UserRegister(req, res, next);
});
router.post("/signin", (req, res, next) => {
  req.body.loginAs = "user";
  return UserLogin(req, res, next);
});

// Admin Auth
router.post("/admin/signup", (req, res, next) => {
  req.body.role = "admin";
  return UserRegister(req, res, next);
});
router.post("/admin/signin", (req, res, next) => {
  req.body.loginAs = "admin";
  return UserLogin(req, res, next);
});

// Protected admin signup (only admin can create another admin)
router.post("/admin/signup", verifyToken, isAdmin, UserRegister);
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