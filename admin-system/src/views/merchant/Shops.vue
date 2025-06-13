<template>
  <div class="merchant-shops-container">
    <div class="header">
      <h2>我的店铺</h2>
      <el-button type="primary" @click="$router.push('/merchant/shops/create')">创建店铺</el-button>
    </div>

    <!-- 店铺列表 -->
    <el-row :gutter="20" class="shop-list">
      <el-col :span="8" v-for="shop in shopList" :key="shop.id">
        <el-card 
          :class="['shop-card', { active: currentShopId === shop.id }]"
          @click="switchShop(shop)"
        >
          <div class="shop-info">
            <el-image
              :src="shop.logo"
              fit="cover"
              class="shop-logo"
            />
            <div class="shop-details">
              <h3 class="shop-name">{{ shop.name }}</h3>
              <p class="shop-category">{{ shop.category }}</p>
              <p class="shop-status">
                <el-tag :type="getStatusType(shop.status)" size="small">
                  {{ getStatusText(shop.status) }}
                </el-tag>
              </p>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 申请中的店铺 -->
      <el-col :span="8" v-for="application in applicationList" :key="application.id">
        <el-card :class="['shop-card', application.status === 'pending' ? 'pending' : '', application.status === 'rejected' ? 'rejected-card' : '']">
          <div class="shop-info">
            <el-image
              :src="application.logo"
              fit="cover"
              class="shop-logo"
            />
            <div class="shop-details">
              <h3 class="shop-name">{{ application.name }}</h3>
              <p class="shop-category">{{ application.category }}</p>
              <p class="shop-status">
                <el-tag :type="getStatusType(application.status)" size="small">
                  {{ getStatusText(application.status) }}
                </el-tag>
              </p>
              <div v-if="application.status === 'rejected'" class="rejection-info">
                <p class="reject-reason"><strong>拒绝原因:</strong> {{ application.rejectReason || '未提供原因' }}</p>
                <el-button type="warning" size="small" @click="reapplyShop(application)" class="reapply-button">
                  重新申请
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()

// 店铺列表数据
const shopList = ref([
  {
    id: 'SHOP001',
    name: '优选服饰旗舰店',
    logo: 'https://placeholder.com/150x150',
    category: '服装服饰',
    status: 'active',
    description: '专注高品质服装定制'
  }
])

// 申请中的店铺列表
const applicationList = ref([])

// 当前选中的店铺ID
const currentShopId = ref('SHOP001')

// 获取店铺列表
const getShopList = async () => {
  try {
    // TODO: 调用API获取店铺列表
    // const res = await api.getMerchantShops()
    // shopList.value = res.data.shops
  } catch (error) {
    console.error('获取店铺列表失败:', error)
    ElMessage.error('获取店铺列表失败')
  }
}

// 获取申请中的店铺列表
const getApplicationList = async () => {
  try {
    // TODO: 调用API获取申请列表 (this should be the primary source)
    // const res = await api.getMerchantApplications();
    // applicationList.value = res.data.applications; // Предположим, это заполняет applicationList

    // --- Process localStorage application status ---
    const lastAppliedShopName = localStorage.getItem('lastAppliedShopName');
    if (lastAppliedShopName) {
      const rejectionStatusRaw = localStorage.getItem(`shop_application_status_${lastAppliedShopName}`);
      let rejectionInfo = null;
      if (rejectionStatusRaw) {
        try {
          rejectionInfo = JSON.parse(rejectionStatusRaw);
        } catch (e) {
          console.error('Error parsing rejection status from localStorage:', e);
        }
      }

      const existingInApiList = applicationList.value.find(app => app.name === lastAppliedShopName);

      if (existingInApiList) {
        // If shop exists in the list (presumably from API), update its status if rejected
        if (rejectionInfo && rejectionInfo.status === 'rejected' && rejectionInfo.name === lastAppliedShopName) {
          existingInApiList.status = 'rejected';
          existingInApiList.rejectReason = rejectionInfo.reason;
        }
        // If API already provided a status (e.g. approved, or a more up-to-date pending), we might not want to override it unless specifically rejected by admin via localStorage path
      } else {
        // If shop is not in API list, it might be a purely local (new) application
        // Construct it and apply rejection status if present
        const newApplication = {
          id: `local_app_${lastAppliedShopName}`,
          name: lastAppliedShopName,
          logo: localStorage.getItem('lastAppliedShopLogo') || 'https://placeholder.com/150x150',
          category: localStorage.getItem('lastAppliedShopCategory') || '类目待定',
          description: localStorage.getItem('lastAppliedShopDescription') || '',
          location: localStorage.getItem('lastAppliedShopLocation') || '',
          contact_info: localStorage.getItem('lastAppliedShopContactInfo') || '',
          status: 'pending', // Default to pending
          rejectReason: ''
        };

        if (rejectionInfo && rejectionInfo.status === 'rejected' && rejectionInfo.name === lastAppliedShopName) {
          newApplication.status = 'rejected';
          newApplication.rejectReason = rejectionInfo.reason;
        }
        applicationList.value.push(newApplication);
      }
    }
    // Clear lastAppliedShopName after processing it once, to avoid re-adding indefinitely if no API call clears it
    // localStorage.removeItem('lastAppliedShopName'); // Consider if this is the right place

  } catch (error) {
    console.error('获取申请列表失败:', error)
    ElMessage.error('获取申请列表失败')
  }
}

