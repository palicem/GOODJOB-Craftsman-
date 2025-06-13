<template>
  <view class="product-detail-container" :style="containerStyle">
    <!-- 顶部导航栏 -->
    <view class="nav-header">
      <view class="status-bar"></view>
      <!-- Back button positioned absolutely -->
      <view class="back-btn" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <!-- Nav bar for title, centered with max-width on H5 -->
      <view class="nav-bar">
        <text class="nav-title">商品详情</text>
      </view>
    </view>
    
    <view class="content-area" v-if="!isLoading && product.id">
      <swiper class="product-swiper" :indicator-dots="true" :autoplay="true">
        <swiper-item v-for="(img, idx) in product.images" :key="idx">
          <image :src="img" class="product-image" mode="aspectFill" />
        </swiper-item>
      </swiper>
      <view class="product-info">
        <view class="product-title">{{ product.name }}</view>
        <view class="product-price">￥{{ product.price?.toFixed(2) }} <text class="original-price" v-if="product.originalPrice && product.originalPrice > product.price">￥{{ product.originalPrice?.toFixed(2) }}</text></view>
        <view class="product-meta">发货地：{{ product.location }} | 已售：{{ product.sold }}</view>
        <view class="product-shop" v-if="shop.name">店铺：<text class="shop-link" @click="goToShop">{{ shop.name }}</text></view>
        <view class="product-specs" @click="openSpecPopup">请选择规格 <text class="arrow">›</text></view>
      </view>
      <view class="product-detail-images">
        <image v-for="(img, idx) in product.detailImages" :key="idx" :src="img" class="detail-image" mode="widthFix" />
      </view>
    </view>
    <view v-else-if="isLoading" class="loading-placeholder">商品加载中...</view>
    <view v-else class="empty-placeholder">商品信息加载失败</view>

    <view class="bottom-bar" v-if="!showSpecPopup">
      <button class="btn-fav" @click="toggleFavorite" :disabled="isLoading || !product.id || isToggleFavoriteLoading">
        <image :src="isFavorite ? '/static/icons/favorited.png' : '/static/icons/favorite.png'" class="fav-icon"/>
        {{ isFavorite ? '已收藏' : (isToggleFavoriteLoading ? '处理中...' : '收藏') }}
      </button>
      <button class="btn-cs" @click="goToCustomerService" :disabled="isLoading || !product.id">
         <image src="/static/icons/customerservice.png" class="cs-icon"/>
        客服
      </button>
      <button class="btn-cart" @click="openSpecPopup('cart')" :disabled="isLoading || !product.id">加入购物车</button>
      <button class="btn-buy" @click="openSpecPopup('buy')" :disabled="isLoading || !product.id">购买</button>
    </view>
    <SpecPopup v-if="showSpecPopup" :product="product" :mode="specMode" @close="closeSpecPopup" @confirm="onSpecConfirm" />
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { usePageRefresh } from '@/mixins/pageRefresh.js';
import productService from '@/utils/productService.js';
import favoriteAPI from '@/utils/favoriteService.js';
import SpecPopup from '../../components/spec-popup.vue';
import { addToCart } from '../../utils/cartService';

const { handlePageBack } = usePageRefresh();

const productId = ref('');
const shopId = ref('');
const product = ref({});
const shop = ref({});
const isFavorite = ref(false);
const showSpecPopup = ref(false);
const specMode = ref('cart');
const isLoading = ref(true);
const isToggleFavoriteLoading = ref(false);

const containerStyle = computed(() => ({
  paddingBottom: showSpecPopup.value ? '0px' : '110rpx'
}));

onMounted(async () => {
  isLoading.value = true;
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = currentPage.options || {};
  
  productId.value = options.id || '';
  shopId.value = options.shop_id || '';
  
  if (!productId.value && typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    productId.value = urlParams.get('id') || productId.value;
    shopId.value = urlParams.get('shop_id') || shopId.value;
  }

  console.log(`[product-detail.vue onMounted] productId: ${productId.value}, shopId: ${shopId.value}`);

  if (productId.value && shopId.value) {
    await loadProductData();
  } else {
    console.error('[product-detail.vue onMounted] Missing productId or shopId');
    uni.showToast({
      title: '参数错误，无法加载商品',
      icon: 'none'
    });
    isLoading.value = false;
    product.value = { name: '商品参数错误' };
  }
});

