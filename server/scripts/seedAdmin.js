import bcrypt from "bcrypt";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";

dotenv.config();

const { ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD, MONGODB_URL } = process.env;

if (!MONGODB_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("MONGODB_URL, ADMIN_EMAIL, and ADMIN_PASSWORD are required.");
  process.exit(1);
}

await mongoose.connect(MONGODB_URL);

const password = await bcrypt.hash(ADMIN_PASSWORD, 10);
const admin = await User.findOneAndUpdate(
  { email: ADMIN_EMAIL },
  {
    name: ADMIN_NAME || "Admin",
    email: ADMIN_EMAIL,
    password,
    role: "admin",
    img: "",
  },
  { new: true, upsert: true }
);

console.log(`Admin ready: ${admin.email}`);
await mongoose.disconnect();
process.exit(0);
