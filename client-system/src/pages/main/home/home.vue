<template>
  <view class="home-container">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-box" @click="goSearch">
        <view class="search-input-wrap">
          <text class="search-icon">🔍</text>
          <input type="text" class="search-input" placeholder="搜索定制商品或服务" disabled />
        </view>
      </view>
      <text class="scan-icon" @click="scanCode">📷</text>
    </view>
    
    <!-- 轮播图 -->
    <swiper class="banner-swiper" circular autoplay interval="3000" duration="500" indicator-dots indicator-color="rgba(255, 255, 255, 0.6)" indicator-active-color="#fff">
      <swiper-item v-for="(item, index) in banners" :key="index" @click="onBannerClick(item)">
        <image :src="item.image" class="banner-image" mode="aspectFill"></image>
        <view class="banner-title">{{ item.title }}</view>
      </swiper-item>
    </swiper>
    
    <!-- 在售商品 (复制并修改自 可定制商品 区域) -->
    <view class="guess-section"> <!-- 复用 guess-section 的样式 -->
      <view class="section-header">
        <text class="section-title">在售商品</text>
        <text class="more-link" @click="goToMore('all-products')">更多 ></text> <!-- 指向所有商品列表 -->
      </view>
      
      <view class="goods-list"> <!-- 复用 goods-list 结构 -->
        <!-- 数据源暂时使用 onSaleItemsPreview，如果它没数据，这个区域不会显示 -->
        <!-- 如果希望即使它没数据也显示结构，或者用不同的数据源，需要调整 -->
        <view class="goods-item" v-for="(item, index) in onSaleItemsPreview" :key="index" @click="goToDetail(item)">
          <image :src="item.image" class="goods-image" mode="aspectFill"></image>
          <!-- <view class="custom-badge">可定制</view> --> <!-- 在售商品区域通常不显示此徽章 -->
          <view class="goods-info">
            <text class="goods-title">{{ item.title }}</text>
            <text class="goods-desc">{{ item.description }}</text>
            <view class="goods-price-row">
              <text class="goods-price">¥{{ item.price ? item.price.toFixed(2) : '0.00' }}</text>
              <text class="goods-sales">{{ item.sold || 0 }}人购买</text>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 我们的服务 -->
    <view class="service-section">
      <view class="service-header">
        <text class="service-title">我们的服务</text>
      </view>
      <view class="service-list">
        <view class="service-item" @click="goToService('design')">
          <view class="service-icon">🎨</view>
          <text class="service-name">设计方案</text>
        </view>
        <view class="service-item" @click="goToService('custom')">
          <view class="service-icon">✂️</view>
          <text class="service-name">私人定制</text>
        </view>
        <view class="service-item" @click="goToService('enterprise')">
          <view class="service-icon">🏢</view>
          <text class="service-name">企业定制</text>
        </view>
        <view class="service-item" @click="goToService('sample')">
          <view class="service-icon">📦</view>
          <text class="service-name">样品申请</text>
        </view>
      </view>
    </view>
    
    <!-- 定制分类导航 -->
    <view class="category-section">
      <view class="section-header">
        <text class="section-title">定制分类</text>
      </view>
      <view class="category-nav">
        <view class="category-item" v-for="(category, index) in categories" :key="index" @click="goToCategory(category)">
          <image :src="category.icon" class="category-icon" mode="aspectFit"></image>
          <text class="category-name">{{ category.name }}</text>
        </view>
      </view>
    </view>
    
    <!-- 热门定制 -->
    <view class="promo-section">
      <view class="section-header">
        <text class="section-title">热门定制</text>
        <text class="more-link" @click="goToMore('promo')">更多 ></text>
      </view>
      
      <view class="promo-list">
        <view class="promo-item" v-for="(promo, index) in promos" :key="index" @click="goToPromo(promo)">
          <image :src="promo.image" class="promo-image" mode="aspectFill"></image>
          <view class="promo-tags">
            <text class="promo-tag" v-for="(tag, i) in promo.tags" :key="i">{{tag}}</text>
          </view>
          <view class="promo-info">
            <text class="promo-title">{{ promo.title }}</text>
            <view class="promo-price-row">
              <text class="promo-price">¥{{ promo.price.toFixed(2) }}起</text>
              <text class="promo-original-price">¥{{ promo.originalPrice.toFixed(2) }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 定制流程 -->
    <view class="process-section">
      <view class="section-header">
        <text class="section-title">定制流程</text>
      </view>
      <view class="process-list">
        <view class="process-item">
          <view class="process-num">1</view>
          <text class="process-name">需求沟通</text>
        </view>
        <view class="process-arrow">→</view>
        <view class="process-item">
          <view class="process-num">2</view>
          <text class="process-name">方案设计</text>
        </view>
        <view class="process-arrow">→</view>
        <view class="process-item">
          <view class="process-num">3</view>
          <text class="process-name">样品确认</text>
        </view>
        <view class="process-arrow">→</view>
        <view class="process-item">
          <view class="process-num">4</view>
          <text class="process-name">批量生产</text>
        </view>
      </view>
    </view>
    
    <!-- 定制案例 -->
    <view class="hot-section">
      <view class="section-header">
        <text class="section-title">定制案例</text>
        <text class="more-link" @click="goToMore('cases')">更多 ></text>
      </view>
      
      <view class="case-grid">
        <view class="case-item" v-for="(item, index) in hotItems" :key="index" @click="goToDetail(item)">
          <image :src="item.image" class="case-image" mode="aspectFill"></image>
          <view class="case-info">
            <text class="case-title">{{ item.title }}</text>
            <view class="case-tag">{{ item.tag || '成功案例' }}</view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 可定制商品 -->
    <view class="guess-section">
      <view class="section-header">
        <text class="section-title">可定制商品</text>
        <text class="more-link" @click="goToMore('custom-products')">更多 ></text>
      </view>
      
      <view class="goods-list">
        <view class="goods-item" v-for="(item, index) in guessItems" :key="index" @click="goToDetail(item)">
          <image :src="item.image" class="goods-image" mode="aspectFill"></image>
          <view class="custom-badge">可定制</view>
          <view class="goods-info">
            <text class="goods-title">{{ item.title }}</text>
            <text class="goods-desc">{{ item.description }}</text>
            <view class="goods-price-row">
              <text class="goods-price">¥{{ item.price.toFixed(2) }}起</text>
              <text class="goods-sales">{{ item.sold }}人已定制</text>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 回到顶部按钮 -->
    <view class="back-to-top" v-show="showBackToTop" @click="scrollToTop">
      <text class="top-icon">⬆️</text>
    </view>
    
    <!-- 底部安全区域 -->
    <view class="safe-bottom"></view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
// TODO: 后期创建API服务，引入相关API
// import { getBanners, getCategories, getPromotions, getHotItems, getRecommendations } from '@/api/homeApi';
import productService from '@/utils/productService.js'; // 确保导入 productService

// 轮播图数据 - 更改为定制相关的广告图
// TODO: 后期从API获取数据 - GET /home/banners
const banners = ref([]);

// 分类数据 - 只保留可定制的商品类别
// TODO: 后期从API获取数据 - GET /home/categories
const categories = ref([
  { id: 1, name: '服装定制', icon: '/static/icons/clothing.png', path: '/pages/products/custom-list?category=clothing' },
  { id: 2, name: '首饰定制', icon: '/static/icons/jewelry.png', path: '/pages/products/custom-list?category=jewelry' },
  { id: 3, name: '皮具定制', icon: '/static/icons/leather.png', path: '/pages/products/custom-list?category=leather' },
  { id: 4, name: '家居定制', icon: '/static/icons/home.png', path: '/pages/products/custom-list?category=home' },
  { id: 5, name: '配饰定制', icon: '/static/icons/accessories.png', path: '/pages/products/custom-list?category=accessories' }
]);

// 热门定制商品数据
// TODO: 后期从API获取数据 - GET /home/promotions
const promos = ref([]);

// 定制案例数据
// TODO: 后期从API获取数据 - GET /home/hot-items
const hotItems = ref([]);

// 商品推荐列表 ("猜你喜欢") -> 改为可定制商品预览
const guessItems = ref([]); // 将作为可定制商品预览列表
const onSaleItemsPreview = ref([]); // 新增：在售商品预览列表

const loading = ref(false); 
const hasMore = ref(true); 

// 回到顶部
const showBackToTop = ref(false);
let scrollListener = null;

const scrollToTop = () => {
  uni.pageScrollTo({
    scrollTop: 0,
    duration: 300
  });
};

// 监听页面滚动
onMounted(async () => {
  console.log('<<<<< HOME.VUE ONMOUNTED STARTED >>>>>');
  loading.value = true;
  try {
    console.log('[home.vue onMounted] Stage 1: Before calling productService.getAllProductsForHome.');
    const res = await productService.getAllProductsForHome({ /* totalLimit: 20 */ }); // 调用新方法，可以传参控制数量
    console.log('[home.vue onMounted] Stage 2: After calling productService.getAllProductsForHome. Raw response:', res);

    try {
      console.log('[home.vue onMounted] Stage 3: Attempting to log stringified response. Response was:', JSON.parse(JSON.stringify(res)));
    } catch (stringifyError) {
      console.error('[home.vue onMounted] Stage 3 Error: Failed to stringify/parse API response for logging. Error:', stringifyError);
      console.log('[home.vue onMounted] Stage 3 Raw response (again):', res); 
    }

    if (res && res.success && Array.isArray(res.data)) {
      console.log('[home.vue onMounted] Stage 4: API call successful. Raw res.data:', JSON.parse(JSON.stringify(res.data)));
      
      const allProducts = res.data.map(p => {
        let processedImage = '/static/default-goods.png';
        let processedImagesArray = ['/static/default-goods.png'];
        let shopNameForDisplay = p.shop_name || '未知店铺'; // 后端现在会尝试填充 shop_name

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
              console.warn(`[home.vue product.map] JSON.parse for p.images failed for product_id ${p.product_id || p._id}, Images data: "${p.images}", Error: ${e.message}`);
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
          id: p.product_id || p._id?.toString(), 
          title: p.name || '商品名称加载中',
          description: p.description || '暂无描述',
          price: parseFloat(p.price) || 0,
          sold: parseInt(p.sold_count || p.sold || 0),
          image: processedImage,
          images: processedImagesArray,
          shop_id: p.shop_id, 
          shop_name: shopNameForDisplay,
          _id: p._id?.toString(),
          product_id: p.product_id || p._id?.toString(),
          link: `/pages/products/product-detail?id=${p.product_id || p._id?.toString()}&shop_id=${p.shop_id}`,
          is_customizable: p.is_customizable || false
        };
      });
      
      console.log('[home.vue onMounted] Stage 5: Processed allProducts:', JSON.parse(JSON.stringify(allProducts)));

      // 筛选商品
      const customizableProducts = allProducts.filter(p => p.is_customizable);
      const nonCustomizableProducts = allProducts.filter(p => !p.is_customizable);

      console.log('[home.vue onMounted] Stage 5.1: Customizable products found:', JSON.parse(JSON.stringify(customizableProducts)));
      console.log('[home.vue onMounted] Stage 5.2: Non-customizable products found:', JSON.parse(JSON.stringify(nonCustomizableProducts)));

      guessItems.value = customizableProducts.slice(0, 4);
      onSaleItemsPreview.value = nonCustomizableProducts.slice(0, 4);
      
      console.log('[home.vue onMounted] Stage 6: guessItems (customizable preview) populated:', JSON.parse(JSON.stringify(guessItems.value)));
      console.log('[home.vue onMounted] Stage 6.1: onSaleItemsPreview populated:', JSON.parse(JSON.stringify(onSaleItemsPreview.value)));

      const shuffledProducts = [...allProducts].sort(() => 0.5 - Math.random());

      banners.value = shuffledProducts.slice(0, 3).map(p_shuffled => ({
        id: p_shuffled.product_id || p_shuffled.id, // Use product_id from mapping
        shop_id: p_shuffled.shop_id,
        image: p_shuffled.image,
        title: p_shuffled.title, 
        link: p_shuffled.link
      }));
      console.log('[home.vue onMounted] Stage 7: Banners data populated.');

      promos.value = shuffledProducts.slice(Math.min(3, shuffledProducts.length), Math.min(3 + 2, shuffledProducts.length)).map(p_shuffled => ({
        id: p_shuffled.product_id || p_shuffled.id,
        shop_id: p_shuffled.shop_id,
        image: p_shuffled.image,
        tags: p_shuffled.tags, 
        title: p_shuffled.title,
        price: p_shuffled.price,
        originalPrice: p_shuffled.originalPrice, 
        link: p_shuffled.link
      }));
      console.log('[home.vue onMounted] Stage 8: Promos data populated.');

      hotItems.value = shuffledProducts.slice(Math.min(5, shuffledProducts.length), Math.min(5 + 4, shuffledProducts.length)).map(p_shuffled => ({
        id: p_shuffled.product_id || p_shuffled.id,
        shop_id: p_shuffled.shop_id,
        image: p_shuffled.image,
        title: p_shuffled.title,
        tag: p_shuffled.category_name || (p_shuffled.tags && p_shuffled.tags.length > 0 ? p_shuffled.tags[0] : '案例'),
        description: p_shuffled.description,
        price: p_shuffled.price,
        originalPrice: p_shuffled.originalPrice,
        sold: p_shuffled.sold,
        link: p_shuffled.link
      }));
      console.log('[home.vue onMounted] Stage 9: HotItems data populated.');

    } else {
      console.error('[home.vue onMounted] Stage 4 Error: API call failed or data is not in expected format. Response:', res);
      guessItems.value = []; 
      banners.value = [];
      promos.value = [];
      hotItems.value = [];
    }
  } catch (error) {
    console.error('[home.vue onMounted] Critical Error in onMounted try block:', error);
     guessItems.value = []; 
     banners.value = [];
     promos.value = [];
     hotItems.value = [];
  } finally {
    loading.value = false;
    console.log('[home.vue onMounted] Stage 10: loading set to false in finally block.');
  }
  
  scrollListener = (e) => {
    showBackToTop.value = e.scrollTop > 300;
  };
  
  uni.onPageScroll(scrollListener);
  
  console.log('[home.vue onMounted] Final Stage: Initialization complete, scroll listener attached.');
});

