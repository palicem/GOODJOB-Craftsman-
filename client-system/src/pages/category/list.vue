<template>
  <view class="category-container">
    <!-- 顶部导航 -->
    <view class="nav-header">
      <view class="status-bar"></view>
      <view class="nav-bar">
        <view class="back-btn" @click="goBack">
          <text class="back-icon">←</text>
        </view>
        <text class="nav-title">分类商品</text>
        <view class="placeholder"></view>
      </view>
    </view>

    <!-- 分类导航栏 -->
    <view class="category-bar">
      <scroll-view scroll-x class="category-scroll" show-scrollbar="false">
        <view 
          class="category-tab" 
          :class="{ active: activeCategoryId === 0 }"
          @click="changeCategory(0)"
        >
          全部
        </view>
        <view 
          class="category-tab" 
          v-for="(name, id) in filteredCategories" 
          :key="id"
          :class="{ active: activeCategoryId === Number(id) }"
          @click="changeCategory(Number(id))"
        >
          {{ name }}
        </view>
      </scroll-view>
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

// 当前选中的分类ID
const activeCategoryId = ref(0);
// 排序方式
const sortType = ref('default');
// 价格是否降序
const priceDesc = ref(true);
// 商品数据
const products = ref([]);

// 模拟的商品数据 - 应该从API获取
const categoryProducts = {
  // 服装定制
  1: [
    { 
      id: 1001, 
      title: '高档商务西装定制套装',
      description: '面料可选，尺寸定制，细节可调',
      price: 999.00,
      sales: 89,
      image: '/static/logo.png',
      link: '/pages/products/product-detail?id=1001',
      tags: ['服装定制', '西装', '商务'],
      customizable: true
    },
    { 
      id: 1002, 
      title: '企业文化衫定制',
      description: '多种面料可选，支持企业LOGO印制',
      price: 68.00,
      sales: 256,
      image: '/static/logo.png',
      link: '/pages/products/product-detail?id=1002',
      tags: ['服装定制', 'T恤', '企业'],
      customizable: true
    },
    { 
      id: 1003, 
      title: '情侣卫衣定制',
      description: '舒适保暖，可印制照片和文字',
      price: 138.00,
      sales: 156,
      image: '/static/logo.png',
      link: '/pages/products/product-detail?id=1003',
      tags: ['服装定制', '卫衣', '情侣'],
      customizable: true
    }
  ],
  // 首饰定制
  2: [
    { 
      id: 2001, 
      title: '纯银刻字手链定制',
      description: '可刻名字、日期或个性文字',
      price: 299.00,
      sales: 156,
      image: '/static/logo.png',
      link: '/pages/products/product-detail?id=2001',
      tags: ['首饰定制', '手链', '情侣'],
      customizable: true
    },
    { 
      id: 2002, 
      title: '个性化定制宝石项链',
      description: '多种宝石可选，支持定制吊坠',
      price: 589.00,
      sales: 98,
      image: '/static/logo.png',
      link: '/pages/products/product-detail?id=2002',
      tags: ['首饰定制', '项链', '礼物'],
      customizable: true
    }
  ],
  // 皮具定制
  3: [
    { 
      id: 3001, 
      title: '真皮名片夹定制',
      description: '可印LOGO、姓名，多色可选',
      price: 139.00,
      sales: 112,
      image: '/static/logo.png',
      link: '/pages/products/product-detail?id=3001',
      tags: ['皮具定制', '商务', '礼品'],
      customizable: true
    },
    { 
      id: 3002, 
      title: '个性皮质钱包定制',
      description: '可印刷个人照片，刻字，礼盒包装',
      price: 228.00,
      sales: 146,
      image: '/static/logo.png',
      link: '/pages/products/product-detail?id=3002',
      tags: ['皮具定制', '钱包', '礼品'],
      customizable: true
    }
  ],
  // 家居定制
  4: [
    { 
      id: 4001, 
      title: '桌面定制相框摆件',
      description: '水晶、木质材质可选，照片定制',
      price: 159.00,
      sales: 78,
      image: '/static/logo.png',
      link: '/pages/products/product-detail?id=4001',
      tags: ['家居定制', '相框', '礼品'],
      customizable: true
    },
    { 
      id: 4002, 
      title: '个性化抱枕定制',
      description: '高清照片印刷，柔软舒适',
      price: 88.00,
      sales: 205,
      image: '/static/logo.png',
      link: '/pages/products/product-detail?id=4002',
      tags: ['家居定制', '抱枕', '礼品'],
      customizable: true
    }
  ],
  // 包装定制
  5: [
    { 
      id: 5001, 
      title: '企业LOGO帆布袋定制',
      description: '环保材质，印刷精美，适合企业宣传',
      price: 35.00,
      sales: 208,
      image: '/static/logo.png',
      link: '/pages/products/product-detail?id=5001',
      tags: ['包装定制', '帆布袋', '企业'],
      customizable: true
    },
    { 
      id: 5002, 
      title: '高档礼品盒定制',
      description: '烫金印刷，多种材质可选',
      price: 65.00,
      sales: 145,
      image: '/static/logo.png',
      link: '/pages/products/product-detail?id=5002',
      tags: ['包装定制', '礼品盒', '礼品'],
      customizable: true
    }
  ],
  // 配饰定制
  6: [
    { 
      id: 6001, 
      title: '个性化丝巾定制',
      description: '图案设计定制，真丝材质',
      price: 239.00,
      sales: 65,
      image: '/static/logo.png',
      link: '/pages/products/product-detail?id=6001',
      tags: ['配饰定制', '丝巾', '礼品'],
      customizable: true
    },
    { 
      id: 6002, 
      title: '定制手表表盘',
      description: '照片或图案印刷，多款表带可选',
      price: 268.00,
      sales: 87,
      image: '/static/logo.png',
      link: '/pages/products/product-detail?id=6002',
      tags: ['配饰定制', '手表', '礼品'],
      customizable: true
    }
  ],
  // 礼品定制
  7: [
    { 
      id: 7001, 
      title: '定制生日礼盒套装',
      description: '包含定制卡片、小物件等，适合送礼',
      price: 199.00,
      sales: 145,
      image: '/static/logo.png',
      link: '/pages/products/product-detail?id=7001',
      tags: ['礼品定制', '礼盒', '生日'],
      customizable: true
    },
    { 
      id: 7002, 
      title: '个性水杯定制',
      description: '不锈钢保温杯，可印制照片和文字',
      price: 99.00,
      sales: 320,
      image: '/static/logo.png',
      link: '/pages/products/product-detail?id=7002',
      tags: ['礼品定制', '杯子', '生活'],
      customizable: true
    }
  ]
};

