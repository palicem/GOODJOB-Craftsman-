<template>
  <view class="message-container">
    <!-- 标题区域 -->
    <view class="header">
      <text class="title">消息</text>
      <text class="manage-btn" @click="toggleManageMode">{{ isManageMode ? '完成' : '管理' }}</text>
    </view>
    
    <view class="message-list">
      <!-- 系统客服 -->
      <view class="message-item" @click="navigateToCustomerService">
        <view class="message-avatar">
          <text class="avatar-text">客</text>
        </view>
        <view class="message-content">
          <view class="message-top">
            <text class="message-title">系统客服</text>
            <text class="message-time">{{ formatTime(lastMessageTime) }}</text>
          </view>
          <view class="message-bottom">
            <text class="message-preview">{{ lastMessage || '有什么可以帮您的吗？点击开始咨询' }}</text>
            <view class="message-badge" v-if="unreadCount > 0">{{ unreadCount }}</view>
          </view>
        </view>
      </view>

      <!-- AI定制助手 -->
      <!--
      <view class="message-item" @click="navigateToDesignChat">
        <view class="message-avatar ai-avatar">
          <text class="avatar-text">定</text>
        </view>
        <view class="message-content">
          <view class="message-top">
            <text class="message-title">AI定制助手</text>
            <text class="message-time">{{ formatTime(lastDesignMessageTime) }}</text>
          </view>
          <view class="message-bottom">
            <text class="message-preview">{{ lastDesignMessage || '让AI帮您定制商品，点击开始对话' }}</text>
            <view class="message-badge" v-if="designUnreadCount > 0">{{ designUnreadCount }}</view>
          </view>
        </view>
      </view>
      -->

      <!-- 店铺客服列表 -->
      <view class="message-item" v-for="(shop, index) in shopList" :key="shop.id" @click="navigateToShopService(shop)">
        <view class="message-avatar shop-avatar">
          <image v-if="shop.logo" :src="shop.logo" mode="aspectFill" class="shop-logo"></image>
          <text v-else class="avatar-text">{{ shop.name[0] }}</text>
        </view>
        <view class="message-content">
          <view class="message-top">
            <text class="message-title">{{ shop.name }}</text>
            <text class="message-time">{{ formatTime(shop.lastMessageTime) }}</text>
          </view>
          <view class="message-bottom">
            <text class="message-preview">{{ shop.lastMessage || '点击咨询店铺客服' }}</text>
            <view class="message-badge" v-if="shop.unreadCount > 0">{{ shop.unreadCount }}</view>
          </view>
        </view>
        <!-- 管理模式下显示删除按钮 -->
        <view v-if="isManageMode" class="delete-btn" @click.stop="deleteShopChat(shop)">
          <text class="delete-icon">×</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { onShow } from '@dcloudio/uni-app';

// 客服消息相关
const lastMessage = ref('');
const lastMessageTime = ref(new Date());
const unreadCount = ref(0);

// AI定制助手消息相关
const lastDesignMessage = ref('');
const lastDesignMessageTime = ref(new Date());
const designUnreadCount = ref(0);

// 店铺列表
const shopList = ref([]);

// 是否处于管理模式
const isManageMode = ref(false);

// 格式化时间
const formatTime = (date) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(date);
  const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
  
  // 如果是今天的消息，只显示时间
  if (messageDay.getTime() === today.getTime()) {
    return `${messageDate.getHours().toString().padStart(2, '0')}:${messageDate.getMinutes().toString().padStart(2, '0')}`;
  }
  // 如果是昨天的消息
  else if (messageDay.getTime() === today.getTime() - 86400000) {
    return '昨天';
  }
  // 其他日期显示日期
  else {
    return `${messageDate.getMonth() + 1}/${messageDate.getDate()}`;
  }
};

// 导航到系统客服聊天界面
const navigateToCustomerService = () => {
  unreadCount.value = 0;
  try {
    uni.setStorageSync('cs_last_viewed_time', new Date().toISOString());
  } catch (e) {
    console.error('保存查看时间失败:', e);
  }
  uni.navigateTo({
    url: '/pages/chat/system-service'
  });
};

// 导航到AI定制助手界面
const navigateToDesignChat = () => {
  designUnreadCount.value = 0;
  try {
    uni.setStorageSync('design_last_viewed_time', new Date().toISOString());
  } catch (e) {
    console.error('保存查看时间失败:', e);
  }
  
  uni.navigateTo({
    url: '/pages/chat/design-chat'
  });
};

// 导航到店铺客服聊天界面
const navigateToShopService = (shop) => {
  // 更新店铺未读消息数
  shop.unreadCount = 0;
  try {
    uni.setStorageSync(`shop_${shop.id}_last_viewed_time`, new Date().toISOString());
  } catch (e) {
    console.error('保存查看时间失败:', e);
  }
  
  // 跳转到客服页面
  uni.navigateTo({
    url: `/pages/chat/customer-service?shopId=${shop.id}&shopName=${encodeURIComponent(shop.name)}&shopLogo=${encodeURIComponent(shop.logo || '')}`
  });
};

