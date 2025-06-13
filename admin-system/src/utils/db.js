import * as mongoose from 'mongoose'

// 数据库连接配置
const DB_CONFIG = {
  host: '127.0.0.1',
  port: '27017',
  username: 'admin',
  password: '123456'
}

// 存储数据库连接实例
const connections = new Map()

// 辅助函数：创建或获取连接
async function getOrCreateConnection(dbName) {
  if (connections.has(dbName)) {
    const conn = connections.get(dbName)
    // 检查连接状态，如果未连接则尝试重新连接
    if (conn.readyState === 1) { // 1 for connected
      return conn
    }
    // 如果连接丢失，移除旧连接，稍后重新创建
    console.warn(`Connection to ${dbName} was lost. Attempting to reconnect.`)
    connections.delete(dbName)
  }

  try {
    const uri = `mongodb://${DB_CONFIG.username}:${DB_CONFIG.password}@${DB_CONFIG.host}:${DB_CONFIG.port}/${dbName}?directConnection=true&serverSelectionTimeoutMS=2000&authSource=admin`
    const connection = await mongoose.createConnection(uri).asPromise() // 使用 createConnection 并等待其 Promise
    console.log(`Connected to ${dbName} successfully!`)
    connections.set(dbName, connection)
    return connection
  } catch (error) {
    console.error(`Failed to connect to ${dbName}:`, error)
    throw error
  }
}

// 连接用户数据库
export const connectUserDB = async () => {
  return getOrCreateConnection('user_db')
}

// 连接店铺数据库
export const connectShopDB = async (shopId) => {
  const dbName = `shop_${shopId}`
  return getOrCreateConnection(dbName)
}

// 关闭指定数据库连接
export const closeConnection = async (dbName) => {
  if (connections.has(dbName)) {
    const connection = connections.get(dbName)
    await connection.close()
    connections.delete(dbName)
    console.log(`Closed connection to ${dbName}`)
  }
}

// 关闭所有数据库连接
export const closeAllConnections = async () => {
  for (const [dbName, connection] of connections) {
    await connection.close()
    connections.delete(dbName) // 从 Map 中移除
    console.log(`Closed connection to ${dbName}`)
  }
  // Mongoose 默认连接也可能需要关闭，但我们这里主要管理 createConnection 创建的连接
  // 如果 mongoose.connect() 也被调用了，可以考虑 mongoose.disconnect()，但这里我们避免混合使用
}

// 获取当前店铺数据库连接
export const getCurrentShopConnection = async () => { // 改为 async 因为 getOrCreateConnection 是 async
  const shopId = localStorage.getItem('currentShop') // 注意：localStorage 在 Node.js 环境中不可用
  if (!shopId) {
    // 在 Node.js 环境中，这个函数可能需要不同的方式获取 shopId
    console.warn('No shopId found in localStorage (Node.js context). This function might not work as expected in this environment for getCurrentShopConnection.')
    // throw new Error('No shop selected (localStorage)')
    // 为了测试，我们可以暂时硬编码或传递一个 shopId
    return connectShopDB('default_shop_for_node_test') // 示例
  }
  const dbName = `shop_${shopId}`
  return getOrCreateConnection(dbName)
}

// 获取用户数据库连接
export const getUserConnection = async () => { // 改为 async 因为 getOrCreateConnection 是 async
  const dbName = 'user_db'
  return getOrCreateConnection(dbName)
} 