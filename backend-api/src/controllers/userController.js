import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUserModels } from '../models/index.js';
// dotenv is already configured in authMiddleware or app.js, so JWT_SECRET should be available via process.env

async function getUserModel() {
  const { User } = await getUserModels();
  return User;
}

// 用户注册
export const registerUser = async (req, res) => {
  console.log('[Log][UserCtrl] Attempting to register user with body:', req.body);
  try {
    const User = await getUserModel();
    const { username, password, account_name, nickname, email, phone } = req.body;

    if (!username || !password) {
      console.log('[Log][UserCtrl] Registration failed: Username or password missing');
      return res.status(400).json({ message: '用户名和密码不能为空' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log(`[Log][UserCtrl] Registration failed: Username '${username}' already exists`);
      return res.status(400).json({ message: '用户名已存在' });
    }
    
    if (email) {
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            console.log(`[Log][UserCtrl] Registration failed: Email '${email}' already exists`);
            return res.status(400).json({ message: '邮箱已存在' });
        }
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({
      username,
      password: hashedPassword,
      account_name: account_name || username,
      nickname: nickname || username,
      email,
      phone,
      register_time: new Date(),
      status: 1 // 默认为正常状态
    });

    await newUser.save();
    console.log(`[Log][UserCtrl] User '${username}' registered successfully with ID: ${newUser._id}`);
    
    const userPayload = {
      id: newUser._id,
      username: newUser.username,
    };
    const token = jwt.sign(userPayload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: '用户注册成功',
      data: {
        id: newUser._id,
        username: newUser.username,
        account_name: newUser.account_name,
        nickname: newUser.nickname,
        email: newUser.email,
        phone: newUser.phone
      },
      token
    });

  } catch (error) {
    console.error('[UserCtrl][Err] registerUser:', error);
    res.status(500).json({ success: false, message: '用户注册失败', error: error.message });
  }
};

// 用户登录
export const loginUser = async (req, res) => {
  console.log('[Log][UserCtrl] Attempting to login user with body:', req.body);
  try {
    const User = await getUserModel();
    const { username, password } = req.body;

    if (!username || !password) {
      console.log('[Log][UserCtrl] Login failed: Username or password missing');
      return res.status(400).json({ message: '用户名和密码不能为空' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      console.log(`[Log][UserCtrl] Login failed: User '${username}' not found`);
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`[Log][UserCtrl] Login failed: Password mismatch for user '${username}'`);
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    if (user.status === 0) {
        console.log(`[Log][UserCtrl] Login failed: User '${username}' is disabled.`);
        return res.status(403).json({ message: '用户已被禁用，请联系管理员' });
    }

    user.last_login_time = new Date();
    await user.save();

    console.log(`[Log][UserCtrl] User '${username}' logged in successfully.`);

    const userPayload = {
      id: user._id,
      username: user.username,
    };

    const token = jwt.sign(
      userPayload, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: '登录成功',
      token: token,
      data: {
        id: user._id,
        username: user.username,
        account_name: user.account_name,
        nickname: user.nickname,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
      }
    });

  } catch (error) {
    console.error('[UserCtrl][Err] loginUser:', error);
    res.status(500).json({ success: false, message: '登录失败', error: error.message });
  }
};

// 获取所有用户
export const getAllUsers = async (req, res) => {
  console.log('[Log][UserCtrl] Getting all users');
  try {
    const User = await getUserModel();
    const users = await User.find({}, '-password');
    res.status(200).json({ success: true, data: users, message: '用户列表获取成功' });
  } catch (error) {
    console.error('[UserCtrl][Err] getAllUsers:', error);
    res.status(500).json({ success: false, message: '获取用户列表失败', error: error.message });
  }
};

// 获取单个用户信息
export const getUserById = async (req, res) => {
  const userId = req.params.id;
  console.log(`[Log][UserCtrl] Getting user by ID: ${userId}`);
  try {
    const User = await getUserModel();
    const user = await User.findById(userId, '-password');
    if (!user) {
      console.log(`[Log][UserCtrl] User with ID: ${userId} not found`);
      return res.status(404).json({ success: false, message: '用户未找到' });
    }
    res.status(200).json({ success: true, data: user, message: '用户信息获取成功' });
  } catch (error) {
    console.error(`[UserCtrl][Err] getUserById (ID: ${userId}):`, error);
    res.status(500).json({ success: false, message: '获取用户信息失败', error: error.message });
  }
};

// 更新用户信息
export const updateUser = async (req, res) => {
  // const userId = req.params.userId; // Original
  const userId = req.params.id; // Corrected to match userRoutes.js
  console.log(`[Log][UserCtrl] Attempting to update user ID: ${userId} with data:`, req.body);
  console.log(`[Log][UserCtrl] Full req.body received:`, JSON.stringify(req.body, null, 2)); // Added log
  try {
    const User = await getUserModel();
    const { username, account_name, nickname, email, phone, avatar, bio, birthday, gender, real_name } = req.body;

    const updateData = {};
    if (username) updateData.username = username;
    if (account_name) updateData.account_name = account_name;
    if (nickname) updateData.nickname = nickname;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (avatar) updateData.avatar = avatar;
    if (bio) updateData.bio = bio;
    if (birthday) updateData.birthday = birthday;
    if (gender !== undefined) updateData.gender = gender;
    if (real_name) updateData.real_name = real_name;

    console.log(`[Log][UserCtrl] Constructed updateData before adding updated_at:`, JSON.stringify(updateData, null, 2)); // Added log

    if (Object.keys(updateData).length === 0) {
        // return res.status(400).json({ message: '没有提供可更新的数据' });
        return res.status(400).json({ success: false, message: '没有提供可更新的数据' }); // Ensure success:false
    }

    updateData.updated_at = new Date();

    const updatedUser = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true, runValidators: true }).select('-password');

    if (!updatedUser) {
      console.log(`[Log][UserCtrl] Update failed: User with ID: ${userId} not found`);
      return res.status(404).json({ success: false, message: '用户未找到，无法更新' });
    }
    console.log(`[Log][UserCtrl] User ID: ${userId} updated successfully.`);
    res.status(200).json({ success: true, data: updatedUser, message: '用户信息更新成功' });
  } catch (error) {
    console.error(`[UserCtrl][Err] updateUser (ID: ${userId}):`, error);
    if (error.code === 11000) {
        return res.status(400).json({ success: false, message: '更新失败，用户名或邮箱已存在。' });
    }
    res.status(500).json({ success: false, message: '更新用户信息失败', error: error.message });
  }
};

