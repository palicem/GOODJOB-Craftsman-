import mongoose from 'mongoose';
import { getOrdersDBConnection } from '../config/db.js';
import { createOrderModel } from '../models/order/Order.js';
import { fetchProductDetailsForOrder, getShopNameById } from './shopController.js';
// We likely don't need createOrderItemModel separately if items are always embedded and saved with the order.

// Create a new order
export const createOrder = async (req, res) => {
  // Assuming authMiddleware adds user info to req.user, including account_name
  // If req.user.id is the ObjectId and you need account_name, you might need to fetch User first
  // For now, let's assume req.user.account_name is available, or req.user.username which acts as account_name
  const userAccountName = req.user.account_name || req.user.username; 

  if (!userAccountName) {
    return res.status(401).json({ success: false, message: '用户认证失败或用户信息不完整 (缺少 account_name)' });
  }

  const { 
    shop_id, 
    items, 
    total_amount: frontendTotalAmount, 
    handling_fee = 0, 
    shipping_fee = 0, 
    address_snapshot, 
    remark,
    status: requestedStatus // 从请求体中获取期望的状态
  } = req.body;

  console.log(`[OrderCtrl] Attempting to create order for user account: ${userAccountName}, shop: ${shop_id}`);
  console.log(`[OrderCtrl] Requested status from frontend: ${requestedStatus}`);
  console.log(`[OrderCtrl] Received items from frontend:`, JSON.stringify(items, null, 2));
  console.log(`[OrderCtrl] Received address_snapshot:`, JSON.stringify(address_snapshot, null, 2));

  if (!shop_id || !items || items.length === 0 || frontendTotalAmount === undefined || !address_snapshot) {
    return res.status(400).json({ success: false, message: '缺少必要的订单信息 (店铺ID, 商品, 总金额, 地址信息)' });
  }

  try {
    const ordersDbConnection = await getOrdersDBConnection();
    const Order = createOrderModel(ordersDbConnection);

    let calculatedSubtotal = 0;
    const orderItemsData = await Promise.all(items.map(async (item) => {
      const productShopId = item.product_shop_id || shop_id;
      const dbProduct = await fetchProductDetailsForOrder(productShopId, item.product_id);

      if (!dbProduct) {
        // Throw an error that can be caught by the outer try...catch
        throw new Error(`商品信息获取失败: 店铺 ${productShopId}中的商品 ${item.product_id} 未找到或无法访问。`);
      }

      // Use price from DB. Ensure your Product model has a 'price' field.
      // If price can vary (e.g. sales), ensure you fetch the correct current/sale price.
      const itemPriceFromDB = dbProduct.price; 
      if (itemPriceFromDB === undefined || itemPriceFromDB === null) {
        throw new Error(`商品价格信息缺失: 店铺 ${productShopId}中的商品 ${item.product_id}。`);
      }
      
      calculatedSubtotal += itemPriceFromDB * item.count;

      // Construct product_snapshot from dbProduct data
      // Be selective about what goes into the snapshot to avoid excessively large documents
      const snapshot = {
        name: dbProduct.name,
        image_url: dbProduct.images && dbProduct.images.length > 0 ? dbProduct.images[0] : (dbProduct.main_image || ''), // Example: use first image or main_image
        original_price: dbProduct.original_price || itemPriceFromDB, // Original price if available
        purchase_price: itemPriceFromDB, // The price at time of purchase
        description: dbProduct.description || '',
        // Add any other relevant fields from dbProduct that you want to snapshot
        // e.g., SKU, category, item_number, etc.
        product_id_original_db: dbProduct.product_id, // The ID from the shop's DB for reference
        shop_id_original_db: dbProduct.shop_id, // The shop_id from the shop's DB for reference
      };

      return {
        product_id: item.product_id,
        product_id_original: item.product_id,
        product_shop_id_original: productShopId,
        product_snapshot: snapshot, 
        count: item.count,
        price: itemPriceFromDB, // Use price from DB for this item
        spec: item.spec, // Keep spec from request as it relates to user's choice
        spec_description: item.spec_description, // Keep spec_description from request
        customization_data: item.customization_data,
      };
    }));

    const backendCalculatedTotalAmount = calculatedSubtotal + handling_fee + shipping_fee;
    
    // Fetch the shop name
    const actualShopName = await getShopNameById(shop_id);
    if (!actualShopName || actualShopName.includes('失败') || actualShopName.includes('异常') || actualShopName.includes('未知') || actualShopName === '店铺信息待补充') {
        console.warn(`[OrderCtrl] Failed to fetch shop name for shop_id: ${shop_id}. Received: ${actualShopName}. Will use shop_id as fallback for shopName.`);
        // Depending on requirements, you might throw an error or proceed with a fallback
    }

    // 决定订单状态
    // 支持的状态值可以从 Order模型的枚举中获取，或在此处硬编码一个允许的列表
    const allowedStatuses = ['to_pay', 'to_ship', 'processing']; // 根据你的业务逻辑调整
    const finalStatus = requestedStatus && allowedStatuses.includes(requestedStatus) ? requestedStatus : 'to_pay';
    console.log(`[OrderCtrl] Final status for new order will be: ${finalStatus}`);

    const newOrderData = {
      user_id: userAccountName,
      shop_id,
      shopName: (actualShopName && !actualShopName.includes('失败') && !actualShopName.includes('异常') && actualShopName !== '店铺信息待补充' && actualShopName !== '未知店铺') ? actualShopName : shop_id,
      total_amount: backendCalculatedTotalAmount, 
      handling_fee,
      shipping_fee,
      address_snapshot,
      remark,
      status: finalStatus, // 使用最终确定的状态
      orderItems: orderItemsData,
    };

    if (orderItemsData.length === 1 && orderItemsData[0].product_snapshot) {
      const firstItemSnapshot = orderItemsData[0].product_snapshot;
      const firstItem = orderItemsData[0];
      newOrderData.goodsName = firstItemSnapshot.name;
      newOrderData.goodsImage = firstItemSnapshot.image_url;
      newOrderData.spec = firstItem.spec_description || JSON.stringify(firstItem.spec); 
      newOrderData.price = firstItem.price; // This is the price of the first item from DB
      newOrderData.count = firstItem.count;
    }

    const orderInstance = new Order(newOrderData);

    // Populate top-level fields for single-item orders for easier display on some UIs
    if (newOrderData.orderItems && newOrderData.orderItems.length === 1) {
      const firstItem = newOrderData.orderItems[0];
      const productSnapshot = firstItem.product_snapshot;
      
      orderInstance.goodsName = productSnapshot.name;
      orderInstance.goodsImage = productSnapshot.image_url;
      orderInstance.price = firstItem.price; 
      orderInstance.count = firstItem.count;
      
      if (typeof firstItem.spec === 'string') {
        orderInstance.spec = firstItem.spec;
      } else if (firstItem.spec_description) { 
        orderInstance.spec = firstItem.spec_description;
      } else if (firstItem.spec && typeof firstItem.spec === 'object' && firstItem.spec.text) {
        orderInstance.spec = firstItem.spec.text;
      } else if (firstItem.spec) {
        try {
            orderInstance.spec = JSON.stringify(firstItem.spec);
        } catch (e) {
            orderInstance.spec = '规格信息不可用';
        }
      }
    }

    console.log(`[DEBUG][OrderCtrl] newOrder instance before save. shopName: ${orderInstance.shopName}, order_no (pre-hook):`, orderInstance.order_no);

    const savedOrder = await orderInstance.save();
    console.log(`[OrderCtrl] Order saved with _id: ${savedOrder._id} and OrderNo: ${savedOrder.order_no}. Shop Name: ${savedOrder.shopName}`);

    res.status(201).json({ 
      success: true, 
      message: '订单创建成功', 
      data: savedOrder,
    });

  } catch (error) {
    console.error('[OrderCtrl][Err] createOrder:', error);
    if (error.message.startsWith('商品信息获取失败') || error.message.startsWith('商品价格信息缺失')) {
        return res.status(400).json({ success: false, message: error.message });
    }
    if (error.name === 'ValidationError') {
        return res.status(400).json({ success: false, message: '订单数据验证失败', error: error.message, details: error.errors });
    }
    if (error.code === 11000 && error.message.includes('order_no')) {
      return res.status(409).json({ success: false, message: '订单号冲突，请重试', error: error.message });
    }
    res.status(500).json({ success: false, message: '创建订单失败', error: error.message });
  }
};

