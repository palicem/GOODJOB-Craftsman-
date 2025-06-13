<template>
  <view class="profile-container">
    <view class="user-card">
      <view class="avatar" @click="handleAvatarClick">
        <image v-if="userInfo.avatar" :src="userInfo.avatar" mode="aspectFill" class="avatar-image"></image>
        <text v-else class="avatar-placeholder">{{(userInfo.nickname || userInfo.username || 'U').substr(0, 1).toUpperCase()}}</text>
      </view>
      <view class="user-info">
        <text class="username">{{userInfo.nickname || userInfo.account_name || userInfo.username || '未登录'}}</text>
        <text class="register-time" v-if="userInfo.registerTime">注册时间：{{formatDate(userInfo.registerTime)}}</text>
      </view>
    </view>
    
    <!-- 收藏模块 -->
    <view class="favorites-section">
      <view class="favorite-item" @click="goToFavorites">
        <text class="iconfont icon-favorite"></text>
        <text class="favorite-label">我的收藏</text>
      </view>
      <view class="favorite-divider"></view>
      <view class="favorite-item" @click="goToFavoriteShops">
        <text class="iconfont icon-shop"></text>
        <text class="favorite-label">收藏店铺</text>
      </view>
    </view>
    
    <!-- 我的订单模块 -->
    <view class="orders-section">
      <view class="section-header" @click="goToOrders(-1)">
        <text class="section-title">我的订单</text>
        <view class="section-more">
          <text class="more-text">全部</text>
          <text class="more-icon">›</text>
        </view>
      </view>
      
      <view class="order-types">
        <view class="order-type-item" @click="goToOrders(1)">
          <view class="order-icon-wrapper">
            <text class="order-icon">💳</text>
            <text class="order-badge" v-if="orderCounts.toPay > 0">{{orderCounts.toPay}}</text>
          </view>
          <text class="order-type-text">待付款</text>
        </view>
        
        <view class="order-type-item" @click="goToOrders(2)">
          <view class="order-icon-wrapper">
            <text class="order-icon">📦</text>
            <text class="order-badge" v-if="orderCounts.toShip > 0">{{orderCounts.toShip}}</text>
          </view>
          <text class="order-type-text">待发货</text>
        </view>
        
        <view class="order-type-item" @click="goToOrders(3)">
          <view class="order-icon-wrapper">
            <text class="order-icon">🚚</text>
            <text class="order-badge" v-if="orderCounts.toReceive > 0">{{orderCounts.toReceive}}</text>
          </view>
          <text class="order-type-text">待收货</text>
        </view>
        
        <view class="order-type-item" @click="goToOrders(4)">
          <view class="order-icon-wrapper">
            <text class="order-icon">💬</text>
            <text class="order-badge" v-if="orderCounts.completed > 0">{{orderCounts.completed}}</text>
          </view>
          <text class="order-type-text">待评价</text>
        </view>
        
        <view class="order-type-item" @click="goToOrders(5)">
          <view class="order-icon-wrapper">
            <text class="order-icon">↩️</text>
          </view>
          <text class="order-type-text">退款/售后</text>
        </view>
      </view>
    </view>
    
    <view class="menu-list">
      <view class="menu-item" @click="goToSettings">
        <text class="menu-icon">⚙️</text>
        <text class="menu-text">设置</text>
      </view>
      
      <view class="menu-item" @click="handleLogout">
        <text class="menu-icon">🚪</text>
        <text class="menu-text">退出登录</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import userService from '../../../utils/userService';
import { getUserProfile } from '../../../utils/profileService';
import { getOrderList, getOrderCounts } from '../../../utils/orderService';
import { useUserStore } from '@/stores/user';

const userInfo = ref({});
const userStore = useUserStore();
const orderCounts = ref({
  toPay: 0,
  toShip: 0,
  toReceive: 0,
  completed: 0
});

