<template>
  <div class="admin-home">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover" class="data-card">
          <template #header>
            <div class="card-header">
              <span>总店铺数</span>
            </div>
          </template>
          <div class="card-value">
            <span class="number">128</span>
            <span class="unit">家</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="data-card">
          <template #header>
            <div class="card-header">
              <span>总用户数</span>
            </div>
          </template>
          <div class="card-value">
            <span class="number">3,521</span>
            <span class="unit">人</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="data-card">
          <template #header>
            <div class="card-header">
              <span>今日订单数</span>
            </div>
          </template>
          <div class="card-value">
            <span class="number">256</span>
            <span class="unit">单</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="data-card">
          <template #header>
            <div class="card-header">
              <span>今日销售额</span>
            </div>
          </template>
          <div class="card-value">
            <span class="number">25,630</span>
            <span class="unit">元</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>店铺增长趋势</span>
            </div>
          </template>
          <div class="chart-placeholder">
            图表区域（店铺增长趋势）
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>销售额趋势</span>
            </div>
          </template>
          <div class="chart-placeholder">
            图表区域（销售额趋势）
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
// 这里可以添加数据获取和处理逻辑
</script>

<style scoped>
.admin-home {
  padding: 20px;
}

.data-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-value {
  text-align: center;
  padding: 10px 0;
}

.number {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
  margin-right: 5px;
}

.unit {
  font-size: 14px;
  color: #909399;
}

.charts-row {
  margin-top: 20px;
}

.chart-placeholder {
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #909399;
  background-color: #f5f7fa;
  border-radius: 4px;
}
</style> 