import { Response } from 'express';
import prisma from '../config/database';
import { TenantRequest } from '../middleware/tenantMiddleware';
import { logError } from '../utils/errorHandler';

export const inboundController = {
  // 获取入库单列表
  async list(req: TenantRequest, res: Response) {
    try {
      const { page = 1, pageSize = 20, status, warehouseId, type } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);
      const take = Number(pageSize);

      const where: any = { tenantId: req.tenantId! };
      
      if (status) {
        where.status = status;
      }
      
      if (warehouseId) {
        where.warehouseId = warehouseId;
      }
      
      if (type) {
        where.type = type;
      }

      const [orders, total] = await Promise.all([
        prisma.inboundOrder.findMany({
          where,
          skip,
          take,
          include: {
            items: {
              include: {
                product: {
                  select: { id: true, sku: true, name: true, unit: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.inboundOrder.count({ where }),
      ]);

      res.json({
        data: orders,
        pagination: {
          page: Number(page),
          pageSize: Number(pageSize),
          total,
          totalPages: Math.ceil(total / take),
        },
      });
    } catch (error) {
      logError('List inbound orders error', error);
      res.status(500).json({ error: 'Failed to list inbound orders' });
    }
  },

  // 创建入库单
  async create(req: TenantRequest, res: Response) {
    try {
      const { warehouseId, type, supplierId, orderRef, expectedDate, items, remark } = req.body;

      if (!warehouseId || !type || !items || items.length === 0) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // 生成入库单号
      const orderNo = `IN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const order = await prisma.inboundOrder.create({
        data: {
          tenantId: req.tenantId!,
          orderNo,
          warehouseId,
          type,
          supplierId,
          orderRef,
          expectedDate: expectedDate ? new Date(expectedDate) : null,
          createdBy: req.userId!,
          remark,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              locationId: item.locationId,
              expectedQty: item.expectedQty,
              unitPrice: item.unitPrice,
              batchNo: item.batchNo,
              expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
              remark: item.remark,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      res.status(201).json(order);
    } catch (error) {
      logError('Create inbound order error', error);
      res.status(500).json({ error: 'Failed to create inbound order' });
    }
  },

  // 获取入库单详情
  async getById(req: TenantRequest, res: Response) {
    try {
      const { id } = req.params;

      const order = await prisma.inboundOrder.findFirst({
        where: {
          id,
          tenantId: req.tenantId!,
        },
        include: {
          items: {
            include: {
              product: true,
              location: true,
            },
          },
          creator: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      if (!order) {
        return res.status(404).json({ error: 'Inbound order not found' });
      }

      res.json(order);
    } catch (error) {
      logError('Get inbound order error', error);
      res.status(500).json({ error: 'Failed to get inbound order' });
    }
  },

  // 更新入库单
  async update(req: TenantRequest, res: Response) {
    try {
      const { id } = req.params;
      const { expectedDate, remark } = req.body;

      // 只能更新待审核状态的订单
      const order = await prisma.inboundOrder.findFirst({
        where: {
          id,
          tenantId: req.tenantId!,
          status: 'PENDING',
        },
      });

      if (!order) {
        return res.status(404).json({ error: 'Inbound order not found or cannot be updated' });
      }

      const updated = await prisma.inboundOrder.update({
        where: { id },
        data: {
          expectedDate: expectedDate ? new Date(expectedDate) : undefined,
          remark,
        },
      });

      res.json(updated);
    } catch (error) {
      logError('Update inbound order error', error);
      res.status(500).json({ error: 'Failed to update inbound order' });
    }
  },

  // 删除入库单
  async delete(req: TenantRequest, res: Response) {
    try {
      const { id } = req.params;

      // 只能删除待审核状态的订单
      const order = await prisma.inboundOrder.findFirst({
        where: {
          id,
          tenantId: req.tenantId!,
          status: 'PENDING',
        },
      });

      if (!order) {
        return res.status(404).json({ error: 'Inbound order not found or cannot be deleted' });
      }

      await prisma.inboundOrder.delete({
        where: { id },
      });

      res.json({ message: 'Inbound order deleted successfully' });
    } catch (error) {
      logError('Delete inbound order error', error);
      res.status(500).json({ error: 'Failed to delete inbound order' });
    }
  },

  // 审核入库单
  async approve(req: TenantRequest, res: Response) {
    try {
      const { id } = req.params;

      const order = await prisma.inboundOrder.findFirst({
        where: {
          id,
          tenantId: req.tenantId!,
          status: 'PENDING',
        },
        include: {
          items: true,
        },
      });

      if (!order) {
        return res.status(404).json({ error: 'Inbound order not found or cannot be approved' });
      }

      const updated = await prisma.inboundOrder.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedBy: req.userId!,
        },
      });

      res.json(updated);
    } catch (error) {
      logError('Approve inbound order error', error);
      res.status(500).json({ error: 'Failed to approve inbound order' });
    }
  },

  // 完成入库
  async complete(req: TenantRequest, res: Response) {
    try {
      const { id } = req.params;
      const { items } = req.body; // 实际入库数量和库位信息

      const order = await prisma.inboundOrder.findFirst({
        where: {
          id,
          tenantId: req.tenantId!,
          status: { in: ['APPROVED', 'IN_PROGRESS'] },
        },
        include: {
          items: true,
        },
      });

      if (!order) {
        return res.status(404).json({ error: 'Inbound order not found or cannot be completed' });
      }

      // 更新入库单状态和入库明细
      await prisma.$transaction(async (tx: typeof prisma) => {
        // 更新入库单明细
        for (const item of items) {
          await tx.inboundItem.update({
            where: { id: item.id },
            data: {
              receivedQty: item.receivedQty,
              locationId: item.locationId,
            },
          });

          // 更新库存
          const inventory = await tx.inventory.findFirst({
            where: {
              tenantId: req.tenantId!,
              warehouseId: order.warehouseId,
              productId: item.productId,
              locationId: item.locationId || null,
            },
          });

          if (inventory) {
            await tx.inventory.update({
              where: { id: inventory.id },
              data: {
                quantity: inventory.quantity + item.receivedQty,
                availableQty: inventory.availableQty + item.receivedQty,
                lastUpdated: new Date(),
              },
            });
          } else {
            await tx.inventory.create({
              data: {
                tenantId: req.tenantId!,
                warehouseId: order.warehouseId,
                productId: item.productId,
                locationId: item.locationId || null,
                quantity: item.receivedQty,
                availableQty: item.receivedQty,
              },
            });
          }
        }

        // 更新入库单状态
        await tx.inboundOrder.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            receivedDate: new Date(),
          },
        });
      });

      const updated = await prisma.inboundOrder.findUnique({
        where: { id },
        include: {
          items: true,
        },
      });

      res.json(updated);
    } catch (error) {
      logError('Complete inbound order error', error);
      res.status(500).json({ error: 'Failed to complete inbound order' });
    }
  },
};

