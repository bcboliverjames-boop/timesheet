import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import prisma from '../config/database';
import { TenantRequest } from '../middleware/tenantMiddleware';
import { logError, isZodError } from '../utils/errorHandler';
import { z } from 'zod';

const registerSchema = z.object({
  tenantName: z.string().min(1),
  subdomain: z.string().min(1).regex(/^[a-z0-9-]+$/),
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  tenantId: z.string().optional(),
});

export const authController = {
  // 注册（创建租户和第一个用户）
  async register(req: Request, res: Response) {
    try {
      const data = registerSchema.parse(req.body);

      // 检查租户是否已存在
      const existingTenant = await prisma.tenant.findUnique({
        where: { subdomain: data.subdomain },
      });

      if (existingTenant) {
        return res.status(400).json({ error: 'Subdomain already exists' });
      }

      // 检查邮箱是否已被使用
      const existingUser = await prisma.user.findFirst({
        where: { email: data.email },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // 创建租户和用户（事务）
      const result = await prisma.$transaction(async (tx: typeof prisma) => {
        // 创建租户
        const tenant = await tx.tenant.create({
          data: {
            name: data.tenantName,
            subdomain: data.subdomain,
            email: data.email,
          },
        });

        // 创建第一个用户（管理员）
        const user = await tx.user.create({
          data: {
            tenantId: tenant.id,
            email: data.email,
            password: hashedPassword,
            name: data.name,
            phone: data.phone,
            role: 'admin',
          },
        });

        return { tenant, user };
      });

      // 生成JWT token
      const token = generateToken(result.user, result.tenant.id);

      res.status(201).json({
        message: 'Registration successful',
        token,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
        },
        tenant: {
          id: result.tenant.id,
          name: result.tenant.name,
          subdomain: result.tenant.subdomain,
        },
      });
    } catch (error) {
      logError('Registration error', error);
      if (isZodError(error)) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      res.status(500).json({ error: 'Registration failed' });
    }
  },

  // 登录
  async login(req: Request, res: Response) {
    try {
      const data = loginSchema.parse(req.body);

      // 查找用户
      const user = await prisma.user.findFirst({
        where: { email: data.email },
        include: { tenant: true },
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // 验证密码
      const isValidPassword = await bcrypt.compare(data.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // 检查用户状态
      if (user.status !== 'ACTIVE') {
        return res.status(403).json({ error: 'User account is not active' });
      }

      // 检查租户状态
      if (user.tenant.status !== 'ACTIVE') {
        return res.status(403).json({ error: 'Tenant account is not active' });
      }

      // 如果提供了tenantId，验证是否匹配
      if (data.tenantId && user.tenantId !== data.tenantId) {
        return res.status(403).json({ error: 'Tenant mismatch' });
      }

      // 更新最后登录时间
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // 生成JWT token
      const token = generateToken(user, user.tenantId);

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        tenant: {
          id: user.tenant.id,
          name: user.tenant.name,
          subdomain: user.tenant.subdomain,
        },
      });
    } catch (error) {
      logError('Login error', error);
      if (isZodError(error)) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      res.status(500).json({ error: 'Login failed' });
    }
  },

  // 获取当前用户信息
  async getCurrentUser(req: TenantRequest, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId! },
        include: { tenant: true },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          avatar: true,
          role: true,
          status: true,
          lastLoginAt: true,
          tenant: {
            select: {
              id: true,
              name: true,
              subdomain: true,
              plan: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      logError('Get current user error', error);
      res.status(500).json({ error: 'Failed to get user info' });
    }
  },

  // 更新用户资料
  async updateProfile(req: TenantRequest, res: Response) {
    try {
      const { name, phone, avatar } = req.body;

      const user = await prisma.user.update({
        where: { id: req.userId! },
        data: {
          name,
          phone,
          avatar,
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          avatar: true,
        },
      });

      res.json(user);
    } catch (error) {
      logError('Update profile error', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  },

  // 修改密码
  async changePassword(req: TenantRequest, res: Response) {
    try {
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'Invalid password data' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.userId! },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // 验证旧密码
      const isValidPassword = await bcrypt.compare(oldPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid old password' });
      }

      // 加密新密码
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: req.userId! },
        data: { password: hashedPassword },
      });

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      logError('Change password error', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  },

  // 刷新token
  async refreshToken(req: Request, res: Response) {
    // TODO: 实现refresh token逻辑
    res.status(501).json({ error: 'Not implemented' });
  },
};

function generateToken(user: { id: string; email: string; role: string }, tenantId: string): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured');
  }

  const secret: Secret = jwtSecret;
  const signOptions: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'],
  };

  return jwt.sign(
    {
      userId: user.id,
      tenantId,
      email: user.email,
      role: user.role,
    },
    secret,
    signOptions
  );
}

