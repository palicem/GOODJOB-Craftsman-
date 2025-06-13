console.log('[Log][ServerJS] Starting server.js execution...');
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// 假设这些路由文件都存在且能正确导出 Express Router 实例
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import shopRoutes from './routes/shopRoutes.js';
// import productRoutes from './routes/productRoutes.js'; // 已移除
import orderRoutes from './routes/orderRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import { getAllProductsAcrossShops } from './controllers/shopController.js'; // Import the new controller
// 如果还有其他数据库连接或模型初始化，也需要在这里或适当的地方处理
// 例如: import { connectDB } from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001; // 后端API端口

// 中间件
app.use(cors()); // 允许跨域请求
app.use(express.json()); // 用于解析 application/json
app.use(express.urlencoded({ extended: true })); // 用于解析 application/x-www-form-urlencoded

// (可选) 连接数据库的调用，如果您的 db.js 中有连接函数
// connectDB(); 

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shops', shopRoutes);
// app.use('/api/products', productRoutes); // 已移除
app.use('/api/orders', orderRoutes);
app.use('/api/favorites', favoriteRoutes);

// New route for fetching all products for the homepage
app.get('/api/home/all-products', getAllProductsAcrossShops);

// 一个简单的根路由用于测试服务器是否在线 (可选)
app.get('/', (req, res) => {
  res.send('Backend API server is running.');
});

// 全局错误处理 (简单示例)
app.use((err, req, res, next) => {
  console.error("Unhandled error:",err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 