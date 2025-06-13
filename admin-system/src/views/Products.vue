<template>
  <div class="products-container">
    <div class="page-header">
      <h2>商品管理</h2>
      <el-button type="primary" @click="handleAdd">添加商品</el-button>
    </div>

    <el-table :data="productList" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="商品ID" width="120" />
      <el-table-column label="商品图片" width="120">
        <template #default="scope">
          <el-image 
            style="width: 50px; height: 50px"
            :src="(Array.isArray(scope.row.images) && scope.row.images.length > 0) ? scope.row.images[0] : ''"
            :preview-src-list="Array.isArray(scope.row.images) ? scope.row.images : []">
          </el-image>
        </template>
      </el-table-column>
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
            @click="handleDelete(scope.row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加编辑商品对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="editingProduct.id ? '编辑商品' : '添加商品'"
      width="700px"
    >
      <el-form
        ref="productFormRef"
        :model="editingProduct"
        :rules="productRules"
        label-width="100px"
      >
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="editingProduct.name" placeholder="请输入商品名称" />
        </el-form-item>

        <el-form-item label="商品图片" prop="images">
          <el-upload
            class="product-images-uploader"
            action="/api/upload"
            :show-file-list="true"
            :file-list="imageList"
            list-type="picture-card"
            :on-success="handleImageSuccess"
            :before-upload="beforeImageUpload"
            :on-remove="handleImageRemove"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>

        <el-form-item label="商品价格" prop="price">
          <el-input-number 
            v-model="editingProduct.price" 
            :precision="2" 
            :step="0.1" 
            :min="0"
          />
        </el-form-item>

        <el-form-item label="原价" prop="original_price">
          <el-input-number 
            v-model="editingProduct.original_price" 
            :precision="2" 
            :step="0.1" 
            :min="0"
          />
        </el-form-item>

        <el-form-item label="库存" prop="stock">
          <el-input-number 
            v-model="editingProduct.stock" 
            :min="0" 
            :precision="0"
          />
        </el-form-item>

        <el-form-item label="商品分类" prop="category_id">
          <el-select v-model="editingProduct.category_id" placeholder="请选择分类">
            <el-option
              v-for="item in categories"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="发货地" prop="location">
          <el-input v-model="editingProduct.location" placeholder="请输入发货地" />
        </el-form-item>

        <el-form-item label="商品描述" prop="description">
          <el-input
            v-model="editingProduct.description"
            type="textarea"
            rows="4"
            placeholder="请输入商品描述"
          />
        </el-form-item>

        <el-form-item label="商品状态" prop="status">
          <el-radio-group v-model="editingProduct.status">
            <el-radio :label="1">上架</el-radio>
            <el-radio :label="0">下架</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="可定制" prop="is_customizable">
          <el-switch v-model="editingProduct.is_customizable" />
        </el-form-item>

        <el-form-item label="商品规格" v-if="editingProduct.is_customizable">
          <div v-for="(spec, index) in specs" :key="index" class="spec-item">
            <el-input
              v-model="spec.name"
              placeholder="规格名称"
              style="width: 150px; margin-right: 10px"
            />
            <el-select
              v-model="spec.options"
              multiple
              filterable
              allow-create
              default-first-option
              placeholder="请输入规格选项"
              style="width: 300px"
            />
            <el-button type="danger" @click="removeSpec(index)" style="margin-left: 10px">
              删除
            </el-button>
          </div>
          <el-button type="primary" @click="addSpec" style="margin-top: 10px">
            添加规格
          </el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitProduct">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import * as shopService from '@/services/shopService'
import { globalCurrentShopId } from '@/store/shopStore.js';

