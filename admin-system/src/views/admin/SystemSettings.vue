<template>
  <div class="system-settings">
    <div class="page-header">
      <h2>系统设置</h2>
    </div>

    <el-card class="setting-card">
      <template #header>
        <div class="card-header">
          <span>基础设置</span>
        </div>
      </template>
      
      <el-form
        ref="settingFormRef"
        :model="settingForm"
        label-width="120px"
        class="setting-form">
        <el-form-item label="系统名称">
          <el-input v-model="settingForm.systemName" />
        </el-form-item>
        
        <el-form-item label="系统Logo">
          <el-upload
            class="logo-uploader"
            action="/api/upload"
            :show-file-list="false"
            :on-success="handleLogoSuccess"
            :before-upload="beforeLogoUpload">
            <img v-if="settingForm.logo" :src="settingForm.logo" class="logo" />
            <el-icon v-else class="logo-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>

        <el-form-item label="后台主题色">
          <el-color-picker v-model="settingForm.primaryColor" />
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="setting-card">
      <template #header>
        <div class="card-header">
          <span>安全设置</span>
        </div>
      </template>
      
      <el-form
        ref="securityFormRef"
        :model="securityForm"
        label-width="120px"
        class="setting-form">
        <el-form-item label="密码最小长度">
          <el-input-number v-model="securityForm.minPasswordLength" :min="6" :max="20" />
        </el-form-item>

        <el-form-item label="密码复杂度">
          <el-select v-model="securityForm.passwordStrength" style="width: 100%">
            <el-option label="低（仅字母和数字）" value="low" />
            <el-option label="中（字母+数字）" value="medium" />
            <el-option label="高（字母+数字+特殊字符）" value="high" />
          </el-select>
        </el-form-item>

        <el-form-item label="登录失败锁定">
          <el-switch
            v-model="securityForm.loginLockEnabled"
            inline-prompt
            active-text="开启"
            inactive-text="关闭" />
        </el-form-item>

        <el-form-item label="锁定阈值" v-if="securityForm.loginLockEnabled">
          <el-input-number v-model="securityForm.loginLockThreshold" :min="3" :max="10" />
          <span class="form-tip">次失败后锁定账号</span>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="setting-card">
      <template #header>
        <div class="card-header">
          <span>其他设置</span>
        </div>
      </template>
      
      <el-form
        ref="otherFormRef"
        :model="otherForm"
        label-width="120px"
        class="setting-form">
        <el-form-item label="开启注册">
          <el-switch
            v-model="otherForm.enableRegister"
            inline-prompt
            active-text="开启"
            inactive-text="关闭" />
        </el-form-item>

        <el-form-item label="开启短信验证">
          <el-switch
            v-model="otherForm.enableSmsVerify"
            inline-prompt
            active-text="开启"
            inactive-text="关闭" />
        </el-form-item>

        <el-form-item label="系统维护模式">
          <el-switch
            v-model="otherForm.maintenanceMode"
            inline-prompt
            active-text="开启"
            inactive-text="关闭" />
        </el-form-item>
      </el-form>
    </el-card>

    <div class="form-actions">
      <el-button type="primary" @click="handleSave">保存设置</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

// 基础设置表单
const settingForm = reactive({
  systemName: '多商户商城管理系统',
  logo: '',
  primaryColor: '#409EFF'
})

// 安全设置表单
const securityForm = reactive({
  minPasswordLength: 8,
  passwordStrength: 'medium',
  loginLockEnabled: true,
  loginLockThreshold: 5
})

// 其他设置表单
const otherForm = reactive({
  enableRegister: true,
  enableSmsVerify: true,
  maintenanceMode: false
})

// Logo上传相关
const handleLogoSuccess = (res) => {
  settingForm.logo = res.url
  ElMessage.success('上传成功')
}

const beforeLogoUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件！')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB！')
    return false
  }
  return true
}

// 保存设置
const handleSave = () => {
  // 实现保存逻辑
  console.log('保存设置：', {
    setting: settingForm,
    security: securityForm,
    other: otherForm
  })
  ElMessage.success('保存成功')
}

// 重置设置
const handleReset = () => {
  // 实现重置逻辑
  Object.assign(settingForm, {
    systemName: '多商户商城管理系统',
    logo: '',
    primaryColor: '#409EFF'
  })
  Object.assign(securityForm, {
    minPasswordLength: 8,
    passwordStrength: 'medium',
    loginLockEnabled: true,
    loginLockThreshold: 5
  })
  Object.assign(otherForm, {
    enableRegister: true,
    enableSmsVerify: true,
    maintenanceMode: false
  })
  ElMessage.success('重置成功')
}
</script>

<style scoped>
.system-settings {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: normal;
}

.setting-card {
  margin-bottom: 20px;
}

.setting-card:last-child {
  margin-bottom: 0;
}

.setting-form {
  max-width: 600px;
}

.logo-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 178px;
  height: 178px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.logo-uploader:hover {
  border-color: #409EFF;
}

.logo-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}

.logo {
  width: 178px;
  height: 178px;
  display: block;
  object-fit: contain;
}

.form-tip {
  margin-left: 10px;
  color: #909399;
  font-size: 14px;
}

.form-actions {
  margin-top: 20px;
  padding: 20px;
  text-align: center;
  background-color: #fff;
  border-radius: 4px;
}
</style> 