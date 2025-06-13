<template>
  <view class="chat-container">
    <!-- 头部导航栏 -->
    <view class="chat-header">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <view class="header-title">
        <text class="title-text">{{ shopName || '店铺客服' }}</text>
      </view>
      <view class="header-actions">
        <view class="clear-btn" @tap="clearHistory">
          <text class="clear-icon">🗑️</text>
        </view>
      </view>
    </view>

    <!-- 聊天消息列表 -->
    <scroll-view 
      class="chat-messages" 
      scroll-y 
      :scroll-top="scrollTop"
      @scrolltoupper="loadMoreMessages"
      :refresher-enabled="true"
      :refresher-triggered="isRefreshing"
      @refresherrefresh="onRefresh"
    >
      <view class="message-list">
        <view 
          v-for="(message, index) in messages" 
          :key="index"
          :class="['message-item', message.type === 'user' ? 'message-user' : 'message-ai']"
        >
          <!-- 用户消息 -->
          <view v-if="message.type === 'user'" class="user-message">
            <view class="message-content">
              <view class="text-content">{{ message.content }}</view>
            </view>
            <view class="avatar">
              <image v-if="userInfo.avatar" :src="userInfo.avatar" mode="aspectFill"></image>
            <text v-else class="avatar-text">{{ userInitial }}</text>
          </view>
        </view>
          
          <!-- AI消息 -->
          <view v-else class="ai-message">
            <view class="avatar">
              <image v-if="shopLogo" :src="shopLogo" mode="aspectFill"></image>
              <text v-else class="avatar-text">{{ shopName ? shopName[0] : '客' }}</text>
      </view>
            <view class="message-content">
              <!-- 文字内容 -->
              <view class="text-content">{{ message.content }}</view>
              
              <!-- 条件1: 显示关键词和"确认生成图片"按钮 -->
              <view v-if="message.isCustomization && message.keywords && message.keywords.length > 0 && !message.imageUrl && !message.customAction" class="keywords-container">
                <text class="keywords-title">提取的关键词：</text>
                <view class="keywords-list-wrapper">
                  <view class="keywords-list">
                    <text 
                      v-for="(keyword, idx) in message.keywords" 
                      :key="idx" 
                      class="keyword-item"
                    >{{ keyword }}</text>
        </view>
      </view>
                <view class="generate-actions">
                  <button 
                    class="confirm-btn" 
                    @tap="generateImage(message)"
                    :disabled="loading"
                  >
                    确认关键词并生成图片
                  </button>
                  <text class="generate-tip"></text>
                </view>
      </view>
      
              <!-- 条件2: 显示已生成的图片和操作按钮 ("重新生成", "确认") -->
              <view v-if="message.imageUrl && !message.customAction" class="image-content">
                <image 
                  :src="message.imageUrl" 
                  mode="widthFix" 
                  @tap="previewImage(message.imageUrl)"
                  class="generated-image"
                ></image>
                <view class="image-actions">
                  <button class="action-btn" @tap="regenerateImage(message)">重新生成</button>
                  <button class="action-btn" @tap="confirmImageAndProceedToOrder(message)">确认</button> 
        </view>
        </view>

              <!-- 条件3: 显示自定义操作按钮 (例如 "去确认规格") -->
              <view v-if="message.customAction && message.customAction.actionType === 'SELECT_SKU_FOR_ORDER'" class="custom-action-container">
                <button class="action-btn confirm-btn" @tap="handleCustomAction(message.customAction)">
                  {{ message.customAction.label }}
                </button>
              </view>
        </view>
        </view>
      </view>
    </view>
    </scroll-view>
   
    
    <!-- 输入区域 -->
    <view class="input-area" :style="{ bottom: keyboardHeight + 'px' }">
      <view class="input-box-container">
        <view class="action-btn" @tap="toggleQuickMessagePopup">
          <text class="action-icon">💬</text>
          </view>
        <textarea
          class="input-box"
          v-model="inputMessage"
          :adjust-position="false"
          :show-confirm-bar="false"
          :cursor-spacing="20"
          :maxlength="-1"
          :placeholder="'请描述您想要咨询的问题...'"
          @focus="onInputFocus"
          @blur="onInputBlur"
          @confirm="sendMessage"
        />
        <view class="send-btn" @tap="sendMessage" :class="{ 'btn-disabled': !inputMessage.trim() }">
          <text>发送</text>
          </view>
        <view class="action-btn attachment-btn" @tap="toggleAttachmentMenu">
          <text class="action-icon">📎</text>
      </view>
        </view>
      </view>
      
    <!-- 快捷消息弹窗 -->
    <view v-if="showQuickMessagePopup" class="popup-mask" @tap="toggleQuickMessagePopup">
      <view class="quick-message-popup" @tap.stop>
        <view class="popup-header">
          <text class="popup-title">快捷回复</text>
          <view class="close-btn" @tap="toggleQuickMessagePopup">×</view>
        </view>
        <view class="quick-message-list">
          <view 
            v-for="(message, index) in quickMessages" 
            :key="index"
            class="quick-message-item"
            @tap="selectQuickMessage(message)"
          >
            {{ message }}
        </view>
        </view>
        </view>
      </view>
      
    <!-- 附件菜单 -->
    <view v-if="showAttachmentMenu" class="popup-mask" @tap="toggleAttachmentMenu">
      <view class="attachment-menu" @tap.stop>
        <view class="attachment-item" @tap="chooseImage('album')">
          <text class="attachment-icon">🖼️</text>
          <text class="attachment-text">从相册选择</text>
        </view>
        <view class="attachment-item" @tap="chooseImage('camera')">
          <text class="attachment-icon">📸</text>
          <text class="attachment-text">拍摄照片</text>
        </view>
      </view>
    </view>

    <!-- SKU选择弹窗组件 -->
    <SpecPopup 
      v-if="showSpecPopup" 
      :product="productForSpecPopup" 
      @confirm="handleSpecConfirm"
      @close="handleSpecClose"
    />

    <!-- 加载中遮罩 -->
    <view v-if="loading" class="loading-mask">
      <view class="loading-content">
        <view class="loading-spinner"></view>
        <text class="loading-text">{{ loadingText }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { sendMessageToAI, sanitizeHistory, getAIConfig } from '../../utils/aiService';
import { getUserProfile } from '../../utils/profileService';
import { usePageRefresh } from '@/mixins/pageRefresh.js';
import CryptoJS from 'crypto-js';
import SpecPopup from '@/components/spec-popup.vue'; // 引入SKU弹窗组件
import productAPI from '@/utils/productService.js'; // 引入商品服务API

// 调用组合式函数并获取返回的方法
const { handlePageBack } = usePageRefresh();

// 用户信息
const userInfo = ref({});
const shopName = ref('');
const shopLogo = ref('');

// 用户头像显示
const userInitial = computed(() => {
  const username = userInfo.value.username || userInfo.value.nickname || '用户';
  return username.charAt(0).toUpperCase();
});

// 聊天状态
const messages = ref([]);
const inputMessage = ref('');
const loading = ref(false);
const loadingText = ref('正在思考...');
const scrollTop = ref(0);
const keyboardHeight = ref(0);
const isRefreshing = ref(false);
const sessionId = ref('');
const showQuickMessagePopup = ref(false);
const showAttachmentMenu = ref(false);
const routeShopId = ref('');
const routeProductId = ref('');
const lastUserProvidedProductName = ref('');
const currentProductContext = ref(null); // 新增 currentProductContext ref

const showSpecPopup = ref(false); // 控制SKU弹窗的显示
const productForSpecPopup = ref(null); // 传递给SKU弹窗的商品数据
const currentActionPayloadForSku = ref(null); // 保存触发SKU弹窗的action payload

// AI配置
const aiConfig = ref({});

// 快捷消息列表
const quickMessages = [
  '商品发货时间是多久？',
  '可以修改收货地址吗？',
  '如何申请退换货？',
  '支持哪些支付方式？',
  '有优惠活动吗？'
];

// 生成会话ID
const generateSessionId = () => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

const updateRecentSessions = () => {
  console.log('[CS updateRecentSessions] Attempting update. routeShopId.value:', routeShopId.value, 'shopName.value:', shopName.value, 'shopLogo.value:', shopLogo.value);

  if (!routeShopId.value || !shopName.value) { 
    console.warn('[CS updateRecentSessions] Aborting: shopId or shopName is missing or empty. ShopId:', routeShopId.value, 'ShopName:', shopName.value);
    return;
  }

  let recentSessions = uni.getStorageSync('recent_chat_sessions');
  console.log('[CS updateRecentSessions] Raw recent_chat_sessions from storage:', recentSessions);
  try {
    recentSessions = recentSessions ? JSON.parse(recentSessions) : [];
    if (!Array.isArray(recentSessions)) recentSessions = [];
  } catch (e) {
    recentSessions = [];
    console.error("[CS updateRecentSessions] Error parsing recent_chat_sessions, re-initializing.", e);
  }
  console.log('[CS updateRecentSessions] Parsed recentSessions (before update):', JSON.parse(JSON.stringify(recentSessions)));

  const lastMessage = messages.value.length > 0 ? messages.value[messages.value.length - 1] : null;
  const sessionIndex = recentSessions.findIndex(s => s.shopId === routeShopId.value);

  let messagePreview = '进入了聊天室';
  if (lastMessage) {
    if (lastMessage.isImage) {
      messagePreview = '[图片]';
    } else if (lastMessage.content) {
      const contentWithoutNewlines = lastMessage.content.replace(/\n/g, ' '); 
      messagePreview = contentWithoutNewlines.length > 30 ? contentWithoutNewlines.substring(0, 30) + '...' : contentWithoutNewlines;
    } else {
      messagePreview = '[消息]';
    }
  }
  
  const sessionEntry = {
    shopId: routeShopId.value,
    shopName: shopName.value,
    shopLogo: shopLogo.value,
    lastMessageContent: messagePreview,
    lastMessageTime: lastMessage ? lastMessage.time : new Date().toISOString(),
    unreadCount: 0, 
    sessionId: sessionId.value 
  };
  console.log('[CS updateRecentSessions] Constructed sessionEntry:', JSON.parse(JSON.stringify(sessionEntry)));

  if (sessionIndex > -1) {
    console.log('[CS updateRecentSessions] Updating existing session at index:', sessionIndex);
    recentSessions.splice(sessionIndex, 1);
    recentSessions.unshift(sessionEntry);
  } else {
    console.log('[CS updateRecentSessions] Adding new session entry.');
    recentSessions.unshift(sessionEntry);
  }
  
  if (recentSessions.length > 50) {
    recentSessions = recentSessions.slice(0, 50);
  }

  try {
    uni.setStorageSync('recent_chat_sessions', JSON.stringify(recentSessions));
    console.log('[CS updateRecentSessions] SUCCESSFULLY WROTE to recent_chat_sessions. Updated list:', JSON.parse(JSON.stringify(recentSessions)));
    uni.$emit('chatSessionUpdated');
    console.log('[CS updateRecentSessions] Finished updating recent_chat_sessions and emitted event.');
  } catch (e) {
    console.error('[CS updateRecentSessions] Error writing to recent_chat_sessions:', e);
  }
};

// 加载历史消息
const loadMessages = () => {
  console.log('[CS loadMessages] Attempting to load messages.');
  if (!routeShopId.value) {
    console.warn('[CS loadMessages] Aborting: routeShopId is not set.');
    return;
  }
  const userId = userInfo.value?._id || userInfo.value?.id || 'guest';
  console.log(`[CS loadMessages] Determined userId for storage key: ${userId}`);
  const storageKey = `chat_messages_${routeShopId.value}_${userId}`;
  console.log(`[CS loadMessages] Using storageKey: ${storageKey}`);
  try {
    const storedMessages = uni.getStorageSync(storageKey);
    if (storedMessages) {
      console.log(`[CS loadMessages] Raw storedMessages for ${storageKey}: ${typeof storedMessages === 'string' ? storedMessages.substring(0, 200) + '...' : JSON.stringify(storedMessages).substring(0,200) + '...'}`);
      messages.value = JSON.parse(storedMessages);
      console.log(`[CS loadMessages] Messages loaded successfully for ${storageKey}. Count: ${messages.value.length}`);
      scrollToBottom();
    } else {
      console.log(`[CS loadMessages] No messages found in storage for key: ${storageKey}. Initializing with welcome message.`);
      // 添加默认欢迎消息
      messages.value = [{
        type: 'system_welcome',
        content: `您好！我是${shopName.value || '店铺'}的客服，很高兴为您服务。\n\n我可以帮您：\n- 了解商品详情和价格\n- 查询订单状态\n- 处理售后问题\n- 提供定制建议\n\n请问有什么可以帮您的吗？`,
        time: new Date().toISOString()
      }];
      saveMessages(); // 同时保存这条欢迎消息
    }
  } catch (e) {
    console.error(`[CS loadMessages] Error loading or parsing messages for ${storageKey}:`, e);
    console.error(`[CS loadMessages] Content that failed to parse (first 200 chars): ${uni.getStorageSync(storageKey)?.substring(0,200)}...`);
    messages.value = []; 
  }
};

// 保存消息
const saveMessages = () => {
  if (!routeShopId.value) return;
  const userId = userInfo.value?._id || userInfo.value?.id || 'guest';
  const storageKey = `chat_messages_${routeShopId.value}_${userId}`;
  try {
    uni.setStorageSync(storageKey, JSON.stringify(messages.value));
    console.log(`[customer-service] Messages saved for ${storageKey}. Count: ${messages.value.length}`);
    updateRecentSessions(); // <--- 在保存消息后更新会话列表
  } catch (e) {
    console.error(`[customer-service] Error saving messages for ${storageKey}:`, e);
  }
};

// 清空历史记录
const clearHistory = () => {
  uni.showModal({
    title: '确认清空',
    content: '确定要清空所有聊天记录吗？这将开始一个新的会话。',
    success: (res) => {
      if (res.confirm) {
        // 删除旧的存储记录
        const oldSessionId = sessionId.value;
        if (oldSessionId) {
          uni.removeStorageSync(`shop_${oldSessionId}_messages`);
          uni.removeStorageSync(`shop_${oldSessionId}_session_id`);
        }
        
        // 生成新的会话ID
        sessionId.value = generateSessionId();
        
        // 重置消息
        messages.value = [{
          type: 'system_welcome',
          content: `您好！我是${shopName.value}的客服，很高兴为您服务。
          
我可以帮您：
- 了解商品详情和价格
- 查询订单状态
- 处理售后问题
- 提供定制建议

请问有什么可以帮您的吗？`,
          time: new Date().toISOString()
        }];
        
        // 保存新的会话ID和消息
        const shopId = uni.getStorageSync('current_shop_id');
        if (shopId) {
          uni.setStorageSync(`shop_${shopId}_session_id`, sessionId.value);
        }
      saveMessages();
        
        uni.showToast({
          title: '已清空聊天记录',
          icon: 'success'
        });
      }
    }
  });
};

// 返回上一页
const goBack = () => {
  handlePageBack();
};

// 获取上下文信息
const getPreviousContext = () => {
  const lastAiMessage = [...messages.value].reverse().find(m => m.type === 'ai');
  const lastKeywords = getPreviousKeywords();
  
  return {
    lastReply: lastAiMessage ? lastAiMessage.content : '',
    lastKeywords: lastKeywords
  };
};

// 发送消息
const sendMessage = async () => {
  const message = inputMessage.value.trim();
  if (!message || loading.value) return;

  // 添加用户消息
  messages.value.push({
    type: 'user',
    content: message,
    time: new Date().toISOString()
  });

  saveMessages();
  inputMessage.value = '';
  scrollToBottom();

  try {
    loading.value = true;
    loadingText.value = '正在思考...';

    // 获取上下文信息
    const context = getPreviousContext();
    
    // 构建消息数组
    const messageArray = [
      {
        role: 'system',
        content: `你是${shopName.value}的专业客服助手。你的主要工作是回答用户的问题和帮助用户定制单个商品的设计。
        当用户咨询问题时，直接回答用户的问题即可。只有当用户表明或有意图定制商品时，才需要提取关键词。

请注意：
  定制商品时回复格式：
 - 第一句话必须是对当前商品的完整描述，使用"一个[已知属性]的[主体]"格式
   - 然后询问用户关于新的细节
   - 最后添加关键词

3. 商品描述规则：
   - 每次回复的第一句话必须描述当前的商品状态
   - 描述时要包含所有已知的属性
   - 主体词必须保持不变
   - 属性按照用户提供的顺序累加

1. 不要返回JSON格式的回复
2. 如果是定制相关的对话，在回复的最后一行添加"[关键词]:"，然后列出关键词，用逗号分隔
3. 关键词提取规则：
   - 第一个关键词必须且只能是主体本身（如：马克杯、T恤、玉佩）
   - 后续关键词按照用户提供的属性依次添加（如：太阳图案、白色、陶瓷材质）
   - 关键词之间用逗号分隔
   - 每个关键词都要尽可能具体和详细，包含材质、工艺、颜色、风格、位置等信息
   - 不要提取"定制"、"设计"等无关词
   - 不要把建议或询问的内容作为关键词
   - 关键词数量没有限制，但每个词都必须有具体的描述作用，且不能遗漏关键词。

4. 特殊材料处理规则：
   - 玉器、翡翠等天然材料：只能描述雕刻、镂空等工艺，不能改变材质本身
   - 金属类材料：可以描述电镀、氧化、雕刻、镶嵌等工艺
   - 陶瓷类材料：可以描述颜色和图案
   - 布料类材料：可以描述所有颜色和图案变化

5. 如果不是定制相关的对话，直接回复即可，不要添加关键词

6. 如果用户想要定制的物品，在店铺中没有，请告诉用户，我们无法定制。


例如：
用户："我想定制一个马克杯"
你：
好的呢！一个马克杯，您想要在马克杯上添加什么样的图案或者颜色呢？
[关键词]: 马克杯

用户："我想要太阳图案"
你：
好的，一个有太阳图案的马克杯，您希望太阳图案是什么颜色的呢？
[关键词]: 马克杯, 太阳图案

用户："要白色的太阳"
你：
好的，一个有白色太阳图案的马克杯，您想要杯子本身是什么颜色的呢？
[关键词]: 马克杯, 白色太阳图案

用户："发货要多久啊？"
你：
您好！一般情况下，我们会在24小时内发货，快递会在3-5个工作日内送达。如果您需要加急，可以联系我们的客服人员为您安排。`
      }
    ];

    // 添加历史消息
    if (context.lastReply) {
      messageArray.push({
        role: 'assistant',
        content: context.lastReply
      });
    }

    // 添加用户消息
    messageArray.push({
      role: 'user',
      content: message
    });

    const response = await sendMessageToAI(messageArray);

    if (!response.success) {
      throw new Error(response.message || '获取回复失败');
    }

    // 处理AI回复
    const reply = response.reply;
    const aiMessage = {
      type: 'ai',
      time: new Date().toISOString(),
      isCustomization: false,
      content: reply
    };

    // 检查是否包含关键词
    const keywordMatch = reply.match(/\[关键词\]:\s*(.+)$/);
    if (keywordMatch) {
      // 移除原文中的关键词部分
      aiMessage.content = reply.replace(/\[关键词\]:\s*.+$/, '').trim();
      aiMessage.isCustomization = true;
      aiMessage.keywords = keywordMatch[1].split(',').map(k => k.trim());
    }

    messages.value.push(aiMessage);
    saveMessages();
    scrollToBottom();

  } catch (error) {
    console.error('发送消息错误:', error);
    messages.value.push({
      type: 'ai',
      content: '抱歉，处理您的消息时出现错误，请稍后重试。',
      time: new Date().toISOString(),
      isCustomization: false
    });
    saveMessages();
  } finally {
    loading.value = false;
  }
};

// 获取之前的关键词
const getPreviousKeywords = () => {
  const lastAiMessage = [...messages.value].reverse().find(m => 
    m.type === 'ai' && m.keywords && m.keywords.length > 0
  );
  return lastAiMessage ? lastAiMessage.keywords : [];
};

// 生成图片
const generateImage = async (message) => {
  if (!message.keywords || message.keywords.length === 0 || loading.value) return;

  try {
    loading.value = true;
    loadingText.value = '正在生成图片...';
    
    const prompt = message.keywords.join('，');
    
    const imageResponse = await uni.request({
      url: 'http://localhost:3001/generate-image',
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        prompt: prompt,
        previousKeywords: message.keywords
      }
    });

    if (imageResponse.statusCode === 200 && imageResponse.data.success) {
      message.imageUrl = imageResponse.data.result.image_url;
      saveMessages();
      scrollToBottom();
    } else {
      throw new Error(imageResponse.data?.message || '生成图片失败');
    }
  } catch (error) {
    console.error('生成图片错误:', error);
    uni.showToast({
      title: error.message || '生成图片失败',
      icon: 'none'
    });
  } finally {
    loading.value = false;
  }
};

