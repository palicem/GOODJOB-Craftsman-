/**
 * 购物车服务 - 管理购物车数据
 * 
 * TODO: 后期需要迁移到后端的API调用
 * 参考API文档: docs/api/api-doc.md - 购物车模块接口
 */

// 保存购物车列表 - 后期移至后端
export const saveCartList = (cartList) => {
  // TODO: 后期不需要在前端保存，而是在后端存储到数据库中
  try {
    console.log('保存购物车列表, 数据项数:', cartList.length);
    // 直接使用字符串化操作保存
    const cartString = JSON.stringify(cartList);
    uni.setStorageSync('cartList', cartString);
    
    // 立即验证存储是否成功
    const verifyStorage = uni.getStorageSync('cartList');
    console.log('验证保存的购物车数据:', verifyStorage ? verifyStorage.substring(0, 50) + '...' : '空');
    
    return true;
  } catch (e) {
    console.error('保存购物车列表失败:', e);
    return false;
  }
}

// 获取购物车列表 - 后期从API获取
export const getCartList = () => {
  // TODO: 改为调用后端API: GET /cart/items
  try {
    console.log('获取购物车列表...');
    const cartStorage = uni.getStorageSync('cartList');
    console.log('从storage获取到的购物车原始数据:', cartStorage);
    
    if (!cartStorage) {
      console.log('购物车为空，返回空数组');
      return [];
    }
    
    try {
      const cartList = JSON.parse(cartStorage);
      
      // 验证是否为数组
      if (!Array.isArray(cartList)) {
        console.error('解析后的购物车数据不是数组，返回空数组');
        return [];
      }
      
      console.log('解析购物车成功，共有项目:', cartList.length);
      return cartList;
    } catch (parseErr) {
      console.error('解析购物车JSON数据失败:', parseErr);
      return [];
    }
  } catch (e) {
    console.error('获取购物车列表失败:', e);
    return [];
  }
}

// 添加商品到购物车 - 后期调用后端API
export const addToCart = (goods) => {
  // TODO: 改为调用后端API: POST /cart/add
  try {
    console.log('addToCart函数被调用，商品数据:', JSON.stringify(goods));
    
    // 验证商品数据的必要字段
    if (!goods || !goods.id || !goods.goodsName || typeof goods.price !== 'number') {
      console.error('添加购物车失败：商品数据不完整 (id, name, or price is invalid)', goods);
      return false;
    }
    
    // 先直接从存储中获取原始数据
    let cartStorage = uni.getStorageSync('cartList');
    console.log('获取到的原始cartList字符串:', cartStorage);
    
    // 解析购物车数据
    let cartList = [];
    try {
      cartList = cartStorage ? JSON.parse(cartStorage) : [];
      if (!Array.isArray(cartList)) {
        console.error('购物车数据不是数组，重置为空数组');
        cartList = [];
      }
    } catch (err) {
      console.error('解析购物车数据出错，重置为空数组:', err);
      cartList = [];
    }
    
    console.log('当前购物车列表:', cartList);
    
    // 检查商品是否已存在于购物车 - 修正商品ID比较条件
    const existingIndex = cartList.findIndex(item => 
      item.id === goods.id && 
      item.spec === goods.spec
    );
    
    if (existingIndex > -1) {
      // 如果已存在，增加数量
      cartList[existingIndex].count += goods.count || 1;
      console.log('商品已存在，增加数量至:', cartList[existingIndex].count);
    } else {
      // 添加新商品到购物车，设置默认选中状态
      const newGoods = {
        ...goods,
        count: goods.count || 1,
        selected: true,
        timestamp: new Date().getTime()
      };
      cartList.push(newGoods);
      console.log('添加新商品到购物车:', newGoods);
    }
    
    // 保存购物车数据 - 直接使用字符串化操作
    const cartString = JSON.stringify(cartList);
    console.log('准备保存的购物车数据字符串:', cartString);
    
    // 确保存储成功
    try {
      uni.setStorageSync('cartList', cartString);
      console.log('保存购物车成功');
    } catch (err) {
      console.error('保存购物车时出错:', err);
      return false;
    }
    
    // 立即验证存储是否成功
    try {
      const verifyStorage = uni.getStorageSync('cartList');
      console.log('验证存储的数据:', verifyStorage);
      
      const updatedCart = verifyStorage ? JSON.parse(verifyStorage) : [];
      console.log('解析后的购物车数据:', updatedCart);
      
      return updatedCart && updatedCart.length > 0;
    } catch (err) {
      console.error('验证购物车时出错:', err);
      return false;
    }
  } catch (e) {
    console.error('添加到购物车失败:', e);
    return false;
  }
}