// 修改 loadShopList 函数
const loadShopList = () => {
  console.log('[MessagePage] Attempting to load recent chat sessions.');
  try {
    const recentSessionsRaw = uni.getStorageSync('recent_chat_sessions');
    console.log('[MessagePage] Raw recent_chat_sessions from storage:', recentSessionsRaw);
    
    let sessions = [];
    if (recentSessionsRaw) {
      try {
        sessions = JSON.parse(recentSessionsRaw);
        if (!Array.isArray(sessions)) {
          console.warn('[MessagePage] Parsed recent_chat_sessions is not an array, re-initializing.', sessions);
          sessions = [];
        }
      } catch (e) {
        console.error('[MessagePage] Failed to parse recent_chat_sessions, re-initializing.', e);
        sessions = [];
      }
    }
    console.log('[MessagePage] Parsed recent_chat_sessions:', JSON.parse(JSON.stringify(sessions)));

    // 按最后消息时间排序 (确保 lastMessageTime 是有效的日期字符串)
    sessions.sort((a, b) => {
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return timeB - timeA;
    });
    
    // 更新响应式数据
    // 将 recent_chat_sessions 的字段映射到 shopList 所期望的字段
    // shopList 期望: id, name, logo, lastMessageTime, lastMessage (来自模板)
    shopList.value = sessions.map(s => ({
        id: s.shopId,         // 从 shopId 映射
        name: s.shopName,       // 从 shopName 映射
        logo: s.shopLogo,       // 从 shopLogo 映射
        lastMessageTime: s.lastMessageTime,
        lastMessage: s.lastMessageContent, // 从 lastMessageContent 映射
        unreadCount: s.unreadCount || 0,
        sessionId: s.sessionId // 保留 sessionId 如果需要
    }));
    console.log('[MessagePage] 최종적으로 설정된 shopList:', JSON.parse(JSON.stringify(shopList.value)));
    
  } catch (e) {
    console.error('[MessagePage] 加载店铺列表 실패:', e);
    shopList.value = []; // 出错时清空列表
  }
};

const handleChatSessionUpdate = () => {
  console.log('[MessagePage] chatSessionUpdated event received. Reloading shop list.');
  loadShopList();
};

onMounted(() => {
  console.log('[MessagePage] Component mounted.');
  loadShopList(); // 页面挂载时加载一次
  uni.$on('chatSessionUpdated', handleChatSessionUpdate);
  console.log('[MessagePage] Event listener for chatSessionUpdated SET.');
});

onShow(() => {
  console.log('[MessagePage] Page shown (onShow). Reloading shop list.');
  loadShopList(); // 每次页面显示时也加载，确保数据最新
});

onBeforeUnmount(() => {
  console.log('[MessagePage] Component unmounting. Removing event listener.');
  uni.$off('chatSessionUpdated', handleChatSessionUpdate);
});

// 切换管理模式
const toggleManageMode = () => {
  isManageMode.value = !isManageMode.value;
};

// 删除店铺聊天
const deleteShopChat = (shopToDelete) => {
  uni.showModal({
    title: '提示',
    content: `确定要删除与"${shopToDelete.name}"的聊天会话吗？这将同时清除该店铺本地的所有聊天记录。`,
    success: (res) => {
      if (res.confirm) {
        console.log('[MessagePage] Deleting chat for shop:', shopToDelete.id);
        try {
          // 1. 从 recent_chat_sessions 中移除
          let recentSessions = uni.getStorageSync('recent_chat_sessions');
          if (recentSessions) {
            try {
              recentSessions = JSON.parse(recentSessions);
              if (Array.isArray(recentSessions)) {
                const updatedSessions = recentSessions.filter(s => s.shopId !== shopToDelete.id);
                uni.setStorageSync('recent_chat_sessions', JSON.stringify(updatedSessions));
                console.log('[MessagePage] Updated recent_chat_sessions after deletion.');
              } else {
                console.warn('[MessagePage] recent_chat_sessions was not an array after parsing.');
              }
            } catch (e) {
              console.error('[MessagePage] Failed to parse recent_chat_sessions during delete:', e);
            }
          }

          // 2. 从当前显示的 shopList.value 中移除 (更新视图)
          shopList.value = shopList.value.filter(s => s.id !== shopToDelete.id);
          console.log('[MessagePage] Updated shopList.value for UI.');

          // 3. 清理与此店铺相关的特定聊天消息
          try {
            const storedUserInfo = uni.getStorageSync('userInfo');
            if (storedUserInfo) {
              const currentUser = JSON.parse(storedUserInfo);
              const userId = currentUser?._id || currentUser?.id;
              if (userId) {
                const messageStorageKey = `chat_messages_${shopToDelete.id}_${userId}`;
                uni.removeStorageSync(messageStorageKey);
                console.log(`[MessagePage] Removed chat messages from storage for key: ${messageStorageKey}`);
              } else {
                console.warn('[MessagePage] Could not determine userId from stored userInfo to delete chat messages.');
              }
            } else {
              console.warn('[MessagePage] No userInfo found in storage to determine userId for chat message deletion.');
            }
          } catch (e) {
            console.error('[MessagePage] Error parsing userInfo or removing chat messages:', e);
          }

          // 4. （可选）标记为已删除，如果将来需要区分"软删除"和"硬删除"
          // uni.setStorageSync(`shop_${shopToDelete.id}_chat_deleted`, true);

          uni.showToast({ title: '删除成功', icon: 'none' });

        } catch (e) {
          console.error('删除聊天会话失败:', e);
          uni.showToast({ title: '删除失败', icon: 'none' });
        }
      }
    }
  });
};

