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
  removeFromCart,
  removeFromFavorites
} from "../controllers/User.js";
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

export default router;