// Get all orders for the currently authenticated user
export const getUserOrders = async (req, res) => {
  // --- BEGIN DEBUG LOGS ---
  console.log('--- [orderController DEBUG] ---');
  console.log('[orderController] Entry: getUserOrders');
  console.log('[orderController] req.user object from authMiddleware:', JSON.stringify(req.user, null, 2));
  const userIdFromReq = req.user ? (req.user.account_name || req.user.username) : 'N/A - req.user is undefined or missing account_name/username';
  console.log('[orderController] userId that will be used for DB query:', userIdFromReq);
  console.log('[orderController] req.query for status, page, limit:', JSON.stringify(req.query, null, 2));
  // --- END DEBUG LOGS ---

  const userAccountName = req.user.account_name || req.user.username;
  const { status, page = 1, limit = 10 } = req.query; 

  if (!userAccountName) {
    return res.status(401).json({ success: false, message: '用户认证失败或用户信息不完整 (缺少 account_name)' });
    }
  console.log(`[OrderCtrl] getUserOrders: Initiating for user account: ${userAccountName}, status: ${status}, page: ${page}, limit: ${limit}`);

  try {
    const ordersDbConnection = await getOrdersDBConnection();
    const Order = createOrderModel(ordersDbConnection);

    let query = { user_id: userAccountName };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const numLimit = parseInt(limit, 10);

    console.log(`[OrderCtrl] getUserOrders: Querying with: ${JSON.stringify(query)}, Skip: ${skip}, Limit: ${numLimit}`);
    
    const userOrders = await Order.find(query)
                             .sort({ create_time: -1 }) // Use 'create_time' as defined in schema
                             .skip(skip)
                             .limit(numLimit)
                             .lean(); // Use .lean() for faster queries if not modifying docs

    const totalOrders = await Order.countDocuments(query);

    console.log(`[OrderCtrl] getUserOrders: Found ${userOrders.length} orders. Total matching: ${totalOrders}.`);

    res.status(200).json({ 
      success: true, 
      message: '用户订单列表获取成功', 
      data: userOrders,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(totalOrders / numLimit),
        totalOrders,
        limit: numLimit
      }
    });

  } catch (error) {
    console.error('[OrderCtrl][Err] getUserOrders:', error);
    res.status(500).json({ success: false, message: '获取用户订单列表失败', error: error.message });
  }
};

