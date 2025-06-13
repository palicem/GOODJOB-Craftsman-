/**
 * 订单服务
 * 管理订单的创建、查询、更新等功能
 */

import api from './apiService'; // 引入apiService

/**
 * 获取订单列表
 * @param {Object} params - 查询参数，例如 { status, page, limit }
 * @returns {Promise<Array>} 订单列表
 */
export const getOrderList = async (params = {}) => {
  console.log('[orderService.js] getOrderList called with params:', JSON.stringify(params));
  try {
    const response = await api.get('/api/orders', params);
    console.log('[orderService.js] api.get("/api/orders") response:', JSON.stringify(response));
    if (response && response.success && response.data) {
      const orders = response.data.orders || response.data || [];
      console.log('[orderService.js] getOrderList returning orders. Count:', orders.length);
      return orders; 
    } else {
      console.warn('[orderService.js] getOrderList - API call not successful or no data. Response:', JSON.stringify(response));
      return [];
    }
  } catch (e) {
    console.error('[orderService.js] Failed to get order list:', e);
    return [];
  }
};

/**
 * 创建新订单
 * @param {Object} orderData 订单数据
 * @returns {Promise<Object>} 后端响应对象 { success: boolean, data?: object, message?: string, error?: any, details?: any }
 */
export const createOrder = async (orderData) => {
  console.log('[orderService.js] createOrder called with orderData:', JSON.stringify(orderData, null, 2));
  try {
    const response = await api.post('/api/orders', orderData);
    console.log('[orderService.js] createOrder - api.post response:', JSON.stringify(response, null, 2));

    if (response && response.success) {
      uni.$emit('orders-updated'); 
      // Backend returns { success: true, message: '...', data: savedOrder }
      // where savedOrder includes the order_no and _id
      return response; // Return the whole response object from backend which includes success, data, message
    } else if (response) {
      // API call was made, but backend indicated failure
      console.warn('[orderService.js] createOrder - Backend indicated failure:', response);
      return { 
        success: false, 
        message: response.message || '创建订单失败，但后端未提供明确原因。', 
        error: response.error,
        details: response.details
      };
    } else {
      // api.post itself returned something falsy (e.g. null, undefined) - should not happen with a well-behaved apiService
      console.error('[orderService.js] createOrder - api.post returned invalid response.');
      return { success: false, message: '创建订单请求未能到达服务器或返回无效响应。' };
    }
  } catch (e) {
    console.error('[orderService.js] createOrder - Exception caught:', e);
    // Handle errors from the API call itself (e.g., network error, 500 server error)
    if (e.response && e.response.data) {
      // If the error object has a response.data (common with Axios for HTTP errors with body)
      // it might contain { success: false, message: ..., error: ... }
      console.error('[orderService.js] createOrder - Error response data:', e.response.data);
      return { 
        success: false, 
        message: e.response.data.message || '创建订单时发生服务器错误。', 
        error: e.response.data.error || e.message,
        details: e.response.data.details
      }; 
    }
    // General catch-all for other types of errors
    return { 
      success: false, 
      message: e.message || '创建订单时发生未知网络或客户端错误。' 
    };
  }
};

/**
 * 获取订单详情
 * @param {string} orderId 订单ID
 * @returns {Promise<Object|null>} 订单详情对象 (data part of backend response) or null on failure
 */
export const getOrderDetail = async (orderId) => {
  console.log('[orderService.js] getOrderDetail called for orderId:', orderId);
  try {
    const response = await api.get(`/api/orders/${orderId}`);
    console.log('[orderService.js] getOrderDetail - api.get response:', JSON.stringify(response));
    if (response && response.success && response.data) {
      return response.data; // Return only the data part which is the order object
    }
    console.warn('[orderService.js] getOrderDetail - Failed or no data:', response);
    return null;
  } catch (e) {
    console.error('[orderService.js] Failed to get order detail for ID:', orderId, e);
    return null;
  }
};

/**
 * 更新订单状态
 * @param {string} orderId 订单ID
 * @param {string} status 新状态
 * @param {Object} additionalData 额外数据 (如物流号: { tracking_number: '123' })
 * @returns {Promise<Object>} 更新结果对象 { success: boolean, data?: object, message?: string }
 */