const loadProductData = async () => {
  isLoading.value = true;
  try {
    const res = await productService.getProductDetail(shopId.value, productId.value);
    console.log('[product-detail.vue loadProductData] API response:', JSON.parse(JSON.stringify(res)));
    if (res.success && res.data) {
      let apiProduct = res.data;
      let processedImages = ['/static/default-goods.png'];
      if (apiProduct.images) {
        if (Array.isArray(apiProduct.images) && apiProduct.images.length > 0) {
          processedImages = apiProduct.images.map(img => img || '/static/default-goods.png');
        } else if (typeof apiProduct.images === 'string') {
          try {
            const parsedImages = JSON.parse(apiProduct.images);
            if (Array.isArray(parsedImages) && parsedImages.length > 0) {
              processedImages = parsedImages.map(img => img || '/static/default-goods.png');
            }
          } catch (e) { /* Do nothing, use default */ }
        }
      }
      
      product.value = {
        ...apiProduct,
        id: apiProduct.product_id || apiProduct._id,
        images: processedImages,
        detailImages: apiProduct.detail_images || [],
        price: parseFloat(apiProduct.price) || 0,
        originalPrice: parseFloat(apiProduct.original_price || apiProduct.price) || 0,
        sold: parseInt(apiProduct.sold) || 0,
        location: apiProduct.location || '未知',
        name: apiProduct.name || '商品名称加载中',
        shop_id_original: apiProduct.shop_id || apiProduct.shop_id_original || shopId.value,
        shopName: apiProduct.shop_name
      };
      
      shop.value = { 
        id: product.value.shop_id_original, 
        name: product.value.shopName || `店铺 ${product.value.shop_id_original}` 
      };

      if (productId.value) {
        isFavorite.value = await favoriteAPI.isProductFavorite(productId.value);
      }
    } else {
      product.value = { name: '获取商品详情失败' };
      uni.showToast({ title: res.message || '获取商品详情失败', icon: 'none' });
    }
  } catch (error) {
    console.error('[product-detail.vue loadProductData] Error fetching product details:', error);
    product.value = { name: '加载商品异常' };
    uni.showToast({ title: '加载商品详情出错', icon: 'none' });
  } finally {
    isLoading.value = false;
  }
};

const goBack = () => {
  handlePageBack();
};

const goToShop = () => {
  if (shop.value && shop.value.id) {
    uni.navigateTo({ url: `/pages/shop/shop-detail?id=${shop.value.id}` });
  } else {
    uni.showToast({title: "店铺信息不完整", icon: "none"});
  }
};

const openSpecPopup = (mode = 'cart') => {
  if (!product.value || !product.value.id) {
    uni.showToast({ title: '商品信息未加载', icon: 'none' });
    return;
  }
  specMode.value = mode;
  showSpecPopup.value = true;
};

const closeSpecPopup = () => {
  showSpecPopup.value = false;
};

const onSpecConfirm = (data) => {
  const { selectedSpecs, quantity } = data;

  const currentProduct = product.value;
  const currentShop = shop.value;
  if (!currentProduct || !currentProduct.id || !currentShop || !currentShop.id) {
      uni.showToast({ title: '商品或店铺信息不完整', icon: 'none' });
      return;
  }

  if (specMode.value === 'cart') {
    const cartItem = {
      id: currentProduct.id,
      goodsName: currentProduct.name,
      goodsImage: currentProduct.images[0] || '',
      price: Number(currentProduct.price) || 0,
      count: Number(quantity) || 1,
      shopName: currentShop.name || '默认店铺',
      shopId: currentShop.id, 
      spec: Object.entries(selectedSpecs).map(([key, value]) => `${key}: ${value}`).join(', '),
      selected: true
    };
    try {
      addToCart(cartItem);
      uni.showToast({ title: '已加入购物车', icon: 'success' });
      uni.$emit('update-cart-badge');
    } catch (err) {
      uni.showToast({ title: '添加购物车失败', icon: 'none' });
    }
  } else if (specMode.value === 'buy') {
    const orderData = {
      shopId: currentShop.id,
      productId: currentProduct.id,
      shopName: currentShop.name,
      goodsName: currentProduct.name,
      spec: Object.entries(selectedSpecs).map(([key, value]) => `${key}: ${value}`).join(' '),
      price: currentProduct.price,
      count: quantity,
      goodsImage: currentProduct.images[0],
      handlingFee: currentProduct.handling_fee !== undefined ? currentProduct.handling_fee : 0, 
      shippingFee: currentProduct.shipping_fee !== undefined ? currentProduct.shipping_fee : 5 
    };
    uni.setStorageSync('tempOrderData', orderData);
    uni.navigateTo({ url: '/pages/orders/trade' });
  }
  showSpecPopup.value = false;
};