// 重新生成图片
const regenerateImage = async (originalMessage) => {
  if (!originalMessage.keywords || loading.value) return;

  // 辅助函数：根据关键词构建描述性字符串
  const buildFormalDescription = (keywords) => {
    if (!keywords || keywords.length === 0) return "当前的设计"; // 默认描述
    const subject = keywords[0]; // 第一个关键词是主体
    const attributes = keywords.slice(1); // 后续是属性

    if (attributes.length === 0) {
      return `一个${subject}`; // 例如："一个马克杯"
    }
    // 例如 attributes = ['太阳图案', '白色']， subject = '马克杯'
    // 输出："一个有太阳图案、白色的马克杯"
    return `一个有${attributes.join("、")}的${subject}`; 
  };

  const currentFormalDescription = buildFormalDescription(originalMessage.keywords);

  const newContent = `好的，我们来继续完善【${currentFormalDescription}】。请告诉我您希望做哪些调整，或者想加入什么新的元素呢？我会根据您的想法更新设计点子。`;

  const newMessage = {
    type: 'ai',
    content: newContent, // 使用新构建的、更友好的提示内容
    keywords: originalMessage.keywords, // 仍然是原始消息的关键词，等待用户下一步输入来更新
    isCustomization: true,
    time: new Date().toISOString(),
    // imageUrl 必须为 undefined 或 null，以显示确认按钮
  };

  messages.value.push(newMessage);
  scrollToBottom();
  saveMessages();
};

