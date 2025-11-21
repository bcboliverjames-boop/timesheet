import express from 'express';
import { authController } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// 公开路由
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);

// 需要认证的路由
router.use(authMiddleware);
router.get('/me', authController.getCurrentUser);
router.put('/profile', authController.updateProfile);
router.put('/password', authController.changePassword);

export default router;