// 删除用户
export const deleteUser = async (req, res) => {
  // const userId = req.params.userId; // Original
  const userId = req.params.id; // Corrected to match userRoutes.js
  console.log(`[Log][UserCtrl] Attempting to delete user ID: ${userId}`);
  try {
    const User = await getUserModel();
    const result = await User.findByIdAndDelete(userId);
    if (!result) {
      console.log(`[Log][UserCtrl] Delete failed: User with ID: ${userId} not found`);
      return res.status(404).json({ success: false, message: '用户未找到，无法删除' });
    }
    console.log(`[Log][UserCtrl] User ID: ${userId} deleted successfully.`);
    res.status(200).json({ success: true, message: '用户删除成功' });
  } catch (error) {
    console.error(`[UserCtrl][Err] deleteUser (ID: ${userId}):`, error);
    res.status(500).json({ success: false, message: '删除用户失败', error: error.message });
  }
};

// 新增：检查用户名是否可用
export const checkUsernameAvailability = async (req, res) => {
  console.log('[Log][UserCtrl] Checking username availability for:', req.params.username);
  try {
    const User = await getUserModel();
    const { username } = req.params;
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log(`[Log][UserCtrl] Username '${username}' is taken.`);
      // 返回 success: true 表示API调用成功，exists: true 表示用户已存在
      return res.status(200).json({ success: true, exists: true, message: '用户名已存在' });
    }
    console.log(`[Log][UserCtrl] Username '${username}' is available.`);
    // 返回 success: true 表示API调用成功，exists: false 表示用户不存在
    return res.status(200).json({ success: true, exists: false, message: '用户名可用' });
  } catch (error) {
    console.error('[UserCtrl][Err] checkUsernameAvailability:', error);
    // 返回 success: false 表示API调用失败
    res.status(500).json({ success: false, message: '检查用户名失败', error: error.message });
  }
}; 