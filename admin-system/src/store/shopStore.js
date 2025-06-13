import { ref } from 'vue';

// 从 localStorage 初始化，如果没有则为空字符串或第一个有效店铺（如果全局可知）
const initialShopId = localStorage.getItem('currentShop') || '';
export const globalCurrentShopId = ref(initialShopId);

export function updateGlobalShopId(newShopId) {
  if (newShopId === null || newShopId === undefined) {
    // console.warn('Attempted to set globalShopId to null/undefined. Clearing instead.');
    localStorage.removeItem('currentShop');
    globalCurrentShopId.value = '';
  } else {
    localStorage.setItem('currentShop', newShopId);
    globalCurrentShopId.value = newShopId;
  }
  // console.log(`ShopStore: globalCurrentShopId updated to '${globalCurrentShopId.value}'. localStorage: '${localStorage.getItem('currentShop') || ''}'`);
}

// 可选：提供一个函数来获取初始加载时的店铺列表，以便设置默认店铺
// export function initializeDefaultShop(availableShops) {
//   if (!globalCurrentShopId.value && availableShops && availableShops.length > 0) {
//     const firstActiveShop = availableShops.find(shop => shop.status === 'approved');
//     if (firstActiveShop) {
//       updateGlobalShopId(firstActiveShop.id);
//     }
//   }
// } 
 