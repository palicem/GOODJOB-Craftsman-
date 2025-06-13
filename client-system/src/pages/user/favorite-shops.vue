<!-- 收藏店铺页面 -->
<template>
  <view class="favorite-shops-container">
    <!-- 头部标题栏 -->
    <view class="header">
      <view class="back-btn" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <view class="header-title">
        <text class="title-text">收藏的店铺</text>
      </view>
      <view class="placeholder"></view>
    </view>
    
    <view v-if="loading" class="loading-placeholder">加载中...</view>
    <view class="shop-list" v-else-if="favoriteShops.length > 0">
      <view class="shop-item" v-for="shop in favoriteShops" :key="shop._id" @click="goToShop(shop)">
        <image :src="(shop.shop_details && shop.shop_details.logo) || '../../static/images/default-shop-logo.png'" class="shop-logo" mode="aspectFill" />
        <view class="shop-info">
          <view class="shop-name">{{ shop.shop_details && shop.shop_details.name || '店铺名称加载失败' }}</view>
          <view class="shop-desc">{{ shop.shop_details && shop.shop_details.description || '暂无描述' }}</view>
        </view>
        <view class="shop-actions">
          <button class="btn-unfollow" @click.stop="unfollowShop(shop.shop_id_original)">取消收藏</button>
          <button class="btn-enter" @click.stop="goToShop(shop)">进入店铺</button>
        </view>
      </view>
    </view>
    
    <!-- 空状态 -->
    <view class="empty-state" v-else>
      <image src="/static/images/empty-favorite.png" class="empty-image" mode="aspectFit" />
      <text class="empty-text">还没有收藏任何店铺</text>
      <text class="empty-tip">去逛逛，收藏感兴趣的店铺吧</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
// 修改导入方式，导入具名导出的 usePageRefresh
import { usePageRefresh } from '@/mixins/pageRefresh.js'; 
import favoriteAPI from '../../utils/favoriteService'; // 导入新的收藏服务

// 调用 usePageRefresh 获取 handlePageBack
const { handlePageBack } = usePageRefresh();

// 收藏的店铺列表
const favoriteShops = ref([]);
const loading = ref(true);

// 加载收藏的店铺
const loadFavoriteShops = async () => {
  loading.value = true;
  try {
    const shopsArray = await favoriteAPI.getFavoriteShops(); // favoriteAPI.getFavoriteShops() should now reliably return an array
    if (Array.isArray(shopsArray)) {
      favoriteShops.value = shopsArray.sort((a, b) => 
        new Date(b.created_at || 0) - new Date(a.created_at || 0)
      );
      console.log('Loaded favorite shops:', JSON.parse(JSON.stringify(favoriteShops.value)));
    } else {
      // This case should ideally not be hit if favoriteService.js is correct
      console.error('获取收藏店铺失败，favoriteAPI.getFavoriteShops() 未返回数组:', shopsArray);
      favoriteShops.value = [];
      uni.showToast({
        title: '获取数据失败，请稍后重试',
        icon: 'none'
      });
    }
  } catch (e) {
    console.error('获取收藏店铺失败 (catch block):', e);
    favoriteShops.value = []; // Ensure list is cleared on error
    uni.showToast({
      title: '获取收藏店铺失败',
      icon: 'none'
    });
  } finally {
    loading.value = false;
  }
};

// 取消收藏店铺
const unfollowShop = async (shopIdOriginal) => {
  if (!shopIdOriginal) {
    console.error('Cannot unfollow shop, shopIdOriginal is missing.');
    uni.showToast({ title: '操作失败，店铺ID缺失', icon: 'none' });
    return;
  }
  uni.showModal({
    title: '提示',
    content: '确定取消收藏该店铺吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          // 使用 shopIdOriginal 调用API
          const apiResponse = await favoriteAPI.removeShopFromFavorites(shopIdOriginal);
          if (apiResponse && apiResponse.success) {
            uni.showToast({
              title: '已取消收藏',
              icon: 'success'
            });
            loadFavoriteShops();
          } else {
            uni.showToast({
              title: apiResponse.message || '操作失败，请重试',
              icon: 'none'
            });
          }
        } catch (e) {
          console.error('取消收藏失败:', e);
          uni.showToast({
            title: '操作失败，请重试',
            icon: 'none'
          });
        }
      }
    }
  });
};

// 跳转到店铺详情
const goToShop = (shop) => {
  // 使用 shop.shop_id_original 进行导航
  if (shop && shop.shop_id_original) {
    uni.navigateTo({
      url: `/pages/shop/shop-detail?id=${shop.shop_id_original}`
    });
  } else {
    console.warn('Shop ID (shop_id_original) is missing for navigation. Shop object:', JSON.parse(JSON.stringify(shop)));
    uni.showToast({ title: '无法打开店铺详情，ID缺失', icon: 'none' });
  }
};

// 返回上一页
const goBack = () => {
  handlePageBack();
};

const handleFavoritesUpdate = (data) => {
  if (data.type === 'shop') {
    console.log('Shop favorite updated, reloading list...');
    loadFavoriteShops();
  }
};

onMounted(() => {
  loadFavoriteShops();
  uni.$on('favoritesUpdated', handleFavoritesUpdate);
});

onUnmounted(() => {
  uni.$off('favoritesUpdated', handleFavoritesUpdate);
});
</script>

<style lang="scss">
.favorite-shops-container {
  min-height: 100vh;
  background-color: #f8f8f8;
  padding-bottom: 30rpx;
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

.loading-placeholder {
  text-align: center;
  color: #999;
  padding-top: 200rpx;
}

.shop-list {
  padding: 20rpx;
}

.shop-item {
  background: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: flex-start;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.shop-logo {
  width: 120rpx;
  height: 120rpx;
  border-radius: 10rpx;
  margin-right: 20rpx;
  background-color: #eee; /* Add a background for when image is loading or missing */
}

.shop-info {
  flex: 1;
  margin-right: 20rpx;
}

.shop-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.shop-desc {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 15rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.shop-actions {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10rpx;
}

.btn-unfollow,
.btn-enter {
  font-size: 24rpx;
  padding: 10rpx 20rpx;
  border-radius: 25rpx;
  border: none;
  min-width: 140rpx;
  text-align: center;
}

.btn-unfollow {
  background-color: #f8f8f8;
  color: #666;
}

.btn-enter {
  background-color: #00BFA6;
  color: #fff;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
}

.empty-image {
  width: 240rpx;
  height: 240rpx;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 30rpx;
  color: #333;
  margin-bottom: 15rpx;
}

.empty-tip {
  font-size: 26rpx;
  color: #999;
}
</style> 