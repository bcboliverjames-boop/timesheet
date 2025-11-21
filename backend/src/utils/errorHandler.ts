import { z } from 'zod';
import { logger } from './logger';

/**
 * 判断错误是否为Zod验证错误
 */
export function isZodError(error: unknown): error is z.ZodError {
  return error instanceof z.ZodError;
}

/**
 * 判断错误是否为Error实例
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * 获取错误消息
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error';
}

/**
 * 记录错误日志（处理unknown类型）
 */
export function logError(message: string, error: unknown): void {
  if (isError(error)) {
    logger.error(message, { error: error.message, stack: error.stack });
  } else {
    logger.error(message, { error: String(error) });
  }
}