const loadUserProfile = async () => {
  console.log('[profile.vue] Attempting to load user profile.');
  if (userStore.userInfo && (userStore.userInfo.id || userStore.userInfo._id)) {
    console.log('[profile.vue] Loaded userInfo from userStore:', JSON.stringify(userStore.userInfo));
    userInfo.value = { ...userStore.userInfo };
    if (!userInfo.value.username && userInfo.value.account_name) {
        userInfo.value.username = userInfo.value.account_name;
    }
    return;
  }
  
  console.log('[profile.vue] No valid userInfo in store, calling profileService.getUserProfile().');
  try {
    const profileResult = await getUserProfile();
    console.log('[profile.vue] profileService.getUserProfile() result:', JSON.stringify(profileResult));
    if (profileResult && profileResult.success && profileResult.data) {
      userInfo.value = { ...profileResult.data };
      userStore.setUserInfo(profileResult.data);
      console.log('[profile.vue] Loaded userInfo from profileService and updated store:', JSON.stringify(userInfo.value));
    } else {
      console.warn('[profile.vue] getUserProfile did not return successful data. Falling back to local storage via userService.');
      const localUser = userService.getCurrentUser();
      userInfo.value = localUser || {};
      if (localUser) userStore.setUserInfo(localUser);
      console.log('[profile.vue] Fallback to userService.getCurrentUser():', JSON.stringify(userInfo.value));
    }
  } catch (error) {
    console.error("[profile.vue] Failed to load user profile via profileService:", error);
    const localUser = userService.getCurrentUser();
    userInfo.value = localUser || {}; 
    if (localUser) userStore.setUserInfo(localUser);
    console.log('[profile.vue] Error fallback to userService.getCurrentUser():', JSON.stringify(userInfo.value));
  }
  if (userInfo.value && !userInfo.value.username && userInfo.value.account_name) {
      userInfo.value.username = userInfo.value.account_name;
  }
};

const loadOrderCounts = async () => {
  console.log('[profile.vue] loadOrderCounts called');
  try {
    const counts = await getOrderCounts();
    console.log('[profile.vue] getOrderCounts response:', JSON.stringify(counts));
    if (counts) {
  orderCounts.value = {
        toPay: counts.to_pay || 0,
        toShip: counts.to_ship || 0,
        toReceive: counts.to_receive || 0,
        completed: counts.to_review || counts.completed || 0, 
      };
      console.log('[profile.vue] Updated orderCounts.value:', JSON.stringify(orderCounts.value));
    } else {
      console.warn('[profile.vue] getOrderCounts returned null or undefined');
    }
  } catch (error) {
    console.error("[profile.vue] Failed to load order counts:", error);
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const handleUserInfoUpdate = async (data) => {
  console.log('[profile.vue] Received userInfoUpdated event with data:', data);
  if (data && (data.id || data._id)){
    userInfo.value = { ...data };
    userStore.setUserInfo(data);
    console.log('[profile.vue] Updated userInfo from event.');
  } else {
    await loadUserProfile();
  }
};
  
const handleUserAvatarUpdate = (avatarPath) => {
  if (userInfo.value) {
    userInfo.value.avatar = avatarPath;
  }
};

const handleOrdersUpdate = async () => {
  await loadOrderCounts();
};

onMounted(async () => {
  userStore.loadInitialState();
  await loadUserProfile();
  await loadOrderCounts();
  
  uni.$on('userInfoUpdated', handleUserInfoUpdate);
  uni.$on('userAvatarUpdated', handleUserAvatarUpdate);
  uni.$on('orders-updated', handleOrdersUpdate);
  uni.$on('order-counts-updated', handleOrdersUpdate);
  
  const pages = getCurrentPages();
  const page = pages[pages.length - 1];
  
  if (page && page.$vm) {
    const originalOnShow = page.$vm.$options.onShow;
    page.$vm.$options.onShow = function() {
      if (originalOnShow) {
        originalOnShow.call(this);
      }
      loadOrderCounts();
    };
  }
});

onBeforeUnmount(() => {
  uni.$off('userInfoUpdated', handleUserInfoUpdate);
  uni.$off('userAvatarUpdated', handleUserAvatarUpdate);
  uni.$off('orders-updated', handleOrdersUpdate);
  uni.$off('order-counts-updated', handleOrdersUpdate);
});

const goToOrders = (type) => {
  const actualType = type < 0 ? 0 : type;
  console.log(`[profile.vue] goToOrders called with type: ${type}, actualType: ${actualType}`);
  uni.navigateTo({
    url: `/pages/orders/orders?type=${actualType}`
  });
};

const goToSettings = () => {
  uni.navigateTo({
    url: '/pages/user/settings'
  });
};

const goToFavorites = () => {
  uni.navigateTo({ url: '/pages/user/favorites' });
};

const goToFavoriteShops = () => {
  uni.navigateTo({ url: '/pages/user/favorite-shops' });
};

const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await userService.logout();
        uni.showToast({
          title: '已退出登录',
          icon: 'none'
        });
        setTimeout(() => {
          uni.reLaunch({
            url: '/pages/login/login'
          });
        }, 1500);
        } catch (error) {
          console.error('退出登录失败:', error);
          uni.showToast({
            title: '退出失败，请重试',
            icon: 'none'
          });
        }
      }
    }
  });
};

