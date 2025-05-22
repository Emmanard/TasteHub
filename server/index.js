import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import UserRoutes from "./routes/User.js";
import FoodRoutes from "./routes/Food.js";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true })); // for form data

app.use("/api/user/", UserRoutes);
app.use("/api/food/", FoodRoutes);

// Add this debug endpoint here
app.get("/api/debug/database", async (req, res) => {
  try {
    // Check MongoDB connection status
    const connectionState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    
    // Get list of all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Check for users collection and get count
    let userCount = 0;
    let userSample = [];
    
    if (collectionNames.includes('users')) {
      userCount = await mongoose.connection.db.collection('users').countDocuments();
      // Get sample of users (first 5) - ONLY FOR DEBUGGING, remove in production
      if (userCount > 0) {
        userSample = await mongoose.connection.db.collection('users')
          .find({})
          .limit(5)
          .project({ password: 0 }) // Don't include passwords
          .toArray();
      }
    }
    
    return res.status(200).json({
      databaseStatus: {
        connectionState: states[connectionState] || 'unknown',
        databaseName: mongoose.connection.db.databaseName,
        collections: collectionNames
      },
      usersCollection: {
        exists: collectionNames.includes('users'),
        documentCount: userCount,
        sample: userSample
      }
    });
    
  } catch (error) {
    console.error('Database debug route error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

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
    app.listen(8080, () => console.log("Server started on port 8080"));
  } catch (error) {
    console.log(error);
  }
};

startServer();