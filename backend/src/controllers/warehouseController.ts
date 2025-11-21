import { Response } from 'express';
import prisma from '../config/database';
import { TenantRequest } from '../middleware/tenantMiddleware';
import { logError, isZodError } from '../utils/errorHandler';
import { z } from 'zod';

const warehouseSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  address: z.string().optional(),
  contact: z.string().optional(),
  phone: z.string().optional(),
  managerId: z.string().optional(),
});

const locationSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  zone: z.string().optional(),
  aisle: z.string().optional(),
  shelf: z.string().optional(),
  position: z.string().optional(),
  capacity: z.number().optional(),
});

export const warehouseController = {
  // 获取仓库列表
  async list(req: TenantRequest, res: Response) {
    try {
      const { page = 1, pageSize = 20, status } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);
      const take = Number(pageSize);

      const where: any = { tenantId: req.tenantId! };
      if (status) {
        where.status = status;
      }

      const [warehouses, total] = await Promise.all([
        prisma.warehouse.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.warehouse.count({ where }),
      ]);

      res.json({
        data: warehouses,
        pagination: {
          page: Number(page),
          pageSize: Number(pageSize),
          total,
          totalPages: Math.ceil(total / take),
        },
      });
    } catch (error) {
      logError('List warehouses error', error);
      res.status(500).json({ error: 'Failed to list warehouses' });
    }
  },

  // 创建仓库
  async create(req: TenantRequest, res: Response) {
    try {
      const data = warehouseSchema.parse(req.body);

      // 检查编码是否已存在
      const existing = await prisma.warehouse.findUnique({
        where: {
          tenantId_code: {
            tenantId: req.tenantId!,
            code: data.code,
          },
        },
      });

      if (existing) {
        return res.status(400).json({ error: 'Warehouse code already exists' });
      }

      const warehouse = await prisma.warehouse.create({
        data: {
          ...data,
          tenantId: req.tenantId!,
        },
      });

      res.status(201).json(warehouse);
    } catch (error) {
      logError('Create warehouse error', error);
      if (isZodError(error)) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create warehouse' });
    }
  },

  // 获取仓库详情
  async getById(req: TenantRequest, res: Response) {
    try {
      const { id } = req.params;

      const warehouse = await prisma.warehouse.findFirst({
        where: {
          id,
          tenantId: req.tenantId!,
        },
        include: {
          locations: true,
        },
      });

      if (!warehouse) {
        return res.status(404).json({ error: 'Warehouse not found' });
      }

      res.json(warehouse);
    } catch (error) {
      logError('Get warehouse error', error);
      res.status(500).json({ error: 'Failed to get warehouse' });
    }
  },

  // 更新仓库
  async update(req: TenantRequest, res: Response) {
    try {
      const { id } = req.params;
      const data = warehouseSchema.partial().parse(req.body);

      const warehouse = await prisma.warehouse.updateMany({
        where: {
          id,
          tenantId: req.tenantId!,
        },
        data,
      });

      if (warehouse.count === 0) {
        return res.status(404).json({ error: 'Warehouse not found' });
      }

      const updated = await prisma.warehouse.findUnique({
        where: { id },
      });

      res.json(updated);
    } catch (error) {
      logError('Update warehouse error', error);
      if (isZodError(error)) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to update warehouse' });
    }
  },

  // 删除仓库
  async delete(req: TenantRequest, res: Response) {
    try {
      const { id } = req.params;

      const warehouse = await prisma.warehouse.deleteMany({
        where: {
          id,
          tenantId: req.tenantId!,
        },
      });

      if (warehouse.count === 0) {
        return res.status(404).json({ error: 'Warehouse not found' });
      }

      res.json({ message: 'Warehouse deleted successfully' });
    } catch (error) {
      logError('Delete warehouse error', error);
      res.status(500).json({ error: 'Failed to delete warehouse' });
    }
  },

  // 获取库位列表
  async listLocations(req: TenantRequest, res: Response) {
    try {
      const { warehouseId } = req.params;
      const { page = 1, pageSize = 50, status } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);
      const take = Number(pageSize);

      // 验证仓库属于当前租户
      const warehouse = await prisma.warehouse.findFirst({
        where: {
          id: warehouseId,
          tenantId: req.tenantId!,
        },
      });

      if (!warehouse) {
        return res.status(404).json({ error: 'Warehouse not found' });
      }

      const where: any = { warehouseId };
      if (status) {
        where.status = status;
      }

      const [locations, total] = await Promise.all([
        prisma.location.findMany({
          where,
          skip,
          take,
          orderBy: { code: 'asc' },
        }),
        prisma.location.count({ where }),
      ]);

      res.json({
        data: locations,
        pagination: {
          page: Number(page),
          pageSize: Number(pageSize),
          total,
          totalPages: Math.ceil(total / take),
        },
      });
    } catch (error) {
      logError('List locations error', error);
      res.status(500).json({ error: 'Failed to list locations' });
    }
  },

  // 创建库位
  async createLocation(req: TenantRequest, res: Response) {
    try {
      const { warehouseId } = req.params;
      const data = locationSchema.parse(req.body);

      // 验证仓库属于当前租户
      const warehouse = await prisma.warehouse.findFirst({
        where: {
          id: warehouseId,
          tenantId: req.tenantId!,
        },
      });

      if (!warehouse) {
        return res.status(404).json({ error: 'Warehouse not found' });
      }

      // 检查编码是否已存在
      const existing = await prisma.location.findUnique({
        where: {
          warehouseId_code: {
            warehouseId,
            code: data.code,
          },
        },
      });

      if (existing) {
        return res.status(400).json({ error: 'Location code already exists' });
      }

      const location = await prisma.location.create({
        data: {
          ...data,
          warehouseId,
        },
      });

      res.status(201).json(location);
    } catch (error) {
      logError('Create location error', error);
      if (isZodError(error)) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create location' });
    }
  },

  // 更新库位
  async updateLocation(req: TenantRequest, res: Response) {
    try {
      const { id } = req.params;
      const data = locationSchema.partial().parse(req.body);

      // 验证库位所属仓库属于当前租户
      const location = await prisma.location.findFirst({
        where: { id },
        include: { warehouse: true },
      });

      if (!location || location.warehouse.tenantId !== req.tenantId!) {
        return res.status(404).json({ error: 'Location not found' });
      }

      const updated = await prisma.location.update({
        where: { id },
        data,
      });

      res.json(updated);
    } catch (error) {
      logError('Update location error', error);
      if (isZodError(error)) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to update location' });
    }
  },

  // 删除库位
  async deleteLocation(req: TenantRequest, res: Response) {
    try {
      const { id } = req.params;

      // 验证库位所属仓库属于当前租户
      const location = await prisma.location.findFirst({
        where: { id },
        include: { warehouse: true },
      });

      if (!location || location.warehouse.tenantId !== req.tenantId!) {
        return res.status(404).json({ error: 'Location not found' });
      }

      await prisma.location.delete({
        where: { id },
      });

      res.json({ message: 'Location deleted successfully' });
    } catch (error) {
      logError('Delete location error', error);
      res.status(500).json({ error: 'Failed to delete location' });
    }
  },
};

