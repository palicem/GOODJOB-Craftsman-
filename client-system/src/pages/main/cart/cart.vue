<template>
  <view class="cart-container">
    <view class="header">
      <text class="title">购物车</text>
      <text class="manage-btn" @click="toggleManageMode">{{ isManageMode ? '完成' : '管理' }}</text>
    </view>
    
    <!-- 空购物车提示 -->
    <view class="empty-cart" v-if="cartList.length === 0">
      <image src="https://img.alicdn.com/imgextra/i3/O1CN01yvjuL71OHwqCS0xWY_!!6000000001677-2-tps-200-200.png" class="empty-image" mode="aspectFit"></image>
      <text class="empty-text">购物车还是空的</text>
      <button class="btn-to-shop">去逛逛</button>
    </view>
    
    <!-- 购物车列表 -->
    <scroll-view v-else class="cart-list" scroll-y="true">
      <!-- 店铺分组 -->
      <view class="shop-group" v-for="(group, shopName) in groupedCartItems" :key="shopName">
        <view class="shop-header">
          <view class="select-shop">
            <view class="checkbox" @click="toggleShopSelection(shopName)">
              <view class="checkbox-inner" :class="{'checked': isShopSelected(shopName)}"></view>
            </view>
            <text class="shop-name">{{shopName}}</text>
          </view>
        </view>
        
        <!-- 商品列表 -->
        <view class="goods-items">
          <view class="goods-item" v-for="(item, index) in group" :key="item.id">
            <view class="checkbox" @click="toggleItemSelection(item.id)">
              <view class="checkbox-inner" :class="{'checked': item.selected}"></view>
            </view>
            
            <image class="goods-image" :src="item.goodsImage || '/static/default-goods.png'" mode="aspectFill"></image>
            
            <view class="goods-info" @tap="goToGoodsDetail(item)">
              <text class="goods-name">{{item.goodsName}}</text>
              <text class="goods-spec">规格：{{item.spec || '默认'}}</text>
              <view class="goods-price-count">
                <text class="goods-price">¥{{item.price.toFixed(2)}}</text>
                
                <view class="count-control">
                  <view class="count-btn" @click.stop="decreaseCount(item)">-</view>
                  <view class="count-value">{{item.count}}</view>
                  <view class="count-btn" @click.stop="increaseCount(item)">+</view>
                </view>
              </view>
            </view>
            
            <!-- 管理模式下显示删除按钮 -->
            <view class="delete-btn" v-if="isManageMode" @click="removeItem(item.id)">
              <text class="delete-icon">×</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 底部占位，防止内容被底部栏遮挡 -->
      <view class="footer-placeholder"></view>
    </scroll-view>
    
    <!-- 底部结算栏 - 简化实现 -->
    <view class="cart-footer" v-if="cartList.length > 0">
      <view class="select-all" @click="toggleSelectAll">
        <view class="checkbox">
          <view class="checkbox-inner" :class="{'checked': isAllSelected}"></view>
        </view>
        <text class="select-all-text">全选</text>
      </view>
      
      <!-- 管理模式：删除所选 -->
      <view class="footer-right" v-if="isManageMode">
        <button class="btn-delete-selected" :disabled="!hasSelectedItems" @click="removeSelectedItems">删除所选</button>
      </view>
      
      <!-- 正常模式：结算 -->
      <view class="footer-right" v-else>
        <view class="price-info">
          <text class="total-label">合计：</text>
          <text class="total-price">¥{{totalPrice.toFixed(2)}}</text>
        </view>
        <button class="btn-checkout" :disabled="!hasSelectedItems" @click="checkout">结算({{selectedCount}})</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { getCartList, saveCartList, removeFromCart, updateCartItemCount, updateCartItemSelection, toggleSelectAll as toggleAllCartItems } from '../../../utils/cartService';

// 购物车数据
const cartList = ref([]);

// 是否处于管理模式
const isManageMode = ref(false);

// 加载购物车数据
const loadCartData = () => {
  console.log('正在加载购物车数据...');
  try {
    const data = getCartList();
    console.log('从storage获取到的购物车数据:', data);
    cartList.value = data || [];
    console.log('购物车数据加载完成,共有商品:', cartList.value.length);
  } catch (err) {
    console.error('加载购物车数据出错:', err);
    cartList.value = [];
  }
};

