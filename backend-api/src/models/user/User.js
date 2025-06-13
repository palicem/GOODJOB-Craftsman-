import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const userSchema = new Schema({
  // id: BIGINT PRIMARY KEY AUTO_INCREMENT, -> MongoDB will generate _id
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  password: {
    type: String,
    required: true
    // Add hashing/salting logic in a pre-save hook or service layer
  },
  account_name: {
    type: String,
    required: true,
    trim: true,
    default: function() { return this.username; },
    maxlength: 50
  },
  nickname: {
    type: String,
    trim: true,
    default: function() { return this.username; },
    maxlength: 50
  },
  avatar: {
    type: String,
    default: ''
  },
  real_name: {
    type: String,
    trim: true,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  birthday: {
    type: String, // Store as YYYY-MM-DD string or Date type
    default: ''
  },
  gender: {
    type: Number, // 0-未设置，1-男，2-女
    default: 0,
    min: 0,
    max: 2
  },
  phone: {
    type: String,
    trim: true,
    default: ''
    // Add validation for phone number format if needed
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
    // Add validation for email format if needed
  },
  status: {
    type: Number, // 0-禁用，1-正常
    default: 1,
    min: 0,
    max: 1
  },
  register_time: {
    type: Date,
    default: Date.now
  },
  last_login_time: {
    type: Date
  },
  login_token: {
    type: String
  },
  token_expire_time: {
    type: Date
  }
  // created_at and updated_at will be handled by timestamps option
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// TODO: Add pre-save hook for password hashing if not handled in service layer
// userSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) return next();
//   // Hash password
//   next();
// });

// Note: We will get the connection dynamically and then create the model.
// So, we export a function that takes a connection and returns the model.
export default (connection) => {
  if (!connection) {
    throw new Error('Mongoose connection is required to create User model');
  }
  return connection.model('User', userSchema);
}; 