import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import UserRoutes from "./routes/User.js";
import FoodRoutes from "./routes/Food.js";
dotenv.config();

const app = express();
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  ...(process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean)
    : []),
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true })); // for form data

app.use("/api/user/", UserRoutes);
app.use("/api/food/", FoodRoutes);

// error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Something went wrong";
  return res.status(status).json({
    success: false,
    status,
    message,
  });
});

app.get("/", async (req, res) => {
  res.status(200).json({
    message: "Hello developers from GFG",
  });
});

const connectDB = () => {
  mongoose.set("strictQuery", true);
  
  // Log the URL being used (without sensitive credentials)
  const redactedUrl = process.env.MONGODB_URL 
    ? process.env.MONGODB_URL.replace(/mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/, 'mongodb$1://**username**:**password**@')
    : 'MONGODB_URL not defined in environment';
  console.log(`Attempting to connect to: ${redactedUrl}`);
  
  // Extract the database name from the connection string for logging
  let dbName = 'unknown';
  try {
    const urlParts = process.env.MONGODB_URL.split('/');
    if (urlParts.length > 0) {
      dbName = urlParts[urlParts.length - 1].split('?')[0]; // Extract DB name before any query params
    }
  } catch (error) {
    console.error('Could not parse database name from connection string');
  }
  
  mongoose
    .connect(process.env.MONGODB_URL)
    .then(() => {
      console.log(`Connected to MongoDB database: ${dbName}`);
      // List all collections to verify database content
      mongoose.connection.db.listCollections().toArray((err, collections) => {
        if (err) {
          console.error('Error listing collections:', err);
        } else {
          console.log('Available collections:', collections.map(c => c.name).join(', '));
        }
      });
    })
    .catch((err) => {
      console.error("Failed to connect to MongoDB");
      console.error(err);
    });
    
  // Add connection event listeners
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });
  
  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
  });
};

const startServer = async () => {
  try {
    connectDB();
    const port = process.env.PORT || 8080;
    app.listen(port, () => console.log(`Server started on port ${port}`));
  } catch (error) {
    console.log(error);
  }
};

startServer();
