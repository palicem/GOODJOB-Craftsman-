import * as mongoose from 'mongoose';

const shopProfileSchema = new mongoose.Schema({
  shop_id: { 
    type: String, 
    required: [true, 'Shop ID is required.'], 
    index: true, // Ensure index for faster lookups
    // unique: true // Uniqueness should be guaranteed by db name, not within this collection across different shops if ever consolidated.
  },
  name: { 
    type: String, 
    required: [true, 'Shop name is required.'] 
  },
  description: { 
    type: String,
    default: ''
  },
  logo_url: { // Renamed from logo for clarity
    type: String, 
    default: '' 
  },
  contact_email: { // Added field
    type: String,
    default: ''
  },
  contact_phone: { // Changed from contact_info
    type: String, 
    default: '' 
  },
  address: { // Changed from location
    type: String, 
    default: '' 
  },
  status: { 
    type: String, 
    default: 'active', 
    enum: ['active', 'inactive', 'pending_approval', 'rejected', 'deleted'], // Added more statuses
    index: true
  }
  // created_at and updated_at will be handled by timestamps option
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  // collection: 'shopprofiles' // Explicitly set collection name if Mongoose default (shopprofiles) isn't desired
});

// Middleware to update 'updated_at' field before saving is no longer needed if using timestamps: true
// shopProfileSchema.pre('save', function(next) {
//   this.updated_at = Date.now();
//   next();
// });

export function createShopProfileModel(connection) {
  // Mongoose automatically looks for the plural, lowercase version of your model name.
  // Thus, for 'ShopProfile', it will be 'shopprofiles'.
  return connection.model('ShopProfile', shopProfileSchema);
} 
 