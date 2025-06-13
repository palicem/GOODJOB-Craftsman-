<template>
  <div class="merchant-dashboard">
    <div class="header">
      <h2>控制台</h2>
      <div class="shop-selector">
        <el-dropdown @command="handleShopCommand" trigger="click">
          <el-button type="primary">
            {{ currentShop ? currentShop.name : '选择店铺' }}
            <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="shop in shopList" :key="shop.id" :command="{ type: 'switchShop', id: shop.id }">
                <el-icon><Shop /></el-icon>
                {{ shop.name }}
                <el-tag v-if="shop.status === 'pending'" size="small" type="warning">审核中</el-tag>
              </el-dropdown-item>
              <el-dropdown-item divided command="applyShop">
                <el-icon><Plus /></el-icon>
                申请新店铺
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
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

      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>今日销售额</span>
              <el-tag size="small" type="success">实时</el-tag>
            </div>
          </template>
          <div class="card-content">
            <div class="number">¥{{ todaySales.toFixed(2) }}</div>
            <div class="trend">
              较昨日
              <span :class="salesTrend >= 0 ? 'up' : 'down'">
                {{ Math.abs(salesTrend) }}%
                <el-icon>
                  <component :is="salesTrend >= 0 ? 'ArrowUp' : 'ArrowDown'" />
                </el-icon>
              </span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>商品总数</span>
            </div>
          </template>
          <div class="card-content">
            <div class="number">{{ totalProducts }}</div>
            <div class="sub-info">
              在售: {{ onSaleProducts }} | 仓库: {{ stockProducts }}
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>待处理事项</span>
            </div>
          </template>
          <div class="card-content todo-list">
            <div class="todo-item">
              <span>待发货订单</span>
              <el-tag type="warning">{{ pendingShipments }}</el-tag>
            </div>
            <div class="todo-item">
              <span>退款申请</span>
              <el-tag type="danger">{{ refundRequests }}</el-tag>
            </div>
            <div class="todo-item">
              <span>商品预警</span>
              <el-tag type="info">{{ stockWarnings }}</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-area">
      <el-col :span="16">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>销售趋势</span>
              <el-radio-group v-model="salesChartType" size="small">
                <el-radio-button label="week">本周</el-radio-button>
                <el-radio-button label="month">本月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container">
            <!-- TODO: 集成 ECharts -->
            <div class="placeholder-chart">销售趋势图表</div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>商品销售排行</span>
            </div>
          </template>
          <div class="ranking-list">
            <div
              v-for="(item, index) in topProducts"
              :key="item.id"
              class="ranking-item"
            >
              <div class="rank-number" :class="{ top3: index < 3 }">{{ index + 1 }}</div>
              <div class="product-info">
                <div class="product-name">{{ item.name }}</div>
                <div class="product-sales">销量 {{ item.sales }} | ¥{{ item.amount }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最新订单 -->
    <el-card shadow="hover" class="latest-orders">
      <template #header>
        <div class="card-header">
          <span>最新订单</span>
          <el-button type="primary" link @click="$router.push('/merchant/orders')">
            查看全部
          </el-button>
        </div>
      </template>
      <el-table :data="latestOrders" style="width: 100%">
        <el-table-column prop="order_no" label="订单号" width="180" />
        <el-table-column prop="customer" label="买家" width="120" />
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="{ row }">
            ¥{{ row.amount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getOrderStatusType(row.status)">
              {{ getOrderStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="下单时间" width="180" />
        <el-table-column label="操作" fixed="right" width="120">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleOrder(row)">
              处理
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowUp, ArrowDown, Plus, Shop } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 店铺列表数据
const shopList = ref([
  {
    id: 'SHOP001',
    name: '优选服饰旗舰店',
    logo: '',
    description: '专注高品质服装定制',
    location: '广东省深圳市',
    status: 'approved'
  }
])

// 当前选中的店铺
const currentShop = ref(shopList.value[0])

// 处理店铺切换
const handleShopCommand = (command) => {
  if (typeof command === 'object') {
    switch (command.type) {
      case 'switchShop':
        const targetShop = shopList.value.find(shop => shop.id === command.id)
        if (targetShop) {
          if (targetShop.status === 'approved') {
            currentShop.value = targetShop
            ElMessage.success(`已切换到店铺：${targetShop.name}`)
          } else {
            ElMessage.warning('该店铺正在审核中，暂时无法切换')
          }
        }
        break
    }
  } else {
    switch (command) {
      case 'applyShop':
        router.push('/merchant/shops/apply')
        break
    }
  }
}

// 数据概览
const todayOrders = ref(128)
const orderTrend = ref(15.8)
const todaySales = ref(12580.50)
const salesTrend = ref(-5.2)
const totalProducts = ref(856)
const onSaleProducts = ref(752)
const stockProducts = ref(104)
const pendingShipments = ref(25)
const refundRequests = ref(3)
const stockWarnings = ref(12)

// 销售图表
const salesChartType = ref('week')

// 商品销售排行
const topProducts = ref([
  { id: 1, name: '时尚连衣裙', sales: 289, amount: 28900 },
  { id: 2, name: '休闲运动鞋', sales: 256, amount: 25600 },
  { id: 3, name: '百搭T恤', sales: 198, amount: 5940 },
  { id: 4, name: '牛仔裤', sales: 165, amount: 13200 },
  { id: 5, name: '帆布包', sales: 142, amount: 7100 }
])

// 最新订单
const latestOrders = ref([
  {
    order_no: 'DD20240301001',
    customer: '张三',
    amount: 299,
    status: 'pending',
    created_at: '2024-03-01 10:25:36'
  },
  {
    order_no: 'DD20240301002',
    customer: '李四',
    amount: 599,
    status: 'processing',
    created_at: '2024-03-01 10:15:22'
  }
])

// 获取订单状态类型
const getOrderStatusType = (status) => {
  const types = {
    pending: 'warning',
    processing: 'primary',
    shipped: 'success',
    completed: 'success',
    cancelled: 'info',
    refunding: 'danger'
  }
  return types[status] || 'info'
}

// 获取订单状态文本
const getOrderStatusText = (status) => {
  const texts = {
    pending: '待处理',
    processing: '处理中',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消',
    refunding: '退款中'
  }
  return texts[status] || status
}

// 处理订单
const handleOrder = (order) => {
  router.push(`/merchant/orders/${order.order_no}`)
}
</script>

<style scoped>
.merchant-dashboard {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h2 {
    margin: 0;
  }

  .shop-selector {
    .el-dropdown {
      margin-left: 16px;
    }
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

  .sub-info {
    font-size: 14px;
    color: #666;
  }
}

.todo-list {
  .todo-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.charts-area {
  margin-bottom: 20px;

  .chart-container {
    height: 300px;
  }

  .placeholder-chart {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f7fa;
    color: #909399;
  }
}

.ranking-list {
  .ranking-item {
    display: flex;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #ebeef5;

    &:last-child {
      border-bottom: none;
    }
  }

  .rank-number {
    width: 24px;
    height: 24px;
    line-height: 24px;
    text-align: center;
    background: #f5f7fa;
    border-radius: 4px;
    margin-right: 12px;
    font-size: 14px;
    color: #606266;

    &.top3 {
      background: #ffd700;
      color: #fff;
    }
  }

  .product-info {
    flex: 1;

    .product-name {
      font-size: 14px;
      margin-bottom: 4px;
    }

    .product-sales {
      font-size: 12px;
      color: #909399;
    }
  }
}

.latest-orders {
  margin-bottom: 20px;
}
</style> 