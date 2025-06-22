import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { createError } from "../error.js";
import User from "../models/User.js";
import Orders from "../models/Orders.js";

dotenv.config();

// Auth
export const UserRegister = async (req, res, next) => {
  console.log("💡 Entered UserRegister controller");
  const { name, email, password, img } = req.body;

  try {
    // Validate required fields
    if (!name || !email || !password) {
      console.log("❌ Missing required fields");
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    // Validate email format
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isEmailValid) {
      console.log("❌ Invalid email format:", email);
      return res.status(400).json({ message: "Invalid email format." });
    }

    // Password strength check
    if (password.length < 8) {
      console.log("❌ Weak password");
      return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("❌ Email already exists:", email);
      return res.status(409).json({ message: "Email is already in use." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create and save new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      img,
    });

    const createdUser = await newUser.save();
    console.log("✅ User created:", createdUser.email);

    // Generate JWT
    const token = jwt.sign({ id: createdUser._id }, process.env.JWT_SECRET, {
      expiresIn: "7d", // Best practice: shorter expiry
    });

    // Respond with token and user details
    return res.status(201).json({
      token,
      user: {
        _id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        img: createdUser.img,
        favourites: createdUser.favourites || [],
        cart: createdUser.cart || [],
      },
    });

  } catch (error) {
    console.error("🔥 Error in UserRegister:", error.message);
    return next(error);
  }
};

export const UserLogin = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // 1. Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 2. Compare password securely
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 3. Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d", // More realistic than "9999 years"
    });

    // 4. Respond with user (without password) and token
    const { password: _, ...filteredUser } = user._doc;

    return res.status(200).json({
      token,
      user: filteredUser,
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Cart
export const addToCart = async (req, res, next) => {
  try {
    console.log("Adding to cart...", req.body);
    
    const { productId, quantity } = req.body;
    
    if (!productId) {
      return res.status(400).json({ message: "Missing productId" });
    }
    
    // Get user from auth middleware
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingProduct = user.cart.find(
      (item) => item.product.toString() === productId
    );

    if (existingProduct) {
      existingProduct.quantity += quantity || 1;
    } else {
      user.cart.push({ product: productId, quantity: quantity || 1 });
    }

    await user.save();
    
    console.log("User cart updated:", user.cart);
    return res.status(200).json({ 
      message: "Product added to cart", 
      cart: user.cart 
    });
  } catch (err) {
    console.error("Add to cart error:", err);
    return next(err);
  }
};

export const removeFromCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return next(createError(404, "User not found"));
    }
    
    const productIndex = user.cart.findIndex(
      (item) => item.product.toString() === productId
    );
    
    if (productIndex === -1) {
      return next(createError(404, "Product not found in the user's cart"));
    }

    if (quantity && quantity > 0) {
      user.cart[productIndex].quantity -= quantity;
      if (user.cart[productIndex].quantity <= 0) {
        user.cart.splice(productIndex, 1); // Remove the product from the cart
      }
    } else {
      user.cart.splice(productIndex, 1);
    }

    await user.save();

    return res.status(200).json({ 
      message: "Product quantity updated in cart", 
      cart: user.cart 
    });
  } catch (err) {
    return next(err);
  }
};

export const getAllCartItems = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId).populate({
      path: "cart.product",
      model: "Food",
    });
    
    if (!user) {
      return next(createError(404, "User not found"));
    }
    
    return res.status(200).json(user.cart);
  } catch (err) {
    return next(err);
  }
};

// Updated placeOrder function to integrate with Paystack payment
export const placeOrder = async (req, res, next) => {
  try {
    const { products, address, totalAmount } = req.body;
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return next(createError(404, "User not found"));
    }

    // Create order with initial status
    const order = new Orders({
      products,
      user: userId,
      total_amount: totalAmount,
      address,
      status: 'Pending Payment', // Initial status
      payment: {
        status: 'pending',
        amount: totalAmount,
        reference: null,
        paystack_reference: null,
        payment_method: null,
        paid_at: null,
        gateway_response: null
      }
    });

    await order.save();
    
    // DON'T clear cart yet - wait for successful payment
    // user.cart = []; // Remove this line
    // await user.save(); // Remove this line
    
    return res.status(200).json({
      message: "Order created successfully. Proceed to payment.", 
      order,
      orderId: order._id // Return orderId for payment initialization
    });
  } catch (err) {
    return next(err);
  }
};

// Add a new function to handle successful payment completion
export const completeOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;
    
    // Find the order and verify it belongs to the user
    const order = await Orders.findOne({ _id: orderId, user: userId });
    if (!order) {
      return next(createError(404, "Order not found"));
    }
    
    // Check if payment is successful
    if (order.payment.status !== 'success') {
      return next(createError(400, "Payment not completed"));
    }
    
    // Now clear the user's cart after successful payment
    const user = await User.findById(userId);
    if (user) {
      user.cart = [];
      await user.save();
    }
    
    return res.status(200).json({
      message: "Order completed successfully",
      order
    });
  } catch (err) {
    return next(err);
  }
};

// Favorites
export const addToFavorites = async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ message: "Missing productId" });
    }
    
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return next(createError(404, "User not found"));
    }

    // Check if product is already in favorites
    if (!user.favourites.includes(productId)) {
      user.favourites.push(productId);
      await user.save();
    }

    return res.status(200).json({
      message: "Product added to favorites successfully",
      favorites: user.favourites
    });
  } catch (err) {
    return next(err);
  }
};

export const removeFromFavorites = async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ message: "Missing productId" });
    }
    
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return next(createError(404, "User not found"));
    }
    
    // Remove product from favorites
    user.favourites = user.favourites.filter(
      (favId) => favId.toString() !== productId
    );
    
    await user.save();

    return res.status(200).json({
      message: "Product removed from favorites successfully",
      favorites: user.favourites
    });
  } catch (err) {
    return next(err);
  }
};

export const getUserFavorites = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId)
      .populate("favourites")
      .exec();
      
    if (!user) {
      return next(createError(404, "User not found"));
    }
    
    return res.status(200).json(user.favourites);
  } catch (err) {
    return next(err);
  }
};