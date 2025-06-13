import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const userAddressSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId, // Or String if you are not using ObjectId for user IDs
    ref: 'User', // Reference to the User model
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    maxlength: 11 // Assuming Chinese phone numbers
    // Add validation for phone number format if needed
  },
  province: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  city: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  district: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  tag: {
    type: String,
    default: '家',
    trim: true,
    maxlength: 5
  },
  is_default: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Ensure only one default address per user
userAddressSchema.pre('save', async function(next) {
  if (this.is_default && this.isModified('is_default')) { // Only run if is_default is true and it was actually changed to true
    // `this.constructor` refers to the Mongoose model
    await this.constructor.updateMany({ user_id: this.user_id, _id: { $ne: this._id }, is_default: true }, { is_default: false });
  }
  next();
});

export default (connection) => {
  if (!connection) {
    throw new Error('Mongoose connection is required to create UserAddress model');
  }
  return connection.model('UserAddress', userAddressSchema);
}; 