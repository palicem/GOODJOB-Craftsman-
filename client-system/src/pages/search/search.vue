<template>
  <view class="search-container">
    <!-- 搜索头部 -->
    <view class="search-header">
      <view class="search-input-wrap">
        <text class="search-icon">🔍</text>
        <input
          type="text"
          class="search-input"
          v-model="searchKeyword"
          placeholder="搜索定制商品或服务"
          confirm-type="search"
          @confirm="handleSearch"
          @input="handleInput"
          focus
          auto-focus
        />
        <text class="clear-icon" v-if="searchKeyword" @click="clearSearch">✕</text>
      </view>
      <text class="cancel-btn" @click="goBack">取消</text>
    </view>

    <!-- 搜索建议 -->
    <view class="search-suggestions" v-if="showSuggestions">
      <view class="suggestion-header">
        <text class="suggestion-title">搜索建议</text>
      </view>
      <view class="suggestion-list">
        <view
          class="suggestion-item"
          v-for="(item, index) in searchSuggestions"
          :key="index"
          @click="useSuggestion(item)"
        >
          <text class="suggestion-keyword">{{ item }}</text>
        </view>
      </view>
    </view>

    <!-- 搜索历史 -->
    <view class="search-history" v-if="!searchKeyword && searchHistory.length > 0 && !loading && searchResults.length === 0">
      <view class="history-header">
        <text class="history-title">搜索历史</text>
        <text class="clear-history" @click="clearHistory">清空</text>
      </view>
      <view class="history-list">
        <view
          class="history-item"
          v-for="(item, index) in searchHistory"
          :key="index"
          @click="useHistoryKeyword(item)"
        >
          <text class="history-keyword">{{ item }}</text>
        </view>
      </view>
    </view>

    <!-- 热门搜索 -->
    <view class="hot-search" v-if="!searchKeyword && !loading && searchResults.length === 0">
      <view class="hot-title">热门搜索</view>
      <view class="hot-list">
        <view
          class="hot-item"
          v-for="(item, index) in hotKeywords"
          :key="index"
          @click="useHistoryKeyword(item)"
        >
          <text class="hot-keyword">{{ item }}</text>
        </view>
      </view>
    </view>

    <!-- 搜索结果 -->
    <view class="search-results" v-if="searchKeyword && !loading && searchResults.length > 0">
      <view class="result-count">
        找到 {{ searchResults.length }} 个相关商品
      </view>
      <view class="product-list">
        <view
          class="product-item"
          v-for="(item, index) in searchResults"
          :key="index"
          @click="goToDetail(item)"
        >
          <image :src="item.image || '/static/logo.png'" class="product-image" mode="aspectFill"></image>
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
    </view>

    <!-- 搜索结果为空 -->
    <view class="empty-result" v-if="searchKeyword && !loading && searchResults.length === 0 && hasSearched">
      <text class="empty-text">暂无相关商品</text>
      <text class="empty-tip">换个关键词试试吧</text>
    </view>

    <!-- 加载中 -->
    <view class="loading" v-if="loading">
      <text class="loading-text">加载中...</text>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';

// 搜索关键词
const searchKeyword = ref('');
// 搜索历史
const searchHistory = ref([]);
// 热门搜索词
const hotKeywords = ref([
  '定制T恤',
  '企业礼品',
  '刻字项链',
  '印花帆布包',
  '个性杯子',
  '皮革钱包',
  '定制手机壳',
  '照片相框'
]);
// 搜索结果
const searchResults = ref([]);
// 搜索建议
const searchSuggestions = ref([]);
// 加载状态
const loading = ref(false);
// 是否显示搜索建议
const showSuggestions = ref(false);
// 是否已搜索过
const hasSearched = ref(false);

