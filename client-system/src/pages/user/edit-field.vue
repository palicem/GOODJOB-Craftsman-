<template>
  <view class="edit-field-container">
    <!-- 头部标题栏 -->
    <view class="header">
      <view class="back-btn" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <view class="header-title">
        <text class="title-text">编辑{{fieldTitle}}</text>
      </view>
      <view class="save-btn" @click="saveField">
        <text class="save-text">保存</text>
      </view>
    </view>
    
    <!-- 输入区域 -->
    <view class="input-area">
      <input 
        v-if="fieldType === 'input'" 
        class="field-input" 
        v-model="fieldValue" 
        :placeholder="'请输入' + fieldTitle"
        :maxlength="maxLength"
        :type="inputType"
        @input="validateInput"
      />
      
      <textarea 
        v-if="fieldType === 'textarea'" 
        class="field-textarea" 
        v-model="fieldValue" 
        :placeholder="'请输入' + fieldTitle"
        :maxlength="maxLength"
        @input="validateInput"
      />
    </view>
    
    <!-- 输入提示 -->
    <view class="input-tips" v-if="fieldTips">
      {{fieldTips}}
    </view>
    
    <!-- 错误提示 -->
    <view class="error-tips" v-if="errorMsg">
      {{errorMsg}}
    </view>
    
    <!-- 字数提示 -->
    <view class="count-tips" v-if="showCount">
      <text>{{fieldValue.length}}/{{maxLength}}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

// 字段标题
const fieldTitle = ref('');
// 字段值
const fieldValue = ref('');
// 字段类型（input或textarea）
const fieldType = ref('input');
// 输入类型
const inputType = ref('text');
// 最大长度
const maxLength = ref(100);
// 输入提示
const fieldTips = ref('');
// 错误信息
const errorMsg = ref('');
// 是否显示字数统计
const showCount = ref(false);
// 新增一个 ref 来存储从路由参数获取的 fieldKey
const fieldKey = ref('');

// 根据字段类型设置相应的配置
const setFieldConfig = (title) => {
  switch (title) {
    case '账户名':
      // 账户名不可编辑
      uni.showToast({
        title: '账户名不可修改',
        icon: 'none'
      });
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
      return;
    case '昵称':
      fieldType.value = 'input';
      inputType.value = 'text';
      maxLength.value = 20;
      fieldTips.value = '昵称长度不超过20个字符';
      showCount.value = true;
      break;
    case '真实姓名':
      fieldType.value = 'input';
      inputType.value = 'text';
      maxLength.value = 30;
      fieldTips.value = '请输入您的真实姓名';
      break;
    case '个性签名':
      fieldType.value = 'textarea';
      maxLength.value = 100;
      fieldTips.value = '签名长度不超过100个字符';
      showCount.value = true;
      break;
    case '手机号码':
      fieldType.value = 'input';
      inputType.value = 'number';
      maxLength.value = 11;
      fieldTips.value = '请输入11位手机号码';
      break;
    case '邮箱':
      fieldType.value = 'input';
      inputType.value = 'text';
      maxLength.value = 50;
      fieldTips.value = '请输入正确的邮箱格式';
      break;
    default:
      fieldType.value = 'input';
      inputType.value = 'text';
      maxLength.value = 100;
      fieldTips.value = '';
  }
};

