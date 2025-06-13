import { getShopModels, getUserModels, getGlobalOrderModels } from '../models/index.js';
import { getUserDBConnection } from '../config/db.js'; // Directly import from db.js
import mongoose from 'mongoose';

// Middleware to set shop models on req object
async function selectShopDB(req, res, next) {
    const shopId = req.params.shopId || req.body.shop_id || req.query.shopId; // Get shopId from params, body, or query
    if (!shopId) {
        console.log('[Log][ShopCtrlMW] Shop ID is missing for shop-specific operation.');
        // If no shopId is provided for a shop-specific route, this is a client error.
        // However, for routes that might operate globally OR on a specific shop, 
        // we might allow it to pass and check shopId presence in the handler itself.
        // For now, assuming shopId is generally required if this middleware is used.
        return res.status(400).json({ message: 'Shop ID is required for this operation.' });
    }
    try {
        console.log(`[Log][ShopCtrlMW] Selecting database for shop ID: ${shopId}`);
        const models = await getShopModels(shopId);
        req.shopModels = models;
        req.currentShopId = shopId; // Store shopId for later use in controllers
        
        // REVERTED: No longer adding adminDB here.
        // if (mongoose.connection && mongoose.connection.db) {
        //     req.adminDB = mongoose.connection.db.admin();
        //     console.log(`[Log][ShopCtrlMW] Attached adminDB interface.`);
        // } else {
        //     console.warn('[Warn][ShopCtrlMW] Default Mongoose connection or DB not available to attach adminDB.');
        // }

        console.log(`[Log][ShopCtrlMW] Successfully selected database and models for shop ID: ${shopId}`);
        next();
    } catch (error) {
        console.error(`[Error][ShopCtrlMW] Failed to get models for shop ${shopId}:`, error);
        // It's crucial to check the error type. If it's a connection error to a specific shop DB,
        // it might not be a 500 for the whole app, but rather a specific issue with that shop's DB.
        res.status(500).json({ message: `Failed to connect to shop database for shop ${shopId}. ${error.message}` });
    }
}

// --- New Internal Service Function ---
/**
 * Fetches product details from a specific shop's database.
 * This function is intended for internal use by other controllers/services.
 * @param {string} shopId - The ID of the shop.
 * @param {string} productId - The original product ID (product_id field in shop's Product model).
 * @returns {Promise<Object|null>} The product object if found, otherwise null.
 */
export const fetchProductDetailsForOrder = async (shopId, productId) => {
  console.log(`[Log][ShopCtrlInternal] Attempting to fetch product ID ${productId} for shop: ${shopId}`);
  if (!shopId || !productId) {
    console.error('[Error][ShopCtrlInternal] Shop ID or Product ID is missing.');
    return null;
  }
  try {
    const shopSpecificModels = await getShopModels(shopId); // Get models for the specific shop
    const { Product } = shopSpecificModels;
    
    // In the Product model for shops, product_id is the custom identifier, not _id.
    const product = await Product.findOne({ product_id: productId, shop_id: shopId }).lean(); // Ensure lean for plain object

    if (!product) {
      console.log(`[Log][ShopCtrlInternal] Product ID ${productId} not found in shop: ${shopId}`);
      return null;
    }
    console.log(`[Log][ShopCtrlInternal] Successfully fetched product ID ${productId} for shop: ${shopId}`);
    return product;
  } catch (error) {
    console.error(`[Error][ShopCtrlInternal] Error fetching product ID ${productId} for shop ${shopId}:`, error);
    return null; // Return null on error to allow calling function to handle
  }
};
// --- End New Internal Service Function ---