// 切换店铺
const switchShop = (shop) => {
  if (shop.status !== 'active') {
    ElMessage.warning('该店铺暂时无法访问')
    return
  }
  
  currentShopId.value = shop.id
  // TODO: 存储当前选中的店铺ID
  localStorage.setItem('currentShopId', shop.id)
  // 触发全局状态更新
  // store.commit('setCurrentShop', shop)
  
  // 刷新页面或更新数据
  router.push(`/merchant/dashboard`)
}

// 获取状态类型
const getStatusType = (status) => {
  const types = {
    active: 'success',
    inactive: 'info',
    suspended: 'danger',
    pending: 'warning', // Added for applications
    rejected: 'danger'  // Added for rejected applications
  }
  return types[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    active: '正常营业',
    inactive: '未营业',
    suspended: '已停业',
    pending: '审核中', // Added
    rejected: '已拒绝'  // Added
  }
  return texts[status] || status
}

// 新增：重新申请店铺
const reapplyShop = (application) => {
  // Clear rejection status from localStorage so it doesn't immediately show as rejected again
  localStorage.removeItem(`shop_application_status_${application.name}`);
  
  router.push({
    name: 'MerchantShopApplication', // Assuming you have a named route for ShopApplication.vue
    query: {
      reapply: 'true',
      name: application.name,
      logo: application.logo,
      description: application.description,
      location: application.location,
      contact_info: application.contact_info, // Make sure this exists on application object
      category: application.category         // Make sure this exists on application object
    }
  });
}

onMounted(() => {
  // 获取数据
  getShopList()
  getApplicationList()
  
  // 从本地存储获取当前店铺ID
  const savedShopId = localStorage.getItem('currentShopId')
  if (savedShopId) {
    currentShopId.value = savedShopId
  }
})
</script>

<style scoped>
.merchant-shops-container {
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

.shop-list {
  margin-top: 20px;
}

.shop-card {
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  }

  &.active {
    border: 2px solid var(--el-color-primary);
  }

  &.pending {
    opacity: 0.8;
    cursor: not-allowed;
  }

  &.rejected-card {
    border-color: var(--el-color-danger);
    background-color: #fef0f0; /* Light red background for rejected cards */
  }
}

.shop-info {
  display: flex;
  align-items: flex-start;
  gap: 15px;
}

.shop-logo {
  width: 80px;
  height: 80px;
  border-radius: 4px;
}

.shop-details {
  flex: 1;

  .shop-name {
    margin: 0 0 8px;
    font-size: 16px;
    font-weight: 500;
  }

  .shop-category {
    margin: 0 0 8px;
    font-size: 14px;
    color: #666;
  }

  .shop-status {
    margin: 0;
    margin-bottom: 8px; /* Add some space before reject reason */
  }
}

.rejection-info {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.reject-reason {
  font-size: 13px;
  color: var(--el-color-danger);
  margin-bottom: 10px;
  white-space: pre-wrap; /* To respect newlines in reason */
}

.reapply-button {
  width: 100%;
}
</style> 