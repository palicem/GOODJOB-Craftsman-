// 页面刷新处理组合式函数
import { getCurrentInstance } from 'vue';
import { onLoad as uniOnLoad, onReady } from '@dcloudio/uni-app'; // uni-app的onLoad

export function usePageRefresh() {
  const whiteList = [
    'pages/main/main',
    'pages/login/login',
    'pages/register/register'
  ];

  const checkAndHandlePageStack = () => {
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const currentRoute = currentPage ? currentPage.route : '';

    if (whiteList.includes(currentRoute)) {
      return;
    }

    if (pages.length <= 1 && currentRoute !== 'pages/main/main') { // 确保不在首页时才跳转
      console.log(`[usePageRefresh] Abnormal page stack for ${currentRoute}. Redirecting to main.`);
      try {
        uni.setStorageSync('last_page', currentRoute);
      } catch (e) {
        console.error('[usePageRefresh] Failed to save last_page:', e);
      }

      uni.reLaunch({
        url: '/pages/main/main',
        complete: () => {
          uni.showToast({
            title: '页面栈异常，已返回首页',
            icon: 'none',
            duration: 2000
          });
        }
      });
    }
  };

  // uni-app的页面生命周期钩子 onLoad 会在组件的 onMounted 之前执行
  // 我们将页面栈检查逻辑放在 uniOnLoad 中，以确保在组件挂载前执行
  uniOnLoad(() => {
    console.log('[usePageRefresh] uniOnLoad triggered, checking page stack.');
    checkAndHandlePageStack();
  });
  
  // 有些情况下，页面栈在onLoad时可能还未完全准备好，尤其是在复杂的跳转后
  // 增加一个onReady的检查作为后备
  // onReady(() => {
  //   console.log('[usePageRefresh] onReady triggered, re-checking page stack.');
  //   checkAndHandlePageStack();
  // });

  const handlePageBack = () => {
    const pages = getCurrentPages();
    if (pages.length <= 1) {
      console.log('[usePageRefresh] Page stack too shallow, reLaunching to main.');
      uni.reLaunch({
        url: '/pages/main/main'
      });
    } else {
      uni.navigateBack();
    }
  };

  return {
    handlePageBack
    // checkAndHandlePageStack // 如果其他地方需要手动调用，也可以暴露
  };
} 