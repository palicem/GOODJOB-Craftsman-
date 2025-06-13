require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Signer } = require('@volcengine/openapi');
const axios = require('axios');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json());

// 文生图API配置
const IMAGE_CONFIG = {
  ACCESS_KEY: process.env.IMAGE_ACCESS_KEY,
  SECRET_KEY: process.env.IMAGE_SECRET_KEY,
  API_HOST: 'visual.volcengineapi.com',
  API_VERSION: '2022-08-31',
  API_SERVICE: 'cv',
  API_REGION: 'cn-north-1'
};

// 文生文API配置
const CHAT_CONFIG = {
  API_ENDPOINT: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
  API_KEY: process.env.CHAT_API_KEY,
  MODEL_ID: 'doubao-1.5-vision-lite-250315'
};

// 创建axios实例
const apiClient = axios.create({
  httpsAgent: new https.Agent({  
    rejectUnauthorized: false
  }),
  timeout: 60000
});

// 存储用户会话历史
const userSessions = new Map();

// 系统提示词
const SYSTEM_PROMPT = `你是一个专业、亲切的定制商品平台客服助手，名叫"小定"。你的主要工作是帮助用户定制单个商品的设计。

工作要求：
1. 每次对话都要围绕一个主要物品进行定制，不能同时定制多个不同的物品

2. 特殊材料处理规则：
   - 对于玉器、翡翠等天然材料：
     * 不能改变材料本身的质地和颜色
     * 只能进行表面雕刻、镂空等工艺处理
     * 需要提醒用户材料的天然特性和局限性
   - 对于金属类材料（如金银首饰）：
     * 可以进行表面处理（如电镀、氧化等）
     * 可以进行雕刻、镶嵌等工艺
     * 需要说明工艺对材料的影响
   - 对于陶瓷类材料：
     * 可以改变颜色和图案
     * 需要说明釉面工艺的特点
   - 对于布料类材料（如T恤、抱枕）：
     * 可以完全自定义颜色和图案
     * 需要说明不同布料的特性和效果

3. 引导用户详细描述他们想要的定制效果，包括：
   - 主体物品（如T恤、杯子、抱枕等）
   - 要在主体上添加的图案、文字或装饰元素
   - 根据材料特性，说明可行的定制方案
   - 颜色、风格、位置等具体细节

4. 关键词提取和管理规则：
   - 必须包含且只能有一个主体物品
   - 其他关键词必须是与这个主体相关的修饰或装饰元素
   - 不要提取与图片生成无关的词（如"定制"、"服务"等）
   - 关键词格式：主体词在最前，后面是修饰词，用逗号分隔
   - 一旦确定关键词，除非用户明确要求修改，否则必须保持不变
   - 每个关键词都要尽可能具体和详细，包含材质、工艺、颜色、风格、位置等信息
   - 关键词数量建议在3-5个之间，确保每个词都有具体的描述作用

5. 当用户描述不够具体时，要通过提问来了解：
   - 主体物品是什么
   - 材料的具体类型
   - 想要添加什么样的图案或元素
   - 根据材料特性，询问可行的工艺方案
   - 具体的风格和效果要求
   - 颜色搭配偏好（如果材料允许）
   - 图案的位置和大小

6. 记忆管理：
   - 始终记住用户之前确定的主体物品和关键词
   - 如果用户想要修改某些细节，保留其他已确定的要素
   - 在每次回复中都要体现出对之前对话内容的理解

举例：
用户："我想定制一个玉佩"
你："您好！玉佩是一种天然材料，我们需要注意它的特殊性。我们可以通过雕刻、镂空等工艺来实现定制，但不能改变玉材本身的颜色和质地。请问您想要在玉佩上雕刻什么样的图案呢？比如传统的祥云纹、龙凤纹，或者是简约的现代图案？另外，您希望玉佩是什么形状的呢？

关键词：天然玉佩，传统雕刻工艺"

用户："我想要一个白色的杯子，上面画一只可爱的柴犬"
你："柴犬图案很可爱呢！白色的陶瓷杯正好可以完美呈现图案。您希望柴犬是什么风格的呢？比如可爱卡通风、写实风，或者是简约线条风？另外，要把柴犬图案放在杯子的哪个位置呢？我们可以做正面大图、环绕式设计，您更喜欢哪种呢？

关键词：纯白陶瓷杯，可爱卡通柴犬图案，正面居中位置"

用户："我想要一个金戒指，上面镶嵌钻石"
你："金戒指是很经典的选择呢！我们可以根据您的喜好选择不同的金材质（如黄金、白金、玫瑰金）和表面处理工艺。请问您希望钻石的大小和排列方式是怎样的呢？比如单颗主钻、多钻环绕等。另外，戒指的整体设计风格您偏好简约还是奢华呢？

关键词：18K金戒指，单颗主钻镶嵌，简约现代风格"

用户："我想要一件T恤，上面有樱花和猫咪"
你："这个创意很棒呢！T恤的布料材质完全可以自由定制图案和颜色。您希望是什么样的画面呢？比如是猫咪在樱花树下，还是樱花环绕着猫咪？另外，T恤的底色您想要什么颜色呢？这会影响整体的效果哦。

关键词：纯棉圆领T恤，粉色樱花飘落，黑色猫咪剪影，胸前居中设计"`;

