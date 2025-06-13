/**
 * API服务
 * 
 * 本文件为API服务模板，后期前后端分离时实现。
 * 所有与后端的通信都应通过此服务完成，不要在页面组件中直接调用请求。
 */

// API基础URL
const BASE_URL = '/api/v1';

// 请求方法封装
const request = (url, method = 'GET', data = {}, token = true) => {
  return new Promise((resolve, reject) => {
    // 组装完整请求URL
    const requestUrl = BASE_URL + url;
    
    // 准备请求头
    const header = {
      'Content-Type': 'application/json'
    };
    
    // 如果需要认证，添加token
    if (token) {
      const userToken = uni.getStorageSync('token');
      if (userToken) {
        header['Authorization'] = `Bearer ${userToken}`;
      }
    }
    
    // 发送请求
    uni.request({
      url: requestUrl,
      method,
      data,
      header,
      success: (res) => {
        // 接口调用成功
        if (res.statusCode === 200) {
          // 业务逻辑成功
          if (res.data && res.data.success) {
            resolve(res.data);
          } else {
            // 业务逻辑失败
            const message = (res.data && res.data.message) || '请求失败';
            uni.showToast({
              title: message,
              icon: 'none'
            });
            reject(new Error(message));
          }
        } else if (res.statusCode === 401) {
          // 未认证，清除登录状态，跳转登录页
          uni.removeStorageSync('token');
          uni.removeStorageSync('currentUser');
          
          uni.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none'
          });
          
          setTimeout(() => {
            uni.reLaunch({
              url: '/pages/login/login'
            });
          }, 1500);
          
          reject(new Error('登录已过期'));
        } else {
          // 其他状态码
          uni.showToast({
            title: `请求错误(${res.statusCode})`,
            icon: 'none'
          });
          reject(new Error(`请求错误: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        // 接口调用失败
        uni.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
        reject(err);
      }
    });
  });
};

/**
 * 用户模块API
 */
export const userApi = {
  // 用户注册
  register: (data) => {
    return request('/user/register', 'POST', data, false);
  },
  
  // 用户登录
  login: (username, password) => {
    return request('/user/login', 'POST', { username, password }, false);
  },
  
  // 检查用户名是否存在
  checkUsername: (username) => {
    return request(`/user/check-username/${username}`, 'GET', {}, false);
  },
  
  // 获取用户信息
  getUserInfo: () => {
    return request('/user/info', 'GET');
  },
  
  // 登出
  logout: () => {
    return request('/user/logout', 'POST');
  }
};

/**
 * 首页模块API
 */
export const homeApi = {
  // 获取轮播图
  getBanners: () => {
    return request('/home/banners', 'GET', {}, false);
  },
  
  // 获取分类
  getCategories: () => {
    return request('/home/categories', 'GET', {}, false);
  },
  
  // 获取优惠商品
  getPromotions: (limit = 3) => {
    return request('/home/promotions', 'GET', { limit }, false);
  },
  
  // 获取热门推荐
  getHotItems: (limit = 4) => {
    return request('/home/hot-items', 'GET', { limit }, false);
  },
  
  // 获取猜你喜欢
  getRecommendations: (page = 1, pageSize = 5) => {
    return request('/home/recommendations', 'GET', { page, pageSize }, false);
  }
};

/**
 * 购物车模块API
 */
export const cartApi = {
  // 获取购物车列表
  getCartList: () => {
    return request('/cart/items', 'GET');
  },
  
  // 添加商品到购物车
  addToCart: (goodsId, count = 1, spec = '') => {
    return request('/cart/add', 'POST', { goodsId, count, spec });
  },
  
  // 更新商品数量
  updateCount: (cartItemId, count) => {
    return request('/cart/update-count', 'PUT', { cartItemId, count });
  },
  
  // 删除购物车商品
  removeItem: (cartItemId) => {
    return request(`/cart/remove/${cartItemId}`, 'DELETE');
  },
  
  // 更新商品选中状态
  toggleSelect: (cartItemId, selected) => {
    return request('/cart/toggle-select', 'PUT', { cartItemId, selected });
  }
};

/**
 * 订单模块API
 */
export const orderApi = {
  // 获取订单列表
  getOrderList: (status = 0, page = 1, pageSize = 10) => {
    return request('/orders', 'GET', { status, page, pageSize });
  },
  
  // 获取订单详情
  getOrderDetail: (orderId) => {
    return request(`/orders/${orderId}`, 'GET');
  },
  
  // 创建订单
  createOrder: (addressId, cartItemIds, remark = '') => {
    return request('/orders/create', 'POST', { addressId, cartItemIds, remark });
  },
  
  // 取消订单
  cancelOrder: (orderId, reason) => {
    return request(`/orders/${orderId}/cancel`, 'POST', { reason });
  },
  
  // 确认收货
  confirmReceipt: (orderId) => {
    return request(`/orders/${orderId}/confirm`, 'POST');
  },
  
  // 删除订单
  deleteOrder: (orderId) => {
    return request(`/orders/${orderId}`, 'DELETE');
  }
};

/**
 * 搜索模块API
 */
export const searchApi = {
  // 搜索商品
  searchGoods: (keyword, page = 1, pageSize = 10, sort = 'default') => {
    return request('/search', 'GET', { keyword, page, pageSize, sort }, false);
  },
  
  // 获取热门搜索关键词
  getHotKeywords: () => {
    return request('/search/hot-keywords', 'GET', {}, false);
  }
};

/**
 * 商品模块API
 */
export const goodsApi = {
  // 获取商品详情
  getGoodsDetail: (goodsId) => {
    return request(`/goods/${goodsId}`, 'GET', {}, false);
  }
};

/**
 * 定制服务模块API
 */
export const customApi = {
  // 获取设计方案列表
  getDesigns: (type = 'all', page = 1, pageSize = 10) => {
    return request('/custom/design', 'GET', { type, page, pageSize }, false);
  },
  
  // 获取设计方案详情
  getDesignDetail: (designId) => {
    return request(`/custom/design/${designId}`, 'GET', {}, false);
  },
  
  // 提交定制需求
  submitRequirement: (data) => {
    return request('/custom/requirement', 'POST', data);
  },
  
  // 获取样品申请表单
  getSampleForm: () => {
    return request('/custom/sample/form', 'GET', {}, false);
  },
  
  // 提交样品申请
  applySample: (data) => {
    return request('/custom/sample/apply', 'POST', data);
  },
  
  // 获取定制订单列表
  getCustomOrders: (status = 0, page = 1, pageSize = 10) => {
    return request('/custom/orders', 'GET', { status, page, pageSize });
  },
  
  // 获取定制订单详情
  getCustomOrderDetail: (orderId) => {
    return request(`/custom/orders/${orderId}`, 'GET');
  },
  
  // 确认设计方案
  confirmDesign: (orderId, designId, feedback = '') => {
    return request(`/custom/orders/${orderId}/confirm-design`, 'POST', { designId, feedback });
  },
  
  // 提交设计反馈
  submitDesignFeedback: (orderId, designId, feedback, attachments = []) => {
    return request(`/custom/orders/${orderId}/design-feedback`, 'POST', { designId, feedback, attachments });
  },
  
  // 确认样品
  confirmSample: (orderId, sampleId, feedback = '', isApproved = true) => {
    return request(`/custom/orders/${orderId}/confirm-sample`, 'POST', { sampleId, feedback, isApproved });
  }
};

// 导出所有API服务
export default {
  userApi,
  homeApi,
  cartApi,
  orderApi,
  searchApi,
  goodsApi,
  customApi
}; 