import mongoose from "mongoose";
import Food from "../models/Food.js";
import { cloudinary } from "./Cloudinary.js";
import createError from 'http-errors';

// Keep your existing bulk add function
export const getAllFoods = async (req, res) => {
  try {
    const foods = await Food.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: foods });
  } catch (err) {
    console.error('Error fetching all foods:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch foods' });
  }
};
export const addProducts = async (req, res, next) => {
  try {
    const foodData = req.body;
    if (!Array.isArray(foodData)) {
      return next(
        createError(400, "Invalid request. Expected an array of foods.")
      );
    }
    let createdfoods = [];
    for (const foodInfo of foodData) {
      const { name, desc, img, price, ingredients, category } = foodInfo;
      const product = new Food({
        name,
        desc,
        img,
        price,
        ingredients,
        category,
      });
      const createdFoods = await product.save();
      createdfoods.push(createdFoods);
    }
    return res
      .status(201)
      .json({ message: "Products added successfully", createdfoods });
  } catch (err) {
    next(err);
  }
};

// Updated addSingleFood function with proper schema handling
export const addSingleFood = async (req, res) => {
  try {
    const { name, description, price, category, ingredients } = req.body;
    
    // Validation
    if (!name || !description || !price) {
      return res.status(400).json({
        success: false,
        message: "Name, description, and price are required"
      });
    }
    
    // Check if image was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image is required"
      });
    }

    // req.file.path contains the Cloudinary URL
    const imageUrl = req.file.path;
    const imagePublicId = req.file.filename; // Cloudinary public_id

    // Parse ingredients if sent as string
    let parsedIngredients = [];
    if (ingredients) {
      parsedIngredients = typeof ingredients === 'string' 
        ? ingredients.split(',').map(ing => ing.trim()).filter(ing => ing.length > 0)
        : Array.isArray(ingredients) ? ingredients : [];
    }

    // Parse category - FIXED: Handle single category properly
    let parsedCategory = [];
    if (category) {
      if (typeof category === 'string') {
        // If it's a single category string, put it in an array
        parsedCategory = [category.trim()];
      } else if (Array.isArray(category)) {
        // If it's already an array, filter out empty strings
        parsedCategory = category.filter(cat => cat && cat.trim().length > 0);
      }
    }

    // Validate price is a positive number
    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a positive number"
      });
    }

    // Create new food item with correct structure
    const foodItem = new Food({
      name: name.trim(),
      desc: description.trim(),
      img: imageUrl,
      cloudinaryPublicId: imagePublicId,
      price: {
        org: numericPrice,
        mrp: numericPrice, // You can set this differently if needed
        off: 0 // Default discount
      },
      category: parsedCategory,
      ingredients: parsedIngredients,
    });

    const savedFood = await foodItem.save();

    return res.status(201).json({
      success: true,
      message: "Food item added successfully",
      food: savedFood
    });

  } catch (error) {
    console.error('Error adding food item:', error);
    
    // If database save fails, delete the uploaded image from Cloudinary
    if (req.file && req.file.filename) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
        console.log('Cleaned up uploaded image from Cloudinary');
      } catch (cleanupError) {
        console.error('Error cleaning up Cloudinary image:', cleanupError);
      }
    }

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error: " + validationErrors.join(', ')
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error adding food item: " + error.message
    });
  }
};

// OPTIONAL: Delete food item (with Cloudinary image cleanup)
export const deleteFood = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    const food = await Food.findById(id);
    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food not found"
      });
    }

    // Delete image from Cloudinary if public_id exists
    if (food.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(food.cloudinaryPublicId);
        console.log(`Deleted image from Cloudinary: ${food.cloudinaryPublicId}`);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
        // Continue with database deletion even if Cloudinary deletion fails
      }
    }

    await Food.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Food item deleted successfully"
    });

  } catch (error) {
    console.error('Error deleting food item:', error);
    return res.status(500).json({
      success: false,
      message: "Error deleting food item: " + error.message
    });
  }
};

// Updated getFoodItems with better filtering
export const getFoodItems = async (req, res, next) => {
  try {
    let { categories, minPrice, maxPrice, ingredients, search } = req.query;
    
    // Parse query parameters
    ingredients = ingredients ? ingredients.split(",").map(ing => ing.trim()).filter(ing => ing.length > 0) : null;
    categories = categories ? categories.split(",").map(cat => cat.trim()).filter(cat => cat.length > 0) : null;

    const filter = {};
    
    // Category filter - works with array of categories in schema
    if (categories && Array.isArray(categories) && categories.length > 0) {
      filter.category = { $in: categories };
    }
    
    // Ingredients filter
    if (ingredients && Array.isArray(ingredients) && ingredients.length > 0) {
      filter.ingredients = { $in: ingredients };
    }
    
    // Price range filter
    if (maxPrice || minPrice) {
      filter["price.org"] = {};
      if (minPrice) {
        const minPriceNum = parseFloat(minPrice);
        if (!isNaN(minPriceNum)) {
          filter["price.org"]["$gte"] = minPriceNum;
        }
      }
      if (maxPrice) {
        const maxPriceNum = parseFloat(maxPrice);
        if (!isNaN(maxPriceNum)) {
          filter["price.org"]["$lte"] = maxPriceNum;
        }
      }
    }
    
    // Search filter
    if (search && search.trim().length > 0) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { name: { $regex: searchRegex } },
        { desc: { $regex: searchRegex } },
      ];
    }
    
    const foodList = await Food.find(filter).sort({ createdAt: -1 }); // Sort by newest first

    return res.status(200).json({
      success: true,
      count: foodList.length,
      data: foodList
    });
  } catch (err) {
    console.error('Error fetching food items:', err);
    next(err);
  }
};

export const getFoodById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return next(createError(400, "Invalid product ID"));
    }
    const food = await Food.findById(id);
    if (!food) {
      return next(createError(404, "Food not found"));
    }
    return res.status(200).json({
      success: true,
      data: food
    });
  } catch (err) {
    next(err);
  }
};