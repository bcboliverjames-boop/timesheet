import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { ensureDirs } from './utils/ensureDirs';
import { rateLimiter } from './middleware/rateLimiter';

// Routes
import authRoutes from './routes/auth';
import tenantRoutes from './routes/tenant';
import warehouseRoutes from './routes/warehouse';
import productRoutes from './routes/product';
import inventoryRoutes from './routes/inventory';
import inboundRoutes from './routes/inbound';
import outboundRoutes from './routes/outbound';

dotenv.config();

// 确保必要的目录存在
ensureDirs();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(rateLimiter);

// Request logging
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
// 以下路由已在各自路由文件中包含authMiddleware和tenantMiddleware
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/inbound', inboundRoutes);
app.use('/api/outbound', outboundRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

export default app;

