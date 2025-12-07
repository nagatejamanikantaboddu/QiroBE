// const passport = require('passport');
import httpStatus from 'http-status';
import jwt from 'jsonwebtoken'
import { userModel } from '../modules/users/Users.model.js';
import cacheService from '../services/cacheService.js';
const ALLOWED_ROLES = ['PROVIDER', 'USER', 'ADMIN', 'LAB_ASSISTANT'];

export const authorize = (...requiredRoles) => async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Access denied. No token provided.' });
        }

        const token = authHeader.split(' ')[1];

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Invalid or expired token.' });
        }

        const { userId, type } = decoded;

        if (!ALLOWED_ROLES.includes(type)) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: `Invalid role '${type}' in token.` });
        }

        if (!requiredRoles.includes(type)) {
            return res.status(httpStatus.FORBIDDEN).json({ message: `Access denied for role: '${type}'.` });
        }

        // Check cache first
        let user = await cacheService.getUserCache(userId);
        
        if (user) {
            // Found in cache, use it
            req.user = user;
            next();
            return;
        }

        // Cache miss, fetch from database
        user = await userModel.findById(userId).select('-password');
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: 'User not found.' });
        }

        if (user.status === 'inactive' || user.deletedAt) {
            return res.status(httpStatus.FORBIDDEN).json({ message: 'User is inactive or deleted.' });
        }

        // Store user data in cache for future requests
        const userData = {
            _id: user._id,
            email: user.email,
            name: user.name,
            type: user.type,
            status: user.status,
            isEmailVerified: user.isEmailVerified,
            isMobileNumberVerified: user.isMobileNumberVerified
        };
        await cacheService.setUserCache(userId, userData);

        req.user = user;
        next();
    } catch (err) {
        console.error('Authorization Error:', err);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Authorization failed.' });
    }
};


