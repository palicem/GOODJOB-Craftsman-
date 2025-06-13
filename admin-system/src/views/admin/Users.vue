<template>
  <div class="users-container">
    <div class="header">
      <h2>用户管理</h2>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input
        v-model="searchForm.keyword"
        placeholder="输入用户名/账户名/昵称搜索"
        style="width: 250px; margin-right: 10px"
        clearable
        @keyup.enter="handleSearch"
      ></el-input>
      <el-select v-model="searchForm.status" placeholder="用户状态" clearable style="width: 120px; margin-right: 10px">
        <el-option :label="'正常'" :value="1" />
        <el-option :label="'禁用'" :value="0" />
      </el-select>
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <el-button @click="resetSearch">重置</el-button>
    </div>

    <!-- 用户列表 -->
    <el-table
      :data="userList"
      style="width: 100%; margin-top: 20px"
      v-loading="loading"
    >
      <el-table-column prop="id" label="用户ID" width="80" />
      <el-table-column label="用户信息" min-width="200">
        <template #default="scope">
          <div class="user-info">
            <el-avatar :src="scope.row.avatar" :size="40"></el-avatar>
            <div class="user-details">
              <div class="username">
                {{ scope.row.nickname || scope.row.username }}
                <el-tag size="small" v-if="scope.row.real_name">{{ scope.row.real_name }}</el-tag>
              </div>
              <div class="sub-info">
                <span class="account-name">账户：{{ scope.row.account_name }}</span>
                <span class="phone" v-if="scope.row.phone">{{ scope.row.phone }}</span>
              </div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="联系方式" min-width="180">
        <template #default="scope">
          <div>
            <div v-if="scope.row.email">
              <el-icon><Message /></el-icon> {{ scope.row.email }}
            </div>
            <div v-if="scope.row.phone">
              <el-icon><Phone /></el-icon> {{ scope.row.phone }}
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="个人信息" min-width="150">
        <template #default="scope">
          <div>
            <div v-if="scope.row.gender">
              性别：{{ getGenderText(scope.row.gender) }}
            </div>
            <div v-if="scope.row.birthday">
              生日：{{ scope.row.birthday }}
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="register_time" label="注册时间" width="180" />
      <el-table-column prop="last_login_time" label="最后登录" width="180" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
            {{ scope.row.status === 1 ? '正常' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button 
            size="small"
            @click="handleEdit(scope.row)"
          >编辑</el-button>
          <el-button
            size="small"
            :type="scope.row.status === 1 ? 'danger' : 'success'"
            @click="handleToggleStatus(scope.row)"
          >
            {{ scope.row.status === 1 ? '禁用' : '启用' }}
          </el-button>
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
      ></el-pagination>
    </div>

    <!-- 编辑用户对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="编辑用户信息"
      width="600px"
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" disabled />
        </el-form-item>
        <el-form-item label="账户名" prop="account_name">
          <el-input v-model="userForm.account_name" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="userForm.nickname" />
        </el-form-item>
        <el-form-item label="真实姓名" prop="real_name">
          <el-input v-model="userForm.real_name" />
        </el-form-item>
        <el-form-item label="头像">
          <el-upload
            class="avatar-uploader"
            action="/api/upload"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :before-upload="beforeAvatarUpload"
          >
            <img v-if="userForm.avatar" :src="userForm.avatar" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-select v-model="userForm.gender">
            <el-option :label="'未设置'" :value="0" />
            <el-option :label="'男'" :value="1" />
            <el-option :label="'女'" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="生日" prop="birthday">
          <el-date-picker
            v-model="userForm.birthday"
            type="date"
            placeholder="选择生日"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" />
        </el-form-item>
        <el-form-item label="个性签名" prop="bio">
          <el-input
            v-model="userForm.bio"
            type="textarea"
            rows="3"
            placeholder="请输入个性签名"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="userForm.status">
            <el-option :label="'正常'" :value="1" />
            <el-option :label="'禁用'" :value="0" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitUser">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import * as userService from '@/services/userService' // 导入 userService
import { ElMessage, ElMessageBox } from 'element-plus'
import { Message, Phone, Plus } from '@element-plus/icons-vue'

// 搜索表单
const searchForm = reactive({
  keyword: '',
  status: ''
})

// 列表数据
const loading = ref(false)
const userList = ref([]) // 初始化为空数组

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(100)

// 对话框
const dialogVisible = ref(false)
const userFormRef = ref(null)
const userForm = reactive({
  id: '',
  username: '',
  phone: '',
  email: '',
  status: ''
})

// 表单验证规则
const userRules = {
  account_name: [
    { required: true, message: '请输入账户名', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  nickname: [
    { max: 50, message: '长度不能超过 50 个字符', trigger: 'blur' }
  ],
  real_name: [
    { max: 50, message: '长度不能超过 50 个字符', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  birthday: [
    { pattern: /^\d{4}-\d{2}-\d{2}$/, message: '生日格式不正确', trigger: 'blur' }
  ]
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  getUserList()
}

// 重置搜索
const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  handleSearch()
}

// 获取用户列表
const getUserList = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value, 
      keyword: searchForm.keyword,
      status: searchForm.status
    }
    // 过滤掉空参数
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key]
      }
    });
    const response = await userService.getUserList(params) // 调用 API
    
    if (response && response.success && Array.isArray(response.data)) {
      userList.value = response.data.map(user => ({ ...user, id: user._id || user.id })) 
      // 假设后端可能返回 total 字段用于分页
      total.value = response.total || response.data.length;
    } else if (Array.isArray(response)) { // 兼容直接返回数组的情况
      userList.value = response.map(user => ({ ...user, id: user._id || user.id })) 
      total.value = response.length;
    } else {
      console.error('获取用户列表失败，响应数据格式不正确:', response);
      ElMessage.error(response?.message || '获取用户列表数据格式不正确');
      userList.value = []; // 确保 userList 是一个数组
      total.value = 0;
    }
    
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
    userList.value = []; // 确保 userList 是一个数组
    total.value = 0;
  } finally {
    loading.value = false
  }
}

