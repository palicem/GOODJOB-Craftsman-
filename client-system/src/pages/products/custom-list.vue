<template>
  <view class="product-container">
    <!-- 顶部导航 -->
    <view class="nav-header">
      <view class="status-bar"></view>
      <view class="nav-bar">
        <view class="back-btn" @click="goBack">
          <text class="back-icon">←</text>
        </view>
        <text class="nav-title">{{ pageTitle }}</text>
        <view class="placeholder"></view>
      </view>
    </view>

    <!-- 商品筛选栏 -->
    <view class="filter-bar">
      <view class="filter-item" :class="{ active: sortType === 'default' }" @click="changeSortType('default')">
        <text>默认</text>
      </view>
      <view class="filter-item" :class="{ active: sortType === 'sales' }" @click="changeSortType('sales')">
        <text>销量</text>
      </view>
      <view class="filter-item" :class="{ active: sortType === 'price' }" @click="changeSortType('price')">
        <text>价格</text>
        <view class="sort-icon">
          <text :class="{ active: sortType === 'price' && !priceDesc }">↑</text>
          <text :class="{ active: sortType === 'price' && priceDesc }">↓</text>
        </view>
      </view>
      <view class="filter-item" @click="toggleFilter">
        <text>筛选</text>
        <text class="filter-icon">☰</text>
      </view>
    </view>

    <!-- 商品列表 -->
    <view class="product-list" v-if="products.length > 0">
      <view 
        class="product-item" 
        v-for="(item, index) in sortedProducts" 
        :key="index"
        @click="goToDetail(item)"
      >
        <image :src="item.image" class="product-image" mode="aspectFill"></image>
        <view class="custom-badge" v-if="item.customizable">可定制</view>
        <view class="product-info">
          <text class="product-title">{{ item.title }}</text>
          <text class="product-desc">{{ item.description }}</text>
          <view class="product-price-row">
            <text class="product-price">¥{{ item.price.toFixed(2) }}起</text>
            <text class="product-sales">{{ item.sales }}人已定制</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-else>
      <image src="/static/logo.png" class="empty-image"></image>
      <text class="empty-text">暂无相关商品</text>
    </view>

    <!-- 底部安全区域 -->
    <view class="safe-bottom"></view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { usePageRefresh } from '@/mixins/pageRefresh.js'; 
import productService from '@/utils/productService.js'; // 导入 productService

const { handlePageBack } = usePageRefresh();

const pageType = ref('custom-products');
const pageTitle = ref('可定制商品');
const loading = ref(false); // 添加loading状态

const sortType = ref('default');
const priceDesc = ref(true);
const products = ref([]); // 将由API填充

onMounted(async () => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  // const type = currentPage.options.type || 'custom-products'; // type不再直接决定数据源
  const category = currentPage.options.category || ''; 
  const shopIdFromRoute = currentPage.options.shopId; // 尝试从路由获取 shopId

  // pageType.value = type; // type 更多用于标题和可能的特定逻辑，而非数据源选择

  // 根据页面类型设置标题
  if (pageType.value === 'promo') { // 虽然这个文件主要是 custom-list，但保留了类型判断以备将来扩展
    pageTitle.value = '热门定制';
  } else if (pageType.value === 'cases') {
    pageTitle.value = '定制案例';
  } else { 
    pageTitle.value = category ? `${decodeURIComponent(category)} 定制` : '可定制商品';
  }

  loading.value = true;
  products.value = []; // 清空旧数据

  const currentShopId = shopIdFromRoute || 'shop001'; // 优先使用路由的 shopId，否则默认 shop001
  console.log(`[custom-list.vue] Loading products for shopId: ${currentShopId}, category: ${category}`);

  try {
    const res = await productService.getProductsByShop(currentShopId);
    if (res && res.success && Array.isArray(res.data)) {
      let fetchedProducts = res.data.map(p => {
        // 数据映射，参考 home.vue
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
          shop_id: p.shop_id || currentShopId,
          title: p.name || '商品标题缺失', // 对应模板的 product-title
          description: p.description || '暂无描述', // 对应模板的 product-desc
          image: processedImage, // 对应模板的 product-image
          price: p.price !== undefined ? Number(p.price) : 0, // 对应模板的 product-price
          sales: p.sold_count !== undefined ? Number(p.sold_count) : (p.sold !== undefined ? Number(p.sold) : 0), // 对应模板的 product-sales
          customizable: p.customizable !== undefined ? p.customizable : true, // 对应模板的 custom-badge (默认为true)
          link: `/pages/products/product-detail?id=${p.product_id || p._id}&shop_id=${p.shop_id || currentShopId}`,
          tags: Array.isArray(p.tags) ? p.tags : (typeof p.tags === 'string' ? p.tags.split(',') : []) // 确保tags是数组
        };
      });

      if (category) {
        const decodedCategory = decodeURIComponent(category);
        console.log(`[custom-list.vue] Filtering by category: ${decodedCategory}`);
        fetchedProducts = fetchedProducts.filter(p => 
          p.category_name === decodedCategory || 
          (p.tags && p.tags.includes(decodedCategory))
        );
      }
      products.value = fetchedProducts;
      console.log('[custom-list.vue] Products loaded and mapped:', JSON.parse(JSON.stringify(products.value)));
    } else {
      console.error('[custom-list.vue] Failed to fetch products or data is invalid:', res);
      products.value = [];
    }
  } catch (error) {
    console.error('[custom-list.vue] Error fetching products:', error);
    products.value = [];
  } finally {
    loading.value = false;
  }
});

