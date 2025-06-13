<template>
  <view class="search-result-container">
    <!-- 自定义导航栏 -->
    <view class="nav-header">
      <view class="status-bar"></view>
      <view class="nav-bar">
        <view class="back-btn" @click="goBack">
          <text class="back-icon">←</text>
        </view>
        <view class="search-box" @click="goToSearch">
          <text class="search-icon">🔍</text>
          <text class="search-keyword">{{ keyword }}</text>
        </view>
      </view>
    </view>
    
    <!-- 筛选排序栏 -->
    <view class="filter-bar">
      <view class="filter-item" :class="{'active': sortType === 'default'}" @click="changeSort('default')">
        <text>综合</text>
      </view>
      <view class="filter-item" :class="{'active': sortType === 'sales'}" @click="changeSort('sales')">
        <text>销量</text>
      </view>
      <view class="filter-item" :class="{'active': sortType === 'price'}" @click="changeSort('price')">
        <text>价格</text>
        <view class="sort-arrows">
          <text class="arrow up" :class="{'active': sortType === 'price' && sortOrder === 'asc'}">▲</text>
          <text class="arrow down" :class="{'active': sortType === 'price' && sortOrder === 'desc'}">▼</text>
        </view>
      </view>
      <view class="filter-item" @click="toggleFilterPanel">
        <text>筛选</text>
        <text class="filter-icon">⚑</text>
      </view>
    </view>
    
    <!-- 加载中 -->
    <view class="loading" v-if="loading">
      <text class="loading-text">加载中...</text>
    </view>
    
    <!-- 搜索结果为空 -->
    <view class="empty-result" v-if="!loading && searchResults.length === 0">
      <image src="/static/logo.png" class="empty-image" mode="widthFix"></image>
      <text class="empty-text">未找到"{{ keyword }}"相关商品</text>
      <text class="empty-tip">换个关键词试试吧</text>
      <button class="btn-back" @click="goToSearch">重新搜索</button>
    </view>
    
    <!-- 搜索结果 -->
    <view class="result-content" v-if="!loading && searchResults.length > 0">
      <view class="result-count">共找到 {{ searchResults.length }} 个相关商品</view>
      
      <!-- 商品列表 -->
      <view class="product-grid">
        <view 
          class="product-item" 
          v-for="(item, index) in searchResults" 
          :key="index"
          @click="goToDetail(item)"
        >
          <image :src="item.image || '/static/default-goods.png'" class="product-image" mode="aspectFill"></image>
          <view class="product-info">
            <text class="product-title">{{ item.title }}</text>
            <text class="product-price">¥{{ item.price.toFixed(2) }}起</text>
            <text class="product-sales">{{ item.sales }}人已定制</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 筛选面板 (可以根据需要添加更多筛选项) -->
    <view class="filter-panel" v-if="showFilterPanel" @click.stop>
      <view class="filter-panel-mask" @click="toggleFilterPanel"></view>
      <view class="filter-panel-content">
        <view class="filter-panel-header">
          <text class="filter-panel-title">筛选</text>
          <text class="filter-panel-close" @click="toggleFilterPanel">×</text>
        </view>
        
        <!-- 价格区间 -->
        <view class="filter-section">
          <text class="filter-section-title">价格区间</text>
          <view class="price-range">
            <input type="number" class="price-input" placeholder="最低价" v-model="minPrice" />
            <text class="price-separator">-</text>
            <input type="number" class="price-input" placeholder="最高价" v-model="maxPrice" />
          </view>
        </view>
        
        <!-- 排序方式 -->
        <view class="filter-section">
          <text class="filter-section-title">排序方式</text>
          <view class="sort-options">
            <view 
              class="sort-option" 
              :class="{'active': selectedSort === 'default'}" 
              @click="selectSort('default')"
            >
              <text>综合排序</text>
            </view>
            <view 
              class="sort-option" 
              :class="{'active': selectedSort === 'price_asc'}" 
              @click="selectSort('price_asc')"
            >
              <text>价格从低到高</text>
            </view>
            <view 
              class="sort-option" 
              :class="{'active': selectedSort === 'price_desc'}" 
              @click="selectSort('price_desc')"
            >
              <text>价格从高到低</text>
            </view>
            <view 
              class="sort-option" 
              :class="{'active': selectedSort === 'sales'}" 
              @click="selectSort('sales')"
            >
              <text>销量优先</text>
            </view>
          </view>
        </view>
        
        <!-- 筛选按钮 -->
        <view class="filter-actions">
          <button class="btn-reset" @click="resetFilter">重置</button>
          <button class="btn-confirm" @click="applyFilter">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import pageRefreshMixin from '@/mixins/pageRefresh.js';

