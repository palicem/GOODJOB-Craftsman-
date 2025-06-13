<template>
  <view class="mp-container">
    <!-- 自定义导航栏 -->
    <view class="mp-nav-header">
      <view class="mp-status-bar"></view>
      <view class="mp-nav-bar">
        <view class="mp-nav-back" @click="goBack">
          <text class="back-icon">&lt;</text>
        </view>
        <view class="search-container">
          <view class="search-box">
            <text class="search-icon">🔍</text>
            <input type="text" placeholder="搜索订单" class="search-input" />
          </view>
        </view>
      </view>
    </view>
    
    <!-- 订单类型导航栏 -->
    <scroll-view class="order-nav" scroll-x="true">
      <view 
        class="nav-item" 
        :class="{'active': currentType === index}"
        v-for="(item, index) in orderTypes" 
        :key="index"
        @click="switchOrderType(index)"
      >
        <text>{{item.text}}</text>
      </view>
    </scroll-view>
    
    <!-- 内容区域 -->
    <view class="mp-content-with-navbar order-content">
      <!-- 订单为空时的提示 -->
      <view class="empty-orders" v-if="filteredOrders.length === 0">
        <image src="/static/empty-orders.png" class="empty-image" mode="aspectFit"></image>
        <text class="empty-text">暂无相关订单</text>
      </view>
      
      <!-- 订单列表 -->
      <view v-else class="order-list">
        <!-- 订单项 -->
        <view class="order-item" v-for="(order, index) in filteredOrders" :key="order._id || index">
          <view class="order-header">
            <view class="shop-info">
              <text class="shop-name">{{order.shopName}}</text>
            </view>
            <!-- Conditional display for order status or delete action -->
            <view class="status-or-action">
              <template v-if="order.status === 'canceled'">
                <text class="delete-link-in-header" @click="handleAction('delete_order', order)">删除订单</text>
              </template>
              <template v-else>
                <text class="order-status" :class="'status-' + order.status">{{getStatusText(order.status)}}</text>
              </template>
            </view>
          </view>
          
          <view class="order-goods" @click="goToOrderDetail(order)">
            <image class="goods-image" :src="order.goodsImage || '/static/default-goods.png'" mode="aspectFill"></image>
            <view class="goods-info">
              <text class="goods-name">{{order.goodsName}}</text>
              <text class="goods-spec">规格：{{order.spec || '默认'}}</text>
              <view class="goods-price-count">
                <text class="goods-price">¥{{(order.price || 0).toFixed(2)}}</text>
                <text class="goods-count">x{{order.count}}</text>
              </view>
            </view>
          </view>
          
          <view class="order-footer">
            <text class="order-total">共{{order.count}}件商品 合计：¥{{( (order.price || 0) * order.count).toFixed(2)}}</text>
            
            <!-- Hide action row completely for canceled orders if delete is in header -->
            <view class="order-actions-row" v-if="order.status !== 'canceled'">
              <!-- "更多" 按钮容器 -->
              <view class="order-more-actions-container" v-if="hasMoreActions(order.status)">
                <text class="more-btn" @click="toggleMoreActions(index)">更多</text>
                <view class="more-actions-menu" v-if="order.showMoreActions">
                  <view v-if="order.status === 'to_pay'" class="more-action-item" @click="handleAction('cancel_order', order)">取消订单</view>
                  <view v-if="order.status === 'to_pay' || order.status === 'to_receive' || order.status === 'completed'" class="more-action-item" @click="handleAction('add_to_cart', order)">加入购物车</view>
                </view>
              </view>
              
              <!-- 主要操作按钮容器 -->
              <view class="order-actions">
                <template v-if="order.status === 'to_pay'">
                  <button class="btn-order-action" @click="handleAction('modify_address', order)">修改地址</button>
                  <button class="btn-order-action btn-primary" @click="handleAction('continue_pay', order)">继续付款</button>
                </template>
                <template v-if="order.status === 'to_ship'">
                  <button class="btn-order-action" @click="handleAction('modify_address', order)">修改地址</button>
                  <button class="btn-order-action btn-primary" @click="handleAction('urge_ship', order)">催发货</button> 
                </template>
                <template v-if="order.status === 'to_receive'">
                  <button class="btn-order-action" @click="handleAction('check_logistics', order)">查看物流</button>
                  <button class="btn-order-action btn-primary" @click="handleAction('confirm_receipt', order)">确认收货</button>
                </template>
                <template v-if="order.status === 'completed'">
                  <button class="btn-order-action btn-delete" @click="handleAction('delete_order', order)">删除订单</button> <!-- Keep delete here as well for consistency if desired -->
                  <button class="btn-order-action" @click="handleAction('buy_again', order)">再买一单</button>
                  <button class="btn-order-action btn-primary" @click="handleAction('review', order)">评价</button>
                </template>
                <!-- No buttons for 'canceled' status here anymore as delete is in header -->
              </view>
            </view>
            <!-- Alternatively, if you want other buttons for canceled orders, adjust the v-if above -->
             <view class="order-actions-row" v-if="order.status === 'canceled'">
                <view class="order-actions"> <!-- Ensure this is also pushed to the right -->
                     <button class="btn-order-action" @click="handleAction('buy_again', order)">再来一单</button>
                     <!-- The delete action is now in the header for canceled orders -->
                </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { getOrderList, updateOrderStatus, deleteOrder, cancelOrder } from '../../utils/orderService';
