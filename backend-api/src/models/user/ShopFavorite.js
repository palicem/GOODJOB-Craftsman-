import mongoose from 'mongoose';
// import { getUserDBConnection } from '../../config/db.js'; // 不再需要在此文件直接获取连接

const shopFavoriteSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    index: true
  },
  shop_id_original: {
    type: String,
    required: true
  },
  shop_snapshot: {
    name: String,
    logo_url: String
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  collection: 'shopfavorites'
});

// Composite unique index
shopFavoriteSchema.index({ user_id: 1, shop_id_original: 1 }, { unique: true });

// 修改函数以接收 connection 参数
const createShopFavoriteModel = (connection) => {
  if (!connection) {
    throw new Error('MongoDB connection is required to create ShopFavorite model.');
  }
  // 检查模型是否已存在，如果不存在则创建
  return connection.models.ShopFavorite || connection.model('ShopFavorite', shopFavoriteSchema);
};

export default createShopFavoriteModel; 