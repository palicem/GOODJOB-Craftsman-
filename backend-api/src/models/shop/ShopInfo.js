const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const shopInfoSchema = new Schema({
  shop_id: { // This will be the unique identifier for the shop, matching the database name suffix
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  logo: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    trim: true,
    default: ''
  }
  // owner_user_id: { type: Schema.Types.ObjectId, ref: 'User' } // Optional: if you want to link to a user in user_db
}, {
  timestamps: true // createdAt, updatedAt
});

module.exports = (connection) => {
  if (!connection) {
    throw new Error('Mongoose connection is required to create ShopInfo model');
  }
  // Use a consistent model name, e.g., 'ShopDetail' or 'ShopProfile'
  // as 'ShopInfo' might be generic.
  return connection.model('ShopProfile', shopInfoSchema); 
}; 