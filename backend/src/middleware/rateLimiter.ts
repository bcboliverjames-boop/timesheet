import rateLimit from 'express-rate-limit';

// 开发环境使用更宽松的限制，生产环境使用更严格的限制
const isDevelopment = process.env.NODE_ENV === 'development';

export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || (isDevelopment ? '60000' : '900000')), // 开发环境：1分钟，生产环境：15分钟
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || (isDevelopment ? '10000' : '100')), // 开发环境：10000请求/分钟，生产环境：100请求/15分钟
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // 跳过健康检查路由
    return req.path === '/health';
  },
});

