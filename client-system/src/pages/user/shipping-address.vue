<template>
  <view class="address-container">
    <!-- 头部标题栏 -->
    <view class="header">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <view class="header-title">
        <text class="title-text">我的收货地址</text>
      </view>
      <view class="placeholder"></view>
    </view>
    
    <!-- 地址列表 -->
    <view class="address-list" v-if="addressList.length > 0">
      <view 
        class="address-item" 
        v-for="(address, index) in addressList" 
        :key="index"
        :class="{'slide-open': slideIndex === index}"
        @touchstart="touchStart(index, $event)"
        @touchmove="touchMove($event)"
        @touchend="touchEnd"
      >
        <view class="address-content" @tap="selectAddress(index)">
          <view class="address-info">
            <view class="contact-info">
              <text class="contact-name">{{address.name}}</text>
              <text class="contact-phone">{{formatPhone(address.phone)}}</text>
              <view class="default-tag" v-if="address.isDefault">默认</view>
            </view>
            <view class="address-detail">
              {{address.province}} {{address.city}} {{address.district}} {{address.address}}
            </view>
            <view class="address-tag" v-if="address.tag">
              <text class="tag-text">{{address.tag}}</text>
            </view>
          </view>
          
          <view class="address-actions">
            <view class="action-item" @tap.stop="setDefault(index)" v-if="!address.isDefault">
              <text class="action-icon">☆</text>
              <text class="action-text">设为默认</text>
            </view>
            <view class="action-item" @tap.stop="editAddress(index)">
              <text class="action-icon">✎</text>
              <text class="action-text">编辑</text>
            </view>
          </view>
        </view>
        
        <!-- 滑动后显示的删除按钮 -->
        <view class="delete-button" @tap.stop="deleteAddress(index)">
          <text class="delete-icon">🗑️</text>
          <text>删除</text>
        </view>
      </view>
    </view>
    
    <!-- 空地址提示 -->
    <view class="empty-address" v-else>
      <image src="/static/logo.png" class="empty-image" mode="aspectFit"></image>
      <text class="empty-text">还没有添加收货地址哦</text>
      <view class="add-tip">点击下方按钮添加收货地址</view>
    </view>
    
    <!-- 底部添加按钮 -->
    <view class="add-address-btn" @tap="addNewAddress">
      <text class="add-text">添加新地址</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { getAddressList, deleteAddress as deleteAddressService, 
  setDefaultAddress as setDefaultAddressService, formatPhone } from '../../utils/profileService';

// 地址列表
const addressList = ref([]);

// 滑动相关变量
const slideIndex = ref(-1);
const startX = ref(0);
const moveX = ref(0);
const currentIndex = ref(-1);

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 添加新地址
const addNewAddress = () => {
  uni.navigateTo({
    url: '/pages/user/address-edit?mode=add'
  });
};

// 编辑地址
const editAddress = (index) => {
  const address = addressList.value[index];
  console.log('要编辑的地址:', address);
  if (address && address.id) {
    uni.navigateTo({
      url: `/pages/user/address-edit?mode=edit&id=${address.id}`
    });
  } else {
    uni.showToast({
      title: '地址信息错误',
      icon: 'none'
    });
  }
};

// 删除地址
const deleteAddress = (index) => {
  uni.showModal({
    title: '提示',
    content: '确定要删除这个地址吗？',
    success: async (res) => {
      if (res.confirm) {
        const address = addressList.value[index];
        try {
          const success = await deleteAddressService(address.id);
          if (success) {
            addressList.value.splice(index, 1);
            slideIndex.value = -1;
            uni.showToast({
              title: '删除成功',
              icon: 'success'
            });
          } else {
            throw new Error('删除失败');
          }
        } catch (error) {
          uni.showToast({
            title: '删除失败，请重试',
            icon: 'none'
          });
        }
      }
    }
  });
};