const toggleFavorite = async () => {
  if (isLoading.value || !product.value.id || !product.value.shop_id_original || isToggleFavoriteLoading.value) {
    uni.showToast({ title: '商品信息不完整、正在加载或操作进行中', icon: 'none' });
    return;
  }
  const originalShopId = product.value.shop_id_original;
  isToggleFavoriteLoading.value = true;
  try {
    if (isFavorite.value) {
      const success = await favoriteAPI.removeProductFromFavorites(productId.value);
      if (success) {
        isFavorite.value = false;
        uni.showToast({ title: '已取消收藏', icon: 'success' });
      } else {
        // favoriteAPI内部已有提示，此时isFavorite.value保持true，按钮仍是"已收藏"
        // 如果remove失败（比如网络问题），状态不应改变
      }
    } else {
      const result = await favoriteAPI.addProductToFavorites(productId.value, originalShopId);
      if (result && result.success) {
        isFavorite.value = true;
        uni.showToast({ title: '收藏成功', icon: 'success' });
      } else if (result && result.alreadyExists) {
        isFavorite.value = true;
        // favoriteAPI内部已有toast提示 "该商品已在收藏中"
      } else {
        // 其他失败情况，favoriteAPI内部已有toast提示，isFavorite.value保持false
      }
    }
    uni.$emit('favoritesUpdated', { type: 'product', productId: productId.value, isFavorited: isFavorite.value });
  } catch (error) {
    uni.showToast({ title: '操作失败，请稍后重试', icon: 'none' });
  } finally {
    isToggleFavoriteLoading.value = false;
  }
};

const goToCustomerService = () => {
  console.log('goToCustomerService called. Product:', JSON.stringify(product.value, null, 2));
  console.log('goToCustomerService called. Shop:', JSON.stringify(shop.value, null, 2));

  if (!shop.value.id) {
      uni.showToast({title: '店铺信息不全，无法联系客服', icon: 'none'});
      return;
  }
  if (!product.value || !product.value.id) {
      uni.showToast({title: '商品信息不全，无法联系客服', icon: 'none'});
      return;
  }

  const shopIdParam = shop.value.id;
  const shopNameParam = shop.value.name ? encodeURIComponent(shop.value.name) : '';
  
  // Product related params
  const productIdParam = product.value.id;
  const productNameParam = product.value.name ? encodeURIComponent(product.value.name) : '';
  const productImageParam = product.value.images && product.value.images.length > 0 
                           ? encodeURIComponent(product.value.images[0]) 
                           : '';
  const productPriceParam = product.value.price !== undefined 
                           ? encodeURIComponent(product.value.price.toString()) 
                           : '';

  let url = `/pages/chat/customer-service?shopId=${shopIdParam}`;
  if (shopNameParam) url += `&shopName=${shopNameParam}`;
  if (productNameParam) url += `&productName=${productNameParam}`;
  if (productIdParam) url += `&productId=${productIdParam}`;
  if (productImageParam) url += `&productImage=${productImageParam}`;
  if (productPriceParam) url += `&productPrice=${productPriceParam}`;

  console.log('[product-detail] Navigating to customer service with URL:', url);
  uni.navigateTo({ url });
};
</script>

<style lang="scss" scoped>
$theme-color: #00bfa5; // 主题色定义，与您图片接近的青绿色
$text-color-primary: #303133; // 主要文字颜色
$text-color-secondary: #606266; // 次要文字颜色
$text-color-placeholder: #909399; // 占位符和提示文字颜色
$border-color-light: #ebeef5; // 浅色边框
$background-color-page: #f4f4f4; // 页面背景色
$price-color: #fa3534; // 价格红色保持不变，或者也可以改为主题色，看您的偏好

.product-detail-container {
  background-color: $background-color-page;
  min-height: 100vh;
  /* padding-bottom: 110rpx; */ /* 为底部操作栏预留空间，已通过containerStyle动态控制 */
  /* #ifdef H5 */
  max-width: 750rpx;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  position: relative; /* Ensures proper stacking context and reference for potential absolute children */
  overflow-x: hidden; /* Prevents horizontal scrollbars if content accidentally overflows max-width */
  /* #endif */
}

/* 导航栏 */
.nav-header {
  position: fixed;
  width: 100%; 
  top: 0;
  left: 0; 
  z-index: 1001; 
  background-color: $theme-color; 
  /* H5 specific width/centering removed from here */
}

.status-bar {
  height: var(--status-bar-height, 0px);
  width: 100%;
}

.nav-bar { /* This is now primarily for the title's positioning and H5 max-width */
  display: flex;
  align-items: center;
  justify-content: center; /* Center the title */
  height: 90rpx;
  color: #ffffff; 
  margin-top: var(--status-bar-height, 0px); /* Position below status bar */
  /* #ifdef H5 */
  max-width: 750rpx;
  width: 100%; /* Takes full width up to max-width */
  margin-left: auto;
  margin-right: auto;
  /* #endif */
  /* padding: 0 20rpx; /* Padding removed as back button is separate and nav-bar only centers title */
}