import { addToCart, getCartList } from '../../utils/cartService';

// 订单类型
const orderTypes = [
  { text: '全部', status: '' },
  { text: '待付款', status: 'to_pay' },
  { text: '待发货', status: 'to_ship' },
  { text: '待收货', status: 'to_receive' },
  { text: '待评价', status: 'completed' },
  { text: '已取消', status: 'canceled' },
  { text: '退款/售后', status: 'refund' }
];

// 当前选中的订单类型
const currentType = ref(0);

// 订单数据
const orders = ref([]);
const loading = ref(false);

// Helper to check if there are "More" actions for a status
const hasMoreActions = (status) => {
  // Only show "More" if there are specific actions for it
  if (status === 'to_pay') return true; // Has "Cancel Order" and "Add to Cart" in more
  if (status === 'to_receive' || status === 'completed') return true; // Has "Add to Cart" in more
  return false;
};

// 加载订单数据
const loadOrders = async () => {
  loading.value = true;
  let activeStatus = "";
  if (currentType.value >= 0 && currentType.value < orderTypes.length) {
    activeStatus = orderTypes[currentType.value].status;
  }
  console.log(`[orders.vue] loadOrders called. currentType: ${currentType.value}, activeStatus: '${activeStatus}'`);

  const params = activeStatus ? { status: activeStatus } : {};
  console.log('[orders.vue] Params for getOrderList:', JSON.stringify(params));
  try {
    const fetchedOrders = await getOrderList(params);
    console.log('[orders.vue] getOrderList response (fetchedOrders):', JSON.stringify(fetchedOrders));
    // Initialize showMoreActions for each order
    orders.value = (fetchedOrders || []).map(order => ({ ...order, showMoreActions: false }));
    console.log('[orders.vue] orders.value updated. Count:', orders.value.length);
    if (orders.value.length > 0) {
        console.log('[orders.vue] First order in list:', JSON.stringify(orders.value[0]));
    }

  } catch (error) {
    console.error('[orders.vue] Failed to load orders:', error);
    orders.value = [];
  } finally {
    loading.value = false;
  }
};

// 根据当前类型过滤订单
const filteredOrders = computed(() => {
    return orders.value;
});

// 订单数量统计
const orderCounts = computed(() => {
  const counts = {
    '': orders.value.length, // 全部订单数量
    to_pay: 0,
    to_ship: 0,
    to_receive: 0,
    to_review: 0,
    refund: 0
  };
  
  orders.value.forEach(order => {
    if (counts.hasOwnProperty(order.status)) {
      counts[order.status]++;
    }
  });
  
  return counts;
});

// 监听订单更新事件
const handleOrdersUpdated = () => {
  console.log('订单列表收到更新事件');
  loadOrders();
};

