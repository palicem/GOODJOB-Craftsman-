<template>
  <div class="merchant-dashboard">
    <div class="header">
      <h2>商家后台</h2>
    </div>

    <!-- 数据概览 -->
    <el-row :gutter="20" class="data-overview">
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>今日订单</span>
              <el-tag size="small" type="success">实时</el-tag>
            </div>
          </template>
          <div class="card-content">
            <div class="number">{{ todayOrders }}</div>
            <div class="trend">
              较昨日
              <span :class="orderTrend >= 0 ? 'up' : 'down'">
                {{ Math.abs(orderTrend) }}%
                <el-icon>
                  <component :is="orderTrend >= 0 ? 'ArrowUp' : 'ArrowDown'" />
                </el-icon>
              </span>
            </div>
          </div>
        </el-card>
      </el-col>
      <!-- 其他数据卡片 -->
    </el-row>

    <el-row :gutter="20">
      <!-- 数据概览卡片 -->
      <el-col :span="6">
        <el-card shadow="hover" class="data-card">
          <template #header>
            <div class="card-header">
              <span>商品总数</span>
            </div>
          </template>
          <div class="card-content">
            <h2>{{ statistics.totalProducts || 0 }}</h2>
            <div class="trend">
              <span>较昨日</span>
              <span :class="{'up': statistics.productIncrease > 0}">
                {{ statistics.productIncrease > 0 ? '+' : '' }}{{ statistics.productIncrease || 0 }}
              </span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover" class="data-card">
          <template #header>
            <div class="card-header">
              <span>订单总数</span>
            </div>
          </template>
          <div class="card-content">
            <h2>{{ statistics.totalOrders || 0 }}</h2>
            <div class="trend">
              <span>较昨日</span>
              <span :class="{'up': statistics.orderIncrease > 0}">
                {{ statistics.orderIncrease > 0 ? '+' : '' }}{{ statistics.orderIncrease || 0 }}
              </span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover" class="data-card">
          <template #header>
            <div class="card-header">
              <span>总销售额</span>
            </div>
          </template>
          <div class="card-content">
            <h2>¥{{ statistics.totalSales?.toFixed(2) || '0.00' }}</h2>
            <div class="trend">
              <span>较昨日</span>
              <span :class="{'up': statistics.salesIncrease > 0}">
                {{ statistics.salesIncrease > 0 ? '+' : '' }}{{ statistics.salesIncrease?.toFixed(2) || '0.00' }}
              </span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover" class="data-card">
          <template #header>
            <div class="card-header">
              <span>定制订单数</span>
            </div>
          </template>
          <div class="card-content">
            <h2>{{ statistics.customOrders || 0 }}</h2>
            <div class="trend">
              <span>较昨日</span>
              <span :class="{'up': statistics.customOrderIncrease > 0}">
                {{ statistics.customOrderIncrease > 0 ? '+' : '' }}{{ statistics.customOrderIncrease || 0 }}
              </span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>销售趋势</span>
            </div>
          </template>
          <div class="chart-container">
            <!-- TODO: 添加销售趋势图表 -->
            <div class="chart-placeholder">销售趋势图表</div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>商品分类占比</span>
            </div>
          </template>
          <div class="chart-container">
            <!-- TODO: 添加商品分类占比图表 -->
            <div class="chart-placeholder">商品分类占比图表</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最新订单 -->
    <el-card shadow="hover" class="latest-orders">
      <template #header>
        <div class="card-header">
          <span>最新订单</span>
          <el-button type="text" @click="viewAllOrders">查看全部</el-button>
        </div>
      </template>
      <el-table :data="latestOrders" style="width: 100%">
        <el-table-column prop="orderNo" label="订单编号" width="180" />
        <el-table-column prop="customerName" label="客户名称" width="120" />
        <el-table-column prop="amount" label="订单金额" width="120">
          <template #default="scope">
            ¥{{ scope.row.amount?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="订单状态" width="120">
          <template #default="scope">
            <el-tag :type="getOrderStatusType(scope.row.status)">
              {{ getOrderStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import shopService from '@/services/shopService' // 修改导入路径

const router = useRouter()

// 统计数据
const statistics = ref({
  totalProducts: 156,
  productIncrease: 12,
  totalOrders: 89,
  orderIncrease: 8,
  totalSales: 15689.50,
  salesIncrease: 1256.80,
  customOrders: 25,
  customOrderIncrease: 3
})

// 最新订单数据
const latestOrders = ref([]) // 初始化为空数组
const currentShopId = ref('shop001') // 示例店铺ID，实际应从状态管理或路由获取

// 获取订单状态类型
const getOrderStatusType = (status) => {
  const statusMap = {
    pending: 'warning',
    processing: 'primary',
    completed: 'success',
    cancelled: 'info'
  }
  return statusMap[status] || 'info'
}

// 获取订单状态文本
const getOrderStatusText = (status) => {
  const statusMap = {
    pending: '待付款',
    processing: '处理中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return statusMap[status] || '未知状态'
}

// 查看所有订单
const viewAllOrders = () => {
  router.push('/orders')
}

// 获取仪表盘数据
const getDashboardData = async () => {
  try {
    // 假设 fetchRecentOrders 是 getDashboardData 的一部分或被其调用
    await fetchRecentOrders(); 
    // ... 其他数据获取 ...
  } catch (error) {
    console.error('获取仪表盘数据失败:', error)
  }
}

// 假设的 fetchRecentOrders 函数，或类似逻辑存在的地方
const fetchRecentOrders = async () => {
  if (!currentShopId.value) {
    ElMessage.error('店铺ID未设定，无法获取订单');
    latestOrders.value = [];
    return;
  }
  try {
    // 此处假设 shopService.getOrderList 返回的是我们后端API的标准结封装对象
    const response = await shopService.getOrderList(currentShopId.value, { // 修改方法名
      _sort: 'create_time',
      _order: 'desc',
      limit: 5 // 获取最新的5条作为示例
    });
    console.log('[Dashboard] API response for recent orders:', response);

    if (response && response.success && Array.isArray(response.data)) {
      latestOrders.value = response.data.map(order => ({
        orderNo: order.order_no || order.id, // 兼容 order_no 或 id
        // customerName: order.user_id, // TODO: 需要根据 user_id 获取用户名或昵称
        // 暂时使用 user_id，或者如果订单快照中有用户信息则使用
        customerName: order.address_snapshot?.name || order.user_id || '未知客户',
        amount: order.total_amount,
        status: order.status,
        createTime: order.create_time ? new Date(order.create_time).toLocaleString() : '-',
        // 确保其他 ElTable 使用的 prop 在此映射
      }));
      console.log('[Dashboard] Processed latestOrders:', latestOrders.value);
    } else {
      latestOrders.value = [];
      ElMessage.error(response?.message || '获取最新订单失败');
      console.error('[Dashboard] Failed to fetch recent orders or data format is incorrect. Response:', response);
    }
  } catch (error) {
    console.error('获取最新订单时发生错误:', error);
    latestOrders.value = [];
    ElMessage.error('获取最新订单网络错误或请求失败');
  }
};

// 数据概览
const todayOrders = ref(128)
const orderTrend = ref(15.8)

onMounted(() => {
  // getDashboardData(); // 如果整体数据获取在这里
  fetchRecentOrders(); // 或者直接调用
})
</script>

<style scoped>
.merchant-dashboard {
  padding: 20px;
}

.header {
  margin-bottom: 30px;

  h2 {
    margin: 0;
  }
}

.data-overview {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-content {
  .number {
    font-size: 24px;
    font-weight: 500;
    margin-bottom: 8px;
  }

  .trend {
    font-size: 14px;
    color: #666;

    .up {
      color: #67c23a;
    }

    .down {
      color: #f56c6c;
    }
  }
}

.dashboard {
  padding: 20px;
}

.data-card {
  .card-content {
    text-align: center;
    
    h2 {
      margin: 10px 0;
      font-size: 24px;
    }

    .trend {
      color: #909399;
      font-size: 14px;

      span.up {
        color: #67C23A;
      }
    }
  }
}

.chart-row {
  margin-top: 20px;
}

.chart-container {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  color: #909399;
  font-size: 14px;
}

.latest-orders {
  margin-top: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.card-header {
  font-weight: bold;
}
</style> 