// 实时验证输入内容
const validateInput = () => {
  errorMsg.value = '';
  
  // 特定字段验证
  if (fieldTitle.value === '手机号码') {
    if (fieldValue.value && fieldValue.value.length !== 11) {
      errorMsg.value = '手机号码必须为11位';
    } else if (fieldValue.value && !/^1\d{10}$/.test(fieldValue.value)) {
      errorMsg.value = '请输入正确的手机号码格式';
    }
  } else if (fieldTitle.value === '邮箱') {
    if (fieldValue.value && !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(fieldValue.value)) {
      errorMsg.value = '请输入正确的邮箱格式';
    }
  }
};

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 保存字段
const saveField = () => {
  // 表单验证
  if (!fieldValue.value && typeof fieldValue.value === 'string' && !fieldValue.value.trim()) {
    // 允许空字符串提交，例如清空个性签名
    // 但如果字段是必填的，这里可能需要更复杂的逻辑或从外部传入配置
    if (fieldTitle.value !== '个性签名' && fieldTitle.value !== '真实姓名') { // 假设这两个可以为空
        uni.showToast({
            title: `${fieldTitle.value}不能为空`,
            icon: 'none'
        });
        return;
    }
  }
  
  // 特定字段的额外验证 (手机和邮箱)
  if (fieldTitle.value === '手机号码') {
    if (fieldValue.value && !/^1\d{10}$/.test(fieldValue.value)) { // 允许手机号为空，如果不为空则验证格式
      uni.showToast({
        title: '请输入正确的手机号码格式',
        icon: 'none'
      });
      return;
    }
  } else if (fieldTitle.value === '邮箱') {
    if (fieldValue.value && !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(fieldValue.value)) { // 允许邮箱为空
      uni.showToast({
        title: '请输入正确的邮箱格式',
        icon: 'none'
      });
      return;
    }
  }
  
  // 发送 fieldEdited 事件，通知上一页数据已编辑
  // fieldKey.value 应该包含了从路由参数中获取的后端字段名
  console.log(`[edit-field.vue] Emitting fieldEdited with: title=${fieldTitle.value}, value=${fieldValue.value}, fieldKey=${fieldKey.value}`);
  uni.$emit('fieldEdited', {
    title: fieldTitle.value, // 原始标题，用于显示
    value: fieldValue.value, // 新的输入值
    fieldKey: fieldKey.value   // 后端API期望的字段名
  });
  
  // 直接返回上一页，成功提示由 user-info.vue 在API调用成功后显示
  uni.navigateBack();
};

// 页面加载 (uni-app 推荐使用 onLoad 接收页面参数)
onLoad((options) => {
  console.log('[edit-field.vue] onLoad options:', options);
  // 设置字段标题、当前值和 fieldKey
  fieldTitle.value = decodeURIComponent(options.title || '');
  fieldValue.value = decodeURIComponent(options.value || '');
  fieldKey.value = decodeURIComponent(options.fieldKey || ''); // 接收 fieldKey
  
  if (!fieldKey.value) {
    console.warn('[edit-field.vue] fieldKey is missing from route parameters. This might cause issues when saving.');
  }
  
  // 设置字段配置
  setFieldConfig(fieldTitle.value);
});

// 监听输入变化，自动验证
watch(fieldValue, () => {
  validateInput();
});
</script>

<style lang="scss">
.edit-field-container {
  min-height: 100vh;
  background-color: #f8f8f8;
}

.header {
  display: flex;
  align-items: center;
  padding: 10rpx 30rpx;
  background-color: #ffffff;
  position: relative;
  z-index: 10;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  height: 90rpx;
  padding-top: calc(var(--status-bar-height) + 10rpx);
}

.back-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-icon {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
}

.header-title {
  flex: 1;
  text-align: center;
}

.title-text {
  font-size: 36rpx;
  font-weight: 500;
  color: #333;
}

.save-btn {
  padding: 10rpx 20rpx;
}

.save-text {
  font-size: 30rpx;
  color: #00BFA6;
  font-weight: 500;
}

.input-area {
  margin: 20rpx;
  background-color: #ffffff;
  border-radius: 12rpx;
  padding: 30rpx;
}

.field-input {
  width: 100%;
  height: 80rpx;
  font-size: 28rpx;
  color: #333;
}

.field-textarea {
  width: 100%;
  height: 300rpx;
  font-size: 28rpx;
  color: #333;
  line-height: 1.5;
}

.input-tips {
  font-size: 24rpx;
  color: #999;
  padding: 0 50rpx;
  margin-bottom: 10rpx;
}

.error-tips {
  font-size: 24rpx;
  color: #f56c6c;
  padding: 0 50rpx;
  margin-bottom: 10rpx;
}

.count-tips {
  font-size: 24rpx;
  color: #999;
  text-align: right;
  padding: 0 50rpx;
}
</style> 