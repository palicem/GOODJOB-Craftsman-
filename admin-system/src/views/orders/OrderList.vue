<template>
  <div class="order-list">
    <div class="header">
      <h2>订单管理</h2>
      
      <!-- 搜索和筛选 -->
      <div class="search-bar">
        <el-input
          v-model="searchForm.keyword"
          placeholder="输入订单号或用户ID搜索"
          style="width: 250px; margin-right: 10px"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="searchForm.status"
          placeholder="订单状态"
          style="width: 150px; margin-right: 10px"
          clearable
        >
          <el-option label="待付款" value="to_pay" />
          <el-option label="待发货" value="to_ship" />
          <el-option label="待收货" value="to_receive" />
          <el-option label="已完成" value="completed" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        <el-date-picker
          v-model="searchForm.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 350px; margin-right: 10px"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>
    </div>

    <!-- 订单列表 -->
    <el-table
      :data="orderList"
      style="width: 100%"
      v-loading="loading"
    >
      <el-table-column prop="order_no" label="订单编号" width="180" />
      <el-table-column prop="user_id" label="用户ID" width="100" />
      <el-table-column label="订单金额" width="200">
        <template #default="scope">
          <div>总金额：¥{{ scope.row.total_amount?.toFixed(2) }}</div>
          <div class="fee-info">
            <span>手工费：¥{{ scope.row.handling_fee?.toFixed(2) }}</span>
            <span>运费：¥{{ scope.row.shipping_fee?.toFixed(2) }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="商品信息" min-width="300">
        <template #default="scope">
          <div v-for="item in scope.row.items" :key="item.id" class="order-item">
            <div class="product-info">
              <div class="product-name">商品ID: {{ item.product_id }}</div>
              <div class="product-spec" v-if="item.spec">规格: {{ item.spec }}</div>
              <div class="product-price">
                单价: ¥{{ item.price }} × {{ item.count }}
              </div>
              <div v-if="item.customization_data" class="customization-info">
                定制信息: {{ item.customization_data }}
              </div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="收货信息" min-width="200">
        <template #default="scope">
          <div v-if="scope.row.address_snapshot" class="address-info">
            {{ scope.row.address_snapshot }}
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="订单状态" width="100">
        <template #default="scope">
          <el-tag :type="getOrderStatusType(scope.row.status)">
            {{ getOrderStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="时间信息" width="180">
        <template #default="scope">
          <div>创建：{{ scope.row.create_time }}</div>
          <div v-if="scope.row.pay_time">支付：{{ scope.row.pay_time }}</div>
          <div v-if="scope.row.ship_time">发货：{{ scope.row.ship_time }}</div>
          <div v-if="scope.row.complete_time">完成：{{ scope.row.complete_time }}</div>
          <div v-if="scope.row.cancel_time">取消：{{ scope.row.cancel_time }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" width="150" show-overflow-tooltip />
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="scope">
          <el-button 
            size="small" 
            @click="handleDetail(scope.row)"
          >详情</el-button>
          <el-button
            v-if="scope.row.status === 'to_ship'"
            size="small"
            type="primary"
            @click="handleShip(scope.row)"
          >发货</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 发货对话框 -->
    <el-dialog
      v-model="shipDialogVisible"
      title="订单发货"
      width="500px"
    >
      <el-form
        ref="shipFormRef"
        :model="shipForm"
        :rules="shipRules"
        label-width="100px"
      >
        <el-form-item label="物流公司" prop="company">
          <el-select v-model="shipForm.company" placeholder="请选择物流公司">
            <el-option label="顺丰速运" value="SF" />
            <el-option label="中通快递" value="ZTO" />
            <el-option label="圆通速递" value="YTO" />
            <el-option label="韵达快递" value="YD" />
            <el-option label="申通快递" value="STO" />
          </el-select>
        </el-form-item>
        <el-form-item label="物流单号" prop="trackingNo">
          <el-input v-model="shipForm.trackingNo" placeholder="请输入物流单号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="shipDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitShip">确认发货</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

// 搜索表单
const searchForm = reactive({
  keyword: '',
  status: '',
  dateRange: []
})

// 列表数据
const loading = ref(false)
const orderList = ref([
  {
    order_no: 'DD20240301001',
    user_id: 10001,
    total_amount: 198.00,
    handling_fee: 20.00,
    shipping_fee: 10.00,
    status: 'to_pay',
    items: [
      {
        product_id: 'PROD001',
        count: 2,
        price: 99.00,
        spec: '{"颜色":"白色","尺码":"XL"}',
        customization_data: '{"text":"自定义文字","font":"宋体"}'
      }
    ],
    address_snapshot: '{"name":"张三","phone":"13800138000","address":"广东省深圳市南山区科技园"}',
    remark: '请尽快发货',
    create_time: '2024-03-01 10:25:36'
  }
])

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(100)

// 发货对话框
const shipDialogVisible = ref(false)
const currentOrder = ref(null)
const shipForm = reactive({
  company: '',
  trackingNo: ''
})
const shipRules = {
  company: [
    { required: true, message: '请选择物流公司', trigger: 'change' }
  ],
  trackingNo: [
    { required: true, message: '请输入物流单号', trigger: 'blur' }
  ]
}
const shipFormRef = ref(null)

// 获取订单状态类型
const getOrderStatusType = (status) => {
  const statusMap = {
    to_pay: 'warning',
    to_ship: 'primary',
    to_receive: 'info',
    completed: 'success',
    cancelled: 'info'
  }
  return statusMap[status] || 'info'
}

// 获取订单状态文本
const getOrderStatusText = (status) => {
  const statusMap = {
    to_pay: '待付款',
    to_ship: '待发货',
    to_receive: '待收货',
    completed: '已完成',
    cancelled: '已取消'
  }
  return statusMap[status] || '未知状态'
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  getOrderList()
}

// 重置搜索
const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.dateRange = []
  handleSearch()
}

// 获取订单列表
const getOrderList = async () => {
  loading.value = true
  try {
    // TODO: 调用API获取订单列表
    // const res = await api.getOrderList({
    //   page: currentPage.value,
    //   pageSize: pageSize.value,
    //   ...searchForm
    // })
    // orderList.value = res.data.list
    // total.value = res.data.total
  } catch (error) {
    console.error('获取订单列表失败:', error)
    ElMessage.error('获取订单列表失败')
  } finally {
    loading.value = false
  }
}

// 查看详情
const handleDetail = (order) => {
  // TODO: 跳转到订单详情页
  console.log('查看订单详情:', order)
}

// 发货处理
const handleShip = (order) => {
  currentOrder.value = order
  shipForm.company = ''
  shipForm.trackingNo = ''
  shipDialogVisible.value = true
}

// 提交发货
const submitShip = async () => {
  if (!shipFormRef.value) return
  
  await shipFormRef.value.validate(async (valid, fields) => {
    if (valid) {
      try {
        // TODO: 调用发货API
        // await api.shipOrder({
        //   orderNo: currentOrder.value.order_no,
        //   ...shipForm
        // })
        ElMessage.success('发货成功')
        shipDialogVisible.value = false
        getOrderList()
      } catch (error) {
        console.error('发货失败:', error)
        ElMessage.error('发货失败')
      }
    }
  })
}

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val
  getOrderList()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  getOrderList()
}

// 初始化
getOrderList()
</script>

<style scoped>
.order-list {
  padding: 20px;
}

.header {
  margin-bottom: 20px;

  h2 {
    margin-bottom: 20px;
  }
}

.search-bar {
  display: flex;
  align-items: center;
}

.order-item {
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
}

.product-info {
  .product-name {
    font-size: 14px;
    margin-bottom: 5px;
  }

  .product-spec {
    font-size: 12px;
    color: #909399;
    margin-bottom: 5px;
  }

  .product-price {
    font-size: 12px;
    color: #606266;
    margin-bottom: 5px;
  }

  .customization-info {
    font-size: 12px;
    color: #409EFF;
  }
}

.fee-info {
  font-size: 12px;
  color: #909399;
  
  span {
    margin-right: 10px;
  }
}

.address-info {
  font-size: 12px;
  color: #606266;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 