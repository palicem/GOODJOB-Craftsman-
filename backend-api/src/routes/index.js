import express from 'express';
import shopRoutes from './shopRoutes.js';
import userRoutes from './userRoutes.js'; // 取消注释并确保引入
import orderRoutes from './orderRoutes.js'; // 新增订单路由
import favoriteRoutes from './favoriteRoutes.js'; // 新增收藏路由
import { getAllProductsAcrossShops } from '../controllers/shopController.js'; // Import the new controller
// import productRoutes from './productRoutes.js'; // 以及其他路由

const router = express.Router();

// 健康检查或根路由
router.get('/', (req, res) => {
  res.json({ message: 'Main API router is working!' });
});

// 挂载特定功能的路由
router.use('/shops', shopRoutes); // 所有 /shops 相关的路由将由 shopRoutes 处理
router.use('/user', userRoutes); // 挂载用户路由到 /user 前缀
router.use('/orders', orderRoutes); // 新增挂载订单路由
router.use('/favorites', favoriteRoutes); // 新增挂载收藏路由
// router.use('/products', productRoutes);

// Route for fetching all products for the homepage
router.get('/home/all-products', getAllProductsAcrossShops);

export default router; 
// Example: /api/auth for authentication
// const authRoutes = require('./authRoutes');
// router.use('/auth', authRoutes); 