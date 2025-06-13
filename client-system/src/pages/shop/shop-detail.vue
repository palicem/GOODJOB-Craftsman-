<template>
  <view class="shop-detail-container">
    <!-- 顶部导航栏 -->
    <view class="nav-header">
      <view class="status-bar"></view>
      <view class="nav-bar">
        <view class="back-btn" @click="goBack">
          <text class="back-icon">←</text>
        </view>
        <text class="nav-title">店铺详情</text>
        <view class="favorite-btn" @click="toggleFavorite">
          <text :class="['favorite-icon', { 'active': isFavorite }]">★</text>
        </view>
      </view>
    </view>
    
    <view class="content-area">
      <view class="shop-header">
        <image :src="shop.logo" class="shop-logo" />
        <view class="shop-info-main">
          <view class="shop-name">{{ shop.name }}</view>
          <view class="shop-desc">{{ shop.description }}</view>
          <view class="shop-location">所在地：{{ shop.location }}</view>
        </view>
        <button class="btn-customer-service header-action-btn" @click="goToShopCustomerService">客服</button>
      </view>
      <view class="shop-products">
        <view class="shop-products-title">本店商品</view>
        <view v-for="prod in shopProducts" :key="prod.id" class="shop-product-item">
          <image :src="prod.images[0]" class="prod-img" />
          <view class="prod-info">
            <view class="prod-title">{{ prod.name }}</view>
            <view class="prod-price">￥{{ prod.price }}</view>
          </view>
          <button class="btn-detail" @click="goToDetail(prod)">查看</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { usePageRefresh } from '@/mixins/pageRefresh.js';
// import { shops } from '../../data/shops'; // No longer needed for shop info
import productService from '@/utils/productService.js';
import favoriteAPI from '@/utils/favoriteService.js';
import shopService from '@/utils/shopService.js'; // Import the new shop service

// 调用组合式函数以获取 handlePageBack 和执行 onLoad 逻辑
const { handlePageBack } = usePageRefresh();

const shop = ref({});
const shopId = ref('');
const shopProducts = ref([]);
const isFavorite = ref(false);
const isLoading = ref(true); // isLoading will now cover shop info fetching too
const isToggleFavoriteLoading = ref(false);

// 切换收藏状态
const toggleFavorite = async () => {
  if (isLoading.value || !shop.value.id || isToggleFavoriteLoading.value) {
    uni.showToast({ title: '操作频繁或店铺信息加载中', icon: 'none' });
    return;
  }

  isToggleFavoriteLoading.value = true;
  try {
    let result;
    if (isFavorite.value) {
      // 取消收藏
      result = await favoriteAPI.removeShopFromFavorites(shop.value.id);
      if (result) {
        isFavorite.value = false;
      }
    } else {
      // 添加收藏
      result = await favoriteAPI.addShopToFavorites(shop.value.id);
      if (result && result.success) {
        isFavorite.value = true;
      }
    }
  } catch (e) {
    console.error('收藏操作异常:', e);
    uni.showToast({
      title: '操作失败，请重试',
      icon: 'none'
    });
  } finally {
    isToggleFavoriteLoading.value = false;
  }
};

onMounted(async () => {
  isLoading.value = true;
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const currentShopId = currentPage?.options?.id;
  
  if (currentShopId) {
    shopId.value = currentShopId;
    
    // 获取店铺信息 (from API)
    try {
      const profileResponse = await shopService.getShopProfileById(shopId.value);
      if (profileResponse && profileResponse.success && profileResponse.data) {
        shop.value = { 
          ...profileResponse.data, 
          id: profileResponse.data.shop_id, // Ensure id field is populated for consistency if needed by favoriteAPI
          logo: profileResponse.data.logo_url || profileResponse.data.logo || '/static/default-shop-logo.png' // Handle logo field name
        };
        
        // 从后端检查收藏状态 (after shop info is loaded)
        try {
          isFavorite.value = await favoriteAPI.isShopFavorite(shopId.value);
        } catch (error) {
          console.error("获取店铺收藏状态失败:", error);
          isFavorite.value = false; // Default to not favorite on error
        }

        // 获取店铺商品 (from API) - can run in parallel or sequentially
        try {
          const productRes = await productService.getProductsByShop(shopId.value);
          if (productRes.success && Array.isArray(productRes.data)) {
            shopProducts.value = productRes.data.map(p => ({
              ...p,
              images: (p.images && Array.isArray(p.images) && p.images.length > 0) 
                      ? p.images 
                      : (typeof p.images === 'string' ? [JSON.parse(p.images)[0]] : ['/static/default-goods.png'])
            }));
          } else {
            console.error('获取店铺商品失败:', productRes.message);
            shopProducts.value = [];
          }
        } catch (error) {
          console.error('请求店铺商品API出错:', error);
          shopProducts.value = [];
        }

      } else {
        // This is where the original error "未找到店铺信息" for the new shop would be caught if API fails
        console.error('未找到店铺信息 (API):', shopId.value, 'Response:', profileResponse?.message);
        uni.showToast({ title: profileResponse?.message || '店铺信息加载失败', icon: 'none' });
        // shop.value will remain empty, template should handle this gracefully
      }
    } catch (apiError) {
      console.error('调用店铺信息API时出错:', shopId.value, apiError);
      uni.showToast({ title: '加载店铺信息时发生网络错误', icon: 'none' });
    } finally {
      isLoading.value = false;
    }

  } else {
    console.error('未获取到 shopId');
    uni.showToast({ title: '无法加载店铺', icon: 'none' });
    isLoading.value = false; // Ensure loading is false if no shopId
  }
});

