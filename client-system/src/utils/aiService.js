import { CHAT_API_KEY,IMAGE_ACCESS_KEY,IMAGE_SECRET_KEY } from './ai.secret.js';

const imageApiKey = IMAGE_ACCESS_KEY;
const secretKey = IMAGE_SECRET_KEY;
const apiKey = CHAT_API_KEY;

/**
 * AI 客服服务模块
 * 负责与AI模型API的通信和处理
 */

// AI模型相关配置
const AI_CONFIG = {
  // 字节跳动API正确端点
  apiEndpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
  // API密钥（实际应用中应从安全存储或环境变量获取）
  apiKey: CHAT_API_KEY,
  // API用户ID - 不再需要，从示例请求中未看到此参数
  // apiId: 'api-key-20250518185042',
  // 模型ID - 使用正确的并且已激活的模型ID
  modelId: 'doubao-1.5-vision-lite-250315',
  // 请求超时时间（毫秒）
  timeout: 30000,
  // 温度参数（影响生成文本的随机性，0.0-1.0）
  temperature: 0.7,
  // 最大生成Token数
  maxTokens: 2000,
  // 图片生成相关配置
  baseUrl: 'https://visual.volcengineapi.com',
  secretKey: 'TXpCbE1EY3dNRFJqT0Rjek5ESmpNRGt3TkdGbFlUZ3lZV0ZoTXpZMU5tUQ==',
  imageApiKey: 'AKLTODVmNjBkNmEyYjNiNDE5N2IyYWY2MjY3YWU5ZTliNmU'
};

// 模拟回复数据库 - 当API调用失败时使用
const FALLBACK_RESPONSES = [
  '您好！我是小定，很高兴为您服务。请问您想了解我们平台的哪些定制商品呢？我们提供服装、首饰、皮具等多种商品的定制服务。',
  '定制T恤的起步价是89元，具体价格会根据面料、印刷方式、数量等因素有所变化。您需要定制多少件呢？',
  '我们的定制流程一般包括：需求沟通、设计方案确认、样品制作、批量生产。从确认设计到收到成品，一般需要7-15个工作日。',
  '关于logo印刷，我们支持丝网印刷、热转印和刺绣等多种工艺。不同工艺适合不同材质和效果，您可以告诉我您的具体需求，我来为您推荐最合适的方案。',
  '抱歉，我们目前不提供食品类商品的定制服务。我们主要专注于服装、配饰、礼品等非食品类商品的定制。您可以考虑我们的定制礼盒包装服务。',
  '对于企业定制，我们有专门的团队提供一站式服务。您可以发送您的具体需求，包括预算、数量、交付时间等，我们会为您定制专属方案。'
];

/**
 * 获取模拟回复
 * @param {string} query - 用户问题
 * @returns {string} - 模拟回复
 */
const getFallbackResponse = (query) => {
  // 根据问题关键词选择合适的回复
  if (query.includes('价格') || query.includes('多少钱')) {
    return FALLBACK_RESPONSES[1];
  } else if (query.includes('流程') || query.includes('时间') || query.includes('多久')) {
    return FALLBACK_RESPONSES[2];
  } else if (query.includes('logo') || query.includes('印刷') || query.includes('工艺')) {
    return FALLBACK_RESPONSES[3];
  } else if (query.includes('食品') || query.includes('吃')) {
    return FALLBACK_RESPONSES[4];
  } else if (query.includes('企业') || query.includes('公司') || query.includes('团体')) {
    return FALLBACK_RESPONSES[5];
  } else {
    // 默认回复
    return FALLBACK_RESPONSES[0];
  }
};

/**
 * 发送消息给AI客服并获取回复
 * @param {Array} messages - 消息数组，每个消息包含role和content
 * @returns {Promise<Object>} - 返回AI回复的消息和关键词
 */
export const sendMessageToAI = async (messages) => {
  try {
    // 检查API配置是否完整
    if (!AI_CONFIG.apiEndpoint || !AI_CONFIG.apiKey) {
      throw new Error('AI API 配置不完整');
    }

    // API请求体
    const requestBody = {
      model: AI_CONFIG.modelId,
      messages: messages,
      temperature: AI_CONFIG.temperature,
      max_tokens: AI_CONFIG.maxTokens,
      stream: false
    };
    
    console.log('准备发送请求到AI API:', AI_CONFIG.apiEndpoint);
    console.log('请求体:', JSON.stringify(requestBody));
    
    // 实际API调用
    try {
      const response = await uni.request({
        url: AI_CONFIG.apiEndpoint,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_CONFIG.apiKey}`
        },
        data: requestBody,
        timeout: AI_CONFIG.timeout
      });
      
      console.log('API响应状态:', response.statusCode);
      console.log('API响应数据:', JSON.stringify(response.data));
      
      if (response.statusCode === 200 && response.data) {
        if (response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
          const aiReply = response.data.choices[0].message.content;
          
          // 解析回复和关键词
          const parts = aiReply.split('\n\n');
          const reply = parts[0];
          const keywords = parts[1]?.match(/关键词：(.+)/)?.[1]?.split('，') || [];
          
          return {
            success: true,
            reply,
            keywords
          };
        } else {
          console.error('API响应格式不符合预期:', JSON.stringify(response.data));
          return {
            success: false,
            message: '响应格式不正确'
          };
        }
      } else {
        console.error('API请求状态码异常:', response.statusCode);
        console.error('响应数据:', JSON.stringify(response.data));
        return {
          success: false,
          message: response.data?.error?.message || '请求失败'
        };
      }
    } catch (apiError) {
      console.error('API调用错误，详细信息:', apiError);
      return {
        success: false,
        message: apiError.message || '网络请求失败'
      };
    }
  } catch (error) {
    console.error('AI客服请求失败:', error);
    return {
      success: false,
      message: error.message || '处理请求失败'
    };
  }
};

/**
 * 设置AI服务配置
 * @param {Object} config - 配置对象
 */
export const configureAIService = (config) => {
  Object.assign(AI_CONFIG, config);
};

/**
 * 获取当前AI服务配置
 * @returns {Object} - 当前配置
 */
export const getAIConfig = () => {
  // 返回一个副本，避免外部直接修改配置
  return {
    ...AI_CONFIG,
    // 确保图片生成API使用正确的密钥
    apiKey: AI_CONFIG.imageApiKey,
    secretKey: AI_CONFIG.secretKey,
    baseUrl: AI_CONFIG.baseUrl
  };
};

/**
 * 清理AI历史记录中的敏感信息
 * @param {Array} history - 聊天历史记录
 * @returns {Array} - 清理后的历史记录
 */
export const sanitizeHistory = (history) => {
  // 这只是一个简单示例，实际应用中可能需要更复杂的处理
  return history.map(msg => ({
    ...msg,
    content: msg.content.replace(/\b(\d{4})\s*(\d{4})\s*(\d{4})\s*(\d{4})\b/g, '****')
                          .replace(/\b\d{10,11}\b/g, '****')
  }));
}; 
