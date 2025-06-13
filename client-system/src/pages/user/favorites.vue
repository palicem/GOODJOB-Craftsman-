<template>
  <view class="favorites-container">
    <!-- 顶部导航栏 -->
    <view class="nav-header">
      <view class="status-bar"></view>
      <view class="nav-bar">
        <view class="back-btn" @click="goBack">
          <text class="back-icon">←</text>
        </view>
        <text class="nav-title">我的收藏</text>
        <view class="placeholder"></view>
      </view>
    </view>
    
    <view class="content-area">
      <view v-if="loading" class="loading-placeholder">加载中...</view>
      <view v-else-if="favoriteProducts.length === 0" class="empty">暂无收藏商品</view>
      <view v-else>
        <view v-for="favItem in favoriteProducts" :key="favItem._id" class="favorite-item">
          <image :src="favItem.product_details?.images?.[0] || favItem.product_details?.image_url || favItem.product_details?.image || '../../static/default-goods.png'" class="fav-img" />
          <view class="fav-info">
            <view class="fav-title">{{ favItem.product_details?.name || '商品加载中...' }}</view>
            <view class="fav-shop">店铺：{{ favItem.shop_details?.name || favItem.shop_id_original || '店铺信息加载中...' }}</view>
            <view class="fav-price">￥{{ favItem.product_details?.price?.toFixed(2) || '--' }}</view>
          </view>
          <button class="btn-remove" @click.stop="removeFavorite(favItem.product_details?.product_id)">取消收藏</button>
          <button class="btn-detail" @click="goToDetail(favItem.product_details?.product_id, favItem.shop_id_original)">查看</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { usePageRefresh } from '@/mixins/pageRefresh.js';
import favoriteAPI from '../../utils/favoriteService';

const { handlePageBack } = usePageRefresh();

const favoriteProducts = ref([]);
const loading = ref(true);

const loadFavoriteProducts = async () => {
  loading.value = true;
  try {
    const response = await favoriteAPI.getFavoriteProducts();
    if (response && response.success && Array.isArray(response.data)) {
      favoriteProducts.value = response.data;
    } else if (Array.isArray(response)) {
      favoriteProducts.value = response;
    } else {
      favoriteProducts.value = [];
      console.warn('getFavoriteProducts did not return an array or expected structure:', response);
    }
  } catch (error) {
    console.error('加载收藏商品失败:', error);
    uni.showToast({ title: '加载收藏失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

const removeFavorite = async (productId) => {
  uni.showModal({
    title: '确认',
    content: '确定要取消收藏该商品吗？',
    success: async (res) => {
      if (res.confirm) {
        const success = await favoriteAPI.removeProductFromFavorites(productId);
        if (success) {
          uni.showToast({ title: '已取消收藏', icon: 'success' });
          loadFavoriteProducts();
        } else {
          uni.showToast({ title: '取消收藏失败', icon: 'none' });
        }
      }
    }
  });
};

const goToDetail = (productId, shopId) => {
  if (productId && shopId) {
    uni.navigateTo({ url: `/pages/products/product-detail?id=${productId}&shop_id=${shopId}` });
  } else {
    console.warn('Product ID or Shop ID is missing for navigation', { productId, shopId });
    uni.showToast({ title: '参数不完整，无法跳转', icon: 'none' });
  }
};

const goBack = () => {
  handlePageBack();
};

const handleFavoritesUpdate = (data) => {
  if (data.type === 'product') {
    console.log('Product favorite updated, reloading list...');
    loadFavoriteProducts();
  }
};

onMounted(() => {
  loadFavoriteProducts();
  uni.$on('favoritesUpdated', handleFavoritesUpdate);
});

onUnmounted(() => {
  uni.$off('favoritesUpdated', handleFavoritesUpdate);
});
</script>

<style scoped>
.favorites-container { 
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

.loading-placeholder {
  text-align: center;
  color: #999;
  padding-top: 100rpx;
}

.empty { color: #999; text-align: center; margin-top: 100rpx; }
.favorite-item {
  display: flex; 
  align-items: center; 
  background: #fff; 
  border-radius: 10rpx; 
  margin-bottom: 20rpx; 
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.03); 
  padding: 20rpx; 
}
.fav-img { 
  width: 120rpx; 
  height: 120rpx; 
  border-radius: 10rpx; 
  margin-right: 20rpx; 
  background-color: #eee; /* Add a background for when image is loading or missing */
}
.fav-info { flex: 1; }
.fav-title { font-size: 28rpx; font-weight: bold; margin-bottom: 8rpx; }
.fav-shop { color: #666; font-size: 22rpx; margin-bottom: 8rpx; }
.fav-price { color: #e64340; font-size: 24rpx; }

.btn-detail,
.btn-remove {
  background: #00BFA6; 
  color: #fff; 
  border: none; 
  border-radius: 8rpx; 
  padding: 10rpx 15rpx; 
  font-size: 24rpx; 
  margin-left: 10rpx;
  height: auto;
  line-height: normal;
}
.btn-remove {
  background: #ff4d4f;
}
</style> 