// 新增：确认图片并进入下单流程的函数
const confirmImageAndProceedToOrder = async (originalMessage) => {
  if (!originalMessage.imageUrl) return;
  // 假设 routeProductId 已经在 onMounted 中获取并赋值
  const currentProductId = routeProductId.value; 
  const currentShopName = shopName.value;
  const currentProductName = lastUserProvidedProductName.value; // 需要一个ref来保存用户最初咨询的商品名或通过关键词提取的主体

  if (!currentProductId) {
    console.warn('[CS confirmImageAndProceedToOrder] Product ID is missing. Cannot proceed.');
  uni.showToast({
      title: '商品信息缺失，无法下单',
    icon: 'none'
  });
    return;
  }

  const orderMessage = {
    type: 'ai', // 或者一个新的类型，例如 'ai_interactive_order'
    content: `您已确认定制的商品【${currentProductName || '所选商品'}】（${currentShopName}）。请点击下方按钮选择规格并创建订单。`,
    time: new Date().toISOString(),
    isCustomization: false, 
    customAction: {
      actionType: 'SELECT_SKU_FOR_ORDER',
      label: '去确认规格',
      payload: {
        productId: currentProductId,
        productName: currentProductName,
        customizedImageUrl: originalMessage.imageUrl,
        keywords: originalMessage.keywords,
        shopId: routeShopId.value,
        shopName: currentShopName
        // 可能还需要 basePrice 等信息传递给SKU弹窗
      }
    }
  };

  messages.value.push(orderMessage);
  scrollToBottom();
  saveMessages();
};

