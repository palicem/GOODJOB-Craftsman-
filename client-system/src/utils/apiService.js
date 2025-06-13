// API服务统一管理
const BASE_URL = 'http://localhost:3000';

// 获取存储的token
const getToken = () => {
  try {
    return uni.getStorageSync('token') || '';
  } catch (e) {
    console.error('获取token失败:', e);
    return '';
  }
};

// 统一请求方法
const request = (url, method, data, needAuth = true) => {
  return new Promise((resolve, reject) => {
    const header = {};
    
    // 添加认证头
    if (needAuth) {
      const token = getToken();
      if (token) {
        header['Authorization'] = `Bearer ${token}`;
      } else {
        // 未登录，跳转到登录页
        uni.navigateTo({ url: '/pages/login/login' });
        reject(new Error('未登录'));
        return;
      }
    }
    
    // 如果是非GET请求，设置content-type
    if (method !== 'GET') {
      header['content-type'] = 'application/json';
    }
    
    uni.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header,
      success: (res) => {
        const { data } = res;
        
        // 处理接口返回的业务状态码
        if (data.success) {
          resolve(data);
        } else {
          // 处理特定错误码
          if (data.code === 401) {
            // token失效，重新登录
            uni.removeStorageSync('token');
            uni.removeStorageSync('userInfo');
            uni.navigateTo({ url: '/pages/login/login' });
          }
          
          // 显示错误提示
          uni.showToast({
            title: data.message || '请求失败',
            icon: 'none',
            duration: 2000
          });
          
          reject(data);
        }
      },
      fail: (err) => {
        console.error('请求失败:', err);
        uni.showToast({
          title: '网络错误，请稍后再试',
          icon: 'none',
          duration: 2000
        });
        reject(err);
      }
    });
  });
};

// 封装各种请求方法
const api = {
  get: (url, params = {}, needAuth = true) => {
    // 处理查询参数
    const query = Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== null)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
    
    const requestUrl = query ? `${url}?${query}` : url;
    return request(requestUrl, 'GET', {}, needAuth);
  },
  
  post: (url, data = {}, needAuth = true) => {
    return request(url, 'POST', data, needAuth);
  },
  
  put: (url, data = {}, needAuth = true) => {
    return request(url, 'PUT', data, needAuth);
  },
  
  delete: (url, needAuth = true) => {
    return request(url, 'DELETE', {}, needAuth);
  }
};

export default api; 