export const getShopNameById = async (shopId) => {
  console.log(`[Log][ShopCtrlInternal][getShopNameById] Attempting to fetch shop name for shop ID: ${shopId}`);
  if (!shopId) {
    console.error('[Error][ShopCtrlInternal][getShopNameById] Shop ID is missing.');
    return '未知店铺';
  }
  try {
    const shopSpecificModels = await getShopModels(shopId); // Get models for the specific shop
    const { ShopProfile: ShopProfileModel } = shopSpecificModels;

    if (!ShopProfileModel) {
        // This case should ideally not happen if getShopModels works as expected and ShopProfile.js is correct.
        console.error(`[Error][ShopCtrlInternal][getShopNameById] ShopProfile model was not retrieved by getShopModels for shop: ${shopId}.`);
        return '店铺配置模型加载失败';
    }

    const profile = await ShopProfileModel.findOne({ shop_id: shopId }).lean();

    if (!profile || !profile.name) {
      console.log(`[Log][ShopCtrlInternal][getShopNameById] Shop name not found for shop ID: ${shopId} in its shopprofiles collection.`);
      // Attempt to use shopId as a fallback name if profile exists but name is missing
      return profile ? `店铺 (${shopId})` : '店铺信息待补充';
    }
    console.log(`[Log][ShopCtrlInternal][getShopNameById] Successfully fetched shop name "${profile.name}" for shop ID: ${shopId}`);
    return profile.name;
  } catch (error) {
    console.error(`[Error][ShopCtrlInternal][getShopNameById] Error fetching shop name for shop ID ${shopId}:`, error);
    return '店铺名称查询异常'; 
  }
};

// Get shop profile (specific to the shop's own database)
export const getShopProfile = async (req, res) => {
  console.log(`[Log][ShopCtrl] Attempting to fetch profile for shop: ${req.currentShopId}`);
  try {
    const { ShopProfile } = req.shopModels;
    const shopId = req.params.shopId;

    let profile = await ShopProfile.findOne({ shop_id: shopId }).lean(); // Use .lean() for plain JS object

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Shop profile not found.' }); // Add success: false
    }
    
    // Wrap the profile data in a consistent success response structure
    res.status(200).json({ success: true, data: profile, message: '店铺配置信息获取成功' });
  } catch (error) {
    console.error(`[ShopController] Error getting shop profile for ${req.params.shopId}:`, error);
    res.status(500).json({ success: false, message: 'Error getting shop profile', error: error.message });
  }
};

