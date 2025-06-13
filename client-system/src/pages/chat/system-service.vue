<template>
  <view class="chat-container">
    <!-- 头部导航栏 -->
    <view class="chat-header">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <view class="header-title">
        <text class="title-text">系统客服</text>
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
            <view class="message-content">{{ message.content }}</view>
            <view class="avatar">
              <image v-if="userInfo.avatar" :src="userInfo.avatar" mode="aspectFill"></image>
              <text v-else class="avatar-text">{{ userInitial }}</text>
            </view>
          </view>
          
          <!-- AI消息 -->
          <view v-else class="ai-message">
            <view class="avatar">
              <text class="avatar-text">客</text>
            </view>
            <view class="message-content">{{ message.content }}</view>
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
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { sendMessageToAI } from '../../utils/aiService';
import { getUserProfile } from '../../utils/profileService';
import { usePageRefresh } from '@/mixins/pageRefresh.js';

// 调用组合式函数并获取返回的方法
const { handlePageBack } = usePageRefresh();

// 用户信息
const userInfo = ref({});

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

// 快捷消息列表
const quickMessages = [
  '如何修改个人资料？',
  '如何查看订单状态？',
  '如何修改收货地址？',
  '如何申请退款？',
  '如何联系商家？'
];

// 生成会话ID
const generateSessionId = () => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// 加载历史消息
const loadMessages = () => {
  try {
    const savedMessages = uni.getStorageSync(`system_${sessionId.value}_messages`);
    if (savedMessages) {
      messages.value = JSON.parse(savedMessages);
    }
    
    // 如果没有历史消息，显示欢迎消息
    if (!messages.value || messages.value.length === 0) {
      messages.value = [{
        type: 'ai',
        content: `您好！我是系统客服，很高兴为您服务。
        
我可以帮您：
- 解答系统使用问题
- 处理账号相关问题
- 反馈系统故障
- 提供功能建议

请问有什么可以帮您的吗？`,
        time: new Date().toISOString()
      }];
      saveMessages();
    }
  } catch (error) {
    console.error('加载消息失败:', error);
  }
};

// 保存消息
const saveMessages = () => {
  try {
    uni.setStorageSync(`system_${sessionId.value}_messages`, JSON.stringify(messages.value));
  } catch (error) {
    console.error('保存消息失败:', error);
  }
};

// 清空历史记录
const clearHistory = () => {
  uni.showModal({
    title: '确认清空',
    content: '确定要清空所有聊天记录吗？这将开始一个新的会话。',
    success: (res) => {
      if (res.confirm) {
        messages.value = [{
          type: 'ai',
          content: `您好！我是系统客服，很高兴为您服务。
          
我可以帮您：
- 解答系统使用问题
- 处理账号相关问题
- 反馈系统故障
- 提供功能建议

请问有什么可以帮您的吗？`,
          time: new Date().toISOString()
        }];
        
        // 生成新的会话ID
        sessionId.value = generateSessionId();
        uni.setStorageSync('system_session_id', sessionId.value);
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

    // 构建消息数组
    const messageArray = [
      {
        role: 'system',
        content: `你是一个专业的系统客服助手。你的主要工作是：
1. 解答用户关于系统使用的问题
2. 处理用户账号相关的问题
3. 接收用户的系统故障反馈
4. 收集用户的功能建议

请用专业、友好的语气回答用户的问题。如果遇到需要技术支持的问题，建议用户联系技术支持团队。`
      }
    ];

    // 添加历史消息（最多3条）
    const historyMessages = messages.value.slice(-6);
    for (const msg of historyMessages) {
      messageArray.push({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    }

    const response = await sendMessageToAI(messageArray);

    if (!response.success) {
      throw new Error(response.message || '获取回复失败');
    }

    // 添加AI回复
    messages.value.push({
      type: 'ai',
      content: response.reply,
      time: new Date().toISOString()
    });

    saveMessages();
    scrollToBottom();

  } catch (error) {
    console.error('发送消息错误:', error);
    messages.value.push({
      type: 'ai',
      content: '抱歉，处理您的消息时出现错误，请稍后重试。',
      time: new Date().toISOString()
    });
    saveMessages();
  } finally {
    loading.value = false;
  }
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
};

// 选择快捷消息
const selectQuickMessage = (message) => {
  inputMessage.value = message;
  showQuickMessagePopup.value = false;
};

// 页面加载时获取用户信息
onMounted(async () => {
  try {
    // 获取会话ID
    const storedSessionId = uni.getStorageSync('system_session_id');
    if (storedSessionId) {
      sessionId.value = storedSessionId;
    } else {
      sessionId.value = generateSessionId();
      uni.setStorageSync('system_session_id', sessionId.value);
    }

    // 获取用户信息
    const profile = await getUserProfile();
    if (profile && profile._id) {
      userInfo.value = profile;
    } else {
      console.warn('system-service.vue: Failed to load user profile or profile is invalid.');
      // Fallback or default user info if profile loading fails
      userInfo.value = { username: '用户', nickname: '访客', avatar: '' }; 
    }
    loadMessages();
  } catch (error) {
    console.error('system-service.vue: Error onMounted:', error);
    userInfo.value = { username: '用户', nickname: '访客', avatar: '' }; // Fallback on error
    loadMessages(); // Still load messages, perhaps with a default/guest context
  }
  scrollToBottom();

  // 监听键盘高度变化 (H5和小程序)
  uni.onKeyboardHeightChange(res => {
    keyboardHeight.value = res.height;
    if (res.height > 0) {
      scrollToBottom(); 
    }
  });
});

onUnmounted(() => {
  uni.$off('userInfoUpdated');
  saveMessages();
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
}

.message-ai {
  display: flex;
  justify-content: flex-start;
  padding-right: 15%;
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
  margin: 0 20rpx;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-text {
  font-size: 32rpx;
  color: #666;
}

.message-content {
  position: relative;
  padding: 24rpx 32rpx;
  border-radius: 24rpx;
  background-color: #fff;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  font-size: 28rpx;
  line-height: 1.6;
  max-width: calc(100% - 120rpx);
  word-break: break-all;
}

.user-message .message-content {
  background-color: #00C292;
  color: #fff;
  margin-right: 12rpx;
  border-top-right-radius: 4rpx;
}

.ai-message .message-content {
  background-color: #fff;
  color: #333;
  margin-left: 12rpx;
  border-top-left-radius: 4rpx;
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

.keyword-item {
  font-size: 24rpx;
  padding: 8rpx 24rpx;
  background: rgba(0, 194, 146, 0.1);
  border-radius: 32rpx;
  color: #00C292;
}
</style> 