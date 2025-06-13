/**
 * 用户个人资料和收货地址管理服务
 * 
 * 提供统一的接口来管理用户个人信息和收货地址
 */

import api from './apiService'; // 引入apiService

/**
 * 获取当前登录的用户信息 (详细资料)
 * @returns {Promise<Object>} 用户信息对象
 */
export const getUserProfile = async () => {
  const token = uni.getStorageSync('token');
  let localUserInfoString = uni.getStorageSync('userInfo'); // Get as string first
  let localUserInfo = null;

  if (localUserInfoString && typeof localUserInfoString === 'string') {
    try {
      localUserInfo = JSON.parse(localUserInfoString);
    } catch (e) {
      console.error('[profileService.getUserProfile] Failed to parse localUserInfo string:', e);
      localUserInfo = null; // Set to null if parsing fails
    }
  } else if (typeof localUserInfoString === 'object' && localUserInfoString !== null) {
    // 如果已经是对象了 (理论上 uni.getStorageSync 应该返回原始类型，但以防万一)
    localUserInfo = localUserInfoString;
  }
  
  console.log('[DEBUG profileService.getUserProfile] Parsed localUserInfo object:', JSON.stringify(localUserInfo, null, 2)); 

  const userId = localUserInfo ? (localUserInfo._id || localUserInfo.id) : null;

  if (!localUserInfo || !userId) { 
    console.log(`[DEBUG profileService.getUserProfile] localUserInfo is ${localUserInfo ? 'present but missing ID' : 'null/undefined'}. userId found: ${userId}. Message: "获取用户资料失败: 本地用户信息或ID缺失"`);
    
    // 您的日志显示 "[DEBUG profileService.getUserProfile] No local user info but token exists. Backend /api/user/me call is an issue or disabled for now."
    // 这通常意味着这里应该有一个尝试从后端获取用户的逻辑，但它失败了或未启用。
    // 例如：
    // if (token) {
    //   try {
    //     console.log('[profileService.getUserProfile] Token exists, attempting to fetch from /api/user/me');
    //     const response = await api.get('/api/user/me'); // 假设有这样一个接口
    //     if (response.success && response.data) {
    //       uni.setStorageSync('userInfo', JSON.stringify(response.data));
    //       return Promise.resolve({ success: true, data: response.data, message: '获取用户资料成功(远程)' });
    //     }
    //   } catch (apiError) {
    //     console.error('[profileService.getUserProfile] Error fetching user profile from API:', apiError);
    //   }
    // }
    return Promise.reject({ success: false, message: '获取用户资料失败: 本地用户信息或ID缺失，且无法从远程获取。', data: null });
  }

  console.log('[DEBUG profileService.getUserProfile] Successfully retrieved user from local storage with ID:', userId);
  return Promise.resolve({ success: true, data: localUserInfo, message: '获取用户资料成功(本地)' });
};

/**
 * 更新用户信息
 * @param {Object} profileData 要更新的用户信息对象 (通常不包含id，id从当前用户获取)
 * @returns {Promise<Boolean>} 更新结果
 */
export const updateUserProfile = async (userData) => {
  console.log('[DEBUG profileService.updateUserProfile] Called with userData (should be an object):', JSON.stringify(userData, null, 2));
  
  const userId = userData ? (userData._id || userData.id) : null; // 获取 id 或 _id

  if (!userData || !userId) { // 使用提取的 userId 进行校验
    console.error(`[DEBUG profileService.updateUserProfile] Invalid userData or missing ID (_id or id). userId found: ${userId}. Aborting update.`);
    return false;
  }
  try {
    // 使用提取的 userId 构建API路径
    console.log(`[DEBUG profileService.updateUserProfile] Attempting to call API: PUT /api/user/${userId} with data:`, JSON.stringify(userData, null, 2));
    
    // 假设后端 /api/user/:userId 接口能接受路径中的 userId (无论是 id 还是 _id 格式，只要值正确)
    // 并且请求体中的 userData 可以直接发送。如果后端严格要求请求体中的ID是_id，则需要转换。
    const response = await api.put(`/api/user/${userId}`, userData);
    console.log('[DEBUG profileService.updateUserProfile] API response received:', JSON.stringify(response, null, 2));

    if (response && response.success && response.data) {
      // 后端更新成功后，再更新本地存储为后端返回的最新数据
      const backendUserData = response.data;
      // 建议：确保后端返回的数据 ID 字段统一，例如总是返回 _id
      // 如果后端可能返回 id，前端可能需要转换确保本地存储和 store 中是 _id
      // if (backendUserData.id && !backendUserData._id) { 
      //   backendUserData._id = backendUserData.id;
      //   delete backendUserData.id; // 可选
      // }
      uni.setStorageSync('userInfo', JSON.stringify(backendUserData)); 
      console.log('[DEBUG profileService.updateUserProfile] Backend update successful. UserData (from backend) stringified and stored locally.');
      
      // 触发事件，让 Vue 组件去更新 Pinia store
      uni.$emit('userInfoNeedsUpdateInStore', backendUserData);
      return true;
    } else {
      console.warn('[DEBUG profileService.updateUserProfile] Backend update failed or API returned error/no success. Response:', JSON.stringify(response, null, 2));
      return false; 
    }
  } catch (error) {
    console.error('[DEBUG profileService.updateUserProfile] Error during API call or saving user data:', error);
    return false;
  }
};

/**
 * 更新用户信息中的某个字段
 * @param {String} field 字段名
 * @param {any} value 字段值
 * @returns {Promise<Boolean>} 更新结果
 */
