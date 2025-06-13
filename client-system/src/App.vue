<script>
// import { initUserData, isLoginExpired, clearLoginState, getLoginState } from './utils/userService'; // 旧的导入
import userService from './utils/userService'; // 新的导入方式

export default {
  onLaunch: function () {
    console.log('App Launch');
    
    // // 初始化用户数据 - 此逻辑已移除，后端负责或在注册/登录时处理
    // try {
    //   initUserData(); // userService.initUserData() //  initUserData 已不存在
    //   console.log('用户数据初始化完成');
    // } catch (e) {
    //   console.error('初始化用户数据失败:', e);
    // }
    
    // // 检查登录是否过期 - 此逻辑已移至 apiService.js 的请求处理中
    // try {
    //   const isLoggedIn = userService.isLoggedIn(); // 使用新的方法判断是否已登录
    //   console.log('App启动时检查登录状态 (isLoggedIn):', isLoggedIn);
      
    //   if (!isLoggedIn) { //  如果未登录，则不需要做什么，等待用户操作触发登录
    //     console.log('用户未登录或Token可能已失效');
    //     // 如果需要强制跳转登录页，可以在这里处理，但通常会让用户先看到首页或引导页
    //     // userService.clearLoginState(); // 确保清除可能存在的无效状态

    //     // // 检查当前页面是否已经是登录页，避免重复跳转
    //     // setTimeout(() => {
    //     //   const pages = getCurrentPages();
    //     //   const currentPage = pages.length ? pages[pages.length - 1].route : '';
          
    //     //   if (currentPage !== 'pages/login/login') {
    //     //     console.log('跳转到登录页面');
    //     //     uni.redirectTo({
    //     //       url: '/pages/login/login' // 可以添加一个参数，如 ?from=appLaunch&expired=true
    //     //     });
    //     //   }
    //     // }, 500); 
    //   } else {
    //     console.log('用户已登录，Token可能有效');
    //   }
    // } catch (e) {
    //   console.error('检查登录状态出错:', e);
    // }
    
    // 初始化小程序状态栏高度
    this.setStatusBarHeight();
  },
  onShow: function () {
    console.log('App Show')
  },
  onHide: function () {
    console.log('App Hide')
  },
  methods: {
    // 设置状态栏高度
    setStatusBarHeight() {
      // 获取系统状态栏高度
      try {
        const systemInfo = uni.getSystemInfoSync();
        if (systemInfo && systemInfo.statusBarHeight) {
          // 设置CSS变量，供全局使用
          document.documentElement.style.setProperty('--status-bar-height', systemInfo.statusBarHeight + 'px');
        }
      } catch (e) {
        console.error('获取状态栏高度失败:', e);
      }
    }
  }
}
</script>

<style>
/*每个页面公共css */
@import './common/styles/miniprogram.scss';

/* 全局基础样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 解决小程序点击出现的灰色背景问题 */
view, text, button, input, textarea {
  -webkit-tap-highlight-color: transparent;
}

/* 移除按钮默认边框 */
button {
  border: none;
}

button::after {
  border: none;
}

/* 全局CSS变量 */
:root {
  --primary-color: #00BFA6;
  --danger-color: #ff4d4f;
  --warning-color: #ffaa00;
  --success-color: #52c41a;
  --info-color: #1890ff;
}

/* 隐藏所有滚动条 */
::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
  background: transparent !important;
}

/* 针对scroll-view组件 */
scroll-view {
  -webkit-overflow-scrolling: touch;
}

scroll-view::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

/* 针对页面滚动 */
page {
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 修复微信小程序样式问题 */
:not(not) {
  -webkit-overflow-scrolling: touch;
}
</style>
