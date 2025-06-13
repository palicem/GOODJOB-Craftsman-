<template>
  <view class="user-info-container">
    <!-- 头部标题栏 -->
    <view class="header">
      <view class="back-btn" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <view class="header-title">
        <text class="title-text">个人资料</text>
      </view>
      <view class="placeholder"></view>
    </view>
    
    <!-- 个人资料列表 -->
    <view class="user-info-list">
      <view class="user-info-item" @click="editAvatar">
        <text class="item-title">头像</text>
        <view class="avatar-wrapper">
          <image class="avatar-image" :src="userInfo.avatar || '/static/logo.png'" mode="aspectFill"></image>
          <text class="item-arrow">›</text>
        </view>
      </view>
      
      <view class="user-info-item" @click="editField('昵称', userInfo.nickname)">
        <text class="item-title">昵称</text>
        <view class="item-right">
          <text class="item-value">{{userInfo.nickname || '未设置'}}</text>
          <text class="item-arrow">›</text>
        </view>
      </view>
      
      <view class="user-info-item">
        <text class="item-title">账户名</text>
        <view class="item-right">
          <text class="item-value">{{userInfo.account_name || userInfo.username || '未设置'}}</text>
        </view>
      </view>
      
      <view class="user-info-item" @click="editField('真实姓名', userInfo.real_name)">
        <text class="item-title">真实姓名</text>
        <view class="item-right">
          <text class="item-value">{{userInfo.real_name || '未设置'}}</text>
          <text class="item-arrow">›</text>
        </view>
      </view>
      
      <view class="user-info-item" @click="editField('个性签名', userInfo.bio)">
        <text class="item-title">个性签名</text>
        <view class="item-right">
          <text class="item-value">{{userInfo.bio || '未设置'}}</text>
          <text class="item-arrow">›</text>
        </view>
      </view>
      
      <view class="user-info-item" @click="chooseBirthday">
        <text class="item-title">生日</text>
        <view class="item-right">
          <text class="item-value">{{userInfo.birthday || '未设置'}}</text>
          <text class="item-arrow">›</text>
        </view>
      </view>
      
      <view class="user-info-item" @click="chooseGender">
        <text class="item-title">性别</text>
        <view class="item-right">
          <text class="item-value">{{formatGender(userInfo.gender)}}</text>
          <text class="item-arrow">›</text>
        </view>
      </view>
      
      <view class="user-info-item" @click="editField('手机号码', userInfo.phone)">
        <text class="item-title">手机号码</text>
        <view class="item-right">
          <text class="item-value">{{formatPhone(userInfo.phone) || '未绑定'}}</text>
          <text class="item-arrow">›</text>
        </view>
      </view>
      
      <view class="user-info-item" @click="editField('邮箱', userInfo.email)">
        <text class="item-title">邮箱</text>
        <view class="item-right">
          <text class="item-value">{{userInfo.email || '未绑定'}}</text>
          <text class="item-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 生日选择器 -->
    <view v-if="showBirthdayPicker" class="picker-mask" @click="showBirthdayPicker = false">
      <view class="picker-container" @click.stop>
        <view class="picker-header">
          <text class="picker-cancel" @click="showBirthdayPicker = false">取消</text>
          <text class="picker-title">选择生日</text>
          <text class="picker-confirm" @click="confirmBirthday">确定</text>
        </view>
        <picker-view
          class="date-picker"
          :value="dateArray"
          @change="onDateChange"
          :indicator-style="'height: 80rpx;'"
          :mask-style="'background-image: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.6));'"
        >
          <picker-view-column>
            <view class="picker-item" v-for="(year, index) in years" :key="'year'+index">{{year}}年</view>
          </picker-view-column>
          <picker-view-column>
            <view class="picker-item" v-for="(month, index) in months" :key="'month'+index">{{month}}月</view>
          </picker-view-column>
          <picker-view-column>
            <view class="picker-item" v-for="(day, index) in days" :key="'day'+index">{{day}}日</view>
          </picker-view-column>
        </picker-view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { getUserProfile, updateUserProfile, formatPhone, formatGender, updateUserAvatar } from '../../utils/profileService';
