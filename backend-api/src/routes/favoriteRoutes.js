import express from 'express';
import {
  addFavorite,
  removeFavorite,
  getFavorites,
  checkFavoriteStatus,
  addShopToFavoritesController,
  removeShopFromFavoritesController,
  getFavoriteShopsController,
  checkShopFavoriteStatusController
} from '../controllers/favoriteController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// 所有收藏路由都需要认证 (这将应用于下面定义的所有路由)
router.use(authenticateToken);

// --- 新的、正确的API端点 ---

// POST /api/favorites - 添加商品到收藏
router.post('/', addFavorite);

// DELETE /api/favorites/:productId - 从收藏中移除商品
router.delete('/:productId', removeFavorite);

// GET /api/favorites - 获取当前用户的收藏列表
router.get('/', getFavorites);

// GET /api/favorites/status/:productId - 检查特定商品是否已被收藏
router.get('/status/:productId', checkFavoriteStatus);

// --- 店铺收藏 API ---
// POST /api/favorites/shops - 添加店铺到收藏 (shopId in body)
router.post('/shops', addShopToFavoritesController);

// DELETE /api/favorites/shops/:shopId - 从收藏中移除店铺 (shopId in URL)
router.delete('/shops/:shopId', removeShopFromFavoritesController);

// GET /api/favorites/shops - 获取当前用户的店铺收藏列表
router.get('/shops', getFavoriteShopsController);

// GET /api/favorites/shops/:shopId/status - 检查特定店铺是否已被收藏
router.get('/shops/:shopId/status', checkShopFavoriteStatusController);

// --- 移除所有旧的占位路由 --- 
// (之前这里的 /products 和 /shops 路由已被删除)

export default router; 