// 预览图片
const previewImage = (url) => {
  uni.previewImage({
    urls: [url],
    current: 0
  });
};

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    const query = uni.createSelectorQuery();
    query.select('.chat-messages').boundingClientRect();
    query.select('.message-list').boundingClientRect();
    query.exec((res) => {
      if (res[0] && res[1]) {
        const scrollDistance = res[1].height - res[0].height;
        if (scrollDistance > 0) {
          scrollTop.value = scrollDistance;
        }
      }
    });
  });
};

// 加载更多消息
const loadMoreMessages = () => {
  // 实现加载历史消息的逻辑
};

// 下拉刷新
const onRefresh = async () => {
  isRefreshing.value = true;
  // 实现刷新逻辑
  setTimeout(() => {
    isRefreshing.value = false;
  }, 1000);
};

// 输入框获得焦点
const onInputFocus = (e) => {
  keyboardHeight.value = e.detail.height || 0;
};

// 输入框失去焦点
const onInputBlur = () => {
  keyboardHeight.value = 0;
};

// 切换快捷消息弹窗
const toggleQuickMessagePopup = () => {
  showQuickMessagePopup.value = !showQuickMessagePopup.value;
  showAttachmentMenu.value = false;
};

// 切换附件菜单
const toggleAttachmentMenu = () => {
  showAttachmentMenu.value = !showAttachmentMenu.value;
  showQuickMessagePopup.value = false;
};

// 选择快捷消息
const selectQuickMessage = (message) => {
  inputMessage.value = message;
  showQuickMessagePopup.value = false;
};

// 选择图片
const chooseImage = (sourceType) => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: [sourceType],
    success: (res) => {
      const imageUrl = res.tempFilePaths[0];
      messages.value.push({
        type: 'user',
        content: imageUrl,
        time: new Date().toISOString(),
        isImage: true
      });
      saveMessages();
      scrollToBottom();
    }
  });
};