import { createTestOrders } from '../../utils/orderService';
import { useUserStore } from '@/stores/user';

// 用户信息
const userInfo = ref({});
const userStore = useUserStore();

// 日期选择器显示状态
const showBirthdayPicker = ref(false);

// 日期数据
const years = ref([]);
const months = ref([]);
const days = ref([]);
const dateArray = ref([0, 0, 0]);

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 编辑头像
const editAvatar = () => {
  uni.showActionSheet({
    itemList: ['拍照', '从相册选择'],
    success: (res) => {
      if (res.tapIndex === 0) {
        // 拍照
        chooseImage('camera');
      } else if (res.tapIndex === 1) {
        // 从相册选择
        chooseImage('album');
      }
    }
  });
};

// 选择图片
const chooseImage = (sourceType) => {
  uni.chooseImage({
    count: 1,
    sourceType: [sourceType],
    success: async (res) => {
      try {
        // 使用新的updateUserAvatar方法
        const result = await updateUserAvatar(res.tempFilePaths[0]);
        if (result) {
          uni.showToast({
            title: '头像更新成功',
            icon: 'success'
          });
        } else {
          throw new Error('更新失败');
        }
      } catch (e) {
        uni.showToast({
          title: '头像更新失败',
          icon: 'error'
        });
      }
    }
  });
};

// 编辑字段
const editField = (title, currentValue) => {
  let fieldKey = ''; // 用于传递给 edit-field, 帮助其知道原始字段名
  switch (title) {
    case '昵称': fieldKey = 'nickname'; break;
    case '真实姓名': fieldKey = 'real_name'; break;
    case '个性签名': fieldKey = 'bio'; break;
    case '手机号码': fieldKey = 'phone'; break;
    case '邮箱': fieldKey = 'email'; break;
  }
  uni.navigateTo({
    url: `/pages/user/edit-field?title=${encodeURIComponent(title)}&value=${encodeURIComponent(currentValue || '')}&fieldKey=${fieldKey}`
  });
};

// 初始化日期数据
const initDatePicker = () => {
  // 生成年份列表（1950-2023）
  const currentYear = new Date().getFullYear();
  years.value = Array.from({length: currentYear - 1949}, (_, i) => i + 1950);
  
  // 生成月份列表（1-12）
  months.value = Array.from({length: 12}, (_, i) => i + 1);
  
  // 如果已有选择的日期，使用已选择的日期；否则使用2000年1月1日
  let year, month, day;
  if (userInfo.value.birthday) {
    [year, month, day] = userInfo.value.birthday.split('-').map(Number);
  } else {
    year = 2000;
    month = 1;
    day = 1;
    userInfo.value.birthday = '2000-01-01';
  }

  // 生成天数列表
  updateDays(year, month);
  
  // 设置日期数组的索引
  dateArray.value = [
    years.value.findIndex(y => y === year),
    months.value.findIndex(m => m === month),
    days.value.findIndex(d => d === day)
  ];
};

// 更新天数
const updateDays = (year, month) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  days.value = Array.from({length: daysInMonth}, (_, i) => i + 1);
  
  // 如果当前选择的日期超出了该月的最大天数，调整为最后一天
  if (dateArray.value[2] >= days.value.length) {
    dateArray.value[2] = days.value.length - 1;
  }
};

// 日期选择变化
const onDateChange = (e) => {
  const values = e.detail.value;
  dateArray.value = values;
  
  // 更新天数列表
  updateDays(years.value[values[0]], months.value[values[1]]);
};

