import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const productCategorySchema = new Schema({
  // id: INT PRIMARY KEY AUTO_INCREMENT -> MongoDB will generate _id, or use a custom one if needed
  category_id_num: { // Using a distinct name to avoid confusion with _id
    type: Number,
    required: true,
    unique: true // Assuming these numeric IDs are unique per shop
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  icon: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// If you want a custom auto-incrementing ID different from ObjectId:
// You might need a counter collection or a plugin like mongoose-sequence.
// For simplicity, we'll rely on MongoDB's _id or assume 'id' field will be manually managed if it's not ObjectId.

export default (connection) => {
  if (!connection) {
    throw new Error('Mongoose connection is required to create ProductCategory model');
  }
  return connection.model('ProductCategory', productCategorySchema);
}; 