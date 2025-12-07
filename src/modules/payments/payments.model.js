import mongoose from "mongoose";
const paymentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  orderId:{type:String,required:true},
  providerId: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  status: { type: String, enum: ["pending","success","failed","refunded"], default: "pending" },
  paymentGateway: { type: String, enum: ["razorpay"], default: "razorpay" },
  paymentMethod: { type: String, enum: ["card","netbanking","upi","wallet","emandate","Payment Not Done"], default: "Payment Not Done" },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  referenceId: { type: String, required: true },
  serviceType: { type: String, enum: ["CONSULTATION"], required: true },
  notes: { type: String },
  idempotencyKey: { type: String, unique: true, sparse: true },
  history: [{ status: { type: String, enum: ["pending","success","failed","refunded"] }, updatedAt: { type: Date, default: Date.now } }],
  refundStatus: { type: String, enum: ["not_requested","requested","completed"], default: "not_requested" },
}, { timestamps: true });
paymentSchema.index({ referenceId: 1 }, { unique: true });
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ userId: 1 });
paymentSchema.index({ providerId: 1 });
paymentSchema.index({ userId: 1, idempotencyKey: 1 }, { sparse: true }); // For idempotency checks


export const PaymentModel = mongoose.model("Payment", paymentSchema);
