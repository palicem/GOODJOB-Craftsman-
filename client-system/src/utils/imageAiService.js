import { IMAGE_ACCESS_KEY, IMAGE_SECRET_KEY } from './ai.secret.js';
const API_HOST = 'https://visual.volcengineapi.com';

// 生成规范的UTC时间字符串
const getUTCDate = () => {
  const date = new Date();
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
};

// 生成签名
const generateSignature = (method, path, params, date) => {
  const headers = {
    'content-type': 'application/json',
    'host': 'visual.volcengineapi.com',
    'x-date': date
  };

  const canonicalRequest = [
    method,
    path,
    Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&'),
    Object.keys(headers).sort().map(key => `${key}:${headers[key]}`).join('\n')
  ].join('\n');

  const stringToSign = [
    'HMAC-SHA256',
    date,
    CryptoJS.SHA256(canonicalRequest).toString()
  ].join('\n');

  const signature = CryptoJS.HmacSHA256(stringToSign, IMAGE_SECRET_KEY).toString();
  return signature;
};

// 生成图片
export const generateImage = async (prompt, options = {}) => {
  console.log('开始生成图片:', { prompt, options });
  
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
      'Authorization': `HMAC-SHA256 AccessKey=${IMAGE_ACCESS_KEY}, SignedHeaders=content-type;host;x-date, Signature=${signature}`
    };

    const requestBody = {
      req_key: 'high_aes_general_v20',
      prompt: prompt,
      seed: options.seed || -1,
      scale: options.scale || 3.5,
      ddim_steps: options.ddim_steps || 16,
      width: options.width || 512,
      height: options.height || 512,
      use_sr: options.use_sr !== false,
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

    if (response.data.code === 10000) {
      // 保存图片到本地
      const imageUrl = response.data.data.image_urls[0];
      console.log('获取到图片URL:', imageUrl);
      
      const savedPath = await saveImageToLocal(imageUrl);
      console.log('图片已保存到本地:', savedPath);
      
      return {
        localPath: savedPath,
        remoteUrl: imageUrl,
        keywords: response.data.data.rephraser_result
      };
    } else {
      console.error('API返回错误:', response.data);
      throw new Error(response.data.message || '生成图片失败');
    }
  } catch (error) {
    console.error('生成图片错误:', error);
    throw error;
  }
};

// 保存图片到本地
const saveImageToLocal = async (url) => {
  console.log('开始下载图片:', url);
  
  try {
    // 下载图片
    const downloadResult = await uni.downloadFile({
      url: url
    });

    console.log('图片下载结果:', downloadResult);

    if (downloadResult.statusCode === 200) {
      // 生成本地存储路径
      const date = new Date();
      const datePath = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;
      const savedPath = `/static/generated_images/${datePath}/${fileName}`;

      console.log('准备保存图片:', { datePath, fileName, savedPath });

      // 确保目录存在
      await uni.saveFile({
        tempFilePath: downloadResult.tempFilePath,
        filePath: savedPath
      });

      console.log('图片保存成功:', savedPath);
      return savedPath;
    } else {
      console.error('下载图片失败:', downloadResult);
      throw new Error('下载图片失败');
    }
  } catch (error) {
    console.error('保存图片错误:', error);
    throw error;
  }
};

// 图片生成图片
export async function imageToImage(imageFile, prompt) {
  try {
    // 首先上传图片
    const uploadResult = await uploadImage(imageFile);
    
    // 调用图生图API
    const response = await uni.request({
      url: `${API_HOST}/image-to-image`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${IMAGE_ACCESS_KEY}`
      },
      data: {
        image: uploadResult.url,
        prompt,
        size: '1024x1024',
        quality: 'standard',
        format: 'png'
      }
    });

    if (response.statusCode === 200) {
      return {
        success: true,
        imageUrl: response.data.url
      };
    } else {
      throw new Error(response.data.message || '生成图片失败');
    }
  } catch (error) {
    console.error('图生图错误:', error);
    throw new Error('生成图片失败，请重试');
  }
}

// 修改图片风格
export async function modifyImageStyle(imageFile, style) {
  try {
    // 首先上传图片
    const uploadResult = await uploadImage(imageFile);
    
    // 调用修改风格API
    const response = await uni.request({
      url: `${API_HOST}/style-transfer`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${IMAGE_ACCESS_KEY}`
      },
      data: {
        image: uploadResult.url,
        style,
        size: '1024x1024',
        quality: 'standard',
        format: 'png'
      }
    });

    if (response.statusCode === 200) {
      return {
        success: true,
        imageUrl: response.data.url
      };
    } else {
      throw new Error(response.data.message || '修改风格失败');
    }
  } catch (error) {
    console.error('修改风格错误:', error);
    throw new Error('修改风格失败，请重试');
  }
}

// 上传图片
async function uploadImage(filePath) {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${API_HOST}/upload`,
      filePath,
      name: 'image',
      header: {
        'Authorization': `Bearer ${IMAGE_ACCESS_KEY}`
      },
      success: (uploadRes) => {
        try {
          const data = JSON.parse(uploadRes.data);
          if (uploadRes.statusCode === 200 && data.url) {
            resolve({ url: data.url });
          } else {
            reject(new Error(data.message || '上传图片失败'));
          }
        } catch (e) {
          reject(new Error('解析上传响应失败'));
        }
      },
      fail: (error) => {
        reject(new Error('上传图片失败: ' + error.errMsg));
      }
    });
  });
}

// 获取AI配置
export function getAIConfig() {
  return {
    apiKey: IMAGE_ACCESS_KEY,
    baseUrl: API_HOST,
    defaultParams: {
      size: '1024x1024',
      quality: 'standard',
      style: 'natural',
      format: 'png'
    }
  };
}

// 设置API密钥
export function setApiKey(apiKey) {
  IMAGE_ACCESS_KEY = apiKey;
}

// 设置API基础URL
export function setBaseUrl(baseUrl) {
  API_HOST = baseUrl;
}

// 更新默认参数
export function updateDefaultParams(params) {
  Object.assign(getAIConfig().defaultParams, params);
} 