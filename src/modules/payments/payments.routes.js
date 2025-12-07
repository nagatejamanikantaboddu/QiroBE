import { Router } from "express";
import catchAsync from '../../config/catchAsync.js';
import validate from '../../config/validation.js';
import { authorize } from '../../middlewares/Auth.middleware.js';
import {paymentHistorySchema,paymentsValidationSchema,paymentStatusValidation,paymentVerifyValidation} from './payments.validations.js';
import paymentsController from "./payments.controller.js";

const router = Router();


// Create a new payment
router.post(
    '/create',
    authorize('USER'),
    validate(paymentsValidationSchema),
    (req, res) => catchAsync(paymentsController.createPayment(req, res))
);

// Verify a payment
router.post(
    '/verify',validate(paymentVerifyValidation),
    (req, res) => catchAsync(paymentsController.verifyPayment(req, res))
);

// Get payment status by referenceId
router.get(
    '/status/:referenceId',validate(paymentStatusValidation),
    authorize('USER'),
    (req, res) => catchAsync(paymentsController.getPaymentStatus(req, res))
);

//Get payment History of user
router.get('/paymenthistory/:userId',validate(paymentHistorySchema),
authorize('USER'),
(req,res) => catchAsync(paymentsController.getPaymentHistory(req,res)));

// Razorpay Webhook - for Razorpay servers only (no auth, no validation)
router.post(
    '/webhook/razorpay',
    (req, res) => catchAsync(paymentsController.handleRazorpayWebhook(req, res))
);



export default router;