// 从mixin中获取handlePageBack方法
const { handlePageBack } = pageRefreshMixin.methods;

// 路由参数
const keyword = ref('');
// 加载状态
const loading = ref(true);
// 排序类型
const sortType = ref('default');
// 排序顺序
const sortOrder = ref('desc');
// 是否显示筛选面板
const showFilterPanel = ref(false);
// 价格区间
const minPrice = ref('');
const maxPrice = ref('');
// 筛选面板中选择的排序方式
const selectedSort = ref('default');

// 原始搜索结果
const originalResults = ref([]);
// 搜索结果
const searchResults = ref([]);

// 所有商品数据 - 模拟数据
const allProducts = [
  {
    id: '1001',
    title: '定制T恤',
    description: '高品质纯棉定制T恤，支持多种颜色和尺码选择',
    price: 99.00,
    originalPrice: 129.00,
    sales: 1234,
    image: '/static/default-goods.png',
    link: '/pages/products/product-detail?id=1001',
    tags: ['服装定制', 'T恤', '企业定制']
  },
  {
    id: '1002',
    title: '925银个性化定制项链',
    description: '925银制作的个性化项链，可定制名字、生日或特殊日期',
    price: 199.00,
    originalPrice: 399.00,
    sales: 156,
    image: '/static/default-goods.png',
    link: '/pages/products/product-detail?id=1002',
    tags: ['首饰定制', '项链', '情侣']
  },
  {
    id: '1003',
    title: '个性皮质钱包定制',
    description: '头层牛皮制作的高品质钱包，可定制姓名、LOGO或简短语句',
    price: 168.00,
    originalPrice: 299.00,
    sales: 112,
    image: '/static/default-goods.png',
    link: '/pages/products/product-detail?id=1003',
    tags: ['皮具定制', '钱包', '礼品']
  },
  {
    id: '1004',
    title: '真丝印花围巾定制',
    description: '高档真丝面料制作的印花围巾，手感细腻，光泽柔和',
    price: 129.00,
    originalPrice: 259.00,
    sales: 65,
    image: '/static/default-goods.png',
    link: '/pages/products/product-detail?id=1004',
    tags: ['配饰定制', '围巾', '礼品']
  },
  {
    id: '2001',
    title: '时尚手链定制',
    description: '精致手链定制，可刻字、刻日期，适合情侣、闺蜜、纪念日礼物',
    price: 59.00,
    originalPrice: 79.00,
    sales: 800,
    image: '/static/default-goods.png',
    link: '/pages/products/product-detail?id=2001',
    tags: ['首饰定制', '手链', '情侣']
  },
  {
    id: '3001',
    title: '北欧风抱枕',
    description: '北欧风格家居抱枕，舒适美观',
    price: 39.00,
    originalPrice: 59.00,
    sales: 500,
    image: '/static/default-goods.png',
    link: '/pages/products/product-detail?id=3001',
    tags: ['家居定制', '抱枕', '装饰']
  },
  {
    id: '4001',
    title: '商务笔记本定制',
    description: '高档商务笔记本，可定制公司Logo或个人名字',
    price: 49.00,
    originalPrice: 69.00,
    sales: 950,
    image: '/static/default-goods.png',
    link: '/pages/products/product-detail?id=4001',
    tags: ['办公定制', '笔记本', '商务']
  },
  {
    id: '5001',
    title: '定制帆布袋',
    description: '环保帆布袋定制，适合企业宣传、活动赠品、日常购物使用',
    price: 29.00,
    originalPrice: 39.00,
    sales: 2300,
    image: '/static/default-goods.png',
    link: '/pages/products/product-detail?id=5001',
    tags: ['包装定制', '帆布袋', '企业']
  }
];

onMounted(() => {
  // 获取搜索关键词
  try {
    const pages = getCurrentPages();
    const page = pages[pages.length - 1];
    console.log('当前页面选项:', JSON.stringify(page.options));
    
    if (page && page.options && page.options.keyword) {
      keyword.value = decodeURIComponent(page.options.keyword);
      console.log('搜索关键词:', keyword.value);
    } else {
      console.warn('未获取到搜索关键词');
      // 尝试通过查询参数获取
      const query = location.search.substring(1);
      const params = new URLSearchParams(query);
      if (params.has('keyword')) {
        keyword.value = params.get('keyword');
        console.log('通过URL参数获取关键词:', keyword.value);
      }
    }
  } catch (error) {
    console.error('获取关键词失败:', error);
  }
  
  // 确保有测试数据
  console.log('可用的测试商品数据:', allProducts.length);
  
  // 执行搜索
  searchProducts();
});

