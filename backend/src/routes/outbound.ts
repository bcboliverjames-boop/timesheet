import express from 'express';
import { outboundController } from '../controllers/outboundController';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';

const router = express.Router();

// 所有出库管理接口都需要认证和租户中间件
router.use(authMiddleware);
router.use(tenantMiddleware);

router.get('/', outboundController.list);
router.post('/', outboundController.create);
router.get('/:id', outboundController.getById);
router.put('/:id', outboundController.update);
router.delete('/:id', outboundController.delete);
router.post('/:id/approve', outboundController.approve);
router.post('/:id/complete', outboundController.complete);

export default router;

