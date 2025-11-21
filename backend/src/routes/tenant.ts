import express from 'express';
import { tenantController } from '../controllers/tenantController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// 租户注册（公开）
router.post('/register', tenantController.register);

// 需要认证的路由
router.use(authMiddleware);
router.get('/info', tenantController.getTenantInfo);
router.put('/info', tenantController.updateTenantInfo);

export default router;

