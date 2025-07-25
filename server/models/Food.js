import mongoose from "mongoose";

const FoodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    desc: {
      type: String,
      required: true,
    },
    img: {
      type: String,
      default: null,
    },
    // Add this field for Cloudinary cleanup
    cloudinaryPublicId: {
      type: String,
      default: null,
    },
    price: {
      type: {
        org: { type: Number, default: 0.0 },
        mrp: { type: Number, default: 0.0 },
        off: { type: Number, default: 0 },
      },
      default: { org: 0.0, mrp: 0.0, off: 0 },
    },
    category: {
      type: [String],
      default: [],
    },
    ingredients: {
      type: [String],
      required: true,
      default: [], // Make it not required OR provide default empty array
    },
  },
  { timestamps: true }
);

export default mongoose.model("Food", FoodSchema);