<template>
  <view class="page-wrapper">
    <view class="register-container">
      <!-- 顶部导航栏 -->
      <view class="nav-bar">
        <view class="back-btn" @click="goBack">
          <text class="icon">&lt;</text>
        </view>
      </view>
      
      <!-- 注册卡片 -->
      <view class="register-card">
        <view class="register-header">
          <text class="register-title">账号注册</text>
        </view>
        
        <view class="input-group">
          <text class="input-label">用户名</text>
          <input 
            class="input-box" 
            type="text" 
            placeholder="请输入用户名" 
            v-model="formData.username"
            @blur="checkUsername"
          />
          <text v-if="usernameError" class="error-tip">{{usernameError}}</text>
        </view>
        
        <view class="input-group">
          <text class="input-label">密码</text>
          <input 
            class="input-box" 
            type="password" 
            placeholder="请输入密码" 
            password
            v-model="formData.password"
          />
        </view>
        
        <view class="input-group">
          <text class="input-label">确认密码</text>
          <input 
            class="input-box" 
            type="password" 
            placeholder="请再次输入密码" 
            password
            v-model="formData.confirmPassword"
          />
          <text v-if="passwordError" class="error-tip">{{passwordError}}</text>
        </view>
        
        <view class="btn-register" @click="handleRegister">注册</view>
        
        <view class="login-link">
          <text>已有账号？</text>
          <text class="link" @click="goLogin">立即登录</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref } from 'vue';
import userService from '../../utils/userService';

// 表单数据
const formData = reactive({
  username: '',
  password: '',
  confirmPassword: ''
});

// 错误信息
const usernameError = ref('');
const passwordError = ref('');

// 检查用户名是否已存在
const checkUsername = async () => {
  if (!formData.username) {
    usernameError.value = '';
    return;
  }
  
  try {
    const exists = await userService.isUserExists(formData.username.trim());
    if (exists) {
      usernameError.value = '该用户名已被注册';
    } else {
      usernameError.value = '';
    }
  } catch (error) {
    console.error('检查用户名失败:', error);
    usernameError.value = '检查用户名时出错';
  }
};

// 注册方法
const handleRegister = async () => {
  // 重置错误信息
  usernameError.value = '';
  passwordError.value = '';
  
  // 验证表单
  if (!formData.username) {
    usernameError.value = '请输入用户名';
    return;
  }
  
  try {
    const exists = await userService.isUserExists(formData.username.trim());
    if (exists) {
      usernameError.value = '该用户名已被注册';
      return;
    }
  } catch (error) {
    console.error('注册前检查用户名失败:', error);
    usernameError.value = '检查用户名时出错，请重试';
    return;
  }
  
  if (!formData.password) {
    passwordError.value = '请输入密码';
    return;
  }
  
  if (formData.password !== formData.confirmPassword) {
    passwordError.value = '两次输入的密码不一致';
    return;
  }
  
  uni.showLoading({
    title: '注册中...',
    mask: true
  });

  // 注册用户
  const userData = {
    username: formData.username.trim(),
    password: formData.password.trim(),
    // accountName 和 nickname 可以由后端处理或在此处生成
    // registerTime 由后端自动生成
  };
  
  try {
    const result = await userService.register(userData);
    uni.hideLoading();

    if (result.success) {
      uni.showToast({
        title: '注册成功',
        icon: 'success'
      });
      // 注册成功后跳转到登录页面并填入刚注册的用户名和密码
      setTimeout(() => {
        userService.saveRegisterTempData({
          username: formData.username,
          password: formData.password
        });
        uni.redirectTo({
          url: '/pages/login/login'
        });
      }, 1500);
    } else {
      uni.showToast({
        title: result.message || '注册失败，请重试',
        icon: 'none'
      });
    }
  } catch (error) {
    uni.hideLoading();
    console.error('注册过程出错:', error);
    uni.showToast({
      title: '注册失败，请稍后重试',
      icon: 'none'
    });
  }
};

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 跳转到登录页
const goLogin = () => {
  uni.navigateBack();
};
</script>

<style lang="scss">
/* 为H5环境添加页面容器 */
.page-wrapper {
  /* 移动端适配 - 在浏览器中模拟小程序的宽度 */
  max-width: 750rpx;
  margin: 0 auto;
  height: 100vh;
  background: #f5f5f5;
  overflow: hidden;
  position: relative;
}

.register-container {
  width: 100%;
  height: 100vh;
  background: linear-gradient(to bottom, #00BFA6, #00BFA6);
  display: flex;
  flex-direction: column;
  padding: 40rpx;
  box-sizing: border-box;
  position: relative;
}

/* 导航栏样式 */
.nav-bar {
  height: 88rpx;
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.back-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  
  .icon {
    color: #fff;
    font-size: 36rpx;
    /* 使用普通的文本符号"<"作为返回图标 */
    font-weight: bold;
  }
}

.register-card {
  flex: 1;
  background-color: #FFFFFF;
  border-radius: 20rpx;
  padding: 60rpx 40rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
  margin-top: 20rpx;
}

.register-header {
  margin-bottom: 60rpx;
}

.register-title {
  font-size: 40rpx;
  font-weight: 600;
  color: #333;
  display: block;
  text-align: center;
}

.input-group {
  margin-bottom: 40rpx;
  position: relative;
}

.input-label {
  color: #666;
  font-size: 28rpx;
  margin-bottom: 15rpx;
  display: block;
}

.input-box {
  width: 100%;
  height: 90rpx;
  border: 2rpx solid #E0E0E0;
  border-radius: 10rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: #333;
  background-color: #FAFAFA;
  box-sizing: border-box;
}

.error-tip {
  color: #ff4d4f;
  font-size: 24rpx;
  margin-top: 10rpx;
  display: block;
}

.btn-register {
  height: 90rpx;
  background: #00BFA6;
  color: #FFFFFF;
  border-radius: 10rpx;
  font-size: 32rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 50rpx;
}

.login-link {
  margin-top: 40rpx;
  text-align: center;
  font-size: 28rpx;
  color: #666;
  
  .link {
    color: #00BFA6;
    margin-left: 10rpx;
  }
}

/* H5环境适配 */
/* #ifdef H5 */
.register-container {
  padding-top: 84rpx;
}
/* #endif */
</style> 