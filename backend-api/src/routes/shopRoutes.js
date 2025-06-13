import express from 'express';
import * as shopController from '../controllers/shopController.js';

const router = express.Router();

// Middleware to select shop database for all routes in this file that need it
// This applies to routes that have :shopId in their path or imply a shop context

// Route for a shop to manage its own profile (e.g., /api/shops/:shopId/profile)
// The selectShopDB middleware will be applied specifically in routes needing shop context
router.get('/:shopId/profile', shopController.selectShopDB, shopController.getShopProfile);
router.put('/:shopId/profile', shopController.selectShopDB, shopController.upsertShopProfile);

// Product routes for a specific shop (e.g., /api/shops/:shopId/products)
router.get('/:shopId/products', shopController.selectShopDB, shopController.getAllProducts);
router.post('/:shopId/products', shopController.selectShopDB, shopController.createProduct);
router.get('/:shopId/products/:productId', shopController.selectShopDB, shopController.getProductById);
router.put('/:shopId/products/:productId', shopController.selectShopDB, shopController.updateProduct);
router.delete('/:shopId/products/:productId', shopController.selectShopDB, shopController.deleteProduct);

// Order routes for a specific shop (e.g., /api/shops/:shopId/orders)
// These now rely on the Order model potentially being part of shopModels, or erroring out if not found there.
// If Order model for shops is truly separate (shop-specific DB Order collection), this is fine.
// If Order model is global (user_db Order collection), these routes might need adjustment or a different controller.
router.get('/:shopId/orders', shopController.selectShopDB, shopController.getAllOrders);
router.post('/:shopId/orders', shopController.selectShopDB, shopController.createOrder);
router.delete('/:shopId/orders/:orderNo', shopController.selectShopDB, shopController.deleteOrder);

// Route to update order status (e.g., for shipping)
router.put('/:shopId/orders/:orderNo/status', shopController.selectShopDB, shopController.updateOrderStatus);

// New route to cancel an order (set status to 'cancelled')
router.put('/:shopId/orders/:orderNo/cancel', shopController.selectShopDB, shopController.cancelOrder);

// New route for shop dashboard statistics
router.get('/:shopId/dashboard-stats', shopController.selectShopDB, shopController.getShopDashboardStats);

// Route to get all products across all shops (original, hardcoded version for compatibility)
// This route might be associated with a path like /api/home/all-products in the main app router setup
// For clarity, if it's a general "home" or "public" route, it might not strictly belong in "shopRoutes"
// but placed here for now due to controller location.
router.get('/home/all-products', shopController.getAllProductsAcrossShops);

// NEW Route to get all products across all active shops dynamically
router.get('/home/all-products-dynamic', shopController.getDynamicallyAggregatedHomepageProducts);

// TODO: Add routes for ProductCategories, OrderItems in a similar fashion

export default router; 