<template>
  <view class="page-wrapper">
    <view class="login-container">
      <!-- 登录卡片 -->
      <view class="login-card">
        <view class="login-header">
          <text class="login-title">欢迎登录</text>
        </view>
        
        <view class="input-group">
          <text class="input-label">账号</text>
          <view class="username-input-wrapper">
            <input 
              class="input-box" 
              type="text" 
              placeholder="请输入您的账号" 
              v-model="formData.username"
            />
            <view class="dropdown-icon" @click="toggleUserList">
              <text>▼</text>
            </view>
          </view>
          
          <!-- 用户名下拉列表 -->
          <view class="username-dropdown" v-if="showUserList">
            <view 
              class="username-item" 
              v-for="(username, index) in recentUsers" 
              :key="index" 
              @click="selectUsername(username)"
            >
              {{username}}
            </view>
          </view>
        </view>
        
        <view class="input-group">
          <text class="input-label">密码</text>
          <input 
            class="input-box" 
            type="password" 
            placeholder="请输入您的密码" 
            v-model="formData.password"
            password
          />
        </view>
        
        <!-- 自动登录选项 -->
        <view class="auto-login">
          <view class="checkbox" @click="toggleAutoLogin">
            <view class="checkbox-inner" :class="{'checked': formData.autoLogin}"></view>
          </view>
          <text class="auto-login-text">自动登录</text>
        </view>
        
        <view class="btn-group">
          <button class="btn-login" @click="handleLogin">登录</button>
          <view class="btn-register" @click="goRegister">注册</view>
        </view>
        
        <view class="forgot-pwd">
          <text @click="forgotPassword">忘记密码?</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref, onMounted, onBeforeUnmount } from 'vue';
import userService from '../../utils/userService';
import { updateUserProfile } from '../../utils/profileService';

// 表单数据
const formData = reactive({
  username: '',
  password: '',
  autoLogin: false
});

// 控制用户列表显示
const showUserList = ref(false);
const recentUsers = ref([]);

// 处理页面加载
onMounted(() => {
  try {
    console.log('登录页面加载');
    
    // 获取用户列表
    recentUsers.value = userService.getRecentUsers();
    console.log('最近登录用户列表:', recentUsers.value);
    
    // 获取登录状态 - 通过 getCurrentUser 和 isLoggedIn 判断
    const currentUser = userService.getCurrentUser();
    const isLoggedIn = userService.isLoggedIn();
    // autoLogin 的逻辑需要重新审视，因为它之前依赖的 getLoginState 不再存在
    // uni.getStorageSync('autoLogin') 可以用来判断之前是否勾选了自动登录
    const autoLoginPreviously = uni.getStorageSync('autoLogin') === true;

    console.log('当前登录用户:', currentUser);
    console.log('是否已登录:', isLoggedIn);
    console.log('之前是否设置自动登录:', autoLoginPreviously);
    
    // 检查是否有注册数据
    const registerData = userService.getRegisterTempData();
    if (registerData) {
      console.log('获取到注册数据:', registerData);
      formData.username = registerData.username || '';
      formData.password = registerData.password || '';
      // 使用后清除
      userService.clearRegisterTempData();
    } 
    // 如果没有注册数据，则检查是否有自动登录信息
    // 注意：这里的自动登录逻辑需要调整，因为密码不应该直接存储在前端用于自动填充
    // 更好的做法是，如果token有效，直接尝试获取用户信息并跳转
    else if (currentUser && autoLoginPreviously && isLoggedIn) { 
      // 如果用户已登录且之前选择了自动登录，可以考虑直接跳转或填充用户名
      // 实际的自动登录应该是通过有效token直接进入主页，而不是填充密码框
      formData.username = currentUser.username || currentUser.accountName || '';
      // formData.password = currentUser.password; // 不再填充密码
      formData.autoLogin = true; // 保持勾选状态
      // 此处可以考虑直接尝试跳转到主页，如果token有效的话
      // if (isLoggedIn) { /* reLaunch to main */ }
    } 
    // 如果有当前用户但没有设置自动登录，只填入用户名
    else if (currentUser) {
      formData.username = currentUser.username || currentUser.accountName || '';
    }
  } catch (error) {
    console.error('登录页面加载失败:', error);
  }
});

