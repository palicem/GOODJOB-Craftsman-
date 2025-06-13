/**
 * 用户服务 - 管理用户数据
 * 
 * TODO: 后期需要迁移到后端的API调用
 * 参考API文档: docs/api/api-doc.md - 用户模块接口
 */

import api from './apiService';

// 用户模块API
const userAPI = {
  // 1.1 用户注册
  register: (userData) => {
    return api.post('/api/v1/user/register', userData, false);
  },
  
  // 1.2 用户登录
  login: (username, password) => {
    return api.post('/api/v1/user/login', { username, password }, false)
      .then(async res => {
        if (res.success && res.data && res.data.token && res.data.data) {
          uni.setStorageSync('token', res.data.token);
          let userToStore = res.data.data;

          if (typeof userToStore === 'object' && userToStore !== null && (userToStore.id || userToStore._id)) {
            console.log('[userService.login] Storing user info:', JSON.stringify(userToStore));
            uni.setStorageSync('userInfo', JSON.stringify(userToStore));

            // 存储最近登录用户 - 如果需要保留此功能
            try {
              let recentUsers = uni.getStorageSync('recentUsers');
              if (typeof recentUsers === 'string') {
                  try {
                      recentUsers = JSON.parse(recentUsers);
                  } catch (parseError) {
                      console.warn('[userService.login] Failed to parse recentUsers, re-initializing.', parseError);
                      recentUsers = [];
                  }
              }
              if (!Array.isArray(recentUsers)) {
                  recentUsers = [];
              }

              if (!recentUsers.includes(username)) {
                recentUsers.unshift(username); 
                if (recentUsers.length > 5) { 
                  recentUsers.pop();
                }
                uni.setStorageSync('recentUsers', JSON.stringify(recentUsers));
              }
            } catch (e) {
              console.error('[userService.login] 保存最近登录用户失败:', e);
            }

          } else {
            console.error('[userService.login] User data from backend is not a valid object or missing ID. Received:', userToStore);
          }
        } else {
          console.warn('[userService.login] Login API call was not successful or did not return expected data. Response:', res);
        }
        return res;
      })
      .catch(err => {
        console.error('[userService.login] API call failed:', err);
        throw err;
      });
  },
  
  // 1.3 获取用户信息
  getUserInfo: () => {
    // 这个接口通常需要token认证
    return api.get('/api/v1/user/info'); 
  },
  
  // 1.4 检查用户名是否存在
  checkUsername: (username) => {
    return api.get(`/api/v1/user/check-username/${username}`, {}, false); 
  },
  
  // 1.5 用户登出
  logout: () => {
    return api.post('/api/v1/user/logout') // 假设登出也需要token，apiService会自动处理
      .then(res => {
        // 清除本地存储的token和用户信息
        uni.removeStorageSync('token');
        uni.removeStorageSync('userInfo');
        // uni.removeStorageSync('currentUser'); // 兼容旧的清除逻辑
        // uni.removeStorageSync('loginExpiration');
        // uni.removeStorageSync('autoLogin');
        return res;
      });
  },
  
  // 本地方法：获取当前用户信息
  getCurrentUser: () => {
    try {
      return uni.getStorageSync('userInfo') || null;
    } catch (e) {
      console.error('获取用户信息失败:', e);
      return null;
    }
  },
  
  // 本地方法：判断用户是否已登录
  isLoggedIn: () => {
    try {
      return !!uni.getStorageSync('token');
    } catch (e) {
      console.error('获取登录状态失败:', e);
      return false;
    }
  },

  // 检查用户名是否已存在 - 调用API
  isUserExists: (username) => {
    return userAPI.checkUsername(username).then(res => {
      return res.success && res.data.exists; 
    }).catch(err => {
      console.error("检查用户名是否存在失败:", err);
      return false; // 网络错误等情况，保守处理
    });
  },

  // 获取最近登录用户 - 如果需要保留此功能
  getRecentUsers: () => {
    try {
      const recentUsers = uni.getStorageSync('recentUsers');
      return recentUsers ? JSON.parse(recentUsers) : [];
    } catch (e) {
      console.error('获取最近用户列表失败:', e);
      return [];
    }
  },

  // 清除登录状态 - 主要由logout处理，但可保留一个独立的清除方法
  clearLoginState: () => {
    try {
      uni.removeStorageSync('token');
      uni.removeStorageSync('userInfo');
      // uni.removeStorageSync('currentUser');
      // uni.removeStorageSync('loginExpiration');
      // uni.removeStorageSync('autoLogin');
      // uni.removeStorageSync('recentUsers'); // 如果不再需要最近用户列表
      console.log('登录状态已清除');
    } catch (e) {
      console.error('清除登录状态失败:', e);
    }
  },

  // 保存注册时临时填写的数据，例如从注册页跳转到登录页时携带用户名
  saveRegisterTempData: (data) => {
    try {
      uni.setStorageSync('registerTempData', JSON.stringify(data));
    } catch (e) {
      console.error('保存注册临时数据失败:', e);
    }
  },

  getRegisterTempData: () => {
    try {
      const data = uni.getStorageSync('registerTempData');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('获取注册临时数据失败:', e);
      return null;
    }
  },

  clearRegisterTempData: () => {
    try {
      uni.removeStorageSync('registerTempData');
    } catch (e) {
      console.error('清除注册临时数据失败:', e);
    }
  }

};

