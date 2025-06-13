<template>
  <div class="shops-container">
    <div class="header">
      <h2>店铺管理</h2>
      <el-button type="primary" @click="showAddDialog">添加店铺</el-button>
    </div>

    <el-tabs v-model="activeTab">
      <!-- 店铺列表 -->
      <el-tab-pane label="店铺列表" name="list">
        <!-- 搜索栏 -->
        <div class="search-bar">
          <el-input
            v-model="searchForm.keyword"
            placeholder="输入店铺名称搜索"
            style="width: 250px; margin-right: 10px"
            clearable
            @keyup.enter="handleSearch"
          />
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </div>

        <!-- 店铺列表 -->
        <el-table
          :data="shopList"
          style="width: 100%; margin-top: 20px"
          v-loading="loading"
        >
          <el-table-column prop="name" label="店铺名称" min-width="200">
            <template #default="{ row }">
              <div class="shop-info">
                <el-image
                  :src="row.logo"
                  :preview-src-list="[row.logo]"
                  fit="cover"
                  class="shop-logo"
                />
                <span>{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="店铺描述" show-overflow-tooltip />
          <el-table-column prop="location" label="所在地" width="150" />
          <el-table-column prop="contact_info" label="联系信息" width="200" show-overflow-tooltip />
          <el-table-column prop="created_at" label="创建时间" width="180" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
                {{ row.status === 'active' ? '正常' : '已停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="250" fixed="right">
            <template #default="{ row }">
              <el-button 
                size="small"
                @click="handleEdit(row)"
              >编辑</el-button>
              <el-button
                size="small"
                :type="row.status === 'active' ? 'warning' : 'success'"
                @click="handleToggleStatus(row)"
              >
                {{ row.status === 'active' ? '停用' : '启用' }}
              </el-button>
              <el-button
                size="small"
                type="danger"
                @click="handleDelete(row)"
              >删除</el-button>
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
          />
        </div>
      </el-tab-pane>

      <!-- 店铺申请 -->
      <el-tab-pane label="店铺申请" name="applications">
        <el-table
          :data="applicationList"
          style="width: 100%"
          v-loading="applicationLoading"
        >
          <el-table-column label="申请信息" min-width="300">
            <template #default="{ row }">
              <div class="application-info">
                <el-image
                  :src="row.logo"
                  :preview-src-list="[row.logo]"
                  fit="cover"
                  class="shop-logo"
                />
                <div class="info-content">
                  <div class="shop-name">{{ row.name }}</div>
                  <div class="description">{{ row.description }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="联系电话" width="200">
            <template #default="{ row }">
              <div>{{ row.contactPhone }}</div>
            </template>
          </el-table-column>

          <el-table-column prop="address" label="经营地址" width="200" show-overflow-tooltip />

          <el-table-column prop="created_at" label="申请时间" width="180" />

          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button 
                v-if="row.status === 'pending'"
                type="success"
                size="small"
                @click="handleApprove(row)"
              >通过</el-button>
              <el-button
                v-if="row.status === 'pending'"
                type="danger"
                size="small"
                @click="handleReject(row)"
              >拒绝</el-button>
              <el-button
                type="info"
                size="small"
                @click="showApplicationDetail(row)"
              >详情</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 申请列表分页 -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="applicationCurrentPage"
            v-model:page-size="applicationPageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            :total="applicationTotal"
            @size-change="handleApplicationSizeChange"
            @current-change="handleApplicationCurrentChange"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 添加/编辑店铺对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '添加店铺' : '编辑店铺'"
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
        <el-form-item label="店铺logo" prop="logo">
          <el-upload
            class="logo-uploader"
            action="/api/upload"
            :show-file-list="false"
            :on-success="handleLogoSuccess"
            :before-upload="beforeLogoUpload"
          >
            <el-image
              v-if="shopForm.logo"
              :src="shopForm.logo"
              class="logo-preview"
            />
            <el-icon v-else class="logo-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="店铺描述" prop="description">
          <el-input
            v-model="shopForm.description"
            type="textarea"
            rows="3"
            placeholder="请输入店铺描述"
          />
        </el-form-item>
        <el-form-item label="所在地" prop="location">
          <el-input v-model="shopForm.location" placeholder="请输入店铺所在地" />
        </el-form-item>
        <el-form-item label="联系信息" prop="contact_info">
          <el-input v-model="shopForm.contact_info" placeholder="请输入联系电话、邮箱等" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitShop">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 申请详情对话框 -->
    <el-dialog
      v-model="applicationDetailVisible"
      title="申请详情"
      width="600px"
    >
      <div v-if="currentApplication" class="application-detail">
        <div class="detail-item">
          <label>店铺名称：</label>
          <span>{{ currentApplication.name }}</span>
        </div>
        <div class="detail-item">
          <label>经营类目：</label>
          <span>{{ currentApplication.category }}</span>
        </div>
        <div class="detail-item">
          <label>店铺描述：</label>
          <span>{{ currentApplication.description }}</span>
        </div>
        <div class="detail-item">
          <label>联系人：</label>
          <span>{{ currentApplication.contactPerson }}</span>
        </div>
        <div class="detail-item">
          <label>联系电话：</label>
          <span>{{ currentApplication.contactPhone }}</span>
        </div>
        <div class="detail-item">
          <label>经营地址：</label>
          <span>{{ currentApplication.address }}</span>
        </div>
        <div class="detail-item">
          <label>申请时间：</label>
          <span>{{ currentApplication.created_at }}</span>
        </div>
        <div class="detail-item">
          <label>状态：</label>
          <el-tag :type="getStatusType(currentApplication.status)">
            {{ getStatusText(currentApplication.status) }}
          </el-tag>
        </div>
      </div>
    </el-dialog>

    <!-- 拒绝原因对话框 -->
    <el-dialog
      v-model="rejectDialogVisible"
      title="拒绝原因"
      width="500px"
    >
      <el-form>
        <el-form-item label="拒绝原因" required>
          <el-input
            v-model="rejectReason"
            type="textarea"
            rows="3"
            placeholder="请输入拒绝原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="rejectDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmReject">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import * as shopService from '@/services/shopService'

const router = useRouter()

// 搜索表单
const searchForm = reactive({
  keyword: ''
})

// 列表数据
const loading = ref(false)
const shopList = ref([])
const applicationList = ref([])
const total = ref(100)

// 从本地存储加载数据
const loadShopData = () => {
  const savedShopList = localStorage.getItem('shopList')
  if (savedShopList) {
    // 不再过滤状态，显示所有店铺
    shopList.value = JSON.parse(savedShopList)
    total.value = shopList.value.length
  }
}

// 分页
const currentPage = ref(1)
const pageSize = ref(10)

// 对话框
const dialogVisible = ref(false)
const dialogType = ref('add')
const shopFormRef = ref(null)
const shopForm = reactive({
  name: '',
  logo: '',
  description: '',
  location: '',
  contact_info: ''
})

// 表单验证规则
const shopRules = {
  name: [
    { required: true, message: '请输入店铺名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入店铺描述', trigger: 'blur' }
  ],
  location: [
    { required: true, message: '请输入店铺所在地', trigger: 'blur' }
  ]
}

// 当前激活的标签页
const activeTab = ref('list')

// 申请列表相关
const applicationLoading = ref(false)
const applicationCurrentPage = ref(1)
const applicationPageSize = ref(10)
const applicationTotal = ref(100)

// 申请详情相关
const applicationDetailVisible = ref(false)
const currentApplication = ref(null)

// 拒绝对话框相关
const rejectDialogVisible = ref(false)
const rejectReason = ref('')
const rejectingApplication = ref(null)

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  getShopList()
}

// 获取店铺列表
const getShopList = async () => {
  loading.value = true
  try {
    // 从本地存储加载数据
    loadShopData()
    
    // 根据搜索关键词过滤
    if (searchForm.keyword) {
      shopList.value = shopList.value.filter(shop => 
        shop.name.toLowerCase().includes(searchForm.keyword.toLowerCase()) ||
        shop.description?.toLowerCase().includes(searchForm.keyword.toLowerCase())
      )
    }
  } catch (error) {
    console.error('获取店铺列表失败:', error)
    ElMessage.error('获取店铺列表失败')
  } finally {
    loading.value = false
  }
}

// 显示添加对话框
const showAddDialog = () => {
  dialogType.value = 'add'
  shopForm.name = ''
  shopForm.logo = ''
  shopForm.description = ''
  shopForm.location = ''
  shopForm.contact_info = ''
  dialogVisible.value = true
}

// 编辑店铺
const handleEdit = (shop) => {
  dialogType.value = 'edit'
  Object.assign(shopForm, shop)
  dialogVisible.value = true
}

// 切换店铺状态
const handleToggleStatus = (shop) => {
  const action = shop.status === 'active' ? '停用' : '启用';
  const actionDescription = shop.status === 'active' 
    ? '停用后，该店铺及其商品在用户端将不可见，但您仍可在商家后台管理。'
    : '启用后，该店铺及其商品将在用户端恢复可见。';

  ElMessageBox.confirm(
    `确定要${action}店铺 "${shop.name}" 吗？<br/><small>${actionDescription}</small>`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      dangerouslyUseHTMLString: true, // 允许 HTML 内容
    }
  ).then(async () => {
    try {
      const newStatus = shop.status === 'active' ? 'inactive' : 'active';
      
      // 调用后端API更新店铺状态
      // 注意：我们的 shopService.updateShopProfile 可以用来更新包括 status 在内的店铺信息
      // 需要确保后端 upsertShopProfile 能够接收和处理 status 字段
      await shopService.updateShopProfile(shop.id, { status: newStatus });

      // 更新成功后，直接修改前端列表中的状态
      const shopInList = shopList.value.find(item => item.id === shop.id);
      if (shopInList) {
        shopInList.status = newStatus;
        shopInList.updated_at = new Date().toLocaleString(); // 更新时间戳
      }

      // 更新 localStorage (如果仍然依赖它作为主要数据源之一)
      const savedShopList = localStorage.getItem('shopList');
      let allShops = savedShopList ? JSON.parse(savedShopList) : [];
      const shopIndexInStorage = allShops.findIndex(item => item.id === shop.id);
      if (shopIndexInStorage !== -1) {
        allShops[shopIndexInStorage].status = newStatus;
        allShops[shopIndexInStorage].updated_at = new Date().toLocaleString();
        localStorage.setItem('shopList', JSON.stringify(allShops));
      }
      
      ElMessage.success(`${action}成功`);
      // getShopList(); // 如果上面直接修改了 shopList.value，此行可能不再严格需要，除非有其他副作用
    } catch (error) {
      console.error(`更新店铺状态失败 (店铺ID: ${shop.id}):`, error);
      ElMessage.error(`${action}失败: ${error.response?.data?.message || error.message}`);
    }
  }).catch(() => {});
};

// 删除店铺
const handleDelete = (shop) => {
  ElMessageBox.confirm(
    '删除后将无法恢复，是否确认删除该店铺？',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 获取本地存储的店铺列表
      const savedShopList = localStorage.getItem('shopList')
      const allShops = savedShopList ? JSON.parse(savedShopList) : []
      
      // 删除店铺
      const filteredShops = allShops.filter(item => item.id !== shop.id)
      localStorage.setItem('shopList', JSON.stringify(filteredShops))
      
      ElMessage.success('删除成功')
      getShopList()
    } catch (error) {
      console.error('删除店铺失败:', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

// Logo上传相关
const handleLogoSuccess = (res) => {
  shopForm.logo = res.url
}

const beforeLogoUpload = (file) => {
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

// 提交店铺表单
const submitShop = async () => {
  if (!shopFormRef.value) return
  
  await shopFormRef.value.validate(async (valid, fields) => {
    if (valid) {
      try {
        if (dialogType.value === 'add') {
          // TODO: 调用添加API
          // await api.addShop(shopForm)
          ElMessage.success('添加成功')
        } else {
          // TODO: 调用更新API
          // await api.updateShop(shopForm)
          ElMessage.success('更新成功')
        }
        dialogVisible.value = false
        getShopList()
      } catch (error) {
        console.error('保存店铺失败:', error)
        ElMessage.error('保存店铺失败')
      }
    }
  })
}

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val
  getShopList()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  getShopList()
}

// 获取申请列表
const getApplicationList = async () => {
  applicationLoading.value = true
  try {
    // 检查是否有新的店铺申请
    const lastAppliedShopName = localStorage.getItem('lastAppliedShopName')
    if (lastAppliedShopName) {
      // 检查是否已经在申请列表中
      const existingApplication = applicationList.value.find(app => 
        app.name === lastAppliedShopName && app.status === 'pending'
      )
      
      if (!existingApplication) {
        // 添加新的申请
        const newApplication = {
          id: 'APP_' + Date.now(),
          name: lastAppliedShopName,
          logo: localStorage.getItem('lastAppliedShopLogo') || '',
          description: localStorage.getItem('lastAppliedShopDescription') || '',
          location: localStorage.getItem('lastAppliedShopLocation') || '',
          address: localStorage.getItem('lastAppliedShopLocation') || '',
          status: 'pending',
          created_at: new Date().toLocaleString(),
          contactPerson: lastAppliedShopName ? `${lastAppliedShopName} 负责人` : '店铺负责人',
          contactPhone: localStorage.getItem('lastAppliedShopContactInfo') || '',
          businessLicense: 'https://example.com/license.jpg',
          contact_info: localStorage.getItem('lastAppliedShopContactInfo') || '',
          category: localStorage.getItem('lastAppliedShopCategory') || ''
        }
        
        // 将新申请添加到列表开头
        applicationList.value = [newApplication, ...applicationList.value]
      }
    }
    
    applicationTotal.value = applicationList.value.length
  } catch (error) {
    console.error('获取申请列表失败:', error)
    ElMessage.error('获取申请列表失败')
  } finally {
    applicationLoading.value = false
  }
}

// 状态相关
const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return texts[status] || status
}

// 查看营业执照
const previewLicense = (url) => {
  window.open(url, '_blank')
}

// 查看申请详情
const showApplicationDetail = (application) => {
  currentApplication.value = application
  applicationDetailVisible.value = true
}

// 审批相关
const handleApprove = async (application) => {
  try {
    await ElMessageBox.confirm(
      '确定要通过该店铺申请吗？店铺ID将使用申请时的临时ID或新生成。',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    // 1. 准备店铺数据 (使用 'active' 状态)
    const shopDataForBackend = {
      name: application.name,
      logo: application.logo || '',
      description: application.description || '暂无描述',
      location: application.location || '暂未设置',
      contact_info: application.contact_info || localStorage.getItem('lastAppliedShopContactInfo') || '',
      status: 'active' // 明确设置为 active
    };

    // 2. 决定店铺ID
    // 如果原始 application.id 是类似 SHOP_APPLY_... 的前端临时ID，
    // 或者如果它不是一个规范的持久ID，我们应该生成一个新的。
    // 否则，如果它已经是预期的持久ID，则使用它。
    let assignedShopId = application.id;
    if (application.id.startsWith('SHOP_APPLY_') || application.id.startsWith('SHOP_PENDING_')) {
        // 为通过审核的店铺生成一个更持久和规范的ID，例如 'shop_随机字符串或时间戳'
        // 或者，如果你的后端在创建 profile 时会返回最终的 shop_id，那这里可以先用一个临时ID
        // 然后用后端返回的ID更新localStorage。为了简单起见，我们先生成一个前端的。
        assignedShopId = 'shop_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        console.log(`店铺 ${application.name} 申请通过，新生成ID: ${assignedShopId}`);
    } else {
        console.log(`店铺 ${application.name} 申请通过，使用原ID: ${assignedShopId}`);
    }

    // 3. 调用后端API创建/更新店铺信息
    // 注意：这里的 assignedShopId 将被用作URL路径参数，同时 shopDataForBackend 是请求体
    // 后端 shopController.updateShopProfile 需要能处理这种情况
    await shopService.updateShopProfile(assignedShopId, shopDataForBackend); 

    // 4. 更新前端申请列表状态
    const appIndex = applicationList.value.findIndex(item => item.id === application.id);
    if (appIndex !== -1) {
      applicationList.value[appIndex].status = 'approved'; 
    }

    // 5. 更新localStorage中的shopList
    const savedShopList = localStorage.getItem('shopList');
    let allShops = savedShopList ? JSON.parse(savedShopList) : [];
    
    allShops = allShops.filter(shop => 
      !(shop.name === application.name && shop.status === 'pending') && // 移除同名待审核
      !(shop.id === application.id && application.id.startsWith('SHOP_APPLY_')) && // 移除原始申请ID条目
      !(shop.id === application.id && application.id.startsWith('SHOP_PENDING_')) // 移除原始申请ID条目
    );
    
    const existingShopIndex = allShops.findIndex(s => s.id === assignedShopId);
    const newShopEntryForStorage = {
        id: assignedShopId, 
        name: shopDataForBackend.name,
        logo: shopDataForBackend.logo,
        description: shopDataForBackend.description,
        location: shopDataForBackend.location,
        contact_info: shopDataForBackend.contact_info,
        status: 'active', 
        created_at: application.created_at || new Date().toLocaleString(), 
        updated_at: new Date().toLocaleString()
    };

    if (existingShopIndex > -1) {
        allShops[existingShopIndex] = newShopEntryForStorage;
    } else {
        allShops.push(newShopEntryForStorage);
    }
    localStorage.setItem('shopList', JSON.stringify(allShops));
    
    ElMessage.success('店铺申请已通过，并已在后端更新/创建。');
    
    if (application.name === localStorage.getItem('lastAppliedShopName')) {
      localStorage.removeItem('lastAppliedShopName');
      localStorage.removeItem('lastAppliedShopLogo');
      localStorage.removeItem('lastAppliedShopDescription');
      localStorage.removeItem('lastAppliedShopLocation');
      localStorage.removeItem('lastAppliedShopContactInfo');
    }
    
    getApplicationList(); 
    getShopList(); // 确保店铺列表也刷新以反映新批准的店铺

  } catch (error) {
    if (error !== 'cancel') {
      console.error('审批店铺申请失败:', error);
      ElMessage.error(`审批失败: ${error.response?.data?.message || error.message}`);
    }
  }
};

const handleReject = (application) => {
  rejectingApplication.value = application
  rejectReason.value = ''
  rejectDialogVisible.value = true
}

const confirmReject = async () => {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请输入拒绝原因')
    return
  }

  try {
    // TODO: 调用API拒绝申请
    // await api.rejectShopApplication({
    //   id: rejectingApplication.value.id,
    //   reason: rejectReason.value
    // })
    ElMessage.success('已拒绝该申请')

    // Update status in the frontend list
    const appIndex = applicationList.value.findIndex(item => item.id === rejectingApplication.value.id);
    if (appIndex !== -1) {
      applicationList.value[appIndex].status = 'rejected';
      // Optionally, store the reject reason if your data model supports it
      // applicationList.value[appIndex].rejectReason = rejectReason.value;

      // Store rejection info in localStorage for merchant view
      const rejectedInfo = {
        name: rejectingApplication.value.name, // Use name as identifier
        status: 'rejected',
        reason: rejectReason.value,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(`shop_application_status_${rejectingApplication.value.name}`, JSON.stringify(rejectedInfo));
    }

    rejectDialogVisible.value = false
    // getApplicationList(); // Potentially remove or ensure it doesn't revert the status change
  } catch (error) {
    console.error('拒绝申请失败:', error)
    ElMessage.error('操作失败')
  }
}

// 分页处理
const handleApplicationSizeChange = (val) => {
  applicationPageSize.value = val
  getApplicationList()
}

const handleApplicationCurrentChange = (val) => {
  applicationCurrentPage.value = val
  getApplicationList()
}

// 初始化
onMounted(() => {
  getShopList()
  getApplicationList()
})
</script>

<style scoped>
.shops-container {
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

.shop-info {
  display: flex;
  align-items: center;
}

.shop-logo {
  width: 40px;
  height: 40px;
  margin-right: 10px;
  border-radius: 4px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
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

.application-info {
  display: flex;
  gap: 12px;

  .shop-logo {
    width: 60px;
    height: 60px;
    border-radius: 4px;
  }

  .info-content {
    .shop-name {
      font-weight: 500;
      margin-bottom: 4px;
    }

    .shop-category {
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }

    .description {
      font-size: 12px;
      color: #999;
    }
  }
}

.application-detail {
  .detail-item {
    margin-bottom: 16px;

    label {
      font-weight: 500;
      margin-right: 8px;
      color: #666;
    }
  }
}
</style>