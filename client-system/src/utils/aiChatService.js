import { IMAGE_ACCESS_KEY, IMAGE_SECRET_KEY } from './ai.secret.js';

const ACCESS_KEY = IMAGE_ACCESS_KEY;
const SECRET_KEY = IMAGE_SECRET_KEY;
const API_HOST = 'https://visual.volcengineapi.com';
const API_VERSION = '2022-08-31';
const API_SERVICE = 'cv';
const API_REGION = 'cn-north-1';

const API_BASE_URL = 'http://localhost:3000';

// 生成规范的UTC时间字符串
const getUTCDate = () => {
  const date = new Date();
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
};

// 生成签名
const generateSignature = (method, path, params, date) => {
  const canonicalHeaders = {
    'content-type': 'application/json',
    'host': new URL(API_HOST).host,
    'x-date': date
  };

  // 添加服务特定的头部
  const signedHeaders = Object.keys(canonicalHeaders).sort();
  
  const canonicalRequest = [
    method.toUpperCase(),
    path,
    Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&'),
    Object.entries(canonicalHeaders)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('\n')
  ].join('\n');

  console.log('规范化请求字符串:', canonicalRequest);

  const stringToSign = [
    'HMAC-SHA256',
    date,
    CryptoJS.SHA256(canonicalRequest).toString()
  ].join('\n');

  console.log('待签名字符串:', stringToSign);

  const signature = CryptoJS.HmacSHA256(stringToSign, SECRET_KEY).toString();
  console.log('生成的签名:', signature);

  return signature;
};

// AI对话并生成图片
export const chatAndGenerateImage = async (message) => {
  console.log('开始处理消息:', message);
  
  try {
    const path = '/';
    const method = 'POST';
    const date = getUTCDate();
    
    const params = {
      Action: 'CVProcess',
      Version: '2022-08-31'
    };

    console.log('准备请求参数:', { path, method, date, params });

    const signature = generateSignature(method, path, params, date);
    const headers = {
      'Content-Type': 'application/json',
      'Host': 'visual.volcengineapi.com',
      'X-Date': date,
      'Authorization': `HMAC-SHA256 AccessKey=${ACCESS_KEY}, SignedHeaders=content-type;host;x-date, Signature=${signature}`
    };

    const requestBody = {
      req_key: 'high_aes_general_v20',
      prompt: message,
      seed: -1,
      scale: 3.5,
      ddim_steps: 16,
      width: 512,
      height: 512,
      use_sr: true,
      return_url: true,
      logo_info: {
        add_logo: false
      }
    };

    console.log('发送请求:', {
      url: `${API_HOST}?${Object.keys(params).map(key => `${key}=${params[key]}`).join('&')}`,
      method,
      headers,
      requestBody
    });

    const response = await uni.request({
      url: `${API_HOST}?${Object.keys(params).map(key => `${key}=${params[key]}`).join('&')}`,
      method: method,
      header: headers,
      data: requestBody
    });

    console.log('收到响应:', response);

    if (response.statusCode !== 200 || response.data.code !== 10000) {
      throw new Error(response.data?.message || '请求失败');
    }

    return {
      imageUrl: response.data.data.image_urls[0],
      rephraserResult: response.data.data.rephraser_result
    };
  } catch (error) {
    console.error('处理消息错误:', error);
    throw new Error(`处理失败: ${error.errMsg || error.message || '未知错误'}`);
  }
};

// 测试API连接
export const testApiConnection = async () => {
  try {
    console.log('开始测试API连接...');
    
    // 首先测试健康检查接口
    const healthCheck = await uni.request({
      url: `${API_BASE_URL}/health`,
      method: 'GET'
    });

    if (healthCheck.statusCode !== 200) {
      throw new Error('后端服务未启动');
    }

    console.log('健康检查通过，开始测试API...');
    
    const response = await uni.request({
      url: `${API_BASE_URL}/test`,
      method: 'GET'
    });

    console.log('测试响应:', response);

    if (response.statusCode === 200 && response.data.success) {
      return {
        success: true,
        message: '连接成功',
        data: response.data.data
      };
    } else {
      return {
        success: false,
        message: response.data.message || '请求失败',
        error: response.data.error
      };
    }
  } catch (error) {
    console.error('测试连接错误:', error);
    return {
      success: false,
      message: `连接错误: ${error.errMsg || error.message || '未知错误'}`,
      error: error
    };
  }
};

// 生成图片
export const generateImage = async (prompt) => {
  try {
    console.log('开始生成图片:', prompt);
    
    const response = await uni.request({
      url: `${API_BASE_URL}/generate-image`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: { prompt }
    });

    console.log('生成响应:', response);

    if (response.statusCode === 200 && response.data.code === 10000) {
      return {
        imageUrl: response.data.data.image_urls[0],
        rephraserResult: response.data.data.rephraser_result
      };
    } else {
      throw new Error(response.data.message || '生成失败');
    }
  } catch (error) {
    console.error('生成图片错误:', error);
    throw new Error(`生成失败: ${error.errMsg || error.message || '未知错误'}`);
  }
};

// 添加重试机制的包装函数
export const processWithRetry = async (message, maxRetries = 3) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await generateImage(message);
    } catch (error) {
      console.log(`第 ${i + 1} 次尝试失败:`, error);
      lastError = error;
      // 等待一段时间再重试
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  
  throw lastError;
}; 