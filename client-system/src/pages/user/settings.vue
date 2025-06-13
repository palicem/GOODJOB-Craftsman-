<template>
  <view class="settings-container">
    <!-- 头部标题栏 -->
    <view class="header">
      <view class="back-btn" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <view class="header-title">
        <text class="title-text">设置</text>
      </view>
      <view class="placeholder"></view>
    </view>
    
    <!-- 设置选项列表 -->
    <view class="settings-list">
      <view class="settings-group">
        <view class="settings-item" @click="goToUserInfo">
          <text class="item-title">{{ userInfo?.nickname || '未设置' }}</text>
          <view class="item-right">
            <text class="item-subtitle">账号名:{{ userInfo?.account_name || userInfo?.username || '未设置' }}</text>
            <text class="item-arrow">›</text>
          </view>
        </view>
        
        <view class="settings-item" @click="goToShippingAddress">
          <text class="item-title">我的收货地址</text>
          <text class="item-arrow">›</text>
        </view>
      </view>
      
      <view class="settings-group">
        <view class="settings-item">
          <text class="item-title">消息通知</text>
          <switch color="#00BFA6" :checked="notificationEnabled" @change="toggleNotification" />
        </view>
        
        <view class="settings-item">
          <text class="item-title">隐私设置</text>
          <text class="item-arrow">›</text>
        </view>
        
        <view class="settings-item">
          <text class="item-title">账号安全</text>
          <text class="item-arrow">›</text>
        </view>
      </view>
      
      <view class="settings-group">
        <view class="settings-item">
          <text class="item-title">清除缓存</text>
          <text class="item-value">{{cacheSize}}MB</text>
        </view>
        
        <view class="settings-item">
          <text class="item-title">关于我们</text>
          <text class="item-arrow">›</text>
        </view>
        
        <view class="settings-item">
          <text class="item-title">当前版本</text>
          <text class="item-value">1.0.0</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { getUserProfile, formatPhone, formatGender, updateUserProfile } from '@/utils/profileService';
import { usePageRefresh } from '@/mixins/pageRefresh.js';
import { useUserStore } from '@/stores/user';

const { handlePageBack } = usePageRefresh();

const userInfo = ref({});
const userStore = useUserStore();

const notificationEnabled = ref(true);
const cacheSize = ref('0.8');

const goBack = () => {
  handlePageBack();
};

const goToUserInfo = () => {
  uni.navigateTo({
    url: '/pages/user/user-info'
  });
};

const goToShippingAddress = () => {
  uni.navigateTo({
    url: '/pages/user/shipping-address'
  });
};

const toggleNotification = (e) => {
  notificationEnabled.value = e.detail.value;
  uni.showToast({
    title: notificationEnabled.value ? '已开启通知' : '已关闭通知',
    icon: 'none'
  });
};

const loadUserProfile = async () => {
  if (userStore.userInfo) {
    userInfo.value = userStore.userInfo;
    console.log('[settings.vue] Loaded userInfo from userStore:', JSON.stringify(userStore.userInfo));
  } else {
    console.log('[settings.vue] userStore.userInfo is null, calling profileService.getUserProfile()');
    try {
      const profileData = await getUserProfile();
      if (profileData && profileData.success && profileData.data) {
        userStore.setUserInfo(profileData.data);
        userInfo.value = profileData.data;
        console.log('[settings.vue] Loaded userInfo from profileService and updated store:', JSON.stringify(profileData.data));
      } else {
        console.warn('[settings.vue] getUserProfile did not return successful data, userInfo might be empty.', profileData ? profileData.message : 'No response from profileService');
      }
    } catch (error) {
      console.error('[settings.vue] Error calling getUserProfile:', error);
    }
  }
};

onMounted(async () => {
  userStore.loadInitialState();
  await loadUserProfile();
});
</script>

<style lang="scss">
.settings-container {
  min-height: 100vh;
  background-color: #f8f8f8;
}

.header {
  display: flex;
  align-items: center;
  padding: 10rpx 30rpx;
  background-color: #ffffff;
  position: relative;
  z-index: 10;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
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
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
}

.header-title {
  flex: 1;
  text-align: center;
}

.title-text {
  font-size: 36rpx;
  font-weight: 500;
  color: #333;
}

.placeholder {
  width: 60rpx;
}

.settings-list {
  padding: 20rpx;
}

.settings-group {
  background-color: #ffffff;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
}

.settings-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
}

.item-title {
  font-size: 28rpx;
  color: #333;
}

.item-right {
  display: flex;
  align-items: center;
}

.item-subtitle {
  font-size: 24rpx;
  color: #999;
  margin-right: 10rpx;
}

.item-value {
  font-size: 24rpx;
  color: #999;
}

.item-arrow {
  font-size: 32rpx;
  color: #999;
  margin-left: 10rpx;
}
</style> 