// 执行搜索逻辑
const searchProducts = () => {
  loading.value = true;
  console.log('开始搜索，关键词:', keyword.value);
  
  // 立即进行搜索，不使用延迟
  try {
    // 如果没有关键词，显示所有商品
    if (!keyword.value) {
      console.log('无关键词，显示所有商品');
      originalResults.value = [...allProducts];
    } else {
      // 搜索标题、描述和标签
      const keywordLower = keyword.value.toLowerCase();
      
      originalResults.value = allProducts.filter(product => {
        const titleMatch = product.title.toLowerCase().includes(keywordLower);
        const descMatch = product.description.toLowerCase().includes(keywordLower);
        const tagMatch = product.tags.some(tag => tag.toLowerCase().includes(keywordLower));
        
        if (titleMatch || descMatch || tagMatch) {
          console.log('匹配商品:', product.title);
        }
        
        return titleMatch || descMatch || tagMatch;
      });
    }
    
    console.log('搜索结果数量:', originalResults.value.length);
    console.log('搜索结果:', originalResults.value.map(item => item.title));
    
    // 应用当前排序和筛选
    sortAndFilterResults();
  } catch (error) {
    console.error('搜索出错:', error);
    originalResults.value = [];
    searchResults.value = [];
  }
  
  loading.value = false;
};

// 排序和筛选结果
const sortAndFilterResults = () => {
  // 复制一份原始数据
  let results = [...originalResults.value];
  
  // 应用价格筛选
  if (minPrice.value && !isNaN(minPrice.value)) {
    results = results.filter(item => item.price >= Number(minPrice.value));
  }
  
  if (maxPrice.value && !isNaN(maxPrice.value)) {
    results = results.filter(item => item.price <= Number(maxPrice.value));
  }
  
  // 应用排序
  if (sortType.value === 'sales') {
    // 按销量排序
    results.sort((a, b) => b.sales - a.sales);
  } else if (sortType.value === 'price') {
    // 按价格排序
    if (sortOrder.value === 'asc') {
      results.sort((a, b) => a.price - b.price);
    } else {
      results.sort((a, b) => b.price - a.price);
    }
  }
  
  // 更新搜索结果
  searchResults.value = results;
};

// 切换排序方式
const changeSort = (type) => {
  if (type === sortType.value && type === 'price') {
    // 如果点击的是当前选中的价格排序，则切换升降序
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    // 否则切换排序类型，价格默认降序，其他类型不需要指定顺序
    sortType.value = type;
    if (type === 'price') {
      sortOrder.value = 'desc';
    }
  }
  
  // 应用新的排序
  sortAndFilterResults();
};

// 在筛选面板中选择排序方式
const selectSort = (sort) => {
  selectedSort.value = sort;
};

// 切换筛选面板显示状态
const toggleFilterPanel = () => {
  showFilterPanel.value = !showFilterPanel.value;
};

// 重置筛选条件
const resetFilter = () => {
  minPrice.value = '';
  maxPrice.value = '';
  selectedSort.value = 'default';
};

// 应用筛选条件
const applyFilter = () => {
  // 处理排序
  if (selectedSort.value === 'default') {
    sortType.value = 'default';
  } else if (selectedSort.value === 'sales') {
    sortType.value = 'sales';
  } else if (selectedSort.value === 'price_asc') {
    sortType.value = 'price';
    sortOrder.value = 'asc';
  } else if (selectedSort.value === 'price_desc') {
    sortType.value = 'price';
    sortOrder.value = 'desc';
  }
  
  // 应用新的筛选和排序
  sortAndFilterResults();
  
  // 关闭筛选面板
  showFilterPanel.value = false;
};

// 返回上一页
const goBack = () => {
  handlePageBack();
};

// 去搜索页
const goToSearch = () => {
  uni.navigateTo({
    url: '/pages/search/search'
  });
};

// 查看商品详情
const goToDetail = (item) => {
  console.log('跳转到商品详情:', item.id);
  uni.navigateTo({
    url: `/pages/products/product-detail?id=${item.id}`
  });
};
</script>