const handleAvatarClick = () => {
  console.log('Avatar clicked, navigation to user-info page or other action.');
  uni.navigateTo({ url: '/pages/user/user-info' });
};
</script>

<style lang="scss">
.profile-container {
  padding: 20rpx;
  padding-bottom: 120rpx;
  padding-top: var(--status-bar-height);
}

.user-card {
  display: flex;
  align-items: center;
  padding: 40rpx;
  background-color: #fff;
  border-radius: 10rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  margin-top: 60rpx;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background-color: #00BFA6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 30rpx;
  overflow: hidden;
  
  .avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.avatar-placeholder {
  font-size: 50rpx;
  color: #fff;
  font-weight: bold;
  }
}

.user-info {
  flex: 1;
}

.username {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
  display: block;
}

.register-time {
  font-size: 24rpx;
  color: #999;
}

.favorites-section {
  margin-top: 20rpx;
  background-color: #fff;
  border-radius: 10rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  padding: 30rpx;
  display: flex;
  align-items: center;
}

.favorite-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.favorite-divider {
  width: 2rpx;
  height: 60rpx;
  background-color: #eee;
  margin: 0 30rpx;
}

.iconfont {
  font-size: 44rpx;
  color: #00BFA6;
  margin-bottom: 10rpx;
}

.favorite-label {
  font-size: 26rpx;
  color: #333;
}

.orders-section {
  margin-top: 20rpx;
  background-color: #fff;
  border-radius: 10rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  padding: 30rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.section-more {
  display: flex;
  align-items: center;
}

.more-text {
  font-size: 26rpx;
  color: #999;
}

.more-icon {
  font-size: 28rpx;
  color: #999;
  margin-left: 4rpx;
}

.order-types {
  display: flex;
  justify-content: space-between;
}

.order-type-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.order-icon-wrapper {
  position: relative;
  margin-bottom: 10rpx;
}

.order-icon {
  font-size: 44rpx;
}

.order-badge {
  position: absolute;
  top: -10rpx;
  right: -10rpx;
  background-color: #f56c6c;
  color: #fff;
  font-size: 22rpx;
  min-width: 32rpx;
  height: 32rpx;
  border-radius: 16rpx;
  text-align: center;
  line-height: 32rpx;
  padding: 0 6rpx;
}

.order-type-text {
  font-size: 24rpx;
  color: #666;
}

.menu-list {
  margin-top: 30rpx;
  background-color: #fff;
  border-radius: 10rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
}

.menu-icon {
  font-size: 40rpx;
  margin-right: 20rpx;
}

.menu-text {
  font-size: 28rpx;
  color: #333;
}
</style> 