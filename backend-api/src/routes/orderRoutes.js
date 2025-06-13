import express from 'express';
// 假设你将来会有一个 orderController.js 来处理订单逻辑
// import { getOrderCountsForUser } from '../controllers/orderController.js';
import { authenticateToken } from '../middleware/authMiddleware.js'; // 取消注释
import {
  createOrder,
  getUserOrders,
  getOrderCountsForUser,
  getOrderById,
  updateOrderStatusController,
  deleteOrderByIdController // Import the new delete controller
} from '../controllers/orderController.js'; // Import controller methods and getOrderCountsForUser

const router = express.Router();

// GET /api/orders/counts - 获取当前用户各状态订单数量
router.get('/counts', authenticateToken, getOrderCountsForUser);

// GET /api/orders/counts - 获取当前用户各状态订单数量 (Keep the mock for now, or implement in controller)
/*router.get('/counts', authenticateToken, (req, res) => {
  console.log(`[Log][OrderRoutes] Getting order counts (placeholder) for user: ${req.user.id}`);
  const mockOrderCounts = {
    to_pay: 5,    // 待付款 - ensure keys match frontend expectations
    to_ship: 3,   // 待发货
    to_receive: 4, // 待收货
    to_review: 10, // 待评价 (completed)
    refund: 1     // 退款/售后
  };
  res.status(200).json({
    success: true,
    data: mockOrderCounts,
    message: '订单数量获取成功 (模拟数据)'
  });
});*/

// POST /api/orders - 创建新订单
router.post('/', authenticateToken, createOrder);

// GET /api/orders - 获取当前用户所有订单列表
router.get('/', authenticateToken, getUserOrders);

// GET /api/orders/:id - 获取特定订单详情 
// (Changed :orderId to :id to match req.params.id in controller convention)
router.get('/:id', authenticateToken, getOrderById);

// PUT /api/orders/:id/status - 更新特定订单的状态
router.put('/:id/status', authenticateToken, (req, res, next) => {
  // --- BEGIN DEBUG LOG ---
  console.log(`[DEBUG][OrderRoutes][PUT /:id/status] Request received for order ID: ${req.params.id}`);
  console.log(`[DEBUG][OrderRoutes][PUT /:id/status] Request body:`, JSON.stringify(req.body, null, 2));
  console.log(`[DEBUG][OrderRoutes][PUT /:id/status] User on req:`, JSON.stringify(req.user, null, 2));
  // --- END DEBUG LOG ---
  next(); // Pass control to the next middleware/handler in the chain (updateOrderStatusController)
}, updateOrderStatusController);

// DELETE /api/orders/:id - 删除特定订单
router.delete('/:id', authenticateToken, deleteOrderByIdController);

// 你可以在这里为 /orders 添加其他全局订单路由，例如 GET /api/orders (获取当前用户所有订单列表) 等
// router.get('/', authenticateToken, getAllOrdersForUser);
// router.get('/:orderId', authenticateToken, getOrderDetailForUser);

export default router; 