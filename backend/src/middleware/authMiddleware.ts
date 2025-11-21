import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { TenantRequest } from './tenantMiddleware';

export interface JWTPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
}

/**
 * JWT认证中间件
 * 验证token并提取用户信息和租户信息
 */
export const authMiddleware = (
  req: TenantRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      res.status(500).json({ error: 'JWT secret not configured' });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    
    // 将用户信息和租户信息注入到请求对象
    req.userId = decoded.userId;
    req.tenantId = decoded.tenantId;
    
    // 如果请求头中没有tenantId，使用token中的tenantId
    if (!req.headers['x-tenant-id']) {
      req.headers['x-tenant-id'] = decoded.tenantId;
    }

    next();
  } catch (error: unknown) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
    } else {
      res.status(500).json({ error: 'Authentication failed' });
    }
  }
};

