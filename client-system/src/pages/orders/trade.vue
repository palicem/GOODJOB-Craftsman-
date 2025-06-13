<template>
  <view class="trade-container">
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
          <text class="nav-title">确认订单</text>
        </view>
        <view class="right-area"></view>
      </view>
    </view>

    <!-- 订单状态 -->
    <view class="status-bar-container">
      <view class="status-text" :class="'status-' + orderStatus">
        <text>{{ getStatusText(orderStatus) }}</text>
      </view>
    </view>

    <!-- 收货地址 -->
    <view class="address-section" @click="changeAddress">
      <view class="address-info">
        <view class="contact-info">
          <text class="name">{{ address.name }}</text>
          <text class="phone">{{ address.phone }}</text>
        </view>
        <view class="address-detail">
          {{ address.province }}{{ address.city }}{{ address.district }}{{ address.detailAddress }}
        </view>
      </view>
      <text class="arrow">›</text>
    </view>

    <!-- 商品信息 -->
    <view class="goods-section">
      <template v-if="order.orderItems">
        <!-- 购物车结算的多个商品 -->
        <view v-for="(shop, shopIndex) in groupedGoods" :key="shopIndex">
          <view class="shop-name">{{ shop.shopName }}</view>
          <view class="goods-item" v-for="(item, itemIndex) in shop.goods" :key="itemIndex">
            <image :src="item.goodsImage" mode="aspectFill" class="goods-image"></image>
            <view class="goods-info">
              <text class="goods-name">{{ item.goodsName }}</text>
              <text class="goods-spec">款式: {{ item.spec }}</text>
              <view class="price-count">
                <text class="price">¥{{ item.price }}</text>
                <text class="count">x{{ item.count }}</text>
              </view>
            </view>
          </view>
        </view>
      </template>
      <template v-else>
        <!-- 单个商品下单 -->
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
      </template>
    </view>

    <!-- 支付金额详情 -->
    <view class="payment-section">
      <view class="payment-header" @click="togglePaymentDetail">
        <text>实付款</text>
        <view class="total-amount">
          <text class="amount">¥{{ getTotalAmount() }}</text>
          <text class="arrow" :class="{ 'arrow-down': showPaymentDetail }">›</text>
        </view>
      </view>
      <view class="payment-detail" v-if="showPaymentDetail">
        <view class="detail-item">
          <text>商品总额</text>
          <text>¥{{ getGoodsAmount() }}</text>
        </view>
        <view class="detail-item">
          <text>手工费</text>
          <text>¥{{ getHandlingFee() }}</text>
        </view>
        <view class="detail-item">
          <text>运费</text>
          <text>¥{{ getShippingFee() }}</text>
        </view>
      </view>
    </view>

    <!-- 订单信息 -->
    <view class="order-info">
      <view class="info-item">
        <text class="label">订单编号</text>
        <text class="value">{{ order.orderNo }}</text>
      </view>
      <view class="info-item">
        <text class="label">创建时间</text>
        <text class="value">{{ formatTime(order.createTime) }}</text>
      </view>
      <view class="info-item" v-if="showShipTime">
        <text class="label">发货时间</text>
        <text class="value">{{ formatTime(order.shipTime) }}</text>
      </view>
      <view class="info-item" v-if="showCompleteTime">
        <text class="label">成交时间</text>
        <text class="value">{{ formatTime(order.completeTime) }}</text>
      </view>
    </view>

    <!-- 底部按钮栏 -->
    <view class="bottom-bar">
      <button class="btn-cs" @click="contactService">客服</button>
      <button class="btn-logistics" v-if="showLogistics" @click="checkLogistics">查看物流</button>
      <button class="btn-action" v-if="showActionButton" @click="handleActionButton" :disabled="isLoading">
        {{ getActionButtonText() }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { formatDate } from '@/utils/dateUtils';
import { useUserStore } from '@/stores/user';
import { getDefaultAddress, getAddressList } from '@/utils/profileService';
import { updateOrderStatus, createOrder, getOrderDetail, getOrderList } from '@/utils/orderService';
import { onLoad } from '@dcloudio/uni-app';

console.log('trade.vue: Script setup executing');

const userStore = useUserStore();
// const router = getCurrentPages(); // router似乎未使用，可以注释掉

const isLoading = ref(true);
const orderSubmittedViaButton = ref(false); // New ref

// 状态栏高度
const statusBarHeight = ref(20);

// 是否是新订单（从商品详情页或购物车进入）
const isNewOrder = ref(false);

// 是否是购物车结算
const isFromCart = ref(false);

// 收货地址
const address = ref({
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detailAddress: '',
  isDefault: false
});

// 订单商品列表
const orderItems = ref([]);

// 订单数据
const order = ref({
  orderNo: '',
  shopName: '',
  shopId: null,
  productId: null,
  goodsName: '',
  goodsImage: '',
  spec: '',
  price: 0,
  count: 1,
  status: 'to_pay',
  address: null,
  createTime: '',
  totalAmount: 0,
  handlingFee: 5,
  shippingFee: 10,
  remark: ''
});

// 按店铺分组的商品
const groupedGoods = computed(() => {
  if (!order.value.orderItems) return null;
  
  const groups = {};
  order.value.orderItems.forEach(item => {
    if (!groups[item.shopName]) {
      groups[item.shopName] = {
        shopName: item.shopName,
        goods: []
      };
    }
    groups[item.shopName].goods.push({
      goodsName: item.goodsName,
      goodsImage: item.goodsImage,
      spec: item.spec,
      price: item.price,
      count: item.count
    });
  });
  return Object.values(groups);
});

// 订单状态
const orderStatus = computed(() => order.value.status || 'to_pay');

const showPaymentDetail = ref(false);

// 页面加载时获取订单信息
onMounted(async () => {
  console.log('trade.vue: onMounted START');
  // 初始化 Pinia store 状态 - 移到更早的位置
  userStore.loadInitialState();
  console.log('[DEBUG][trade.vue] onMounted - userStore.userInfo AT MOUNT START:', JSON.stringify(userStore.userInfo, null, 2));

  // 确保 userStore 已初始化，并尝试加载用户信息，如果 store 中还没有
  if (!userStore.userInfo || !(userStore.userInfo._id || userStore.userInfo.id)) {
      console.log("[trade.vue] onMounted: userStore.userInfo is empty, attempting to load from userService or profileService if needed.");
      // 可以考虑在这里主动调用一个加载用户信息的函数，如果 userService.getCurrentUser() 或 profileService.getUserProfile() 是同步/异步的
      // 例如: await userStore.fetchUserProfileIfNotExists(); // 假设 userStore 有这样的 action
      // 或者直接从本地存储尝试同步一次
      const storedUser = uni.getStorageSync('userInfo');
      if (storedUser && (storedUser._id || storedUser.id)) {
          userStore.setUserInfo(storedUser);
          console.log("[trade.vue] onMounted: Synced userStore with userInfo from localStorage.");
      }
  }
   console.log('[DEBUG][trade.vue] onMounted - userStore.userInfo AFTER POTENTIAL SYNC:', JSON.stringify(userStore.userInfo, null, 2));

  isLoading.value = true;
  // 获取状态栏高度
  uni.getSystemInfo({
    success: (res) => {
      statusBarHeight.value = res.statusBarHeight;
    }
  });
  
  console.log('trade.vue: onMounted - loading default address...');
  await loadDefaultAddress();
  console.log('trade.vue: onMounted - default address loaded or attempted.', JSON.stringify(address.value));
  
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = currentPage.options || {};
  console.log('trade.vue: onMounted - options:', JSON.stringify(options));

  if (options.orderId) {
    isNewOrder.value = false;
    console.log('trade.vue: onMounted - Loaded existing order ID:', options.orderId);
    // TODO: Load existing order details for viewing/re-payment
    // This part needs implementation if users can open existing 'to_pay' orders
    // For now, focusing on new order flow
    try {
        const existingOrderDetails = await getOrderDetail(options.orderId);
        if (existingOrderDetails && existingOrderDetails.success) {
            order.value = { ...existingOrderDetails.data };
            address.value = existingOrderDetails.data.address_snapshot || {};
             console.log('trade.vue: onMounted - Successfully loaded existing order details:', JSON.stringify(order.value));
        } else {
            console.error('trade.vue: onMounted - Failed to load existing order details:', existingOrderDetails.message);
            uni.showToast({ title: '加载订单详情失败', icon: 'none' });
        }
    } catch (err) {
        console.error('trade.vue: onMounted - Error loading existing order details:', err);
        uni.showToast({ title: '加载订单异常', icon: 'none' });
    }

  } else {
    isNewOrder.value = true;
    console.log('trade.vue: onMounted - New order flow. isNewOrder:', isNewOrder.value);
    const { from } = options;
    isFromCart.value = from === 'cart';
    console.log('trade.vue: onMounted - isFromCart:', isFromCart.value);
    
    if (isFromCart.value) {
      console.log('trade.vue: onMounted - Attempting to load tempOrderData from cart...');
      const tempOrderData = uni.getStorageSync('tempOrderData');
      console.log('trade.vue: onMounted - tempOrderData from cart (raw):', JSON.stringify(tempOrderData));
      if (Array.isArray(tempOrderData) && tempOrderData.length > 0) {
        const orderNo = generateOrderNo();
        const goodsAmountFromCart = tempOrderData.reduce((sum, item) => sum + ((item.price || 0) * (item.count || 0)), 0);
        const currentHandlingFee = order.value.handlingFee || 0;
        const currentShippingFee = order.value.shippingFee || 0;
        const totalAmount = goodsAmountFromCart + currentHandlingFee + currentShippingFee;
        
        order.value = {
          ...order.value,
          orderNo,
          status: 'to_pay',
          createTime: new Date().toISOString(),
          totalAmount,
          handlingFee: currentHandlingFee, 
          shippingFee: currentShippingFee, 
          orderItems: tempOrderData.map(item => ({
            productId: item.productId || item.id,
            id: item.id,
            shopId: item.shopId || item.shop_id,
            shopName: item.shopName,
            goodsName: item.goodsName || item.name,
            goodsImage: item.goodsImage || item.image,
            spec: item.spec,
            price: item.price || 0,
            count: item.count || 1,
            customization_data: item.customization_data
          }))
        };
        console.log('trade.vue: onMounted - Order data constructed from cart:', JSON.stringify(order.value, null, 2));
        if (order.value.orderItems && order.value.orderItems.length > 0) {
          order.value.orderItems.forEach((oi, idx) => {
            console.log(`[DEBUG] trade.vue - Cart Flow - orderItems[${idx}].spec:`, oi.spec);
            console.log(`[DEBUG] trade.vue - Cart Flow - orderItems[${idx}].count:`, oi.count);
          });
        }
      } else {
        console.warn('trade.vue: onMounted - tempOrderData from cart is empty or not an array.');
      }
    } else if (options.productId && options.customizedImageUrl && options.selectedSpecs) { // Check if data is from customer service
      console.log('trade.vue: onMounted - Processing order data from URL parameters (customer service flow)...');
      const price = parseFloat(decodeURIComponent(options.price || '0')); // Assuming price is passed, if not default to 0 or fetch
      const quantity = parseInt(decodeURIComponent(options.quantity || '1'));
      const handlingFee = parseFloat(decodeURIComponent(options.handlingFee || String(order.value.handlingFee)));
      const shippingFee = parseFloat(decodeURIComponent(options.shippingFee || String(order.value.shippingFee)));
      
      let specText = '';
      try {
        const specsObject = JSON.parse(decodeURIComponent(options.selectedSpecs));
        specText = Object.entries(specsObject).map(([key, value]) => `${key}: ${value}`).join('; ');
      } catch (e) {
        console.error("Error parsing selectedSpecs from URL:", e);
        specText = decodeURIComponent(options.selectedSpecs); // Fallback to raw string if JSON parsing fails
      }

      order.value = {
        ...order.value,
        orderNo: generateOrderNo(),
        status: 'to_pay',
        createTime: new Date().toISOString(),
        totalAmount: price * quantity + handlingFee + shippingFee,
        handlingFee: handlingFee,
        shippingFee: shippingFee,
        shopId: decodeURIComponent(options.shopId),
        shopName: decodeURIComponent(options.shopName),
        orderItems: [{
          productId: decodeURIComponent(options.productId),
          shopId: decodeURIComponent(options.shopId),
          shopName: decodeURIComponent(options.shopName),
          goodsName: decodeURIComponent(options.productName),
          goodsImage: decodeURIComponent(options.customizedImageUrl), 
          spec: specText,
          price: price,
          count: quantity,
          customization_data: { 
             keywords: options.keywords ? JSON.parse(decodeURIComponent(options.keywords)) : [],
             originalCustomizedImageUrl: decodeURIComponent(options.customizedImageUrl)
          }
        }]
      };
      console.log('trade.vue: onMounted - Order data constructed from URL (customer service):', JSON.stringify(order.value, null, 2));
      if (order.value.orderItems && order.value.orderItems.length > 0) {
        console.log('[DEBUG] trade.vue - Customer Service Flow - orderItems[0].spec:', order.value.orderItems[0].spec);
        console.log('[DEBUG] trade.vue - Customer Service Flow - orderItems[0].count:', order.value.orderItems[0].count);
      }

    } else { // Fallback to original "from product details page" logic (using tempOrderData)
      console.log('trade.vue: onMounted - Attempting to load tempOrderData from product details (fallback flow)...');
      const tempOrderData = uni.getStorageSync('tempOrderData');
      console.log('trade.vue: onMounted - tempOrderData from product details (raw fallback):', JSON.stringify(tempOrderData));
      if (tempOrderData) {
        const price = tempOrderData.price || 0;
        const count = tempOrderData.count || 1;
        const handlingFee = tempOrderData.handlingFee !== undefined ? tempOrderData.handlingFee : order.value.handlingFee;
        const shippingFee = tempOrderData.shippingFee !== undefined ? tempOrderData.shippingFee : order.value.shippingFee;
        
        order.value = {
          ...order.value,
          orderNo: generateOrderNo(),
          status: 'to_pay',
          createTime: new Date().toISOString(),
          totalAmount: price * count + handlingFee + shippingFee,
          handlingFee: handlingFee,
          shippingFee: shippingFee,
          shopId: tempOrderData.shopId || tempOrderData.shop_id, 
          shopName: tempOrderData.shopName, 
          orderItems: [{
            productId: tempOrderData.productId || tempOrderData.id,
            id: tempOrderData.id, 
            shopId: tempOrderData.shopId || tempOrderData.shop_id, 
            shopName: tempOrderData.shopName, 
            goodsName: tempOrderData.goodsName || tempOrderData.name, 
            goodsImage: tempOrderData.goodsImage || tempOrderData.image, 
            spec: tempOrderData.spec, 
            price: price, 
            count: count, 
            customization_data: tempOrderData.customization_data
          }]
        };
        console.log('trade.vue: onMounted - Order data constructed from product details (single item into orderItems - fallback):', JSON.stringify(order.value, null, 2));
        if (order.value.orderItems && order.value.orderItems.length > 0) {
            console.log('[DEBUG] trade.vue - Fallback Flow (tempOrderData) - orderItems[0].spec:', order.value.orderItems[0].spec);
            console.log('[DEBUG] trade.vue - Fallback Flow (tempOrderData) - orderItems[0].count:', order.value.orderItems[0].count);
        }
      } else {
        console.warn('trade.vue: onMounted - tempOrderData from product details is null or undefined (fallback flow).');
      }
    }
    console.log('trade.vue: onMounted - Attempting to remove tempOrderData from storage.');
    uni.removeStorageSync('tempOrderData');
    console.log('trade.vue: onMounted - tempOrderData removed from storage.');
  }

  uni.$on('addressSelected', (selectedAddress) => {
    console.log('[trade.vue] addressSelected event triggered', JSON.stringify(selectedAddress));
    console.log('[DEBUG][trade.vue] addressSelected event - userStore.userInfo:', JSON.stringify(userStore.userInfo, null, 2));
    console.log('[DEBUG][trade.vue] addressSelected event - userStore.token:', userStore.token);
    address.value = selectedAddress;
  });
  console.log('trade.vue: onMounted END');
  isLoading.value = false;
});

// 页面卸载前
onBeforeUnmount(async () => {
  console.log('[trade.vue] onBeforeUnmount called. isNewOrder:', isNewOrder.value, 'orderSubmittedViaButton:', orderSubmittedViaButton.value);
  const initialUserStoreInfo = JSON.parse(JSON.stringify(userStore.userInfo || {})); // Deep copy for logging
  console.log('[DEBUG][trade.vue] onBeforeUnmount - userStore.userInfo AT START OF UNMOUNT:', initialUserStoreInfo);
  
  uni.$off('addressSelected'); // Clean up listener first

  if (orderSubmittedViaButton.value || !isNewOrder.value) {
    console.log('[trade.vue] onBeforeUnmount: Order already submitted via button or not a new order. Skipping pending order creation.');
    return;
  }

  if (order.value.orderItems && order.value.orderItems.length > 0) {
    console.log('[trade.vue] onBeforeUnmount: Attempting to create a pending_payment order via API.');

    let finalUserInfo = null;
    // Check 1: userStore.userInfo directly
    if (userStore.userInfo && (userStore.userInfo._id || userStore.userInfo.id)) {
      finalUserInfo = userStore.userInfo;
      console.log("[trade.vue] onBeforeUnmount (Step 1 Succeeded): Using user info from userStore.", JSON.stringify(finalUserInfo));
    } else {
      console.warn("[trade.vue] onBeforeUnmount (Step 1 Failed): userStore.userInfo is not available or invalid (has no _id/id). Trying localStorage.", initialUserStoreInfo);
      // Check 2: Fallback to localStorage
      const storedUser = uni.getStorageSync('userInfo');
      if (storedUser && (storedUser._id || storedUser.id)) {
          finalUserInfo = storedUser;
          // Attempt to sync to store if it was empty or invalid
          if (!userStore.userInfo || !(userStore.userInfo._id || userStore.userInfo.id)) {
            userStore.setUserInfo(storedUser); // This mutates the store
            console.warn("[trade.vue] onBeforeUnmount (Step 2 Succeeded - Store Sync): Fallback - Used user info from localStorage and synced to store.", JSON.stringify(finalUserInfo));
          } else {
            console.warn("[trade.vue] onBeforeUnmount (Step 2 Succeeded - No Store Sync Needed): Fallback - Used user info from localStorage (store was already populated and valid).", JSON.stringify(finalUserInfo));
          }
      } else {
          console.error("[trade.vue] onBeforeUnmount (Step 2 Failed): User info not available from store or localStorage. Cannot create API order.");
          const localDraftNoUser = { ...order.value, addressSnapshot: address.value, error_details: "User info missing (Store and Storage)" };
          uni.setStorageSync('pendingOrder_NoUser', localDraftNoUser);
          console.log("[trade.vue] onBeforeUnmount: Saved draft to 'pendingOrder_NoUser' due to missing user info.");
          return; 
      }
    }
    
    // Check 3: finalUserInfo after attempting store/localStorage
    if (!finalUserInfo || !(finalUserInfo._id || finalUserInfo.id)) {
        console.error('[trade.vue] onBeforeUnmount (Step 3 Failed): CRITICAL - finalUserInfo is still invalid after all checks. Aborting API call.', JSON.stringify(finalUserInfo));
        const criticalErrorDraft = { ...order.value, addressSnapshot: address.value, error_details: "CRITICAL: finalUserInfo resolution failed unexpectedly." };
        uni.setStorageSync('pendingOrder_CriticalFail', criticalErrorDraft);
        console.log("[trade.vue] onBeforeUnmount: Saved CRITICAL error draft to 'pendingOrder_CriticalFail'.");
        return;
    }
    console.log("[trade.vue] onBeforeUnmount (Step 3 Succeeded): finalUserInfo resolved:", JSON.stringify(finalUserInfo));

    // Check 4: Address
    if (!address.value || !address.value._id) {
        console.warn('[trade.vue] onBeforeUnmount (Step 4 Failed): Address not selected or invalid. Cannot create pending order via API.');
        const localDraftNoAddress = { ...order.value, userSnapshot: finalUserInfo, error_details: "Address missing or invalid" }; // Include user snapshot if available
        uni.setStorageSync('pendingOrder_NoAddress', localDraftNoAddress);
        console.log("[trade.vue] onBeforeUnmount: Saved draft to 'pendingOrder_NoAddress' due to missing address.");
        return;
    }
    console.log("[trade.vue] onBeforeUnmount (Step 4 Succeeded): Address is valid.", JSON.stringify(address.value));

    // Construct payload
    const resolvedShopId = order.value.shopId || (order.value.orderItems && order.value.orderItems.length > 0 ? order.value.orderItems[0].shopId : undefined);
    const finalOrderItems = order.value.orderItems.map(item => ({
      product_id: item.productId,
      product_snapshot: { 
        name: item.goodsName || item.name,
        image: item.goodsImage || item.image || (item.product_snapshot ? item.product_snapshot.image : ''),
        price: parseFloat(item.price) || 0,
        spec: item.spec,
      },
      count: parseInt(item.count) || 1,
      price: parseFloat(item.price) || 0,
      spec: item.spec ? (typeof item.spec === 'string' ? { text: item.spec } : item.spec) : undefined,
      customization_data: item.customization_data,
    }));

    const pendingOrderPayload = {
      user_id: finalUserInfo.account_name || finalUserInfo._id || finalUserInfo.id, 
      shop_id: resolvedShopId,
      items: finalOrderItems,
      total_amount: parseFloat(getTotalAmount()),
      handling_fee: parseFloat(order.value.handlingFee) || 0,
      shipping_fee: parseFloat(order.value.shippingFee) || 0,
      address_snapshot: { ...address.value }, 
      remark: order.value.remark || '',
      status: 'to_pay', 
    };
    
    console.log('[trade.vue] onBeforeUnmount - Constructed pendingOrderPayload for API:', JSON.stringify(pendingOrderPayload, null, 2));

    if (!pendingOrderPayload.shop_id || !pendingOrderPayload.items || pendingOrderPayload.items.length === 0) {
        console.warn('[trade.vue] onBeforeUnmount: shop_id or items missing in pendingOrderPayload. Aborting API call.');
        return;
    }

    // API Call
    try {
      isLoading.value = true; 
      console.log("[trade.vue] onBeforeUnmount: Calling createOrder API...");
      const response = await createOrder(pendingOrderPayload);
      if (response && response.success) {
        console.log('[trade.vue] onBeforeUnmount (API Call Succeeded): Successfully created pending_payment order. Order NO:', response.data.order_no, "ID:", response.data._id);
        
        // --- MOVED EMIT EVENT AND LOGS TO THE VERY BEGINNING OF SUCCESS BLOCK ---
        console.log('[trade.vue] onBeforeUnmount - CHECKPOINT: About to construct eventPayload and emit (MOVED TO TOP).');
        const eventPayload = {
          shopId: response.data.shop_id || pendingOrderPayload.shop_id,
          orderId: response.data.order_no,
          orderStatus: 'pending_payment', // Explicitly pending_payment here
          productName: response.data.goodsName || (response.data.items && response.data.items.length > 0 ? response.data.items[0].product_snapshot.name : (pendingOrderPayload.items && pendingOrderPayload.items.length > 0 ? pendingOrderPayload.items[0].product_snapshot.name : '商品'))
        };
        uni.$emit('orderStatusUpdatedFromTrade', eventPayload);
        console.log('[trade.vue] onBeforeUnmount - Emitted orderStatusUpdatedFromTrade event (MOVED TO TOP):', JSON.stringify(eventPayload));
        // --- END MOVED EMIT EVENT AND LOGS ---

        uni.removeStorageSync('pendingOrderLocal'); // Old key
        uni.removeStorageSync('pendingOrder_NoUser');
        uni.removeStorageSync('pendingOrder_CriticalFail');
        uni.removeStorageSync('pendingOrder_NoAddress');
        uni.removeStorageSync('pendingOrder_ApiFail');
        uni.removeStorageSync('pendingOrder_ApiException');
        uni.$emit('orders-updated'); 
        uni.$emit('order-counts-updated');
      } else {
        console.error('[trade.vue] onBeforeUnmount (API Call Failed): Failed to create pending_payment order.', response ? response.message : 'No response');
        const apiFailDraft = { ...pendingOrderPayload, error_details: "API creation failed: " + (response ? response.message : 'No response') };
        uni.setStorageSync('pendingOrder_ApiFail', apiFailDraft);
        console.log("[trade.vue] onBeforeUnmount: Saved draft to 'pendingOrder_ApiFail'.");
      }
    } catch (error) {
      console.error('[trade.vue] onBeforeUnmount (API Call Exception): Error calling createOrder API:', error);
      const apiExceptionDraft = { ...pendingOrderPayload, error_details: "API creation exception: " + error.message };
      uni.setStorageSync('pendingOrder_ApiException', apiExceptionDraft);
      console.log("[trade.vue] onBeforeUnmount: Saved draft to 'pendingOrder_ApiException'.");
    } finally {
      isLoading.value = false;
    }
  } else {
    console.log('[trade.vue] onBeforeUnmount: No items in order, or not a new order, or order already submitted. Not creating pending_payment order.');
  }
});

// 生成订单编号
function generateOrderNo() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}${random}`;
}

// 加载默认收货地址
const loadDefaultAddress = async () => {
  try {
    // 先尝试获取默认地址
    const defaultAddress = await getDefaultAddress();
    if (defaultAddress) {
      address.value = defaultAddress;
      return;
    }
    
    // 如果没有默认地址，尝试获取地址列表的第一个地址
    const addressList = await getAddressList();
    if (addressList && addressList.length > 0) {
      address.value = addressList[0];
    }
  } catch (error) {
    console.error('加载默认地址失败:', error);
  }
};

// 计算商品总金额
const getGoodsAmount = () => {
  return (order.value.price * order.value.count).toFixed(2);
};

// 计算手工费
const getHandlingFee = () => {
  return order.value.handlingFee.toFixed(2);
};

// 计算运费
const getShippingFee = () => {
  return order.value.shippingFee.toFixed(2);
};

// 计算总金额
const getTotalAmount = () => {
  return order.value.totalAmount.toFixed(2);
};

// 切换支付详情显示
function togglePaymentDetail() {
  showPaymentDetail.value = !showPaymentDetail.value;
}

// 更改收货地址
function changeAddress() {
  uni.navigateTo({
    url: '/pages/user/shipping-address?from=trade'
  });
}

// 联系客服
function contactService() {
  uni.navigateTo({
    url: '/pages/chat/customer-service'
  });
}

// 查看物流
function checkLogistics() {
  uni.navigateTo({
    url: '/pages/orders/logistics?orderNo=' + order.value.orderNo
  });
}

// 处理操作按钮点击
const handleActionButton = async () => {
  console.log('[DEBUG][trade.vue] handleActionButton - userStore.userInfo AT ENTRY:', JSON.stringify(userStore.userInfo, null, 2));
  console.log('[DEBUG][trade.vue] handleActionButton - userStore.token AT ENTRY:', userStore.token);
  console.log('[trade.vue] handleActionButton called');
  isLoading.value = true;
  console.log('[trade.vue] handleActionButton - address.value at start of handleActionButton:', JSON.stringify(address.value, null, 2));
  console.log('[trade.vue] handleActionButton - inspecting order.value.orderItems BEFORE mapping to finalOrderItems:', JSON.stringify(order.value.orderItems, null, 2));

  if (!address.value || !address.value._id) {
    uni.showToast({ title: '请选择收货地址', icon: 'none' });
    isLoading.value = false;
    return;
  }

  if (!order.value.orderItems || order.value.orderItems.length === 0) {
    uni.showToast({ title: '订单中没有商品', icon: 'none' });
    isLoading.value = false;
    return;
  }
  
  let finalUserInfo = null;
  if (userStore.userInfo && (userStore.userInfo._id || userStore.userInfo.id)) {
    finalUserInfo = userStore.userInfo;
  } else {
    const userInfoFromStorage = uni.getStorageSync('userInfo');
    if (userInfoFromStorage && (userInfoFromStorage._id || userInfoFromStorage.id)) {
      finalUserInfo = userInfoFromStorage;
       if (!userStore.userInfo || !(userStore.userInfo._id || userStore.userInfo.id)) {
          userStore.setUserInfo(finalUserInfo);
          console.warn("[trade.vue] handleActionButton: Synced userStore with userInfo from localStorage.");
      }
    }
  }

  if (!finalUserInfo || !(finalUserInfo._id || finalUserInfo.id)) {
    uni.showToast({ title: '无法获取用户信息，请重新登录', icon: 'none' });
    isLoading.value = false;
    return;
  }

  const resolvedShopId = order.value.shopId || (order.value.orderItems && order.value.orderItems.length > 0 ? order.value.orderItems[0].shopId : undefined);
  const finalOrderItems = order.value.orderItems.map(item => ({
    product_id: item.productId,
    product_snapshot: { 
      name: item.goodsName || item.name,
      image: item.goodsImage || item.image || (item.product_snapshot ? item.product_snapshot.image : ''),
      price: parseFloat(item.price) || 0,
      spec: item.spec,
    },
    count: parseInt(item.count) || 1,
    price: parseFloat(item.price) || 0,
    spec: item.spec ? (typeof item.spec === 'string' ? { text: item.spec } : item.spec) : undefined,
    customization_data: item.customization_data,
  }));

  const orderPayload = {
    user_id: finalUserInfo.account_name || finalUserInfo._id || finalUserInfo.id, // Prioritize account_name for user_id
    shop_id: resolvedShopId,
    items: finalOrderItems,
    total_amount: parseFloat(getTotalAmount()), 
    handling_fee: parseFloat(order.value.handlingFee) || 0,
    shipping_fee: parseFloat(order.value.shippingFee) || 0,
    address_snapshot: { ...address.value }, // Ensure a clean copy
    remark: order.value.remark || '',
    status: 'to_ship',
  };
  
  console.log('[trade.vue] handleActionButton - orderPayload for createOrder (status: to_ship):', JSON.stringify(orderPayload, null, 2));

  if (!orderPayload.shop_id || !orderPayload.items || orderPayload.items.length === 0) {
    uni.showToast({ title: '店铺ID或商品缺失，无法创建订单', icon: 'none' });
    isLoading.value = false;
    return;
  }

  try {
    const response = await createOrder(orderPayload);
    if (response && response.success) {
      orderSubmittedViaButton.value = true; // Set the flag here
      uni.showToast({ title: '订单创建成功！', icon: 'success' });
      uni.removeStorageSync('pendingOrderLocal'); 
      uni.removeStorageSync('pendingOrderLocalFallback');
      isNewOrder.value = false; 
      order.value.orderNo = response.data.order_no; 
      order.value._id = response.data._id; // Use _id from response
      order.value.status = response.data.status; // Update status from response, likely still 'to_pay' or 'processing'

      // --- BEGIN EMIT EVENT ---
      const eventPayload = {
        shopId: response.data.shop_id || orderPayload.shop_id,
        orderId: response.data.order_no,
        orderStatus: response.data.status, // Use status from API response
        productName: response.data.goodsName || (response.data.items && response.data.items.length > 0 ? response.data.items[0].product_snapshot.name : (orderPayload.items && orderPayload.items.length > 0 ? orderPayload.items[0].product_snapshot.name : '商品'))
      };
      uni.$emit('orderStatusUpdatedFromTrade', eventPayload);
      console.log('[trade.vue] handleActionButton - Emitted orderStatusUpdatedFromTrade event:', JSON.stringify(eventPayload));
      // --- END EMIT EVENT ---

      uni.$emit('orders-updated'); 
      uni.$emit('order-counts-updated'); 
      
      // 假设支付成功（测试阶段），直接跳转到详情页
      // 如果是真实支付，这里应该是跳转到支付网关，支付成功后再跳转详情或更新状态
      const redirectUrl = `/pages/orders/order-detail?orderId=${response.data._id}`;
      uni.redirectTo({ url: redirectUrl });

    } else {
      uni.showToast({ title: response.message || '创建订单失败', icon: 'none', duration: 3000 });
    }
  } catch (error) {
    console.error('[trade.vue] handleActionButton - createOrder error:', error);
    uni.showToast({ title: '创建订单异常，请稍后再试', icon: 'none', duration: 3000 });
  } finally {
    isLoading.value = false;
  }
};

// 计算属性
const showShipTime = computed(() => {
  return ['shipped', 'to_receive', 'completed'].includes(orderStatus.value);
});

const showCompleteTime = computed(() => {
  return orderStatus.value === 'completed';
});

const showLogistics = computed(() => {
  return ['shipped', 'to_receive'].includes(orderStatus.value);
});

const showActionButton = computed(() => {
  return ['to_pay', 'to_receive'].includes(orderStatus.value);
});

function getActionButtonText() {
  const buttonTextMap = {
    'to_pay': '继续付款',
    'to_receive': '确认收货'
  };
  return buttonTextMap[orderStatus.value] || '';
}

// 返回上一页
function goBack() {
  uni.showModal({
    title: '提示',
    content: '返回后商品将被加入待付款订单，确定要返回吗？',
    success: (res) => {
      if (res.confirm) {
        // 如果是从购物车页面来的，使用navigateBack
        const pages = getCurrentPages();
        if (pages.length > 1) {
          uni.navigateBack({
            delta: 1
          });
        } else {
          // 如果没有上一页，则跳转到首页
          uni.switchTab({
            url: '/pages/main/home/home'
          });
        }
      }
    }
  });
}

// 获取状态文本
function getStatusText(status) {
  const statusMap = {
    'to_pay': '待付款',
    'paid': '已付款',
    'to_ship': '待发货',
    'shipped': '已发货',
    'to_receive': '待收货',
    'completed': '交易成功'
  };
  return statusMap[status] || '';
}

// 格式化时间
function formatTime(time) {
  if (!time) return '--';
  return formatDate(new Date(time), 'yyyy-MM-dd HH:mm:ss');
}
</script>

<style lang="scss">
.trade-container {
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
  display: flex;
  align-items: center;
  
  .address-info {
    flex: 1;
    
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
  
  .arrow {
    font-size: 36rpx;
    color: #999;
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
    border-bottom: 1rpx solid #f5f5f5;
    
    &:last-child {
      border-bottom: none;
    }
    
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
}
</style> 