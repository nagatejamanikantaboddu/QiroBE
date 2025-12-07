import Master from '../../config/Master.class.js';
import UserService from './Users.Service.js';
import ApiError from '../../config/APIError.js';

class UserController extends Master {
    constructor() {
        super();
        Object.freeze(this);
    }

    // Create a new user
    async addUser(req, res) {
        try {
            const response = await UserService.signUp(req.body);
            res.status(this.HTTP_STATUS.CREATED).json(response);
        } catch (error) {
            this.logError("Error adding user:", error);
            if (error instanceof ApiError) {
                res.status(error.statusCode).json({ error: error.message });
            } else {
                res.status(this.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                    error: "Internal Server Error",
                    message: error.message
                });
            }
        }
    }

    // Login existing user
    async loginUser(req, res) {
        try {
            const response = await UserService.loginUser(req.body);
            res.status(this.HTTP_STATUS.ACCEPTED).json({
                success: true,
                token: response.token,
                user: response.user
            });
        } catch (error) {
            this.logError("Error logging in user:", error);
            if (error instanceof ApiError) {
                res.status(error.statusCode).json({ error: error.message });
            } else {
                res.status(this.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                    error: "Internal Server Error",
                    message: error.message
                });
            }
        }
    }

    // Verify user
    async verifyUser(req, res) {
        try {
            this.logInfo("UserService: inside verify user");
            const response = await UserService.verifyUser(req.body, req.user._id);
            res.status(this.HTTP_STATUS.ACCEPTED).json(response);
        } catch (error) {
            this.logError("Error verifying user:", error);
            if (error instanceof ApiError) {
                res.status(error.statusCode).json({ error: error.message });
            } else {
                res.status(this.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                    error: "Internal Server Error",
                    message: error.message
                });
            }
        }
    }

    // Update user
    async updateUser(req, res) {
        try {
            this.logInfo("UserController: inside updateUser");
            const response = await UserService.updateUser(req.user._id, req.body);

            res.status(this.HTTP_STATUS.OK).json({
                success: true,
                message: 'Successfully updated!'
            });
        } catch (error) {
            this.logError("Error updating user:", error);
            if (error instanceof ApiError) {
                res.status(error.statusCode).json({ error: error.message });
            } else {
                res.status(this.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                    error: "Internal Server Error",
                    message: error.message
                });
            }
        }
    }

    


}

export default new UserController();
