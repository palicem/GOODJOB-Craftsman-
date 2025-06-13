import mongoose from 'mongoose';
import { getUserDBConnection } from '../config/db.js';

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
  // 未来可以考虑存储商品快照的部分关键信息，如果需要的话
  // product_snapshot: {
  //   name: String,
  //   image_url: String,
  //   price: Number 
  // },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  // 明确指定集合名称为 productfavorites，以匹配 user_db 中的表名
  collection: 'productfavorites' 
});

// 复合唯一索引，确保一个用户对一个商品只能收藏一次
favoriteSchema.index({ user_id: 1, product_id_original: 1 }, { unique: true });

// 修改 createFavoriteModel 函数
const createFavoriteModel = async () => {
  const userDB = await getUserDBConnection();
  // 检查 userDB 连接上是否已经编译了 ProductFavorite 模型
  if (userDB.models && userDB.models.ProductFavorite) {
    return userDB.model('ProductFavorite');
  }
  // 如果没有，则编译并返回
  return userDB.model('ProductFavorite', favoriteSchema);
};

// 默认导出创建模型的函数，因为我们需要异步获取数据库连接
export default createFavoriteModel; 