// 页面加载时也初始化数据
onMounted(() => {
  console.log('购物车页面挂载, 开始加载数据');
  loadCartData();
  
  // 监听购物车更新事件
  uni.$on('update-cart-badge', () => {
    console.log('接收到购物车更新事件，重新加载数据');
    loadCartData();
  });
  
  // 监听页面显示事件
  uni.$on('cart-page-show', () => {
    console.log('接收到购物车页面显示事件，重新加载数据');
    loadCartData();
    
    // 延迟一次再加载，确保数据一定是最新的
    setTimeout(() => {
      console.log('延迟500ms再次加载确保数据最新');
      loadCartData();
    }, 500);
  });
  
  // 注册页面显示事件
  const onShow = () => {
    console.log('购物车tab显示，重新加载数据');
    loadCartData();
  };
  
  // 获取当前页面
  const pages = getCurrentPages();
  const page = pages[pages.length - 1];
  
  // 添加页面显示钩子
  if (page && page.$vm) {
    // 保存原始onShow方法
    const originalOnShow = page.$vm.$options.onShow;
    
    // 重写onShow方法
    page.$vm.$options.onShow = function() {
      if (originalOnShow) {
        originalOnShow.call(this);
      }
      onShow();
    };
  }
});

// 组件销毁时清理事件监听
onUnmounted(() => {
  console.log('购物车页面销毁，清理事件监听');
  uni.$off('cart-page-show');
  uni.$off('update-cart-badge');
});

// 切换管理模式
const toggleManageMode = () => {
  isManageMode.value = !isManageMode.value;
};

// 按店铺分组的购物车商品
const groupedCartItems = computed(() => {
  const groups = {};
  cartList.value.forEach(item => {
    if (!groups[item.shopName]) {
      groups[item.shopName] = [];
    }
    groups[item.shopName].push(item);
  });
  return groups;
});

// 商品选择相关
// 切换单个商品选中状态
const toggleItemSelection = (itemId) => {
  const item = cartList.value.find(i => i.id === itemId);
  if (item) {
    item.selected = !item.selected;
    saveCartList(cartList.value);
  }
};

// 切换店铺所有商品选中状态
const toggleShopSelection = (shopName) => {
  const isSelected = isShopSelected(shopName);
  cartList.value.forEach(item => {
    if (item.shopName === shopName) {
      item.selected = !isSelected;
    }
  });
  saveCartList(cartList.value);
};

// 判断店铺是否全选
const isShopSelected = (shopName) => {
  const shopItems = cartList.value.filter(item => item.shopName === shopName);
  return shopItems.length > 0 && shopItems.every(item => item.selected);
};

// 切换全选/全不选
const toggleSelectAll = () => {
  const newState = !isAllSelected.value;
  cartList.value.forEach(item => {
    item.selected = newState;
  });
  saveCartList(cartList.value);
};

// 判断是否全选
const isAllSelected = computed(() => {
  return cartList.value.length > 0 && cartList.value.every(item => item.selected);
});

// 选中商品数量
const selectedCount = computed(() => {
  return cartList.value.filter(item => item.selected).reduce((total, item) => total + item.count, 0);
});

// 是否有选中商品
const hasSelectedItems = computed(() => {
  return cartList.value.some(item => item.selected);
});

// 总价
const totalPrice = computed(() => {
  return cartList.value
    .filter(item => item.selected)
    .reduce((total, item) => total + (item.price * item.count), 0);
});

// 商品数量操作
// 增加商品数量
const increaseCount = (item) => {
  if (item.count < 99) {
    item.count++;
    saveCartList(cartList.value);
  }
};

// 减少商品数量
const decreaseCount = (item) => {
  if (item.count > 1) {
    item.count--;
    saveCartList(cartList.value);
  } else {
    uni.showModal({
      title: '提示',
      content: '确定要删除此商品吗？',
      success: (res) => {
        if (res.confirm) {
          removeItem(item.id);
        }
      }
    });
  }
};

// 删除单个商品
const removeItem = (itemId) => {
  const index = cartList.value.findIndex(item => item.id === itemId);
  if (index !== -1) {
    cartList.value.splice(index, 1);
    saveCartList(cartList.value);
  }
};

// 删除选中商品
const removeSelectedItems = () => {
  if (!hasSelectedItems.value) return;
  
  uni.showModal({
    title: '提示',
    content: '确定要删除选中的商品吗？',
    success: (res) => {
      if (res.confirm) {
        const selectedIds = cartList.value
          .filter(item => item.selected)
          .map(item => item.id);
        
        cartList.value = cartList.value.filter(item => !item.selected);
        saveCartList(cartList.value);
      }
    }
  });
};

// 结算
const checkout = () => {
  if (!hasSelectedItems.value) return;
  
  // 获取选中的商品
  const selectedItems = cartList.value.filter(item => item.selected);
  
  // 将选中的商品数据存储到临时数据中
  uni.setStorageSync('tempOrderData', selectedItems);
  
  // 跳转到交易页面
  uni.navigateTo({
    url: '/pages/orders/trade?from=cart',
    success: () => {
      console.log('跳转到交易页面成功');
      // 删除已选商品
      cartList.value = cartList.value.filter(item => !item.selected);
      saveCartList(cartList.value);
    },
    fail: (err) => {
      console.error('跳转到交易页面失败:', err);
      uni.showToast({
        title: '跳转失败',
        icon: 'error'
      });
    }
  });
};

