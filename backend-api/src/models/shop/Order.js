import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  order_no: { type: String, required: true, unique: true, index: true },
  shop_id: { type: String, required: true, index: true }, // 或者 mongoose.Schema.Types.ObjectId ref: 'ShopInfo'
  user_id: { type: String, required: true, index: true }, // 或者 mongoose.Schema.Types.ObjectId ref: 'User' (from user_db)
  total_amount: { type: Number, required: true },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  items: [{ // 这里可以嵌入订单项，或者使用 OrderItem 模型并引用
    product_id: { type: String, required: true }, // 或者 mongoose.Schema.Types.ObjectId ref: 'Product'
    product_name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  shipping_address: {
    // 根据你的地址结构定义
    recipient_name: String,
    phone: String,
    address_line1: String,
    city: String,
    postal_code: String
  },
  payment_method: String,
  transaction_id: String, // 支付平台返回的交易ID
  create_time: { type: Date, default: Date.now },
  update_time: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'create_time', updatedAt: 'update_time' } });

// Helper function to create the model on a specific connection
export function createOrderModel(connection) {
  if (!connection) {
    throw new Error('Mongoose connection is not available for Order model');
  }
  return connection.model('Order', orderSchema);
}

// 如果你希望有一个默认导出（尽管 createOrderModel 更灵活）
// export default (connection) => connection.model('Order', orderSchema);