// 核心：更新用户资料的通用函数
const processProfileUpdate = async (updatePayload, successMessage, failureMessage) => {
  try {
    console.log('[user-info.vue] Attempting to update profile with payload:', JSON.stringify(updatePayload));
    const success = await updateUserProfile(updatePayload); // API接受部分更新

    if (success) {
      uni.showToast({ title: successMessage || '更新成功', icon: 'success' });

      // 关键：更新成功后，获取最新的完整用户信息
      const updatedFullProfileResult = await getUserProfile();
      if (updatedFullProfileResult && updatedFullProfileResult.success && updatedFullProfileResult.data) {
        const fullProfileData = updatedFullProfileResult.data;
        userInfo.value = { ...fullProfileData }; // 更新本地的userInfo
        userStore.setUserInfo(fullProfileData);   // 更新Store
        
        // 发出 userInfoUpdated 事件，携带完整的、包含 id/_id 的用户对象
        uni.$emit('userInfoUpdated', { ...fullProfileData }); 
        console.log('[user-info.vue] Emitted userInfoUpdated with full profile:', JSON.stringify(fullProfileData));
      } else {
        console.error('[user-info.vue] Failed to fetch updated full profile after update. Emitting locally merged data.');
        // 回退：如果获取最新数据失败，尝试合并本地数据和payload后发出
        const locallyMergedProfile = { ...userStore.userInfo, ...updatePayload };
        if(locallyMergedProfile._id || locallyMergedProfile.id){ // 确保有ID
             uni.$emit('userInfoUpdated', locallyMergedProfile );
        } else {
            console.error('[user-info.vue] Cannot emit userInfoUpdated, merged data lacks ID.');
        }
      }
    } else {
      uni.showToast({ title: failureMessage || '更新失败', icon: 'none' });
      console.error('[user-info.vue] updateUserProfile API call returned false or error.');
    }
  } catch (error) {
    console.error('[user-info.vue] Error in processProfileUpdate:', error);
    uni.showToast({ title: '更新发生错误', icon: 'none' });
  }
};

// 处理来自 edit-field.vue 的事件
const handleFieldEdited = async (data) => {
  console.log('[user-info.vue] Received fieldEdited event with data:', data);
  if (data && data.fieldKey && typeof data.value !== 'undefined') {
    // data.fieldKey 应该是后端期望的字段名，如 'nickname', 'real_name'
    const updatePayload = { [data.fieldKey]: data.value };
    await processProfileUpdate(updatePayload, `${data.title || '信息'}已更新`, `${data.title || '信息'}更新失败`);
  } else {
    console.warn('[user-info.vue] Invalid data from fieldEdited event:', data);
  }
};

// 确认生日选择
const confirmBirthday = async () => {
  const selectedYear = years.value[dateArray.value[0]];
  const selectedMonth = months.value[dateArray.value[1]].toString().padStart(2, '0');
  const selectedDay = days.value[dateArray.value[2]].toString().padStart(2, '0');
  
  const newBirthday = `${selectedYear}-${selectedMonth}-${selectedDay}`;
  showBirthdayPicker.value = false; // 先关闭选择器
  await processProfileUpdate({ birthday: newBirthday }, '生日已更新', '生日更新失败');
};

// 选择生日
const chooseBirthday = () => {
  initDatePicker(); // 初始化日期数据
  showBirthdayPicker.value = true;
};

// 选择性别
const chooseGender = async () => {
  uni.showActionSheet({
    itemList: ['男', '女', '保密'],
    success: async (res) => {
      let genderValue = 0; // 0:保密, 1:男, 2:女 (与数据库一致)
      if (res.tapIndex === 0) genderValue = 1; 
      if (res.tapIndex === 1) genderValue = 2;
      
      await processProfileUpdate({ gender: genderValue }, '性别已更新', '性别更新失败');
    }
  });
};

