import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Food",
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
      }
    ],
    total_amount: {
      type: Number,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending Payment", "Payment Done", "Processing", "Delivered", "Cancelled"],
      default: "Pending Payment",
    },
    // Paystack payment fields
    payment: {
      reference: {
        type: String,
        required: true,
        unique: true,
      },
      status: {
        type: String,
        enum: ["pending", "success", "failed"],
        default: "pending",
      },
      paystack_reference: {
        type: String,
      },
      payment_method: {
        type: String,
      },
      paid_at: {
        type: Date,
      },
      gateway_response: {
        type: String,
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Orders", OrderSchema);