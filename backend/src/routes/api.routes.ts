import { Router, Request, Response } from 'express';
import { CatalogService } from '../services/catalogService.js';

export const apiRouter = Router();

// Health Check
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'smartbuy-ai-backend',
    timestamp: new Date().toISOString(),
  });
});

// Auth Demo
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (email === 'admin@smartbuy.vn' && password === 'admin123') {
    return res.json({
      success: true,
      token: 'jwt-mock-token-admin-2026',
      user: {
        id: 'u-admin',
        email: 'admin@smartbuy.vn',
        fullName: 'Quản Trị Viên Master',
        role: 'ADMIN',
      },
    });
  }

  if (email === 'khachhang@smartbuy.vn' && password === '123456') {
    return res.json({
      success: true,
      token: 'jwt-mock-token-customer-2026',
      user: {
        id: 'u-customer',
        email: 'khachhang@smartbuy.vn',
        fullName: 'Nguyễn Khách Hàng',
        role: 'CUSTOMER',
      },
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Email hoặc mật khẩu không chính xác',
  });
});

// Categories & Brands
apiRouter.get('/categories', (req: Request, res: Response) => {
  res.json({ success: true, data: CatalogService.getCategories() });
});

apiRouter.get('/brands', (req: Request, res: Response) => {
  res.json({ success: true, data: CatalogService.getBrands() });
});

// Products
apiRouter.get('/products', (req: Request, res: Response) => {
  const { category, gender, search } = req.query;
  const products = CatalogService.getProducts({
    category: category as string,
    gender: gender as string,
    search: search as string,
  });
  res.json({ success: true, data: products, total: products.length });
});

apiRouter.get('/products/:slug', (req: Request, res: Response) => {
  const product = CatalogService.getProductBySlug(req.params.slug);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
  }
  res.json({ success: true, data: product });
});

// Orders
apiRouter.get('/orders', (req: Request, res: Response) => {
  res.json({ success: true, data: CatalogService.getOrders() });
});

apiRouter.get('/orders/:id', (req: Request, res: Response) => {
  const order = CatalogService.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
  }
  res.json({ success: true, data: order });
});

apiRouter.post('/orders', (req: Request, res: Response) => {
  try {
    const order = CatalogService.createOrder(req.body);
    res.status(201).json({ success: true, data: order });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

apiRouter.patch('/orders/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const order = CatalogService.updateOrderStatus(req.params.id, status);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
  }
  res.json({ success: true, data: order });
});

