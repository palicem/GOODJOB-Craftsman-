/**
 * 收藏服务
 * 管理商品收藏和店铺收藏
 */
import api from './apiService';

const favoriteAPI = {
  // --- 商品收藏 ---

  /**
   * 获取用户收藏的商品列表
   * @param {Object} params - 可选参数，如分页 { page, limit }
   * @returns {Promise<Array>} 包含商品详情和店铺详情的收藏列表
   */
  getFavoriteProducts: async (params = {}) => {
    try {
      // 使用新的后端路由 /api/favorites
      const response = await api.get('/api/favorites', params);
      if (response.success && response.data) {
        // 后端返回的数据直接是包含 product_details 和 shop_details 的列表
        return response.data; // response.data 已经是数组了，如果后端返回 pagination，则为 response.data.data
      }
      console.warn('获取收藏商品失败:', response.message);
      return []; // 或者根据后端分页结构返回 { data: [], pagination: {} }
    } catch (error) {
      console.error('获取收藏商品异常:', error);
      return [];
    }
  },

  /**
   * 添加商品到收藏
   * @param {string} productId 商品ID
   * @param {string} shopId 商品所属的店铺ID
   * @returns {Promise<Object|null>} 操作结果或null
   */
  addProductToFavorites: async (productId, shopId) => {
    if (!shopId) {
      console.error('添加收藏失败: shopId 不能为空');
      uni.showToast({ title: '店铺信息缺失，收藏失败', icon:'none' });
      return { success: false, message: '店铺信息缺失' }; // Return a consistent object
    }
    try {
      const response = await api.post('/api/favorites', { productId, shopId });
      if (response.success) {
        uni.$emit('favoritesUpdated', { type: 'product', action: 'add', productId });
        // 后端成功添加时，返回的数据包含新收藏项，且 response.success 为 true
        return { success: true, data: response.data }; 
      }
      // 处理添加失败的情况
      console.warn('添加商品收藏失败:', response.message);
      uni.showToast({ title: response.message || '收藏失败', icon:'none' });
      // 检查是否因为已存在而失败
      if (response.message && response.message.includes('已在收藏中')) {
        return { success: false, alreadyExists: true, message: response.message };
      }
      return { success: false, message: response.message || '收藏失败' };
    } catch (error) {
      console.error('添加商品收藏异常:', error);
      uni.showToast({ title: '收藏请求异常', icon:'none' });
      return { success: false, message: '收藏请求异常' };
    }
  },

  /**
   * 从收藏中移除商品
   * @param {string} productId 商品ID
   * @returns {Promise<boolean>} 操作结果
   */
  removeProductFromFavorites: async (productId) => {
    try {
      // 使用新的后端路由 /api/favorites/:productId
      const response = await api.delete(`/api/favorites/${productId}`);
      if (response.success) {
        uni.$emit('favoritesUpdated', { type: 'product', action: 'remove', productId });
        return true;
      }
      console.warn('移除商品收藏失败:', response.message);
      uni.showToast({ title: response.message || '取消收藏失败', icon:'none' });
      return false;
    } catch (error) {
      console.error('移除商品收藏异常:', error);
      uni.showToast({ title: '取消收藏请求异常', icon:'none' });
      return false;
    }
  },

  /**
   * 检查商品是否已收藏
   * @param {string} productId 商品ID
   * @returns {Promise<boolean>} 是否收藏
   */
  isProductFavorite: async (productId) => {
    try {
      // 使用新的后端路由 /api/favorites/status/:productId
      const response = await api.get(`/api/favorites/status/${productId}`);
      return response.success && response.isFavorited; // 后端返回 { success: true, isFavorited: boolean }
    } catch (error) {
      // console.error('检查商品收藏状态异常:', error); // 在生产中可能不需要打印每个检查错误
      return false; // 网络错误等情况，默认未收藏
    }
  },

  // --- 店铺收藏 ---

  /**
   * 获取用户收藏的店铺列表
   * @param {Object} params - 可选参数，如分页 { page, limit }
   * @returns {Promise<Array>} 店铺列表
   */
  getFavoriteShops: async (params = {}) => {
    try {
      // 移除 /v1
      const response = await api.get('/api/favorites/shops', params);
      // 检查 response 是否是期望的包装对象结构
      if (response && typeof response.success !== 'undefined') { // 这是一个包装对象
        if (response.success && response.data && Array.isArray(response.data.data) && response.data.pagination) {
           // 后端返回 { success: true, data: { data: [...], pagination: {...} } }
           // 或者后端返回 { success: true, data: [...], pagination: {...} } (当前后端结构)
           return response.data.data || response.data; // 优先取 response.data.data，如果不存在则取 response.data
        } else if (response.success && Array.isArray(response.data)) {
            // 后端返回 { success: true, data: [...] }
            return response.data;
        }
        console.warn('获取收藏店铺失败 (API成功但数据格式问题):', response.message || response);
        return [];
      } else if (Array.isArray(response)) { // api.get 直接返回了数组
        return response;
      }
      // 其他未知格式
      console.warn('获取收藏店铺失败 (响应格式未知):', response);
      return [];
    } catch (error) {
      console.error('获取收藏店铺异常:', error);
      return [];
    }
  },

  /**
   * 添加店铺到收藏
   * @param {string} shopId 店铺ID
   * @returns {Promise<Object|null>} 收藏成功的店铺信息或null
   */
  addShopToFavorites: async (shopId) => {
    if (!shopId) {
      console.error('添加店铺收藏失败: shopId 不能为空');
      uni.showToast({ title: '店铺ID缺失，无法收藏', icon: 'none' });
      return { success: false, message: '店铺ID缺失' };
    }
    try {
      const response = await api.post('/api/favorites/shops', { shopId });
      if (response.success) {
        uni.showToast({ title: '店铺收藏成功', icon: 'success' });
        uni.$emit('favoritesUpdated', { type: 'shop', action: 'add', shopId });
        return { success: true, data: response.data };
      }
      // 处理后端返回 { success: false, message: '...' } 的情况
      console.warn('添加店铺收藏失败:', response.message);
      uni.showToast({ title: response.message || '店铺收藏失败', icon: 'none' });
      return { success: false, message: response.message || '店铺收藏失败' };
    } catch (error) {
      console.error('添加店铺收藏异常:', error);
      uni.showToast({ title: '店铺收藏请求异常', icon: 'none' });
      return { success: false, message: '店铺收藏请求异常' };
    }
  },

  /**
   * 从收藏中移除店铺
   * @param {string} shopId 店铺ID
   * @returns {Promise<boolean>} 操作结果
   */
  removeShopFromFavorites: async (shopId) => {
    if (!shopId) {
      console.error('移除店铺收藏失败: shopId 不能为空');
      uni.showToast({ title: '店铺ID缺失，无法取消收藏', icon: 'none' });
      return false; // 或者 return { success: false, message: '店铺ID缺失' };
    }
    try {
      const response = await api.delete(`/api/favorites/shops/${shopId}`);
      if (response.success) {
        uni.showToast({ title: '已取消店铺收藏', icon: 'success' });
        uni.$emit('favoritesUpdated', { type: 'shop', action: 'remove', shopId });
        return true;
      }
      console.warn('移除店铺收藏失败:', response.message);
      uni.showToast({ title: response.message || '取消店铺收藏失败', icon: 'none' });
      return false;
    } catch (error) {
      console.error('移除店铺收藏异常:', error);
      uni.showToast({ title: '取消店铺收藏请求异常', icon: 'none' });
      return false;
    }
  },

  /**
   * 检查店铺是否已收藏
   * @param {string} shopId 店铺ID
   * @returns {Promise<boolean>} 是否收藏
   */
  isShopFavorite: async (shopId) => {
    if (!shopId) {
      console.warn('检查店铺收藏状态: shopId 不能为空');
      return false; 
    }
    try {
      const response = await api.get(`/api/favorites/shops/${shopId}/status`);
      // 确保后端响应了 success 字段
      if (typeof response.success !== 'undefined') {
        return response.success && response.isFavorited;
      } 
      // 如果后端响应结构不符合预期，也视为失败/未收藏
      console.warn('检查店铺收藏状态响应格式不正确:', response);
      return false;
    } catch (error) {
      // console.error('检查店铺收藏状态异常:', error); // 网络错误等，可以静默处理
      return false; 
    }
  }
};

export default favoriteAPI; 