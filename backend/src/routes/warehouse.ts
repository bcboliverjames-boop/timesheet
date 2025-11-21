import express from 'express';
import { warehouseController } from '../controllers/warehouseController';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';

const router = express.Router();

// 所有仓库管理接口都需要认证和租户中间件
router.use(authMiddleware);
router.use(tenantMiddleware);

// 仓库管理
router.get('/', warehouseController.list);
router.post('/', warehouseController.create);
router.get('/:id', warehouseController.getById);
router.put('/:id', warehouseController.update);
router.delete('/:id', warehouseController.delete);

// 库位管理
router.get('/:warehouseId/locations', warehouseController.listLocations);
router.post('/:warehouseId/locations', warehouseController.createLocation);
router.put('/locations/:id', warehouseController.updateLocation);
router.delete('/locations/:id', warehouseController.deleteLocation);

export default router;

