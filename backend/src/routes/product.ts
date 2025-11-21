import express from 'express';
import { productController } from '../controllers/productController';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';

const router = express.Router();

// 所有商品管理接口都需要认证和租户中间件
router.use(authMiddleware);
router.use(tenantMiddleware);

router.get('/', productController.list);
router.post('/', productController.create);
router.get('/:id', productController.getById);
router.put('/:id', productController.update);
router.delete('/:id', productController.delete);
router.post('/batch', productController.batchCreate);

export default router;

