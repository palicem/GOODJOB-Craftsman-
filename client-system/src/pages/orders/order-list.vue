<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { getOrderList, deleteOrder, updateOrderStatus, cancelOrder } from '@/utils/orderService';

// 订单列表
const orderList = ref([]);

// 加载订单列表
const loadOrders = () => {
  console.log('重新加载订单列表');
  orderList.value = getOrderList() || [];
};

// 取消订单
const handleCancelOrder = (orderId) => {
  uni.showModal({
    title: '提示',
    content: '确定要取消该订单吗？',
    success: (res) => {
      if (res.confirm) {
        if (cancelOrder(orderId)) {
          // 重新加载订单列表
          loadOrders();
          
          uni.showToast({
            title: '订单已取消',
            icon: 'success'
          });
        } else {
          uni.showToast({
            title: '取消失败',
            icon: 'error'
          });
        }
      }
    }
  });
};

// 删除订单
const handleDeleteOrder = (orderNo) => {
  uni.showModal({
    title: '提示',
    content: '确定要删除该订单吗？删除后不可恢复',
    success: (res) => {
      if (res.confirm) {
        console.log('正在删除订单:', orderNo);
        if (deleteOrder(orderNo)) {
          console.log('删除订单成功');
          // 重新加载订单列表
          loadOrders();
          
          uni.showToast({
            title: '删除成功',
            icon: 'success'
          });
        } else {
          console.error('删除订单失败');
          uni.showToast({
            title: '删除失败',
            icon: 'error'
          });
        }
      }
    }
  });
};

// 监听订单更新事件
const handleOrdersUpdated = () => {
  console.log('订单列表收到更新事件');
  loadOrders();
};

onMounted(() => {
  console.log('订单列表页面加载');
  // 初始加载订单列表
  loadOrders();
  
  // 监听订单更新事件
  uni.$on('orders-updated', handleOrdersUpdated);
  
  // 监听页面显示
  const pages = getCurrentPages();
  const page = pages[pages.length - 1];
  if (page && page.$vm) {
    const originalOnShow = page.$vm.$options.onShow;
    page.$vm.$options.onShow = function() {
      if (originalOnShow) {
        originalOnShow.call(this);
      }
      console.log('订单列表页面显示，重新加载数据');
      loadOrders();
    };
  }
});

onUnmounted(() => {
  console.log('订单列表页面卸载');
  // 移除事件监听
  uni.$off('orders-updated', handleOrdersUpdated);
});
</script> 