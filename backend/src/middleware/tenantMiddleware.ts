import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * 扩展Express的Request类型，添加租户和用户信息
 * 使用类型声明合并，确保继承Request的所有属性（query, body, params等）
 */
export interface TenantRequest extends Request {
  tenantId?: string;
  userId?: string;
}

/**
 * 多租户中间件
 * 从请求头或子域名中提取租户ID，并注入到请求对象中
 */
export const tenantMiddleware = (
  req: TenantRequest,
  res: Response,
  next: NextFunction
): void => {
  // 方式1: 从请求头获取租户ID（推荐）
  const tenantId = req.headers['x-tenant-id'] as string;
  
  // 方式2: 从子域名获取（可选实现）
  // const host = req.get('host') || '';
  // const subdomain = host.split('.')[0];
  // const tenantId = subdomain;

  // 方式3: 从JWT token中获取（如果token中包含了tenantId）
  // 这在authMiddleware中处理

  if (!tenantId) {
    logger.warn('Missing tenant ID in request', {
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    res.status(400).json({ error: 'Tenant ID is required' });
    return;
  }

  req.tenantId = tenantId;
  next();
};

/**
 * 租户数据隔离助手函数
 * 确保查询条件包含tenantId
 */
export const withTenantId = <T extends { tenantId?: string }>(
  query: T,
  tenantId: string
): T & { tenantId: string } => {
  return { ...query, tenantId };
};

