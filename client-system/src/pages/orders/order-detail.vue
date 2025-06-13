<template>
  <view class="order-detail-container">
    <!-- 顶部导航栏 -->
    <view class="nav-header">
      <view class="status-bar" :style="{ height: statusBarHeight + 'px', backgroundColor: '#00BFA6' }"></view>
      <view class="nav-bar">
        <view class="left-area">
          <view class="back-btn" @click="goBack">
            <text class="iconfont">&#xe679;</text>
          </view>
        </view>
        <view class="center-area">
          <text class="nav-title">{{ getStatusText(order.status) }}</text>
        </view>
        <view class="right-area"></view>
      </view>
    </view>

    <!-- 订单状态 -->
    <view class="status-bar-container">
      <view class="status-text" :class="'status-' + order.status">
        <text>{{ getStatusText(order.status) }}</text>
      </view>
    </view>

    <!-- 收货地址 -->
    <view class="address-section">
      <view class="address-info">
        <view class="contact-info">
          <text class="name">{{ order.address.name }}</text>
          <text class="phone">{{ order.address.phone }}</text>
        </view>
        <view class="address-detail">
          {{ order.address.province }}{{ order.address.city }}{{ order.address.district }}{{ order.address.detailAddress || order.address.address }}
        </view>
      </view>
    </view>

    <!-- 商品信息 -->
    <view class="goods-section" v-if="order.orderItems && order.orderItems.length > 0">
      <view class="shop-name">{{ order.shopName || (order.orderItems[0].product_snapshot && order.orderItems[0].product_snapshot.shop_name) || '店铺信息' }}</view>
      <!-- 单个商品订单显示 -->
      <block v-if="order.orderItems.length === 1">
        <view class="goods-item">
          <image :src="order.goodsImage || (order.orderItems[0].product_snapshot && order.orderItems[0].product_snapshot.image_url) || '/static/images/default_product.png'" mode="aspectFill" class="goods-image"></image>
          <view class="goods-info">
            <text class="goods-name">{{ order.goodsName || (order.orderItems[0].product_snapshot && order.orderItems[0].product_snapshot.name) || '商品名称未知' }}</text>
            <text class="goods-spec">{{ order.spec || (order.orderItems[0].spec_description) || (order.orderItems[0].spec && typeof order.orderItems[0].spec === 'string' ? order.orderItems[0].spec : '默认规格') }}</text>
            <view class="price-count">
              <text class="price">¥{{ order.price !== undefined ? order.price : order.orderItems[0].price }}</text>
              <text class="count">x{{ order.count !== undefined ? order.count : order.orderItems[0].count }}</text>
            </view>
          </view>
        </view>
      </block>
      <!-- 多个商品订单显示 -->
      <block v-else>
        <view v-for="(item, index) in order.orderItems" :key="item.product_id_original || index" class="goods-item">
          <image :src="(item.product_snapshot && item.product_snapshot.image_url) || '/static/images/default_product.png'" mode="aspectFill" class="goods-image"></image>
          <view class="goods-info">
            <text class="goods-name">{{ (item.product_snapshot && item.product_snapshot.name) || '商品名称未知' }}</text>
            <text class="goods-spec">{{ item.spec_description || (item.spec && typeof item.spec === 'string' ? item.spec : '默认规格') }}</text>
            <view class="price-count">
              <text class="price">¥{{ item.price }}</text>
              <text class="count">x{{ item.count }}</text>
            </view>
          </view>
        </view>
      </block>
    </view>
    <view class="goods-section" v-else-if="order.goodsName"> <!-- 兼容旧的顶层商品信息 -->
      <view class="shop-name">{{ order.shopName }}</view>
      <view class="goods-item">
        <image :src="order.goodsImage" mode="aspectFill" class="goods-image"></image>
        <view class="goods-info">
          <text class="goods-name">{{ order.goodsName }}</text>
          <text class="goods-spec">款式: {{ order.spec }}</text>
          <view class="price-count">
            <text class="price">¥{{ order.price }}</text>
            <text class="count">x{{ order.count }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 支付金额详情 -->
    <view class="payment-section">
      <view class="payment-header" @click="togglePaymentDetail">
        <text>实付款</text>
        <view class="total-amount">
          <text class="amount">¥{{ order.totalAmount.toFixed(2) }}</text>
          <text class="arrow" :class="{ 'arrow-down': showPaymentDetail }">›</text>
        </view>
      </view>
      <view class="payment-detail" v-if="showPaymentDetail">
        <view class="detail-item">
          <text>商品总额</text>
          <text>¥{{ calculateSubtotal().toFixed(2) }}</text>
        </view>
        <view class="detail-item">
          <text>手工费</text>
          <text>¥{{ (order.handlingFee || 0).toFixed(2) }}</text>
        </view>
        <view class="detail-item">
          <text>运费</text>
          <text>¥{{ (order.shippingFee || 0).toFixed(2) }}</text>
        </view>
      </view>
    </view>

    <!-- 订单信息 -->
    <view class="order-info">
      <view class="info-item">
        <text class="label">订单编号</text>
        <text class="value">{{ order.orderNo }}</text>
      </view>
      <view class="info-item" v-if="order.createTime">
        <text class="label">创建时间</text>
        <text class="value">{{ formatTime(order.createTime) }}</text>
      </view>
       <view class="info-item" v-if="order.payTime">
        <text class="label">支付时间</text>
        <text class="value">{{ formatTime(order.payTime) }}</text>
      </view>
      <view class="info-item" v-if="order.shipTime && showShipTime">
        <text class="label">发货时间</text>
        <text class="value">{{ formatTime(order.shipTime) }}</text>
      </view>
      <view class="info-item" v-if="order.completeTime && showCompleteTime">
        <text class="label">成交时间</text>
        <text class="value">{{ formatTime(order.completeTime) }}</text>
      </view>
    </view>

    <!-- 底部按钮栏 -->
    <view class="bottom-bar">
      <button class="btn-cs" @click="contactService">客服</button>
      <button class="btn-logistics" v-if="showLogisticsButton" @click="checkLogistics">查看物流</button>
      
      <!-- Standard Action Button (Pay, Confirm Receipt, etc.) -->
      <button class="btn-action" v-if="showActionButton && order.status !== 'canceled'" @click="handleActionButton">
        {{ getActionButtonText() }}
      </button>

      <!-- Delete Order Button - Only for 'canceled' status -->
      <button class="btn-action btn-delete-order" v-if="order.status === 'canceled'" @click="handleDeleteOrder">
        删除订单
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { formatDate } from '@/utils/dateUtils';
import { getOrderDetail, updateOrderStatus, cancelOrder, deleteOrder } from '@/utils/orderService';

const statusBarHeight = ref(20);
const order = ref({
  _id: null,
  orderNo: '',
  shopName: '',
  status: '',
  address: { name: '', phone: '', province: '', city: '', district: '', detailAddress: '' }, 
  createTime: '',
  payTime: null,
  shipTime: null,    
  completeTime: null, 
  totalAmount: 0,
  handlingFee: 0,
  shippingFee: 0,
  orderItems: [],
  goodsName: '', 
  goodsImage: '',
  spec: '',
  price: 0,
  count: 0
});

const showPaymentDetail = ref(false);
const isLoading = ref(true);

// Define showActionButton as a computed property
const showActionButton = computed(() => {
  if (!order.value || !order.value.status || order.value.status === 'canceled') {
    // Don't show the generic action button if status is canceled (delete button will show)
    return false;
  }
  const actionableStatuses = ['to_pay', 'to_receive', 'to_ship', 'completed'];
  return actionableStatuses.includes(order.value.status);
});

onMounted(async () => {
  uni.getSystemInfo({
    success: (res) => {
      statusBarHeight.value = res.statusBarHeight;
    }
  });
  
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  if (currentPage && currentPage.options && currentPage.options.orderId) { 
    const orderId = currentPage.options.orderId;
    console.log('[order-detail.vue] Got orderId from route:', orderId);
    try {
      isLoading.value = true;
      const orderDataFromApi = await getOrderDetail(orderId);
      console.log('[order-detail.vue] Fetched orderDataFromApi:', JSON.stringify(orderDataFromApi));
      if (orderDataFromApi) {
        order.value = {
          ...orderDataFromApi, // Spread first to get all fields
          orderNo: orderDataFromApi.order_no || '',
          shopName: orderDataFromApi.shopName || (orderDataFromApi.orderItems && orderDataFromApi.orderItems.length > 0 && orderDataFromApi.orderItems[0].product_snapshot ? orderDataFromApi.orderItems[0].product_snapshot.shop_name : ''),
          totalAmount: orderDataFromApi.total_amount !== undefined ? orderDataFromApi.total_amount : 0,
          address: orderDataFromApi.address_snapshot || { name: '', phone: '', province: '', city: '', district: '', detailAddress: '' },
          createTime: orderDataFromApi.create_time || '',
          payTime: orderDataFromApi.pay_time || null,
          shipTime: orderDataFromApi.ship_time || null,
          completeTime: orderDataFromApi.complete_time || null,
          handlingFee: orderDataFromApi.handling_fee !== undefined ? orderDataFromApi.handling_fee : 0,
          shippingFee: orderDataFromApi.shipping_fee !== undefined ? orderDataFromApi.shipping_fee : 0,
          orderItems: orderDataFromApi.orderItems || [],

          // Fallback for single-item display if orderItems is not structured as expected or for older data
          goodsName: orderDataFromApi.goodsName || (orderDataFromApi.orderItems && orderDataFromApi.orderItems.length > 0 && orderDataFromApi.orderItems[0].product_snapshot ? orderDataFromApi.orderItems[0].product_snapshot.name : ''),
          goodsImage: orderDataFromApi.goodsImage || (orderDataFromApi.orderItems && orderDataFromApi.orderItems.length > 0 && orderDataFromApi.orderItems[0].product_snapshot ? orderDataFromApi.orderItems[0].product_snapshot.image_url : ''),
          spec: orderDataFromApi.spec || (orderDataFromApi.orderItems && orderDataFromApi.orderItems.length > 0 ? (orderDataFromApi.orderItems[0].spec_description || orderDataFromApi.orderItems[0].spec) : ''),
          price: orderDataFromApi.price !== undefined ? orderDataFromApi.price : (orderDataFromApi.orderItems && orderDataFromApi.orderItems.length > 0 ? orderDataFromApi.orderItems[0].price : 0),
          count: orderDataFromApi.count !== undefined ? orderDataFromApi.count : (orderDataFromApi.orderItems && orderDataFromApi.orderItems.length > 0 ? orderDataFromApi.orderItems[0].count : 0),
        };
        console.log('[order-detail.vue] Assigned order.value:', JSON.stringify(order.value));
      } else {
        console.error('[order-detail.vue] Order not found from API, orderId:', orderId);
        showErrorToast('订单不存在或加载失败');
      }
    } catch (error) {
      console.error('[order-detail.vue] Error fetching order details:', error);
      showErrorToast('加载订单详情出错');
    } finally {
      isLoading.value = false;
    }
  } else {
    console.error('[order-detail.vue] orderId not found in route options.');
    showErrorToast('无效的订单参数');
  }
  console.log("[order-detail.vue] Order status on mount:", order.value.status);
});

function showErrorToast(message) {
  uni.showToast({
    title: message,
    icon: 'error',
    duration: 2000
  });
  setTimeout(() => goBack(), 2000);
}

const calculateSubtotal = () => {
  if (order.value && order.value.orderItems && order.value.orderItems.length > 0) {
    return order.value.orderItems.reduce((sum, item) => sum + (item.price * item.count), 0);
  }
  // Fallback for old structure where price and count are top-level
  if (order.value && order.value.price !== undefined && order.value.count !== undefined) {
     return order.value.price * order.value.count;
  }
  return 0;
};

const showShipTime = computed(() => {
  // Keep previous logic or adjust based on your status flow
  return ['shipped', 'to_receive', 'completed'].includes(order.value.status) && order.value.shipTime;
});

const showCompleteTime = computed(() => {
  return order.value.status === 'completed' && order.value.completeTime;
});

const showLogisticsButton = computed(() => { // Renamed from showLogistics to avoid conflict
  return ['shipped', 'to_receive'].includes(order.value.status);
});

// 切换支付详情显示
function togglePaymentDetail() {
  showPaymentDetail.value = !showPaymentDetail.value;
}

// 联系客服
function contactService() {
  console.log('Contacting service...');
  uni.showToast({ title: '功能待实现：联系客服', icon: 'none' });
}

// 查看物流
function checkLogistics() {
  console.log('Checking logistics for order:', order.value.orderNo);
  if (order.value.orderNo) {
    uni.navigateTo({ url: `/pages/orders/logistics?orderNo=${order.value.orderNo}` });
  } else {
    uni.showToast({ title: '订单号不存在，无法查看物流', icon: 'none' });
  }
}

// 处理操作按钮点击
async function handleActionButton() {
  if (!order.value || !order.value._id) {
    uni.showToast({ title: '订单信息错误', icon: 'none' });
    return;
  }
  const currentStatus = order.value.status;
  const currentOrderId = order.value._id; 

  console.log(`[order-detail.vue] handleActionButton called. Status: ${currentStatus}, Order ID: ${currentOrderId}`);

  switch (currentStatus) {
    case 'to_pay':
      // TODO: Replace with actual payment logic
      console.log('[order-detail.vue] "立即付款" clicked for order ID:', currentOrderId);
      uni.showLoading({ title: '正在处理...' });
      try {
        // Directly update status to 'to_ship'
        const updateResponse = await updateOrderStatus(currentOrderId, 'to_ship'); 
        if (updateResponse.success) {
          order.value.status = 'to_ship'; 
          uni.showToast({ title: '订单已更新为待发货', icon: 'success' });
          uni.$emit('orders-updated');
          uni.$emit('order-counts-updated');
        } else {
          uni.showToast({ title: updateResponse.message || '状态更新失败', icon: 'error' });
        }
      } catch (paymentError) {
        console.error('[order-detail.vue] Error updating status for "to_pay" order:', paymentError);
        uni.showToast({ title: '操作失败，请重试', icon: 'error' });
      } finally {
        uni.hideLoading();
      }
      break;
    case 'to_receive':
      await confirmReceiptAction(currentOrderId);
      break;
    case 'to_ship': // Assuming this status allows cancellation via the main action button
      await cancelOrderAction(currentOrderId);
      break;
    case 'completed':
      console.log('[order-detail.vue] "再次购买" clicked for order:', order.value);
      uni.showToast({ title: '功能待实现：再次购买', icon: 'none' });
      // TODO: Implement re-purchase logic (e.g., navigate to trade page with items prefilled)
      break;
    default:
      console.log('[order-detail.vue] No action defined for status:', currentStatus);
      break;
  }
}

// Specific action for confirming receipt
async function confirmReceiptAction(orderId) {
  console.log('[order-detail.vue] Confirming receipt for order:', orderId);
  isLoading.value = true;
  try {
    const response = await updateOrderStatus(orderId, 'completed');
    if (response && response.success) {
      order.value.status = 'completed';
      uni.showToast({ title: '确认收货成功', icon: 'success' });
      uni.$emit('orders-updated'); 
      uni.$emit('order-counts-updated');
    } else {
      uni.showToast({ title: response.message || '确认收货失败', icon: 'error' });
    }
  } catch (error) {
    console.error('[order-detail.vue] Error confirming receipt:', error);
    uni.showToast({ title: '操作失败，请重试', icon: 'error' });
  } finally {
    isLoading.value = false;
  }
}

// Specific action for cancelling an order
async function cancelOrderAction(orderId) {
  if (!orderId) {
    console.error('[order-detail.vue] cancelOrderAction: orderId is undefined!');
    uni.showToast({ title: '无法取消订单：订单ID缺失', icon: 'error' });
    return;
  }
  console.log('[order-detail.vue] Attempting to cancel order:', orderId);
  uni.showModal({
    title: '确认取消订单',
    content: '您确定要取消此订单吗？',
    success: async (res) => {
      if (res.confirm) {
        isLoading.value = true;
        try {
          // Use cancelOrder from orderService.js
          const response = await cancelOrder(orderId);
          if (response && response.success) {
            order.value.status = 'cancelled';
            uni.showToast({ title: '订单已取消', icon: 'success' });
            uni.$emit('orders-updated'); 
            uni.$emit('order-counts-updated');
          } else {
            uni.showToast({ title: response.message || '取消订单失败', icon: 'error' });
          }
        } catch (error) {
          console.error('[order-detail.vue] Error cancelling order:', error);
          uni.showToast({ title: '操作失败，请重试', icon: 'error' });
        } finally {
          isLoading.value = false;
        }
      }
    }
  });
}

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 获取状态文本
function getStatusText(status) {
  const statusMap = {
    to_pay: '待付款',
    to_ship: '待发货',
    shipped: '已发货', // Assuming 'shipped' is a status you use
    to_receive: '待收货',
    completed: '已完成',
    cancelled: '已取消',
    refund_request: '退款申请中',
    refund_approved: '退款已批准',
    refund_completed: '退款已完成'
  };
  return statusMap[status] || '未知状态';
}

// Action button text based on order status
function getActionButtonText() {
  if (!order.value || !order.value.status) return '';
  switch (order.value.status) {
    case 'to_pay':
      return '立即付款';
    case 'to_receive':
      return '确认收货';
    case 'to_ship': // Assuming this is a state where user might want to cancel
      return '取消订单'; 
    case 'completed':
      return '再次购买'; // Or '评价订单'
    default:
      return ''; // No button text for other statuses or if button shouldn't show
  }
}

// 格式化时间
function formatTime(time) {
  if (!time) return '--';
  return formatDate(new Date(time), 'yyyy-MM-dd HH:mm:ss');
}

// New method to handle order deletion
async function handleDeleteOrder() {
  if (!order.value || !order.value._id) {
    uni.showToast({ title: '订单信息错误，无法删除', icon: 'none' });
    return;
  }
  console.log('[order-detail.vue] Attempting to delete order:', order.value._id);

  uni.showModal({
    title: '确认删除订单',
    content: '您确定要删除此订单吗？此操作不可恢复。',
    success: async (res) => {
      if (res.confirm) {
        isLoading.value = true;
        try {
          const response = await deleteOrder(order.value._id);
          if (response && response.success) {
            uni.showToast({ title: '订单已删除', icon: 'success' });
            uni.$emit('orders-updated'); // Notify list page to refresh
            uni.$emit('order-counts-updated'); // Notify counts to refresh
            setTimeout(() => {
              goBack(); // Go back to the previous page (likely order list)
            }, 1500);
          } else {
            uni.showToast({ title: response.message || '删除订单失败', icon: 'error' });
          }
        } catch (error) {
          console.error('[order-detail.vue] Error deleting order:', error);
          uni.showToast({ title: '删除操作失败，请重试', icon: 'error' });
        } finally {
          isLoading.value = false;
        }
      }
    }
  });
}
</script>

<style lang="scss">
.order-detail-container {
  min-height: 100vh;
  background-color: #f7f7f7;
  padding-bottom: 120rpx;
}

.nav-header {
  position: fixed;
  width: 100%;
  top: 0;
  left: 0;
  z-index: 99;
}

.nav-bar {
  display: flex;
  align-items: center;
  height: 88rpx;
  background-color: #00BFA6;
  padding: 0 30rpx;
  
  .left-area {
    width: 120rpx;
    display: flex;
    align-items: center;
    
    .back-btn {
      width: 60rpx;
      height: 60rpx;
      display: flex;
      align-items: center;
      
      .iconfont {
        color: #fff;
        font-size: 44rpx;
      }
    }
  }
  
  .center-area {
    flex: 1;
    text-align: center;
    
    .nav-title {
      color: #fff;
      font-size: 32rpx;
      font-weight: 500;
    }
  }
  
  .right-area {
    width: 120rpx;
  }
}

.status-bar-container {
  margin-top: calc(var(--status-bar-height, 25px) + 88rpx);
  background: #fff;
  padding: 30rpx;
  text-align: center;
  border-bottom: 1rpx solid #f5f5f5;
  
  .status-text {
    font-size: 32rpx;
    font-weight: 500;
    color: #333;
  }
}

.address-section {
  margin: 20rpx;
  padding: 30rpx;
  background-color: #fff;
  border-radius: 12rpx;
  
  .address-info {
    .contact-info {
      margin-bottom: 10rpx;
      
      .name {
        font-size: 32rpx;
        font-weight: 500;
        margin-right: 20rpx;
      }
      
      .phone {
        font-size: 28rpx;
        color: #666;
      }
    }
    
    .address-detail {
      font-size: 28rpx;
      color: #333;
      line-height: 1.4;
    }
  }
}

.goods-section {
  margin: 20rpx;
  background-color: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
  
  .shop-name {
    font-size: 28rpx;
    color: #333;
    padding-bottom: 20rpx;
    border-bottom: 1rpx solid #f5f5f5;
    font-weight: bold;
  }
  
  .goods-item {
    display: flex;
    padding: 20rpx 0;
    
    .goods-image {
      width: 160rpx;
      height: 160rpx;
      border-radius: 8rpx;
      margin-right: 20rpx;
    }
    
    .goods-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      
      .goods-name {
        font-size: 28rpx;
        color: #333;
        margin-bottom: 10rpx;
      }
      
      .goods-spec {
        font-size: 24rpx;
        color: #666;
        margin-bottom: 10rpx;
      }
      
      .price-count {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: auto;
        
        .price {
          font-size: 32rpx;
          color: #ff4444;
          font-weight: 500;
        }
        
        .count {
          font-size: 26rpx;
          color: #999;
        }
      }
    }
  }
}

