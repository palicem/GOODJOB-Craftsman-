import createFavoriteModel from '../models/Favorite.js';
import createShopFavoriteModel from '../models/user/ShopFavorite.js'; // 导入店铺收藏模型
import { getShopDBConnection, getUserDBConnection } from '../config/db.js'; // 用于获取店铺和商品信息, 导入 getUserDBConnection
import mongoose from 'mongoose';

// 将 ShopProfileSchema 定义移到函数外部
const ShopProfileSchema = new mongoose.Schema({
    shop_id: { type: String, required: true, index: true },
    name: { type: String, required: true },
    logo: String, 
    logo_url: String,
    description: String,
    // Add other fields if necessary for other operations, or keep it minimal
  }, { collection: 'shopprofiles', strict: false });

// 辅助函数：获取商品详情 (精简版，实际项目中应更完善)
async function getProductDetails(shopId, productId) {
  try {
    const shopDB = await getShopDBConnection(shopId);
    const Product = shopDB.model('Product'); // 假设商品模型名为 'Product'
    const product = await Product.findOne({ product_id: productId }).lean(); // 使用 lean() 获取普通JS对象
    if (!product) return null;
    return {
      _id: product._id, // Mongoose _id
      product_id: product.product_id, // 原始 product_id
      name: product.name,
      images: product.images, // 假设有 images 字段
      image_url: product.image_url, // 或单个 image_url
      price: product.price,
      shop_id: product.shop_id // 原始 shop_id
      // ... 其他需要的字段
    };
  } catch (error) {
    console.error(`[ProductDetails] Error fetching product ${productId} from shop ${shopId}:`, error);
    return null;
  }
}

// 辅助函数：获取店铺详情 (精简版)
async function getShopDetails(shopId) {
  try {
    const shopDB = await getShopDBConnection(shopId); 
    if (!shopDB || typeof shopDB.model !== 'function') { 
      console.error(`[ShopDetails] Invalid or null shopDB connection for shopId: ${shopId}.`);
      return null;
    }

    let ShopProfile;
    if (shopDB.models && shopDB.models.ShopProfile) {
      ShopProfile = shopDB.model('ShopProfile');
      // console.log(`[ShopDetails] Reused existing ShopProfile model on shopDB for ${shopId}.`);
    } else {
      ShopProfile = shopDB.model('ShopProfile', ShopProfileSchema);
      console.log(`[ShopDetails] Defined NEW ShopProfile model on shopDB for ${shopId}.`);
    }

    const shop = await ShopProfile.findOne({ shop_id: shopId }).lean();
    if (!shop) {
      console.log(`[ShopDetails] Shop profile not found for shopId: ${shopId}`);
      return null;
    }
    return {
      _id: shop._id,
      shop_id: shop.shop_id,
      name: shop.name,
      logo: shop.logo_url || shop.logo, 
      description: shop.description,
    };
  } catch (error) {
    console.error(`[ShopDetails] Error fetching shop ${shopId}:`, error);
    // throw error; // 取消注释此行以将错误传播到 getFavoriteShopsController 的 catch 块
    return null; 
  }
}

export const addFavorite = async (req, res) => {
  const userId = req.user.account_name; // Assuming account_name is the unique user identifier
  const { productId, shopId } = req.body;

  // Log the received productId
  console.log(`Attempting to add favorite for user: ${userId}, productId: ${productId}, shopId: ${shopId}`);

  if (!productId) {
    console.error('Error adding favorite: Product ID is missing from request.');
    return res.status(400).json({ message: '收藏失败，商品ID缺失。', error: 'Product ID is required' });
  }
  if (!shopId) {
    console.error('Error adding favorite: Shop ID is missing from request.');
    return res.status(400).json({ message: '收藏失败，店铺ID缺失。', error: 'Shop ID is required' });
  }

  try {
    const Favorite = await createFavoriteModel();
    const existingFavorite = await Favorite.findOne({ user_id: userId, product_id_original: productId });

    if (existingFavorite) {
      console.log(`[FavoriteCtrl] addFavorite: Product already favorited. User: ${userId}, ProductID: ${productId}, Existing:`, existingFavorite);
      return res.status(409).json({ success: false, message: '该商品已在收藏中' });
    }

    const newFavorite = new Favorite({
      user_id: userId,
      product_id_original: productId,
      shop_id_original: shopId
    });

    await newFavorite.save();
    // Log success
    console.log(`Favorite added successfully for user: ${userId}, productId: ${productId}`);
    res.status(201).json({ success: true, message: '收藏成功', data: newFavorite });
  } catch (error) {
    // Log the detailed error
    console.error('Error adding favorite:', error);
    if (error.code === 11000) {
      // Log specific duplicate key error information
      console.error('Duplicate key error details:', error.keyValue);
      return res.status(409).json({ success: false, message: '该商品已在收藏中 (重复键错误)', error: error.message, details: error.keyValue });
    }
    res.status(500).json({ success: false, message: '服务器内部错误，收藏失败' });
  }
};

