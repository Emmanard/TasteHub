import { verifyToken } from "../middleware/verifyUser.js";
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
  removeFromFavorites
} from "../controllers/User.js";
import {
  initializePayment,
  verifyPayment, 
  handleWebhook
} from "../controllers/Payment.js"; 
import express from "express";

const router = express.Router();

// Auth routes
router.post("/signup", UserRegister);
router.post("/signin", UserLogin);

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

// Payment routes
router.post("/payment/initialize", verifyToken, initializePayment);
router.get("/payment/verify/:reference", verifyToken, verifyPayment);
router.post("/payment/webhook", handleWebhook);

export default router;