// 文生文接口
app.post('/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: '缺少必要的message参数'
      });
    }

    // 获取或创建会话历史
    let sessionMessages = userSessions.get(sessionId) || [];
    
    // 构建消息历史
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...sessionMessages,
      { role: 'user', content: message }
    ];

    // 构造请求体
    const requestBody = {
      model: CHAT_CONFIG.MODEL_ID,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000,
      stream: false
    };

    // 发送请求
    const response = await apiClient.post(CHAT_CONFIG.API_ENDPOINT, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CHAT_CONFIG.API_KEY}`
      }
    });

    if (response.data.choices && response.data.choices[0]) {
      const aiResponse = response.data.choices[0].message.content;
      
      // 解析回复和关键词
      const parts = aiResponse.split('\n\n');
      const reply = parts[0];
      const keywords = parts[1]?.match(/关键词：(.+)/)?.[1]?.split('，') || [];

      // 更新会话历史
      sessionMessages.push(
        { role: 'user', content: message },
        { role: 'assistant', content: aiResponse }
      );
      
      // 限制历史消息数量，保留最近的10条对话（20条消息）
      if (sessionMessages.length > 20) {
        sessionMessages = sessionMessages.slice(-20);
      }
      
      // 保存更新后的会话历史
      userSessions.set(sessionId, sessionMessages);

      res.json({
        success: true,
        reply,
        keywords
      });
    } else {
      throw new Error('AI响应格式不正确');
    }
  } catch (error) {
    console.error('文生文处理错误:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message
    });
  }
});

// 图片生成接口
app.post('/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    // 参数验证
    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: '缺少必要的prompt参数'
      });
    }

    const trimmedPrompt = prompt.trim();
    if (trimmedPrompt.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'prompt不能为空'
      });
    }

    // 构造请求参数
    const requestParams = {
      Action: 'CVProcess',
      Version: IMAGE_CONFIG.API_VERSION,
      req_key: 'high_aes_general_v20',
      prompt: trimmedPrompt,
      seed: -1,
      scale: 3.5,
      ddim_steps: 16,
      width: 512,
      height: 512,
      use_sr: true,
      use_rephraser: true,
      return_url: true,
      logo_info: {
        add_logo: false
      }
    };

    // 构造请求对象
    const openApiRequestData = {
      method: 'POST',
      region: IMAGE_CONFIG.API_REGION,
      params: requestParams
    };

    const credentials = {
      accessKeyId: IMAGE_CONFIG.ACCESS_KEY,
      secretKey: IMAGE_CONFIG.SECRET_KEY,
      sessionToken: ''
    };

    // 创建签名
    const signer = new Signer(openApiRequestData, IMAGE_CONFIG.API_SERVICE);
    const signedQueryString = signer.getSignUrl(credentials);

    // 发送请求
    const response = await apiClient({
      url: `https://${IMAGE_CONFIG.API_HOST}/?${signedQueryString}`,
      method: 'POST',
      data: requestParams,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // 处理响应
    if (response.data.ResponseMetadata?.Error) {
      return res.status(400).json({
        success: false,
        error: response.data.ResponseMetadata.Error
      });
    }

    if (response.data.code === 10000 && response.data.data) {
      res.json({
        success: true,
        result: {
          image_url: response.data.data.image_urls[0],
          rephraser_result: response.data.data.rephraser_result
        }
      });
    } else {
      throw new Error('API返回数据格式不正确: ' + JSON.stringify(response.data));
    }
  } catch (error) {
    console.error('生成图片错误:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message,
      error: error.response?.data || error.message
    });
  }
});

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
}); 