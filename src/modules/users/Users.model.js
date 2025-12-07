import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
    },
    age: {
        type: Number,
        default: null
    },
    gender: {
        type: String,
        default: null,
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    countryCode: {
        type: String,
        required: true,
    },
    mobileNumber: {
        type: Number,
        required: true,
    },
    isMobileNumberVerified: {
        type: Boolean,
        default: false
    },
    password: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    token: {
        type: String,
    },
    refreshToken: {
        type: String
    },
    type: {
        type: String,
        enum: ['DOCTOR', 'USER'],
        required: true
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        default: 'ACTIVE',
        required: true
    }
});




const userModel = mongoose.model('users', userSchema);

export {
    userModel,
};