onMounted(() => {
  console.log('[orders.vue] onMounted triggered.');
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  
  if (currentPage && currentPage.options) {
    const type = currentPage.options.type;
    console.log(`[orders.vue] Received type from options: ${type}`);
    if (type !== undefined && type !== null) {
      // Find index based on status string, or fallback to number if type is index
      let foundIndex = orderTypes.findIndex(ot => ot.status === type); // If type is like "to_pay"
      if (foundIndex === -1) { // If type is an index string like "1"
          const typeNum = parseInt(type);
           if (!isNaN(typeNum) && typeNum >= 0 && typeNum < orderTypes.length) {
               foundIndex = typeNum;
           }
      }

      if (foundIndex !== -1) {
        currentType.value = foundIndex;
        console.log(`[orders.vue] currentType initialized to index: ${currentType.value} (${orderTypes[currentType.value].text} - ${orderTypes[currentType.value].status})`);
      } else {
        console.warn(`[orders.vue] Invalid type or status from options: ${type}. Defaulting to 0.`);
        currentType.value = 0; // Default to '全部'
      }
    } else {
      console.log('[orders.vue] No type option found, defaulting to type 0 (全部).');
      currentType.value = 0; // Default to '全部'
    }
  } else {
    console.log('[orders.vue] No currentPage.options found, defaulting to type 0 (全部).');
    currentType.value = 0; // Default to '全部'
  }
  
  loadOrders();
  
  uni.$on('orders-updated', handleOrdersUpdated);
  
  const page = pages[pages.length - 1];
  if (page && page.$vm) {
    const originalOnShow = page.$vm.$options.onShow || (() => {});
    page.$vm.$options.onShow = function(...args) {
      originalOnShow.apply(this, args);
      console.log('[orders.vue] onShow triggered, reloading orders.');
      loadOrders();
    };
  }
});

onUnmounted(() => {
  // 移除事件监听
  uni.$off('orders-updated', handleOrdersUpdated);
});

// 切换订单类型
const switchOrderType = (index) => {
  console.log(`[orders.vue] switchOrderType called with index: ${index}`);
  currentType.value = index;
  orders.value.forEach(order => {
    order.showMoreActions = false;
  });
  loadOrders();
};

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 根据订单状态获取状态文本
const getStatusText = (status) => {
  switch(status) {
    case 'to_pay':
      return '等待买家付款';
    case 'to_ship':
      return '买家已付款';
    case 'shipped':
      return '卖家已发货';
    case 'to_receive':
      return '卖家已发货';
    case 'completed':
      return '交易成功';
    case 'canceled':
      return '交易关闭';
    case 'refund_request':
      return '退款申请中';
    case 'refund_approved':
      return '退款已批准';
    case 'refund_completed':
      return '退款已完成';
    default:
      return status || '未知状态';
  }
};

// 切换更多操作菜单
const toggleMoreActions = (index) => {
  if (orders.value[index]) {
    orders.value[index].showMoreActions = !orders.value[index].showMoreActions;
    // Close other menus
    orders.value.forEach((order, i) => {
      if (i !== index) {
        order.showMoreActions = false;
      }
    });
  }
};

