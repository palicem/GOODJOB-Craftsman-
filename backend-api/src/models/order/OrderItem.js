import mongoose from 'mongoose';

// Define the schema separately to be potentially importable by Order.js if needed
export const orderItemSchemaDefinition = {
  // order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true }, // Often not needed for embedded docs, or managed by parent
  product_id: { type: String, ref: 'Product', required: true }, // Assuming product_id is a string. Adjust if it's ObjectId.
  product_snapshot: { type: mongoose.Schema.Types.Mixed, required: true }, // Store as JSON string or Mixed type
  count: { type: Number, required: true },
  price: { type: Number, required: true }, // Price at the time of purchase
  spec: { type: mongoose.Schema.Types.Mixed }, // JSON for specifications
  customization_data: { type: mongoose.Schema.Types.Mixed }, // JSON for customization
};

const orderItemSchema = new mongoose.Schema(orderItemSchemaDefinition, 
  { timestamps: { createdAt: 'create_time', updatedAt: false } } // Using create_time for items
);

export function createOrderItemModel(connection) {
  // Check if model already exists on this connection to avoid OverwriteModelError
  if (connection.models.OrderItem) {
    return connection.models.OrderItem;
  }
  return connection.model('OrderItem', orderItemSchema);
} 

// Export the schema object itself if Order.js needs to construct it directly
// This is an alternative to importing the createOrderItemModel function if only schema is needed for embedding.
export { orderItemSchema }; 