// 编辑用户
const handleEdit = (user) => {
  Object.assign(userForm, user)
  dialogVisible.value = true
}

// 切换用户状态
const handleToggleStatus = (user) => {
  const action = user.status === 1 ? '禁用' : '启用'
  ElMessageBox.confirm(
    `确定要${action}该用户吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // TODO: 调用API更新用户状态
      // await api.updateUserStatus({
      //   id: user.id,
      //   status: user.status === 1 ? 0 : 1
      // })
      ElMessage.success(`${action}成功`)
      getUserList()
    } catch (error) {
      console.error('更新用户状态失败:', error)
      ElMessage.error(`${action}失败`)
    }
  }).catch(() => {})
}

// 提交用户表单
const submitUser = async () => {
  if (!userFormRef.value) return
  
  await userFormRef.value.validate(async (valid, fields) => {
    if (valid) {
      try {
        // TODO: 调用更新API
        // await api.updateUser(userForm)
        ElMessage.success('更新成功')
        dialogVisible.value = false
        getUserList()
      } catch (error) {
        console.error('更新用户失败:', error)
        ElMessage.error('更新用户失败')
      }
    }
  })
}

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val
  getUserList()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  getUserList()
}

// 性别显示
const getGenderText = (gender) => {
  const genderMap = {
    0: '未设置',
    1: '男',
    2: '女'
  }
  return genderMap[gender] || '未设置'
}

// 处理头像上传
const handleAvatarSuccess = (res) => {
  userForm.avatar = res.url
  ElMessage.success('头像上传成功')
}

const beforeAvatarUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('上传头像图片只能是图片格式!')
  }
  if (!isLt2M) {
    ElMessage.error('上传头像图片大小不能超过 2MB!')
  }
  return isImage && isLt2M
}

// 初始化
getUserList()
</script>

<style scoped>
.users-container {
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
}

.search-bar {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-details {
  .username {
    font-weight: 500;
    margin-bottom: 4px;
  }
  
  .phone {
    font-size: 12px;
    color: #666;
  }
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.avatar-uploader :deep(.el-upload) {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
  width: 100px;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;

  &:hover {
    border-color: var(--el-color-primary);
  }
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
</style> 