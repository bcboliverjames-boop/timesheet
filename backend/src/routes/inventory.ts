import express from 'express';
import { inventoryController } from '../controllers/inventoryController';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';

const router = express.Router();

// 所有库存管理接口都需要认证和租户中间件
router.use(authMiddleware);
router.use(tenantMiddleware);

router.get('/', inventoryController.list);
router.get('/summary', inventoryController.getSummary);
router.get('/:warehouseId/products/:productId', inventoryController.getByProduct);
router.post('/adjust', inventoryController.adjust);
router.get('/alerts', inventoryController.getAlerts); // 库存预警

export default router;