onUnmounted(() => {
  // 在uni-app中正确移除页面滚动监听
  // uni.offPageScroll在某些平台可能不可用，这里移除监听器时不再调用它
  scrollListener = null;
});

// 点击搜索框
const goSearch = () => {
  uni.navigateTo({
    url: '/pages/search/search'
  });
};

// 点击轮播图
const onBannerClick = (banner) => {
  uni.navigateTo({
    url: banner.link
  });
};

// 点击分类
const goToCategory = (category) => {
  uni.navigateTo({
    url: category.path
  });
};

// 点击服务项目
const goToService = (type) => {
  uni.navigateTo({
    url: `/pages/service/${type}`
  });
};

// 点击查看更多
const goToMore = (type) => {  
  if (type === 'promo') {    
    uni.navigateTo({      
      url: '/pages/products/promo-list'    
    });  
  } else if (type === 'cases') {    
    uni.navigateTo({      
      url: '/pages/products/case-list'    
    });  
  } else if (type === 'custom-products') {    
    uni.navigateTo({      
      url: '/pages/products/custom-list'    
    });  
  } else if (type === 'all-products') { // 新增：处理在售商品更多的导航
    uni.navigateTo({
      url: '/pages/products/all-products-list'
    });
  }
};

// 点击优惠活动
const goToPromo = (promo) => {
  uni.navigateTo({
    url: promo.link
  });
};

