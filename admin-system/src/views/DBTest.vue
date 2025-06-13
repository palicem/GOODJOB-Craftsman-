<template>
  <div class="db-test">
    <h2>数据库连接测试</h2>
    <el-button type="primary" @click="testDB" :loading="testing">
      测试连接
    </el-button>
    
    <div v-if="result" class="result" :class="{ success: isSuccess, error: !isSuccess }">
      {{ result }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { testConnection } from '@/utils/mongodb'

const testing = ref(false)
const result = ref('')
const isSuccess = ref(false)

const testDB = async () => {
  testing.value = true
  result.value = ''
  
  try {
    const success = await testConnection()
    isSuccess.value = success
    result.value = success ? '数据库连接成功！' : '数据库连接失败！'
  } catch (error) {
    isSuccess.value = false
    result.value = `连接错误: ${error.message}`
  } finally {
    testing.value = false
  }
}
</script>

<style scoped>
.db-test {
  padding: 20px;
}

.result {
  margin-top: 20px;
  padding: 10px;
  border-radius: 4px;
}

.success {
  background-color: #f0f9eb;
  color: #67c23a;
}

.error {
  background-color: #fef0f0;
  color: #f56c6c;
}
</style>