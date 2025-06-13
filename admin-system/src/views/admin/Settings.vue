<template>
  <div class="settings-container">
    <div class="header">
      <h2>系统设置</h2>
    </div>

    <el-card class="settings-card">
      <el-tabs v-model="activeTab">
        <!-- 基本设置 -->
        <el-tab-pane label="基本设置" name="basic">
          <el-form
            ref="basicFormRef"
            :model="basicForm"
            :rules="basicRules"
            label-width="120px"
          >
            <el-form-item label="系统名称" prop="systemName">
              <el-input v-model="basicForm.systemName" placeholder="请输入系统名称" />
            </el-form-item>
            <el-form-item label="系统Logo" prop="logo">
              <el-upload
                class="logo-uploader"
                action="/api/upload"
                :show-file-list="false"
                :on-success="handleLogoSuccess"
                :before-upload="beforeLogoUpload"
              >
                <el-image
                  v-if="basicForm.logo"
                  :src="basicForm.logo"
                  class="logo-preview"
                />
                <el-icon v-else class="logo-uploader-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>
            <el-form-item label="系统描述" prop="description">
              <el-input
                v-model="basicForm.description"
                type="textarea"
                rows="3"
                placeholder="请输入系统描述"
              />
            </el-form-item>
            <el-form-item label="备案信息" prop="icp">
              <el-input v-model="basicForm.icp" placeholder="请输入备案信息" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveBasicSettings">保存设置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 安全设置 -->
        <el-tab-pane label="安全设置" name="security">
          <el-form
            ref="securityFormRef"
            :model="securityForm"
            :rules="securityRules"
            label-width="120px"
          >
            <el-form-item label="密码最小长度" prop="minPasswordLength">
              <el-input-number
                v-model="securityForm.minPasswordLength"
                :min="6"
                :max="20"
                placeholder="请设置密码最小长度"
              />
            </el-form-item>
            <el-form-item label="密码复杂度" prop="passwordComplexity">
              <el-checkbox-group v-model="securityForm.passwordComplexity">
                <el-checkbox label="numbers">必须包含数字</el-checkbox>
                <el-checkbox label="lowercase">必须包含小写字母</el-checkbox>
                <el-checkbox label="uppercase">必须包含大写字母</el-checkbox>
                <el-checkbox label="special">必须包含特殊字符</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item label="登录失败锁定" prop="loginLockEnabled">
              <el-switch v-model="securityForm.loginLockEnabled" />
            </el-form-item>
            <el-form-item
              label="锁定阈值"
              prop="loginLockThreshold"
              v-if="securityForm.loginLockEnabled"
            >
              <el-input-number
                v-model="securityForm.loginLockThreshold"
                :min="3"
                :max="10"
                placeholder="请设置登录失败锁定阈值"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveSecuritySettings">保存设置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 邮件设置 -->
        <el-tab-pane label="邮件设置" name="email">
          <el-form
            ref="emailFormRef"
            :model="emailForm"
            :rules="emailRules"
            label-width="120px"
          >
            <el-form-item label="SMTP服务器" prop="smtpHost">
              <el-input v-model="emailForm.smtpHost" placeholder="请输入SMTP服务器地址" />
            </el-form-item>
            <el-form-item label="SMTP端口" prop="smtpPort">
              <el-input-number
                v-model="emailForm.smtpPort"
                :min="1"
                :max="65535"
                placeholder="请输入SMTP端口"
              />
            </el-form-item>
            <el-form-item label="发件人邮箱" prop="senderEmail">
              <el-input v-model="emailForm.senderEmail" placeholder="请输入发件人邮箱" />
            </el-form-item>
            <el-form-item label="发件人名称" prop="senderName">
              <el-input v-model="emailForm.senderName" placeholder="请输入发件人名称" />
            </el-form-item>
            <el-form-item label="SMTP密码" prop="smtpPassword">
              <el-input
                v-model="emailForm.smtpPassword"
                type="password"
                placeholder="请输入SMTP密码"
                show-password
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveEmailSettings">保存设置</el-button>
              <el-button type="success" @click="testEmailSettings">测试连接</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

// 当前激活的标签页
const activeTab = ref('basic')

// 基本设置表单
const basicFormRef = ref(null)
const basicForm = reactive({
  systemName: '',
  logo: '',
  description: '',
  icp: ''
})

const basicRules = {
  systemName: [
    { required: true, message: '请输入系统名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入系统描述', trigger: 'blur' }
  ]
}