// 所有商品数据 - 模拟数据
const allProducts = [
  {
    id: 201,
    title: '高档商务西装定制套装',
    description: '面料可选，尺寸定制，细节可调',
    price: 999.0,
    sales: 89,
    image: '/static/logo.png',
    link: '/pages/products/product-detail?id=201',
    tags: ['服装定制', '西装', '商务']
  },
  {
    id: 202,
    title: '纯银刻字手链定制',
    description: '可刻名字、日期或个性文字',
    price: 299.0,
    sales: 156,
    image: '/static/logo.png',
    link: '/pages/products/product-detail?id=202',
    tags: ['首饰定制', '手链', '情侣']
  },
  {
    id: 203,
    title: '真皮名片夹定制',
    description: '可印LOGO、姓名，多色可选',
    price: 139.0,
    sales: 112,
    image: '/static/logo.png',
    link: '/pages/products/product-detail?id=203',
    tags: ['皮具定制', '商务', '礼品']
  },
  {
    id: 204,
    title: '桌面定制相框摆件',
    description: '水晶、木质材质可选，照片定制',
    price: 159.0,
    sales: 78,
    image: '/static/logo.png',
    link: '/pages/products/product-detail?id=204',
    tags: ['家居定制', '相框', '礼品']
  },
  {
    id: 205,
    title: '个性化丝巾定制',
    description: '图案设计定制，真丝材质',
    price: 239.0,
    sales: 65,
    image: '/static/logo.png',
    link: '/pages/products/product-detail?id=205',
    tags: ['配饰定制', '丝巾', '礼品']
  },
  {
    id: 206,
    title: '企业LOGO帆布袋定制',
    description: '环保材质，印刷精美，适合企业宣传',
    price: 35.0,
    sales: 208,
    image: '/static/logo.png',
    link: '/pages/products/product-detail?id=206',
    tags: ['包装定制', '帆布袋', '企业']
  },
  {
    id: 207,
    title: '定制生日礼盒套装',
    description: '包含定制卡片、小物件等，适合送礼',
    price: 199.0,
    sales: 145,
    image: '/static/logo.png',
    link: '/pages/products/product-detail?id=207',
    tags: ['礼品定制', '礼盒', '生日']
  },
  {
    id: 208,
    title: '定制家族族徽刻印',
    description: '传承家族文化，精美雕刻工艺',
    price: 799.0,
    sales: 32,
    image: '/static/logo.png',
    link: '/pages/products/product-detail?id=208',
    tags: ['家居定制', '徽章', '传家']
  },
  {
    id: '1001',
    title: '定制T恤',
    description: '高品质纯棉定制T恤，支持多种颜色和尺码选择',
    price: 99.00,
    sales: 1234,
    image: '/static/logo.png',
    link: '/pages/products/product-detail?id=1001',
    tags: ['服装定制', 'T恤', '企业定制']
  },
  {
    id: '1002',
    title: '925银个性化定制项链',
    description: '925银制作的个性化项链，可定制名字、生日或特殊日期',
    price: 199.00,
    sales: 156,
    image: '/static/logo.png',
    link: '/pages/products/product-detail?id=1002',
    tags: ['首饰定制', '项链', '情侣']
  },
  {
    id: '1003',
    title: '个性皮质钱包定制',
    description: '头层牛皮制作的高品质钱包，可定制姓名、LOGO或简短语句',
    price: 168.00,
    sales: 112,
    image: '/static/logo.png',
    link: '/pages/products/product-detail?id=1003',
    tags: ['皮具定制', '钱包', '礼品']
  },
  {
    id: '1004',
    title: '真丝印花围巾定制',
    description: '高档真丝面料制作的印花围巾，手感细腻，光泽柔和',
    price: 129.00,
    sales: 65,
    image: '/static/logo.png',
    link: '/pages/products/product-detail?id=1004',
    tags: ['配饰定制', '围巾', '礼品']
  },
  {
    id: '2001',
    title: '时尚手链定制',
    description: '精致手链定制，可刻字、刻日期，适合情侣、闺蜜、纪念日礼物',
    price: 59.00,
    sales: 800,
    image: '/static/logo.png',
    link: '/pages/products/product-detail?id=2001',
    tags: ['首饰定制', '手链', '情侣']
  },
  {
    id: '3001',
    title: '北欧风抱枕',
    description: '北欧风格家居抱枕，舒适美观',
    price: 39.00,
    sales: 500,
    image: '/static/logo.png',
    link: '/pages/products/product-detail?id=3001',
    tags: ['家居定制', '抱枕', '装饰']
  },
  {
    id: '4001',
    title: '商务笔记本定制',
    description: '高档商务笔记本，可定制公司Logo或个人名字',
    price: 49.00,
    sales: 950,
    image: '/static/logo.png',
    link: '/pages/products/product-detail?id=4001',
    tags: ['办公定制', '笔记本', '商务']
  },
  {
    id: '5001',
    title: '定制帆布袋',
    description: '环保帆布袋定制，适合企业宣传、活动赠品、日常购物使用',
    price: 29.00,
    sales: 2300,
    image: '/static/logo.png',
    link: '/pages/products/product-detail?id=5001',
    tags: ['包装定制', '帆布袋', '企业']
  }
];

