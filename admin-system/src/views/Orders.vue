<template>
  <div class="orders-container">
    <div class="page-header">
      <h2>订单管理</h2>
      <el-select v-model="orderStatus" placeholder="订单状态" style="width: 150px">
        <el-option label="全部订单" value="" />
        <el-option label="待付款" value="to_pay" />
        <el-option label="待发货" value="to_ship" />
        <el-option label="待收货" value="to_receive" />
        <el-option label="已完成" value="completed" />
        <el-option label="已取消" value="cancelled" />
      </el-select>
      <div>
        <el-button type="primary" @click="handleAddTestOrders" style="margin-left: 10px;">添加测试订单</el-button>
      </div>
    </div>

    <el-table :data="orderList" style="width: 100%" v-loading="loading">
      <el-table-column prop="order_no" label="订单编号" width="180" />
      <el-table-column label="主要商品" width="220">
        <template #default="scope">
          <div style="display: flex; align-items: center;">
            <el-image 
              v-if="scope.row.goodsImage"
              :src="scope.row.goodsImage" 
              fit="cover" 
              style="width: 40px; height: 40px; margin-right: 10px; border-radius: 4px;"
              preview-teleported 
              :preview-src-list="[scope.row.goodsImage]"
            />
            <span style="flex-grow: 1;">{{ scope.row.goodsName }}</span>
          </div>
          <div v-if="scope.row.spec" style="font-size: 12px; color: #888; margin-top: 4px;">
            规格: {{ scope.row.spec }}
          </div>
          <div v-if="scope.row.orderItems && scope.row.orderItems.length > 1" style="font-size: 12px; color: #666; margin-top: 4px;">
            等 {{ scope.row.orderItems.length }} 件商品
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="total_amount" label="订单金额" width="100">
        <template #default="scope">
          ¥{{ scope.row.total_amount }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="订单状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="create_time" label="创建时间" width="160" />
      <el-table-column label="收货信息" min-width="200">
        <template #default="scope">
          <div v-if="scope.row.address_snapshot">
            <p>{{ scope.row.address_snapshot.name }} {{ scope.row.address_snapshot.phone }}</p>
            <p>
              {{ scope.row.address_snapshot.province }}{{ scope.row.address_snapshot.city }}{{ scope.row.address_snapshot.district }}{{ scope.row.address_snapshot.address }}
            </p>
          </div>
          <div v-else>
            <p>无收货地址信息</p>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="scope">
          <el-button 
            size="small" 
            @click="handleDetail(scope.row)">
            查看详情
          </el-button>
          <el-button 
            size="small"
            type="warning" 
            v-if="scope.row.status !== 'completed' && scope.row.status !== 'cancelled'"
            @click="handleCancelOrder(scope.row)"
            style="margin-left: 5px;">
            取消订单
          </el-button>
          <el-button 
            size="small"
            type="primary"
            v-if="scope.row.status === 'to_ship'"
            @click="handleShip(scope.row)"
            style="margin-left: 5px;">
            发货
          </el-button>
          <el-button 
            size="small"
            type="danger"
            @click="handleDeleteOrder(scope.row)"
            style="margin-left: 5px;">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 订单详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="订单详情" width="70%">
      <div v-if="currentOrderDetail">
        <el-descriptions title="基本信息" :column="2" border>
          <el-descriptions-item label="订单编号">{{ currentOrderDetail.order_no }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="getStatusType(currentOrderDetail.status)">
              {{ getStatusText(currentOrderDetail.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="用户ID">{{ currentOrderDetail.user_id }}</el-descriptions-item>
          <el-descriptions-item label="店铺名称">{{ currentOrderDetail.shopName }} ({{currentOrderDetail.shop_id}})</el-descriptions-item>
          <el-descriptions-item label="订单总金额">¥{{ currentOrderDetail.total_amount }}</el-descriptions-item>
          <el-descriptions-item label="手续费">¥{{ currentOrderDetail.handling_fee }}</el-descriptions-item>
          <el-descriptions-item label="运费">¥{{ currentOrderDetail.shipping_fee }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentOrderDetail.create_time }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ currentOrderDetail.update_time ? new Date(currentOrderDetail.update_time).toLocaleString() : '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ currentOrderDetail.remark || '无' }}</el-descriptions-item>
        </el-descriptions>
        
        <el-divider />
        
        <el-descriptions title="收货地址" :column="1" border v-if="currentOrderDetail.address_snapshot">
          <el-descriptions-item label="收货人">{{ currentOrderDetail.address_snapshot.name }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ currentOrderDetail.address_snapshot.phone }}</el-descriptions-item>
          <el-descriptions-item label="收货地址">
            {{ currentOrderDetail.address_snapshot.province }}
            {{ currentOrderDetail.address_snapshot.city }}
            {{ currentOrderDetail.address_snapshot.district }}
            {{ currentOrderDetail.address_snapshot.address }}
          </el-descriptions-item>
          <el-descriptions-item label="标签">{{ currentOrderDetail.address_snapshot.tag }}</el-descriptions-item>
        </el-descriptions>
        <div v-else><p>无收货地址信息</p></div>

        <el-divider />

        <h3>订单商品</h3>
        <el-table :data="currentOrderDetail.orderItems" style="width: 100%" border>
          <el-table-column label="商品图片" width="100">
            <template #default="scope">
              <el-image 
                v-if="scope.row.product_snapshot && scope.row.product_snapshot.image_url"
                :src="scope.row.product_snapshot.image_url" 
                fit="cover" 
                style="width: 60px; height: 60px; border-radius: 4px;"
                preview-teleported
                :preview-src-list="[scope.row.product_snapshot.image_url]"
              />
              <span v-else>无图</span>
            </template>
          </el-table-column>
          <el-table-column label="商品名称">
            <template #default="scope">
              {{ scope.row.product_snapshot ? scope.row.product_snapshot.name : '商品信息加载失败' }}
            </template>
          </el-table-column>
          <el-table-column prop="spec.text" label="规格" width="150" />
          <el-table-column label="单价" width="100">
            <template #default="scope">
              ¥{{ scope.row.price }}
            </template>
          </el-table-column>
          <el-table-column prop="count" label="数量" width="80" />
          <el-table-column label="小计" width="100">
            <template #default="scope">
              ¥{{ (scope.row.price * scope.row.count).toFixed(2) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div v-else>
        <p>暂无订单详情</p>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as shopService from '@/services/shopService'
import { globalCurrentShopId } from '@/store/shopStore.js';

const loading = ref(false)
const orderList = ref([])
const orderStatus = ref('')

const detailDialogVisible = ref(false);
const currentOrderDetail = ref(null);

watch(globalCurrentShopId, (newShopId, oldShopId) => {
  if (newShopId) {
    loadOrders(newShopId);
  } else {
    orderList.value = [];
  }
});

const loadOrders = async (shopToLoad) => {
  if (!shopToLoad) {
    orderList.value = [];
    return;
  }

  loading.value = true;
  try {
    const params = {};
    if (orderStatus.value) {
      params.status = orderStatus.value;
    }
    const response = await shopService.getOrderList(shopToLoad, params);
    if (response && response.success && Array.isArray(response.data)) {
      orderList.value = response.data.map(order => ({
        ...order,
        create_time: order.create_time ? new Date(order.create_time).toLocaleString() : '-',
        pay_time: order.pay_time ? new Date(order.pay_time).toLocaleString() : '-',
        ship_time: order.ship_time ? new Date(order.ship_time).toLocaleString() : '-',
        complete_time: order.complete_time ? new Date(order.complete_time).toLocaleString() : '-'
      }));
    } else {
      console.error('获取订单列表失败，响应数据格式不正确:', response);
      ElMessage.error(response?.message || '获取订单列表数据格式不正确');
      orderList.value = [];
    }
  } catch (error) {
    console.error('获取订单列表失败:', error);
    ElMessage.error('获取订单列表失败');
    orderList.value = [];
  } finally {
    loading.value = false;
  }
};

const getStatusType = (status) => {
  const types = {
    to_pay: 'warning',
    to_ship: 'primary',
    to_receive: 'info',
    completed: 'success',
    cancelled: ''
  }
  return types[status] || ''
}

const getStatusText = (status) => {
  const texts = {
    to_pay: '待付款',
    to_ship: '待发货',
    to_receive: '待收货',
    completed: '已完成',
    cancelled: '已取消'
  }
  return texts[status] || status
}

const handleDetail = (row) => {
  currentOrderDetail.value = row;
  detailDialogVisible.value = true;
}

const handleShip = async (row) => {
  const currentSelectedShop = globalCurrentShopId.value;
  if (!currentSelectedShop) {
    ElMessage.warning('请先选择店铺');
    return;
  }
  if (row.status !== 'to_ship') {
    ElMessage.info('订单状态不是"待发货"，无法操作');
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定要将订单 ${row.order_no} 标记为已发货吗？`,
      '确认发货',
      {
        confirmButtonText: '确定发货',
        cancelButtonText: '取消',
        type: 'info',
      }
    );
    loading.value = true;
    const statusData = { 
      status: 'to_receive', 
    };
    await shopService.updateOrderStatus(currentSelectedShop, row.order_no, statusData);
    ElMessage.success(`订单 ${row.order_no} 已标记为发货 (待收货)`);
    loadOrders(currentSelectedShop);
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`发货失败: ${error.response?.data?.message || error.message}`);
    }
  } finally {
    loading.value = false;
  }
}

const handleDeleteOrder = async (row) => {
  const currentSelectedShop = globalCurrentShopId.value;
  if (!currentSelectedShop) {
    ElMessage.warning('请先选择店铺');
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定要删除订单 ${row.order_no} 吗？此操作也会删除该订单下的所有订单项，且不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    loading.value = true;
    await shopService.deleteOrder(currentSelectedShop, row.order_no);
    ElMessage.success(`订单 ${row.order_no} 删除成功`);
    loadOrders(currentSelectedShop);
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`删除订单失败: ${error.response?.data?.message || error.message}`);
    }
  } finally {
    loading.value = false;
  }
};

const handleAddTestOrders = async () => {
  const currentSelectedShop = globalCurrentShopId.value;
  if (!currentSelectedShop) {
    ElMessage.warning('请先选择店铺');
    return;
  }
  const confirm = await ElMessageBox.confirm(
    '确定要添加5条测试订单吗？这将向当前店铺数据库写入数据。',
    '确认操作',
    {
      confirmButtonText: '确定添加',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).catch(() => 'cancel');

  if (confirm === 'cancel') {
    ElMessage.info('操作已取消');
    return;
  }

  loading.value = true;
  const testOrdersData = [
    {
      order_no: `TEST_${Date.now()}_01`,
      user_id: 'user_test_001',
      total_amount: 199.99,
      status: 'to_pay',
      address_snapshot: { name: '张三', phone: '13800138000', address: '测试省 测试市 测试区 测试街道1号' },
      remark: '测试订单1 - 待付款',
      items: [
        { product_id: "PROD_MOCK_001", product_snapshot: {name: "模拟商品A", price: 99.99}, count: 1, price: 99.99 },
        { product_id: "PROD_MOCK_002", product_snapshot: {name: "模拟商品B", price: 100.00}, count: 1, price: 100.00 }
      ]
    },
    {
      order_no: `TEST_${Date.now()}_02`,
      user_id: 'user_test_002',
      total_amount: 88.50,
      status: 'to_ship',
      address_snapshot: { name: '李四', phone: '13900139000', address: '演示省 演示市 演示区 演示路2号' },
      remark: '测试订单2 - 待发货',
      pay_time: new Date(),
      items: [
        { product_id: "PROD_MOCK_003", product_snapshot: {name: "模拟商品C", price: 88.50}, count: 1, price: 88.50 }
      ]
    },
    {
      order_no: `TEST_${Date.now()}_03`,
      user_id: 'user_test_001',
      total_amount: 350.00,
      status: 'to_receive',
      address_snapshot: { name: '张三', phone: '13800138000', address: '测试省 测试市 测试区 测试街道1号' },
      remark: '测试订单3 - 待收货',
      pay_time: new Date(),
      ship_time: new Date(),
      items: [
        { product_id: "PROD_MOCK_004", product_snapshot: {name: "模拟商品D", price: 175.00}, count: 2, price: 175.00 }
      ]
    },
    {
      order_no: `TEST_${Date.now()}_04`,
      user_id: 'user_test_003',
      total_amount: 49.90,
      status: 'completed',
      address_snapshot: { name: '王五', phone: '13700137000', address: '样例省 样例市 样例区 样例街3号' },
      remark: '测试订单4 - 已完成',
      pay_time: new Date(),
      ship_time: new Date(),
      complete_time: new Date(),
      items: [
        { product_id: "PROD_MOCK_005", product_snapshot: {name: "模拟商品E", price: 49.90}, count: 1, price: 49.90 }
      ]
    },
    {
      order_no: `TEST_${Date.now()}_05`,
      user_id: 'user_test_002',
      total_amount: 120.00,
      status: 'cancelled',
      address_snapshot: { name: '李四', phone: '13900139000', address: '演示省 演示市 演示区 演示路2号' },
      remark: '测试订单5 - 已取消',
      items: [
        { product_id: "PROD_MOCK_006", product_snapshot: {name: "模拟商品F", price: 60.00}, count: 2, price: 60.00 }
      ]
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const orderData of testOrdersData) {
    try {
      await shopService.createOrder(currentSelectedShop, orderData);
      successCount++;
    } catch (error) {
      errorCount++;
    }
  }

  loading.value = false;
  if (errorCount > 0) {
    ElMessage.error(`${errorCount}个测试订单创建失败，${successCount}个成功。`);
  } else {
    ElMessage.success(`${successCount}个测试订单创建成功！`);
  }
  loadOrders(currentSelectedShop);
};

const handleCancelOrder = async (row) => {
  const currentSelectedShop = globalCurrentShopId.value;
  if (!currentSelectedShop) {
    ElMessage.warning('请先选择店铺');
    return;
  }
  if (row.status === 'completed' || row.status === 'cancelled') {
    ElMessage.info(`订单状态为 "${getStatusText(row.status)}"，无法取消`);
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要取消订单 ${row.order_no} 吗？订单状态将变为 "已取消"。`,
      '确认取消订单',
      {
        confirmButtonText: '确定取消',
        cancelButtonText: '点错了',
        type: 'warning',
      }
    );
    loading.value = true;
    await shopService.cancelOrder(currentSelectedShop, row.order_no);
    ElMessage.success(`订单 ${row.order_no} 已成功取消`);
    loadOrders(currentSelectedShop); // Reload orders to reflect status change
  } catch (error) {
    if (error !== 'cancel' && error !== 'closed') { // 'cancel' from ElMessageBox, 'closed' if dialog closed via 'X'
      ElMessage.error(`取消订单失败: ${error.response?.data?.message || error.message || '未知错误'}`);
    }
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  if (globalCurrentShopId.value) {
    loadOrders(globalCurrentShopId.value);
  } else {
    orderList.value = [];
    ElMessage.info('请先在顶部选择一个店铺以查看订单。');
  }
});
</script>

<style scoped>
.orders-container {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

h2 {
  margin: 0;
  font-size: 20px;
  font-weight: normal;
}
</style>