import api from './apiService';

// 商品模块API
const productAPI = {
  // 2.1 获取商品列表 (可能需要调整或替换为按需加载)
  getProductList: async (params = {}) => {
    console.warn('[productService.getProductList] This function might need review for backend compatibility.');
    // return api.get('/api/v1/product/list', params, false); // 旧的调用方式
    try {
      // 假设全局商品列表的API (如果存在)
      const response = await api.get('/api/products', params, false); // 调整了API路径，需要确认后端是否有此接口
      if (response.success) {
        return { success: true, data: response.data, message: '全局商品列表获取成功' };
      } else {
        return { success: false, data: [], message: response.message || '获取全局商品列表失败' };
      }
    } catch (error) {
      console.error('[productService.getProductList] Error:', error);
      return { success: false, data: [], message: error.message || '网络错误' };
    }
  },
  
  // 2.2 获取商品详情
  getProductDetail: async (shopId, productId) => { // 添加 shopId 参数
    if (!shopId || !productId) {
      console.error('[productService.getProductDetail] Shop ID and Product ID are required.');
      return { success: false, message: 'Shop ID and Product ID are required.' };
    }
    try {
      // const response = await api.get(`/api/v1/product/${productId}`, {}, false); // 旧的调用方式
      const response = await api.get(`/api/shops/${shopId}/products/${productId}`, {}, false); // 更新API路径
      if (response.success) {
        return { success: true, data: response.data, message: '商品详情获取成功' };
      } else {
        return { success: false, message: response.message || '获取商品详情失败' };
      }
    } catch (error) {
      console.error('[productService.getProductDetail] Error:', error);
      return { success: false, message: error.message || '网络错误' };
    }
  },
  
  // 5.1 搜索商品 (需要后端支持)
  searchProducts: async (params) => {
    console.warn('[productService.searchProducts] This function requires a backend search endpoint.');
    // return api.get('/api/v1/search', params, false); // 旧的调用方式
    try {
      const response = await api.get('/api/search/products', params, false); // 假设的搜索API路径
       if (response.success) {
        return { success: true, data: response.data, message: '商品搜索成功' };
      } else {
        return { success: false, data: [], message: response.message || '商品搜索失败' };
      }
    } catch (error) {
      console.error('[productService.searchProducts] Error:', error);
      return { success: false, data: [], message: error.message || '网络错误' };
    }
  },
  
  // 5.2 获取热门搜索关键词 (需要后端支持)
  getHotKeywords: async () => {
    console.warn('[productService.getHotKeywords] This function requires a backend hot keywords endpoint.');
    // return api.get('/api/v1/search/hot-keywords', {}, false); // 旧的调用方式
    try {
      const response = await api.get('/api/search/hot-keywords', {}, false); // 假设的API路径
      if (response.success) {
        return { success: true, data: response.data, message: '热门关键词获取成功' };
      } else {
        return { success: false, data: [], message: response.message || '获取热门关键词失败' };
      }
    } catch (error) {
      console.error('[productService.getHotKeywords] Error:', error);
      return { success: false, data: [], message: error.message || '网络错误' };
    }
  },
  
  // 根据店铺ID获取商品列表
  getProductsByShop: async (shopId) => {
    if (!shopId) {
      console.error('[productService.getProductsByShop] Shop ID is required.');
      return { success: false, message: 'Shop ID is required.', data: [] };
    }
    try {
      // return api.get(`/api/shops/${shopId}/products`, {}, false); // 旧的调用方式，没有完整的Promise和错误处理
      const response = await api.get(`/api/shops/${shopId}/products`, {}, false);
      if (response.success) {
        return { success: true, data: response.data, message: '店铺商品列表获取成功' };
      } else {
        return { success: false, data: [], message: response.message || '获取店铺商品列表失败' };
      }
    } catch (error) {
      console.error('[productService.getProductsByShop] Error:', error);
      return { success: false, data: [], message: error.message || '网络错误' };
    }
  },

  getProductsByCategory: async (category) => {
    // 此函数为示例，实际应调用API
    console.warn('getProductsByCategory is using mock data, please implement API call.');
    const mockProducts = [
      // ... mock data ...
    ];
    return { success: true, data: mockProducts.filter(p => p.category === category) };
  },

  // New method to get all products for the homepage
  getAllProductsForHome: async (params = {}) => { // Added params for future flexibility (e.g., totalLimit)
    try {
      // Changed to the new dynamic endpoint, correcting the full path
      const response = await api.get('/api/shops/home/all-products-dynamic', params);
      if (response.success && Array.isArray(response.data)) {
        // The backend now returns the full response object including success, data, message
        // Each product in response.data should now include shop_id and shop_name from the backend
        return response; 
      }
      console.warn('获取首页(动态)商品失败:', response.message);
      return { success: false, data: [], message: response.message || '获取首页(动态)商品失败' };
    } catch (error) {
      console.error('获取首页(动态)商品异常:', error);
      return { success: false, data: [], message: '获取首页(动态)商品请求异常' };
    }
  }
};

export default productAPI; 