// 处理订单操作
const handleAction = async (action, orderData) => {
  console.log(`[orders.vue] handleAction: ${action}, Order ID: ${orderData?._id}, Order No: ${orderData?.orderNo}`);

  if (!orderData || (!orderData._id && !orderData.orderNo)) {
    uni.showToast({ title: '订单信息错误，无法操作', icon: 'none' });
    return;
  }
  
  const orderIdForUpdate = orderData._id;

  if (orderData.showMoreActions) {
      orderData.showMoreActions = false;
  }

  switch (action) {
    case 'continue_pay':
      console.log('[orders.vue] "继续付款" for order ID:', orderIdForUpdate);
      if (!orderIdForUpdate) { 
          uni.showToast({ title: '无法付款：订单ID缺失', icon: 'none' });
          return;
      }
      uni.showLoading({ title: '正在处理...' });
      try {
        const response = await updateOrderStatus(orderIdForUpdate, 'to_ship'); 
        if (response.success) {
          uni.showToast({ title: '订单已更新为待发货', icon: 'success' });
          // Emit event for customer service chat update
          const eventPayload = {
            orderId: orderData._id,
            status: 'to_ship', // The new status
            productName: orderData.goodsName,
            shopId: orderData.shop_id, 
            shopName: orderData.shopName,
            // Pass any other relevant info customer-service.vue might need
          };
          console.log('[orders.vue] Emitting orderStatusUpdatedFromTrade:', eventPayload);
          uni.$emit('orderStatusUpdatedFromTrade', eventPayload);
          loadOrders();
        } else {
          uni.showToast({ title: response.message || '操作失败', icon: 'error' });
        }
      } catch (error) {
        console.error('[orders.vue] Error processing payment/status update:', error);
        uni.showToast({ title: '操作异常', icon: 'error' });
      } finally {
        uni.hideLoading();
      }
      break;
    case 'cancel_order':
      console.log('[orders.vue] Attempting to cancel order ID:', orderIdForUpdate);
      if (!orderIdForUpdate) { 
          uni.showToast({ title: '无法取消：订单ID缺失', icon: 'none' });
          return;
      }
      uni.showModal({
        title: '确认取消订单',
        content: '您确定要取消此订单吗？',
        success: async (res) => {
          if (res.confirm) {
            loading.value = true;
            try {
              const response = await cancelOrder(orderIdForUpdate);
              if (response.success) {
                uni.showToast({ title: '订单已取消', icon: 'success' });
                loadOrders();
              } else {
                uni.showToast({ title: response.message || '取消失败', icon: 'error' });
              }
            } catch (error) {
              console.error('[orders.vue] Error cancelling order:', error);
              uni.showToast({ title: '取消操作异常', icon: 'error' });
            } finally {
              loading.value = false;
            }
          }
        },
      });
      break;
    case 'delete_order':
      console.log('[orders.vue] Attempting to delete order ID:', orderIdForUpdate);
      if (!orderIdForUpdate) { 
          uni.showToast({ title: '无法删除：订单ID缺失', icon: 'none' });
          return;
      }
      uni.showModal({
        title: '确认删除订单',
        content: '您确定要删除此订单吗？此操作不可恢复。',
        success: async (res) => {
            if (res.confirm) {
                loading.value = true;
                try {
                    const response = await deleteOrder(orderIdForUpdate); 
                    if (response.success) {
                        uni.showToast({ title: '订单已删除', icon: 'success' });
                        loadOrders();
                    } else {
                        uni.showToast({ title: response.message || '删除失败', icon: 'error' });
                    }
                } catch (error) {
                    console.error('[orders.vue] Error deleting order:', error);
                    uni.showToast({ title: '删除操作异常', icon: 'error' });
                } finally {
                    loading.value = false;
                }
            }
        }
      });
      break;
    case 'confirm_receipt':
      if (!orderIdForUpdate) {
          uni.showToast({ title: '无法确认收货：订单ID缺失', icon: 'none' });
          return;
      }
      loading.value = true;
      try {
          const response = await updateOrderStatus(orderIdForUpdate, 'completed');
          if (response.success) {
              uni.showToast({ title: '已确认收货', icon: 'success' });
              loadOrders();
          } else {
              uni.showToast({ title: response.message || '操作失败', icon: 'error' });
          }
      } catch (error) {
          console.error('[orders.vue] Error confirming receipt:', error);
          uni.showToast({ title: '操作异常', icon: 'error' });
      } finally {
          loading.value = false;
      }
      break;
    case 'review':
      const identifierForReview = orderData.orderNo || orderData._id;
      if (!identifierForReview) {
         uni.showToast({ title: '订单信息不完整，无法评价', icon: 'none' });
         return;
      }
      uni.navigateTo({ url: `/pages/review/submit?orderId=${identifierForReview}` });
      break;
    case 'check_logistics':
      if (!orderData.orderNo) {
         uni.showToast({ title: '订单号缺失，无法查看物流', icon: 'none' });
         return;
      }
      uni.navigateTo({ url: `/pages/orders/logistics?orderNo=${orderData.orderNo}` });
      break;
    case 'add_to_cart':
      const goodsToAdd = {
        id: orderData.orderItems && orderData.orderItems.length > 0 ? orderData.orderItems[0].product_id : Date.now().toString(),
        shopId: orderData.shop_id,
        shopName: orderData.shopName,
        goodsName: orderData.goodsName,
        spec: orderData.spec,
        price: orderData.price,
        count: 1,
        goodsImage: orderData.goodsImage
      };
      console.log('[orders.vue] Adding to cart:', goodsToAdd);
      if (addToCart(goodsToAdd)) {
        uni.showToast({ title: '已加入购物车', icon: 'success' });
      } else {
        uni.showToast({ title: '加入购物车失败', icon: 'none' });
      }
      break;
    case 'urge_ship':
      uni.showToast({ title: '已通知卖家尽快发货', icon: 'success' });
      break;
    case 'buy_again':
      const buyAgainGoods = {
        id: orderData.orderItems && orderData.orderItems.length > 0 ? orderData.orderItems[0].product_id : Date.now().toString(),
        shopId: orderData.shop_id,
        shopName: orderData.shopName,
        goodsName: orderData.goodsName,
        spec: orderData.spec,
        price: orderData.price,
        count: orderData.count,
        goodsImage: orderData.goodsImage
      };
      console.log('[orders.vue] Buying again (adding to cart):', buyAgainGoods);
      if (addToCart(buyAgainGoods)) {
        uni.showToast({ title: '商品已加入购物车', icon: 'success' });
      } else {
        uni.showToast({ title: '加入购物车失败', icon: 'none' });
      }
      break;
    case 'modify_address':
      const identifierForAddress = orderData.orderNo || orderData._id;
      if (!identifierForAddress) {
         uni.showToast({ title: '订单信息不完整', icon: 'none' });
         return;
      }
      uni.navigateTo({
        url: `/pages/user/shipping-address?from=order&orderIdentifier=${identifierForAddress}`
      });
      break;
    default:
      console.warn(`[orders.vue] Unhandled action: ${action}`);
      break;
  }
};

