import express from 'express';
import { upload } from '../controllers/Cloudinary.js';
import { 
  addProducts, 
  addSingleFood, 
  getFoodItems, 
  getFoodById,
  deleteFood,
  getAllFoods
} from '../controllers/Food.js';

const router = express.Router();

// Admin routes
router.post('/add', upload.single('image'), addSingleFood); // Single item with image
router.post('/bulk-add', addProducts); // Bulk add (existing)
router.delete('/:id', deleteFood); // Delete with image cleanup
router.get('/admin/list', getAllFoods);

// Public routes
router.get('/', getFoodItems);
router.get('/:id', getFoodById);

export default router;