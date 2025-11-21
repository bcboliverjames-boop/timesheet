import { Response } from 'express';
import prisma from '../config/database';
import { TenantRequest } from '../middleware/tenantMiddleware';
import { logError } from '../utils/errorHandler';

export const tenantController = {
  // 注册租户（已在authController中实现，这里保留接口一致性）
  async register(req: TenantRequest, res: Response) {
    res.status(501).json({ error: 'Use /api/auth/register instead' });
  },

  // 获取租户信息
  async getTenantInfo(req: TenantRequest, res: Response) {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: req.tenantId! },
        select: {
          id: true,
          name: true,
          subdomain: true,
          email: true,
          phone: true,
          address: true,
          status: true,
          plan: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      res.json(tenant);
    } catch (error) {
      logError('Get tenant info error', error);
      res.status(500).json({ error: 'Failed to get tenant info' });
    }
  },

  // 更新租户信息
  async updateTenantInfo(req: TenantRequest, res: Response) {
    try {
      const { name, phone, address } = req.body;

      const tenant = await prisma.tenant.update({
        where: { id: req.tenantId! },
        data: {
          name,
          phone,
          address,
        },
        select: {
          id: true,
          name: true,
          subdomain: true,
          email: true,
          phone: true,
          address: true,
          status: true,
          plan: true,
        },
      });

      res.json(tenant);
    } catch (error) {
      logError('Update tenant info error', error);
      res.status(500).json({ error: 'Failed to update tenant info' });
    }
  },
};