// 商品索引系统
const productIndex = {
  // 商品名称索引
  nameIndex: new Map(),
  // 标签索引
  tagIndex: new Map(),
  // 分类索引
  categoryIndex: new Map(),
  // 初始化索引
  init(products) {
    products.forEach(product => {
      // 建立商品名称索引
      const words = product.title.split(/[\s,，、]+/);
      words.forEach(word => {
        if (!this.nameIndex.has(word)) {
          this.nameIndex.set(word, new Set());
        }
        this.nameIndex.get(word).add(product.id);
      });
      
      // 建立标签索引
      product.tags.forEach(tag => {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag).add(product.id);
      });
      
      // 建立分类索引
      const category = product.tags[0]; // 使用第一个标签作为主分类
      if (!this.categoryIndex.has(category)) {
        this.categoryIndex.set(category, new Set());
      }
      this.categoryIndex.get(category).add(product.id);
    });
    
    console.log('索引初始化完成');
    console.log('商品名称索引:', this.nameIndex.size);
    console.log('标签索引:', this.tagIndex.size);
    console.log('分类索引:', this.categoryIndex.size);
  },
  
  // 搜索商品
  search(keyword) {
    const results = new Set();
    const keywordLower = keyword.toLowerCase();
    
    // 1. 搜索商品名称
    for (const [word, productIds] of this.nameIndex) {
      if (word.toLowerCase().includes(keywordLower)) {
        productIds.forEach(id => results.add(id));
      }
    }
    
    // 2. 搜索标签
    for (const [tag, productIds] of this.tagIndex) {
      if (tag.toLowerCase().includes(keywordLower)) {
        productIds.forEach(id => results.add(id));
      }
    }
    
    // 3. 搜索分类
    for (const [category, productIds] of this.categoryIndex) {
      if (category.toLowerCase().includes(keywordLower)) {
        productIds.forEach(id => results.add(id));
      }
    }
    
    return Array.from(results);
  },
  
  // 获取搜索建议
  getSuggestions(keyword) {
    const suggestions = new Set();
    const keywordLower = keyword.toLowerCase();
    
    // 从商品名称中获取建议
    for (const [word, productIds] of this.nameIndex) {
      if (word.toLowerCase().includes(keywordLower)) {
        suggestions.add(word);
      }
    }
    
    // 从标签中获取建议
    for (const [tag, productIds] of this.tagIndex) {
      if (tag.toLowerCase().includes(keywordLower)) {
        suggestions.add(tag);
      }
    }
    
    return Array.from(suggestions).slice(0, 5);
  }
};

// 初始化
onMounted(() => {
  console.log('搜索页面初始化');
  console.log('测试数据商品数量:', allProducts.length);
  
  // 初始化商品索引
  productIndex.init(allProducts);
  
  // 从本地存储获取搜索历史
  try {
    const history = uni.getStorageSync('search_history');
    if (history) {
      searchHistory.value = JSON.parse(history);
    }
  } catch (e) {
    console.error('获取搜索历史失败:', e);
  }
});

// 监听输入，提供搜索建议
const handleInput = () => {
  if (searchKeyword.value.trim() === '') {
    showSuggestions.value = false;
    searchSuggestions.value = [];
    return;
  }
  
  // 获取搜索建议
  searchSuggestions.value = productIndex.getSuggestions(searchKeyword.value.trim());
  showSuggestions.value = searchSuggestions.value.length > 0;
};

// 执行搜索
const handleSearch = () => {
  if (!searchKeyword.value.trim()) return;
  
  // 保存到搜索历史
  saveSearchHistory(searchKeyword.value.trim());
  
  // 隐藏搜索建议
  showSuggestions.value = false;
  
  // 执行搜索，显示搜索结果
  loading.value = true;
  hasSearched.value = true;
  console.log('开始搜索:', searchKeyword.value);
  
  // 使用索引系统搜索商品
  const matchedIds = productIndex.search(searchKeyword.value.trim());
  searchResults.value = allProducts.filter(product => matchedIds.includes(product.id));
  
  console.log('搜索结果数量:', searchResults.value.length);
  console.log('搜索结果:', searchResults.value.map(item => item.title));
  
  loading.value = false;
};

// 使用搜索建议
const useSuggestion = (suggestion) => {
  searchKeyword.value = suggestion;
  handleSearch();
};

// 使用历史关键词
const useHistoryKeyword = (keyword) => {
  searchKeyword.value = keyword;
  handleSearch();
};

