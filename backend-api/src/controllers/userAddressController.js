import { getUserModels } from '../models/index.js';

// Helper function to get UserAddress model
async function getUserAddressModel() {
  const { UserAddress } = await getUserModels();
  return UserAddress;
}

// Get all addresses for a user
export const getAllAddresses = async (req, res) => {
  try {
    const UserAddress = await getUserAddressModel();
    const userId = req.user.id; // Assuming userId is available from auth middleware
    const addresses = await UserAddress.find({ user_id: userId }).sort({ is_default: -1, updatedAt: -1 });
    res.status(200).json({ success: true, data: addresses, message: '地址列表获取成功' });
  } catch (error) {
    console.error('[UserAddressCtrl][Err] getAllAddresses:', error);
    res.status(500).json({ success: false, message: '获取地址列表失败', error: error.message });
  }
};

// Get a single address by ID
export const getAddressById = async (req, res) => {
  try {
    const UserAddress = await getUserAddressModel();
    const userId = req.user.id;
    const addressId = req.params.addressId;
    const address = await UserAddress.findOne({ _id: addressId, user_id: userId });
    if (!address) {
      return res.status(404).json({ success: false, message: '地址未找到' });
    }
    res.status(200).json({ success: true, data: address, message: '地址详情获取成功' });
  } catch (error) {
    console.error('[UserAddressCtrl][Err] getAddressById:', error);
    res.status(500).json({ success: false, message: '获取地址详情失败', error: error.message });
  }
};

// Create a new address
export const createAddress = async (req, res) => {
  try {
    const UserAddress = await getUserAddressModel();
    const userId = req.user.id;
    const { name, phone, province, city, district, address, tag, is_default } = req.body;

    if (!name || !phone || !province || !city || !district || !address) {
      return res.status(400).json({ success: false, message: '缺少必要的地址信息' });
    }

    const newAddressData = {
      user_id: userId,
      name,
      phone,
      province,
      city,
      district,
      address,
      tag,
      is_default: is_default || false
    };

    const newAddress = new UserAddress(newAddressData);
    
    // The pre('save') hook in the model will handle setting other addresses to not default if this one is_default
    await newAddress.save();
    res.status(201).json({ success: true, data: newAddress, message: '地址创建成功' });
  } catch (error) {
    console.error('[UserAddressCtrl][Err] createAddress:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: '地址信息验证失败', errors: error.errors });
    }
    res.status(500).json({ success: false, message: '创建地址失败', error: error.message });
  }
};

// Update an existing address
export const updateAddress = async (req, res) => {
  try {
    const UserAddress = await getUserAddressModel();
    const userId = req.user.id;
    const addressId = req.params.addressId;
    const updateData = req.body;

    // Prevent user_id from being updated
    delete updateData.user_id;

    const addressToUpdate = await UserAddress.findOne({ _id: addressId, user_id: userId });
    if (!addressToUpdate) {
      return res.status(404).json({ success: false, message: '需要更新的地址未找到' });
    }

    // If is_default is being set to true, handle unsetting other defaults
    if (updateData.is_default === true && !addressToUpdate.is_default) {
      await UserAddress.updateMany({ user_id: userId, _id: { $ne: addressId }, is_default: true }, { is_default: false });
    }
    
    // Apply updates
    Object.keys(updateData).forEach(key => {
      addressToUpdate[key] = updateData[key];
    });

    const updatedAddress = await addressToUpdate.save();
    res.status(200).json({ success: true, data: updatedAddress, message: '地址更新成功' });
  } catch (error) {
    console.error('[UserAddressCtrl][Err] updateAddress:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: '地址信息验证失败', errors: error.errors });
    }
    res.status(500).json({ success: false, message: '更新地址失败', error: error.message });
  }
};

// Delete an address
export const deleteAddress = async (req, res) => {
  try {
    const UserAddress = await getUserAddressModel();
    const userId = req.user.id;
    const addressId = req.params.addressId;

    const result = await UserAddress.deleteOne({ _id: addressId, user_id: userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: '要删除的地址未找到或不属于该用户' });
    }
    
    // If the deleted address was the default, we might need to set another one as default.
    // For simplicity, we are not automatically assigning a new default here.
    // The client/frontend might need to handle logic for selecting a new default if necessary.

    res.status(200).json({ success: true, message: '地址删除成功' });
  } catch (error) {
    console.error('[UserAddressCtrl][Err] deleteAddress:', error);
    res.status(500).json({ success: false, message: '删除地址失败', error: error.message });
  }
};

// Set an address as default
export const setDefaultAddress = async (req, res) => {
  try {
    const UserAddress = await getUserAddressModel();
    const userId = req.user.id;
    const addressId = req.params.addressId;

    const addressToSetDefault = await UserAddress.findOne({ _id: addressId, user_id: userId });

    if (!addressToSetDefault) {
      return res.status(404).json({ success: false, message: '地址未找到' });
    }

    if (addressToSetDefault.is_default) {
      return res.status(200).json({ success: true, message: '地址已经是默认地址', data: addressToSetDefault });
    }

    // The pre('save') hook on the model will handle unsetting other defaults.
    addressToSetDefault.is_default = true;
    await addressToSetDefault.save();

    res.status(200).json({ success: true, message: '默认地址设置成功', data: addressToSetDefault });
  } catch (error) {
    console.error('[UserAddressCtrl][Err] setDefaultAddress:', error);
    res.status(500).json({ success: false, message: '设置默认地址失败', error: error.message });
  }
}; 
 