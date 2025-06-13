require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const CryptoJS = require('crypto-js');

const app = express();
app.use(cors());
app.use(express.json());

// API配置
const ACCESS_KEY = process.env.IMAGE_ACCESS_KEY;
const SECRET_KEY = process.env.IMAGE_SECRET_KEY;
const API_HOST = 'https://visual.volcengineapi.com';
const API_VERSION = '2022-08-31';
const API_SERVICE = 'cv';
const API_REGION = 'cn-north-1';

// 生成UTC时间字符串
const getUTCDate = () => {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
};

// 生成签名
const generateSignature = (method, path, params, date) => {
  const canonicalHeaders = {
    'content-type': 'application/json',
    'host': new URL(API_HOST).host,
    'x-date': date
  };

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

  const stringToSign = [
    'HMAC-SHA256',
    date,
    CryptoJS.SHA256(canonicalRequest).toString()
  ].join('\n');

  return CryptoJS.HmacSHA256(stringToSign, SECRET_KEY).toString();
};

// 图片生成接口
app.post('/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;
    const path = '/';
    const method = 'POST';
    const date = getUTCDate();
    
    const params = {
      Action: 'CVProcess',
      Version: API_VERSION
    };

    const signature = generateSignature(method, path, params, date);
    const headers = {
      'Content-Type': 'application/json',
      'Host': new URL(API_HOST).host,
      'X-Date': date,
      'Authorization': `HMAC-SHA256 AccessKey=${ACCESS_KEY}, SignedHeaders=content-type;host;x-date, Signature=${signature}`
    };

    const requestBody = {
      req_key: 'high_aes_general_v20',
      prompt,
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

    const response = await axios({
      url: `${API_HOST}?${Object.keys(params).map(key => `${key}=${params[key]}`).join('&')}`,
      method,
      headers,
      data: requestBody
    });

    res.json(response.data);
  } catch (error) {
    console.error('生成图片错误:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message,
      error: error.response?.data || error.message
    });
  }
});

// 测试接口
app.get('/test', async (req, res) => {
  try {
    const path = '/';
    const method = 'POST';
    const date = getUTCDate();
    
    const params = {
      Action: 'CVProcess',
      Version: API_VERSION
    };

    const signature = generateSignature(method, path, params, date);
    const headers = {
      'Content-Type': 'application/json',
      'Host': new URL(API_HOST).host,
      'X-Date': date,
      'Authorization': `HMAC-SHA256 AccessKey=${ACCESS_KEY}, SignedHeaders=content-type;host;x-date, Signature=${signature}`
    };

    const requestBody = {
      req_key: 'high_aes_general_v20',
      prompt: '蓝天白云',
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

    const response = await axios({
      url: `${API_HOST}?${Object.keys(params).map(key => `${key}=${params[key]}`).join('&')}`,
      method,
      headers,
      data: requestBody
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('测试连接错误:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message,
      error: error.response?.data || error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
}); 