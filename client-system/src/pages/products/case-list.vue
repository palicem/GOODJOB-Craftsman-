<template>
  <view class="case-container">
    <!-- 顶部导航 -->
    <view class="nav-header">
      <view class="status-bar"></view>
      <view class="nav-bar">
        <view class="back-btn" @click="goBack">
          <text class="back-icon">←</text>
        </view>
        <text class="nav-title">定制案例</text>
        <view class="placeholder"></view>
      </view>
    </view>

    <!-- 案例过滤栏 -->
    <view class="filter-bar">
      <view class="filter-scroll-view">
        <scroll-view scroll-x class="filter-scroll" show-scrollbar="false">
          <view 
            class="filter-item" 
            :class="{ active: activeTab === 'all' }"
            @click="changeTab('all')"
          >
            全部
          </view>
          <view 
            class="filter-item" 
            :class="{ active: activeTab === '服装定制' }"
            @click="changeTab('服装定制')"
          >
            服装定制
          </view>
          <view 
            class="filter-item" 
            :class="{ active: activeTab === '首饰定制' }"
            @click="changeTab('首饰定制')"
          >
            首饰定制
          </view>
          <view 
            class="filter-item" 
            :class="{ active: activeTab === '皮具定制' }"
            @click="changeTab('皮具定制')"
          >
            皮具定制
          </view>
          <view 
            class="filter-item" 
            :class="{ active: activeTab === '家居定制' }"
            @click="changeTab('家居定制')"
          >
            家居定制
          </view>
          <view 
            class="filter-item" 
            :class="{ active: activeTab === '配饰定制' }"
            @click="changeTab('配饰定制')"
          >
            配饰定制
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 案例列表 -->
    <view class="case-list" v-if="filteredCases.length > 0">
      <view 
        class="case-item" 
        v-for="(item, index) in filteredCases" 
        :key="index"
        @click="goToDetail(item)"
      >
        <image :src="item.image" class="case-image" mode="aspectFill"></image>
        <view class="case-info">
          <text class="case-title">{{ item.title }}</text>
          <text class="case-desc">{{ item.description }}</text>
          <view class="case-meta">
            <view class="case-tag">{{ item.tags[0] }}</view>
            <text class="case-price">¥{{ item.price.toFixed(2) }}起</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-else>
      <image src="/static/logo.png" class="empty-image"></image>
      <text class="empty-text">暂无相关案例</text>
    </view>

    <!-- 底部安全区域 -->
    <view class="safe-bottom"></view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { usePageRefresh } from '@/mixins/pageRefresh.js';
import productService from '@/utils/productService.js'; // 导入 productService

// 调用组合式函数以获取 handlePageBack 和执行 onLoad 逻辑
const { handlePageBack } = usePageRefresh();

const cases = ref([]); // 将由API填充
const activeTab = ref('all');
const loading = ref(false); // 添加loading状态

const filteredCases = computed(() => {
  if (activeTab.value === 'all') {
    return cases.value;
  } else {
    // 确保 item.tags 是一个数组并且包含 activeTab.value
    return cases.value.filter(item => Array.isArray(item.tags) && item.tags.includes(activeTab.value));
  }
});

onMounted(async () => {
  loading.value = true;
  cases.value = []; // 清空旧数据
  const shopId = 'shop001'; // 暂时硬编码，与 home.vue 保持一致
  console.log(`[case-list.vue] Loading case products for shopId: ${shopId}`);

  try {
    const res = await productService.getProductsByShop(shopId);
    if (res && res.success && Array.isArray(res.data)) {
      // 假设案例也是普通商品的一部分，或者将来有特定API
      // 这里我们简单地将所有获取到的商品作为"案例"，后续可以根据业务逻辑调整
      // (例如，只取一部分，或者API直接返回案例商品，或者商品本身有 is_case 标记)
      cases.value = res.data.map(p => {
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

        // 确保 tags 是数组，并且至少有一个元素，以便模板中的 item.tags[0] 不会出错
        let tagsArray = [];
        if (Array.isArray(p.tags) && p.tags.length > 0) {
          tagsArray = p.tags;
        } else if (typeof p.tags === 'string' && p.tags.trim() !== '') {
          tagsArray = p.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
        }
        if (tagsArray.length === 0 && p.category_name) { // 如果没有tag，尝试使用 category_name
            tagsArray = [p.category_name];
        }
        if (tagsArray.length === 0) { // 如果仍然没有，提供一个默认tag
            tagsArray = ['精选案例']; 
        }

        return {
          ...p,
          id: p.product_id || p._id,
          shop_id: p.shop_id || shopId,
          title: p.name || '案例标题缺失', // 对应模板 case-title
          description: p.description || '暂无描述', // 对应模板 case-desc
          image: processedImage, // 对应模板 case-image
          price: p.price !== undefined ? Number(p.price) : 0, // 对应模板 case-price
          // sales: p.sold_count !== undefined ? Number(p.sold_count) : (p.sold !== undefined ? Number(p.sold) : 0), // 模板中未使用 sales
          tags: tagsArray, // 对应模板 case-tag (item.tags[0])
          link: `/pages/products/product-detail?id=${p.product_id || p._id}&shop_id=${p.shop_id || shopId}`
          // customizable: p.customizable !== undefined ? p.customizable : true, // 模板中未使用
          // caseImages: p.case_images || [] // 模板中未使用
        };
      });
      console.log('[case-list.vue] Case products loaded and mapped:', JSON.parse(JSON.stringify(cases.value)));
    } else {
      console.error('[case-list.vue] Failed to fetch case products or data is invalid:', res);
      cases.value = [];
    }
  } catch (error) {
    console.error('[case-list.vue] Error fetching case products:', error);
    cases.value = [];
  } finally {
    loading.value = false;
  }
});

// 切换标签
const changeTab = (tab) => {
  activeTab.value = tab;
};

// 返回上一页
const goBack = () => {
  handlePageBack();
};

// 前往案例详情
const goToDetail = (item) => {
  if (item && item.id && item.shop_id) {
    uni.navigateTo({
      url: item.link
    });
  } else {
    console.error('[case-list.vue] Failed to navigate: product id or shop_id is missing. Item:', item);
    uni.showToast({ title: '无法打开案例详情', icon: 'none' });
  }
};
</script>

<style lang="scss">
.case-container {
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

/* 过滤栏样式 */
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
  white-space: nowrap;
}

.filter-scroll-view {
  width: 100%;
  height: 100%;
}

.filter-scroll {
  width: 100%;
  height: 100%;
  white-space: nowrap;
}

.filter-item {
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

/* 案例列表样式 */
.case-list {
  display: flex;
  flex-direction: column;
  padding: 20rpx;
}

.case-item {
  background-color: #fff;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.case-image {
  width: 100%;
  height: 320rpx;
}

.case-info {
  padding: 20rpx;
}

.case-title {
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
  line-height: 1.4;
  margin-bottom: 10rpx;
}

.case-desc {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 20rpx;
}

.case-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.case-tag {
  font-size: 22rpx;
  color: #00BFA6;
  background-color: rgba(0, 191, 166, 0.1);
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
}

.case-price {
  font-size: 28rpx;
  color: #FF6B00;
  font-weight: 500;
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