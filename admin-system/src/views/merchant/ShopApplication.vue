<template>
  <div class="shop-application">
    <div class="header">
      <h2>申请新店铺</h2>
    </div>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      class="application-form"
    >
      <el-form-item label="店铺名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入店铺名称" />
      </el-form-item>

      <el-form-item label="店铺Logo" prop="logo">
        <el-upload
          class="logo-uploader"
          action="/api/upload"
          :show-file-list="false"
          :on-success="handleLogoSuccess"
          :before-upload="beforeLogoUpload"
        >
          <img v-if="form.logo" :src="form.logo" class="logo" />
          <el-icon v-else class="logo-uploader-icon"><Plus /></el-icon>
        </el-upload>
        <div class="upload-tip">建议上传正方形logo，大小不超过2MB</div>
      </el-form-item>

      <el-form-item label="店铺描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          rows="4"
          placeholder="请输入店铺描述"
        />
      </el-form-item>

      <el-form-item label="店铺位置" prop="location">
        <el-input v-model="form.location" placeholder="请输入店铺位置" />
      </el-form-item>

      <el-form-item label="联系信息" prop="contact_info">
        <el-input v-model="form.contact_info" placeholder="请输入联系电话或邮箱" />
      </el-form-item>

      <el-form-item label="经营类目" prop="category">
        <el-input v-model="form.category" placeholder="例如：服装、餐饮、家居" />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="submitApplication">提交申请</el-button>
        <el-button @click="$router.back()">取消</el-button>
      </el-form-item>
    </el-form>

    <!-- 申请说明 -->
    <el-card class="tips-card">
      <template #header>
        <div class="card-header">
          <span>申请说明</span>
        </div>
      </template>
      <div class="tips-content">
        <p>1. 请确保填写的信息真实有效</p>
        <p>2. 店铺名称一旦创建后不可修改</p>
        <p>3. 申请提交后需要等待平台审核</p>
        <p>4. 审核通过后即可使用新店铺</p>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const formRef = ref(null)

// 表单数据
const form = reactive({
  name: '',
  logo: '',
  description: '',
  location: '',
  contact_info: '',
  category: ''
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入店铺名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入店铺描述', trigger: 'blur' }
  ],
  location: [
    { required: true, message: '请输入店铺位置', trigger: 'blur' }
  ],
  contact_info: [
    { required: true, message: '请输入联系信息', trigger: 'blur' }
  ],
  category: [
    // { required: true, message: '请选择经营类目', trigger: 'change' } // Example if it's a select
  ]
}

// 处理Logo上传
const handleLogoSuccess = (res) => {
  form.logo = res.url
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

// Populate form if it's a reapplication
onMounted(() => {
  if (route.query.reapply === 'true') {
    form.name = route.query.name || '';
    form.logo = route.query.logo || '';
    form.description = route.query.description || '';
    form.location = route.query.location || '';
    form.contact_info = route.query.contact_info || '';
    form.category = route.query.category || '';
    ElMessage.info('请编辑您的店铺信息后重新提交申请。');
  }
});

// 提交申请
const submitApplication = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid, fields) => {
    if (valid) {
      try {
        // Before submitting, check if this is a re-application to clear old status
        if (route.query.reapply === 'true' && route.query.name) {
          localStorage.removeItem(`shop_application_status_${route.query.name}`);
        }

        // TODO: 调用申请店铺API
        // const res = await api.applyShop({
        //   ...form,
        //   status: 'pending'
        // })

        // --- Temporary: Save to localStorage for admin panel to pick up --- 
        localStorage.setItem('lastAppliedShopName', form.name);
        localStorage.setItem('lastAppliedShopLogo', form.logo || '');
        localStorage.setItem('lastAppliedShopDescription', form.description || '');
        localStorage.setItem('lastAppliedShopLocation', form.location || '');
        localStorage.setItem('lastAppliedShopContactInfo', form.contact_info || '');
        localStorage.setItem('lastAppliedShopCategory', form.category || '');
        // --- End Temporary --- 

        ElMessage.success('申请提交成功，请等待平台审核')
        router.push('/merchant/dashboard')
      } catch (error) {
        console.error('提交申请失败:', error)
        ElMessage.error('提交申请失败')
      }
    }
  })
}
</script>

<style scoped>
.shop-application {
  padding: 20px;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.header {
  grid-column: 1 / -1;
  margin-bottom: 30px;

  h2 {
    margin: 0;
  }
}

.application-form {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.logo-uploader {
  .logo {
    width: 120px;
    height: 120px;
    display: block;
  }

  .logo-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 120px;
    height: 120px;
    line-height: 120px;
    text-align: center;
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
  }
}

.upload-tip {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

.tips-card {
  height: fit-content;

  .card-header {
    font-weight: bold;
  }

  .tips-content {
    p {
      margin: 8px 0;
      color: #666;
      font-size: 14px;
    }
  }
}
</style> 