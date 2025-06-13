<template>
  <view class="promo-container">
    <!-- 顶部导航 -->
    <view class="nav-header">
      <view class="status-bar"></view>
      <view class="nav-bar">
        <view class="back-btn" @click="goBack">
          <text class="back-icon">←</text>
        </view>
        <text class="nav-title">热门定制</text>
        <view class="placeholder"></view>
      </view>
    </view>

    <!-- 商品列表 -->
    <view class="product-list" v-if="promos.length > 0">
      <view 
        class="product-item" 
        v-for="(item, index) in promos" 
        :key="index"
        @click="goToDetail(item)"
      >
        <image :src="item.image" class="product-image" mode="aspectFill"></image>
        <view class="product-info">
          <text class="product-title">{{ item.title }}</text>
          <view class="product-tags">
            <text class="product-tag" v-for="(tag, i) in item.tags" :key="i">{{tag}}</text>
          </view>
          <view class="product-price-row">
            <view class="price-group">
              <text class="product-price">¥{{ item.price.toFixed(2) }}起</text>
              <text class="original-price">¥{{ item.originalPrice.toFixed(2) }}</text>
            </view>
            <text class="product-sales">{{ item.sales }}人已定制</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-else>
      <image src="/static/logo.png" class="empty-image"></image>
      <text class="empty-text">暂无热门活动</text>
    </view>

    <!-- 底部安全区域 -->
    <view class="safe-bottom"></view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { usePageRefresh } from '@/mixins/pageRefresh.js';
import productService from '@/utils/productService.js'; // 导入 productService

const { handlePageBack } = usePageRefresh();

const promos = ref([]); // 将由API填充
const loading = ref(false); // 添加loading状态

onMounted(async () => {
  loading.value = true;
  promos.value = []; // 清空旧数据
  const shopId = 'shop001'; // 暂时硬编码，与 home.vue 保持一致
  console.log(`[promo-list.vue] Loading promo products for shopId: ${shopId}`);

  try {
    const res = await productService.getProductsByShop(shopId);
    if (res && res.success && Array.isArray(res.data)) {
      // 假设热门商品也是普通商品的一部分，或者将来有特定API
      // 这里我们简单地将所有获取到的商品作为"热门"，后续可以根据业务逻辑调整
      // (例如，只取一部分，或者API直接返回热门商品)
      promos.value = res.data.map(p => {
        // 数据映射，参考 custom-list.vue 和 home.vue
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
        if (!processedImagesArray.length || processedImagesArray.every(img => img === '/static/default-goods.png')) {
            processedImagesArray = ['/static/default-goods.png'];
        }
        if (processedImage === '/static/default-goods.png' && processedImagesArray[0] !== '/static/default-goods.png') {
            processedImage = processedImagesArray[0];
        }

        return {
          ...p,
          id: p.product_id || p._id,
          shop_id: p.shop_id || shopId,
          title: p.name || '商品标题缺失',
          image: processedImage,
          price: p.price !== undefined ? Number(p.price) : 0,
          originalPrice: p.original_price !== undefined ? Number(p.original_price) : (p.price !== undefined ? Number(p.price) : 0),
          sales: p.sold_count !== undefined ? Number(p.sold_count) : (p.sold !== undefined ? Number(p.sold) : 0),
          tags: Array.isArray(p.tags) ? p.tags : (typeof p.tags === 'string' ? p.tags.split(',') : []),
          link: `/pages/products/product-detail?id=${p.product_id || p._id}&shop_id=${p.shop_id || shopId}`
        };
      });
      console.log('[promo-list.vue] Promo products loaded and mapped:', JSON.parse(JSON.stringify(promos.value)));
    } else {
      console.error('[promo-list.vue] Failed to fetch promo products or data is invalid:', res);
      promos.value = [];
    }
  } catch (error) {
    console.error('[promo-list.vue] Error fetching promo products:', error);
    promos.value = [];
  } finally {
    loading.value = false;
  }
});

const goBack = () => {
  handlePageBack();
};

const goToDetail = (item) => {
  if (item && item.id && item.shop_id) {
    uni.navigateTo({
      url: item.link
    });
  } else {
    console.error('[promo-list.vue] Failed to navigate: product id or shop_id is missing. Item:', item);
    uni.showToast({ title: '无法打开商品详情', icon: 'none' });
  }
};
</script>

<style lang="scss">
.promo-container {
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

/* 商品列表样式 */
.product-list {
  display: flex;
  flex-direction: column;
  padding: 20rpx;
  margin-top: calc(var(--status-bar-height, 25px) + 90rpx);
}

.product-item {
  background-color: #fff;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  position: relative;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.product-image {
  width: 100%;
  height: 320rpx;
}

.product-info {
  padding: 20rpx;
}

.product-title {
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
  line-height: 1.4;
  margin-bottom: 10rpx;
}

.product-tags {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 15rpx;
}

.product-tag {
  font-size: 22rpx;
  color: #00BFA6;
  background-color: rgba(0, 191, 166, 0.1);
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
  margin-right: 10rpx;
  margin-bottom: 8rpx;
}

.product-price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.price-group {
  display: flex;
  align-items: baseline;
}

.product-price {
  font-size: 32rpx;
  color: #FF6B00;
  font-weight: 600;
  margin-right: 12rpx;
}

.original-price {
  font-size: 24rpx;
  color: #999;
  text-decoration: line-through;
}

.product-sales {
  font-size: 24rpx;
  color: #999;
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
  margin-top: calc(var(--status-bar-height, 25px) + 90rpx);
}

.empty-image {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

/* 底部安全区域 */
.safe-bottom {
  height: 50rpx;
}
</style> 