// 返回上一页
const goBack = () => {
  handlePageBack();
};

const goToDetail = (product) => {
  const productIdForNav = product.product_id || product._id; // 优先使用 product_id，其次 _id
  if (product && productIdForNav && product.shop_id) {
    uni.navigateTo({ url: `/pages/products/product-detail?id=${productIdForNav}&shop_id=${product.shop_id}` });
  } else if (product && productIdForNav) {
    // 如果 product 对象中没有 shop_id（理论上应该有），但我们能从当前店铺的 shop.value.id 获取
    uni.navigateTo({ url: `/pages/products/product-detail?id=${productIdForNav}&shop_id=${shop.value.id}` });
  } else {
    console.error('无法跳转到商品详情：商品ID或店铺ID缺失', product);
    uni.showToast({ title: '无法打开商品', icon: 'none' });
  }
};

// 新增：跳转到店铺客服聊天
const goToShopCustomerService = () => {
  if (!shop.value || !shop.value.id) {
    uni.showToast({ title: '店铺信息加载中，请稍候', icon: 'none' });
    return;
  }
  const shopIdParam = shop.value.id;
  const shopNameParam = shop.value.name ? encodeURIComponent(shop.value.name) : '';
  const shopLogoParam = shop.value.logo ? encodeURIComponent(shop.value.logo) : '';

  let url = `/pages/chat/customer-service?shopId=${shopIdParam}`;
  if (shopNameParam) {
    url += `&shopName=${shopNameParam}`;
  }
  if (shopLogoParam) {
    url += `&shopLogo=${shopLogoParam}`;
  }
  // 注意：这里不传递 productName
  
  console.log('[shop-detail] Navigating to customer service with URL:', url);
  uni.navigateTo({ url });
};
</script>

<style scoped>
.shop-detail-container { 
  background-color: #f7f8fa; 
  min-height: 100vh; 
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
  justify-content: space-between;
  height: 90rpx;
  background-color: #00BFA6;
  color: #FFFFFF;
  padding: 0 20rpx;
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
}

.nav-title {
  font-size: 32rpx;
  font-weight: 500;
}

.placeholder {
  width: 60rpx;
}

.content-area {
  margin-top: calc(var(--status-bar-height, 25px) + 90rpx);
  padding: 30rpx;
}

.shop-header { 
  display: flex; /* 改为 flex 布局 */
  align-items: center; 
  background: #fff; 
  border-radius: 10rpx; 
  margin-bottom: 20rpx; 
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.03); 
  padding: 20rpx; 
}
.shop-logo { width: 100rpx; height: 100rpx; border-radius: 50%; margin-right: 20rpx; background-color: #f0f0f0; flex-shrink: 0;}
.shop-info-main { /* 用于包裹左侧信息，使其可以和右侧按钮并排 */
  flex: 1; /* 占据剩余空间 */
  margin-right: 20rpx; /* 与客服按钮的间距 */
}
.shop-name { font-size: 32rpx; font-weight: bold; margin-bottom: 8rpx; }
.shop-desc { color: #666; font-size: 24rpx; margin-bottom: 8rpx; }
.shop-location { color: #999; font-size: 22rpx; }

/* 客服按钮样式调整 */
.btn-customer-service.header-action-btn {
  background-color: #00BFA6;
  color: #fff;
  border: none;
  border-radius: 30rpx;
  padding: 15rpx 30rpx; /* 调整内边距使按钮看起来更协调 */
  font-size: 26rpx;
  /* margin-top: 0; */ /* 移除之前的 margin-top */
  white-space: nowrap; /* 防止文字换行 */
  align-self: center; /* 如果shop-header内部高度不一致，使其垂直居中 */
}

.shop-products { background: #fff; border-radius: 10rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.03); padding: 20rpx; }
.shop-products-title { font-size: 28rpx; font-weight: bold; margin-bottom: 20rpx; border-bottom: 1rpx solid #eee; padding-bottom: 10rpx; }
.shop-product-item { display: flex; align-items: center; margin-bottom: 20rpx; padding-bottom: 20rpx; border-bottom: 1rpx solid #f5f5f5;}
.shop-product-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.prod-img { width: 120rpx; height: 120rpx; border-radius: 10rpx; margin-right: 20rpx; background-color: #f0f0f0; }
.prod-info { flex: 1; }
.prod-title { font-size: 26rpx; margin-bottom: 8rpx; }
.prod-price { color: #e64340; font-size: 24rpx; }
.btn-detail { background: #00BFA6; color: #fff; border: none; border-radius: 8rpx; padding: 8rpx 16rpx; font-size: 22rpx; }

.favorite-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 1;
  transition: opacity 0.2s;
}

.favorite-btn[disabled] {
  opacity: 0.5;
}

.favorite-icon {
  font-size: 40rpx;
  color: #fff;
  opacity: 0.8;
  
  &.active {
    color: #FFD700;
    opacity: 1;
  }
}
</style>