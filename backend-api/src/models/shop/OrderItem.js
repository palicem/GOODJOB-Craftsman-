const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define schemas for complex fields if they have a consistent structure
const productSnapshotSchema = new Schema({
  // Define fields based on what you need from product details
  id: String,
  name: String,
  price: Number, // Price at the time of order
  images: [String],
  // ... other relevant product fields
}, { _id: false });

const specValueSchema = new Schema({
  // Example: { "颜色": "白色", "尺码": "M" }
  // Since keys are dynamic, mongoose.Schema.Types.Mixed or a Map can be used.
  // For simplicity, using Mixed here. For stricter schema, define known spec names.
}, { _id: false, strict: false }); // strict: false allows any structure

const customizationDataSchema = new Schema({
  // Structure depends on your customization needs
}, { _id: false, strict: false });

const orderItemSchema = new Schema({
  // id: BIGINT PRIMARY KEY AUTO_INCREMENT -> MongoDB will generate _id
  order_no: { // Changed from order_id to match your SQL schema's FOREIGN KEY (order_id) REFERENCES orders(order_no)
    type: String,
    required: true,
    // ref: 'Order' // Reference if order_no is unique and you want to populate (careful with cross-DB)
  },
  product_id: {
    type: String, // Product ID from the Product collection
    required: true
    // ref: 'Product' // Reference if you want to populate (careful with cross-DB)
  },
  product_snapshot: {
    type: productSnapshotSchema,
    required: true
  },
  count: {
    type: Number,
    required: true,
    min: 1
  },
  price: { // Price per unit at the time of order
    type: Number,
    required: true
  },
  spec_value: {
    type: mongoose.Schema.Types.Mixed, // For JSON-like objects, such as {"颜色":"白色","尺码":"M"}
    default: {}
  },
  customization_data: {
    type: mongoose.Schema.Types.Mixed, // For JSON-like objects
    default: {}
  }
  // create_time handled by timestamps
}, {
  timestamps: { createdAt: 'create_time', updatedAt: false } // Map createdAt to create_time
});

orderItemSchema.index({ order_no: 1 });
orderItemSchema.index({ product_id: 1 });

module.exports = (connection) => {
  if (!connection) {
    throw new Error('Mongoose connection is required to create OrderItem model');
  }
  return connection.model('OrderItem', orderItemSchema);
}; 