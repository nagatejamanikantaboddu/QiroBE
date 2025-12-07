import razorpay from "../../config/razorpay.config.js";
import config from "../../config/config.js";
import { PaymentModel } from "./payments.model.js";
import Master from "../../config/Master.class.js";
import cacheService from "../../services/cacheService.js";

import crypto from "crypto";
import { paymentHistorySchema } from "./payments.validations.js";

class PaymentService extends Master {
  constructor() {
    super();
    Object.freeze(this);
  }

  /**
   * Create a new payment
  */
  async createPayment(amount, currency = "INR", description = "", userId, providerId, serviceType, idempotencyKey) {
    try {
      if (amount == null || userId == null || providerId == null || serviceType == null) {
        throw new Error("Missing required fields");
      }

      const amtNum = Number(amount);
      if (isNaN(amtNum) || amtNum <= 0) throw new Error("Amount must be a positive number");

      if (!currency) currency = "INR";

      // Idempotency check: if request with same key already exists, return cached result
      if (idempotencyKey) {
        const existing = await PaymentModel.findOne({ idempotencyKey, userId });
        if (existing) {
          this.logInfo(`Idempotent request detected for key: ${idempotencyKey}. Returning cached payment.`);
          return {
            success: true,
            data: {
              orderId: existing.razorpayOrderId || existing.orderId,
              amount: existing.amount,
              currency: existing.currency,
              referenceId: existing.referenceId,
              status: existing.status,
              razorpayKey: config.razorpay.key_id,
              isDuplicate: true,
              message: "This payment order was already created. Using cached order."
            },
          };
        }
      } else {
        // Generate a unique idempotency key if not provided
        idempotencyKey = `idempotent_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      const amountInPaise = amtNum * 100;

      if (!razorpay) throw new Error("Razorpay not configured properly");

      const razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency,
        receipt: `receipt_${Date.now()}`,
        notes: { description, userId, providerId, serviceType, idempotencyKey },
      });

      const referenceId = `PAY_${userId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      const paymentDoc = await PaymentModel.create({
        userId,
        providerId,
        orderId: razorpayOrder.id,
        razorpayOrderId: razorpayOrder.id,
        amount: amtNum,
        currency,
        status: "pending",
        paymentMethod: "Payment Not Done",
        referenceId,
        serviceType,
        notes: description,
        idempotencyKey,
        history: [{ status: "pending" }],
      });

      // Invalidate payment history cache for this user
      await cacheService.invalidatePaymentHistoryCache(userId);

      this.logInfo(`New payment created with idempotency key: ${idempotencyKey}`);

      return {
        success: true,
        data: {
          orderId: razorpayOrder.id,
          amount: amtNum,
          currency,
          referenceId,
          status: paymentDoc.status,
          razorpayKey: config.razorpay.key_id,
          idempotencyKey: idempotencyKey
        },
      };
    } catch (error) {
      this.logError("PaymentService.createPayment failed", error);
      throw error;
    }
  }

  /**
   * Verify Razorpay payment signature
   */
 async verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    try {
      if (!razorpayOrderId || !razorpayPaymentId) {
        throw new Error("Order ID or Payment ID missing");
      }

      if (!razorpaySignature) {
        throw new Error("Razorpay signature missing");
      }
const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)  // backticks!
    .digest("hex");

        
    this.logInfo("Generated:", generatedSignature, "Received:", razorpaySignature);
      return generatedSignature === razorpaySignature;
    } catch (error) {
      this.logError("PaymentService.verifyPaymentSignature failed", error);
      throw error;
    }
  }

  /**
   * Update payment status in the database
   */
  async updatePaymentStatus(referenceId, newStatus, razorpayPaymentMethod, razorpayPaymentId, razorpaySignature) {
    if (!referenceId) throw new Error("Reference ID is required");
    if (!newStatus) throw new Error("New status is required");

    const payment = await PaymentModel.findOne({ referenceId });
    if (!payment) throw new Error("Payment not found");

    payment.status = newStatus;
    if (razorpayPaymentMethod) payment.paymentMethod = razorpayPaymentMethod;
    if (razorpayPaymentId) payment.razorpayPaymentId = razorpayPaymentId;
    if (razorpaySignature) payment.razorpaySignature = razorpaySignature;

    payment.history.push({ status: newStatus });
    await payment.save();

    // Invalidate payment history cache after status update
    await cacheService.invalidatePaymentHistoryCache(payment.userId);

    return payment;
  }

