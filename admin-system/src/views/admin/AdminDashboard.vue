<template>
  <div class="admin-dashboard">
    <el-container>
      <el-header height="60px">
        <div class="header-content">
          <h1>平台管理系统</h1>
          <el-button @click="backToMain">返回商家后台</el-button>
        </div>
      </el-header>
      
      <el-container>
        <el-aside width="200px">
          <el-menu
            default-active="/admin/dashboard"
            router
            class="admin-menu">
            <el-menu-item index="/admin/dashboard">
              <el-icon><DataBoard /></el-icon>
              <span>数据概览</span>
            </el-menu-item>
            <el-menu-item index="/admin/shops">
              <el-icon><Shop /></el-icon>
              <span>店铺管理</span>
            </el-menu-item>
            <el-menu-item index="/admin/users">
              <el-icon><User /></el-icon>
              <span>用户管理</span>
            </el-menu-item>
            <el-menu-item index="/admin/settings">
              <el-icon><Setting /></el-icon>
              <span>系统设置</span>
            </el-menu-item>
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
import { useRouter } from 'vue-router'
import { DataBoard, Shop, User, Setting } from '@element-plus/icons-vue'

const router = useRouter()

const backToMain = () => {
  router.push('/')
}
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background-color: #f0f2f5;
}

.el-header {
  background-color: #001529;
  padding: 0 20px;
  color: #fff;
}

.header-content {
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

h1 {
  margin: 0;
  font-size: 20px;
  font-weight: normal;
}

.el-aside {
  background-color: #fff;
  border-right: 1px solid #e6e6e6;
}

.admin-menu {
  height: calc(100vh - 60px);
  border-right: none;
}

.el-main {
  padding: 20px;
}
</style> 