// 分类名称映射
const categoryNames = {
  1: '服装定制',
  2: '首饰定制',
  3: '皮具定制',
  4: '家居定制',
  5: '包装定制',
  6: '配饰定制',
  7: '礼品定制',
  8: '更多分类',
  9: '电子产品',
  10: '文具定制'
};

// 过滤后的分类（不包含"更多分类"）
const filteredCategories = computed(() => {
  const result = {};
  Object.entries(categoryNames).forEach(([id, name]) => {
    // 确保id为8的"更多分类"不会被包含
    if (Number(id) !== 8) {
      result[id] = name;
    }
  });
  return result;
});

// 根据排序条件排序商品
const sortedProducts = computed(() => {
  let result = [...products.value];
  
  if (sortType.value === 'sales') {
    // 按销量排序
    result.sort((a, b) => b.sales - a.sales);
  } else if (sortType.value === 'price') {
    // 按价格排序
    if (priceDesc.value) {
      result.sort((a, b) => b.price - a.price);
    } else {
      result.sort((a, b) => a.price - b.price);
    }
  }
  
  return result;
});

// 页面加载
onMounted(() => {
  // 获取路由参数
  const query = uni.getLaunchOptionsSync().query || {};
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = currentPage.options || {};
  
  // 获取分类ID
  const categoryId = parseInt(options.id || query.id || 0);
  
  // 设置当前分类
  if (categoryId && categoryNames[categoryId]) {
    activeCategoryId.value = categoryId;
  }
  
  // 加载商品数据
  loadProducts();
});

// 加载商品数据
const loadProducts = () => {
  // 模拟加载数据
  setTimeout(() => {
    if (activeCategoryId.value > 0 && categoryProducts[activeCategoryId.value]) {
      products.value = categoryProducts[activeCategoryId.value];
    } else {
      // 如果是"全部"或无效分类ID，显示所有商品
      products.value = Object.values(categoryProducts).flat();
    }
  }, 500);
};

// 切换分类
const changeCategory = (id) => {
  activeCategoryId.value = id;
  loadProducts();
};

// 改变排序方式
const changeSortType = (type) => {
  if (type === 'price' && sortType.value === 'price') {
    // 切换价格升降序
    priceDesc.value = !priceDesc.value;
  } else {
    sortType.value = type;
  }
};

// 切换筛选面板
const toggleFilter = () => {
  uni.showToast({
    title: '筛选功能开发中',
    icon: 'none'
  });
};

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 前往商品详情
const goToDetail = (item) => {
  uni.navigateTo({
    url: item.link
  });
};
</script>

<style lang="scss">
.category-container {
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

/* 分类导航栏样式 */
.category-bar {
  margin-top: calc(var(--status-bar-height, 25px) + 90rpx);
  background-color: #fff;
  height: 80rpx;
  width: 100%;
  border-bottom: 1rpx solid #f0f0f0;
  position: sticky;
  top: calc(var(--status-bar-height, 25px) + 90rpx);
  z-index: 10;
}

.category-scroll {
  width: 100%;
  height: 100%;
  white-space: nowrap;
}

.category-tab {
  display: inline-block;
  padding: 0 30rpx;
  height: 80rpx;
  line-height: 80rpx;
  font-size: 28rpx;
  color: #666;
  position: relative;
  
  &.active {
    color: #00BFA6;
    font-weight: 500;
    
    &::after {
      content: '';
      position: absolute;
      left: 50%;
      bottom: 0;
      transform: translateX(-50%);
      width: 40rpx;
      height: 4rpx;
      background-color: #00BFA6;
      border-radius: 2rpx;
    }
  }
}

/* 筛选栏样式 */
.filter-bar {
  display: flex;
  align-items: center;
  height: 80rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #f0f0f0;
  position: sticky;
  top: calc(var(--status-bar-height, 25px) + 90rpx + 80rpx);
  z-index: 9;
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