import { Response } from 'express';
import prisma from '../config/database';
import { TenantRequest } from '../middleware/tenantMiddleware';
import { logError } from '../utils/errorHandler';

export const outboundController = {
  // 获取出库单列表
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
        prisma.outboundOrder.findMany({
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
        prisma.outboundOrder.count({ where }),
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
      logError('List outbound orders error', error);
      res.status(500).json({ error: 'Failed to list outbound orders' });
    }
  },

  // 创建出库单
  async create(req: TenantRequest, res: Response) {
    try {
      const { warehouseId, type, customerId, orderRef, expectedDate, items, remark } = req.body;

      if (!warehouseId || !type || !items || items.length === 0) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // 验证库存是否足够
      for (const item of items) {
        const inventory = await prisma.inventory.findFirst({
          where: {
            tenantId: req.tenantId!,
            warehouseId,
            productId: item.productId,
            locationId: item.locationId || null,
          },
        });

        if (!inventory || inventory.availableQty < item.requestedQty) {
          return res.status(400).json({
            error: `Insufficient inventory for product ${item.productId}`,
          });
        }
      }

      // 生成出库单号
      const orderNo = `OUT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const order = await prisma.outboundOrder.create({
        data: {
          tenantId: req.tenantId!,
          orderNo,
          warehouseId,
          type,
          customerId,
          orderRef,
          expectedDate: expectedDate ? new Date(expectedDate) : null,
          createdBy: req.userId!,
          remark,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              locationId: item.locationId,
              requestedQty: item.requestedQty,
              batchNo: item.batchNo,
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

      // 预留库存
      await prisma.$transaction(
        items.map((item: any) =>
          prisma.inventory.updateMany({
            where: {
              tenantId: req.tenantId!,
              warehouseId,
              productId: item.productId,
              locationId: item.locationId || null,
            },
            data: {
              reservedQty: {
                increment: item.requestedQty,
              },
              availableQty: {
                decrement: item.requestedQty,
              },
            },
          })
        )
      );

      res.status(201).json(order);
    } catch (error) {
      logError('Create outbound order error', error);
      res.status(500).json({ error: 'Failed to create outbound order' });
    }
  },

  // 获取出库单详情
  async getById(req: TenantRequest, res: Response) {
    try {
      const { id } = req.params;

      const order = await prisma.outboundOrder.findFirst({
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
        return res.status(404).json({ error: 'Outbound order not found' });
      }

      res.json(order);
    } catch (error) {
      logError('Get outbound order error', error);
      res.status(500).json({ error: 'Failed to get outbound order' });
    }
  },

  // 更新出库单
  async update(req: TenantRequest, res: Response) {
    try {
      const { id } = req.params;
      const { expectedDate, remark } = req.body;

      // 只能更新待审核状态的订单
      const order = await prisma.outboundOrder.findFirst({
        where: {
          id,
          tenantId: req.tenantId!,
          status: 'PENDING',
        },
      });

      if (!order) {
        return res.status(404).json({ error: 'Outbound order not found or cannot be updated' });
      }

      const updated = await prisma.outboundOrder.update({
        where: { id },
        data: {
          expectedDate: expectedDate ? new Date(expectedDate) : undefined,
          remark,
        },
      });

      res.json(updated);
    } catch (error) {
      logError('Update outbound order error', error);
      res.status(500).json({ error: 'Failed to update outbound order' });
    }
  },

  // 删除出库单
  async delete(req: TenantRequest, res: Response) {
    try {
      const { id } = req.params;

      // 只能删除待审核状态的订单，并释放预留库存
      const order = await prisma.outboundOrder.findFirst({
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
        return res.status(404).json({ error: 'Outbound order not found or cannot be deleted' });
      }

      await prisma.$transaction(async (tx: typeof prisma) => {
        // 释放预留库存
        for (const item of order.items) {
          await tx.inventory.updateMany({
            where: {
              tenantId: req.tenantId!,
              warehouseId: order.warehouseId,
              productId: item.productId,
              locationId: item.locationId || null,
            },
            data: {
              reservedQty: {
                decrement: item.requestedQty,
              },
              availableQty: {
                increment: item.requestedQty,
              },
            },
          });
        }

        // 删除出库单
        await tx.outboundOrder.delete({
          where: { id },
        });
      });

      res.json({ message: 'Outbound order deleted successfully' });
    } catch (error) {
      logError('Delete outbound order error', error);
      res.status(500).json({ error: 'Failed to delete outbound order' });
    }
  },

  // 审核出库单
  async approve(req: TenantRequest, res: Response) {
    try {
      const { id } = req.params;

      const order = await prisma.outboundOrder.findFirst({
        where: {
          id,
          tenantId: req.tenantId!,
          status: 'PENDING',
        },
      });

      if (!order) {
        return res.status(404).json({ error: 'Outbound order not found or cannot be approved' });
      }

      const updated = await prisma.outboundOrder.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedBy: req.userId!,
        },
      });

      res.json(updated);
    } catch (error) {
      logError('Approve outbound order error', error);
      res.status(500).json({ error: 'Failed to approve outbound order' });
    }
  },

  // 完成出库
  async complete(req: TenantRequest, res: Response) {
    try {
      const { id } = req.params;
      const { items } = req.body; // 实际出库数量

      const order = await prisma.outboundOrder.findFirst({
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
        return res.status(404).json({ error: 'Outbound order not found or cannot be completed' });
      }

      // 更新出库单状态和库存
      await prisma.$transaction(async (tx: typeof prisma) => {
        // 更新出库单明细
        for (const item of items) {
          await tx.outboundItem.update({
            where: { id: item.id },
            data: {
              shippedQty: item.shippedQty,
            },
          });

          // 更新库存（扣减实际出库数量）
          await tx.inventory.updateMany({
            where: {
              tenantId: req.tenantId!,
              warehouseId: order.warehouseId,
              productId: item.productId,
              locationId: item.locationId || null,
            },
            data: {
              quantity: {
                decrement: item.shippedQty,
              },
              reservedQty: {
                decrement: item.shippedQty,
              },
              // availableQty 在预留时已经扣减，这里不需要再减
              lastUpdated: new Date(),
            },
          });
        }

        // 更新出库单状态
        await tx.outboundOrder.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            shippedDate: new Date(),
          },
        });
      });

      const updated = await prisma.outboundOrder.findUnique({
        where: { id },
        include: {
          items: true,
        },
      });

      res.json(updated);
    } catch (error) {
      logError('Complete outbound order error', error);
      res.status(500).json({ error: 'Failed to complete outbound order' });
    }
  },
};