export const removeFavorite = async (req, res) => {
  const { productId } = req.params; // 从 URL 参数中获取 productId
  const userAccountName = req.user.account_name || req.user.username;

  if (!productId) {
    return res.status(400).json({ success: false, message: '商品ID不能为空' });
  }

  try {
    const Favorite = await createFavoriteModel();
    const result = await Favorite.deleteOne({ user_id: userAccountName, product_id_original: productId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: '未找到该收藏记录或已被移除' });
    }

    res.status(200).json({ success: true, message: '取消收藏成功' });
  } catch (error) {
    console.error('[FavoriteCtrl] Error removing favorite:', error);
    res.status(500).json({ success: false, message: '服务器内部错误，取消收藏失败' });
  }
};

export const getFavorites = async (req, res) => {
  const userAccountName = req.user.account_name || req.user.username;
  const { page = 1, limit = 20 } = req.query; // 支持分页
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const Favorite = await createFavoriteModel();
    const favorites = await Favorite.find({ user_id: userAccountName })
                                    .sort({ created_at: -1 })
                                    .skip(skip)
                                    .limit(parseInt(limit))
                                    .lean(); // 使用lean()提高性能，因为我们不需要Mongoose文档特性

    const detailedFavorites = await Promise.all(favorites.map(async (fav) => {
      const productDetails = await getProductDetails(fav.shop_id_original, fav.product_id_original);
      const shopDetails = await getShopDetails(fav.shop_id_original);
      return {
        ...fav, // 保留原始收藏信息，如收藏ID、收藏时间
        product_details: productDetails,
        shop_details: shopDetails
      };
    }));

    const totalFavorites = await Favorite.countDocuments({ user_id: userAccountName });

    res.status(200).json({
      success: true,
      message: '获取收藏列表成功',
      data: detailedFavorites,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalFavorites / parseInt(limit)),
        totalItems: totalFavorites,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('[FavoriteCtrl] Error fetching favorites:', error);
    res.status(500).json({ success: false, message: '服务器内部错误，获取收藏列表失败' });
  }
};

export const checkFavoriteStatus = async (req, res) => {
  const { productId } = req.params;
  const userAccountName = req.user.account_name || req.user.username;

  if (!productId) {
    return res.status(400).json({ success: false, message: '商品ID不能为空' });
  }

  try {
    const Favorite = await createFavoriteModel();
    const favorite = await Favorite.findOne({ user_id: userAccountName, product_id_original: productId });

    if (favorite) {
      res.status(200).json({ success: true, isFavorited: true, data: favorite });
    } else {
      res.status(200).json({ success: true, isFavorited: false });
    }
  } catch (error) {
    console.error('[FavoriteCtrl] Error checking favorite status:', error);
    res.status(500).json({ success: false, message: '服务器内部错误，检查收藏状态失败' });
  }
};

// --- 店铺收藏控制器 ---
export const addShopToFavoritesController = async (req, res) => {
  console.log('[FavoriteCtrl] addShopToFavoritesController: Received request body:', req.body);
  console.log('[FavoriteCtrl] addShopToFavoritesController: Received request params:', req.params);
  console.log('[FavoriteCtrl] addShopToFavoritesController: Received user:', req.user);

  const { shopId } = req.body; // shopId is shop_id_original
  const userAccountName = req.user.account_name || req.user.username;

  if (!shopId) {
    return res.status(400).json({ success: false, message: '店铺ID不能为空' });
  }

  try {
    const userDbConnection = await getUserDBConnection(); // 获取用户数据库连接
    const ShopFavorite = createShopFavoriteModel(userDbConnection); // 传递连接
    const existingFavorite = await ShopFavorite.findOne({ user_id: userAccountName, shop_id_original: shopId });

    if (existingFavorite) {
      return res.status(409).json({ success: false, message: '该店铺已在收藏中' });
    }

    // 获取店铺快照信息
    const shopInfo = await getShopDetails(shopId);

    const newShopFavoriteData = {
      user_id: userAccountName,
      shop_id_original: shopId,
      shop_snapshot: shopInfo ? { name: shopInfo.name, logo_url: shopInfo.logo } : {}
    };
    console.log('[FavoriteCtrl] addShopToFavoritesController: Attempting to save new favorite with data:', newShopFavoriteData);

    const newShopFavorite = new ShopFavorite(newShopFavoriteData);

    await newShopFavorite.save();
    res.status(201).json({ success: true, message: '店铺收藏成功', data: newShopFavorite });
  } catch (error) {
    console.error('[FavoriteCtrl] Error adding shop favorite:', error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: '该店铺已在收藏中 (重复键错误)' });
    }
    res.status(500).json({ success: false, message: '服务器内部错误，店铺收藏失败' });
  }
};