.back-btn { 
  position: absolute;
  left: 20rpx; /* Adjust as needed for padding from screen edge */
  top: var(--status-bar-height, 0px); /* Align with top of nav-bar content area */
  height: 90rpx; /* Match nav-bar content height */
  width: 60rpx; 
  display: flex; 
  align-items: center; 
  justify-content: center;
  z-index: 2; /* Ensure it's clickable */
}
.back-icon { font-size: 40rpx; font-weight: bold; color: #ffffff;}
.nav-title { font-size: 32rpx; font-weight: 500; color: #ffffff; }
/* .placeholder { width: 60rpx; } */ /* Style for placeholder removed */

/* 内容区 */
.content-area {
  margin-top: calc(var(--status-bar-height, 0px) + 90rpx);
  padding-bottom: 20rpx; 
}

.loading-placeholder, .empty-placeholder {
  text-align: center;
  color: $text-color-placeholder;
  padding: 100rpx 40rpx;
  font-size: 28rpx;
  background-color: #ffffff; 
  min-height: 300rpx; 
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

/* 轮播图 */
.product-swiper { width: 100%; height: 750rpx; }
.product-image { width: 100%; height: 100%; background-color: #e9e9e9; }

/* 商品信息 */
.product-info {
  padding: 24rpx 30rpx;
  background-color: #ffffff;
  margin-bottom: 16rpx; 
}

.product-title {
  font-size: 34rpx; /* 略微调整 */
  font-weight: 500; /* 不用最粗，但保持清晰 */
  color: $text-color-primary;
  line-height: 1.45;
  margin-bottom: 12rpx; 
}

.product-price {
  font-size: 40rpx; 
  color: $price-color; 
  font-weight: bold;
  margin-bottom: 10rpx;
  display: flex; 
  align-items: baseline;
}

.original-price {
  font-size: 26rpx;
  color: $text-color-placeholder;
  text-decoration: line-through;
  margin-left: 16rpx;
  font-weight: normal;
}

.product-meta {
  font-size: 24rpx;
  color: $text-color-secondary;
  margin-bottom: 16rpx;
}

.product-shop {
  font-size: 26rpx;
  color: $text-color-secondary;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
}

.shop-link {
  color: $theme-color; /* 店铺链接使用主题色 */
  margin-left: 10rpx;
  font-weight: 500;
}

/* 规格选择 */
.product-specs {
  padding: 24rpx 0; /* 上下边距 */
  font-size: 28rpx;
  color: $text-color-primary;
  border-top: 1rpx solid $border-color-light;
  // border-bottom: 1rpx solid $border-color-light; /* 底部通常是详情图，这条线可能不需要 */
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff; /* 确保白色背景 */
  padding-left: 30rpx; /* 与product-info对齐 */
  padding-right: 30rpx;
  margin-bottom: 16rpx; /* 与下方内容块的间距 */
}
.arrow { font-size: 30rpx; color: $text-color-placeholder; }

/* 商品详情图片 */
.product-detail-images {
  background-color: #ffffff;
  // padding-top: 20rpx; /* 如果上面是白色背景，这里可以不需要上边距 */
}
.detail-image { width: 100%; display: block; }

/* 底部操作栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0; // Generic
  right: 0; // Generic
  display: flex;
  align-items: stretch; 
  height: 100rpx; 
  background-color: #ffffff;
  border-top: 1rpx solid $border-color-light;
  padding: 0;
  z-index: 1000;
  /* #ifdef H5 */
  width: 750rpx; // H5 specific width
  left: 50%;    // H5 specific left, overrides generic left:0
  right: auto;  // Override generic right:0 to avoid conflict with left:50% + transform
  transform: translateX(-50%);
  /* #endif */
}

.btn-fav, .btn-cs {
  flex: 0.8; /* 调整flex比例，给购买按钮更多空间 */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
  color: $text-color-secondary;
  background: none;
  border: none;
  line-height: 1.2;
  padding: 0;
  margin:0;
  border-radius: 0;
}

.btn-fav::after, .btn-cs::after { border: none; }

.fav-icon, .cs-icon {
    width: 38rpx;
    height: 38rpx;
    margin-bottom: 4rpx;
}

.btn-cart, .btn-buy {
  flex: 1.2; /* 调整flex比例 */
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 500;
  border: none;
  border-radius: 0;
  margin: 0;
  padding: 0;
}

.btn-cart {
  background-color: #ff9f00; /* 鲜明橙色 */
}

.btn-buy {
  background-color: $theme-color; /* 主题色 */
}

.bottom-bar button:disabled {
  opacity: 0.65;
  // cursor: not-allowed; /* uni-app不支持 */
}
</style> 