// Get order counts by status for the currently authenticated user
export const getOrderCountsForUser = async (req, res) => {
  const userAccountName = req.user.account_name || req.user.username;
  if (!userAccountName) {
    return res.status(401).json({ success: false, message: '用户认证失败或用户信息不完整 (缺少 account_name)' });
  }
  console.log(`[OrderCtrl] getOrderCountsForUser: Initiating for user account: ${userAccountName}`);

  try {
    const ordersDbConnection = await getOrdersDBConnection();
    const Order = createOrderModel(ordersDbConnection);

    const aggregationPipeline = [
      { $match: { user_id: userAccountName } }, // Match by account name string
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ];

    const statusCounts = await Order.aggregate(aggregationPipeline);
    console.log(`[OrderCtrl] getOrderCountsForUser: Aggregation result:`, statusCounts);

    const counts = {
      to_pay: 0,
      to_ship: 0,
      to_receive: 0,
      completed: 0, 
      cancelled: 0,
      refund_request: 0,
      refund_approved: 0,
      refund_completed: 0
    };

    statusCounts.forEach(item => {
      if (counts.hasOwnProperty(item._id)) {
        counts[item._id] = item.count;
      }
    });
    
    // Consolidate refund counts for a simpler frontend display if needed
    const totalRefunds = counts.refund_request + counts.refund_approved + counts.refund_completed;

    const responseCounts = {
        to_pay: counts.to_pay,
        to_ship: counts.to_ship,
        to_receive: counts.to_receive,
        completed: counts.completed, // Or map to 'to_review' if frontend uses that for completed orders
        cancelled: counts.cancelled,
        refund: totalRefunds, 
    };

    console.log(`[OrderCtrl] getOrderCountsForUser: Final counts for user ${userAccountName}:`, responseCounts);
    res.status(200).json({
      success: true,
      message: '订单数量获取成功',
      data: responseCounts,
    });

  } catch (error) {
    console.error('[OrderCtrl][Err] getOrderCountsForUser:', error);
    res.status(500).json({ success: false, message: '获取订单数量失败', error: error.message });
  }
};