// 登录方法
const handleLogin = async () => {
  try {
    console.log('点击登录按钮');
    if (!formData.username || !formData.password) {
      uni.showToast({
        title: '请填写完整的账号和密码',
        icon: 'none'
      });
      return;
    }
    uni.showLoading({
      title: '登录中...',
      mask: true
    });

    // ---- TEMPORARY DIRECT uni.request CALL FOR DEBUGGING ----
    const BASE_URL = 'http://localhost:3000'; // Define BASE_URL locally for this test
    const loginUrl = '/api/user/login';
    const requestPayload = { 
      username: formData.username.trim(), 
      password: formData.password.trim() 
    };

    console.log('[DEBUG] Directly calling uni.request with payload:', requestPayload);

    // Wrap uni.request in a Promise to use with async/await
    const uniRequestPromise = new Promise((resolve, reject) => {
      uni.request({
        url: `${BASE_URL}${loginUrl}`,
        method: 'POST',
        data: requestPayload,
        header: {
          'content-type': 'application/json'
        },
        success: (res) => {
          console.log('[DEBUG] uni.request SUCCESS callback. Raw res:', res);
          const { data: serverResponseData } = res; 
          console.log('[DEBUG] uni.request SUCCESS. Server response data:', serverResponseData);
          if (serverResponseData && serverResponseData.token && serverResponseData.data && serverResponseData.data.id) {
            console.log('[DEBUG] uni.request SUCCESS: Token and user data in .data found. Resolving promise with serverResponseData.');
            resolve(serverResponseData); 
          } else {
            console.warn('[DEBUG] uni.request SUCCESS: Token and/or user data in .data missing or server indicated failure. Rejecting promise.', serverResponseData);
            reject(serverResponseData || { message: '服务器响应格式错误或关键数据缺失' });
          }
        },
        fail: (err) => {
          console.error('[DEBUG] uni.request FAIL callback. Raw err:', err);
          reject(err); // Reject with the error from uni.request
        }
      });
    });

    const directResult = await uniRequestPromise; // Await the wrapped uni.request
    console.log('[DEBUG] After await uniRequestPromise. directResult:', directResult);
    // ---- END TEMPORARY uni.request CALL ----

    // const result = await userService.login(formData.username.trim(), formData.password.trim()); // Original call
    // console.log('登录结果:', result); // Original log

    uni.hideLoading();
    console.log('[DEBUG] LogPoint A: After first uni.hideLoading()');

    // 修改条件以匹配新的响应结构: directResult.data 包含用户对象, directResult.token 包含令牌
    if (directResult && directResult.token && directResult.data && directResult.data.id) { 
      console.log('[DEBUG] LogPoint B: Entered success branch. User data from directResult.data:', directResult.data);
      
      uni.setStorageSync('token', directResult.token);
      
      // 添加详细日志来调试 userInfo 的存储
      console.log('[DEBUG login.vue] User info object to be stored:', directResult.data);
      uni.setStorageSync('userInfo', JSON.stringify(directResult.data));
      const storedInfoString = uni.getStorageSync('userInfo');
      console.log('[DEBUG login.vue] User info string actually stored in localStorage:', storedInfoString);
      try {
        const parsedStoredInfo = JSON.parse(storedInfoString);
        console.log('[DEBUG login.vue] Parsed stored info for verification:', parsedStoredInfo);
        if (parsedStoredInfo && parsedStoredInfo._id) {
            console.log('[DEBUG login.vue] Stored userInfo (after parsing) contains _ID:', parsedStoredInfo._id);
        } else {
            console.warn('[DEBUG login.vue] Stored userInfo (after parsing) is missing or has no _ID.');
        }
      } catch (e) {
        console.error('[DEBUG login.vue] Error parsing storedInfoString for verification:', e);
      }
      console.log('[DEBUG login.vue] Token and stringified userInfo stored from directResult (userInfo from .data)');

      console.log('[DEBUG] LogPoint C: Before autoLogin storage logic. formData.autoLogin:', formData.autoLogin);
      if(formData.autoLogin){
        uni.setStorageSync('autoLogin', true);
        console.log('[DEBUG] LogPoint D: autoLogin set to true in storage');
      } else {
        uni.removeStorageSync('autoLogin');
        console.log('[DEBUG] LogPoint E: autoLogin removed from storage');
      }
      console.log('[DEBUG] LogPoint F: After autoLogin storage logic.');

      try {
        console.log('[DEBUG] LogPoint G: Before calling updateUserProfile. User data being passed:', directResult.data);
        // 传递 directResult.data 作为用户数据
        const profileSyncSuccess = await updateUserProfile(directResult.data);
        if (profileSyncSuccess) {
          console.log('[DEBUG] LogPoint H: User profile updated/synced successfully.');
        } else {
          console.warn('[DEBUG] LogPoint I: updateUserProfile returned false (sync failed or API issue).');
        }
      } catch (profileError) {
        console.warn('[DEBUG] LogPoint J: Caught error during updateUserProfile call:', profileError);
      }
      console.log('[DEBUG] LogPoint K: After updateUserProfile try-catch block.');

      uni.showToast({
        title: '登录成功 (direct)',
        icon: 'success',
        duration: 1500
      });
      console.log('[DEBUG] LogPoint L: After showing success toast.');
      setTimeout(() => {
        console.log('[DEBUG] LogPoint M: Inside setTimeout, preparing to reLaunch.');
        uni.reLaunch({
          url: '../main/main',
          fail: (err) => {
            console.error('[DEBUG] LogPoint N: reLaunch failed.', err);
            let errorMsg = '页面跳转失败';
            if (err && err.errMsg) {
              errorMsg += ': ' + err.errMsg;
            }
            uni.showToast({ title: errorMsg, icon: 'none', duration: 3000 });
          },
          success: () => { console.log('页面跳转成功 (direct)'); }
        });
      }, 1500);
    } else {
      uni.hideLoading(); // Ensure loading is hidden on failure path too
      uni.showToast({
        title: (directResult && directResult.message) || '登录失败 (direct)',
        icon: 'none'
      });
    }
  } catch (error) {
    console.log('[DEBUG] LogPoint Z: Entered OUTER CATCH block.');
    console.error('登录过程出错 (raw error object):', error);
    console.error('Is error an instance of Error?', error instanceof Error);
    if (error && typeof error === 'object') {
      console.error('Error properties:', Object.keys(error).join(', '));
      if (error.message && error.stack) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      } else if (error.message) {
        console.error('Error (or object) has a message property:', error.message);
      } else {
        console.error('Error (or object) does not seem to be a standard Error instance and has no message property.');
      }
    }
    // uni.hideLoading(); // Already called or will be called in the else block if directResult is bad
    // If we land here from an await on uniRequestPromise throwing, hideLoading might not have been called after showLoading.
    // Add a safeguard hideLoading if not already hidden.
    // However, the primary hideLoading is after the await. If await itself throws, it won't be reached.
    // The original code had uni.hideLoading() after the await, and also in the catch and the else.
    // For this direct test, if await uniRequestPromise throws, we land in catch. uni.hideLoading() should be there.
    // If uniRequestPromise resolves but directResult is bad, we go to else where hideLoading is called.
    // If uniRequestPromise resolves and directResult is good, hideLoading is called after await.
    // So, the catch block *definitely* needs a hideLoading.
    uni.hideLoading();
    uni.showToast({
      title: '登录失败，请重试 (direct catch)',
      icon: 'none'
    });
  }
};

