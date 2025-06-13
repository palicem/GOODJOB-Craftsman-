<template>
  <div class="dashboard-container">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header><div class="card-header"><span>总商品数</span></div></template>
          <div class="stat-card-content">
            <h2 v-if="!loadingStatistics">{{ statistics.totalProducts }}</h2>
            <el-icon v-else class="is-loading"><Loading /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header><div class="card-header"><span>总订单数</span></div></template>
          <div class="stat-card-content">
            <h2 v-if="!loadingStatistics">{{ statistics.totalOrders }}</h2>
            <el-icon v-else class="is-loading"><Loading /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header><div class="card-header"><span>待处理订单</span></div></template>
          <div class="stat-card-content">
            <h2 v-if="!loadingStatistics">{{ statistics.pendingOrders }}</h2>
            <el-icon v-else class="is-loading"><Loading /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header><div class="card-header"><span>总销售额</span></div></template>
          <div class="stat-card-content">
            <h2 v-if="!loadingStatistics">¥{{ statistics.totalSales.toFixed(2) }}</h2>
            <el-icon v-else class="is-loading"><Loading /></el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="data-row">
      <el-col :span="24">
        <el-card shadow="hover">
      <template #header>
        <div class="card-header">
              <span>最近订单 ({{ globalCurrentShopId ? '当前店铺: ' + getCurrentShopName() : '未选择店铺' }})</span>
        </div>
      </template>
          <div v-if="loadingStatistics" class="loading-placeholder">
            <el-icon class="is-loading"><Loading /></el-icon> 加载中...
          </div>
          <div v-else-if="!globalCurrentShopId" class="empty-placeholder">
            请先选择一个店铺
          </div>
          <div v-else-if="recentOrders.length === 0" class="empty-placeholder">
            当前店铺暂无订单
          </div>
          <el-table v-else :data="recentOrders" style="width: 100%">
            <el-table-column prop="order_no" label="订单编号" width="180"></el-table-column>
            <el-table-column label="用户ID" prop="user_id" width="150"></el-table-column>
            <el-table-column label="总金额" width="120">
          <template #default="scope">
                ¥{{ scope.row.total_amount.toFixed(2) }}
          </template>
        </el-table-column>
            <el-table-column label="状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
            <el-table-column prop="create_time" label="创建时间" width="180">
                <template #default="scope">
                    {{ formatDisplayTime(scope.row.create_time) }}
                </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="scope">
                <el-button size="small" @click="viewOrderDetail(scope.row)">详情</el-button>
              </template>
            </el-table-column>
      </el-table>
    </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="detailDialogVisible" title="订单详情" width="60%">
      <pre v-if="currentOrderDetailForDialog">{{ JSON.stringify(currentOrderDetailForDialog, null, 2) }}</pre>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { ElMessage, ElIcon } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
import * as shopService from '@/services/shopService';
import { globalCurrentShopId } from '@/store/shopStore.js'; 

const statistics = ref({
  totalProducts: 0,
  totalOrders: 0,
  pendingOrders: 0,
  totalSales: 0,
});
const loadingStatistics = ref(false);
const recentOrders = ref([]);

const detailDialogVisible = ref(false);
const currentOrderDetailForDialog = ref(null);

const viewOrderDetail = (order) => {
  currentOrderDetailForDialog.value = order;
  detailDialogVisible.value = true;
};

const getCurrentShopName = () => {
    const shopListStr = localStorage.getItem('shopList');
    if (shopListStr && globalCurrentShopId.value) {
        const shopList = JSON.parse(shopListStr);
        const current = shopList.find(s => s.id === globalCurrentShopId.value);
        return current ? current.name : globalCurrentShopId.value;
    }
    return globalCurrentShopId.value || '未知';
}

const formatDisplayTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    return new Date(timeStr).toLocaleString(); 
}

const fetchDashboardData = async (shopId) => {
  if (!shopId) {
    statistics.value = { totalProducts: 0, totalOrders: 0, pendingOrders: 0, totalSales: 0 };
    recentOrders.value = [];
    return;
  }
  loadingStatistics.value = true;
  try {
    const response = await shopService.getDashboardStats(shopId);
    if (response && response.success && response.data) {
      statistics.value.totalProducts = response.data.totalProducts || 0;
      statistics.value.totalOrders = response.data.totalOrders || 0;
      statistics.value.pendingOrders = response.data.pendingOrders || 0;
      statistics.value.totalSales = response.data.totalSales || 0;
      recentOrders.value = response.data.recentOrders || [];
    } else {
      ElMessage.error(response?.message || '加载仪表盘数据失败');
      statistics.value = { totalProducts: 0, totalOrders: 0, pendingOrders: 0, totalSales: 0 };
      recentOrders.value = [];
    }
  } catch (error) {
    ElMessage.error('加载仪表盘数据时出错');
    statistics.value = { totalProducts: 0, totalOrders: 0, pendingOrders: 0, totalSales: 0 };
    recentOrders.value = [];
  } finally {
    loadingStatistics.value = false;
  }
};

const getStatusType = (status) => {
  const types = { to_pay: 'warning', to_ship: 'primary', to_receive: 'info', completed: 'success', cancelled: 'default' };
  return types[status] || 'default';
};

const getStatusText = (status) => {
  const texts = { to_pay: '待付款', to_ship: '待发货', to_receive: '待收货', completed: '已完成', cancelled: '已取消' };
  return texts[status] || status;
};

watch(globalCurrentShopId, (newShopId) => {
  if (newShopId) {
    fetchDashboardData(newShopId);
  } else {
    statistics.value = { totalProducts: 0, totalOrders: 0, pendingOrders: 0, totalSales: 0 };
    recentOrders.value = [];
  }
}, { immediate: true }); 

onMounted(() => {
});

</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.stats-row .el-col,
.data-row .el-col {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-card-content h2 {
  font-size: 24px;
  margin: 10px 0;
  color: #303133;
}
.stat-card-content p {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.chart-placeholder,
.loading-placeholder,
.empty-placeholder {
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #909399;
  font-size: 14px;
}
.el-icon.is-loading {
  margin-right: 8px;
}
</style> 