// Get a single order by its ID for the authenticated user
export const getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userAccountName = req.user.account_name || req.user.username;

    if (!userAccountName) {
      return res.status(401).json({ success: false, message: '用户认证失败或用户信息不完整' });
    }
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ success: false, message: '无效的订单ID格式' });
    }

    console.log(`[OrderCtrl] getOrderById: Initiating for order ID: ${orderId}, user account: ${userAccountName}`);

    const ordersDbConnection = await getOrdersDBConnection();
    const Order = createOrderModel(ordersDbConnection);

    const order = await Order.findOne({ _id: orderId, user_id: userAccountName }).lean(); 

    if (!order) {
      console.log(`[OrderCtrl] getOrderById: Order not found or user mismatch. Order ID: ${orderId}, User: ${userAccountName}`);
      return res.status(404).json({ success: false, message: '订单不存在或用户无权限查看' });
    }

    console.log(`[OrderCtrl] getOrderById: Found order:`, JSON.stringify(order, null, 2));
    res.status(200).json({
      success: true,
      message: '订单详情获取成功',
      data: order,
    });

  } catch (error) {
    console.error('[OrderCtrl][Err] getOrderById:', error);
    if (error.name === 'CastError' && error.kind === 'ObjectId') { 
        return res.status(400).json({ success: false, message: '订单ID格式无效 (CastError)' });
    }
    res.status(500).json({ success: false, message: '获取订单详情失败', error: error.message });
  }
};