// 返回上一页
const goBack = () => {
  handlePageBack(); 
};

// 筛选和排序逻辑 (保持不变或根据需要调整)
const sortedProducts = computed(() => {
  let tempProducts = [...products.value];
  if (sortType.value === 'sales') {
    tempProducts.sort((a, b) => b.sales - a.sales);
  } else if (sortType.value === 'price') {
    if (priceDesc.value) {
      tempProducts.sort((a, b) => b.price - a.price);
    } else {
      tempProducts.sort((a, b) => a.price - b.price);
    }
  }
  // 默认排序或不处理
  return tempProducts;
});

const changeSortType = (type) => {
  if (type === 'price') {
    if (sortType.value === 'price') {
      priceDesc.value = !priceDesc.value;
    } else {
      sortType.value = 'price';
      priceDesc.value = true; // 默认价格降序
    }
  } else {
    sortType.value = type;
  }
};

const toggleFilter = () => {
  // TODO: 实现筛选面板逻辑
  uni.showToast({ title: '筛选功能待实现', icon: 'none' });
};

// 跳转到商品详情
const goToDetail = (item) => {
  if (item && item.id && item.shop_id) {
  uni.navigateTo({
      url: item.link || `/pages/products/product-detail?id=${item.id}&shop_id=${item.shop_id}`
  });
  } else {
     console.error('[custom-list.vue] Failed to navigate: product id or shop_id is missing. Item:', item);
    uni.showToast({ title: '无法打开商品详情', icon: 'none' });
  }
};

</script>

<style lang="scss">
.product-container {
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

/* 筛选栏样式 */
.filter-bar {
  display: flex;
  align-items: center;
  height: 80rpx;
  background-color: #fff;
  margin-top: calc(var(--status-bar-height, 25px) + 90rpx);
  border-bottom: 1rpx solid #f0f0f0;
  position: sticky;
  top: calc(var(--status-bar-height, 25px) + 90rpx);
  z-index: 10;
}

.filter-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 28rpx;
  color: #666;
  position: relative;
  
  &.active {
    color: #00BFA6;
    font-weight: 500;
  }
}

.sort-icon {
  display: flex;
  flex-direction: column;
  margin-left: 5rpx;
  font-size: 20rpx;
  
  text {
    color: #999;
    line-height: 16rpx;
    
    &.active {
      color: #00BFA6;
    }
  }
}

.filter-icon {
  margin-left: 5rpx;
}

/* 商品列表样式 */
.product-list {
  display: flex;
  flex-direction: column;
  padding: 20rpx;
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

.custom-badge {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  background-color: #00BFA6;
  color: #fff;
  padding: 6rpx 12rpx;
  border-radius: 4rpx;
  font-size: 22rpx;
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

.product-desc {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 20rpx;
}

.product-price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.product-price {
  font-size: 32rpx;
  color: #FF6B00;
  font-weight: 600;
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