// 新增 handleCustomAction 方法
const handleCustomAction = async (action) => {
  if (action.actionType === 'SELECT_SKU_FOR_ORDER') {
    currentActionPayloadForSku.value = action.payload;
    console.log('Payload for SKU selection:', action.payload);

    if (!action.payload.productId || !action.payload.shopId) {
      uni.showToast({ title: '商品或店铺信息不完整', icon: 'none' });
      currentActionPayloadForSku.value = null;
      return;
    }

    loading.value = true;
    loadingText.value = '正在加载商品规格...';
    
    try {
      const response = await productAPI.getProductDetail(action.payload.shopId, action.payload.productId);
      loading.value = false;

      if (response.success && response.data) {
        // 确保 response.data 包含 spec-popup 所需的 specs 和 stock
        if (response.data.specs && typeof response.data.stock !== 'undefined') {
          productForSpecPopup.value = response.data; // response.data 就是完整的商品对象
          showSpecPopup.value = true;
        } else {
          console.error('Product details from API are missing specs or stock:', response.data);
          uni.showToast({ title: '商品规格信息不完整', icon: 'none' });
          currentActionPayloadForSku.value = null; // 清理
        }
      } else {
        uni.showToast({ title: response.message || '获取商品规格失败', icon: 'none' });
        currentActionPayloadForSku.value = null; // 清理
      }
    } catch (error) {
      loading.value = false;
      console.error('Error fetching product details:', error);
      uni.showToast({ title: '获取规格时发生错误', icon: 'none' });
      currentActionPayloadForSku.value = null; // 清理
    }
  }
};

const handleSpecConfirm = ({ selectedSpecs, quantity }) => {
  console.log('SKU Confirmed:', selectedSpecs, 'Quantity:', quantity);
  showSpecPopup.value = false;
  if (!currentActionPayloadForSku.value || !productForSpecPopup.value) { // 确保 productForSpecPopup 也存在
    console.error('Error: currentActionPayloadForSku or productForSpecPopup is null after SKU confirmation.');
    uni.showToast({ title: '订单准备失败，商品信息不完整', icon: 'none' });
    return;
  }

  const basePrice = productForSpecPopup.value.price; // 从商品详情中获取基础价格
  if (typeof basePrice === 'undefined' || basePrice === null) {
    console.error('Error: Base price is undefined for the product.');
    uni.showToast({ title: '订单准备失败，商品价格缺失', icon: 'none' });
    return;
  }

  const orderPayload = {
    ...currentActionPayloadForSku.value, 
    selectedSpecs: selectedSpecs, 
    quantity: quantity,
    price: basePrice, // <--- 新增 price 字段
    // 考虑是否也需要传递 handlingFee 和 shippingFee，如果它们是商品级别的
    // handlingFee: productForSpecPopup.value.handling_fee || 0, 
    // shippingFee: productForSpecPopup.value.shipping_fee || 0,
  };

  const params = new URLSearchParams();
  for (const key in orderPayload) {
    if (Object.hasOwnProperty.call(orderPayload, key)) {
      const value = orderPayload[key];
      // 对于对象和数组，确保它们被正确字符串化以便在URL中传递
      if (typeof value === 'object' && value !== null) {
        params.append(key, encodeURIComponent(JSON.stringify(value)));
      } else if (value !== undefined && value !== null) {
        params.append(key, encodeURIComponent(String(value)));
      }
    }
  }
  
  // 假设的订单创建页路径，请替换为您的实际路径
  const orderCreateUrl = `/pages/orders/trade?${params.toString()}`;
  console.log("Navigating to create order page with params:", params.toString());
  uni.navigateTo({
    url: orderCreateUrl
  });

  currentActionPayloadForSku.value = null; // 清理
};

const handleSpecClose = () => {
  showSpecPopup.value = false;
  currentActionPayloadForSku.value = null; // 清理
  console.log('SKU Popup closed by user.');
};

// 新增：辅助函数，用于添加订单状态更新的AI消息
const addOrderUpdateMessage = (orderId, orderStatus, productName, shopIdOfOrigin) => {
  console.log('[CS.vue] addOrderUpdateMessage called with:', orderId, orderStatus, productName, shopIdOfOrigin);
  // 确保这条消息是针对当前聊天窗口的店铺的
  if (shopIdOfOrigin !== routeShopId.value) {
    console.log(`[CS addOrderUpdateMessage] Received order update for shop ${shopIdOfOrigin}, but current chat is for shop ${routeShopId.value}. Ignoring.`);
    return;
  }

  let callbackMessageContent = '';
  const displayProductName = productName || '您定制的商品'; // 如果productName未提供，使用通用描述

  if (orderStatus === 'paid') {
    callbackMessageContent = `您的订单 (编号: ${orderId || 'N/A'}) for ${displayProductName} 已经支付成功，我们会尽快为您安排发货，感谢您的光临！`;
  } else if (orderStatus === 'pending_payment') {
    callbackMessageContent = `您的订单 (编号: ${orderId || 'N/A'}) for ${displayProductName} 尚未支付，请尽快完成支付哦。`;
  } else if (orderStatus === 'cancelled') {
    callbackMessageContent = `您的订单 (编号: ${orderId || 'N/A'}) for ${displayProductName} 已被取消。`;
  } else if (orderStatus === 'to_ship') {
    callbackMessageContent = `您的订单 (编号: ${orderId || 'N/A'}) for ${displayProductName} 已支付成功，后续客服将会和您沟通相关事宜，请留意客服消息，开始制作后取消订单将无法返还定金，感谢光临小店，祝您生活愉快！`;
    } else {
    console.warn(`[CS addOrderUpdateMessage] Unknown orderStatus received: ${orderStatus}`);
    return; // 未知状态不处理
  }

  if (callbackMessageContent) {
    const autoMessage = {
      type: 'ai',
      content: callbackMessageContent,
      time: new Date().toISOString(),
    };
    // 检查是否已经存在完全相同的回调消息，避免重复发送（基于时间和内容）
    const similarMessageExists = messages.value.some(m => m.content === autoMessage.content && (new Date(m.time).getTime() > new Date().getTime() - 10000)); // 10秒内防重
    if (!similarMessageExists) {
      messages.value.push(autoMessage);
      saveMessages();
      scrollToBottom();
      console.log(`[CS addOrderUpdateMessage] Added order status message to chat: ${orderStatus} for order ${orderId}`);
  } else {
      console.log(`[CS addOrderUpdateMessage] Similar order status message already exists for order ${orderId}. Skipping.`);
    }
  }
};

// 新增：处理从 trade.vue 过来的订单状态更新事件
const handleOrderStatusUpdate = (eventData) => {
  console.log('[CS.vue] handleOrderStatusUpdate received eventData:', JSON.stringify(eventData));
  console.log('[CS.vue] currentShopId.value for comparison:', routeShopId.value); // 使用 routeShopId

  if (!eventData || !eventData.orderId || !eventData.orderStatus || !eventData.shopId) {
    console.warn('[CS.vue] Received incomplete order status update event.');
    return;
  }
  console.log('[CS handleOrderStatusUpdate] Received event:', JSON.stringify(eventData));
  if (eventData && eventData.shopId && eventData.orderId && eventData.orderStatus) {
    // 确保事件是针对当前聊天店铺的
    if (eventData.shopId === routeShopId.value) {
      addOrderUpdateMessage(eventData.orderId, eventData.orderStatus, eventData.productName, eventData.shopId);
    } else {
      console.log(`[CS handleOrderStatusUpdate] Event for shop ${eventData.shopId} ignored, current chat is for ${routeShopId.value}.`);
    }
  } else {
    console.warn('[CS handleOrderStatusUpdate] Received incomplete event data:', eventData);
  }
};