// 跳转到注册页面
const goRegister = () => {
  uni.navigateTo({
    url: '../register/register'
  });
};

// 忘记密码
const forgotPassword = () => {
  uni.showToast({
    title: '忘记密码功能开发中',
    icon: 'none'
  });
};

// 切换自动登录
const toggleAutoLogin = () => {
  formData.autoLogin = !formData.autoLogin;
};

// 切换用户列表显示
const toggleUserList = () => {
  showUserList.value = !showUserList.value;
};

// 选择用户名
const selectUsername = (username) => {
  formData.username = username;
  showUserList.value = false;
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
  
  /* 对于H5环境 */
  /* #ifdef H5 */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 44px; /* 模拟导航栏高度 */
    background-color: #00BFA6;
    z-index: 1;
  }
  /* #endif */
}

.login-container {
  width: 100%;
  height: 100vh;
  background: linear-gradient(to bottom, #00BFA6, #00BFA6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 40rpx;
  box-sizing: border-box;
  
  /* 对于H5环境 */
  /* #ifdef H5 */
  padding-top: 44px;
  /* #endif */
}

.login-card {
  width: 100%;
  background-color: #FFFFFF;
  border-radius: 20rpx;
  padding: 60rpx 40rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
}

.login-header {
  margin-bottom: 60rpx;
}

.login-title {
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

.username-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.dropdown-icon {
  position: absolute;
  right: 20rpx;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 24rpx;
  z-index: 2;
}

.username-dropdown {
  position: absolute;
  width: 100%;
  top: 110rpx;
  left: 0;
  background-color: #fff;
  border: 1px solid #eee;
  border-radius: 10rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
  z-index: 10;
  max-height: 300rpx;
  overflow-y: auto;
}

.username-item {
  padding: 20rpx;
  border-bottom: 1px solid #f5f5f5;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:active {
    background-color: #f9f9f9;
  }
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

/* 自动登录样式 */
.auto-login {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
}

.checkbox {
  width: 36rpx;
  height: 36rpx;
  border: 2rpx solid #E0E0E0;
  border-radius: 6rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15rpx;
  cursor: pointer;
}

.checkbox-inner {
  width: 24rpx;
  height: 24rpx;
  border-radius: 4rpx;
  background-color: transparent;
  
  &.checked {
    background-color: #00BFA6;
  }
}

.auto-login-text {
  font-size: 26rpx;
  color: #666;
}

.btn-group {
  display: flex;
  justify-content: space-between;
  margin-top: 30rpx;
}

.btn-login {
  flex: 2;
  height: 90rpx;
  background: #00BFA6;
  color: #FFFFFF;
  border-radius: 10rpx;
  font-size: 32rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  border: none;
}

.btn-register {
  flex: 1;
  height: 90rpx;
  background: #FFFFFF;
  color: #00BFA6;
  border: 2rpx solid #00BFA6;
  border-radius: 10rpx;
  font-size: 32rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.forgot-pwd {
  margin-top: 40rpx;
  text-align: center;
  
  text {
    font-size: 26rpx;
    color: #00BFA6;
  }
}
</style> 