export const updateUserField = async (field, value) => {
  try {
    // 注意：这种方式如果频繁调用单个字段更新，不如直接更新整个profile效率高
    // 但如果后端支持 PATCH 部分更新，则更佳
    const currentProfile = await getUserProfile(); // 获取当前完整profile
    if (!currentProfile || Object.keys(currentProfile).length === 0) {
        console.error('无法获取当前用户profile，更新字段失败');
        return false;
    }
    const updatedProfile = { ...currentProfile, [field]: value };
    return await updateUserProfile(updatedProfile);
  } catch (e) {
    console.error('更新用户字段异常:', e);
    return false;
  }
};

/**
 * 将图片转换为base64格式
 * @param {String} filePath 图片路径
 * @returns {Promise<string>} base64字符串
 */
const imageToBase64 = (filePath) => {
  return new Promise((resolve, reject) => {
    // #ifdef H5
    fetch(filePath)
      .then(response => response.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      })
      .catch(reject);
    // #endif
    
    // #ifndef H5
    const fs = uni.getFileSystemManager();
    fs.readFile({
      filePath: filePath,
      encoding: 'base64',
      success: (res) => {
        resolve('data:image/png;base64,' + res.data);
      },
      fail: reject
    });
    // #endif
  });
};

/**
 * 更新用户头像
 * @param {String} avatarPath 头像文件路径
 * @returns {Promise<Boolean>} 更新结果
 */
export const updateUserAvatar = async (avatarPath) => {
  try {
    const base64Data = await imageToBase64(avatarPath);
    // 调用 updateUserField 或 updateUserProfile 来更新头像字段
    // 假设后端接收名为 'avatar' 的字段包含 base64 字符串
    const result = await updateUserField('avatar', base64Data);
    if (result) {
      uni.$emit('userAvatarUpdated', base64Data);
    }
    return result;
  } catch (e) {
    console.error('更新头像失败:', e);
    return false;
  }
};

/**
 * 获取收货地址列表
 * @returns {Promise<Array>} 地址列表
 */
export const getAddressList = async () => {
  try {
    console.log('[DEBUG profileService.getAddressList] Attempting to GET /api/user/addresses');
    const response = await api.get('/api/user/addresses');
    console.log('[DEBUG profileService.getAddressList] Full API response received:', JSON.stringify(response)); // 打印完整响应

    if (response && response.success && response.data) { // 检查 response 和 response.data 是否都存在
      console.log('[DEBUG profileService.getAddressList] API call successful, returning data:', response.data);
      return response.data;
    } else {
      console.warn('[DEBUG profileService.getAddressList] API call not successful or no data. Success flag:', response ? response.success : 'N/A', 'Data exists:', response && !!response.data);
      return [];
    }
  } catch (error) {
    console.error('获取地址列表失败 (profileService catch block):', error); // 明确是哪个catch
    // 如果error对象本身就是后端返回的JSON，尝试打印它
    if (typeof error === 'object' && error !== null) {
      console.error('Error object details:', JSON.stringify(error));
    }
    return [];
  }
};

/**
 * 获取默认收货地址
 * @returns {Promise<Object|null>} 默认地址
 */
export const getDefaultAddress = async () => {
  try {
    const addresses = await getAddressList();
    return addresses.find(addr => addr.is_default) || (addresses.length > 0 ? addresses[0] : null);
  } catch (error) {
    console.error('获取默认地址失败:', error);
    return null;
  }
};

/**
 * 添加新地址
 * @param {Object} addressData 地址信息
 * @returns {Promise<Object|null>} 创建的地址对象或null
 */
export const addAddress = async (addressData) => {
  try {
    const response = await api.post('/api/user/addresses', addressData);
    if (response.success) {
      uni.$emit('addressListChanged');
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('添加地址失败:', error);
    return null;
  }
};

/**
 * 更新地址信息
 * @param {Object} addressData 要更新的地址信息 (必须包含id)
 * @returns {Promise<Boolean>} 更新结果
 */
export const updateAddress = async (addressData) => {
  if (!addressData._id) {
    console.error('更新地址失败: 地址ID缺失');
    return false;
  }
  try {
    const response = await api.put(`/api/user/addresses/${addressData._id}`, addressData);
    if (response.success) {
      uni.$emit('addressListChanged');
      return true;
    }
    return false;
  } catch (error) {
    console.error('更新地址失败:', error);
    return false;
  }
};

/**
 * 删除地址
 * @param {String} addressId 地址ID
 * @returns {Promise<Boolean>} 删除结果
 */
export const deleteAddress = async (addressId) => {
  try {
    const response = await api.delete(`/api/user/addresses/${addressId}`);
    if (response.success) {
      uni.$emit('addressListChanged');
      return true;
    }
    return false;
  } catch (error) {
    console.error('删除地址失败:', error);
    return false;
  }
};

/**
 * 设置默认地址
 * @param {String} addressId 要设为默认的地址ID
 * @returns {Promise<Boolean>} 操作结果
 */
export const setDefaultAddress = async (addressId) => {
  try {
    const response = await api.put(`/api/user/addresses/${addressId}/default`);
    if (response.success) {
      uni.$emit('addressListChanged');
      return true;
    }
    return false;
  } catch (error) {
    console.error('设置默认地址失败:', error);
    return false;
  }
};

/**
 * 格式化手机号码，隐藏中间4位
 * @param {String} phone 手机号码
 * @returns {String} 格式化后的手机号码
 */
export const formatPhone = (phone) => {
  if (!phone || phone.length !== 11) {
    return phone; 
  }
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

/**
 * 格式化性别
 * @param {Number} gender 性别代码：0-未设置，1-男，2-女
 * @returns {String} 性别文本
 */
export const formatGender = (gender) => {
  switch (Number(gender)) {
    case 1: return '男';
    case 2: return '女';
    default: return '未设置';
  }
}; 