const loadUserProfileAndMessages = async (currentShopId, userIdFromRoute, orderStatusFromUrl, orderIdFromUrl) => {
  console.log('[CS loadUserProfileAndMessages] Process started. currentShopId:', currentShopId, 'userIdFromRoute:', userIdFromRoute, 'orderStatusFromUrl:', orderStatusFromUrl, 'orderIdFromUrl:', orderIdFromUrl);
  let determinedUserId = 'guest';
  try {
    const profileResponse = await getUserProfile();
    if (profileResponse && profileResponse.success && profileResponse.data) {
        const userProfile = profileResponse.data;
        if (userProfile._id || userProfile.id) {
            userInfo.value = userProfile;
            determinedUserId = userProfile._id || userProfile.id;
            console.log('[CS loadUserProfileAndMessages] User profile loaded. User ID for chat:', determinedUserId, 'Full profile:', JSON.parse(JSON.stringify(userInfo.value)));
        } else {
             console.warn('[CS loadUserProfileAndMessages] User profile loaded, but no _id or id found. Using guest for chat. Profile:', userProfile);
        }
    } else {
      console.warn('[CS loadUserProfileAndMessages] Failed to load user profile or profile is invalid. Using guest for chat. Response:', profileResponse);
    }
  } catch (error) {
    console.error('[CS loadUserProfileAndMessages] Error during getUserProfile. Using guest for chat:', error);
  }
  
  if (userIdFromRoute && userIdFromRoute !== determinedUserId) {
      console.warn(`[CS loadUserProfileAndMessages] userIdFromRoute (${userIdFromRoute}) differs from determinedUserId (${determinedUserId}). Using determinedUserId.`);
  }

  const sessionKey = `shop_session_id_${currentShopId}_${determinedUserId}`;
  sessionId.value = uni.getStorageSync(sessionKey) || generateSessionId();
  uni.setStorageSync(sessionKey, sessionId.value);
  console.log(`[CS loadUserProfileAndMessages] Session ID for ${sessionKey} set to ${sessionId.value}`);

  uni.setStorageSync(`shop_last_viewed_${currentShopId}_${determinedUserId}`, new Date().toISOString());
  console.log(`[CS loadUserProfileAndMessages] Last viewed time updated for shop ${currentShopId}, user ${determinedUserId}.`);

  loadMessages(); // 加载历史消息

  // 处理来自URL的订单状态回调消息 (通常是用户返回页面时)
  if (orderStatusFromUrl && orderIdFromUrl) {
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    // 从路由参数或之前保存的 lastUserProvidedProductName.value 获取商品名
    const productNameFromRouteOrCache = currentPage?.options?.productName ? decodeURIComponent(currentPage.options.productName) : lastUserProvidedProductName.value || '';
    addOrderUpdateMessage(orderIdFromUrl, orderStatusFromUrl, productNameFromRouteOrCache, currentShopId);
  }

  updateRecentSessions();
  
  aiConfig.value = getAIConfig(); 
  console.log('[CS loadUserProfileAndMessages] Process finished.');
};

const handleUserInfoUpdate = async () => {
  console.log('[CS handleUserInfoUpdate] userInfoUpdated event received.');
      // 当用户信息更新时，重新确定 userId 并加载用户相关的上下文和消息
      let determinedUserId = userInfo.value?._id || userInfo.value?.id || 'guest';
      console.log(`[CS handleUserInfoUpdate] User info updated. Determined userId: ${determinedUserId}`);

      if (routeShopId.value && determinedUserId !== 'guest') {
        const productContextKey = `chat_product_context_${routeShopId.value}_${determinedUserId}`;
        const storedProductContext = uni.getStorageSync(productContextKey);
        if (storedProductContext) {
          try {
            const context = JSON.parse(storedProductContext);
            routeProductId.value = context.productId || null;
            lastUserProvidedProductName.value = context.productName || '';
            console.log(`[CS handleUserInfoUpdate] Reloaded product context from storage (Key: ${productContextKey}): pId=${routeProductId.value}, pName=${lastUserProvidedProductName.value}`);
          } catch (e) {
            console.error(`[CS handleUserInfoUpdate] Error parsing product context from storage (Key: ${productContextKey}):`, e);
            // 选择性清除，或者保留旧值
            // uni.removeStorageSync(productContextKey);
            // routeProductId.value = null;
            // lastUserProvidedProductName.value = '';
          }
        } else {
            console.log(`[CS handleUserInfoUpdate] No product context in storage for key: ${productContextKey}.`);
            routeProductId.value = null; 
            lastUserProvidedProductName.value = ''; 
        }
      } else {
        console.warn(`[CS handleUserInfoUpdate] Cannot reload product context - shopId or userId invalid. shopId: ${routeShopId.value}, userId: ${determinedUserId}`);
        routeProductId.value = null; 
        lastUserProvidedProductName.value = ''; 
      }
      
      // 重新加载用户配置和消息列表
      await loadUserProfileAndMessages(routeShopId.value, determinedUserId, null, null);
    };

// 新增：自动发送商品咨询的函数
const autoSendProductInquiry = async (productName) => {
      if (loading.value) return; 
      console.log(`[CS autoSendProductInquiry] Called with productName: ${productName}`);

      inputMessage.value = `您好，我想咨询一下关于【${productName}】的信息。`;
      
      await sendMessage(); 

      // sendMessage 调用后，inputMessage.value 会被清空
      // 在此之后，我们更新本地存储的商品上下文
      // 此时，routeProductId.value 应该已经被 onMounted 中的逻辑从路由参数正确设置了
      const userId = userInfo.value?._id || userInfo.value?.id || 'guest';
      if (routeShopId.value && userId !== 'guest' && routeProductId.value && productName) {
        const productContextKey = `chat_product_context_${routeShopId.value}_${userId}`;
        try {
          uni.setStorageSync(productContextKey, JSON.stringify({ 
              productId: routeProductId.value, 
              productName: productName // 使用传入的 productName (它应该是从路由参数解码来的)
          }));
          console.log(`[CS autoSendProductInquiry] Updated product context in storage for key ${productContextKey}: pId=${routeProductId.value}, pName=${productName}`);
        } catch (e) {
          console.error(`[CS autoSendProductInquiry] Error saving product context to storage for key ${productContextKey}:`, e);
        }
      } else {
        console.warn(`[CS autoSendProductInquiry] Could not update product context in storage. Conditions not met. ShopId: ${routeShopId.value}, UserId: ${userId}, ProductId (ref): ${routeProductId.value}, ProductName (param): ${productName}`);
      }
    };