// 从购物车中移除商品 - 后期调用后端API
export const removeFromCart = (goodsIds) => {
  // TODO: 改为调用后端API: DELETE /cart/remove/{cartItemId}
  try {
    console.log('从购物车移除商品, ID:', goodsIds);
    let cartList = getCartList();
    console.log('移除前购物车商品数:', cartList.length);
    
    if (Array.isArray(goodsIds)) {
      // 批量删除
      cartList = cartList.filter(item => !goodsIds.includes(item.id));
    } else {
      // 单个删除
      cartList = cartList.filter(item => item.id !== goodsIds);
    }
    
    console.log('移除后购物车商品数:', cartList.length);
    // 使用我们的保存函数而不是直接调用setStorageSync
    const result = saveCartList(cartList);
    return result;
  } catch (e) {
    console.error('从购物车移除失败:', e);
    return false;
  }
}

// 更新商品数量 - 后期调用后端API
export const updateCartItemCount = (goodsId, count) => {
  // TODO: 改为调用后端API: PUT /cart/update-count
  try {
    let cartList = getCartList();
    const index = cartList.findIndex(item => item.id === goodsId);
    
    if (index > -1) {
      cartList[index].count = count;
      saveCartList(cartList);
      return true;
    }
    return false;
  } catch (e) {
    console.error('更新购物车商品数量失败:', e);
    return false;
  }
}

// 更新商品选中状态 - 后期调用后端API
export const updateCartItemSelection = (goodsId, selected) => {
  // TODO: 改为调用后端API: PUT /cart/toggle-select
  try {
    let cartList = getCartList();
    const index = cartList.findIndex(item => item.id === goodsId);
    
    if (index > -1) {
      cartList[index].selected = selected;
      saveCartList(cartList);
      return true;
    }
    return false;
  } catch (e) {
    console.error('更新购物车商品选中状态失败:', e);
    return false;
  }
}

// 全选/取消全选 - 后期调用后端API
export const toggleSelectAll = (selected) => {
  // TODO: 可在前端循环调用购物车选中状态更新API
  try {
    let cartList = getCartList();
    cartList.forEach(item => {
      item.selected = selected;
    });
    saveCartList(cartList);
    return true;
  } catch (e) {
    console.error('全选/取消全选失败:', e);
    return false;
  }
}

// 获取购物车商品总数 - 前端计算可保留，或改为服务端返回
export const getCartTotalCount = () => {
  // TODO: 可在前端计算，或从购物车列表API返回值中获取
  try {
    const cartList = getCartList();
    return cartList.reduce((total, item) => total + item.count, 0);
  } catch (e) {
    console.error('获取购物车商品总数失败:', e);
    return 0;
  }
}

// 获取购物车选中商品总价 - 前端计算可保留，或改为服务端返回
export const getCartSelectedTotal = () => {
  // TODO: 可在前端计算，或从购物车列表API返回值中获取
  try {
    const cartList = getCartList();
    return cartList
      .filter(item => item.selected)
      .reduce((total, item) => total + (item.price * item.count), 0);
  } catch (e) {
    console.error('获取购物车选中商品总价失败:', e);
    return 0;
  }
}

// 清空购物车 - 后期调用后端API
export const clearCart = () => {
  // TODO: 可循环调用移除商品API，或新增清空购物车API
  try {
    uni.removeStorageSync('cartList');
    return true;
  } catch (e) {
    console.error('清空购物车失败:', e);
    return false;
  }
} 