export const removeShopFromFavoritesController = async (req, res) => {
  console.log('[FavoriteCtrl] removeShopFromFavoritesController: Received request body:', req.body);
  console.log('[FavoriteCtrl] removeShopFromFavoritesController: Received request params:', req.params);
  console.log('[FavoriteCtrl] removeShopFromFavoritesController: Received user:', req.user);

  const { shopId } = req.params; // shopId is shop_id_original
  const userAccountName = req.user.account_name || req.user.username;

  if (!shopId) {
    return res.status(400).json({ success: false, message: '店铺ID不能为空' });
  }

  try {
    const userDbConnection = await getUserDBConnection(); // 获取用户数据库连接
    const ShopFavorite = createShopFavoriteModel(userDbConnection); // 传递连接
    const result = await ShopFavorite.deleteOne({ user_id: userAccountName, shop_id_original: shopId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: '未找到该店铺收藏记录或已被移除' });
    }

    res.status(200).json({ success: true, message: '取消店铺收藏成功' });
  } catch (error) {
    console.error('[FavoriteCtrl] Error removing shop favorite:', error);
    res.status(500).json({ success: false, message: '服务器内部错误，取消店铺收藏失败' });
  }
};

export const getFavoriteShopsController = async (req, res) => {
  const userAccountName = req.user.account_name || req.user.username;
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const userDbConnection = await getUserDBConnection(); // 获取用户数据库连接
    const ShopFavorite = createShopFavoriteModel(userDbConnection); // 传递连接
    const favoriteShops = await ShopFavorite.find({ user_id: userAccountName })
                                          .sort({ created_at: -1 })
                                          .skip(skip)
                                          .limit(parseInt(limit))
                                          .lean();

    console.log('[FavoriteCtrl] getFavoriteShops: Raw favoriteShops from DB:', JSON.stringify(favoriteShops, null, 2));

    const detailedShopFavorites = await Promise.all(favoriteShops.map(async (fav) => {
        let shopDetailsToReturn = fav.shop_snapshot; 
        if (!shopDetailsToReturn || !shopDetailsToReturn.name) { 
            console.log(`[FavoriteCtrl] getFavoriteShops: Snapshot missing or incomplete for shop_id_original: ${fav.shop_id_original}. Fetching live details.`);
            const liveShopDetails = await getShopDetails(fav.shop_id_original);
            if(liveShopDetails) {
              shopDetailsToReturn = liveShopDetails; 
              console.log(`[FavoriteCtrl] getFavoriteShops: Fetched live details for ${fav.shop_id_original}:`, JSON.stringify(liveShopDetails, null, 2));
            } else {
              console.log(`[FavoriteCtrl] getFavoriteShops: Failed to fetch live details for ${fav.shop_id_original}. Using snapshot (or empty object if snapshot was also bad).`);
            }
        }
        return {
            _id: fav._id, 
            user_id: fav.user_id,
            shop_id_original: fav.shop_id_original,
            created_at: fav.created_at,
            shop_details: shopDetailsToReturn 
        };
    }));

    console.log('[FavoriteCtrl] getFavoriteShops: Processed detailedShopFavorites to be sent:', JSON.stringify(detailedShopFavorites, null, 2));

    const totalShopFavorites = await ShopFavorite.countDocuments({ user_id: userAccountName });

    res.status(200).json({
      success: true,
      message: '获取收藏店铺列表成功',
      data: detailedShopFavorites, // 返回处理后的店铺收藏列表
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalShopFavorites / parseInt(limit)),
        totalItems: totalShopFavorites,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('[FavoriteCtrl] Error fetching shop favorites:', error);
    res.status(500).json({ success: false, message: '服务器内部错误，获取店铺收藏列表失败' });
  }
};

export const checkShopFavoriteStatusController = async (req, res) => {
  const { shopId } = req.params; // shopId is shop_id_original
  const userAccountName = req.user.account_name || req.user.username;

  console.log(`[FavoriteCtrl] checkShopFavoriteStatus: User '${userAccountName}', ShopID '${shopId}'`);

  if (!shopId) {
    console.log('[FavoriteCtrl] checkShopFavoriteStatus: ShopID is missing');
    return res.status(400).json({ success: false, message: '店铺ID不能为空' });
  }

  try {
    const userDbConnection = await getUserDBConnection(); // 获取用户数据库连接
    const ShopFavorite = createShopFavoriteModel(userDbConnection); // 传递连接
    const favorite = await ShopFavorite.findOne({ user_id: userAccountName, shop_id_original: shopId }).lean();

    if (favorite) {
      console.log(`[FavoriteCtrl] checkShopFavoriteStatus: Found favorite for ShopID '${shopId}'. DB record:`, favorite);
      res.status(200).json({ success: true, isFavorited: true, data: favorite });
    } else {
      console.log(`[FavoriteCtrl] checkShopFavoriteStatus: No favorite found for ShopID '${shopId}'.`);
      res.status(200).json({ success: true, isFavorited: false });
    }
  } catch (error) {
    console.error(`[FavoriteCtrl] Error checking shop favorite status for ShopID '${shopId}':`, error);
    res.status(500).json({ success: false, message: '服务器内部错误，检查店铺收藏状态失败' });
  }
}; 