<style lang="scss">
.search-result-container {
  min-height: 100vh;
  background-color: #f7f7f7;
}

/* 导航栏 */
.nav-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background-color: #fff;
}

.status-bar {
  height: var(--status-bar-height);
  background-color: #fff;
}

.nav-bar {
  display: flex;
  align-items: center;
  height: 90rpx;
  padding: 0 30rpx;
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
  color: #333;
}

.search-box {
  flex: 1;
  height: 64rpx;
  background-color: #f5f5f5;
  border-radius: 32rpx;
  margin-left: 20rpx;
  padding: 0 20rpx;
  display: flex;
  align-items: center;
}

.search-icon {
  font-size: 28rpx;
  color: #999;
  margin-right: 10rpx;
}

.search-keyword {
  font-size: 28rpx;
  color: #333;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 筛选排序栏 */
.filter-bar {
  display: flex;
  background-color: #fff;
  height: 80rpx;
  margin-top: calc(var(--status-bar-height) + 90rpx);
  border-bottom: 1rpx solid #f0f0f0;
  position: sticky;
  top: calc(var(--status-bar-height) + 90rpx);
  z-index: 90;
}

.filter-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  font-size: 28rpx;
  color: #333;
}

.filter-item.active {
  color: #00BFA6;
  font-weight: 500;
}

.sort-arrows {
  display: flex;
  flex-direction: column;
  margin-left: 6rpx;
}

.arrow {
  font-size: 18rpx;
  line-height: 18rpx;
  color: #999;
}

.arrow.active {
  color: #00BFA6;
}

.filter-icon {
  margin-left: 8rpx;
  font-size: 24rpx;
}

/* 加载中 */
.loading {
  padding: 60rpx 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}

/* 空结果提示 */
.empty-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.empty-image {
  width: 200rpx;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #333;
  margin-bottom: 10rpx;
}

.empty-tip {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 40rpx;
}

.btn-back {
  height: 80rpx;
  line-height: 80rpx;
  width: 300rpx;
  background-color: #00BFA6;
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
}

/* 结果内容 */
.result-content {
  padding: 20rpx;
  margin-top: 80rpx;
}

.result-count {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 20rpx;
  padding: 0 10rpx;
}

/* 商品网格 */
.product-grid {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -10rpx;
}

.product-item {
  width: calc(50% - 20rpx);
  margin: 0 10rpx 20rpx;
  background-color: #fff;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.product-image {
  width: 100%;
  height: 320rpx;
  background-color: #f5f5f5;
}

.product-info {
  padding: 20rpx;
}

.product-title {
  font-size: 28rpx;
  color: #333;
  line-height: 1.4;
  height: 76rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-price {
  font-size: 32rpx;
  color: #ff4d4f;
  font-weight: bold;
  margin-top: 10rpx;
}

.product-sales {
  font-size: 24rpx;
  color: #999;
  margin-top: 6rpx;
}

/* 筛选面板 */
.filter-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

.filter-panel-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 1;
}

.filter-panel-content {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 70%;
  background-color: #fff;
  z-index: 2;
  display: flex;
  flex-direction: column;
}

.filter-panel-header {
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-panel-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.filter-panel-close {
  font-size: 40rpx;
  color: #999;
}

.filter-section {
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.filter-section-title {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 20rpx;
}

.price-range {
  display: flex;
  align-items: center;
}

.price-input {
  width: 180rpx;
  height: 70rpx;
  border: 1rpx solid #ddd;
  border-radius: 6rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
}

.price-separator {
  margin: 0 20rpx;
  color: #999;
}

.sort-options {
  display: flex;
  flex-wrap: wrap;
}

.sort-option {
  width: calc(50% - 20rpx);
  height: 70rpx;
  border: 1rpx solid #ddd;
  border-radius: 6rpx;
  margin: 0 10rpx 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #333;
}

.sort-option.active {
  color: #00BFA6;
  border-color: #00BFA6;
  background-color: rgba(0, 191, 166, 0.05);
}

.filter-actions {
  padding: 30rpx;
  border-top: 1rpx solid #f0f0f0;
  display: flex;
  margin-top: auto;
}

.btn-reset, .btn-confirm {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  font-size: 28rpx;
  border-radius: 40rpx;
}

.btn-reset {
  background-color: #f5f5f5;
  color: #333;
  margin-right: 20rpx;
}

.btn-confirm {
  background-color: #00BFA6;
  color: #fff;
}
</style> 