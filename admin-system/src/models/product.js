import * as mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  shop_id: {
    type: String,
    required: true
  },
  category_id: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: true
  },
  original_price: {
    type: Number
  },
  images: {
    type: [String],
    default: []
  },
  detail_images: {
    type: [String],
    default: []
  },
  sold: {
    type: Number,
    default: 0
  },
  stock: {
    type: Number,
    default: 0
  },
  location: {
    type: String,
    default: ''
  },
  status: {
    type: Number,
    default: 1 // 1: 上架, 0: 下架
  },
  is_customizable: {
    type: Number, // 0: 不可定制, 1: 可定制
    default: 0
  },
  specs: {
    type: [{
      name: String,
      options: [String]
    }],
    default: []
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
})

// 更新时自动更新updated_at字段
productSchema.pre('save', function(next) {
  this.updated_at = new Date()
  next()
})

// 修改为导出一个函数，用于在特定连接上创建模型
export function createProductModel(connection) {
  return connection.model('Product', productSchema)
} 