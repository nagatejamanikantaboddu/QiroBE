import Router from 'express';
import PaymentRoutes from '../../modules/payments/payments.routes.js';
import UserRoutes from '../../modules/users/Users.routes.js';

const router = Router();

// Payment routes
router.use('/payments', PaymentRoutes);
router.use('/user',UserRoutes);

export default router;