// 跳转到订单详情页面
const goToOrderDetail = (order) => {
  if (!order || !order._id) {
    console.error('[orders.vue] goToOrderDetail: Invalid order object or missing order._id', order);
    uni.showToast({ title: '无效的订单信息', icon: 'none' });
    return;
  }
  console.log('[orders.vue] Navigating to order detail with order ID:', order._id);
  uni.navigateTo({
    url: `/pages/orders/order-detail?orderId=${order._id}`
  });
};
</script>

<style lang="scss">
.mp-container {
  min-height: 100vh;
  background: #f7f7f7;
  position: relative;
}

.mp-nav-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: #fff;
}

.mp-status-bar {
  height: var(--status-bar-height, 40rpx);
  background: #fff;
}

.mp-nav-bar {
  display: flex;
  align-items: center;
  height: 90rpx;
  padding: 0 30rpx;
  background: #fff;
}

.mp-nav-back {
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

.search-container {
  flex: 1;
  padding: 0 20rpx;
  margin-left: 20rpx; /* 增加与返回按钮的距离 */
}

.search-box {
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.2);
  border: 1rpx solid #eee;
  border-radius: 30rpx;
  height: 60rpx;
  padding: 0 20rpx;
}

.search-icon {
  margin-right: 10rpx;
  font-size: 28rpx;
  color: #999;
}

.search-input {
  flex: 1;
  height: 60rpx;
  font-size: 28rpx;
  color: #333;
  background: transparent;
}

.order-nav {
  display: flex;
  white-space: nowrap;
  background-color: #fff;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  padding: 0 20rpx;
  position: fixed;
  width: 100%;
  top: calc(var(--status-bar-height, 40rpx) + 90rpx);
  left: 0;
  z-index: 99;
}

