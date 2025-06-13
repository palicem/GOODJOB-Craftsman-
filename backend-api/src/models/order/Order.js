import mongoose from 'mongoose';
import { orderItemSchema } from './OrderItem.js'; // Import the schema for embedding

// It's generally better to define the schema outside the factory if it doesn't change per connection
const orderSchemaDefinition = {
    order_no: { type: String, unique: true, index: true },
    user_id: { type: String, required: true, index: true }, // Changed to String, removed ref
    shop_id: { type: String, required: true, index: true }, // Assuming shop_id is a string as per some designs. Adjust if it's ObjectId.
    total_amount: { type: Number, required: true },
    handling_fee: { type: Number, default: 0 },
    shipping_fee: { type: Number, default: 0 },
    status: { 
      type: String, 
      required: true, 
      default: 'to_pay', 
      enum: ['to_pay', 'to_ship', 'to_receive', 'completed', 'cancelled', 'refund_request', 'refund_approved', 'refund_completed'], 
      index: true 
    },
    address_snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
    remark: { type: String },
    pay_time: { type: Date },
    ship_time: { type: Date },
    complete_time: { type: Date },
    cancel_time: { type: Date },
    orderItems: [orderItemSchema], // Embed the orderItemSchema here

    // Optional top-level fields for single-item order display optimization
    shopName: { type: String, required: false },
    goodsName: { type: String, required: false },
    goodsImage: { type: String, required: false },
    spec: { type: String, required: false }, // Ensure this is String for simple display
    price: { type: Number, required: false },
    count: { type: Number, required: false }
};

const orderSchema = new mongoose.Schema(orderSchemaDefinition, 
    { timestamps: { createdAt: 'create_time', updatedAt: 'update_time' } } // Adjusted timestamps
);

// Pre-save hook for generating order_no if not provided
orderSchema.pre('save', async function(next) {
    if (!this.order_no) { 
      const generatedOrderNo = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      this.order_no = generatedOrderNo;
      console.log(`[DEBUG][OrderModel][PreSaveHook] Generated order_no: ${this.order_no}`);
    } else {
      console.log(`[DEBUG][OrderModel][PreSaveHook] order_no already exists: ${this.order_no}`);
    }
    next();
});

export function createOrderModel(connection) {
  // console.log('[DEBUG][OrderModel][createOrderModel] Function called.');
  // The schema is definedCooldown, so we don't need to delete from connection.models every time
  // unless the schema itself is dynamically changing per connection, which is not the case here.
  // if (connection.models.Order) {
  //   console.log(`[DEBUG][OrderModel][createOrderModel] Deleting existing 'Order' model from connection cache before recompiling.`);
  //   delete connection.models.Order;
  // }
  
  // Check if model already exists on this connection to avoid OverwriteModelError
  if (connection.models.Order) {
    return connection.models.Order;
  }
  return connection.model('Order', orderSchema);
} 