// 跳转到商品详情页
const goToGoodsDetail = (item) => {
  console.log('[cart.vue] goToGoodsDetail - item object being passed:', JSON.stringify(item));
  uni.navigateTo({
    url: `/pages/products/product-detail?id=${item.id}&shop_id=${item.shopId}`,
    fail: (err) => {
      console.error('跳转商品详情失败:', err);
      uni.showToast({
        title: '跳转失败',
        icon: 'none'
      });
    }
  });
};
</script>

<style lang="scss">
.cart-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: relative;
  /* #ifdef H5 */
  max-width: 750rpx;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
  overflow-x: hidden;
  /* #endif */
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  background-color: #fff;
  padding-top: calc(var(--status-bar-height) + 20rpx);
  position: sticky;
  top: 0;
  z-index: 10;
  /* #ifdef H5 */
  width: 100%;
  box-sizing: border-box;
  /* #endif */
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.manage-btn {
  font-size: 28rpx;
  color: #00BFA6;
}

.empty-cart {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx;
}

.empty-image {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 40rpx;
}

.btn-to-shop {
  width: 240rpx;
  height: 80rpx;
  line-height: 80rpx;
  background-color: #00BFA6;
  color: #fff;
  font-size: 28rpx;
  border-radius: 40rpx;
}

.cart-list {
  flex: 1;
  background-color: #f7f7f7;
  padding-bottom: 220rpx;
  /* #ifdef H5 */
  max-width: 750rpx;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
  
  &::-webkit-scrollbar {
    width: 4px; /* 非常细的滚动条 */
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  /* #endif */
}

.footer-placeholder {
  height: 220rpx;
  width: 100%;
}

.shop-group {
  margin-bottom: 20rpx;
  background-color: #fff;
  /* #ifdef H5 */
  width: 100%;
  /* #endif */
}

.shop-header {
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.select-shop {
  display: flex;
  align-items: center;
}

.shop-name {
  font-size: 28rpx;
  font-weight: 500;
  margin-left: 20rpx;
}

.goods-items {
  padding: 0 30rpx;
}

.goods-item {
  display: flex;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
  position: relative;
  
  &:last-child {
    border-bottom: none;
  }
}

.checkbox {
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid #ddd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  flex-shrink: 0;
  align-self: center;
}

.checkbox-inner {
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  
  &.checked {
    background-color: #00BFA6;
  }
}

.goods-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 8rpx;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.goods-info {
  flex: 1;
  padding: 10rpx 20rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 160rpx;
}

.goods-name {
  font-size: 28rpx;
  color: #333;
  line-height: 1.4;
  margin-bottom: 10rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.goods-spec {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 20rpx;
}

.goods-price-count {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.goods-price {
  font-size: 32rpx;
  color: #ff6700;
  font-weight: 500;
}

.count-control {
  display: flex;
  align-items: center;
}

.count-btn {
  width: 60rpx;
  height: 60rpx;
  border: 1rpx solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: #333;
  background-color: #f5f5f5;
}

.count-value {
  width: 80rpx;
  height: 60rpx;
  line-height: 60rpx;
  text-align: center;
  font-size: 28rpx;
  border-top: 1rpx solid #ddd;
  border-bottom: 1rpx solid #ddd;
}

.delete-btn {
  position: absolute;
  top: 20rpx;
  right: 0;
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-icon {
  font-size: 36rpx;
  color: #999;
}

.cart-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 100rpx;
  height: 100rpx;
  background-color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 30rpx;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
  z-index: 99;
  
  /* #ifdef H5 */
  width: 750rpx;
  left: 50%;
  transform: translateX(-50%);
  box-sizing: border-box;
  /* #endif */
}

.select-all {
  display: flex;
  align-items: center;
}

.select-all-text {
  font-size: 28rpx;
  margin-left: 20rpx;
}

.footer-right {
  display: flex;
  align-items: center;
}

.price-info {
  margin-right: 20rpx;
}

.total-label {
  font-size: 26rpx;
  color: #666;
}

.total-price {
  font-size: 32rpx;
  color: #ff6700;
  font-weight: 500;
}

.btn-checkout {
  background-color: #00BFA6;
  color: #fff;
  font-size: 28rpx;
  width: 200rpx;
  height: 70rpx;
  line-height: 70rpx;
  border-radius: 35rpx;
  margin: 0;
  
  &[disabled] {
    background-color: #ccc;
    color: #fff;
  }
}

.btn-delete-selected {
  background-color: #ff4d4f;
  color: #fff;
  font-size: 28rpx;
  width: 200rpx;
  height: 70rpx;
  line-height: 70rpx;
  border-radius: 35rpx;
  margin: 0;
  
  &[disabled] {
    background-color: #ccc;
    color: #fff;
  }
}

/* 全局滚动条样式，适用于H5 */
/* #ifdef H5 */
::-webkit-scrollbar {
  width: 4px;
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-track {
  background: transparent;
}
/* #endif */
</style> 