// 恢复已删除的聊天
const restoreShopChat = (shopId) => {
  // 移除删除标记
  uni.removeStorageSync(`shop_${shopId}_chat_deleted`);
  // 重新加载店铺列表
  loadShopList();
};

// 页面加载时获取用户信息
const setupEventListeners = () => {
  console.log('开始设置事件监听器');
  
  // 监听店铺聊天创建事件
  uni.$off('shop_chat_created'); // 先移除旧的监听器
  uni.$on('shop_chat_created', (shopInfo) => {
    console.log('消息页面收到shop_chat_created事件:', shopInfo);
    // 移除删除标记并更新店铺列表
    try {
      // 确保shopInfo包含必要的字段
      if (!shopInfo || !shopInfo.id) {
        console.error('收到的shopInfo数据无效:', shopInfo);
        return;
      }
      
      // 立即加载最新的店铺列表
      loadShopList();
      
      // 移除删除标记
      uni.removeStorageSync(`shop_${shopInfo.id}_chat_deleted`);
      
      // 更新店铺列表
      updateShopChat(shopInfo);
      
      console.log('店铺聊天更新完成');
    } catch (e) {
      console.error('处理shop_chat_created事件时出错:', e);
    }
  });
  
  // 监听页面显示事件
  uni.$off('message-page-show'); // 先移除旧的监听器
  uni.$on('message-page-show', () => {
    console.log('触发message-page-show事件');
    loadShopList();
  });
  
  console.log('事件监听器设置完成');
};

// 确保在页面创建时就设置事件监听
uni.$on('app-launch', () => {
  console.log('App启动，设置事件监听器');
  setupEventListeners();
});

onMounted(() => {
  console.log('消息页面mounted');
  // 加载店铺列表
  loadShopList();
  // 设置事件监听器
  setupEventListeners();
});

// 组件销毁时清理事件监听
onBeforeUnmount(() => {
  console.log('消息页面即将销毁，清理事件监听器');
  uni.$off('shop_chat_created');
  uni.$off('message-page-show');
  uni.$off('app-launch');
});

onShow(() => {
  console.log('消息页面显示');
  // 每次显示页面时重新加载店铺列表
  loadShopList();
  // 确保事件监听器已设置
  setupEventListeners();
});
</script>

<style lang="scss">
.message-container {
  padding: 20rpx;
  padding-top: calc(var(--status-bar-height) + 88rpx);
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  z-index: 100;
  padding: 0 30rpx;
  padding-top: var(--status-bar-height);
  height: 88rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.message-list {
  margin-top: 20rpx;
}

.message-item {
  display: flex;
  align-items: flex-start;
  padding: 30rpx;
  background-color: #fff;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  position: relative;
}

.message-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background-color: #00BFA6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  flex-shrink: 0;
  
  &.ai-avatar {
    background-color: #00A4E4;
  }
  
  &.shop-avatar {
    background-color: #f5f5f5;
    overflow: hidden;
    
    .shop-logo {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
}

.avatar-text {
  font-size: 40rpx;
  color: #fff;
  font-weight: bold;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;
}

.message-title {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
  margin-right: 20rpx;
}

.message-time {
  font-size: 24rpx;
  color: #999;
  flex-shrink: 0;
}

.message-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40rpx;
  overflow: hidden;
}

.message-preview {
  font-size: 28rpx;
  color: #666;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 20rpx;
  padding-right: 10rpx;
}

.message-badge {
  min-width: 36rpx;
  height: 36rpx;
  border-radius: 18rpx;
  background-color: #ff4d4f;
  color: #fff;
  font-size: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 10rpx;
  flex-shrink: 0;
  margin-left: auto;
}

.manage-btn {
  font-size: 28rpx;
  color: #00BFA6;
  padding: 10rpx 20rpx;
}

.delete-btn {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.delete-icon {
  font-size: 40rpx;
  color: #ff4d4f;
}
</style> 

