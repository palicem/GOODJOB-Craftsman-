import { connectUserDB, connectShopDB, closeAllConnections } from './db.js'
import { createProductModel } from '../models/product.js'

// 测试用户数据库连接
const testUserDB = async () => {
  try {
    console.log('测试用户数据库连接...')
    const connection = await connectUserDB()
    console.log('用户数据库连接成功!')
    return true
  } catch (error) {
    console.error('用户数据库连接失败:', error)
    return false
  }
}

// 测试店铺数据库连接
const testShopDB = async (shopId) => {
  let connection
  try {
    console.log(`测试店铺数据库连接 (shop_${shopId})...`)
    connection = await connectShopDB(shopId)
    console.log('店铺数据库连接成功!')
    
    // 测试商品模型
    console.log('测试商品模型...')
    const ProductModel = createProductModel(connection)
    
    // 创建测试商品
    const testProduct = new ProductModel({
      id: 'TEST_' + Date.now(),
      shop_id: shopId,
      category_id: 1,
      name: '测试商品',
      price: 99.99,
      description: '这是一个测试商品'
    })
    
    // 保存测试商品
    console.log('保存测试商品...')
    await testProduct.save()
    console.log('测试商品保存成功!')
    
    // 查询测试商品
    console.log('查询测试商品...')
    const savedProduct = await ProductModel.findOne({ id: testProduct.id })
    console.log('查询结果:', savedProduct)
    
    // 删除测试商品
    console.log('删除测试商品...')
    await ProductModel.deleteOne({ id: testProduct.id })
    console.log('测试商品删除成功!')
    
    return true
  } catch (error) {
    console.error('店铺数据库测试失败:', error)
    return false
  } finally {
    // 确保在测试完成后关闭连接
    if (connection) {
      // await connection.close() // mongoose.connect 返回的已经是连接实例，不需要再通过 connection.close()
      // mongoose.connection.close() 会关闭默认连接，这里应该关闭特定连接
      // db.js 中 closeConnection 和 closeAllConnections 负责关闭
    }
  }
}

// 运行所有测试
const runTests = async () => {
  console.group('数据库连接测试 (Node.js Script)')
  
  // 测试用户数据库
  const userDBResult = await testUserDB()
  console.log('用户数据库测试结果:', userDBResult ? '成功' : '失败')
  
  // 测试店铺数据库
  const testShopId = 'test_shop_001'
  const shopDBResult = await testShopDB(testShopId)
  console.log('店铺数据库测试结果:', shopDBResult ? '成功' : '失败')
  
  // 关闭所有连接
  console.log('关闭所有数据库连接...')
  await closeAllConnections()
  console.log('数据库连接已关闭')
  
  console.groupEnd()
}

// 执行测试
runTests() 