// New controller function to update order status
export const updateOrderStatusController = async (req, res) => {
  const { id: orderId } = req.params; // Assuming route is /:id/status
  const { status: newStatus, cancel_reason } = req.body; // newStatus is the target status
  const userAccountName = req.user.account_name || req.user.username;

  console.log(`[OrderCtrl][updateStatus] Attempting to update order ID: ${orderId} to status: ${newStatus} for user: ${userAccountName}`);

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({ success: false, message: '无效的订单ID格式' });
  }

  if (!newStatus) {
    return res.status(400).json({ success: false, message: '缺少新的订单状态' });
  }

  // Define valid statuses based on your Order schema
  const validStatuses = ['to_pay', 'to_ship', 'shipped', 'to_receive', 'completed', 'cancelled', 'refund_request', 'refund_approved', 'refund_completed'];
  if (!validStatuses.includes(newStatus)) {
    return res.status(400).json({ success: false, message: `无效的订单状态: ${newStatus}` });
  }

  try {
    const ordersDbConnection = await getOrdersDBConnection();
    const Order = createOrderModel(ordersDbConnection);

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: '订单未找到' });
    }

    // Optional: Check if the user making the request is the owner of the order
    // This depends on whether admins can also change status. For now, assuming only user.
    if (order.user_id !== userAccountName) {
      console.warn(`[OrderCtrl][updateStatus] Forbidden: User ${userAccountName} attempting to update order ${orderId} belonging to ${order.user_id}`);
      return res.status(403).json({ success: false, message: '无权修改此订单状态' });
    }
    
    const oldStatus = order.status;
    console.log(`[OrderCtrl][updateStatus] Order ${orderId} current status: ${oldStatus}, requested new status: ${newStatus}`);

    // Add logic for status transitions if needed (e.g., cannot go from 'completed' back to 'to_pay')
    // For example:
    // if (oldStatus === 'completed' && newStatus === 'to_pay') {
    //   return res.status(400).json({ success: false, message: '无法将已完成订单改回待付款' });
    // }

    order.status = newStatus;
    order.update_time = new Date(); // Always update the update_time

    // Handle specific status changes and associated timestamps
    switch (newStatus) {
      case 'to_ship': // This implies payment was successful (if coming from to_pay)
        if (!order.pay_time) order.pay_time = new Date();
        break;
      case 'shipped':
        if (!order.ship_time) order.ship_time = new Date();
        break;
      case 'completed':
        if (!order.complete_time) order.complete_time = new Date();
        // Ensure other relevant times are set if jumping to completed
        if (!order.pay_time) order.pay_time = new Date(); 
        if (!order.ship_time) order.ship_time = new Date(); // Or set to complete_time if no separate shipping
        break;
      case 'cancelled':
        if (!order.cancel_time) order.cancel_time = new Date();
        if (cancel_reason) order.cancel_reason = cancel_reason;
        break;
      // Add cases for refund statuses if they involve specific timestamps
    }

    const updatedOrder = await order.save();
    console.log(`[OrderCtrl][updateStatus] Order ${orderId} successfully updated to status: ${updatedOrder.status}`);

    res.status(200).json({
      success: true,
      message: '订单状态更新成功',
      data: updatedOrder,
    });

  } catch (error) {
    console.error(`[OrderCtrl][Err][updateStatus] Order ID ${orderId}:`, error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: '订单数据验证失败', error: error.message, details: error.errors });
    }
    res.status(500).json({ success: false, message: '更新订单状态失败', error: error.message });
  }
};

// Controller function to delete an order by its ID
export const deleteOrderByIdController = async (req, res) => {
  const { id: orderId } = req.params;
  const userAccountName = req.user.account_name || req.user.username;

  console.log(`[OrderCtrl][deleteOrder] Attempting to delete order ID: ${orderId} for user: ${userAccountName}`);

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({ success: false, message: '无效的订单ID格式' });
  }

  try {
    const ordersDbConnection = await getOrdersDBConnection();
    const Order = createOrderModel(ordersDbConnection);

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: '订单未找到，无法删除' });
    }

    // Ensure the user deleting the order is the one who owns it
    if (order.user_id !== userAccountName) {
      console.warn(`[OrderCtrl][deleteOrder] Forbidden: User ${userAccountName} attempting to delete order ${orderId} belonging to ${order.user_id}`);
      return res.status(403).json({ success: false, message: '无权删除此订单' });
    }

    // Optional: Add a condition, e.g., only allow deletion if order is in 'cancelled' or 'completed' status
    // if (!['cancelled', 'completed'].includes(order.status)) {
    //   return res.status(400).json({ success: false, message: `订单状态 (${order.status}) 不允许删除` });
    // }

    const deletionResult = await Order.findByIdAndDelete(orderId);

    if (!deletionResult) {
      // This case might occur if the order was deleted between the findById and findByIdAndDelete operations (race condition)
      console.warn(`[OrderCtrl][deleteOrder] Order ${orderId} was not found during findByIdAndDelete, though found initially.`);
      return res.status(404).json({ success: false, message: '删除订单时未找到该订单' });
    }

    console.log(`[OrderCtrl][deleteOrder] Order ${orderId} successfully deleted for user ${userAccountName}.`);
    res.status(200).json({ success: true, message: '订单删除成功' });

  } catch (error) {
    console.error(`[OrderCtrl][Err][deleteOrder] Order ID ${orderId}:`, error);
    res.status(500).json({ success: false, message: '删除订单失败', error: error.message });
  }
};

// TODO: Add other order-related controller functions, ensuring they use getOrdersDBConnection:
// export const updateOrderStatus = async (req, res) => { ... }; // Might be admin/shop or user initiated (e.g. confirm receipt)
// export const cancelOrder = async (req, res) => { ... }; // User initiated 