// 安全设置表单
const securityFormRef = ref(null)
const securityForm = reactive({
  minPasswordLength: 8,
  passwordComplexity: ['numbers', 'lowercase'],
  loginLockEnabled: false,
  loginLockThreshold: 5
})

const securityRules = {
  minPasswordLength: [
    { required: true, message: '请设置密码最小长度', trigger: 'blur' }
  ],
  passwordComplexity: [
    { type: 'array', required: true, message: '请选择密码复杂度要求', trigger: 'change' }
  ]
}

// 邮件设置表单
const emailFormRef = ref(null)
const emailForm = reactive({
  smtpHost: '',
  smtpPort: 465,
  senderEmail: '',
  senderName: '',
  smtpPassword: ''
})

const emailRules = {
  smtpHost: [
    { required: true, message: '请输入SMTP服务器地址', trigger: 'blur' }
  ],
  smtpPort: [
    { required: true, message: '请输入SMTP端口', trigger: 'blur' }
  ],
  senderEmail: [
    { required: true, message: '请输入发件人邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  senderName: [
    { required: true, message: '请输入发件人名称', trigger: 'blur' }
  ],
  smtpPassword: [
    { required: true, message: '请输入SMTP密码', trigger: 'blur' }
  ]
}

// Logo上传相关
const handleLogoSuccess = (res) => {
  basicForm.logo = res.url
}

const beforeLogoUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('上传Logo只能是图片格式!')
  }
  if (!isLt2M) {
    ElMessage.error('上传Logo图片大小不能超过 2MB!')
  }
  return isImage && isLt2M
}

// 保存基本设置
const saveBasicSettings = async () => {
  if (!basicFormRef.value) return
  
  await basicFormRef.value.validate(async (valid, fields) => {
    if (valid) {
      try {
        // TODO: 调用API保存基本设置
        // await api.saveBasicSettings(basicForm)
        ElMessage.success('保存成功')
      } catch (error) {
        console.error('保存基本设置失败:', error)
        ElMessage.error('保存失败')
      }
    }
  })
}

// 保存安全设置
const saveSecuritySettings = async () => {
  if (!securityFormRef.value) return
  
  await securityFormRef.value.validate(async (valid, fields) => {
    if (valid) {
      try {
        // TODO: 调用API保存安全设置
        // await api.saveSecuritySettings(securityForm)
        ElMessage.success('保存成功')
      } catch (error) {
        console.error('保存安全设置失败:', error)
        ElMessage.error('保存失败')
      }
    }
  })
}

// 保存邮件设置
const saveEmailSettings = async () => {
  if (!emailFormRef.value) return
  
  await emailFormRef.value.validate(async (valid, fields) => {
    if (valid) {
      try {
        // TODO: 调用API保存邮件设置
        // await api.saveEmailSettings(emailForm)
        ElMessage.success('保存成功')
      } catch (error) {
        console.error('保存邮件设置失败:', error)
        ElMessage.error('保存失败')
      }
    }
  })
}

// 测试邮件设置
const testEmailSettings = async () => {
  if (!emailFormRef.value) return
  
  await emailFormRef.value.validate(async (valid, fields) => {
    if (valid) {
      try {
        // TODO: 调用API测试邮件设置
        // await api.testEmailSettings(emailForm)
        ElMessage.success('测试邮件发送成功')
      } catch (error) {
        console.error('测试邮件发送失败:', error)
        ElMessage.error('测试失败')
      }
    }
  })
}

// 获取设置
const getSettings = async () => {
  try {
    // TODO: 调用API获取设置
    // const res = await api.getSettings()
    // Object.assign(basicForm, res.data.basic)
    // Object.assign(securityForm, res.data.security)
    // Object.assign(emailForm, res.data.email)
  } catch (error) {
    console.error('获取设置失败:', error)
    ElMessage.error('获取设置失败')
  }
}

// 初始化
getSettings()
</script>

<style scoped>
.settings-container {
  padding: 20px;
}

.header {
  margin-bottom: 20px;

  h2 {
    margin: 0;
  }
}

.settings-card {
  margin-bottom: 20px;
}

.logo-uploader {
  text-align: center;
  
  .logo-preview {
    width: 150px;
    height: 150px;
    border-radius: 4px;
  }
  
  .logo-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 150px;
    height: 150px;
    line-height: 150px;
    text-align: center;
    border: 1px dashed #d9d9d9;
    border-radius: 4px;
    cursor: pointer;
  }
}

:deep(.el-tabs__content) {
  padding: 20px 0;
}
</style> 