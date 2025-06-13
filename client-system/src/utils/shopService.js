import api from './apiService';

const shopAPI = {
  /**
   * 根据店铺ID获取店铺公开信息 (profile)
   * @param {string} shopId - 店铺ID
   * @returns {Promise<Object>} 包含 success, data (店铺信息), message 的对象
   */
  getShopProfileById: async (shopId) => {
    if (!shopId) {
      console.error('[shopService.getShopProfileById] Shop ID is required.');
      return { success: false, message: 'Shop ID is required.', data: null };
    }
    try {
      // 后端接口路径为 /api/shops/:shopId/profile
      const response = await api.get(`/api/shops/${shopId}/profile`, {}, false); // 通常店铺公开信息不需要认证
      if (response && response.success) {
        return { success: true, data: response.data, message: '店铺信息获取成功' };
      } else {
        console.warn('[shopService.getShopProfileById] Failed to fetch shop profile:', response?.message);
        return { success: false, message: response?.message || '获取店铺信息失败', data: null };
      }
    } catch (error) {
      console.error('[shopService.getShopProfileById] Error fetching shop profile:', error);
      // 从apiService返回的error可能已经是格式化过的，也可能是网络错误本身
      const errorMessage = error?.data?.message || error?.message || '网络请求异常';
      return { success: false, message: errorMessage, data: null };
    }
  },

  // 未来可以添加更多店铺相关的服务函数，例如:
  // searchShops: async (params) => { ... },
  // getNearbyShops: async (location) => { ... },
};

export default shopAPI; 