// 点击商品查看详情
const goToDetail = (item) => {
  navigateToProductDetail(item);
};

// 点击扫描二维码
const scanCode = () => {
  // 实现扫描二维码的功能
  console.log('扫描二维码');
};

const navigateToProductDetail = (item) => {
  // 确保 item.id 和 item.shop_id 存在
  if (item && item.id && item.shop_id) {
    uni.navigateTo({
      url: item.link // item.link 中已包含 shop_id
    });
  } else {
    console.error('[home.vue navigateToProductDetail] Failed to navigate: product id, shop_id or link is missing. Item:', JSON.parse(JSON.stringify(item)));
    uni.showToast({ title: '无法打开商品详情', icon:'none' });
  }
};
</script>

<style lang="scss">
.home-container {
  background-color: #f7f7f7;
  min-height: 100vh;
}

/* 搜索栏样式 */
.search-bar {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background-color: #ffffff;
  position: sticky;
  top: 0;
  z-index: 100;
  padding-top: calc(var(--status-bar-height) + 20rpx);
}

.search-box {
  flex: 1;
  border-radius: 50rpx;
  background-color: #f5f5f5;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  padding: 10rpx 20rpx;
  width: 100%;
  box-sizing: border-box;
}

.search-icon {
  margin-right: 10rpx;
  font-size: 28rpx;
}