// 设置默认地址
const setDefault = async (index) => {
  const address = addressList.value[index];
  try {
    const success = await setDefaultAddressService(address);
    if (success) {
      addressList.value.forEach(item => {
        item.isDefault = item.id === address.id;
      });
      uni.showToast({
        title: '设置成功',
        icon: 'success'
      });
    }
  } catch (error) {
    uni.showToast({
      title: '设置失败',
      icon: 'none'
    });
  }
};

// 选择地址
const selectAddress = (index) => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const from = currentPage.options?.from;
  
  if (from === 'trade' || from === 'order') {
    const selectedAddress = addressList.value[index];
    uni.$emit('addressSelected', selectedAddress);
    uni.navigateBack();
  }
};

// 触摸开始
const touchStart = (index, event) => {
  if (slideIndex.value !== -1 && slideIndex.value !== index) {
    slideIndex.value = -1;
  }
  startX.value = event.touches[0].clientX;
  currentIndex.value = index;
};

// 触摸移动
const touchMove = (event) => {
  moveX.value = event.touches[0].clientX;
};

// 触摸结束
const touchEnd = () => {
  const distance = startX.value - moveX.value;
  if (distance > 50) {
    slideIndex.value = currentIndex.value;
  } else if (distance < -50) {
    slideIndex.value = -1;
  }
};

// 加载地址列表
const loadAddressList = async () => {
  try {
    const list = await getAddressList();
    addressList.value = list;
  } catch (error) {
    console.error('加载地址列表失败:', error);
    addressList.value = [];
  }
};

// 页面加载时初始化
onMounted(async () => {
  await loadAddressList();
  
  uni.$on('addressUpdated', async () => {
    await loadAddressList();
  });
});

// 页面卸载时移除事件监听
onBeforeUnmount(() => {
  uni.$off('addressUpdated');
});
</script>

<style lang="scss">
.address-container {
  min-height: 100vh;
  background-color: #f8f8f8;
  position: relative;
  padding-bottom: 150rpx; /* 为底部按钮留出空间 */
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

.address-list {
  padding: 20rpx;
}

.address-item {
  position: relative;
  width: 100%;
  overflow: hidden;
  margin-bottom: 20rpx;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
  
  &.slide-open {
    transform: translateX(-150rpx);
  }
}

.address-content {
  background-color: #ffffff;
  padding: 30rpx;
  width: 100%;
}

.address-info {
  flex: 1;
}

.contact-info {
  display: flex;
  align-items: center;
  margin-bottom: 15rpx;
}

.contact-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-right: 20rpx;
}

.contact-phone {
  font-size: 28rpx;
  color: #666;
}

.default-tag {
  margin-left: 20rpx;
  background-color: #00BFA6;
  color: #fff;
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
}

.address-detail {
  font-size: 28rpx;
  color: #333;
  line-height: 1.4;
  margin-bottom: 10rpx;
}

.address-tag {
  margin-top: 10rpx;
}

.tag-text {
  display: inline-block;
  font-size: 22rpx;
  color: #666;
  padding: 2rpx 12rpx;
  background-color: #f5f5f5;
  border-radius: 4rpx;
}

.address-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.action-item {
  display: flex;
  align-items: center;
  margin-left: 30rpx;
}

.action-icon {
  font-size: 28rpx;
  margin-right: 8rpx;
}

.action-text {
  font-size: 26rpx;
  color: #666;
}

.delete-button {
  position: absolute;
  top: 0;
  right: -150rpx;
  width: 150rpx;
  height: 100%;
  background-color: #f56c6c;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
}

.delete-icon {
  font-size: 36rpx;
  margin-bottom: 10rpx;
}

.empty-address {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.empty-image {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 20rpx;
}

.add-tip {
  font-size: 24rpx;
  color: #999;
}

.add-address-btn {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 40rpx;
  height: 90rpx;
  margin: 0 30rpx;
  background-color: #00BFA6;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 45rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 191, 166, 0.3);
  font-size: 30rpx;
}

.add-text {
  font-weight: 500;
}
</style> 