.nav-item {
  display: inline-block;
  padding: 25rpx 30rpx;
  font-size: 28rpx;
  color: #666;
  position: relative;
  
  &.active {
    color: var(--primary-color, #00BFA6);
    font-weight: 500;
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 40rpx;
      height: 4rpx;
      background-color: var(--primary-color, #00BFA6);
      border-radius: 2rpx;
    }
  }
}

.order-content {
  padding: 20rpx;
  padding-top: calc(var(--status-bar-height, 40rpx) + 90rpx + 80rpx);
}

.empty-orders {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 100rpx;
}

.empty-image {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  color: #999;
  font-size: 28rpx;
}

.order-list {
  width: 100%;
}

.order-item {
  background-color: #fff;
  border-radius: 10rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.shop-name {
  font-size: 28rpx;
  font-weight: 500;
}

.order-status {
  font-size: 26rpx;
  color: var(--primary-color, #00BFA6);
  
  &.status-to_pay { color: #ff9800; }
  &.status-to_ship { color: #2196f3; }
  &.status-to_receive { color: #4caf50; }
  &.status-completed { color: #9c27b0; }
  &.status-canceled { color: #999; }
}

.order-goods {
  display: flex;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:active {
    background-color: #f9f9f9;
  }
}

.goods-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 6rpx;
  margin-right: 20rpx;
  background-color: #f5f5f5;
}

.goods-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.goods-name {
  font-size: 28rpx;
  margin-bottom: 10rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.goods-spec {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 10rpx;
}

.goods-price-count {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.goods-price {
  font-size: 26rpx;
  color: #ff6700;
}

.goods-count {
  font-size: 24rpx;
  color: #999;
}

.order-footer {
  padding: 20rpx 30rpx;
  position: relative;
}

.order-total {
  font-size: 26rpx;
  color: #666;
  text-align: right;
  margin-bottom: 15rpx;
  display: block;
}

.order-actions-row {
  display: flex;
  align-items: center;
  // Removed justify-content to rely on margin-left: auto for the .order-actions group
}

.order-more-actions-container {
  position: relative; 
  margin-right: auto; // Pushes this to the far left, and .order-actions to the far right
}

.more-btn {
  font-size: 24rpx;
  color: #666;
  padding: 10rpx 15rpx; // Add some padding to make it easier to click
  line-height: 60rpx; 
  cursor: pointer;
  display: inline-block; 
}

.more-actions-menu {
  position: absolute;
  left: 0; // Align menu to the left of the "More" button container
  bottom: 100%; 
  margin-bottom: 5rpx; 
  background-color: #fff;
  border-radius: 6rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
  z-index: 10;
  min-width: 180rpx; 
  border: 1rpx solid #eee;
}

.order-actions { 
  display: flex;
  align-items: center;
  justify-content: flex-end; // Ensures buttons within this group are packed to the right
  margin-left: auto; // Crucial for pushing this whole group to the right if no "More" button exists or if we want it always rightmost
}

.btn-order-action {
  padding: 0 25rpx;
  height: 60rpx;
  line-height: 60rpx;
  font-size: 26rpx;
  border-radius: 30rpx;
  background-color: #fff;
  color: #666;
  border: 1rpx solid #ddd;
  margin-left: 15rpx; 
  &:first-child {
     // If this is the first button in .order-actions, and .order-actions is the first visible thing (no more button)
     // it might not need a left margin. However, for simplicity, a consistent margin is fine.
     // If .order-actions directly starts (e.g. no .order-more-actions-container visible), 
     // then &:first-child in .order-actions might need margin-left:0 if it's the very first button on the row.
     // But given margin-left:auto on .order-actions, this should align right.
  }
  
  &.btn-primary {
    background-color: var(--primary-color, #00BFA6);
    color: #fff;
    border: none;
  }
}

.btn-order-action.btn-delete {
  background-color: #ff4d4f;
  color: #fff;
  border: 1rpx solid #ff4d4f;
}

.status-or-action {
  // Container for status text or delete link
}

.delete-link-in-header {
  color: #ff4d4f; // Red color for delete
  font-size: 26rpx;
  cursor: pointer;
  padding: 5rpx 0; // Make it easier to click
  text-decoration: underline;
}

// Ensure .order-actions for canceled state is also pushed right
.order-actions-row[v-if="order.status === 'canceled'"] .order-actions {
    margin-left: auto;
}

</style> 