.payment-section {
  margin: 20rpx;
  background-color: #fff;
  border-radius: 12rpx;
  padding: 30rpx;
  
  .payment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 28rpx;
    margin-bottom: 20rpx;
    
    .total-amount {
      display: flex;
      align-items: center;
      
      .amount {
        font-size: 32rpx;
        color: #ff6b6b;
        margin-right: 10rpx;
      }
      
      .arrow {
        font-size: 32rpx;
        color: #999;
        transition: transform 0.3s;
        
        &.arrow-down {
          transform: rotate(90deg);
        }
      }
    }
  }
  
  .payment-detail {
    .detail-item {
      display: flex;
      justify-content: space-between;
      font-size: 26rpx;
      color: #666;
      margin-top: 15rpx;
    }
  }
}

.order-info {
  margin: 20rpx;
  background-color: #fff;
  border-radius: 12rpx;
  padding: 30rpx;
  
  .info-item {
    display: flex;
    justify-content: space-between;
    font-size: 26rpx;
    margin-bottom: 15rpx;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .label {
      color: #999;
    }
    
    .value {
      color: #333;
    }
  }
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background-color: #fff;
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
  
  button {
    height: 70rpx;
    line-height: 70rpx;
    font-size: 28rpx;
    margin: 0;
    padding: 0 30rpx;
    
    &.btn-cs {
      background-color: #fff;
      color: #666;
      border: 1rpx solid #ddd;
      margin-right: 20rpx;
    }
    
    &.btn-logistics {
      background-color: #fff;
      color: #666;
      border: 1rpx solid #ddd;
      margin-right: 20rpx;
    }
    
    &.btn-action {
      flex: 1;
      background: #00BFA6;
      color: #fff;
      border: none;
    }
  }

  button.btn-delete-order:only-child {
    // If delete is the only button, it can take more space or be centered
    // For now, flex:1 on the button itself will make it take available space.
  }
}
</style> 