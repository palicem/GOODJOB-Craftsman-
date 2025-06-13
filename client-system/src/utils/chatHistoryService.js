// 对话历史存储服务
const CHAT_HISTORY_KEY = 'ai_image_chat_history';

// 获取所有对话历史
export const getChatHistory = () => {
  try {
    const history = uni.getStorageSync(CHAT_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('获取对话历史失败:', error);
    return [];
  }
};

// 保存对话记录
export const saveChatMessage = (message) => {
  try {
    const history = getChatHistory();
    history.push({
      ...message,
      id: Date.now().toString(),
      createTime: new Date().toISOString()
    });
    uni.setStorageSync(CHAT_HISTORY_KEY, JSON.stringify(history));
    return true;
  } catch (error) {
    console.error('保存对话记录失败:', error);
    return false;
  }
};

// 获取单个会话的历史记录
export const getSessionHistory = (sessionId) => {
  const history = getChatHistory();
  return history.filter(msg => msg.sessionId === sessionId);
};

// 清除历史记录
export const clearHistory = () => {
  try {
    uni.removeStorageSync(CHAT_HISTORY_KEY);
    return true;
  } catch (error) {
    console.error('清除历史记录失败:', error);
    return false;
  }
};

// 删除单条消息
export const deleteMessage = (messageId) => {
  try {
    const history = getChatHistory();
    const newHistory = history.filter(msg => msg.id !== messageId);
    uni.setStorageSync(CHAT_HISTORY_KEY, JSON.stringify(newHistory));
    return true;
  } catch (error) {
    console.error('删除消息失败:', error);
    return false;
  }
};

// 更新消息状态
export const updateMessageStatus = (messageId, status) => {
  try {
    const history = getChatHistory();
    const index = history.findIndex(msg => msg.id === messageId);
    if (index !== -1) {
      history[index].status = status;
      uni.setStorageSync(CHAT_HISTORY_KEY, JSON.stringify(history));
      return true;
    }
    return false;
  } catch (error) {
    console.error('更新消息状态失败:', error);
    return false;
  }
};

// 保存关键词历史
export const saveKeywordsHistory = (messageId, keywords) => {
  try {
    const history = getChatHistory();
    const index = history.findIndex(msg => msg.id === messageId);
    if (index !== -1) {
      if (!history[index].keywordsHistory) {
        history[index].keywordsHistory = [];
      }
      history[index].keywordsHistory.push({
        keywords,
        timestamp: new Date().toISOString()
      });
      uni.setStorageSync(CHAT_HISTORY_KEY, JSON.stringify(history));
      return true;
    }
    return false;
  } catch (error) {
    console.error('保存关键词历史失败:', error);
    return false;
  }
}; 