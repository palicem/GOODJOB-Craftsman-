<template>
  <view class="keyword-confirm-dialog" v-if="show">
    <view class="dialog-mask" @tap="handleCancel"></view>
    <view class="dialog-content">
      <view class="dialog-header">
        <text class="dialog-title">确认生成关键词</text>
      </view>
      
      <view class="dialog-body">
        <view class="keywords-section">
          <text class="section-title">AI提取的关键词：</text>
          <view class="keywords-list">
            <view 
              class="keyword-item"
              v-for="(keyword, index) in keywords"
              :key="index"
            >
              <input 
                type="text"
                v-model="editedKeywords[index]"
                class="keyword-input"
                @input="handleKeywordChange(index, $event)"
              />
              <text class="delete-btn" @tap="deleteKeyword(index)">×</text>
            </view>
          </view>
          <view class="add-keyword" @tap="addKeyword">
            <text class="add-icon">+</text>
            <text class="add-text">添加关键词</text>
          </view>
        </view>

        <view class="style-section" v-if="showStyleOptions">
          <text class="section-title">选择生成风格：</text>
          <scroll-view scroll-x class="style-list" show-scrollbar="false">
            <view 
              class="style-item"
              v-for="style in styleOptions"
              :key="style.value"
              :class="{'selected': selectedStyle === style.value}"
              @tap="selectStyle(style.value)"
            >
              {{ style.label }}
            </view>
          </scroll-view>
        </view>
      </view>
      
      <view class="dialog-footer">
        <button class="cancel-btn" @tap="handleCancel">取消</button>
        <button class="confirm-btn" @tap="handleConfirm" :disabled="!canConfirm">确认生成</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  keywords: {
    type: Array,
    default: () => []
  },
  showStyleOptions: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['update:show', 'confirm', 'cancel']);

// 编辑后的关键词
const editedKeywords = ref([]);

// 选中的风格
const selectedStyle = ref('');

// 风格选项
const styleOptions = [
  { label: '写实', value: 'realistic' },
  { label: '插画', value: 'illustration' },
  { label: '水彩', value: 'watercolor' },
  { label: '像素', value: 'pixel' },
  { label: '赛博朋克', value: 'cyberpunk' },
  { label: '油画', value: 'oil-painting' },
  { label: '素描', value: 'sketch' },
  { label: '动漫', value: 'anime' }
];

// 是否可以确认
const canConfirm = computed(() => {
  return editedKeywords.value.length > 0 && 
         editedKeywords.value.every(keyword => keyword.trim() !== '');
});

// 监听关键词变化
watch(() => props.keywords, (newKeywords) => {
  editedKeywords.value = [...newKeywords];
}, { immediate: true });

// 处理关键词变化
const handleKeywordChange = (index, event) => {
  editedKeywords.value[index] = event.detail.value;
};

// 删除关键词
const deleteKeyword = (index) => {
  editedKeywords.value.splice(index, 1);
};

// 添加关键词
const addKeyword = () => {
  editedKeywords.value.push('');
};

// 选择风格
const selectStyle = (style) => {
  selectedStyle.value = style;
};

// 确认
const handleConfirm = () => {
  emit('confirm', {
    keywords: editedKeywords.value.filter(k => k.trim() !== ''),
    style: selectedStyle.value
  });
  emit('update:show', false);
};

// 取消
const handleCancel = () => {
  emit('cancel');
  emit('update:show', false);
};
</script>

<style lang="scss">
.keyword-confirm-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  
  .dialog-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
  }
  
  .dialog-content {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 80%;
    max-width: 600rpx;
    background-color: #fff;
    border-radius: 16rpx;
    overflow: hidden;
  }
  
  .dialog-header {
    padding: 30rpx;
    text-align: center;
    border-bottom: 1rpx solid #eee;
    
    .dialog-title {
      font-size: 32rpx;
      font-weight: 500;
      color: #333;
    }
  }
  
  .dialog-body {
    padding: 30rpx;
    max-height: 60vh;
    overflow-y: auto;
    
    .section-title {
      font-size: 28rpx;
      color: #666;
      margin-bottom: 20rpx;
    }
    
    .keywords-list {
      margin-bottom: 20rpx;
      
      .keyword-item {
        display: flex;
        align-items: center;
        margin-bottom: 16rpx;
        
        .keyword-input {
          flex: 1;
          height: 72rpx;
          padding: 0 20rpx;
          border: 1rpx solid #ddd;
          border-radius: 8rpx;
          font-size: 28rpx;
        }
        
        .delete-btn {
          width: 72rpx;
          height: 72rpx;
          line-height: 72rpx;
          text-align: center;
          color: #999;
          font-size: 40rpx;
          
          &:active {
            opacity: 0.7;
          }
        }
      }
    }
    
    .add-keyword {
      display: flex;
      align-items: center;
      padding: 20rpx;
      background-color: #f5f5f5;
      border-radius: 8rpx;
      
      .add-icon {
        font-size: 32rpx;
        color: #666;
        margin-right: 10rpx;
      }
      
      .add-text {
        font-size: 28rpx;
        color: #666;
      }
      
      &:active {
        opacity: 0.7;
      }
    }
    
    .style-list {
      white-space: nowrap;
      margin: 0 -30rpx;
      padding: 0 30rpx;
      
      .style-item {
        display: inline-block;
        padding: 12rpx 24rpx;
        margin-right: 16rpx;
        background-color: #f5f5f5;
        border-radius: 100rpx;
        font-size: 26rpx;
        color: #333;
        
        &.selected {
          background-color: #00BFA6;
          color: #fff;
        }
        
        &:active {
          opacity: 0.7;
        }
      }
    }
  }
  
  .dialog-footer {
    display: flex;
    padding: 20rpx;
    border-top: 1rpx solid #eee;
    
    button {
      flex: 1;
      height: 80rpx;
      line-height: 80rpx;
      text-align: center;
      font-size: 28rpx;
      border-radius: 8rpx;
      margin: 0 10rpx;
      
      &.cancel-btn {
        background-color: #f5f5f5;
        color: #666;
      }
      
      &.confirm-btn {
        background-color: #00BFA6;
        color: #fff;
        
        &:disabled {
          opacity: 0.5;
        }
      }
      
      &:active {
        opacity: 0.7;
      }
    }
  }
}
</style> 