// 保存搜索历史
const saveSearchHistory = (keyword) => {
  // 去重
  const index = searchHistory.value.indexOf(keyword);
  if (index !== -1) {
    searchHistory.value.splice(index, 1);
  }
  
  // 添加到最前面
  searchHistory.value.unshift(keyword);
  
  // 只保留最近的10条
  if (searchHistory.value.length > 10) {
    searchHistory.value = searchHistory.value.slice(0, 10);
  }
  
  // 保存到本地存储
  try {
    uni.setStorageSync('search_history', JSON.stringify(searchHistory.value));
  } catch (e) {
    console.error('保存搜索历史失败:', e);
  }
};

// 清空搜索
const clearSearch = () => {
  searchKeyword.value = '';
  searchResults.value = [];
  showSuggestions.value = false;
  hasSearched.value = false;
};

// 清空历史
const clearHistory = () => {
  uni.showModal({
    title: '提示',
    content: '确定要清空搜索历史吗？',
    success: function(res) {
      if (res.confirm) {
        searchHistory.value = [];
        try {
          uni.removeStorageSync('search_history');
        } catch (e) {
          console.error('清空搜索历史失败:', e);
        }
      }
    }
  });
};

// 前往商品详情
const goToDetail = (item) => {
  console.log('跳转到商品详情:', item.id);
  uni.navigateTo({
    url: `/pages/products/product-detail?id=${item.id}`
  });
};

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};
</script>

<style lang="scss">
.search-container {
  background-color: #f7f8fa;
  min-height: 100vh;
}

/* 搜索头部 */
.search-header {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background-color: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  background-color: #f5f7fa;
  border-radius: 40rpx;
  padding: 10rpx 20rpx;
  flex: 1;
  position: relative;
}

.search-icon {
  margin-right: 10rpx;
  font-size: 28rpx;
  color: #999;
}

.search-input {
  flex: 1;
  height: 68rpx;
  font-size: 28rpx;
}

.clear-icon {
  font-size: 28rpx;
  color: #999;
  padding: 10rpx;
}

.cancel-btn {
  padding: 0 20rpx;
  font-size: 28rpx;
  color: #333;
}

/* 搜索历史 */
.search-history,
.hot-search {
  background-color: #fff;
  margin-top: 20rpx;
  padding: 20rpx;
}

.history-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.history-title,
.hot-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.clear-history {
  font-size: 24rpx;
  color: #999;
}

.history-list,
.hot-list {
  display: flex;
  flex-wrap: wrap;
}

.history-item,
.hot-item {
  background-color: #f5f7fa;
  padding: 10rpx 20rpx;
  border-radius: 30rpx;
  margin-right: 20rpx;
  margin-bottom: 20rpx;
}

.history-keyword,
.hot-keyword {
  font-size: 24rpx;
  color: #666;
}

/* 搜索结果 */
.search-results {
  margin-top: 20rpx;
}

.result-count {
  padding: 20rpx;
  font-size: 24rpx;
  color: #999;
  background-color: #fff;
}

.empty-result {
  padding: 100rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-text {
  font-size: 30rpx;
  color: #333;
  margin-bottom: 20rpx;
}

.empty-tip {
  font-size: 24rpx;
  color: #999;
}

/* 商品列表 */
.product-list {
  padding: 0 20rpx;
  background-color: #fff;
}

.product-item {
  display: flex;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.product-image {
  width: 180rpx;
  height: 180rpx;
  border-radius: 8rpx;
  margin-right: 20rpx;
  background-color: #f5f5f5;
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.product-title {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}

.product-desc {
  font-size: 24rpx;
  color: #999;
  margin: 10rpx 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-price {
  font-size: 30rpx;
  color: #ff4d4f;
  font-weight: bold;
}

.product-sales {
  font-size: 24rpx;
  color: #999;
}

/* 搜索建议 */
.search-suggestions {
  background-color: #fff;
  margin-top: 20rpx;
  padding: 20rpx;
}

.suggestion-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.suggestion-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.suggestion-list {
  display: flex;
  flex-wrap: wrap;
}

.suggestion-item {
  background-color: #f5f7fa;
  padding: 10rpx 20rpx;
  border-radius: 30rpx;
  margin-right: 20rpx;
  margin-bottom: 20rpx;
}

.suggestion-keyword {
  font-size: 24rpx;
  color: #666;
}

/* 加载中 */
.loading {
  text-align: center;
  padding: 30rpx 0;
}

.loading-text {
  font-size: 24rpx;
  color: #999;
}
</style> 