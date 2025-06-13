<template>
  <div class="admin-dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>店铺总数</span>
            </div>
          </template>
          <div class="card-content">
            <h2>{{ statistics.totalShops }}</h2>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>用户总数</span>
            </div>
          </template>
          <div class="card-content">
            <h2>{{ statistics.totalUsers }}</h2>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>订单总数</span>
            </div>
          </template>
          <div class="card-content">
            <h2>{{ statistics.totalOrders }}</h2>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>总销售额</span>
            </div>
          </template>
          <div class="card-content">
            <h2>¥{{ statistics.totalSales?.toFixed(2) }}</h2>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>店铺分布</span>
            </div>
          </template>
          <div class="chart-container">
            <!-- TODO: 添加店铺分布图表 -->
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>销售趋势</span>
            </div>
          </template>
          <div class="chart-container">
            <!-- TODO: 添加销售趋势图表 -->
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="table-row">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>最新店铺</span>
            </div>
          </template>
          <el-table :data="latestShops" style="width: 100%">
            <el-table-column prop="id" label="店铺ID" width="120" />
            <el-table-column prop="name" label="店铺名称" />
            <el-table-column prop="location" label="所在地" width="150" />
            <el-table-column prop="createTime" label="创建时间" width="180" />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="scope">
                <el-button 
                  size="small"
                  @click="viewShopDetail(scope.row)"
                >查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()

// 统计数据
const statistics = ref({
  totalShops: 0,
  totalUsers: 0,
  totalOrders: 0,
  totalSales: 0
})

// 最新店铺数据
const latestShops = ref([])

// 获取仪表盘数据
const getDashboardData = async () => {
  try {
    // TODO: 调用API获取数据
    // const res = await api.getAdminDashboard()
    // statistics.value = res.data.statistics
    // latestShops.value = res.data.latestShops

    // 模拟数据
    statistics.value = {
      totalShops: 128,
      totalUsers: 5689,
      totalOrders: 12456,
      totalSales: 458963.50
    }

    latestShops.value = [
      {
        id: 'SHOP001',
        name: '优选服饰旗舰店',
        location: '广东省深圳市',
        createTime: '2024-03-01 10:25:36'
      },
      {
        id: 'SHOP002',
        name: '潮流配饰馆',
        location: '浙江省杭州市',
        createTime: '2024-03-01 09:15:22'
      }
    ]
  } catch (error) {
    console.error('获取仪表盘数据失败:', error)
    ElMessage.error('获取仪表盘数据失败，请稍后重试')
    statistics.value = { totalShops: 0, totalUsers: 0, totalOrders: 0, totalSales: 0 }
    latestShops.value = []
  }
}

// 查看店铺详情
const viewShopDetail = (shop) => {
  router.push(`/admin/shops/${shop.id}`)
}

onMounted(() => {
  getDashboardData()
})
</script>

<style scoped>
.admin-dashboard {
  padding: 20px;
}

.chart-row {
  margin-top: 20px;
}

.table-row {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-content {
  text-align: center;
  
  h2 {
    margin: 10px 0;
    font-size: 24px;
    color: #409EFF;
  }
}

.chart-container {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
}
</style> 