import { Response } from 'express';
import prisma from '../config/database';
import { TenantRequest } from '../middleware/tenantMiddleware';
import { logError, isZodError } from '../utils/errorHandler';
import { z } from 'zod';

const productSchema = z.object({
  sku: z.string().min(1),
  barcode: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  unit: z.string().default('件'),
  specs: z.string().optional(),
  image: z.string().optional(),
});

export const productController = {
  // 获取商品列表
  async list(req: TenantRequest, res: Response) {
    try {
      const { page = 1, pageSize = 20, status, keyword, category } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);
      const take = Number(pageSize);

      const where: any = { tenantId: req.tenantId! };
      
      if (status) {
        where.status = status;
      }
      
      if (category) {
        where.category = category;
      }
      
      if (keyword) {
        where.OR = [
          { sku: { contains: keyword as string, mode: 'insensitive' } },
          { name: { contains: keyword as string, mode: 'insensitive' } },
          { barcode: { contains: keyword as string, mode: 'insensitive' } },
        ];
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.product.count({ where }),
      ]);

      res.json({
        data: products,
        pagination: {
          page: Number(page),
          pageSize: Number(pageSize),
          total,
          totalPages: Math.ceil(total / take),
        },
      });
    } catch (error) {
      logError('List products error', error);
      res.status(500).json({ error: 'Failed to list products' });
    }
  },

  // 创建商品
  async create(req: TenantRequest, res: Response) {
    try {
      const data = productSchema.parse(req.body);

      // 检查SKU是否已存在
      const existing = await prisma.product.findUnique({
        where: {
          tenantId_sku: {
            tenantId: req.tenantId!,
            sku: data.sku,
          },
        },
      });

      if (existing) {
        return res.status(400).json({ error: 'Product SKU already exists' });
      }

      const product = await prisma.product.create({
        data: {
          ...data,
          tenantId: req.tenantId!,
        },
      });

      res.status(201).json(product);
    } catch (error) {
      logError('Create product error', error);
      if (isZodError(error)) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create product' });
    }
  },

  // 批量创建商品
  async batchCreate(req: TenantRequest, res: Response) {
    try {
      const products = z.array(productSchema).parse(req.body);

      const created = await prisma.$transaction(
        products.map((data: z.infer<typeof productSchema>) =>
          prisma.product.create({
            data: {
              ...data,
              tenantId: req.tenantId!,
            },
          })
        )
      );

      res.status(201).json({ data: created, count: created.length });
    } catch (error) {
      logError('Batch create products error', error);
      if (isZodError(error)) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to batch create products' });
    }
  },

  // 获取商品详情
  async getById(req: TenantRequest, res: Response) {
    try {
      const { id } = req.params;

      const product = await prisma.product.findFirst({
        where: {
          id,
          tenantId: req.tenantId!,
        },
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json(product);
    } catch (error) {
      logError('Get product error', error);
      res.status(500).json({ error: 'Failed to get product' });
    }
  },

  // 更新商品
  async update(req: TenantRequest, res: Response) {
    try {
      const { id } = req.params;
      const data = productSchema.partial().parse(req.body);

      const product = await prisma.product.updateMany({
        where: {
          id,
          tenantId: req.tenantId!,
        },
        data,
      });

      if (product.count === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const updated = await prisma.product.findUnique({
        where: { id },
      });

      res.json(updated);
    } catch (error) {
      logError('Update product error', error);
      if (isZodError(error)) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to update product' });
    }
  },

  // 删除商品
  async delete(req: TenantRequest, res: Response) {
    try {
      const { id } = req.params;

      const product = await prisma.product.deleteMany({
        where: {
          id,
          tenantId: req.tenantId!,
        },
      });

      if (product.count === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      logError('Delete product error', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  },
};

