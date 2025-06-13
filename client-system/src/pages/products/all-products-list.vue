<template>
  <view class="all-products-container">
    <!-- 自定义导航栏 -->
    <view class="custom-nav-bar">
      <view class="nav-left" @click="navigateBack">
        <text class="iconfont nav-back-icon">‹</text> <!-- 使用小于号作为返回图标示例 -->
      </view>
      <view class="nav-title-container">
        <text class="page-title">所有商品</text>
      </view>
      <view class="nav-right"></view> <!-- 右侧占位，保持标题居中 -->
    </view>

    <view class="content-area">
      <view v-if="loading" class="loading-indicator">
        <text>加载中...</text>
      </view>

      <view v-if="!loading && products.length === 0" class="empty-state">
        <text>暂无商品</text>
      </view>

      <view class="goods-list" v-if="!loading && products.length > 0">
        <view class="goods-item" v-for="(item, index) in products" :key="item.id || index" @click="goToDetail(item)">
          <image :src="item.image" class="goods-image" mode="aspectFill"></image>
          <view class="custom-badge" v-if="item.is_customizable">可定制</view>
          <view class="goods-info">
            <text class="goods-title">{{ item.title }}</text>
            <text class="goods-desc">{{ item.description }}</text>
            <view class="goods-price-row">
              <text class="goods-price">¥{{ item.price ? item.price.toFixed(2) : '0.00' }}</text>
              <text class="goods-sales" v-if="item.sold_count > 0">{{ item.sold_count }}人购买</text>
              <text class="goods-sales" v-else-if="item.sold > 0">{{ item.sold }}人购买</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import productService from '@/utils/productService.js';
import { onLoad } from '@dcloudio/uni-app';

const products = ref([]);
const loading = ref(true);

const navigateBack = () => {
  uni.navigateBack();
};

const goToDetail = (item) => {
  if (item && item.id && item.shop_id) {
    uni.navigateTo({
      url: `/pages/products/product-detail?id=${item.id}&shop_id=${item.shop_id}`
    });
  } else {
    console.error('goToDetail: Missing id or shop_id for item:', item);
    uni.showToast({ title: '无法打开商品详情', icon: 'none' });
  }
};

onLoad(async () => {
  loading.value = true;
  try {
    const res = await productService.getAllProductsForHome({});
    if (res && res.success && Array.isArray(res.data)) {
      products.value = res.data.map(p => {
        let processedImage = '/static/default-goods.png';
        let processedImagesArray = ['/static/default-goods.png'];
        
        if (p.images) {
          if (Array.isArray(p.images) && p.images.length > 0) {
            processedImagesArray = p.images.filter(img => typeof img === 'string' && img.trim() !== '').map(img => img || '/static/default-goods.png');
            if (processedImagesArray.length === 0) processedImagesArray = ['/static/default-goods.png'];
            processedImage = processedImagesArray[0];
          } else if (typeof p.images === 'string' && p.images.trim() !== '') {
            try {
              const parsed = JSON.parse(p.images);
              if (Array.isArray(parsed) && parsed.length > 0) {
                processedImagesArray = parsed.filter(img => typeof img === 'string' && img.trim() !== '').map(img => img || '/static/default-goods.png');
                if (processedImagesArray.length === 0) processedImagesArray = ['/static/default-goods.png'];
                processedImage = processedImagesArray[0];
              } else if (typeof parsed === 'string' && parsed.trim() !== '') {
                processedImage = parsed;
                processedImagesArray = [parsed];
              }
            } catch (e) {
              processedImage = p.images; 
              processedImagesArray = [p.images];
            }
          }
        }
        
        return {
          id: p.product_id || p._id?.toString(),
          title: p.name || '商品名称加载中',
          description: p.description || '暂无描述',
          price: parseFloat(p.price) || 0,
          sold: parseInt(p.sold_count || p.sold || 0), 
          image: processedImage,
          images: processedImagesArray,
          shop_id: p.shop_id,
          shop_name: p.shop_name || '未知店铺',
          is_customizable: p.is_customizable || false, 
        };
      });
    } else {
      products.value = [];
      console.error('Failed to load all products:', res?.message || 'Unknown error');
      uni.showToast({ title: res?.message || '加载商品失败', icon: 'none' });
    }
  } catch (error) {
    products.value = [];
    console.error('Error loading all products:', error);
    uni.showToast({ title: '加载商品异常', icon: 'none' });
  } finally {
    loading.value = false;
  }
});
</script>

<style lang="scss" scoped>
.all-products-container {
  display: flex; /* New: Flex container for nav and content */
  flex-direction: column; /* New: Stack nav and content vertically */
  height: 100vh; /* New: Full viewport height */
  background-color: #f7f7f7;
}

/* 自定义导航栏样式 */
.custom-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 90rpx; /* Or your standard nav height */
  padding: 0 20rpx;
  background-color: #fff; /* Or your theme color */
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.05);
  width: 100%;
  position: sticky; /* Make it sticky */
  top: 0;
  z-index: 1000;
  padding-top: var(--status-bar-height); /* Account for status bar */
}

.nav-left {
  width: 60rpx; /* Adjust as needed */
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.nav-back-icon {
  font-size: 40rpx; /* Adjust icon size */
  font-weight: bold;
  color: #333;
}

.nav-title-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.page-title {
  font-size: 32rpx; /* Adjusted for nav bar */
  font-weight: bold;
  color: #333;
}

.nav-right {
  width: 60rpx; /* Match nav-left for centering */
}

/* 内容区域，用于滚动 */
.content-area {
  flex: 1; /* Allow content to take remaining space */
  overflow-y: auto; /* Enable scrolling for content */
  padding: 20rpx;
  /* padding-top: calc(90rpx + var(--status-bar-height)); /* Adjust if nav is not sticky or if container is not flex */
}

.loading-indicator, .empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200rpx;
  color: #999;
  font-size: 28rpx;
}

.goods-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(330rpx, 1fr));
  gap: 20rpx;
  padding: 0 10rpx;
}

.goods-item {
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease-in-out;

  &:active {
    transform: scale(0.98);
  }
}

.goods-image {
  width: 100%;
  height: 330rpx;
  background-color: #eee;
}

.custom-badge {
  position: absolute;
  top: 10rpx;
  left: 10rpx;
  background-color: #00BFA6;
  color: white;
  padding: 4rpx 10rpx;
  border-radius: 6rpx;
  font-size: 20rpx;
  z-index: 1;
}

.goods-info {
  padding: 16rpx;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.goods-title {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  min-height: 2.8em;
}

.goods-desc {
  font-size: 24rpx;
  color: #777;
  margin-bottom: 12rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  flex-grow: 1;
}

.goods-price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.goods-price {
  font-size: 30rpx;
  color: #ff502f;
  font-weight: bold;
}

.goods-sales {
  font-size: 22rpx;
  color: #999;
}
</style> 