onMounted(async () => {
  console.log('[CS.vue] onMounted: Component mounted.');
  // 修改下面两行： uni.on -> uni.$on
  uni.$on('userInfoUpdated', handleUserInfoUpdate);
  console.log('[CS.vue] onMounted: userInfoUpdated listener REGISTERED.');
  uni.$on('orderStatusUpdatedFromTrade', handleOrderStatusUpdate);
  console.log('[CS.vue] onMounted: orderStatusUpdatedFromTrade listener REGISTERED.');

  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = currentPage.options;

  console.log('[CS.vue] onMounted: Route options:', JSON.stringify(options));

  routeShopId.value = options.shopId || null;
  shopName.value = options.shopName || '客服';
  shopLogo.value = options.shopLogo || ''; 
  let productIdFromRoute = options.productId || null;
  let productNameFromRoute = options.productName || null;
  
  if (productIdFromRoute) routeProductId.value = productIdFromRoute;
  if (productNameFromRoute) lastUserProvidedProductName.value = productNameFromRoute;
  console.log(`[CS.vue] onMounted: Initial from route: shopId=${routeShopId.value}, shopName=${shopName.value} pId=${routeProductId.value}, pName=${lastUserProvidedProductName.value}`);
  

  await loadUserProfileAndMessages(routeShopId.value, userInfo.value?._id || userInfo.value?.id || 'guest');

  const userId = userInfo.value?._id || userInfo.value?.id || 'guest';
  if (!productNameFromRoute && routeShopId.value && userId !== 'guest') {
    const productContextKey = `chat_product_context_${routeShopId.value}_${userId}`;
    try {
      const storedProductContext = uni.getStorageSync(productContextKey);
      if (storedProductContext) {
        const context = JSON.parse(storedProductContext);
        if (context.productId && context.productName) {
          routeProductId.value = context.productId;
          lastUserProvidedProductName.value = context.productName;
          currentProductContext.value = { productId: context.productId, productName: context.productName };
          console.log(`[CS.vue] onMounted: Loaded product context from storage for key ${productContextKey}:`, JSON.stringify(context));
        }
      }
    } catch (e) {
      console.error(`[CS.vue] onMounted: Error reading product context from storage for key ${productContextKey}:`, e);
    }
  } else if (productNameFromRoute && routeProductId.value) {
      currentProductContext.value = { productId: routeProductId.value, productName: productNameFromRoute };
      if (routeShopId.value && userId !== 'guest') {
          const productContextKey = `chat_product_context_${routeShopId.value}_${userId}`;
          try {
            uni.setStorageSync(productContextKey, JSON.stringify(currentProductContext.value));
            console.log(`[CS.vue] onMounted: Saved product context from route to storage for key ${productContextKey}:`, JSON.stringify(currentProductContext.value));
          } catch (e) {
            console.error(`[CS.vue] onMounted: Error saving product context to storage for key ${productContextKey}:`, e);
          }
      }
  }

  if (lastUserProvidedProductName.value && routeProductId.value) {
    if (messages.value.length === 0 || (messages.value.length === 1 && messages.value[0].type === 'system_welcome')) {
      console.log(`[CS.vue] onMounted: Conditions met for auto-sending product inquiry for "${lastUserProvidedProductName.value}".`);
      await autoSendProductInquiry(lastUserProvidedProductName.value, routeProductId.value);
    } else {
      console.log(`[CS.vue] onMounted: Product name "${lastUserProvidedProductName.value}" available, but messages already exist or no clear point to inject. Not auto-sending.`);
      // Add diagnostic logs here
      console.log('[CS.vue] onMounted: Current messages.value:', JSON.stringify(messages.value));
      console.log('[CS.vue] onMounted: Current messages.value.length:', messages.value.length);
      if (messages.value.length > 0) {
        console.log('[CS.vue] onMounted: Current messages.value[0].type:', messages.value[0].type);
      }
    }
  } else {
     console.log('[CS.vue] onMounted: No product name available from route or storage, or productId missing. Skipping auto-inquiry.');
  }
  
  if (options.orderId && options.orderStatus && options.shopId === routeShopId.value) {
    console.log(`[CS.vue] onMounted: Received order update from route: orderId=${options.orderId}, status=${options.orderStatus}`);
    let relatedProductName = options.productName || currentProductContext.value.productName || '相关商品';
    addOrderUpdateMessage(options.orderId, options.orderStatus, relatedProductName, options.shopId);
  }

  console.log('[CS.vue] onMounted: Initialization sequence finished.');
});
onUnmounted(() => {
  uni.$off('userInfoUpdated', handleUserInfoUpdate);
  uni.$off('orderStatusUpdatedFromTrade', handleOrderStatusUpdate); // 新增事件移除
  saveMessages(); 
  uni.removeStorageSync('current_shop_id');
  console.log('[CS onUnmounted] Cleaned up. Event listeners unregistered.');
});
</script>

<style lang="scss">
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f7f8fa;
  overflow: hidden;
  position: relative;
}

.chat-header {
  display: flex;
  align-items: center;
  padding: 10rpx 30rpx;
  background-color: #00C292;
  position: relative;
  z-index: 10;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
  height: 90rpx;
  padding-top: calc(var(--status-bar-height) + 10rpx);
}

.back-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-icon {
  font-size: 44rpx;
  color: #fff;
}

.header-title {
  flex: 1;
  text-align: center;
  padding: 0 88rpx;
  overflow: hidden;
}

.title-text {
  font-size: 36rpx;
  color: #fff;
  font-weight: 500;
}

.header-actions {
  width: 88rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 30rpx;
  background-color: rgba(255, 255, 255, 0.2);
}

.clear-icon {
  font-size: 36rpx;
  color: #fff;
}

