import joi from 'joi'
/**
 * signup a user
 */
const TEMP_EMAIL_DOMAINS = [
    'mailinator.com', 'tempmail.com', '10minutemail.com', 'guerrillamail.com',
    'dispostable.com', 'yopmail.com', 'getnada.com', 'throwawaymail.com'
];

const isNotTempEmail = (value, helpers) => {
    const domain = value.split('@')[1].toLowerCase();
    if (TEMP_EMAIL_DOMAINS.includes(domain)) {
        return helpers.error('any.invalid');
    }
    return value;
};
const userValidationSchema = {
    body: joi.object().keys({
        email: joi.string()
            .email()
            .required()
            .custom(isNotTempEmail, 'No temporary email allowed')
            .messages({
                'any.invalid': 'Temporary or disposable email addresses are not allowed'
            }),
        mobileNumber: joi.number().required().min(1111111111).max(9999999999),
        password: joi.string().required(),
        confirmPassword: joi.string().required(),
        name: joi.string().required(),
        countryCode: joi.string().required(),
        type: joi.string().required().valid('DOCTOR', 'USER', 'LAB_ASSISTANT')
    })
}

const login = {
    body: joi.object().keys({
        email: joi.string().required().regex(/^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/),
        password: joi.string().required(),
    })
}
const verify = {
    body: joi.object().keys({
        
        isEmailVerified: joi.boolean(),
        isMobileVerified: joi.boolean(),
    })
}

const updateUserProfile= {
  body: joi.object().keys({
    name: joi.string()
      .trim()
      .min(2)
      .max(50)
      .pattern(/^[A-Za-z\s]+$/) // Only letters and spaces
      .required()
      .messages({
        'string.base': 'Name must be a string',
        'string.empty': 'Name cannot be empty',
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name cannot exceed 50 characters',
        'string.pattern.base': 'Name can only contain letters and spaces',
        'any.required': 'Name is required'
      }),
  }).unknown(false)
};


export {
    userValidationSchema,
    login,
    verify,
    updateUserProfile
}