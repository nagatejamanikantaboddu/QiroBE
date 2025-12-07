import Joi from 'joi';

// ====== Create Payment Validation ======
const amountSchema = Joi.number()
  .integer()
  .positive()
  .required()
  .messages({
    "number.base": "Amount must be a number",
    "number.integer": "Amount must be an integer",
    "number.positive": "Amount must be positive",
    "any.required": "Amount field is required"
  });

const currencySchema = Joi.string()
  .valid("INR")
  .default("INR")
  .messages({
    "any.only": "Only INR is allowed"
  });

const providerIdSchema = Joi.string()
  .required()
  .messages({
    "string.base": "Provider ID must be a string",
    "any.required": "Provider ID field is required"
  });

const serviceTypeSchema = Joi.string()
  .valid("CONSULTATION")
  .default("CONSULTATION")
  .messages({
    "any.only": "Service type must be CONSULTATION"
  });

const paymentsValidationSchema = {
  body: Joi.object().keys({
    amount: amountSchema,
    currency: currencySchema,
    description: Joi.string()
      .allow("")
      .optional()
      .messages({ "string.base": "Description must be a string" }),
    providerId: providerIdSchema,
    serviceType: serviceTypeSchema,
    idempotencyKey: Joi.string()
      .max(100)
      .optional()
      .messages({ "string.base": "Idempotency Key must be a string" })
  })
};

// ====== Verify Payment Validation ======
const paymentVerifyValidation = {
  body: Joi.object().keys({
    razorpayOrderId: Joi.string()
      .required()
      .messages({
        "string.base": "Order ID must be a string",
        "any.required": "Order ID field is required"
      }),
    razorpayPaymentId: Joi.string()
      .required()
      .messages({
        "string.base": "Payment ID must be a string",
        "any.required": "Payment ID field is required"
      }),
    razorpaySignature: Joi.string()
      .required()
      .messages({
        "string.base": "Signature must be a string",
        "any.required": "Signature field is required"
      }),
    referenceId: Joi.string()
      .required()
      .messages({
        "string.base": "Reference ID must be a string",
        "any.required": "Reference ID field is required"
      })
  })
};

// ====== Payment Status Validation ======
const paymentStatusValidation = {
  params: Joi.object().keys({
    referenceId: Joi.string()
      .required()
      .messages({
        "string.base": "Reference ID must be a string",
        "any.required": "Reference ID field is required"
      })
  })
};

// ====== Payment History Validation ======
const paymentHistorySchema = {
  params: Joi.object().keys({
    userId: Joi.string()
      .required()
      .messages({
        "string.base": "User ID must be a string",
        "any.required": "User ID field is required"
      })
  })
};

export { paymentHistorySchema, paymentsValidationSchema, paymentVerifyValidation, paymentStatusValidation };
