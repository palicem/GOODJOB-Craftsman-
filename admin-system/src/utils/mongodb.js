import mongoose from 'mongoose'

// MongoDB连接配置（Docker容器配置）
const config = {
  host: '127.0.0.1',  // 本地访问 Docker 容器
  port: 27017,        // Docker容器映射的端口
  username: 'admin',
  password: '123456',
  database: 'shop_db'
}

// 构建连接URL
const url = `mongodb://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}?authSource=admin`

// 连接选项
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true
}

let connection = null

// 连接数据库
export async function connectDB() {
  try {
    if (!connection) {
      connection = await mongoose.createConnection(url, options)
    }
    console.log('MongoDB连接成功!')
    return connection
  } catch (error) {
    console.error('MongoDB连接失败:', error.message)
    throw error
  }
}

// 关闭数据库连接
export async function closeDB() {
  try {
    if (connection) {
      await connection.close()
      connection = null
      console.log('MongoDB连接已关闭')
    }
  } catch (error) {
    console.error('关闭MongoDB连接失败:', error.message)
    throw error
  }
}

// 测试连接
export async function testConnection() {
  try {
    const conn = await connectDB()
    // 尝试列出所有集合
    const collections = await conn.db.listCollections().toArray()
    console.log('可用的集合:', collections.map(c => c.name))
    await closeDB()
    return true
  } catch (error) {
    console.error('测试连接失败:', error.message)
    return false
  }
} 