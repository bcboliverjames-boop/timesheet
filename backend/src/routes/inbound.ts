import express from 'express';
import { inboundController } from '../controllers/inboundController';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';

const router = express.Router();

// 所有入库管理接口都需要认证和租户中间件
router.use(authMiddleware);
router.use(tenantMiddleware);

router.get('/', inboundController.list);
router.post('/', inboundController.create);
router.get('/:id', inboundController.getById);
router.put('/:id', inboundController.update);
router.delete('/:id', inboundController.delete);
router.post('/:id/approve', inboundController.approve);
router.post('/:id/complete', inboundController.complete);

export default router;

