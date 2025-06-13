import express from 'express';
import {
  getAllAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} from '../controllers/userAddressController.js';
import { authenticateToken } from '../middleware/authMiddleware.js'; // Assuming you have this middleware

const router = express.Router();

// All address routes are protected and require authentication
router.use(authenticateToken);

// GET /api/users/addresses - Get all addresses for the logged-in user
router.get('/', getAllAddresses);

// POST /api/users/addresses - Create a new address for the logged-in user
router.post('/', createAddress);

// GET /api/users/addresses/:addressId - Get a specific address by ID
router.get('/:addressId', getAddressById);

// PUT /api/users/addresses/:addressId - Update a specific address by ID
router.put('/:addressId', updateAddress);

// DELETE /api/users/addresses/:addressId - Delete a specific address by ID
router.delete('/:addressId', deleteAddress);

// PATCH /api/users/addresses/:addressId/default - Set a specific address as default
router.patch('/:addressId/default', setDefaultAddress);

export default router; 
 