export const updateOrderStatus = async (orderId, status, additionalData = {}) => {
  try {
    const payload = { status, ...additionalData };
    const response = await api.put(`/api/orders/${orderId}/status`, payload);
    if (response && response.success) {
      uni.$emit('orders-updated'); 
      uni.$emit('order-counts-updated'); 
      return { success: true, data: response.data, message: response.message };
    }
    return { success: false, message: response ? response.message : '更新订单状态失败' };
  } catch (e) {
    console.error('更新订单状态失败:', e);
    return { success: false, message: e.message || '更新订单状态时发生错误' };
  }
};

/**
 * 取消订单
 * @param {string} orderId 订单ID
 * @returns {Promise<Object>} 取消结果对象 { success: boolean, message?: string }
 */
export const cancelOrder = async (orderId) => {
  return await updateOrderStatus(orderId, 'cancelled');
};

/**
 * 确认收货 (将订单状态改为 completed)
 * @param {string} orderId 订单ID
 * @returns {Promise<Object>} 操作结果对象 { success: boolean, message?: string }
 */
export const confirmReceipt = async (orderId) => {
  return await updateOrderStatus(orderId, 'completed');
};

/**
 * 商家发货
 * @param {string} orderId 订单ID
 * @param {string} trackingNumber 物流单号
 * @returns {Promise<Object>} 操作结果对象 { success: boolean, message?: string }
 */
export const shipOrder = async (orderId, trackingNumber) => {
  return await updateOrderStatus(orderId, 'shipped', { tracking_number: trackingNumber });
};

/**
 * 删除订单
 * @param {string} orderId 订单ID (注意：之前是orderNo，统一为orderId)
 * @returns {Promise<Object>} 删除结果对象 { success: boolean, message?: string }
 */
export const deleteOrder = async (orderId) => {
  try {
    const response = await api.delete(`/api/orders/${orderId}`);
    if (response && response.success) {
      uni.$emit('orders-updated');
      uni.$emit('order-counts-updated');
      return { success: true, message: response.message }; 
    }
    return { success: false, message: response ? response.message : '删除订单失败' };
  } catch (error) {
    console.error('删除订单失败:', error);
    return { success: false, message: error.message || '删除订单时发生错误' };
  }
};

/**
 * 获取各状态订单数量
 * @returns {Promise<Object|null>} 各状态订单数量对象或null
 */
export const getOrderCounts = async () => {
  console.log('[orderService.js] getOrderCounts called');
  try {
    const response = await api.get('/api/orders/counts');
    console.log('[orderService.js] api.get("/api/orders/counts") response:', JSON.stringify(response));
    if (response && response.success && response.data) {
      console.log('[orderService.js] getOrderCounts returning data:', JSON.stringify(response.data));
      return response.data; 
    } else {
      console.warn('[orderService.js] getOrderCounts - API call not successful or no data. Response:', JSON.stringify(response));
      return null;
    }
  } catch (e) {
    console.error('[orderService.js] Failed to get order counts:', e);
    return null;
  }
};

/**
 * 创建测试订单数据
 * 用于测试不同状态的订单显示
 */
export const createTestOrders = () => {
  try {
    const testOrders = [
      {
        id: 'test_order_1',
        orderNo: '202403150001',
        shopName: '优品文具店',
        goodsName: '定制笔记本',
        spec: 'A5/硬壳/方格',
        price: 29.9,
        count: 2,
        status: 'to_receive',
        goodsImage: '/static/images/products/notebook.png',
        address: {
          name: '张三',
          phone: '13800138000',
          province: '广东省',
          city: '深圳市',
          district: '南山区',
          detailAddress: '科技园南路88号'
        },
        totalAmount: 69.8,
        handlingFee: 5,
        shippingFee: 10,
        createTime: '2024-03-15T08:00:00.000Z',
        shipTime: '2024-03-16T10:00:00.000Z',
        updateTime: '2024-03-16T10:00:00.000Z',
        logisticsNo: 'SF1234567890123',
        logisticsCompany: '顺丰速运'
      }
    ];

    // 获取现有订单列表
    const existingOrders = getOrderList();
    
    // 检查测试订单是否已存在
    const testOrderExists = existingOrders.some(order => order.id === 'test_order_1');
    
    if (!testOrderExists) {
      // 合并测试订单和现有订单
      const newOrderList = [...testOrders, ...existingOrders];
      saveOrderList(newOrderList);
      return true;
    }
    
    return false;
  } catch (e) {
    console.error('创建测试订单失败:', e);
    return false;
  }
}; 