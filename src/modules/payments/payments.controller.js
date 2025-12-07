import Master from '../../config/Master.class.js';
import ApiError from '../../config/APIError.js';
import PaymentService from './payments.service.js';
import razorpay from '../../config/razorpay.config.js';
import crypto from 'crypto';

class PaymentController extends Master {
    constructor() {
        super();
        Object.freeze(this);
    }

    // ============================
    // Create Payment
    // ============================
    async createPayment(req, res) {
        try {
            this.logInfo("PaymentController: inside createPayment");

            const { amount, currency, description, providerId, serviceType, idempotencyKey } = req.body;
            const userId = req.user?.id;

            if (!userId) 
                throw new ApiError(this.HTTP_STATUS.BAD_REQUEST, "User ID not found");

            const response = await PaymentService.createPayment(
                amount,
                currency,
                description,
                userId,
                providerId,
                serviceType,
                idempotencyKey
            );

            // If it's a duplicate/cached payment, still return 200 OK (idempotent)
            const statusCode = response.data?.isDuplicate ? this.HTTP_STATUS.OK : this.HTTP_STATUS.CREATED;
            return res.status(statusCode).json(response);

        } catch (error) {
            this.logError("Error creating payment:", error);

            if (error instanceof ApiError) {
                return res.status(error.statusCode).json({ error: error.message });
            }

            return res.status(this.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                error: "Internal Server Error",
                message: error.message
            });
        }
    }

    // ============================
    // Verify Payment
    // ============================
    async verifyPayment(req, res) {
        try {
            this.logInfo("PaymentController: inside verifyPayment");

            const { razorpayOrderId, razorpayPaymentId, razorpaySignature, referenceId } = req.body;

            if (!referenceId)
                throw new ApiError(this.HTTP_STATUS.BAD_REQUEST, "Reference ID is required");

            const isValid = await PaymentService.verifyPaymentSignature({
                razorpayOrderId,
                razorpayPaymentId,
                razorpaySignature,
            });

            let paymentMethod = null;

            if (isValid) {
                const paymentInfo = await razorpay.payments.fetch(razorpayPaymentId);
                paymentMethod = paymentInfo?.method || null;
            }

            const status = isValid ? "success" : "failed";

            await PaymentService.updatePaymentStatus(
                referenceId,
                status,
                paymentMethod,
                razorpayPaymentId,
                razorpaySignature
            );

            return res.status(this.HTTP_STATUS.OK).json({
                success: isValid,
                message: isValid ? "Payment verified & updated" : "Invalid signature",
                paymentMethod
            });

        } catch (error) {
            this.logError("Error verifying payment:", error);

            if (error instanceof ApiError) {
                return res.status(error.statusCode).json({ error: error.message });
            }

            return res.status(this.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                error: "Internal Server Error",
                message: error.message
            });
        }
    }

    // ============================
    // Get Payment Status
    // ============================
    async getPaymentStatus(req, res) {
        try {
            this.logInfo("PaymentController: inside getPaymentStatus");

            const { referenceId } = req.params;

            if (!referenceId)
                throw new ApiError(this.HTTP_STATUS.BAD_REQUEST, "Reference ID is required");

            const paymentStatus = await PaymentService.getPaymentStatus(referenceId);

            if (!paymentStatus)
                throw new ApiError(this.HTTP_STATUS.NOT_FOUND, "Payment not found");

            return res.status(this.HTTP_STATUS.OK).json({
                success: true,
                data: paymentStatus
            });

        } catch (error) {
            this.logError("Error getting payment status:", error);

            if (error instanceof ApiError) {
                return res.status(error.statusCode).json({ error: error.message });
            }

            return res.status(this.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                error: "Internal Server Error",
                message: error.message
            });
        }
    }

    // ============================
    // Get Payment History
    // ============================
    async getPaymentHistory(req, res) {
        try {
            this.logInfo("PaymentController: inside getPaymentHistory");

            const { userId } = req.params;

            if (!userId)
                throw new ApiError(this.HTTP_STATUS.BAD_REQUEST, "User ID not found");

            const count = parseInt(req.params.count) || 10;
            const skip = parseInt(req.params.skip) || 0;

            const history = await PaymentService.getPaymentHistory(userId, count, skip);

            return res.status(this.HTTP_STATUS.OK).json({
                success: true,
                data: history || []
            });

        } catch (error) {
            this.logError("Error getting payment history:", error);

            if (error instanceof ApiError) {
                return res.status(error.statusCode).json({ error: error.message });
            }

            return res.status(this.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                error: "Internal Server Error",
                message: error.message
            });
        }
    }

    // ============================
    // Razorpay Webhook Handler
    // ============================
    async handleRazorpayWebhook(req, res) {
        try {
            this.logInfo("PaymentController: inside handleRazorpayWebhook");

            const webhookSecret = process.env.WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET;
            const signature = req.headers["x-razorpay-signature"];
            const rawBody = req.rawBody || JSON.stringify(req.body);

            const expected = crypto
                .createHmac("sha256", webhookSecret)
                .update(rawBody)
                .digest("hex");

            if (expected !== signature) {
                this.logError("Webhook signature mismatch");
                return res.status(this.HTTP_STATUS.BAD_REQUEST).send("Invalid signature");
            }

            const result = await PaymentService.updatePaymentFromWebhook(req.body);

            // Check if it was a duplicate event
            if (result?.isDuplicate) {
                this.logWarn(`Duplicate webhook received for event: ${req.body.id}`);
                return res.status(this.HTTP_STATUS.OK).json({ 
                    success: true, 
                    isDuplicate: true,
                    message: "Duplicate event ignored" 
                });
            }

            return res.status(this.HTTP_STATUS.OK).json({ success: true });

        } catch (error) {
            this.logError("Webhook Handler Error:", error);

            return res.status(this.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "Webhook received but failed to update DB"
            });
        }
    }
}

export default new PaymentController();
