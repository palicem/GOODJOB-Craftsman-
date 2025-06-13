import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { getUserDBConnection } from '../config/db.js'; // To connect to the User DB
import createUserModel from '../models/user/User.js'; // To get the User model

dotenv.config(); // Load environment variables from .env file

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in .env file.");
  process.exit(1); // Exit the process if secret is not set
}

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) {
    return res.status(401).json({ message: '认证令牌未提供' }); // Unauthorized
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Token is valid, now ensure we have full user info including account_name

    if (!decoded.id) { // Assuming JWT payload has user's MongoDB _id as 'id'
        console.error('[AuthMiddleware] JWT payload does not contain user id.');
        return res.status(403).json({ message: '无效的认证令牌 (用户信息不完整)' });
    }

    const userDbConnection = await getUserDBConnection();
    const User = createUserModel(userDbConnection);

    // Fetch the user from DB to get all necessary fields, especially account_name
    // .lean() returns a plain JS object, not a Mongoose document, which is good for this purpose
    const userFromDb = await User.findById(decoded.id).select('id username account_name email role status').lean(); 

    if (!userFromDb) {
        console.warn(`[AuthMiddleware] User with id ${decoded.id} not found in DB, but token was valid.`);
        return res.status(403).json({ message: '认证用户不存在' });
    }

    // req.user will now contain the id, username, account_name, email, role, status from the database.
    // It will also contain any other fields that were in the original 'decoded' JWT payload 
    // if they are not overridden by fields selected from the database.
    // For safety, we can explicitly build req.user or merge.
    req.user = { ...decoded, ...userFromDb }; 
    // Ensure account_name is present, fallback to username if userFromDb.account_name is somehow missing but username is there.
    // The User model has default for account_name to username, so this should be robust.
    if (!req.user.account_name && req.user.username) {
        req.user.account_name = req.user.username;
    }

    if (!req.user.username && req.user.account_name) { // If username missing but account_name present
        req.user.username = req.user.account_name;
    }

    // Crucially, ensure orderController can access account_name or username
    if (!req.user.account_name && !req.user.username) {
        console.error('[AuthMiddleware] CRITICAL: User object on request is missing both account_name and username after DB fetch.', req.user);
        return res.status(500).json({ message: '无法检索完整的用户信息'});
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '认证令牌已过期' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: '无效的认证令牌' }); // Forbidden
    }
    console.error('[AuthMiddleware] Error during token verification or user fetch:', err);
    return res.status(500).json({ message: '令牌验证或用户检索时发生内部错误' });
  }
};

// Optional: Middleware to check for specific roles if you implement role-based access control
export const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      // Ensure req.user.role check is appropriate for your user schema (e.g., if role is optional or named differently)
      return res.status(403).json({ message: '用户角色未定义或角色信息缺失，禁止访问' });
    }
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (rolesArray.some(role => req.user.role === role)) {
      next();
    } else {
      return res.status(403).json({ message: '用户角色无权访问此资源' });
    }
  };
}; 
 