.search-input {
  flex: 1;
  height: 60rpx;
  font-size: 28rpx;
}

.scan-icon {
  margin-left: 20rpx;
  font-size: 40rpx;
  color: #333;
}

/* 轮播图样式 */
.banner-swiper {
  width: 100%;
  height: 300rpx;
  position: relative;
}

.banner-image {
  width: 100%;
  height: 100%;
}

.banner-title {
  position: absolute;
  bottom: 30rpx;
  left: 20rpx;
  background-color: rgba(0,0,0,0.5);
  color: #fff;
  padding: 10rpx 20rpx;
  border-radius: 4rpx;
  font-size: 26rpx;
}

/* 我们的服务 */
.service-section {
  background-color: #fff;
  margin-bottom: 20rpx;
  padding: 20rpx 0;
}

.service-header {
  padding: 0 20rpx 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.service-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  position: relative;
  padding-left: 20rpx;
}

.service-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6rpx;
  height: 30rpx;
  width: 8rpx;
  background-color: var(--primary-color);
  border-radius: 4rpx;
}

.service-list {
  display: flex;
  justify-content: space-around;
  padding: 30rpx 0;
}

.service-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.service-icon {
  width: 80rpx;
  height: 80rpx;
  background-color: #f0f7ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  margin-bottom: 10rpx;
}

