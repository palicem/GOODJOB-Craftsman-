import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const productSpecSchema = new Schema({
  name: { type: String, required: true },
  options: [{ type: String, required: true }]
}, { _id: false });

const productSchema = new Schema({
  product_id: { // Using product_id as your defined primary key from SQL
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 20
  },
  shop_id: {
    type: String, // This will be the ID of the shop, matching the database name suffix
    required: true,
    trim: true
  },
  category_id: {
    type: Schema.Types.ObjectId,
    ref: 'ProductCategory',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    default: ''
  },
  price: {
    type: Number, // Storing currency as Number. Consider using Decimal128 for precision if needed.
    required: true
  },
  original_price: {
    type: Number
  },
  images: {
    type: [String], // Array of image URLs
    default: []
    // SQL schema has TEXT NOT NULL, implying at least one image. Add validation if needed.
  },
  detail_images: {
    type: [String],
    default: []
  },
  sold: {
    type: Number,
    default: 0,
    min: 0
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  location: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: Number, // 0-下架，1-上架
    default: 1,
    min: 0,
    max: 1
  },
  is_customizable: {
    type: Boolean,
    default: false
  },
  specs: [productSpecSchema] // Array of specifications
}, {
  timestamps: true
});

productSchema.index({ shop_id: 1 });
productSchema.index({ category_id: 1 });
productSchema.index({ name: 'text', description: 'text' }); // For text search

export default (connection) => {
  if (!connection) {
    throw new Error('Mongoose connection is required to create Product model');
  }
  return connection.model('Product', productSchema);
}; 