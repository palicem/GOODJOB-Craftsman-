<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside width="200px">
      <el-menu
        :default-active="$route.path"
        router
        class="el-menu-vertical"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF">
        <el-menu-item index="/dashboard">
          <el-icon><DataLine /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/products">
          <el-icon><Goods /></el-icon>
          <span>商品管理</span>
        </el-menu-item>
        <el-menu-item index="/orders">
          <el-icon><List /></el-icon>
          <span>订单管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主要内容区 -->
    <el-container>
      <el-header>
        <div class="header-left">
          <!-- 店铺切换下拉框 -->
          <el-select 
            v-model="currentShop" 
            placeholder="请选择店铺"
            style="width: 200px; margin-right: 10px;"
            @change="handleShopChange">
            <el-option
              v-for="shop in shopList"
              :key="shop.id"
              :label="shop.name"
              :value="shop.id">
              <div class="shop-option">
                <span>{{ shop.name }}</span>
                <el-tag 
                  v-if="shop.status === 'pending'" 
                  size="small" 
                  type="warning"
                >审核中</el-tag>
                <el-tag 
                  v-if="shop.status === 'inactive'" 
                  size="small" 
                  type="danger"
                >已停用</el-tag>
              </div>
            </el-option>
            <el-option value="apply" class="apply-option">
              <div class="apply-shop">
                <el-icon><Plus /></el-icon>
                申请新店铺
              </div>
            </el-option>
          </el-select>

           <!-- 编辑当前店铺按钮 -->
          <el-button 
            type="primary" 
            plain 
            @click="handleEditShop" 
            :disabled="!currentShop || currentShop === 'apply' || currentShopInfo?.status === 'pending' || currentShopInfo?.status === 'inactive'"
          >
            编辑店铺信息
          </el-button>

          <!-- 店铺状态提示 -->
          <div v-if="currentShopInfo && currentShopInfo.status === 'inactive'" class="shop-status-warning">
            <el-alert
              title="店铺已被停用"
              type="warning"
              :closable="false"
              show-icon
              style="margin-left: 10px"
            >
              <template #default>
                请联系管理员处理
              </template>
            </el-alert>
          </div>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="goToAdmin">管理员入口</el-button>
        </div>
      </el-header>

      <el-main>
        <router-view></router-view>
      </el-main>
    </el-container>
  </el-container>

  <!-- 管理员验证对话框 -->
  <el-dialog
    v-model="adminDialogVisible"
    title="管理员验证"
    width="300px">
    <p style="text-align: center; margin: 0;">确认进入管理员模式？</p>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="adminDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="verifyAdmin">确认</el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 申请店铺对话框 -->
  <el-dialog
    v-model="applyShopDialogVisible"
    title="申请新店铺"
    width="600px"
  >
    <el-form
      ref="shopFormRef"
      :model="shopForm"
      :rules="shopRules"
      label-width="100px"
    >
      <el-form-item label="店铺名称" prop="name">
        <el-input v-model="shopForm.name" placeholder="请输入店铺名称" />
      </el-form-item>

      <el-form-item label="店铺Logo">
        <el-upload
          class="logo-uploader"
          action="/api/upload"
          :show-file-list="false"
          :on-success="handleLogoSuccess"
          :before-upload="beforeLogoUpload"
        >
          <img v-if="shopForm.logo" :src="shopForm.logo" class="logo" />
          <el-icon v-else class="logo-uploader-icon"><Plus /></el-icon>
        </el-upload>
        <div class="upload-tip">建议上传正方形图片，大小不超过2MB</div>
      </el-form-item>

      <el-form-item label="店铺描述">
        <el-input
          v-model="shopForm.description"
          type="textarea"
          rows="4"
          placeholder="请输入店铺描述"
        />
      </el-form-item>

      <el-form-item label="店铺位置">
        <el-input v-model="shopForm.location" placeholder="请输入店铺位置" />
      </el-form-item>

      <el-form-item label="联系信息">
        <el-input v-model="shopForm.contact_info" placeholder="请输入联系电话、邮箱等" />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="applyShopDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitShopForm">提交申请</el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 添加编辑店铺信息对话框 -->
  <el-dialog
    v-model="editShopDialogVisible"
    title="编辑店铺信息"
    width="600px"
  >
    <el-form
      ref="editShopFormRef"
      :model="editShopForm"
      :rules="editShopRules"
      label-width="100px"
    >
      <el-form-item label="店铺名称" prop="name">
        <el-input v-model="editShopForm.name" placeholder="请输入店铺名称" />
      </el-form-item>

      <el-form-item label="店铺Logo">
        <el-upload
          class="logo-uploader"
          action="/api/upload"
          :show-file-list="false"
          :on-success="handleEditLogoSuccess"
          :before-upload="beforeLogoUpload"
        >
          <img v-if="editShopForm.logo" :src="editShopForm.logo" class="logo" />
          <el-icon v-else class="logo-uploader-icon"><Plus /></el-icon>
        </el-upload>
        <div class="upload-tip">建议上传正方形图片，大小不超过2MB</div>
      </el-form-item>

      <el-form-item label="店铺描述" prop="description">
        <el-input
          v-model="editShopForm.description"
          type="textarea"
          rows="4"
          placeholder="请输入店铺描述"
        />
      </el-form-item>

      <el-form-item label="店铺位置" prop="location">
        <el-input v-model="editShopForm.location" placeholder="请输入店铺位置" />
      </el-form-item>

      <el-form-item label="联系信息" prop="contact_info">
        <el-input v-model="editShopForm.contact_info" placeholder="请输入联系电话、邮箱等" />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="editShopDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEditShop">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { DataLine, Goods, List, Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as shopService from '@/services/shopService'
import { globalCurrentShopId, updateGlobalShopId } from '@/store/shopStore.js';

const router = useRouter()
const route = useRoute()

const currentShop = ref(globalCurrentShopId.value);
const shopList = ref([])

watch(globalCurrentShopId, (newId) => {
  if (currentShop.value !== newId) {
    currentShop.value = newId;
  }
});

const applyShopDialogVisible = ref(false)
const shopFormRef = ref(null)
const shopForm = reactive({
  name: '',
  logo: '',
  description: '',
  location: '',
  contact_info: ''
})

const shopRules = {
  name: [
    { required: false, message: '请输入店铺名称', trigger: 'blur' }
  ]
}

const handleLogoSuccess = (res) => {
  shopForm.logo = res.data.url
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

const saveShopList = () => {
  localStorage.setItem('shopList', JSON.stringify(shopList.value))
}

const currentShopInfo = computed(() => {
  return shopList.value.find(shop => shop.id === globalCurrentShopId.value)
})

const loadShopList = () => {
  const savedShopList = localStorage.getItem('shopList')
  if (savedShopList) {
    const allShops = JSON.parse(savedShopList)
    
    const lastAppliedShopName = localStorage.getItem('lastAppliedShopName')
    if (lastAppliedShopName) {
      const isApproved = allShops.some(shop => 
        shop.name === lastAppliedShopName && shop.status === 'active'
      )
      
      if (!isApproved && !allShops.some(s => s.name === lastAppliedShopName && s.status === 'pending')) {
        allShops.push({
          id: 'SHOP_PENDING_' + Date.now(),
          name: lastAppliedShopName,
          logo: localStorage.getItem('lastAppliedShopLogo') || '',
          description: localStorage.getItem('lastAppliedShopDescription') || '',
          location: localStorage.getItem('lastAppliedShopLocation') || '',
          status: 'pending'
        })
      }
    }
    
    shopList.value = allShops.filter(shop => shop.id && shop.name);
  } else {
    // TODO: Replace this with a call to a backend API to fetch all available shops
    // For now, using a default list and ensuring all known shops are present
    const defaultShops = [
      { 
        id: 'shop001', 
        name: '优选服饰旗舰店',
        logo: '', // Populate with actual logo URL if available
        description: '专注高品质服装定制',
        location: '广东省深圳市',
        status: 'active',
        created_at: '2024-03-01 10:25:36'
      },
      { 
        id: 'shop002', 
        name: '潮流配饰馆',
        logo: '', // Populate with actual logo URL if available
        description: '个性化饰品定制专家',
        location: '浙江省杭州市',
        status: 'active',
        created_at: '2024-03-01 09:15:22'
      },
      {
        id: 'shop003',
        name: '家居优品店',
        logo: '', // Populate with actual logo URL if available
        description: '优质家居与生活用品',
        location: '上海', // Assuming from previous data
        status: 'active',
        created_at: '2024-03-01 10:00:00' // Example date
      }
    ]
    shopList.value = defaultShops
    saveShopList()
  }
}

const submitShopForm = async () => {
  try {
    const shopIdToApply = 'SHOP_APPLY_' + Date.now();
    const shopData = {
      id: shopIdToApply, 
      name: shopForm.name || `新店铺申请-${Date.now().toString().slice(-4)}`, 
      logo: shopForm.logo || '',
      description: shopForm.description || '暂无描述',
      location: shopForm.location || '暂未设置',
      contact_info: shopForm.contact_info || '',
      status: 'pending' 
    }

    localStorage.setItem('lastAppliedShopName', shopData.name)
    localStorage.setItem('lastAppliedShopLogo', shopData.logo)
    localStorage.setItem('lastAppliedShopDescription', shopData.description)
    localStorage.setItem('lastAppliedShopLocation', shopData.location)
    localStorage.setItem('lastAppliedShopContactInfo', shopData.contact_info)
    
    loadShopList();
    
    ElMessage.success('店铺申请已提交，请等待管理员审核')
    applyShopDialogVisible.value = false
    shopForm.name = ''
    shopForm.logo = ''
    shopForm.description = ''
    shopForm.location = ''
    shopForm.contact_info = ''

  } catch (error) {
    ElMessage.error(`提交失败: ${error.message || '请重试'}`)
  }
}

const handleShopChange = (selectedShopId) => {
  if (selectedShopId === 'apply') {
    applyShopDialogVisible.value = true
    currentShop.value = globalCurrentShopId.value;
    return
  }

  const targetShop = shopList.value.find(shop => shop.id === selectedShopId)
  if (targetShop) {
    if (targetShop.status === 'pending') {
      ElMessage.warning('该店铺正在审核中，暂时无法切换')
      currentShop.value = globalCurrentShopId.value;
      return
    }
    if (targetShop.status === 'inactive') {
      ElMessage.warning('该店铺已被停用，部分功能可能受限')
    }
    updateGlobalShopId(selectedShopId);
    ElMessage.success(`已切换到店铺: ${targetShop.name}`);
  } else {
    currentShop.value = globalCurrentShopId.value;
  }
}

const adminDialogVisible = ref(false)

const goToAdmin = () => {
  adminDialogVisible.value = true
}

const verifyAdmin = () => {
  adminDialogVisible.value = false
  router.push('/admin/dashboard')
}

const initShop = () => {
  loadShopList()
  currentShop.value = globalCurrentShopId.value;

  if (!globalCurrentShopId.value && shopList.value.length > 0) {
    const firstAvailableShop = shopList.value.find(shop => shop.status === 'active');
    if (firstAvailableShop) {
      updateGlobalShopId(firstAvailableShop.id);
    } else if (shopList.value.length > 0 && shopList.value[0].id !== 'apply' && shopList.value[0].status !== 'pending' && shopList.value[0].status !== 'inactive') {
      updateGlobalShopId(shopList.value[0].id);
    }
  }
}

watch(shopList, () => {
  saveShopList()
}, { deep: true })

onMounted(() => {
  initShop()
})

const editShopDialogVisible = ref(false)
const editShopFormRef = ref(null)
const editShopForm = reactive({
  id: '',
  name: '',
  logo: '',
  description: '',
  location: '',
  contact_info: ''
})

const editShopRules = {
  name: [
    { required: true, message: '请输入店铺名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { required: false, message: '请输入店铺描述', trigger: 'blur' }
  ],
  location: [
    { required: false, message: '请输入店铺位置', trigger: 'blur' }
  ]
}

const handleEditShop = async () => {
  const currentShopIdToEdit = globalCurrentShopId.value;
  if (!currentShopIdToEdit || currentShopIdToEdit === 'apply') {
    ElMessage.warning('请先选择一个有效的店铺进行编辑');
    return;
  }
  
  const shopToEdit = shopList.value.find(s => s.id === currentShopIdToEdit);
  if (shopToEdit && shopToEdit.status === 'pending') {
      ElMessage.warning('审核中的店铺信息无法编辑，请等待审核通过。');
      return;
  }
   if (shopToEdit && shopToEdit.status === 'inactive') {
      ElMessage.warning('已停用的店铺信息通常不允许商家自行编辑，请联系管理员。');
      return; 
  }

  try {
    const response = await shopService.getShopProfile(currentShopIdToEdit); 
    const currentShopData = response; 

  if (currentShopData) {
      editShopForm.id = currentShopData.shop_id || currentShopIdToEdit; 
      editShopForm.name = currentShopData.name;
      editShopForm.logo = currentShopData.logo;
      editShopForm.description = currentShopData.description;
      editShopForm.location = currentShopData.location;
      editShopForm.contact_info = currentShopData.contact_info;
      editShopDialogVisible.value = true;
    } else {
      ElMessage.error('获取店铺信息失败，无法编辑');
    }
  } catch (error) {
    console.error('获取店铺详情失败:', error);
    ElMessage.error(`获取店铺详情失败: ${error.message || '请重试'}`);
    const localShopData = shopList.value.find(s => s.id === currentShopIdToEdit);
    if (localShopData) {
        ElMessage.info('从本地缓存加载店铺信息进行编辑。');
        editShopForm.id = localShopData.id;
        editShopForm.name = localShopData.name;
        editShopForm.logo = localShopData.logo;
        editShopForm.description = localShopData.description;
        editShopForm.location = localShopData.location;
        editShopForm.contact_info = localShopData.contact_info;
        editShopDialogVisible.value = true;
    }
  }
};

const handleEditLogoSuccess = (res) => {
  editShopForm.logo = res.data.url
  ElMessage.success('Logo上传成功')
}

const submitEditShop = async () => {
  if (!editShopFormRef.value) return
  
  await editShopFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const profileData = { 
          name: editShopForm.name,
          logo: editShopForm.logo,
          description: editShopForm.description,
          location: editShopForm.location,
          contact_info: editShopForm.contact_info
        };
        
        const updatedProfile = await shopService.updateShopProfile(editShopForm.id, profileData);
        
        const savedShopList = localStorage.getItem('shopList');
        let allShops = savedShopList ? JSON.parse(savedShopList) : [];
        
        const shopIndex = allShops.findIndex(shop => shop.id === editShopForm.id);
        if (shopIndex !== -1) {
          allShops[shopIndex] = {
            ...allShops[shopIndex],
            id: updatedProfile.shop_id || editShopForm.id, 
            name: updatedProfile.name,
            logo: updatedProfile.logo,
            description: updatedProfile.description,
            location: updatedProfile.location,
            contact_info: updatedProfile.contact_info,
            updated_at: new Date().toLocaleString()
          };
          
          localStorage.setItem('shopList', JSON.stringify(allShops));
          shopList.value = [...allShops]; 
        }
          
        ElMessage.success('店铺信息更新成功');
        editShopDialogVisible.value = false;
      } catch (error) {
        console.error('更新店铺信息失败:', error);
        ElMessage.error(`更新失败: ${error.response?.data?.message || error.message || '请重试'}`);
      }
    }
  })
}
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
}

.el-menu-vertical {
  height: 100vh;
  border-right: none;
}

.el-header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.header-left, .header-right {
  display: flex;
  align-items: center;
}

.el-main {
  background-color: #f0f2f5;
  padding: 20px;
}

.apply-option {
  border-top: 1px solid #EBEEF5;
}

.apply-shop {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #409EFF;
}

.el-select-dropdown__item.apply-option:hover {
  color: #409EFF;
}

/* 店铺申请表单样式 */
.logo-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 120px;
  height: 120px;
  display: flex;
  justify-content: center;
  align-items: center;

  &:hover {
    border-color: #409EFF;
  }
}

.logo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.upload-tip {
  font-size: 12px;
  color: #666;
  margin-top: 8px;
}

.header-left {
  display: flex;
  align-items: center;
}

.shop-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.shop-status-warning {
  max-width: 300px;
}

:deep(.el-alert) {
  padding: 8px 16px;
  margin: 0;
}

:deep(.el-alert__title) {
  font-size: 13px;
}
</style> 