<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-width="120px"
    class="product-form">
    <el-form-item label="商品名称" prop="name">
      <el-input v-model="formData.name" placeholder="请输入商品名称" />
    </el-form-item>

    <el-form-item label="商品分类" prop="categoryId">
      <el-select v-model="formData.categoryId" placeholder="请选择商品分类">
        <el-option
          v-for="item in categoryOptions"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="商品价格" prop="price">
      <el-input-number 
        v-model="formData.price"
        :precision="2"
        :step="0.1"
        :min="0"
      />
    </el-form-item>

    <el-form-item label="商品库存" prop="stock">
      <el-input-number
        v-model="formData.stock"
        :min="0"
        :step="1"
      />
    </el-form-item>

    <el-form-item label="商品图片" prop="images">
      <el-upload
        class="product-uploader"
        action="/api/upload"
        list-type="picture-card"
        :on-preview="handlePictureCardPreview"
        :on-remove="handleRemove"
        :on-success="handleUploadSuccess"
        multiple>
        <el-icon><Plus /></el-icon>
      </el-upload>
      <el-dialog v-model="dialogVisible">
        <img w-full :src="dialogImageUrl" alt="Preview Image" />
      </el-dialog>
    </el-form-item>

    <el-form-item label="商品描述" prop="description">
      <el-input
        v-model="formData.description"
        type="textarea"
        rows="4"
        placeholder="请输入商品描述"
      />
    </el-form-item>

    <el-form-item label="商品规格" prop="specs">
      <div v-for="(spec, index) in formData.specs" :key="index" class="spec-item">
        <el-input
          v-model="spec.name"
          placeholder="规格名称"
          style="width: 200px; margin-right: 10px"
        />
        <el-select
          v-model="spec.options"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="规格选项"
          style="width: 300px; margin-right: 10px"
        />
        <el-button type="danger" @click="removeSpec(index)">删除</el-button>
      </div>
      <el-button type="primary" @click="addSpec">添加规格</el-button>
    </el-form-item>

    <el-form-item label="是否可定制" prop="isCustomizable">
      <el-switch v-model="formData.isCustomizable" />
    </el-form-item>

    <el-form-item label="商品状态" prop="status">
      <el-radio-group v-model="formData.status">
        <el-radio :label="1">上架</el-radio>
        <el-radio :label="0">下架</el-radio>
      </el-radio-group>
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="submitForm">确定</el-button>
      <el-button @click="$emit('cancel')">取消</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  type: {
    type: String,
    required: true
  },
  productData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['submit', 'cancel'])

// 表单ref
const formRef = ref(null)

// 表单数据
const formData = reactive({
  name: '',
  categoryId: '',
  price: 0,
  stock: 0,
  images: [],
  description: '',
  specs: [],
  isCustomizable: false,
  status: 1
})

// 分类选项
const categoryOptions = ref([
  { id: 1, name: '服装' },
  { id: 2, name: '首饰' },
  { id: 3, name: '皮具' },
  { id: 4, name: '家居' }
])

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入商品名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择商品分类', trigger: 'change' }
  ],
  price: [
    { required: true, message: '请输入商品价格', trigger: 'blur' }
  ],
  stock: [
    { required: true, message: '请输入商品库存', trigger: 'blur' }
  ],
  images: [
    { required: true, message: '请上传商品图片', trigger: 'change' }
  ]
}

// 图片上传相关
const dialogImageUrl = ref('')
const dialogVisible = ref(false)

const handleRemove = (uploadFile, uploadFiles) => {
  const index = formData.images.indexOf(uploadFile.url)
  if (index > -1) {
    formData.images.splice(index, 1)
  }
}

const handlePictureCardPreview = (uploadFile) => {
  dialogImageUrl.value = uploadFile.url
  dialogVisible.value = true
}

const handleUploadSuccess = (response, uploadFile) => {
  formData.images.push(response.url)
}

// 规格相关
const addSpec = () => {
  formData.specs.push({
    name: '',
    options: []
  })
}

const removeSpec = (index) => {
  formData.specs.splice(index, 1)
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate((valid, fields) => {
    if (valid) {
      emit('submit', formData)
    } else {
      console.error('表单验证失败:', fields)
      return false
    }
  })
}

// 初始化表单数据
const initFormData = () => {
  if (props.productData) {
    Object.assign(formData, props.productData)
  }
}

onMounted(() => {
  initFormData()
})
</script>

<style scoped>
.product-form {
  padding: 20px;
}

.spec-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.product-uploader {
  :deep(.el-upload--picture-card) {
    width: 100px;
    height: 100px;
    line-height: 100px;
  }
}
</style> 