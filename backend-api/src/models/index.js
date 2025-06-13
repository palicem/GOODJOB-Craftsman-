import { getUserDBConnection, getShopDBConnection, getOrdersDBConnection } from '../config/db.js';

// User DB Models
import createUserModel from './user/User.js';
import createUserAddressModel from './user/UserAddress.js';
import createProductFavoriteModel from './user/ProductFavorite.js';
import createShopFavoriteModel from './user/ShopFavorite.js';
// Corrected import paths for global Order and OrderItem models
import { createOrderModel } from './order/Order.js'; 
import { createOrderItemModel } from './order/OrderItem.js';

// Shop DB Models (dynamic based on shopId)
import { createShopProfileModel } from './shop/ShopProfile.js';
import createProductCategoryModel from './shop/ProductCategory.js';
import createProductModel from './shop/Product.js';
// Order and OrderItem removed from shop-specific models as they are global

const models = {}; // Cache for loaded models to avoid recompilation

/**
 * Gets all models for the User database.
 * These models are typically singletons after the first connection.
 */
export async function getUserModels() {
  const connection = await getUserDBConnection();
  console.log('[models/index.js] getUserModels called. Cache exists for User/Address/Favorites:', !!models.userDBCacheCore);

  // 创建或从缓存获取核心用户模型 (User, UserAddress, Favorites)
  if (!models.userDBCacheCore) { 
    console.log('[models/index.js] Cache MISS for userDBCacheCore. Creating new core user models.');
    models.userDBCacheCore = {
      User: createUserModel(connection),
      UserAddress: createUserAddressModel(connection),
      ProductFavorite: createProductFavoriteModel(connection),
      ShopFavorite: createShopFavoriteModel(connection),
    };
  } else {
    console.log('[models/index.js] Cache HIT for userDBCacheCore.');
  }

  // !! 重要：为 Order 和 OrderItem 总是重新创建模型以进行测试 !!
  console.log('[models/index.js] ALWAYS Re-creating Order and OrderItem models for testing purposes (on original user_db connection via getUserModels).');
  const Order = createOrderModel(connection);
  const OrderItem = createOrderItemModel(connection);
  console.log('[models/index.js] Fresh Order model created. Type:', typeof Order);
  console.log('[models/index.js] Fresh OrderItem model created. Type:', typeof OrderItem);

  return {
    ...models.userDBCacheCore,
    Order,
    OrderItem,
  };
}

/**
 * Gets all models for a specific Shop database.
 * Models are cached per shopId to avoid recompilation on the same connection.
 * @param {string} shopId - The ID of the shop.
 */
export async function getShopModels(shopId) {
  if (!shopId) {
    throw new Error('Shop ID is required to get shop models.');
  }
  const cacheKey = `shop_${shopId}`;
  if (models[cacheKey]) {
    return models[cacheKey];
  }

  const connection = await getShopDBConnection(shopId);

  // Check if models are already compiled on the connection (e.g., by dynamic helpers)
  const ShopProfile = connection.models.ShopProfile || createShopProfileModel(connection);
  const ProductCategory = connection.models.ProductCategory || createProductCategoryModel(connection);
  const Product = connection.models.Product || createProductModel(connection);

  models[cacheKey] = {
    ShopProfile: ShopProfile,
    ProductCategory: ProductCategory,
    Product: Product,
  };
  return models[cacheKey];
}

/**
 * Gets Order and OrderItem models specifically connected to the Orders Database.
 */
export async function getGlobalOrderModels() {
  const connection = await getOrdersDBConnection(); // Use orders_db connection
  console.log('[models/index.js] getGlobalOrderModels called.');

  // Consider caching these models if re-creation is not strictly for testing
  // For consistency with the current pattern of re-creating for Order/OrderItem:
  console.log('[models/index.js] ALWAYS Re-creating Order and OrderItem models via getGlobalOrderModels (on orders_db).');
  const Order = createOrderModel(connection);
  const OrderItem = createOrderItemModel(connection);
  console.log('[models/index.js] Fresh Order model created via getGlobalOrderModels. Type:', typeof Order);
  console.log('[models/index.js] Fresh OrderItem model created via getGlobalOrderModels. Type:', typeof OrderItem);

  return {
    Order,
    OrderItem,
  };
}

// Note: No need for module.exports with ES modules, individual functions are exported. 