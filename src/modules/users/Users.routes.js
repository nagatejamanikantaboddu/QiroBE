import { Router } from 'express'
import catchAsync from "../../config/catchAsync.js"
import UserController from "./Users.controller.js"
import validate from '../../config/validation.js'
import { userValidationSchema, login, verify,updateUserProfile } from './Users.validations.js'
import { authorize } from '../../middlewares/Authforuser.middleware.js'

const router = Router()

/**
 * 
 * @ Signup 
 * @description : signing up a new user account
 * 
 */
router.post("/signup",
    validate(userValidationSchema),
    (req, res) => catchAsync(UserController.addUser(req, res)))
/**
 * 
 * @ signIn
 * @description : signing in a new user account
 * 
 */
router.post("/login",
    validate(login),
    (req, res) => catchAsync(UserController.loginUser(req, res)));

router.put("/verifyUser",
    authorize('USER'),
    validate(verify),
    (req, res) => catchAsync(UserController.verifyUser(req, res)));
/**
 * @ update
 * @description : updating user profile
 */
router.put("/updateUser",authorize('USER'),
validate(updateUserProfile),
(req,res) => catchAsync(UserController.updateUser(req,res)))


router.get("/", (req, res) => {
    res.json({ message: 'success' })
})

export default router