.service-name {
  font-size: 26rpx;
  color: #333;
}

/* 分类导航样式 */
.category-section {
  background-color: #fff;
  margin-bottom: 20rpx;
}

.category-nav {
  display: flex;
  flex-wrap: wrap;
  padding: 10rpx;
}

.category-item {
  width: 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20rpx 0;
}

.category-icon {
  width: 80rpx;
  height: 80rpx;
  margin-bottom: 10rpx;
}

.category-name {
  font-size: 24rpx;
  color: #333;
}

/* 通用区块样式 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  position: relative;
  padding-left: 20rpx;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6rpx;
  height: 30rpx;
  width: 8rpx;
  background-color: var(--primary-color);
  border-radius: 4rpx;
}

.more-link {
  font-size: 24rpx;
  color: #999;
}

/* 人气定制样式 */
.promo-section {
  background-color: #fff;
  margin-bottom: 20rpx;
  border-radius: 10rpx;
  overflow: hidden;
}

.promo-list {
  white-space: nowrap;
  padding: 20rpx;
  overflow-x: auto;
}

.promo-item {
  display: inline-block;
  width: 300rpx;
  margin-right: 20rpx;
  border-radius: 8rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
  position: relative;
}

.promo-image {
  width: 300rpx;
  height: 300rpx;
}

