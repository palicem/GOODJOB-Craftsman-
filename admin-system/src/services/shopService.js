import request from '@/utils/request'

// Helper to get current shopId from localStorage
const getCurrentShopId = () => {
  const shopId = localStorage.getItem('currentShop');
  if (!shopId) {
    // This case should ideally be handled by UI logic to prevent calls without a selected shop
    console.error('No current shop selected. API calls to shop endpoints will likely fail.');
    // throw new Error('No current shop selected. Please select a shop first.');
  }
  return shopId;
}

// --- Shop Profile ---
export function getShopProfile(shopId) {
  const currentShop = shopId || getCurrentShopId();
  if (!currentShop) return Promise.reject(new Error('Shop ID is required.'));
  return request({
    url: `/shops/${currentShop}/profile`,
    method: 'get'
  })
}

export function updateShopProfile(shopId, data) {
  const currentShop = shopId || getCurrentShopId();
  if (!currentShop) return Promise.reject(new Error('Shop ID is required.'));
  return request({
    url: `/shops/${currentShop}/profile`,
    method: 'put',
    data
  })
}


// --- Product Management ---
export function getProductList(shopId, params) {
  const currentShop = shopId || getCurrentShopId();
  if (!currentShop) return Promise.reject(new Error('Shop ID is required for fetching products.'));
  return request({
    url: `/shops/${currentShop}/products`,
    method: 'get',
    params
  })
}

export function getProductDetail(shopId, productId) {
  const currentShop = shopId || getCurrentShopId();
  if (!currentShop) return Promise.reject(new Error('Shop ID is required.'));
  if (!productId) return Promise.reject(new Error('Product ID is required.'));
  return request({
    url: `/shops/${currentShop}/products/${productId}`,
    method: 'get'
  })
}

export function addProduct(shopId, data) {
  const currentShop = shopId || getCurrentShopId();
  if (!currentShop) return Promise.reject(new Error('Shop ID is required.'));
  return request({
    url: `/shops/${currentShop}/products`,
    method: 'post',
    data // product_id should be in data
  })
}

export function updateProduct(shopId, productId, data) {
  const currentShop = shopId || getCurrentShopId();
  if (!currentShop) return Promise.reject(new Error('Shop ID is required.'));
  if (!productId) return Promise.reject(new Error('Product ID is required.'));
  return request({
    url: `/shops/${currentShop}/products/${productId}`,
    method: 'put',
    data
  })
}

export function deleteProduct(shopId, productId) {
  const currentShop = shopId || getCurrentShopId();
  if (!currentShop) return Promise.reject(new Error('Shop ID is required.'));
  if (!productId) return Promise.reject(new Error('Product ID is required.'));
  return request({
    url: `/shops/${currentShop}/products/${productId}`,
    method: 'delete'
  })
}

// --- Order Management ---
export function getOrderList(shopId, params) {
  const currentShop = shopId || getCurrentShopId();
  if (!currentShop) return Promise.reject(new Error('Shop ID is required for fetching orders.'));
  return request({
    url: `/shops/${currentShop}/orders`,
    method: 'get',
    params
  });
}

export function createOrder(shopId, data) {
    const currentShop = shopId || getCurrentShopId();
    if (!currentShop) return Promise.reject(new Error('Shop ID is required for creating an order.'));
    return request({
        url: `/shops/${currentShop}/orders`,
        method: 'post',
        data
    });
}

export function deleteOrder(shopId, orderNo) {
  const currentShop = shopId || getCurrentShopId();
  if (!currentShop) return Promise.reject(new Error('Shop ID is required for deleting an order.'));
  if (!orderNo) return Promise.reject(new Error('Order No is required for deleting an order.'));
  return request({
    url: `/shops/${currentShop}/orders/${orderNo}`,
    method: 'delete'
  });
}

export function updateOrderStatus(shopId, orderNo, statusData) {
  const currentShop = shopId || getCurrentShopId();
  if (!currentShop) return Promise.reject(new Error('Shop ID is required for updating order status.'));
  if (!orderNo) return Promise.reject(new Error('Order No is required for updating order status.'));
  if (!statusData || !statusData.status) return Promise.reject(new Error('New status is required.'));
  
  return request({
    url: `/shops/${currentShop}/orders/${orderNo}/status`,
    method: 'put',
    data: statusData // e.g., { status: 'to_receive', tracking_number: '123', shipping_company: 'SF' }
  });
}

// New service function to cancel an order
export function cancelOrder(shopId, orderNo) {
  const currentShop = shopId || getCurrentShopId();
  if (!currentShop) return Promise.reject(new Error('Shop ID is required for cancelling an order.'));
  if (!orderNo) return Promise.reject(new Error('Order No is required for cancelling an order.'));
  return request({
    url: `/shops/${currentShop}/orders/${orderNo}/cancel`,
    method: 'put' 
  });
}

// New service function to get dashboard statistics
export function getDashboardStats(shopId) {
  const currentShop = shopId || getCurrentShopId();
  if (!currentShop) return Promise.reject(new Error('Shop ID is required for fetching dashboard stats.'));
  return request({
    url: `/shops/${currentShop}/dashboard-stats`,
    method: 'get'
  });
}

// --- Product Categories (Example, if managed per shop) ---
// export function getCategories(shopId) {
//   const currentShop = shopId || getCurrentShopId();
//   if (!currentShop) return Promise.reject(new Error('Shop ID is required.'));
//   return request({
//     url: `/shops/${currentShop}/categories`,
//     method: 'get'
//   })
// }

// General upload (if not shop-specific, or if backend handles shop association via token/session)
// If uploads are shop specific and require shopId in path, adjust this.
export function uploadImage(data) {
  // This might need to be a general endpoint or one that infers shopId on the backend
  return request({
    url: '/upload', // Assuming a general upload endpoint for now
    method: 'post',
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    data
  })
} 