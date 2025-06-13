import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const service = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 15000
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 从localStorage获取token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    
    // 动态获取 shopId，如果请求是针对特定店铺的
    // 这个逻辑可能更适合放在调用 API 的地方，或者通过一个集中的 API 服务层来处理
    // const currentShopId = localStorage.getItem('currentShop');
    // if (config.url.includes(':shopId') && currentShopId) {
    //   config.url = config.url.replace(':shopId', currentShopId);
    // } else if (config.url.includes(':shopId')) {
    //   // Handle missing shopId for shop-specific routes - perhaps show an error or prevent request
    //   console.warn('Request to a shop-specific endpoint without a currentShopId selected.');
    //   // return Promise.reject(new Error('No shop selected for this operation.'));
    // }

    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    
    // 如果响应不成功 (这里的 code !== 200 可能是您旧API的约定)
    // 新的后端可能直接使用 HTTP 状态码，或者有不同的成功/错误结构
    // 我们假设成功时直接返回 data，错误时拦截器会捕捉 HTTP error status
    // if (res.code !== 200 && res.code !== 201) { // Adjust based on your new backend's success codes
    //   ElMessage({
    //     message: res.message || '请求失败',
    //     type: 'error',
    //     duration: 5 * 1000
    //   });

    //   // 处理特定错误码
    //   if (res.code === 401) {
    //     // token过期，需要重新登录
    //     // localStorage.removeItem('admin_token');
    //     // window.location.href = '/login'; // Or your admin login page
    //   }
    //   return Promise.reject(new Error(res.message || '请求失败'));
    // }
    return res; // Directly return the response data for successful requests (usually in response.data)
  },
  error => {
    console.error('响应错误:', error)
    ElMessage({
      message: error.message || '请求失败',
      type: 'error',
      duration: 5 * 1000
    })
    return Promise.reject(error)
  }
)

export default service 