export default userAPI;

// 下面这些本地方法将被移除或替换

// // 保存用户列表 - 后期移至后端
// export const saveUserList = (userList) => {
//   // TODO: 改为调用后端API: POST /user/register
//   try {
//     uni.setStorageSync('userList', JSON.stringify(userList));
//   } catch (e) {
//     console.error('保存用户列表失败:', e);
//   }
// }

// // 获取用户列表 - 后期移至后端
// export const getUserList = () => {
//   // TODO: 改为调用后端API: GET /user/list
//   try {
//     const userList = uni.getStorageSync('userList');
//     return userList ? JSON.parse(userList) : [];
//   } catch (e) {
//     console.error('获取用户列表失败:', e);
//     return [];
//   }
// }

// // 检查用户名是否已存在 - 改为调用API
// export const isUserExists = (username) => {
//   // TODO: 改为调用后端API: GET /user/check-username/{username}
//   const userList = getUserList();
//   return userList.some(user => user.username === username);
// }

// 生成随机昵称 - 这个如果前端注册时还需要，可以保留，但通常昵称应由用户自定或后端生成
const generateRandomNickname = () => {
  const adjectives = ['快乐的', '可爱的', '聪明的', '温柔的', '活泼的', '优雅的', '阳光的', '善良的', '机智的', '开朗的'];
  const nouns = ['小猫', '小狗', '小兔', '小鹿', '小象', '小熊猫', '小松鼠', '小海豚', '小企鹅', '小考拉'];
  const randomNum = Math.floor(Math.random() * 1000);
  const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${randomAdj}${randomNoun}${randomNum}`;
};
// userAPI.generateRandomNickname = generateRandomNickname; // 如果需要在其他地方使用


// // 注册新用户 - 改为调用API
// export const registerUser = (userData) => {
//   // TODO: 改为调用后端API: POST /user/register
//   if (isUserExists(userData.username)) { // isUserExists 现在是异步的，这里逻辑需要调整
//     return Promise.resolve({ // 需要返回Promise
//       success: false,
//       message: '用户名已存在'
//     });
//   }
  
//   try {
//     const userList = getUserList();
//     // 添加随机昵称
//     const newUser = {
//       ...userData,
//       nickname: generateRandomNickname(),
//       accountName: userData.username // 确保账户名与用户名一致
//     };
//     userList.push(newUser);
//     saveUserList(userList);
//     return Promise.resolve({ // 需要返回Promise
//       success: true,
//       message: '注册成功'
//     });
//   } catch (e) {
//     console.error('注册用户失败:', e);
//     return Promise.resolve({ // 需要返回Promise
//       success: false,
//       message: '注册失败，请重试'
//     });
//   }
// }

// // 添加初始用户数据（如果用户列表为空）- 后期可移至后端初始化脚本
// export const initUserData = () => {
//   // TODO: 后端应该自己初始化一个管理员账户
//   try {
//     const userList = getUserList();
//     if (userList.length === 0) {
//       // 添加一个默认用户
//       const defaultUser = {
//         username: 'admin',
//         password: '123456', // 密码不应明文存储或传输
//         registerTime: new Date().toISOString()
//       };
      
//       saveUserList([defaultUser]);
//       console.log('已初始化默认用户数据');
//       return true;
//     }
//     return false;
//   } catch (e) {
//     console.error('初始化用户数据失败:', e);
//     return false;
//   }
// }

// // 用户登录验证 - 改为调用API
// export const loginUser = (username, password) => {
//   // TODO: 改为调用后端API: POST /user/login
//   try {
//     console.log(`尝试登录用户: ${username}`);
    
//     const userList = getUserList();
//     console.log(`当前用户列表长度: ${userList.length}`);
    
//     // 如果用户列表为空，初始化一个默认用户
//     if (userList.length === 0) {
//       initUserData();
      
//       // 如果输入的是默认用户凭据，直接返回成功
//       if (username === 'admin' && password === '123456') {
//         const defaultUser = {
//           username: 'admin',
//           password: '123456',
//           registerTime: new Date().toISOString()
//         };
        
//         console.log('使用默认用户登录成功');
//         return Promise.resolve({ // 需要返回Promise
//           success: true,
//           user: defaultUser
//         });
//       }
//     }
    
//     // 正常查找用户
//     const user = userList.find(u => u.username === username && u.password === password); // 密码不应明文比较
    
//     if (user) {
//       console.log('登录成功');
//       return Promise.resolve({ // 需要返回Promise
//         success: true,
//         user
//       });
//     } else {
//       console.log('登录失败: 用户名或密码错误');
//       return Promise.resolve({ // 需要返回Promise
//         success: false,
//         message: '用户名或密码错误'
//       });
//     }
//   } catch (e) {
//     console.error('登录过程发生错误:', e);
//     return Promise.resolve({ // 需要返回Promise
//       success: false,
//       message: '登录失败，请重试'
//     });
//   }
// }

// // 设置登录有效期（天数）- 这个逻辑将不再由前端控制
// // const LOGIN_EXPIRATION_DAYS = 7; 

// // 保存登录状态 - 主要由 login 函数处理 token 和 userInfo 的保存
// export const saveLoginState = (userData, autoLogin = false) => {
//   // TODO: 登录成功后后端会返回token，前端保存token
//   try {
//     console.log('保存登录状态 (旧，应已由 login 函数处理):', userData);
    
//     // const expirationDate = new Date();
//     // expirationDate.setDate(expirationDate.getDate() + LOGIN_EXPIRATION_DAYS);
    
//     // uni.setStorageSync('currentUser', JSON.stringify(userData));
//     // uni.setStorageSync('loginExpiration', expirationDate.toISOString());
//     // uni.setStorageSync('autoLogin', autoLogin);
    
//     // 保存最近登录的用户名列表 - 移至 login 函数内部
//     // try {
//     //   let recentUsers = uni.getStorageSync('recentUsers');
//     //   recentUsers = recentUsers ? JSON.parse(recentUsers) : [];
//     //   if (!recentUsers.includes(userData.username)) {
//     //     recentUsers.unshift(userData.username); 
//     //     if (recentUsers.length > 5) { 
//     //       recentUsers.pop();
//     //     }
//     //     uni.setStorageSync('recentUsers', JSON.stringify(recentUsers));
//     //   }
//     // } catch (e) {
//     //   console.error('保存最近登录用户失败:', e);
//     // }

//   } catch (e) {
//     console.error('保存登录状态失败:', e);
//   }
// }

// // 获取登录状态 - 主要通过 getCurrentUser 和 isLoggedIn 判断
// export const getLoginState = () => {
//   // try {
//   //   const currentUser = uni.getStorageSync('currentUser');
//   //   const loginExpiration = uni.getStorageSync('loginExpiration');
//   //   const autoLogin = uni.getStorageSync('autoLogin') || false;
//   //   return {
//   //     currentUser: currentUser ? JSON.parse(currentUser) : null,
//   //     loginExpiration,
//   //     autoLogin
//   //   };
//   // } catch (e) {
//   //   console.error('获取登录状态失败:', e);
//   //   return { currentUser: null, loginExpiration: null, autoLogin: false };
//   // }
//   return {}; // 返回空对象，表示此方法已废弃
// }

// // 检查登录是否过期 - 主要依赖API调用时的token验证
// export const isLoginExpired = () => {
//   // try {
//   //   const loginExpiration = uni.getStorageSync('loginExpiration');
//   //   if (!loginExpiration) return true; // 没有过期时间视为已过期
//   //   return new Date() > new Date(loginExpiration);
//   // } catch (e) {
//   //   console.error('检查登录是否过期失败:', e);
//   //   return true; // 异常视为已过期
//   // }
//   return !userAPI.isLoggedIn(); // 如果未登录，则视为"过期"
// }

// // 获取最近登录用户 - 已移入 userAPI 对象
// export const getRecentUsers = () => {
//   // try {
//   //   const recentUsers = uni.getStorageSync('recentUsers');
//   //   return recentUsers ? JSON.parse(recentUsers) : [];
//   // } catch (e) {
//   //   console.error('获取最近用户列表失败:', e);
//   //   return [];
//   // }
//   return userAPI.getRecentUsers ? userAPI.getRecentUsers() : [];
// }

// // 清除登录状态 - 已移入 userAPI 对象
// export const clearLoginState = () => {
//   // try {
//   //   uni.removeStorageSync('currentUser');
//   //   uni.removeStorageSync('loginExpiration');
//   //   uni.removeStorageSync('autoLogin');
//   //   uni.removeStorageSync('token'); // 确保token也被清除
//   //   uni.removeStorageSync('userInfo'); // 确保userInfo也被清除
//   //   console.log('登录状态已清除');
//   // } catch (e) {
//   //   console.error('清除登录状态失败:', e);
//   // }
//   if(userAPI.clearLoginState) userAPI.clearLoginState();
// }

// // 保存注册时临时填写的数据，例如从注册页跳转到登录页时携带用户名
// export const saveRegisterTempData = (data) => {
//   // try {
//   //   uni.setStorageSync('registerTempData', JSON.stringify(data));
//   // } catch (e) {
//   //   console.error('保存注册临时数据失败:', e);
//   // }
//   if(userAPI.saveRegisterTempData) userAPI.saveRegisterTempData(data);
// }

// export const getRegisterTempData = () => {
//   // try {
//   //   const data = uni.getStorageSync('registerTempData');
//   //   return data ? JSON.parse(data) : null;
//   // } catch (e) {
//   //   console.error('获取注册临时数据失败:', e);
//   //   return null;
//   // }
//   return userAPI.getRegisterTempData ? userAPI.getRegisterTempData() : null;
// }

// export const clearRegisterTempData = () => {
//   // try {
//   //   uni.removeStorageSync('registerTempData');
//   // } catch (e) {
//   //   console.error('清除注册临时数据失败:', e);
//   // }
//   if(userAPI.clearRegisterTempData) userAPI.clearRegisterTempData();
// } 