// Create or Update shop profile (in its own database)
export const upsertShopProfile = async (req, res) => {
  console.log(`[Log][ShopCtrl] Attempting to upsert profile for shop: ${req.currentShopId}`);
  const { name, logo, description, location, contact_info, status } = req.body; // Added contact_info and status
  const shopId = req.currentShopId;

  if (!name && !req.body.shop_id) { // shop_id might come with an initial setup, name is generally required for updates
      // If it's a true upsert (profile might not exist), shop_id from param is primary key
      // Name might not be present if only status or other fields are updated without a full form submission
      // However, for a new profile, name is essential.
      const existingProfile = await req.shopModels.ShopProfile.findOne({ shop_id: shopId });
      if (!existingProfile && !name) {
         return res.status(400).json({ message: 'Shop name is required for new profiles.' });
      }
  }

  try {
    const { ShopProfile } = req.shopModels;
    const profileData = {
      shop_id: shopId,
      name,
      logo,
      description,
      location,
      contact_info, // Added contact_info
      status // Added status, allowing it to be updated
    };

    // Remove undefined fields so they don't overwrite existing data with null/undefined during partial updates
    Object.keys(profileData).forEach(key => profileData[key] === undefined && delete profileData[key]);

    if (Object.keys(profileData).length <= 1 && profileData.shop_id) { // Only shop_id present means no actual data to update
        const existingProfile = await ShopProfile.findOne({ shop_id: shopId });
        if (existingProfile) return res.status(200).json(existingProfile); // No changes, return existing
        // If no profile and no data, this case should be handled by name requirement or return error
    }


    // Find one by shop_id (which should be unique for the shop db) and update, or insert if not found.
    const updatedProfile = await ShopProfile.findOneAndUpdate(
      { shop_id: shopId },
      { $set: profileData }, // Use $set to only update provided fields
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    console.log(`[Log][ShopCtrl] Successfully upserted profile for shop: ${shopId}`);
    console.log('[Log][ShopCtrl] Profile data sent to DB:', profileData);
    console.log('[Log][ShopCtrl] Profile data received from DB:', updatedProfile);
    res.status(200).json(updatedProfile);
  } catch (error) {
    console.error(`[Error][ShopCtrl] Error upserting profile for shop ${shopId}:`, error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation Error', errors: error.errors });
    }
    res.status(500).json({ message: error.message });
  }
};


// Product specific CRUD operations
export const getAllProducts = async (req, res) => {
  console.log(`[Log][ShopCtrl][Product] Attempting to fetch all products for shop: ${req.currentShopId}`);
  try {
    const { Product } = req.shopModels;
    const products = await Product.find({ shop_id: req.currentShopId }); // Ensure products belong to the current shop context
    console.log(`[Log][ShopCtrl][Product] Successfully fetched ${products.length} products for shop: ${req.currentShopId}`);
    res.status(200).json({ success: true, data: products, message: '店铺商品获取成功' });
  } catch (error) {
    console.error(`[Error][ShopCtrl][Product] Error fetching products for shop ${req.currentShopId}:`, error);
    res.status(500).json({ success: false, message: error.message || '获取店铺商品失败', data: null });
  }
};

export const createProduct = async (req, res) => {
  console.log(`[Log][ShopCtrl][Product] Attempting to create product for shop: ${req.currentShopId} with data for product ID:`, req.body.product_id);
  try {
    const { Product } = req.shopModels;
    
    // Destructure only the expected fields from req.body, EXCLUDING _id
    const { 
      name, 
      description, 
      price, 
      original_price, 
      images, 
      detail_images, 
      stock, 
      category_id,
      location, 
      status, 
      is_customizable, 
      specs,
      product_id // Our custom business product ID
      // Add any other fields you expect from the client for a new product
    } = req.body;

    // Construct productData carefully, ensuring shop_id is from a trusted source (middleware)
    // and _id is NOT included, so MongoDB generates it.
    const productDataForSave = {
      name,
      description,
      price,
      original_price,
      images,
      detail_images,
      stock,
      category_id,
      location,
      status,
      is_customizable,
      specs,
      product_id, // This is our business logic ID
      shop_id: req.currentShopId // shop_id from middleware
    };
    
    // Validate product_id (our business ID) uniqueness within this shop
    if (productDataForSave.product_id) { // Only validate if product_id is provided
        const existingProduct = await Product.findOne({ 
            product_id: productDataForSave.product_id, 
            shop_id: req.currentShopId 
        });
    if (existingProduct) {
            console.log(`[Log][ShopCtrl][Product] Product creation failed: Business Product ID ${productDataForSave.product_id} already exists for shop ${req.currentShopId}`);
            return res.status(400).json({ message: `Product with business ID ${productDataForSave.product_id} already exists in this shop.` });
    }
    } else {
        // Optional: If product_id is mandatory from frontend, handle error
        // Or, if backend can generate it:
        // productDataForSave.product_id = generateUniqueBusinessId(); 
        console.warn(`[Warn][ShopCtrl][Product] Business product_id was not provided from frontend for shop ${req.currentShopId}. Depending on schema, this might be an issue.`);
    }

    const newProduct = new Product(productDataForSave);
    const savedProduct = await newProduct.save();
    console.log(`[Log][ShopCtrl][Product] Successfully created product: ${savedProduct.name} (MongoDB _id: ${savedProduct._id}, Business ID: ${savedProduct.product_id}) for shop: ${req.currentShopId}`);
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error(`[Error][ShopCtrl][Product] Error creating product for shop ${req.currentShopId}:`, error);
    // Check if it's a Mongoose validation error for more specific feedback
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation Error', errors: error.errors });
    }
    res.status(500).json({ message: error.message || 'Failed to create product due to an internal error.' });
  }
};

export const getProductById = async (req, res) => {
  const productId = req.params.productId;
  const currentShopId = req.currentShopId; // Capture shopId for clarity
  console.log(`[Log][ShopCtrl][Product] Attempting to fetch product ID ${productId} for shop: ${currentShopId}`);
  try {
    const { Product } = req.shopModels;
    // Use .lean() to get a plain JavaScript object, making it easier to add properties
    const product = await Product.findOne({ product_id: productId, shop_id: currentShopId }).lean(); 
    
    if (!product) {
      console.log(`[Log][ShopCtrl][Product] Product ID ${productId} not found for shop: ${currentShopId}`);
      return res.status(404).json({ success: false, message: 'Product not found', data: null });
    }

    // Fetch shop name
    const shopName = await getShopNameById(currentShopId);

    // Add shop_name to the product object
    const productWithShopName = { ...product, shop_name: shopName };

    console.log(`[Log][ShopCtrl][Product] Successfully fetched product ID ${productId} for shop: ${currentShopId}, including shop name: ${shopName}`);
    res.status(200).json({ success: true, data: productWithShopName, message: '商品详情获取成功' });
  } catch (error) {
    console.error(`[Error][ShopCtrl][Product] Error fetching product ID ${productId} for shop ${currentShopId}:`, error);
    res.status(500).json({ success: false, message: error.message || '获取商品详情失败', data: null });
  }
};

