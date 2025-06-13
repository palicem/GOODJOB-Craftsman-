<template>
  <view class="container">
    <!-- 自定义状态栏和导航栏 -->
    <view class="nav-header">
      <view class="status-bar"></view>
      <view class="nav-bar">
        <text class="nav-title">{{tabTitles[currentTab]}}</text>
      </view>
    </view>

    <!-- 内容区域 -->
    <view class="content">
      <home-page v-if="currentTab === 0" />
      <message-page v-if="currentTab === 1" />
      <cart-page v-if="currentTab === 2" />
      <profile-page v-if="currentTab === 3" />
    </view>
    
    <!-- 底部导航栏 -->
    <view class="tab-bar">
      <view 
        class="tab-item" 
        :class="{'active': currentTab === 0}" 
        @click="switchTab(0)"
      >
        <view class="tab-icon">
          <text class="iconfont">🏠</text>
        </view>
        <text class="tab-text">首页</text>
      </view>
      
      <view 
        class="tab-item" 
        :class="{'active': currentTab === 1}" 
        @click="switchTab(1)"
      >
        <view class="tab-icon">
          <text class="iconfont">💬</text>
        </view>
        <text class="tab-text">消息</text>
      </view>
      
      <view 
        class="tab-item" 
        :class="{'active': currentTab === 2}" 
        @click="switchTab(2)"
      >
        <view class="tab-icon">
          <text class="iconfont">🛒</text>
        </view>
        <text class="tab-text">购物车</text>
      </view>
      
      <view 
        class="tab-item" 
        :class="{'active': currentTab === 3}" 
        @click="switchTab(3)"
      >
        <view class="tab-icon">
          <text class="iconfont">👤</text>
        </view>
        <text class="tab-text">我的</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import HomePage from './home/home.vue';
import MessagePage from './message/message.vue';
import CartPage from './cart/cart.vue';
import ProfilePage from './profile/profile.vue';
import userService from '../../utils/userService';

// 标题
const tabTitles = ['首页', '消息', '购物车', '我的'];

// 当前选中的标签
const currentTab = ref(0);

// 切换标签
const switchTab = (index) => {
  currentTab.value = index;
  
  // 如果切换到购物车页面，触发购物车页面的显示事件
  if (index === 2) {
    console.log('切换到购物车页面，触发购物车更新事件');
    // 先触发购物车更新事件
    uni.$emit('update-cart-badge');
    // 然后触发页面显示事件
    setTimeout(() => {
      uni.$emit('cart-page-show');
    }, 100);
  }
};

// 页面加载时的调试信息
onMounted(() => {
  try {
    console.log('主页面已加载');
    
    // 检查登录状态
    if (!userService.isLoggedIn()) {
      console.log('用户未登录或登录状态已过期，准备跳转到登录页面');
      
      // 清除可能存在的无效登录状态
      userService.clearLoginState();
      
      uni.showToast({
        title: '登录已过期，请重新登录',
        icon: 'none',
        duration: 2000
      });
      
      setTimeout(() => {
        uni.reLaunch({
          url: '../login/login?expired=true',
          fail: (err) => {
            console.error('跳转登录页失败:', err);
          }
        });
      }, 1000);
      return;
    }
    
    // 获取当前登录用户信息
    const currentUser = userService.getCurrentUser();
    console.log('当前登录用户信息:', currentUser ? currentUser : '未登录');
    
    // 如果未登录，跳回登录页
    if (!currentUser) {
      console.log('未检测到登录信息，准备跳转到登录页');
      setTimeout(() => {
        uni.redirectTo({
          url: '../login/login',
          fail: (err) => {
            console.error('跳转登录页失败:', err);
          }
        });
      }, 1000);
      return;
    }
    
    uni.showToast({
      title: '页面加载成功',
      icon: 'success',
      duration: 1500
    });
  } catch (error) {
    console.error('主页加载出错:', error);
    uni.showToast({
      title: '页面加载异常',
      icon: 'none'
    });
  }
});
</script>

<style lang="scss">
/* 小程序风格容器 */
page {
  background-color: #f7f7f7;
  height: 100%;
  font-size: 28rpx;
  line-height: 1.5;
  color: #333;
  -webkit-overflow-scrolling: touch;
}

.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  box-sizing: border-box;
  position: relative;
  background-color: #f7f7f7;
}

/* 导航栏样式 */
.nav-header {
  position: fixed;
  width: 100%;
  top: 0;
  left: 0;
  z-index: 99;
}

.status-bar {
  height: var(--status-bar-height, 25px);
  width: 100%;
  background-color: #00BFA6;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 90rpx;
  background-color: #00BFA6;
  color: #FFFFFF;
  position: relative;
}

.nav-title {
  font-size: 32rpx;
  font-weight: 500;
  text-align: center;
}

/* 内容区域样式 */
.content {
  flex: 1;
  margin-top: calc(var(--status-bar-height, 25px) + 90rpx);
  margin-bottom: 100rpx;
  width: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 底部导航栏样式 */
.tab-bar {
  display: flex;
  justify-content: space-around;
  height: 100rpx;
  background-color: #fff;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom); /* 兼容iPhone X等机型底部安全区 */
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 10rpx;
  
  &.active {
    .tab-icon {
      color: #00BFA6;
    }
    
    .tab-text {
      color: #00BFA6;
    }
  }
}

.tab-icon {
  font-size: 44rpx;
  color: #999;
  margin-bottom: 6rpx;
}

.tab-text {
  font-size: 24rpx;
  color: #999;
}

/* 适配H5环境 */
/* #ifdef H5 */
.container {
  max-width: 750rpx;
  margin: 0 auto;
}

.status-bar {
  height: 0;
}
/* #endif */
</style> 