// 页面加载时获取用户信息
onMounted(async () => {
  console.log('[user-info.vue] Attempting to load user profile.');
  userStore.loadInitialState();

  let profileToUse = null;

  if (userStore.userInfo && (userStore.userInfo.id || userStore.userInfo._id)) {
    console.log('[user-info.vue] Loaded userInfo from userStore:', JSON.stringify(userStore.userInfo));
    profileToUse = { ...userStore.userInfo };
  } else {
    console.log('[user-info.vue] No valid userInfo in store, calling profileService.getUserProfile().');
    try {
      const profileResult = await getUserProfile();
      console.log('[user-info.vue] profileService.getUserProfile() result:', JSON.stringify(profileResult));
      if (profileResult && profileResult.success && profileResult.data && (profileResult.data.id || profileResult.data._id) ) {
        profileToUse = { ...profileResult.data };
        userStore.setUserInfo(profileResult.data);
        console.log('[user-info.vue] Loaded userInfo from profileService and updated store.');
      } else {
        console.warn('[user-info.vue] getUserProfile did not return successful or valid data.');
      }
    } catch (error) {
      console.error('[user-info.vue] Error fetching user profile via profileService:', error);
    }
  }

  if (profileToUse) {
    // 确保前端数据与后端字段名一致
    const mappedProfile = {
        ...profileToUse,
        real_name: profileToUse.real_name // 假设前端模板使用 real_name
    };
    userInfo.value = mappedProfile;

    if (!userInfo.value.username && userInfo.value.account_name) {
        userInfo.value.username = userInfo.value.account_name;
    }
    // accountName (驼峰) 和 account_name (下划线) 的处理
    if (!userInfo.value.accountName && userInfo.value.account_name) { // 确保 accountName 存在
        userInfo.value.accountName = userInfo.value.account_name;
    } else if (!userInfo.value.account_name && userInfo.value.accountName) { // 反向同步
        userInfo.value.account_name = userInfo.value.accountName;
    }

    console.log('[user-info.vue] Final userInfo.value set to:', JSON.stringify(userInfo.value));
  } else {
    console.warn('[user-info.vue] Failed to load user profile from all sources. userInfo.value remains empty or initial.');
    // 如果加载失败，可以给 userInfo.value 一个基础结构，避免模板渲染错误
    userInfo.value = { avatar: '', nickname: '', account_name: '', real_name: '', bio: '', birthday: '', gender: 0, phone: '', email: '' };
  }
  
  initDatePicker(); // 初始化日期选择器
  
  uni.$on('fieldEdited', handleFieldEdited); // 监听来自 edit-field.vue 的事件
});

// 页面卸载时移除事件监听
onBeforeUnmount(() => {
  uni.$off('fieldEdited', handleFieldEdited);
});
</script>

<style lang="scss">
.user-info-container {
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

.user-info-list {
  margin-top: 20rpx;
  background-color: #ffffff;
}

.user-info-item {
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

.avatar-wrapper {
  display: flex;
  align-items: center;
}

.avatar-image {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  margin-right: 10rpx;
}

.item-right {
  display: flex;
  align-items: center;
}

.item-value {
  font-size: 26rpx;
  color: #999;
  margin-right: 10rpx;
  max-width: 400rpx;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-arrow {
  font-size: 32rpx;
  color: #999;
}

.picker-placeholder {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

/* 日期选择器样式 */
.picker-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 999;
  display: flex;
  align-items: flex-end;
}

.picker-container {
  width: 100%;
  background-color: #fff;
  border-radius: 24rpx 24rpx 0 0;
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
  padding-bottom: env(safe-area-inset-bottom);
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #eee;
}

.picker-title {
  font-size: 32rpx;
  color: #333;
  font-weight: 500;
}

.picker-cancel, .picker-confirm {
  font-size: 28rpx;
  padding: 10rpx 20rpx;
}

.picker-cancel {
  color: #666;
}

.picker-confirm {
  color: #00A4E4;
}

.date-input-wrapper {
  padding: 30rpx;
  display: flex;
  justify-content: center;
  align-items: center;
}

.date-input {
  width: 80%;
  height: 80rpx;
  font-size: 32rpx;
  text-align: center;
  border: 2rpx solid #eee;
  border-radius: 8rpx;
  background-color: #f8f8f8;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.date-picker {
  width: 100%;
  height: 480rpx;
}

.picker-item {
  line-height: 80rpx;
  text-align: center;
  font-size: 32rpx;
  color: #333;
}
</style> 