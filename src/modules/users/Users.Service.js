
import config from "../../config/config.js";
import Master from "../../config/Master.class.js";
import { userModel } from "./Users.model.js";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import cacheService from '../../services/cacheService.js'

/***
 * @module userService
 * description: contains all the logic related to user login signup 
 */
class UsersService extends Master {
    constructor() {
        super()
        Object.freeze(this);
    }
    async signUp(userObj) {
        try {
            this.logger.info("UserService: Inside signUp Method");

            if (userObj.password !== userObj.confirmPassword) {
                throw this.API_ERROR(this.HTTP_STATUS.BAD_REQUEST, 'Password and confirm password do not match');
            }

            const existingUser = await userModel.findOne({ mobileNumber: userObj.mobileNumber, type: userObj.type });
            if (existingUser) {
                throw this.API_ERROR(this.HTTP_STATUS.BAD_REQUEST, 'User account already exists!');
            }

            const hashedPassword = bcrypt.hashSync(userObj.password, 10);
            userObj.password = hashedPassword;

            const refreshToken = jwt.sign(
                { mobileNumber: userObj.mobileNumber, type: userObj.type },
                config.JWT_SECRET,
                { expiresIn: '30d' }
            );
            userObj.refreshToken = refreshToken;

            const newUser = await userModel.create(userObj);
            return newUser;
        } catch (error) {
            this.logError("UserService: Error in signUp", error);
            throw error;
        }
    }
    async loginUser(loginDetails) {
        try {
            this.logger.info("UserService: Inside login Method");
            const user = await userModel.findOne({ email: loginDetails.email });
            if (!user) {
                throw this.API_ERROR(this.HTTP_STATUS.UNAUTHORIZED, 'Invalid credentials');
            }
            const isPasswordValid = bcrypt.compareSync(loginDetails.password, user.password);
            if (!isPasswordValid) {
                throw this.API_ERROR(this.HTTP_STATUS.UNAUTHORIZED, 'Invalid credentials');
            }
            const token = jwt.sign({ userId: user._id, type: user.type },
                config.JWT_SECRET,
                { expiresIn: config.tokenExpiry },
                { algorithm: 'RS256' });

            const userResponse = {
                _id: user._id,
                email: user.email,
                type: user.type,
                name: user.name
            };

            // Cache user data in Redis
            await cacheService.setUserCache(user._id.toString(), userResponse);
            
            // Cache session data with token
            await cacheService.setSessionCache(user._id.toString(), {
                token,
                login_time: new Date().toISOString(),
                email: user.email
            });

            return { token, user: userResponse };
        } catch (error) {
            console.log(error)
            this.logError("UserService: Error in login", error);
            throw error;
        }
    }
    async generateRandomUsername(length = 8) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let username = '';

        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            username += characters.charAt(randomIndex);
        }

        return username;
    }

    async verifyUser(payload, userId) {
        try {
            const updateFields = {};

            if (typeof payload.isEmailVerified === 'boolean') {
                updateFields.isEmailVerified = payload.isEmailVerified;
            }

            if (typeof payload.isMobileVerified === 'boolean') {
                updateFields.isMobileNumberVerified = payload.isMobileVerified;
            }

            if (Object.keys(updateFields).length === 0) {
                throw this.API_ERROR(this.HTTP_STATUS.BAD_REQUEST, 'No valid fields to update.');
            }

            const updatedUser = await userModel.findByIdAndUpdate(userId, updateFields, { new: true });

            if (!updatedUser) {
                throw this.API_ERROR(this.HTTP_STATUS.NOT_FOUND, 'User not found.');
            }

            return { success: true, message: "email and mobile verified successfully  !" };
        } catch (error) {
            this.logError("UserService: Error in verifyEmailAndMobile", error);
            throw error;
        }
    }



async updateUser(userId, updateData) {
  try {
    const user = await userModel.findById(userId);

    if (!user) {
      throw this.API_ERROR(this.HTTP_STATUS.NOT_FOUND, 'User not found!');
    }

    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { name: updateData.name },
      { new: true }
    ).select('-password -token -refreshToken');

    // Invalidate user cache after update
    await cacheService.invalidateUserCache(userId.toString());

    return { success: true, data: updatedUser };
  } catch (error) {
    this.logError("UserService: Error in updateUser", error);
    throw error;
  }
}



}

export default new UsersService()