export const updateProduct = async (req, res) => {
  const productId = req.params.productId;
  console.log(`[Log][ShopCtrl][Product] Attempting to update product ID ${productId} for shop: ${req.currentShopId} with data:`, req.body);
  try {
    const { Product } = req.shopModels;
    // Ensure shop_id from the URL/middleware is used, overriding any shop_id in the body for security.
    const updatedProduct = await Product.findOneAndUpdate(
      { product_id: productId, shop_id: req.currentShopId },
      { ...req.body, shop_id: req.currentShopId }, 
      { new: true, runValidators: true }
    );
    if (!updatedProduct) {
      console.log(`[Log][ShopCtrl][Product] Update failed: Product ID ${productId} not found for shop: ${req.currentShopId}`);
      return res.status(404).json({ message: 'Product not found' });
    }
    console.log(`[Log][ShopCtrl][Product] Successfully updated product ID ${productId} for shop: ${req.currentShopId}`);
    res.json(updatedProduct);
  } catch (error) {
    console.error(`[Error][ShopCtrl][Product] Error updating product ID ${productId} for shop ${req.currentShopId}:`, error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  const productId = req.params.productId;
  console.log(`[Log][ShopCtrl][Product] Attempting to delete product ID ${productId} for shop: ${req.currentShopId}`);
  try {
    const { Product } = req.shopModels;
    const deletedProduct = await Product.findOneAndDelete({ product_id: productId, shop_id: req.currentShopId });
    if (!deletedProduct) {
      console.log(`[Log][ShopCtrl][Product] Delete failed: Product ID ${productId} not found for shop: ${req.currentShopId}`);
      return res.status(404).json({ message: 'Product not found' });
    }
    console.log(`[Log][ShopCtrl][Product] Successfully deleted product ID ${productId} (${deletedProduct.name}) for shop: ${req.currentShopId}`);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(`[Error][ShopCtrl][Product] Error deleting product ID ${productId} for shop ${req.currentShopId}:`, error);
    res.status(500).json({ message: error.message });
  }
};

// Placeholder for Order CRUD operations for a specific shop
export const getAllOrders = async (req, res) => {
  const currentShopId = req.currentShopId; // shopId from selectShopDB middleware
  console.log(`[Log][ShopCtrl][Order] Attempting to fetch all orders for shop: ${currentShopId}`);
  try {
    // const { Order, OrderItem } = await getUserModels(); // 旧的方式
    const { Order, OrderItem } = await getGlobalOrderModels(); // 新的方式，连接到 orders_db
    
    if (!Order) {
        console.error(`[Error][ShopCtrl][Order] Critical: Order model is not available from getGlobalOrderModels. Check model loading.`);
        return res.status(500).json({ success: false, message: 'Internal server error: Order model configuration issue.', data: null });
    }

    const filterConditions = { shop_id: currentShopId }; 
    if (req.query.status) {
      filterConditions.status = req.query.status;
    }

    let sortOptions = {};
    if (req.query._sort && req.query._order) {
      sortOptions[req.query._sort] = req.query._order === 'desc' ? -1 : 1;
    } else {
      sortOptions = { create_time: -1 }; // Default sort
    }

    let ordersQuery = Order.find(filterConditions).sort(sortOptions);

    // Handle pagination if limit is provided
    if (req.query.limit) {
        const limit = parseInt(req.query.limit, 10);
        if (!isNaN(limit) && limit > 0) {
            ordersQuery = ordersQuery.limit(limit);
        }
    }

    // Populate orderItems. Assuming OrderItem model is correctly linked in Order schema.
    // If OrderItem is also from getUserModels, it will be available.
    const orders = await ordersQuery.populate({ 
        path: 'orderItems', 
        model: OrderItem, // Explicitly specify the model if not automatically inferred or if issues arise
        options: { strictPopulate: false } 
    });

    console.log(`[Log][ShopCtrl][Order] Found ${orders.length} orders for shop ${currentShopId}`);
    // res.json(orders);
    res.status(200).json({ success: true, data: orders, message: '店铺订单获取成功' });

  } catch (error) {
    console.error(`[Error][ShopCtrl][Order] Error fetching orders for shop ${currentShopId}:`, error);
    // res.status(500).json({ message: error.message });
    res.status(500).json({ success: false, message: error.message || '获取店铺订单失败', data: null });
  }
};

export const createOrder = async (req, res) => {
  const currentShopId = req.currentShopId;
  console.log(`[Log][ShopCtrl][Order] Attempting to create order for shop: ${currentShopId}`);
  try {
    // const { Order, OrderItem } = req.shopModels; // WRONG
    const { Order, OrderItem } = await getUserModels(); // CORRECT

    if (!Order || !OrderItem) {
        console.error(`[Error][ShopCtrl][Order] Order or OrderItem model is not available from user models for shop ${currentShopId}.`);
        return res.status(500).json({ success: false, message: 'Internal server error: Order/OrderItem model configuration issue.', data: null });
    }

    const { items, ...orderData } = req.body;
    orderData.shop_id = currentShopId; // Ensure shop_id is from the authenticated shop context

    if (!items || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Order must contain at least one item.', data: null });
    }

    // More validation might be needed here (e.g., product existence, price checks)

    const newOrder = new Order(orderData);
    const savedOrder = await newOrder.save();

    const orderItems = items.map(item => ({
        ...item,
        order_id: savedOrder.order_no, // Link to the parent order using order_no
        // Ensure product_snapshot and other required fields are present
    }));

    await OrderItem.insertMany(orderItems);
    
    // Populate the savedOrder with its items before sending the response
    const populatedOrder = await Order.findById(savedOrder._id).populate({
      path: 'orderItems',
      model: OrderItem
    });

    console.log(`[Log][ShopCtrl][Order] Successfully created order ${savedOrder.order_no} for shop: ${currentShopId}`);
    res.status(201).json({ success: true, data: populatedOrder, message: '订单创建成功' });

  } catch (error) {
    console.error(`[Error][ShopCtrl][Order] Error creating order for shop ${currentShopId}:`, error);
    res.status(500).json({ success: false, message: error.message || '创建订单失败', data: null });
  }
};

export const deleteOrder = async (req, res) => {
  const currentShopId = req.currentShopId;
  const orderNo = req.params.orderNo;
  console.log(`[Log][ShopCtrl][Order] Attempting to (physically) DELETE order ${orderNo} for shop: ${currentShopId}`);
  try {
    const { Order, OrderItem } = await getGlobalOrderModels(); // 使用 getGlobalOrderModels

    if (!Order || !OrderItem) {
      console.error(`[Error][ShopCtrl][Order] Order or OrderItem model is not available from getGlobalOrderModels for shop ${currentShopId} during physical delete.`);
      return res.status(500).json({ success: false, message: 'Internal server error: Order/OrderItem model configuration issue.', data: null });
    }

    // First, delete associated order items
    await OrderItem.deleteMany({ order_id: orderNo, shop_id: currentShopId }); // Add shop_id to ensure scoped deletion for OrderItems if they also have it.
                                                                            // Assuming order_id is unique enough for items, but shop_id adds safety.
                                                                            // If OrderItem schema does not have shop_id, remove it from this condition.

    // Then, delete the order itself
    const deletedOrder = await Order.findOneAndDelete({ order_no: orderNo, shop_id: currentShopId });

    if (!deletedOrder) {
      console.log(`[Log][ShopCtrl][Order] Physical delete failed: Order ${orderNo} not found for shop ${currentShopId}`);
      return res.status(404).json({ success: false, message: 'Order not found for physical deletion', data: null });
    }

    console.log(`[Log][ShopCtrl][Order] Successfully (physically) deleted order ${orderNo} for shop: ${currentShopId}`);
    res.status(200).json({ success: true, message: '订单已从数据库中删除', data: { order_no: orderNo } });

  } catch (error) {
    console.error(`[Error][ShopCtrl][Order] Error (physically) deleting order ${orderNo} for shop ${currentShopId}:`, error);
    res.status(500).json({ success: false, message: error.message || '物理删除订单失败', data: null });
  }
};

export const updateOrderStatus = async (req, res) => {
  const currentShopId = req.currentShopId;
  const orderNo = req.params.orderNo;
  const { status } = req.body;
  console.log(`[Log][ShopCtrl][Order] Attempting to update status of order ${orderNo} to ${status} for shop: ${currentShopId}`);

  if (!status) {
    return res.status(400).json({ success: false, message: "Status is required for update.", data: null });
  }

  try {
    const { Order } = await getGlobalOrderModels(); // <--- 使用 getGlobalOrderModels

    if (!Order) {
      console.error(`[Error][ShopCtrl][Order] Order model is not available from getGlobalOrderModels for shop ${currentShopId}.`);
      return res.status(500).json({ success: false, message: 'Internal server error: Order model configuration issue.', data: null });
    }

    const updatedOrder = await Order.findOneAndUpdate(
      { order_no: orderNo, shop_id: currentShopId },
      { $set: { status: status, update_time: new Date() } }, // Also update update_time
      { new: true, runValidators: true }
    ).populate('orderItems'); 

    if (!updatedOrder) {
      console.log(`[Log][ShopCtrl][Order] Status update failed: Order ${orderNo} not found for shop ${currentShopId}`);
      return res.status(404).json({ success: false, message: 'Order not found to update status', data: null });
    }

    console.log(`[Log][ShopCtrl][Order] Successfully updated status of order ${orderNo} to ${status} for shop: ${currentShopId}`);
    res.status(200).json({ success: true, data: updatedOrder, message: '订单状态更新成功' });

  } catch (error) {
    console.error(`[Error][ShopCtrl][Order] Error updating status for order ${orderNo} in shop ${currentShopId}:`, error);
    res.status(500).json({ success: false, message: error.message || '更新订单状态失败', data: null });
  }
};

// REVERTED to original logic with hardcoded IDs
export const getAllProductsAcrossShops = async (req, res) => {
  console.log('[Log][ShopCtrl][Product] Attempting to fetch all products across specified shops for homepage (hardcoded IDs).');
  // For now, using a hardcoded list.
  const allShopIds = ['shop001', 'shop002', 'shop003']; // <-- IMPORTANT: Hardcoded shop IDs
  const productsPerShopLimit = req.query.limitPerShop ? parseInt(req.query.limitPerShop) : 5;
  const overallLimit = req.query.totalLimit ? parseInt(req.query.totalLimit) : 15;

  let allProducts = [];

  try {
    for (const shopId of allShopIds) {
      try {
        console.log(`[Log][ShopCtrl][AllProducts] Fetching products for shop: ${shopId}`);
        const shopSpecificModels = await getShopModels(shopId);
        const { Product } = shopSpecificModels;
        
        // Original logic might not have filtered by product status, adjust if needed.
        const productsFromShop = await Product.find({ shop_id: shopId })
                                              .limit(productsPerShopLimit)
                                              .lean();

        if (productsFromShop && productsFromShop.length > 0) {
          console.log(`[Log][ShopCtrl][AllProducts] Fetched ${productsFromShop.length} products from shop: ${shopId}`);
          const shopName = await getShopNameById(shopId); // Assumes getShopNameById is robust
          const productsWithShopDetails = productsFromShop.map(p => ({
             ...p,
             shop_name: p.shop_name || shopName,
            product_id: p.product_id || p._id?.toString() // Ensure product_id is present
            }));
          allProducts.push(...productsWithShopDetails);
        }
      } catch (shopError) {
        console.error(`[Error][ShopCtrl][AllProducts] Error fetching products from shop ${shopId}:`, shopError.message);
        // Continue to next shop even if one fails
      }
    }

    // Optional: Shuffle before applying overall limit
    // allProducts.sort(() => 0.5 - Math.random()); 
    
    if (allProducts.length > overallLimit) {
      allProducts = allProducts.slice(0, overallLimit);
    }

    console.log(`[Log][ShopCtrl][AllProducts] Successfully fetched a total of ${allProducts.length} products for homepage (hardcoded).`);
    res.status(200).json({ success: true, data: allProducts, message: '首页商品获取成功 (hardcoded shops)' });

  } catch (error) {
    console.error('[Error][ShopCtrl][AllProducts] General error fetching products for homepage (hardcoded):', error);
    res.status(500).json({ success: false, message: error.message || '获取首页商品失败 (hardcoded)', data: null });
  }
};


// NEW function for dynamic product aggregation
export const getDynamicallyAggregatedHomepageProducts = async (req, res) => {
  console.log("[Log][ShopCtrl] Attempting to fetch all products dynamically across active shops for homepage.");
  
  try {
    const masterConnection = await getUserDBConnection(); // Get the connection for USER_DB_NAME

    if (!masterConnection || masterConnection.readyState !== 1 || !masterConnection.db) {
      console.error('[Error][ShopCtrl][DynamicProducts] Master DB connection (user_db) not available or not connected.');
      return res.status(500).json({ success: false, message: 'Internal server error: Master database connection issue.', data: [] });
    }
    
    const adminDB = masterConnection.db.admin(); // Use the admin interface from this specific masterConnection

    const { databases } = await adminDB.listDatabases();
    const shopDBNames = databases
      .map(db => db.name)
      .filter(name => name.startsWith('shop_') && name !== 'shop_template');

    let allProducts = [];
    const productsFetchPromises = [];

    console.log(`[Log][ShopCtrl][DynamicProducts] Found potential shop databases: ${shopDBNames.join(', ')}`);

    for (const dbName of shopDBNames) {
      const shopId = dbName.substring('shop_'.length);
      if (!shopId) {
        console.warn(`[Log][ShopCtrl][DynamicProducts] Could not extract shopId from dbName: ${dbName}`);
        continue;
      }

      const fetchPromise = (async () => {
        try {
          console.log(`[Log][ShopCtrl][DynamicProducts] Processing shop: ${shopId} (DB: ${dbName})`);
          const { ShopProfile, Product } = await getShopModels(shopId);

          if (!ShopProfile || !Product) {
            console.warn(`[Log][ShopCtrl][DynamicProducts] Critical models (ShopProfile or Product) missing for shop ${shopId}. Skipping.`);
            return []; 
          }
          
          const profile = await ShopProfile.findOne({ shop_id: shopId }).lean();

          if (!profile) {
            console.log(`[Log][ShopCtrl][DynamicProducts] No profile found for shop ${shopId} in ${dbName}. Skipping.`);
            return [];
          }

          if (profile.status !== 'active') {
            console.log(`[Log][ShopCtrl][DynamicProducts] Shop ${shopId} (Name: ${profile.name || 'N/A'}) is not active (status: ${profile.status}). Skipping its products.`);
            return [];
          }
          
          console.log(`[Log][ShopCtrl][DynamicProducts] Shop ${shopId} (Name: ${profile.name}) is active. Fetching products.`);
          // Query product status using the numeric value (1 for active/on-shelf)
          const productsFromShop = await Product.find({ shop_id: shopId, status: 1 }) 
            .select('-versions -specs_template -reviews -average_rating -total_ratings -total_sales') 
            .lean(); 
          
          console.log(`[Log][ShopCtrl][DynamicProducts] Fetched ${productsFromShop.length} products from active shop: ${shopId} (${profile.name})`);

          return productsFromShop.map(product => ({
            ...product,
            shop_id: shopId, 
            shop_name: profile.name || `店铺 ${shopId}`, 
          }));
        } catch (shopError) {
          console.error(`[Error][ShopCtrl][DynamicProducts] Failed to process shop ${shopId} (DB: ${dbName}):`, shopError.message);
          return []; 
        }
      })();
      productsFetchPromises.push(fetchPromise);
    }

    const results = await Promise.all(productsFetchPromises);
    results.forEach(shopProducts => {
      if (shopProducts && shopProducts.length > 0) {
        allProducts = allProducts.concat(shopProducts);
      }
    });

    console.log(`[Log][ShopCtrl][DynamicProducts] Total products fetched dynamically from all active shops: ${allProducts.length}`);
    res.status(200).json({ success: true, data: allProducts, message: '所有店铺的商品获取成功 (dynamic)' });

  } catch (error) {
    console.error('[Error][ShopCtrl][DynamicProducts] Error fetching products dynamically across shops:', error);
    // Enhanced error message for permission issues
    if (error.name === 'MongoTimeoutError' || error.message.includes('listDatabases') || error.message.includes('Command listDatabases requires authentication')) {
        console.error('[ErrorDetail][ShopCtrl][DynamicProducts] Potentially a permission error for listDatabases or DB connection issue to admin interface of user_db.');
        return res.status(503).json({ success: false, message: 'Service unavailable: Could not query database directory. Check permissions or DB status for user_db admin operations.', data: [] });
    }
    res.status(500).json({ success: false, message: error.message || '获取所有店铺商品失败 (dynamic)', data: [] });
  }
};

// New function to cancel an order (set status to 'cancelled')
export const cancelOrder = async (req, res) => {
  const currentShopId = req.currentShopId;
  const orderNo = req.params.orderNo;
  console.log(`[Log][ShopCtrl][Order] Attempting to CANCEL order ${orderNo} (set status to cancelled) for shop: ${currentShopId}`);

  try {
    const { Order } = await getGlobalOrderModels(); // Use getGlobalOrderModels to connect to orders_db

    if (!Order) {
      console.error(`[Error][ShopCtrl][Order] Order model is not available from getGlobalOrderModels for shop ${currentShopId} during cancel.`);
      return res.status(500).json({ success: false, message: 'Internal server error: Order model configuration issue.', data: null });
    }

    const updatedOrder = await Order.findOneAndUpdate(
      { order_no: orderNo, shop_id: currentShopId },
      { $set: { status: 'cancelled', update_time: new Date() } },
      { new: true, runValidators: true }
    ).populate('orderItems'); // Populate items to return the updated order fully

    if (!updatedOrder) {
      console.log(`[Log][ShopCtrl][Order] Order cancellation failed: Order ${orderNo} not found for shop ${currentShopId}`);
      return res.status(404).json({ success: false, message: 'Order not found for cancellation', data: null });
    }

    console.log(`[Log][ShopCtrl][Order] Successfully cancelled order ${orderNo} for shop: ${currentShopId}.`);
    res.status(200).json({ success: true, data: updatedOrder, message: '订单已成功取消' });

  } catch (error) {
    console.error(`[Error][ShopCtrl][Order] Error cancelling order ${orderNo} for shop ${currentShopId}:`, error);
    res.status(500).json({ success: false, message: error.message || '取消订单失败', data: null });
  }
};

export const getShopDashboardStats = async (req, res) => {
  const currentShopId = req.currentShopId;
  console.log(`[Log][ShopCtrl][Dashboard] Attempting to fetch dashboard stats for shop: ${currentShopId}`);

  try {
    const { Product } = await getShopModels(currentShopId); // Product model from shop-specific DB
    const { Order } = await getGlobalOrderModels();       // Order model from orders_db

    if (!Product || !Order) {
      console.error(`[Error][ShopCtrl][Dashboard] Product or Order model is not available for shop ${currentShopId}.`);
      return res.status(500).json({ success: false, message: 'Internal server error: Model configuration issue.' });
    }

    const totalProducts = await Product.countDocuments({ shop_id: currentShopId });
    const totalOrders = await Order.countDocuments({ shop_id: currentShopId });
    const pendingOrders = await Order.countDocuments({
      shop_id: currentShopId,
      status: { $in: ['to_pay', 'to_ship'] }
    });

    const salesData = await Order.aggregate([
      { $match: { shop_id: currentShopId, status: 'completed' } },
      { $group: { _id: null, totalSales: { $sum: '$total_amount' } } }
    ]);
    const totalSales = salesData.length > 0 ? salesData[0].totalSales : 0;
    
    // For Recent Orders, the main getAllOrders can be used by frontend with a limit, or create a specific query here.
    // For now, let's fetch top 5 recent orders directly here for simplicity of this endpoint.
    const recentOrders = await Order.find({ shop_id: currentShopId })
                                    .sort({ create_time: -1 })
                                    .limit(5)
                                    .populate('orderItems'); // Populate if needed for display

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        totalOrders,
        pendingOrders,
        totalSales,
        recentOrders
      },
      message: '店铺仪表盘统计数据获取成功'
    });

  } catch (error) {
    console.error(`[Error][ShopCtrl][Dashboard] Error fetching dashboard stats for shop ${currentShopId}:`, error);
    res.status(500).json({ success: false, message: error.message || '获取仪表盘统计数据失败' });
  }
};

export { selectShopDB }; // Export middleware as a named export 