import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    img: { type: String, default: null },

    // Add role field with default as "user"
    role: { 
      type: String, 
      enum: ["user", "admin"], 
      default: "user" 
    },

    favourites: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Food" }
    ],
    orders: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Orders" }
    ],
    cart: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Food",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      }
    ],
  },
  { timestamps: true }
);

// Optional logging (for debugging purposes)
UserSchema.pre("save", function (next) {
  console.log(`Saving user: ${this.email}`);
  next();
});

UserSchema.post("save", function (doc) {
  console.log(`User saved: ${doc.email}`);
});

export default mongoose.model("User", UserSchema, "users");
