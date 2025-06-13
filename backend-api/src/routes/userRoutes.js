import express from 'express';
import * as userController from '../controllers/userController.js';
import userAddressRoutes from './userAddressRoutes.js'; // Import address routes

const router = express.Router();

// 新增：用户登录路由
router.post('/login', userController.loginUser);

// 新增：检查用户名是否存在
router.get('/check-username/:username', userController.checkUsernameAvailability);

// User address routes - MUST be defined before the generic /:id route
// All requests to /api/user/addresses will be handled by userAddressRoutes
router.use('/addresses', userAddressRoutes);

// User registration
router.post('/register', userController.registerUser);

// Get all users (typically admin only, ensure proper authorization in controller)
router.get('/', userController.getAllUsers);

// Routes for specific user by ID - these are now AFTER /addresses
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser); // Assuming authenticateToken is applied here or in controller
router.delete('/:id', userController.deleteUser); // Assuming authenticateToken is applied here or in controller

export default router; 