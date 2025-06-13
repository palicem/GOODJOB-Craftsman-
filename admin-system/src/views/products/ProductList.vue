<template>
  <div class="product-list">
    <div class="header">
      <h2>商品管理</h2>
      <el-button type="primary" @click="showAddDialog">添加商品</el-button>
    </div>

    <!-- 商品列表表格 -->
    <el-table :data="productList" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="商品ID" width="120" />
      <el-table-column prop="name" label="商品名称" />
      <el-table-column prop="price" label="价格" width="120">
        <template #default="scope">
          ¥{{ scope.row.price }}
        </template>
      </el-table-column>
      <el-table-column prop="stock" label="库存" width="120" />
      <el-table-column prop="status" label="状态" width="120">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
            {{ scope.row.status === 1 ? '上架' : '下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button 
            size="small" 
            type="danger" 
            @click="handleDelete(scope.row)">删除</el-button>
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

    <!-- 添加/编辑商品对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '添加商品' : '编辑商品'"
      width="60%">
      <product-form
        ref="productForm"
        :type="dialogType"
        :product-data="currentProduct"
        @submit="handleSubmit"
        @cancel="dialogVisible = false"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ProductForm from './components/ProductForm.vue'

// 数据列表
const productList = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 对话框控制
const dialogVisible = ref(false)
const dialogType = ref('add')
const currentProduct = ref(null)
const productForm = ref(null)

// 获取商品列表
const getProductList = async () => {
  loading.value = true
  try {
    // TODO: 调用API获取商品列表
    // const res = await api.getProductList({
    //   page: currentPage.value,
    //   pageSize: pageSize.value
    // })
    // productList.value = res.data.list
    // total.value = res.data.total

    // 模拟数据
    productList.value = [
      {
        id: 'P001',
        name: '测试商品1',
        price: 99.00,
        stock: 100,
        status: 1
      }
    ]
    total.value = 1
  } catch (error) {
    console.error('获取商品列表失败:', error)
    ElMessage.error('获取商品列表失败')
  } finally {
    loading.value = false
  }
}

// 显示添加对话框
const showAddDialog = () => {
  dialogType.value = 'add'
  currentProduct.value = null
  dialogVisible.value = true
}

// 处理编辑
const handleEdit = (row) => {
  dialogType.value = 'edit'
  currentProduct.value = { ...row }
  dialogVisible.value = true
}

// 处理删除
const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确定要删除该商品吗？',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      // TODO: 调用删除API
      // await api.deleteProduct(row.id)
      ElMessage.success('删除成功')
      getProductList()
    } catch (error) {
      console.error('删除商品失败:', error)
      ElMessage.error('删除商品失败')
    }
  }).catch(() => {})
}

// 处理表单提交
const handleSubmit = async (formData) => {
  try {
    if (dialogType.value === 'add') {
      // TODO: 调用添加API
      // await api.addProduct(formData)
      ElMessage.success('添加成功')
    } else {
      // TODO: 调用更新API
      // await api.updateProduct(currentProduct.value.id, formData)
      ElMessage.success('更新成功')
    }
    dialogVisible.value = false
    getProductList()
  } catch (error) {
    console.error('保存商品失败:', error)
    ElMessage.error('保存商品失败')
  }
}

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val
  getProductList()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  getProductList()
}

// 初始化
onMounted(() => {
  getProductList()
})
</script>

<style scoped>
.product-list {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 