.chat-messages {
  flex: 1;
  padding: 24rpx;
  margin: calc(var(--status-bar-height) + 88rpx) 0 140rpx 0;
  box-sizing: border-box;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.message-list {
  padding-bottom: 24rpx;
  min-height: 100%;
  box-sizing: border-box;
}

.message-item {
  margin-bottom: 32rpx;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-user {
  display: flex;
  justify-content: flex-end;
  padding-left: 15%;
  align-items: flex-start;
}

.message-ai {
  display: flex;
  justify-content: flex-start;
  padding-right: 15%;
  align-items: flex-start;
}

.user-message, .ai-message {
  display: flex;
  max-width: 100%;
  align-items: flex-start;
}

.user-message {
  flex-direction: row;
}

.ai-message {
  flex-direction: row;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background-color: #f0f0f0;
}

.avatar image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
.message-content {
  position: relative;
  padding: 24rpx 32rpx;
  border-radius: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
    font-size: 28rpx;
  line-height: 1.6;
  max-width: calc(100% - 100rpx);
  word-break: break-all;
}

.user-message .message-content {
  background-color: #00C292;
  color: #fff;
  border-top-right-radius: 4rpx;
}

.user-message .avatar {
  margin-left: 20rpx;
}

.ai-message .message-content {
  background-color: #fff;
  color: #333;
  border-top-left-radius: 4rpx;
}

.ai-message .avatar {
  margin-right: 20rpx;
}

.text-content {
  margin-bottom: 16rpx;
}

.image-content {
  margin-top: 24rpx;
  border-radius: 12rpx;
  overflow: hidden;
}

.generated-image {
  width: 100%;
  border-radius: 12rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.image-actions {
  display: flex;
  gap: 24rpx;
  margin-top: 16rpx;
  justify-content: center;
}

.image-content .action-btn {
  font-size: 24rpx;
  padding: 12rpx 32rpx;
  background-color: #00C292;
  color: #fff;
  border-radius: 32rpx;
  border: none;
  box-shadow: 0 4rpx 8rpx rgba(0, 194, 146, 0.2);
  width: auto;
  height: auto;
  margin: 0;
}

.image-content .action-btn:active {
  background-color: #00B386;
}

.keywords-container {
  margin-top: 24rpx;
  padding-top: 24rpx;
  border-top: 2rpx solid rgba(0, 0, 0, 0.05);
}

.keywords-title {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 16rpx;
}

.keywords-list-wrapper {
  height: 160rpx;
  overflow-y: auto;
  background-color: rgba(0, 194, 146, 0.05);
  border-radius: 16rpx;
  padding: 16rpx;
  margin-bottom: 24rpx;
}

.keywords-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.keyword-item {
  font-size: 24rpx;
  padding: 8rpx 24rpx;
  background: rgba(0, 194, 146, 0.1);
  border-radius: 32rpx;
  color: #00C292;
  white-space: nowrap;
}

.generate-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  margin-top: 20rpx;
}

.confirm-btn {
  min-width: 280rpx;
  height: 80rpx;
  background-color: #00C292;
  color: #fff;
  font-size: 28rpx;
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: 0 4rpx 12rpx rgba(0, 194, 146, 0.2);
  transition: all 0.3s ease;
}

.confirm-btn:active {
  transform: scale(0.98);
  background-color: #00B386;
}

.confirm-btn[disabled] {
  background: #E0E0E0;
  color: #999;
  box-shadow: none;
}

.generate-tip {
  font-size: 22rpx;
  color: #999;
  text-align: center;
}

.input-area {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12rpx 24rpx;
  background-color: #fff;
  border-top: 2rpx solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
  z-index: 99;
}

.input-box-container {
  display: flex;
  align-items: center;
  padding: 0 12rpx;
}

.action-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 30rpx;
  transition: all 0.3s ease;
  margin: 0 8rpx;
}

.attachment-btn {
  margin-left: 8rpx;
}

.action-btn:active {
  background-color: #e0e0e0;
}

.action-icon {
  font-size: 32rpx;
}

.input-box {
  flex: 1;
  min-height: 72rpx;
  max-height: 120rpx;
  padding: 12rpx 24rpx;
  background-color: #F8F9FA;
  border-radius: 36rpx;
  font-size: 28rpx;
  border: 2rpx solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  box-sizing: border-box;
  line-height: 1.5;
}

.send-btn {
  min-width: 72rpx;
  height: 60rpx;
  padding: 0 24rpx;
  background-color: #00C292;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 30rpx;
  margin: 0 8rpx;
  font-size: 28rpx;
}

.send-btn:active {
  background-color: #00B386;
}

.btn-disabled {
  background: #E0E0E0;
  box-shadow: none;
}

.popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 1000;
}

.quick-message-popup {
  position: fixed;
  left: 24rpx;
  bottom: 140rpx;
  width: 400rpx;
  max-height: 600rpx;
  background-color: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.popup-header {
  padding: 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2rpx solid #f0f0f0;
}

.popup-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
}

.close-btn {
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #999;
  border-radius: 20rpx;
}

.close-btn:active {
  background-color: #f0f0f0;
}

.quick-message-list {
  padding: 16rpx;
  max-height: 500rpx;
  overflow-y: auto;
}

.quick-message-item {
  padding: 20rpx;
  border-bottom: 2rpx solid #f0f0f0;
  font-size: 26rpx;
  color: #333;
  transition: all 0.3s ease;
}

.quick-message-item:active {
  background-color: #f5f5f5;
}

.quick-message-item:last-child {
  border-bottom: none;
}

.attachment-menu {
  position: fixed;
  right: 24rpx;
  bottom: 140rpx;
  background-color: #fff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
  padding: 16rpx;
  z-index: 100;
  animation: slideUp 0.3s ease-out;
}

.attachment-item {
  display: flex;
  align-items: center;
  padding: 20rpx 32rpx;
  transition: all 0.3s ease;
}

.attachment-item:active {
  background-color: #f5f5f5;
}

.attachment-icon {
  font-size: 40rpx;
  margin-right: 16rpx;
}

.attachment-text {
  font-size: 28rpx;
  color: #333;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4rpx);
}

.loading-content {
  background-color: rgba(0, 0, 0, 0.8);
  padding: 40rpx;
  border-radius: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: fadeInScale 0.3s ease-out;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 6rpx solid rgba(255, 255, 255, 0.3);
  border-top: 6rpx solid #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  color: #fff;
  font-size: 28rpx;
  margin-top: 24rpx;
  font-weight: 500;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Added specific margins for avatars in user and AI messages */
.user-message .avatar {
  margin-left: 20rpx; 
}

.ai-message .avatar {
  margin-right: 20rpx; 
}

/* Style for the custom action button like 'Go to confirm specs' */
.custom-action-container .action-btn.confirm-btn {
  min-width: auto; 
  width: auto; 
  height: auto; 
  padding: 18rpx 40rpx; 
  background-color: #00C292; /* Theme color */
  color: #fff; 
  font-size: 28rpx;
  border-radius: 40rpx; 
  box-shadow: 0 4rpx 12rpx rgba(0, 194, 146, 0.2); 
  margin-top: 10rpx; 
  border: none; /* Ensure no default border */
  line-height: normal; /* Ensure proper text alignment */
}
</style> 