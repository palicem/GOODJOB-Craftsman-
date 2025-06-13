<template>
  <div class="shop-management-container">
    <!-- 搜索和操作栏 -->
    <div class="action-bar">
      <div class="search-section">
        <el-input
          v-model="searchQuery"
          placeholder="搜索店铺名称/ID"
          style="width: 200px"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch">
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>添加店铺
      </el-button>
    </div>

    <!-- 店铺列表 -->
    <el-table :data="shopList" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="店铺ID" width="120" />
      <el-table-column label="店铺Logo" width="100">
        <template #default="scope">
          <el-image
            style="width: 40px; height: 40px"
            :src="scope.row.logo"
            fit="cover">
            <template #error>
              <div class="image-slot">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="店铺名称" min-width="200" />
      <el-table-column prop="location" label="店铺位置" width="150" />
      <el-table-column prop="created_at" label="创建时间" width="180" />
      <el-table-column label="操作" fixed="right" width="150">
        <template #default="scope">
          <el-button link type="primary" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
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

    <!-- 添加/编辑店铺对话框 -->
    <el-dialog
      :title="dialogType === 'add' ? '添加店铺' : '编辑店铺'"
      v-model="dialogVisible"
      width="500px">
      <el-form :model="shopForm" :rules="rules" ref="shopFormRef" label-width="100px">
        <el-form-item label="店铺ID" prop="id" v-if="dialogType === 'add'">
          <el-input v-model="shopForm.id" placeholder="请输入店铺ID" />
        </el-form-item>
        <el-form-item label="店铺名称" prop="name">
          <el-input v-model="shopForm.name" placeholder="请输入店铺名称" />
        </el-form-item>
        <el-form-item label="店铺Logo" prop="logo">
          <el-upload
            class="avatar-uploader"
            action="#"
            :show-file-list="false"
            :before-upload="beforeLogoUpload">
            <img v-if="shopForm.logo" :src="shopForm.logo" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="店铺位置" prop="location">
          <el-input v-model="shopForm.location" placeholder="请输入店铺位置" />
        </el-form-item>
        <el-form-item label="店铺描述" prop="description">
          <el-input
            v-model="shopForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入店铺描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Search, Plus, Picture } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 搜索相关
const searchQuery = ref('')

const handleSearch = () => {
  currentPage.value = 1
  fetchShopList()
}

// 表格相关
const loading = ref(false)
const shopList = ref([
  {
    id: 'shop001',
    name: '优选服饰旗舰店',
    logo: 'https://example.com/logo1.jpg',
    location: '广州',
    description: '专注高品质服装定制',
    created_at: '2025-05-20 10:00:00'
  },
  {
    id: 'shop002',
    name: '潮流配饰馆',
    logo: 'https://example.com/logo2.jpg',
    location: '深圳',
    description: '时尚配饰定制专家',
    created_at: '2025-05-20 11:00:00'
  }
])

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(100)

const handleSizeChange = (val) => {
  pageSize.value = val
  fetchShopList()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchShopList()
}

// 获取店铺列表
const fetchShopList = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 500)
}

// 表单相关
const dialogVisible = ref(false)
const dialogType = ref('add')
const shopFormRef = ref(null)
const shopForm = reactive({
  id: '',
  name: '',
  logo: '',
  location: '',
  description: ''
})

const rules = {
  id: [
    { required: true, message: '请输入店铺ID', trigger: 'blur' },
    { pattern: /^[A-Za-z0-9]+$/, message: '店铺ID只能包含字母和数字', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入店铺名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  location: [
    { required: true, message: '请输入店铺位置', trigger: 'blur' }
  ]
}

// Logo上传
const beforeLogoUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
  }
  return isImage && isLt2M
}

// 添加店铺
const handleAdd = () => {
  dialogType.value = 'add'
  dialogVisible.value = true
  Object.assign(shopForm, {
    id: '',
    name: '',
    logo: '',
    location: '',
    description: ''
  })
}

// 编辑店铺
const handleEdit = (row) => {
  dialogType.value = 'edit'
  dialogVisible.value = true
  Object.assign(shopForm, row)
}

// 删除店铺
const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确定要删除该店铺吗？',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage({
      type: 'success',
      message: '删除成功'
    })
  }).catch(() => {})
}

// 提交表单
const handleSubmit = async () => {
  if (!shopFormRef.value) return
  
  await shopFormRef.value.validate((valid, fields) => {
    if (valid) {
      // 这里添加实际的提交逻辑
      ElMessage({
        type: 'success',
        message: dialogType.value === 'add' ? '添加成功' : '更新成功'
      })
      dialogVisible.value = false
      fetchShopList()
    }
  })
}
</script>

<style scoped>
.shop-management-container {
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
}

.action-bar {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-section {
  display: flex;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.avatar-uploader {
  :deep(.el-upload) {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: var(--el-transition-duration-fast);

    &:hover {
      border-color: var(--el-color-primary);
    }
  }
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  text-align: center;
  line-height: 100px;
}

.avatar {
  width: 100px;
  height: 100px;
  display: block;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
}
</style> 