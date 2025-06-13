<template>
  <view class="chat-container">
    <!-- 头部导航栏 -->
    <view class="chat-header">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <view class="header-title">
        <text class="title-text">AI定制助手</text>
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
              <image src="/static/images/ai-avatar.png" mode="aspectFill"></image>
            </view>
            <view class="message-content">
              <!-- 文字内容 -->
              <view class="text-content">{{ message.content }}</view>
              
              <!-- 如果有关键词提示 -->
              <view v-if="message.keywords && message.keywords.length > 0" class="keywords-container">
                <text class="keywords-title">提取的关键词：</text>
                <view class="keywords-list">
                  <text 
                    v-for="(keyword, idx) in message.keywords" 
                    :key="idx" 
                    class="keyword-item"
                  >{{ keyword }}</text>
                </view>
                <!-- 添加确认按钮 -->
                <view class="generate-actions" v-if="!message.imageUrl">
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
              
              <!-- 如果有生成的图片 -->
              <view v-if="message.imageUrl" class="image-content">
                <image 
                  :src="message.imageUrl" 
                  mode="widthFix" 
                  @tap="previewImage(message.imageUrl)"
                  class="generated-image"
                ></image>
                <view class="image-actions">
                  <button class="action-btn" @tap="regenerateImage(message)">重新生成</button>
                  <button class="action-btn" @tap="saveImage(message.imageUrl)">保存图片</button>
                </view>
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
          placeholder="请描述您想要定制的商品..."
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
    <view class="popup-mask" v-if="showQuickMessagePopup" @tap="showQuickMessagePopup = false">
      <view class="quick-message-popup" @tap.stop>
        <view class="popup-header">
          <text class="popup-title">快捷消息</text>
          <view class="close-btn" @tap="showQuickMessagePopup = false">✕</view>
        </view>
        <view class="quick-message-list">
          <view 
            v-for="(msg, idx) in quickMessages" 
            :key="idx"
            class="quick-message-item"
            @tap="selectQuickMessage(msg)"
          >
            {{ msg }}
          </view>
        </view>
      </view>
    </view>

    <!-- 附件菜单 -->
    <view class="attachment-menu" v-if="showAttachmentMenu">
      <view class="attachment-item" @tap="chooseImage('album')">
        <text class="attachment-icon">🖼️</text>
        <text class="attachment-text">相册</text>
      </view>
      <view class="attachment-item" @tap="chooseImage('camera')">
        <text class="attachment-icon">📷</text>
        <text class="attachment-text">拍照</text>
      </view>
      <view class="attachment-item" @tap="chooseFile">
        <text class="attachment-icon">📁</text>
        <text class="attachment-text">文件</text>
      </view>
    </view>

    <!-- 加载中提示 -->
    <view v-if="loading" class="loading-mask">
      <view class="loading-content">
        <view class="loading-spinner"></view>
        <text class="loading-text">{{ loadingText }}</text>
      </view>
    </view>
  </view>
</template>

<script>
import axios from 'axios'
// import pageRefreshMixin from '@/mixins/pageRefresh.js' // Commented out
import { getUserProfile } from '../../utils/profileService'
import { getImageInfo, saveImageToPhotosAlbum, downloadFile } from '@/utils/imageTools.js'
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

// 创建axios实例
const apiClient = axios.create({
  timeout: 30000, // 30秒超时
  headers: {
    'Content-Type': 'application/json'
  }
});

// 添加响应拦截器
apiClient.interceptors.response.use(
  response => response,
  error => {
    console.error('API请求错误:', error);
    if (error.code === 'ERR_NETWORK') {
      uni.showToast({
        title: '网络连接失败，请检查服务是否启动',
        icon: 'none',
        duration: 3000
      });
    }
    return Promise.reject(error);
  }
);

export default {
  // mixins: [pageRefreshMixin], // Commented out
  setup() {
    const messages = ref([]);
    const inputMessage = ref('');
    const loading = ref(false);
    const userInfo = ref({});
    const scrollTop = ref(0);
    const keyboardHeight = ref(0);

    onMounted(async () => {
      console.log('design-chat.vue onMounted (minimal)');
      try {
        // Minimal user profile load
        // const profile = await getUserProfile();
        // if (profile && profile._id) {
        //   userInfo.value = profile;
        // } else {
        //   userInfo.value = { username: '用户', nickname: '访客', avatar: '' };
        // }
      } catch (error) {
        console.error('Minimal onMounted error:', error);
      }
    });

    const sendMessage = () => {
      console.log('sendMessage called (minimal)');
    };

    const goBack = () => {
      uni.navigateBack();
    }

    // Return only essential refs and functions for the template to initially render
    return {
      messages,
      inputMessage,
      loading,
      userInfo, // Keep for avatar display if any
      scrollTop,
      keyboardHeight, // For input area style binding
      sendMessage, // For send button
      goBack // For back button
      // Comment out other complex refs and functions for now
      // userInitial, 
      // loadingText, 
      // isRefreshing, 
      // sessionId, 
      // quickMessages, 
      // showQuickMessagePopup, 
      // showAttachmentMenu, 
      // chatState, 
      // apiConfig,
      // generateSessionId,
      // loadMessages,
      // saveMessages,
      // saveChatState,
      // loadChatState,
      // clearHistory,
      // getPreviousContext,
      // getPreviousKeywords,
      // generateImage,
      // regenerateImage,
      // saveImage,
      // previewImage,
      // scrollToBottom,
      // loadMoreMessages,
      // onRefresh,
      // onInputFocus,
      // onInputBlur,
      // toggleQuickMessagePopup,
      // toggleAttachmentMenu,
      // selectQuickMessage,
      // chooseImage,
      // chooseFile
    };
  }
}
</script>

<style>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #F8F9FA;
  position: relative;
}

.chat-header {
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  background-color: #00C292;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: 88rpx;
  padding-top: var(--status-bar-height);
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);
}

.back-btn {
  width: 88rpx;
  height: 88rpx;
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

.keywords-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.keyword-item {
  font-size: 24rpx;
  padding: 8rpx 24rpx;
  background: rgba(0, 194, 146, 0.1);
  border-radius: 32rpx;
  color: #00C292;
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
</style> 