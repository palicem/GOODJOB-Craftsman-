<template>
  <div class="test-container">
    <h2>数据库连接测试</h2>
    <div class="test-controls">
      <el-button type="primary" @click="runTests" :loading="testing">
        开始测试
      </el-button>
    </div>
    <div class="test-results" v-if="results.length > 0">
      <h3>测试结果：</h3>
      <div 
        v-for="(result, index) in results" 
        :key="index"
        :class="['result-item', result.type]"
      >
        {{ result.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { connectUserDB, connectShopDB, closeAllConnections } from '../utils/db'
import ProductModel from '../models/product'

const testing = ref(false)
const results = ref([])

const addResult = (message, type = 'info') => {
  results.value.push({ message, type })
}

const testUserDB = async () => {
  try {
    addResult('测试用户数据库连接...')
    await connectUserDB()
    addResult('用户数据库连接成功!', 'success')
    return true
  } catch (error) {
    addResult(`用户数据库连接失败: ${error.message}`, 'error')
    return false
  }
}

const testShopDB = async (shopId) => {
  try {
    addResult(`测试店铺数据库连接 (shop_${shopId})...`)
    await connectShopDB(shopId)
    addResult('店铺数据库连接成功!', 'success')
    
    addResult('测试商品模型...')
    
    const testProduct = new ProductModel({
      id: 'TEST_' + Date.now(),
      shop_id: shopId,
      category_id: 1,
      name: '测试商品',
      price: 99.99,
      description: '这是一个测试商品'
    })
    
    addResult('保存测试商品...')
    await testProduct.save()
    addResult('测试商品保存成功!', 'success')
    
    addResult('查询测试商品...')
    const savedProduct = await ProductModel.findOne({ id: testProduct.id })
    addResult(`查询成功: ${savedProduct.name}`, 'success')
    
    addResult('删除测试商品...')
    await ProductModel.deleteOne({ id: testProduct.id })
    addResult('测试商品删除成功!', 'success')
    
    return true
  } catch (error) {
    addResult(`店铺数据库测试失败: ${error.message}`, 'error')
    return false
  }
}

const runTests = async () => {
  results.value = []
  testing.value = true
  
  try {
    addResult('开始数据库连接测试...')
    
    // 测试用户数据库
    const userDBResult = await testUserDB()
    addResult(`用户数据库测试${userDBResult ? '通过' : '失败'}`, userDBResult ? 'success' : 'error')
    
    // 测试店铺数据库
    const testShopId = 'test_shop_001'
    const shopDBResult = await testShopDB(testShopId)
    addResult(`店铺数据库测试${shopDBResult ? '通过' : '失败'}`, shopDBResult ? 'success' : 'error')
    
    // 关闭所有连接
    addResult('关闭所有数据库连接...')
    await closeAllConnections()
    addResult('数据库连接已关闭', 'success')
    
  } catch (error) {
    addResult(`测试过程出错: ${error.message}`, 'error')
  } finally {
    testing.value = false
  }
}
</script>

<style scoped>
.test-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.test-controls {
  margin: 20px 0;
}

.test-results {
  margin-top: 20px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 4px;
}

.result-item {
  padding: 8px;
  margin: 4px 0;
  border-radius: 4px;
}

.result-item.success {
  background: #f0f9eb;
  color: #67c23a;
}

.result-item.error {
  background: #fef0f0;
  color: #f56c6c;
}

.result-item.info {
  background: #f4f4f5;
  color: #909399;
}
</style> 