.promo-tags {
  position: absolute;
  top: 10rpx;
  left: 0;
  display: flex;
  flex-direction: column;
}

.promo-tag {
  font-size: 20rpx;
  background-color: rgba(0, 191, 166, 0.8);
  color: white;
  padding: 4rpx 10rpx;
  margin-bottom: 6rpx;
  border-radius: 0 4rpx 4rpx 0;
}

.promo-info {
  padding: 15rpx;
  background-color: #fff;
}

.promo-title {
  font-size: 26rpx;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.promo-price-row {
  display: flex;
  align-items: center;
  margin-top: 10rpx;
}

.promo-price {
  font-size: 28rpx;
  color: #ff4d4f;
  font-weight: bold;
}

.promo-original-price {
  font-size: 24rpx;
  color: #999;
  text-decoration: line-through;
  margin-left: 10rpx;
}

/* 定制案例样式 */
.hot-section {
  background-color: #fff;
  margin-bottom: 20rpx;
  border-radius: 10rpx;
  overflow: hidden;
}

.case-grid {
  display: flex;
  flex-wrap: wrap;
  padding: 10rpx;
}

.case-item {
  width: calc(50% - 20rpx);
  margin: 10rpx;
  background-color: #fff;
  border-radius: 8rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
  position: relative;
}

.case-image {
  width: 100%;
  height: 345rpx;
  background-color: #f5f5f5;
}

.case-info {
  padding: 15rpx;
}

.case-title {
  font-size: 26rpx;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.case-tag {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  background-color: rgba(255,77,79,0.8);
  color: #fff;
  font-size: 22rpx;
  padding: 6rpx 12rpx;
  border-radius: 4rpx;
}

/* 定制流程样式 */
.process-section {
  background-color: #fff;
  margin-bottom: 20rpx;
  padding-bottom: 20rpx;
  border-radius: 10rpx;
  overflow: hidden;
}

.process-list {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30rpx 20rpx;
}

.process-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.process-num {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: #fff;
  font-size: 30rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10rpx;
}

.process-name {
  font-size: 24rpx;
  color: #333;
}

.process-arrow {
  margin: 0 10rpx;
  color: #999;
  font-size: 24rpx;
}

/* 可定制商品样式 (保持不变，供两个区域复用) */
.guess-section {
  background-color: #fff;
  margin: 20rpx;
  border-radius: 16rpx;
  padding: 0; 
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.guess-section .goods-list {
  padding: 0 20rpx; 
}

.guess-section .goods-item {
  display: flex; 
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
  position: relative;
}
.guess-section .goods-item:last-child {
  border-bottom: none;
}

.guess-section .goods-image {
  width: 180rpx;
  height: 180rpx;
  border-radius: 8rpx;
  margin-right: 20rpx;
  background-color: #f5f5f5;
}

.guess-section .custom-badge {
  position: absolute;
  left: 0; 
  top: 0;  
  background-color: rgba(0, 191, 166, 0.8);
  color: white;
  font-size: 20rpx;
  padding: 4rpx 10rpx;
  border-radius: 8rpx 0 8rpx 0; 
  z-index: 1;
}

.guess-section .goods-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.guess-section .goods-title {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 10rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.guess-section .goods-desc {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 20rpx;
}

.guess-section .goods-price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.guess-section .goods-price {
  font-size: 30rpx;
  color: #ff4d4f;
  font-weight: bold;
}

.guess-section .goods-sales {
  font-size: 24rpx;
  color: #999;
}

/* 回到顶部按钮 */
.back-to-top {
  position: fixed;
  right: 30rpx;
  bottom: 120rpx;
  width: 80rpx;
  height: 80rpx;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.top-icon {
  font-size: 40rpx;
}

/* 底部安全区域 */
.safe-bottom {
  height: 120rpx;
}
</style> 