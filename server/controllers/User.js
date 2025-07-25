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
  
  // Force role based on URL (safety check)
  if (req.originalUrl.includes("/admin/signup")) {
    req.body.role = "admin";
  } else {
    req.body.role = "user";
  }

  const { name, email, password, img, role } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isEmailValid) return res.status(400).json({ message: "Invalid email format." });

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already in use." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      img,
      role: role === "admin" ? "admin" : "user",  // role is now safely controlled
    });

    const createdUser = await newUser.save();
    console.log("✅ User created:", createdUser.email, "Role:", createdUser.role);

    const token = jwt.sign(
      { id: createdUser._id, role: createdUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      token,
      user: {
        _id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        img: createdUser.img,
        favourites: createdUser.favourites || [],
        cart: createdUser.cart || [],
      },
    });

  } catch (error) {
    return next(error);
  }
};

export const UserLogin = async (req, res, next) => {
  // Force loginAs based on the route hit
  const forcedLoginAs = req.originalUrl.includes("/admin/signin") ? "admin" : "user";

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid credentials" });

    // Enforce role check based on forcedLoginAs
    if (forcedLoginAs === "admin" && user.role !== "admin") {
      return res.status(403).json({ message: "Not an admin, please login as a user." });
    }
    if (forcedLoginAs === "user" && user.role !== "user") {
      return res.status(403).json({ message: "This is an admin account, use admin login." });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

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

export const placeOrder = async (req, res, next) => {
  try {
    const { products, address, totalAmount } = req.body;
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return next(createError(404, "User not found"));
    }

    // Check for existing pending orders more strictly
    const existingPendingOrder = await Orders.findOne({
      user: userId,
      status: 'Pending Payment',
      total_amount: totalAmount, // Also match amount to prevent different orders
      createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) } // Within last 10 minutes
    });

    if (existingPendingOrder) {
      // Return existing order instead of creating new one
      return res.status(200).json({
        message: "Using existing pending order", 
        order: existingPendingOrder,
        orderId: existingPendingOrder._id
      });
    }

    // Create new order with unique identifier
    const order = new Orders({
      products,
      user: userId,
      total_amount: totalAmount,
      address,
      status: 'Pending Payment',
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
    
    return res.status(200).json({
      message: "Order created successfully. Proceed to payment.", 
      order,
      orderId: order._id
    });
  } catch (err) {
    return next(err);
  }
};

export const updateDeliveryStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { deliveryStatus } = req.body;

    if (!deliveryStatus || !["Processing", "Delivered", "Cancelled"].includes(deliveryStatus)) {
      return res.status(400).json({ success: false, message: "Invalid or missing delivery status." });
    }

    const order = await Orders.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found." });

    order.deliveryStatus = deliveryStatus;
    await order.save();

    return res.status(200).json({
      success: true,
      message: `Delivery status updated to ${deliveryStatus}.`,
      order,
    });
  } catch (error) {
    return next(error);
  }
};

export const completeOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;

    const order = await Orders.findOneAndUpdate(
      {
        _id: orderId,
        user: userId,
        "payment.status": "success"
      },
      {
        $set: {
          status: "Payment Done",
          deliveryStatus: "Processing", // Set delivery to Processing after payment
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    );

    if (!order) {
      return next(createError(404, "Order not found or payment not completed"));
    }

    return res.status(200).json({
      message: "Order completed successfully",
      success: true,
      order
    });
  } catch (err) {
    return next(err);
  }
};


export const getAllOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Find all orders for the current user
    const orders = await Orders.find({ user: userId })
      .populate({
        path: "products.product",
        model: "Food", // Make sure this matches your Food model name
      })
      .sort({ createdAt: -1 }); // Sort by newest first

    if (!orders) {
      return res.status(404).json({
        message: "No orders found for this user"
      });
    }

    return res.status(200).json({
      message: "Orders retrieved successfully",
      orders
    });
    
  } catch (err) {
    console.error("Get all orders error:", err);
    return next(err);
  }
};

export const getAllOrdersForAdmin = async (req, res, next) => {
  try {
    // Check if the user is an admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    // Fetch all orders on the site
    const orders = await Orders.find({})
      .populate({
        path: "products.product",
        model: "Food", // Ensure this matches your Food model name
      })
      .populate({
        path: "user",
        model: "User", // Populates user details for each order
        select: "name email" // Only include specific fields from User model
      })
      .sort({ createdAt: -1 }); // Sort by newest first

    if (!orders || orders.length === 0) {
      return res.status(404).json({
        message: "No orders found."
      });
    }

    return res.status(200).json({
      message: "All orders retrieved successfully",
      totalOrders: orders.length,
      orders
    });

  } catch (err) {
    console.error("Admin get all orders error:", err);
    return next(err);
  }
}

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