  /**
   * Get payment status by reference ID
  */
  async getPaymentStatus(referenceId) {
    if (!referenceId) throw new Error("Reference ID is required");

    const projection = {
      userId: 1,
      providerId: 1,
      serviceType: 1,
      amount: 1,
      paymentGateway: 1,
      paymentMethod: 1,
      notes: 1,
      createdAt: 1,
      updatedAt: 1,
      status: 1,
      referenceId: 1,
    };

    return await PaymentModel.findOne({ referenceId }, projection).select("-__v");
  }

 async getPaymentHistory(userId, count = 10, skip = 0) {
  try {
    if (!userId) throw new Error("UserId is not provided");

    // Check cache first
    const cachedHistory = await cacheService.getPaymentHistoryCache(userId);
    if (cachedHistory) {
      // Return cached data with pagination applied on client side
      return cachedHistory.slice(skip, skip + count);
    }

    // Cache miss - fetch from database
    const payments = await PaymentModel.find({ userId })
      .sort({ createdAt: -1 })
      .select("history referenceId status createdAt razorpayOrderId amount")
      .lean();

    // Store in cache for future requests
    await cacheService.setPaymentHistoryCache(userId, payments);

    // Return paginated results
    return payments.slice(skip, skip + count);
  } catch (error) {
    this.logError("Fetching Payment History Failed!", error);
    throw error;
  }
}
  /**
   * Update payment using Razorpay Webhook event
   * This will:
   *  - Check if event ID was already processed (prevent duplicates)
   *  - Find payment by razorpayOrderId (order_id from Razorpay)
   *  - Map Razorpay status -> our internal status
   *  - Update paymentMethod, razorpayPaymentId, refundStatus
   *  - Push new entry into history[]
   */
  async updatePaymentFromWebhook(eventPayload) {
    try {
      if (!eventPayload || !eventPayload.payload) {
        throw new Error("Invalid Razorpay webhook payload");
      }

      const eventId = eventPayload.id; // Unique webhook event ID from Razorpay
      const event = eventPayload.event; // e.g. "payment.captured"
      const paymentEntity = eventPayload.payload?.payment?.entity;

      if (!paymentEntity) {
        throw new Error("Payment entity missing in webhook payload");
      }

      // Check if this event has already been processed (prevent duplicates)
      const isDuplicate = await cacheService.isWebhookEventProcessed(eventId);
      if (isDuplicate) {
        this.logWarn(`Duplicate webhook event ignored: ${eventId}`);
        return { success: true, isDuplicate: true, message: "Duplicate event ignored" };
      }

      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;
      const razorpayStatus = paymentEntity.status; // created/authorized/captured/failed/refunded
      const paymentMethod = paymentEntity.method || "Payment Not Done";

      if (!razorpayOrderId) {
        throw new Error("order_id missing in Razorpay webhook payload");
      }

      // Map Razorpay status -> your internal status
      let newStatus = "pending";
      let refundStatus = undefined;

      switch (razorpayStatus) {
        case "captured":
          newStatus = "success";
          break;
        case "failed":
          newStatus = "failed";
          break;
        case "refunded":
          newStatus = "refunded";
          refundStatus = "completed";
          break;
        default:
          // created, authorized, etc.
          newStatus = "pending";
          break;
      }

      // Find payment by razorpayOrderId
      const payment = await PaymentModel.findOne({ razorpayOrderId });

      if (!payment) {
        this.logError("Webhook: Payment not found for razorpayOrderId:", razorpayOrderId);
        // Mark as processed even if payment not found (no point retrying)
        await cacheService.markWebhookEventProcessed(eventId);
        return null;
      }

      // Update main fields
      payment.status = newStatus;
      payment.razorpayPaymentId = razorpayPaymentId;

      // Only set paymentMethod if it fits your enum
      if (["card", "netbanking", "upi", "wallet", "emandate"].includes(paymentMethod)) {
        payment.paymentMethod = paymentMethod;
      }

      if (refundStatus) {
        payment.refundStatus = refundStatus;
      }

      // Add to history
      payment.history.push({
        status: newStatus,
        updatedAt: new Date(),
      });

      await payment.save();

      // Mark event as processed after successful update
      await cacheService.markWebhookEventProcessed(eventId);

      // Invalidate payment history cache after webhook update
      await cacheService.invalidatePaymentHistoryCache(payment.userId);

      this.logInfo("Webhook: Payment updated from Razorpay:", {
        eventId,
        razorpayOrderId,
        razorpayPaymentId,
        newStatus,
      });

      return { success: true, payment, eventId };
    } catch (error) {
      this.logError("PaymentService.updatePaymentFromWebhook failed", error);
      throw error;
    }
  }


}

export default new PaymentService();
