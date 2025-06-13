<template>
  <div class="admin-layout">
    <el-container>
      <el-header height="60px">
        <div class="header-content">
          <div class="title">管理员控制台</div>
          <div class="user-info">
            <el-dropdown @command="handleCommand">
              <span class="el-dropdown-link">
                {{ adminInfo.name }} <el-icon><arrow-down /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>
      
      <el-container>
        <el-aside width="200px">
          <el-menu
            :default-active="activeMenu"
            class="admin-menu"
            @select="handleSelect">
            <el-menu-item index="/admin/shops">
              <el-icon><Shop /></el-icon>
              <span>店铺管理</span>
            </el-menu-item>
            <!-- 根据权限显示更多菜单项 -->
          </el-menu>
        </el-aside>
        
        <el-main>
          <router-view></router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowDown, Shop } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { getCurrentAdmin, adminLogout } from '../../utils/adminService'

const router = useRouter()
const route = useRoute()

// 当前管理员信息
const adminInfo = computed(() => getCurrentAdmin() || {})

// 当前激活的菜单项
const activeMenu = computed(() => route.path)

// 菜单选择
const handleSelect = (index) => {
  router.push(index)
}

// 下拉菜单命令处理
const handleCommand = (command) => {
  if (command === 'logout') {
    handleLogout()
  }
}

// 退出登录
const handleLogout = () => {
  ElMessageBox.confirm(
    '确定要退出登录吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    adminLogout()
    router.push('/login')
  }).catch(() => {})
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
}

.el-header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  padding: 0 20px;
}

.header-content {
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.el-dropdown-link {
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #606266;
}

.el-aside {
  background-color: #fff;
  border-right: 1px solid #e6e6e6;
}

.admin-menu {
  border-right: none;
}

.el-main {
  background-color: #f0f2f5;
  padding: 20px;
}
</style> 