// Helper function to generate a pseudo ObjectId
const generatePseudoObjectId = () => {
  let result = '';
  const characters = '0123456789abcdef';
  for (let i = 0; i < 24; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const loading = ref(false)
const productList = ref([])
const total = ref(0)

watch(globalCurrentShopId, (newShopId, oldShopId) => {
  if (newShopId) {
    loadProducts(newShopId);
  } else {
    productList.value = []
    total.value = 0
  }
})

const loadProducts = async (shopToLoad) => {
  if (!shopToLoad) {
    productList.value = []
    total.value = 0
    return
  }

  loading.value = true
  try {
    const response = await shopService.getProductList(shopToLoad)
    if (response && response.success && Array.isArray(response.data)) {
      productList.value = response.data
      total.value = response.total || response.data.length
    } else if (Array.isArray(response)) {
      productList.value = response
      total.value = response.length
    } else {
      console.error('获取商品列表失败，响应数据格式不正确:', response)
      ElMessage.error(response?.message || '获取商品列表数据格式不正确')
      productList.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取商品列表失败:', error)
    ElMessage.error('获取商品列表失败')
    productList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  const currentSelectedShop = globalCurrentShopId.value;
  if (!currentSelectedShop) {
    ElMessage.warning('请先选择店铺')
    return
  }
  
  Object.assign(editingProduct, {
    _id: undefined,
    product_id: '',
    shop_id: currentSelectedShop,
    category_id: null, 
    name: '',
    description: '',
    price: 0,
    original_price: 0,
    images: [],
    detail_images: [],
    stock: 0,
    location: '',
    status: 1,
    is_customizable: false, 
    specs: [] 
  })
  
  imageList.value = []
  specs.value = []
  editDialogVisible.value = true
}

const editDialogVisible = ref(false)
const productFormRef = ref(null)
const editingProduct = reactive({
  product_id: '',
  shop_id: '',
  category_id: null,
  name: '',
  description: '',
  price: 0,
  original_price: 0,
  images: [],
  detail_images: [],
  stock: 0,
  location: '',
  status: 1,
  is_customizable: false,
  specs: []
})

const imageList = ref([])
const specs = ref([])
const categories = ref([
  { id: 1, name: '服装' },
  { id: 2, name: '饰品' },
  { id: 3, name: '家居' }
])

const productRules = {
  name: [
    { required: true, message: '请输入商品名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  category_id: [
    // { required: true, message: '请选择商品分类', trigger: 'change' } // Made non-mandatory
  ],
  price: [{ type: 'number', message: '价格必须为数字'}],
  stock: [{ type: 'number', message: '库存必须为数字'}]
}

const handleEdit = async (row) => {
  console.log('Editing product, row data:', JSON.parse(JSON.stringify(row)));
  const currentSelectedShop = globalCurrentShopId.value;
  if (!currentSelectedShop) {
    ElMessage.warning('请先选择店铺');
    return;
  }
  
  const productId = row.id || row.product_id; // 使用 row.id 或 row.product_id
  if (!productId) {
    ElMessage.error('商品ID缺失，无法编辑');
    console.error('Missing product_id or id in row:', row);
    return;
  }

  try {
    console.log('Fetching product detail for shop:', currentSelectedShop, 'product:', productId);
    const productDetailResponse = await shopService.getProductDetail(currentSelectedShop, productId);
    console.log('Product detail response from service:', JSON.parse(JSON.stringify(productDetailResponse)));

    if (!productDetailResponse || !productDetailResponse.success || !productDetailResponse.data) {
      ElMessage.error(productDetailResponse?.message || '获取商品详情失败或数据格式不正确');
      console.error('Invalid product detail response:', productDetailResponse);
      return;
    }
    const productDetail = productDetailResponse.data;

    const images = Array.isArray(productDetail.images) ? productDetail.images : [];
    
    Object.assign(editingProduct, {
      ...productDetail, // 确保 productDetail 包含所有需要的字段，包括 product_id
      id: productDetail.id || productDetail.product_id, // 确保 editingProduct.id 被正确赋值
      product_id: productDetail.product_id || productDetail.id, // 也保留 product_id
      images: images,
      shop_id: productDetail.shop_id || currentSelectedShop // 优先使用商品详情中的 shop_id
    });
    console.log('editingProduct after assign:', JSON.parse(JSON.stringify(editingProduct)));

    imageList.value = images.map(url => ({
      name: url.substring(url.lastIndexOf('/') + 1),
      url: url,
      status: 'success',
      uid: Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    }));
    
    specs.value = productDetail.specs || [];
    editDialogVisible.value = true;
  } catch (error) {
    ElMessage.error(`获取商品详情失败: ${error.response?.data?.message || error.message}`);
    console.error('Error fetching product detail:', error);
  }
};

const handleImageSuccess = (response, file, fileList) => {
  imageList.value = fileList.map(f => ({ 
    name: f.name,
    url: f.response ? f.response.url : f.url, 
    status: 'success',
    uid: f.uid
  }))
  editingProduct.images = imageList.value.filter(f => f.url).map(f => f.url)
}

const beforeImageUpload = (file) => {
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

const handleImageRemove = (file, fileList) => {
  imageList.value = fileList.map(f => ({ 
    name: f.name,
    url: f.url,
    status: 'success',
    uid: f.uid
  }))
  editingProduct.images = imageList.value.filter(f => f.url).map(f => f.url)
  }

const addSpec = () => {
  specs.value.push({
    name: '',
    options: []
  })
}

const removeSpec = (index) => {
  specs.value.splice(index, 1)
}

const submitProduct = async () => {
  if (!productFormRef.value) return
  const currentSelectedShop = globalCurrentShopId.value;
  if (!currentSelectedShop) {
    ElMessage.error('当前店铺ID丢失，无法保存商品')
    return
  }
  
  await productFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // Default category_id if not selected, assign a pseudo ObjectId
        if (!editingProduct.category_id && editingProduct.category_id !== 0) { // Check for null, undefined, '' but allow 0 if it's a valid ID
          editingProduct.category_id = generatePseudoObjectId();
        }

        const productData = {
          ...editingProduct,
          specs: specs.value,
          shop_id: currentSelectedShop
        }

        if (editingProduct.product_id) { 
          await shopService.updateProduct(currentSelectedShop, editingProduct.product_id, productData)
        } else {
          if (!productData.product_id) { 
            productData.product_id = 'PROD_' + Date.now(); 
          }
          await shopService.addProduct(currentSelectedShop, productData)
        }
        
        ElMessage.success(editingProduct.product_id ? '更新成功' : '添加成功')
        editDialogVisible.value = false
        loadProducts(currentSelectedShop)
      } catch (error) {
        ElMessage.error(`保存失败: ${error.response?.data?.message || error.message || '请重试'}`)
      }
    }
  })
}

const handleDelete = (row) => {
  const currentSelectedShop = globalCurrentShopId.value;
  if (!currentSelectedShop) {
    ElMessage.warning('请先选择店铺')
    return
  }
  ElMessageBox.confirm(
    '确定要删除该商品吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await shopService.deleteProduct(currentSelectedShop, row.product_id)
      ElMessage.success('删除成功')
      loadProducts(currentSelectedShop)
    } catch (error) {
      ElMessage.error(`删除失败: ${error.response?.data?.message || error.message}`)
    }
  }).catch(() => {
  })
}

onMounted(() => {
  if (globalCurrentShopId.value) {
    loadProducts(globalCurrentShopId.value);
  } else {
    productList.value = [];
    total.value = 0;
    ElMessage.info('请先在顶部选择一个店铺以查看商品。');
  }
})
</script>

<style scoped>
.products-container {
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

.product-images-uploader {
  :deep(.el-upload--picture-card) {
    width: 100px;
    height: 100px;
    line-height: 100px;
  }
}

.spec-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
</style> 