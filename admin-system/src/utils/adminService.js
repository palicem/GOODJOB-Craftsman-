import { ElMessage } from 'element-plus'

// 管理员角色枚举
export const AdminRole = {
  SUPER_ADMIN: 'super_admin',
  SHOP_ADMIN: 'shop_admin'
}

// 获取当前管理员信息
export const getCurrentAdmin = () => {
  try {
    const adminInfo = localStorage.getItem('adminInfo')
    return adminInfo ? JSON.parse(adminInfo) : null
  } catch (e) {
    console.error('获取管理员信息失败:', e)
    return null
  }
}

// 检查是否是管理员
export const isAdmin = () => {
  const admin = getCurrentAdmin()
  return !!admin
}

// 检查是否是超级管理员
export const isSuperAdmin = () => {
  const admin = getCurrentAdmin()
  return admin?.role === AdminRole.SUPER_ADMIN
}

// 检查是否是店铺管理员
export const isShopAdmin = () => {
  const admin = getCurrentAdmin()
  return admin?.role === AdminRole.SHOP_ADMIN
}

// 获取管理员可管理的店铺ID列表
export const getAdminShops = () => {
  const admin = getCurrentAdmin()
  if (!admin) return []
  
  // 超级管理员可以管理所有店铺
  if (admin.role === AdminRole.SUPER_ADMIN) {
    return null // null 表示可以管理所有店铺
  }
  
  // 店铺管理员只能管理指定的店铺
  return admin.shops || []
}

// 检查是否可以管理指定店铺
export const canManageShop = (shopId) => {
  const admin = getCurrentAdmin()
  if (!admin) return false
  
  // 超级管理员可以管理所有店铺
  if (admin.role === AdminRole.SUPER_ADMIN) {
    return true
  }
  
  // 店铺管理员检查是否在可管理的店铺列表中
  return admin.shops?.includes(shopId) || false
}

// 管理员登录
export const adminLogin = (username, password) => {
  // 这里应该调用后端API进行验证
  // 目前使用模拟数据
  if (username === 'admin' && password === 'admin123') {
    const adminInfo = {
      id: 1,
      username: 'admin',
      role: AdminRole.SUPER_ADMIN,
      name: '超级管理员'
    }
    localStorage.setItem('adminInfo', JSON.stringify(adminInfo))
    return true
  }
  
  if (username === 'shop_admin' && password === 'shop123') {
    const adminInfo = {
      id: 2,
      username: 'shop_admin',
      role: AdminRole.SHOP_ADMIN,
      name: '店铺管理员',
      shops: ['shop001', 'shop002'] // 可管理的店铺ID列表
    }
    localStorage.setItem('adminInfo', JSON.stringify(adminInfo))
    return true
  }
  
  return false
}

// 管理员登出
export const adminLogout = () => {
  localStorage.removeItem('adminInfo')
}

// 权限检查中间件
export const checkPermission = (to, from, next) => {
  const admin = getCurrentAdmin()
  
  // 检查是否需要管理员权限
  if (to.matched.some(record => record.meta.requiresAdmin)) {
    if (!admin) {
      ElMessage.error('请先登录')
      next({ path: '/login' })
      return
    }
    
    // 检查是否需要超级管理员权限
    if (to.meta.requiresSuperAdmin && !isSuperAdmin()) {
      ElMessage.error('需要超级管理员权限')
      next({ path: '/' })
      return
    }
    
    // 检查是否需要特定店铺的权限
    if (to.meta.requiresShopAdmin) {
      const shopId = to.params.shopId
      if (!canManageShop(shopId)) {
        ElMessage.error('没有权限管理该店铺')
        next({ path: '/' })
        return
      }
    }
  }
  
  next()
} 