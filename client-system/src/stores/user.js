import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: null,
    token: null,
  }),
  getters: {
    isLoggedIn: (state) => !!state.token && !!state.userInfo,
    currentUser: (state) => state.userInfo,
    getToken: (state) => state.token,
  },
  actions: {
    setUserInfo(userData) {
      console.log('[userStore.setUserInfo] Attempting to set user data. Received:', JSON.stringify(userData, null, 2));
      if (userData && (userData.id || userData._id)) {
        this.userInfo = { ...userData };
        if (this.userInfo.id && !this.userInfo._id) { // 确保有 _id
           this.userInfo._id = this.userInfo.id;
        }
        uni.setStorageSync('userInfo', JSON.stringify(this.userInfo));
        console.log('[userStore.setUserInfo] Successfully set. userInfo in store is now:', JSON.stringify(this.userInfo, null, 2));
      } else {
        console.warn('[userStore.setUserInfo] Received invalid or empty userData. Clearing store and localStorage.');
        this.userInfo = null; //  确保 store 中的 userInfo 被清空
        uni.removeStorageSync('userInfo');
        // uni.removeStorageSync('token'); // 考虑是否同时清除 token
      }
    },
    setToken(tokenData) {
      console.log('[userStore.setToken] Setting token data:', tokenData);
      this.token = tokenData;
      uni.setStorageSync('token', tokenData);
    },
    logout() {
      console.log('[userStore.logout] Logging out.');
      this.userInfo = null;
      this.token = null;
      uni.removeStorageSync('userInfo');
      uni.removeStorageSync('token');
      uni.removeStorageSync('autoLogin'); // 清除自动登录标记
      console.log('[userStore.logout] Cleared store and localStorage.');
    },
    loadInitialState() {
      console.log('[userStore.loadInitialState] Called.');
      const token = uni.getStorageSync('token');
      const storedUserInfo = uni.getStorageSync('userInfo');
      console.log('[userStore.loadInitialState] Raw token from storage:', token);
      console.log('[userStore.loadInitialState] Raw userInfo string from storage:', storedUserInfo);

      if (token) {
        this.token = token;
      }
      if (storedUserInfo) {
        try {
          const parsedInfo = JSON.parse(storedUserInfo);
          console.log('[userStore.loadInitialState] Parsed userInfo from storage:', JSON.stringify(parsedInfo, null, 2));
          if (parsedInfo && (parsedInfo.id || parsedInfo._id)) {
            this.userInfo = parsedInfo; // 直接赋值
             if (this.userInfo.id && !this.userInfo._id) { // 确保有 _id
                this.userInfo._id = this.userInfo.id;
             }
            console.log('[userStore.loadInitialState] userInfo loaded and set in store. Current store state:', JSON.stringify(this.userInfo, null, 2));
          } else {
            console.warn('[userStore.loadInitialState] Parsed userInfo is invalid or missing ID. Clearing userInfo in store.');
            this.userInfo = null; // 清空 store 中的 userInfo
            // uni.removeStorageSync('userInfo'); // 可选：如果解析出来是无效的，也从 storage 中移除
          }
        } catch (e) {
          console.error('[userStore.loadInitialState] Failed to parse userInfo from storage:', e);
          this.userInfo = null; // 清空 store 中的 userInfo
          uni.removeStorageSync('userInfo'); // 解析失败，从 storage 中移除错误的
        }
      } else {
        console.log('[userStore.loadInitialState] No userInfo found in storage. userInfo in store remains:', JSON.stringify(this.userInfo, null, 2));
      }
    }
  },
}); 