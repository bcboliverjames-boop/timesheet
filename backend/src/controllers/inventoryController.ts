import { Response } from 'express';
import prisma from '../config/database';
import { TenantRequest } from '../middleware/tenantMiddleware';
import { logError } from '../utils/errorHandler';

export const inventoryController = {
  // 获取库存列表
  async list(req: TenantRequest, res: Response) {
    try {
      const { page = 1, pageSize = 50, warehouseId, productId, keyword } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);
      const take = Number(pageSize);

      const where: any = { tenantId: req.tenantId! };
      
      if (warehouseId) {
        where.warehouseId = warehouseId;
      }
      
      if (productId) {
        where.productId = productId;
      }

      const [inventory, total] = await Promise.all([
        prisma.inventory.findMany({
          where,
          skip,
          take,
          include: {
            warehouse: {
              select: { id: true, name: true, code: true },
            },
            product: {
              select: { id: true, sku: true, name: true, unit: true },
            },
            location: {
              select: { id: true, code: true, name: true },
            },
          },
          orderBy: { lastUpdated: 'desc' },
        }),
        prisma.inventory.count({ where }),
      ]);

      // 如果有关键词，过滤结果
      let filtered = inventory;
      if (keyword) {
        const keywordStr = (keyword as string).toLowerCase();
        filtered = inventory.filter(
          (item: typeof inventory[0]) =>
            item.product.sku.toLowerCase().includes(keywordStr) ||
            item.product.name.toLowerCase().includes(keywordStr)
        );
      }

      res.json({
        data: filtered,
        pagination: {
          page: Number(page),
          pageSize: Number(pageSize),
          total,
          totalPages: Math.ceil(total / take),
        },
      });
    } catch (error) {
      logError('List inventory error', error);
      res.status(500).json({ error: 'Failed to list inventory' });
    }
  },

  // 获取库存汇总
  async getSummary(req: TenantRequest, res: Response) {
    try {
      const { warehouseId } = req.query;

      const where: any = { tenantId: req.tenantId! };
      if (warehouseId) {
        where.warehouseId = warehouseId;
      }

      const [totalProducts, totalQuantity, lowStockCount] = await Promise.all([
        prisma.inventory.groupBy({
          by: ['productId'],
          where,
          _count: { productId: true },
        }).then((result: Array<{ productId: string; _count: { productId: number } }>) => result.length),
        
        prisma.inventory.aggregate({
          where,
          _sum: { quantity: true },
        }),
        
        prisma.inventory.count({
          where: {
            ...where,
            AND: [
              { minStock: { not: null } },
              {
                OR: [
                  { quantity: { lt: prisma.inventory.fields.minStock } },
                  { availableQty: { lt: prisma.inventory.fields.minStock } },
                ],
              },
            ],
          },
        }),
      ]);

      res.json({
        totalProducts,
        totalQuantity: totalQuantity._sum.quantity || 0,
        lowStockCount,
      });
    } catch (error) {
      logError('Get inventory summary error', error);
      res.status(500).json({ error: 'Failed to get inventory summary' });
    }
  },

  // 获取特定商品的库存
  async getByProduct(req: TenantRequest, res: Response) {
    try {
      const { warehouseId, productId } = req.params;

      const inventory = await prisma.inventory.findFirst({
        where: {
          tenantId: req.tenantId!,
          warehouseId,
          productId,
        },
        include: {
          warehouse: true,
          product: true,
          location: true,
        },
      });

      if (!inventory) {
        return res.status(404).json({ error: 'Inventory not found' });
      }

      res.json(inventory);
    } catch (error) {
      logError('Get inventory by product error', error);
      res.status(500).json({ error: 'Failed to get inventory' });
    }
  },

  // 库存调整
  async adjust(req: TenantRequest, res: Response) {
    try {
      const { warehouseId, productId, locationId, quantity, reason, remark } = req.body;

      if (!warehouseId || !productId || quantity === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // 查找或创建库存记录
      let inventory = await prisma.inventory.findFirst({
        where: {
          tenantId: req.tenantId!,
          warehouseId,
          productId,
          locationId: locationId || null,
        },
      });

      if (inventory) {
        // 更新库存
        inventory = await prisma.inventory.update({
          where: { id: inventory.id },
          data: {
            quantity: quantity,
            availableQty: quantity - inventory.reservedQty,
            lastUpdated: new Date(),
          },
        });
      } else {
        // 创建库存记录
        inventory = await prisma.inventory.create({
          data: {
            tenantId: req.tenantId!,
            warehouseId,
            productId,
            locationId: locationId || null,
            quantity: quantity,
            availableQty: quantity,
          },
        });
      }

      // TODO: 记录库存调整日志

      res.json(inventory);
    } catch (error) {
      logError('Adjust inventory error', error);
      res.status(500).json({ error: 'Failed to adjust inventory' });
    }
  },

  // 获取库存预警
  async getAlerts(req: TenantRequest, res: Response) {
    try {
      const { warehouseId } = req.query;

      const where: any = {
        tenantId: req.tenantId!,
        minStock: { not: null },
      };
      
      if (warehouseId) {
        where.warehouseId = warehouseId;
      }

      const lowStockItems = await prisma.inventory.findMany({
        where: {
          ...where,
          OR: [
            { quantity: { lt: prisma.inventory.fields.minStock } },
            { availableQty: { lt: prisma.inventory.fields.minStock } },
          ],
        },
        include: {
          warehouse: {
            select: { id: true, name: true, code: true },
          },
          product: {
            select: { id: true, sku: true, name: true, unit: true },
          },
          location: {
            select: { id: true, code: true, name: true },
          },
        },
        orderBy: { lastUpdated: 'desc' },
      });

      res.json({ data: lowStockItems, count: lowStockItems.length });
    } catch (error) {
      logError('Get inventory alerts error', error);
      res.status(500).json({ error: 'Failed to get inventory alerts' });
    }
  },
};

