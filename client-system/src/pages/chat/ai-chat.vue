<template>
  <view class="container">
    <view class="input-section">
      <textarea 
        v-model="prompt"
        class="prompt-input"
        placeholder="请输入图片描述..."
        :maxlength="500"
        auto-height
      />
      <button @click="generateImage" :disabled="loading" class="generate-btn">
        {{ loading ? '生成中...' : '生成图片' }}
      </button>
    </view>

    <view v-if="error" class="error-message">
      {{ error }}
    </view>

    <view v-if="loading" class="loading-container">
      <view class="loading-spinner"></view>
      <text class="loading-text">正在生成图片，请稍候...</text>
    </view>

    <view v-if="imageUrl" class="image-container">
      <image 
        :src="imageUrl" 
        mode="aspectFit" 
        class="generated-image"
        @load="onImageLoad"
        @error="onImageError"
      />
      <view class="image-actions">
        <button class="action-btn" @click="saveImage">保存图片</button>
        <button class="action-btn" @click="shareImage">分享图片</button>
      </view>
    </view>
  </view>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      prompt: '',
      imageUrl: '',
      loading: false,
      error: '',
      imageLoaded: false
    }
  },
  methods: {
    async generateImage() {
      if (!this.prompt) {
        this.error = '请输入图片描述'
        return
      }

      this.loading = true
      this.error = ''
      this.imageUrl = ''
      this.imageLoaded = false

      try {
        const response = await axios({
          url: 'http://localhost:3001/generate-image',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          data: {
            prompt: this.prompt
          }
        })

        if (response.data.success && response.data.result) {
          this.imageUrl = response.data.result.image_url
        } else {
          throw new Error(response.data.message || '生成图片失败')
        }
      } catch (error) {
        console.error('生成图片错误:', error)
        this.error = error.response?.data?.message || error.message || '生成图片失败'
        this.imageUrl = ''
      } finally {
        // 注意：loading状态会在图片加载完成后关闭
      }
    },
    onImageLoad() {
      this.loading = false
      this.imageLoaded = true
    },
    onImageError() {
      this.loading = false
      this.error = '图片加载失败'
      this.imageUrl = ''
    },
    async saveImage() {
      if (!this.imageUrl) return
      try {
        // 下载图片
        const downloadRes = await uni.downloadFile({
          url: this.imageUrl
        })
        
        if (downloadRes.statusCode === 200) {
          // 保存到相册
          await uni.saveImageToPhotosAlbum({
            filePath: downloadRes.tempFilePath
          })
          uni.showToast({
            title: '保存成功',
            icon: 'success'
          })
        } else {
          throw new Error('下载失败')
        }
      } catch (error) {
        uni.showToast({
          title: '保存失败',
          icon: 'none'
        })
      }
    },
    shareImage() {
      if (!this.imageUrl) return
      // 调用系统分享
      uni.share({
        provider: "weixin",
        scene: "WXSceneSession",
        type: 2,
        imageUrl: this.imageUrl,
        success: function () {
          console.log("分享成功");
        },
        fail: function () {
          console.log("分享失败");
        }
      })
    }
  }
}
</script>

<style>
.container {
  padding: 20px;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

.prompt-input {
  width: 100%;
  min-height: 100px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
}

.generate-btn {
  background-color: #007AFF;
  color: white;
  padding: 12px;
  border-radius: 8px;
  border: none;
  font-size: 16px;
}

.generate-btn:disabled {
  background-color: #ccc;
}

.error-message {
  color: #ff4d4f;
  margin: 10px 0;
  padding: 10px;
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 4px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 20px 0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007AFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  margin-top: 10px;
  color: #666;
}

.image-container {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.generated-image {
  width: 100%;
  height: 512px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.image-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.action-btn {
  background-color: #f0f0f0;
  color: #333;
  padding: 8px 15px;
  border-radius: 4px;
  border: none;
  font-size: 14px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 