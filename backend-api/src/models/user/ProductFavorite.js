import mongoose from 'mongoose';
// import { getUserDBConnection } from '../../config/db.js'; // 不再需要在此文件直接获取连接

const favoriteSchema = new mongoose.Schema({
  user_id: { // 存储 account_name
    type: String,
    required: true,
    index: true
  },
  product_id_original: { // 存储商品原始ID，例如 "prod_A001"
    type: String,
    required: true
  },
  shop_id_original: { // 存储店铺原始ID, 例如 "shop001"
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  collection: 'productfavorites' 
});

favoriteSchema.index({ user_id: 1, product_id_original: 1 }, { unique: true });

// 修改函数以接收 connection 参数
const createProductFavoriteModel = (connection) => { 
  if (!connection) {
    throw new Error('MongoDB connection is required to create ProductFavorite model.');
  }
  // 检查模型是否已存在，如果不存在则创建
  return connection.models.ProductFavorite || connection.model('ProductFavorite', favoriteSchema);
};

export default createProductFavoriteModel; 