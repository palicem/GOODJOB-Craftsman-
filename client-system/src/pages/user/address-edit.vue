<template>
  <view class="address-edit-container">
    <!-- 头部标题栏 -->
    <view class="header">
      <view class="back-btn" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <view class="header-title">
        <text class="title-text">{{isEdit ? '编辑地址' : '新增地址'}}</text>
      </view>
      <view class="save-btn" @click="saveAddress">
        <text class="save-text">保存</text>
      </view>
    </view>
    
    <!-- 表单区域 -->
    <view class="form-area">
      <view class="form-item">
        <text class="item-label">收货人</text>
        <input class="item-input" v-model="addressForm.name" placeholder="请输入收货人姓名" maxlength="20" />
      </view>
      
      <view class="form-item">
        <text class="item-label">手机号码</text>
        <input class="item-input" v-model="addressForm.phone" placeholder="请输入11位手机号码" type="number" maxlength="11" />
      </view>
      
      <view class="form-item">
        <text class="item-label">所在地区</text>
        <view class="item-picker" @click="showRegionPicker">
          <text class="picker-text" :class="{'placeholder': !region}">{{region || '请选择省市区'}}</text>
          <text class="picker-arrow">›</text>
        </view>
      </view>
      
      <view class="form-item">
        <text class="item-label">详细地址</text>
        <textarea class="item-textarea" v-model="addressForm.address" placeholder="街道、楼牌号等" maxlength="100" />
      </view>
      
      <view class="form-item address-tag">
        <text class="item-label">地址标签</text>
        <view class="tag-list">
          <view 
            class="tag-item" 
            :class="{'active': addressForm.tag === tag}"
            v-for="(tag, index) in addressTags" 
            :key="index"
            @click="selectTag(tag)"
          >
            {{tag}}
          </view>
          <view class="tag-item custom" @click="showCustomTagInput">
            {{showCustomTag ? '完成' : '自定义'}}
          </view>
        </view>
        <input 
          v-if="showCustomTag" 
          class="custom-tag-input" 
          v-model="customTag" 
          placeholder="自定义标签名称(5字以内)" 
          maxlength="5"
          @blur="addCustomTag"
        />
      </view>
      
      <view class="form-item switch-item">
        <text class="item-label">设为默认地址</text>
        <switch color="#00BFA6" :checked="addressForm.isDefault" @change="toggleDefault" />
      </view>
    </view>
    
    <!-- 删除按钮 -->
    <view class="delete-btn" v-if="isEdit" @click="handleDeleteAddress">
      <text class="delete-text">删除收货地址</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getAddressList, addAddress, updateAddress, deleteAddress } from '../../utils/profileService';

// 地址表单数据
const addressForm = ref({
  id: '', // 地址ID
  name: '', // 收货人姓名
  phone: '', // 手机号码
  province: '', // 省份
  city: '', // 城市
  district: '', // 区县
  address: '', // 详细地址
  tag: '家', // 地址标签
  isDefault: false // 是否默认地址
});

// 地址标签列表
const addressTags = ref(['家', '公司', '学校']);
// 是否显示自定义标签输入框
const showCustomTag = ref(false);
// 自定义标签内容
const customTag = ref('');
// 编辑模式标识
const isEdit = ref(false);
// 编辑的地址ID
const editId = ref(0);

// 区域选择器值
const regionValue = ref(['广东省', '深圳市', '南山区']);
// 省市区数据列表
const provinces = ref(['广东省', '北京市', '上海市', '浙江省', '江苏省', '四川省', '湖北省']);
const cities = ref({
  '广东省': ['广州市', '深圳市', '东莞市', '珠海市', '佛山市'],
  '北京市': ['东城区', '西城区', '朝阳区', '海淀区', '丰台区'],
  '上海市': ['黄浦区', '徐汇区', '长宁区', '静安区', '普陀区'],
  '浙江省': ['杭州市', '宁波市', '温州市', '嘉兴市', '湖州市'],
  '江苏省': ['南京市', '苏州市', '无锡市', '常州市', '南通市'],
  '四川省': ['成都市', '绵阳市', '德阳市', '自贡市', '泸州市'],
  '湖北省': ['武汉市', '宜昌市', '襄阳市', '荆州市', '十堰市']
});
const districts = ref({
  '广州市': ['天河区', '越秀区', '海珠区', '白云区', '黄埔区'],
  '深圳市': ['南山区', '福田区', '罗湖区', '宝安区', '龙岗区'],
  '东莞市': ['莞城区', '东城区', '南城区', '万江区', '长安镇'],
  '杭州市': ['西湖区', '上城区', '下城区', '江干区', '拱墅区'],
  '南京市': ['鼓楼区', '玄武区', '秦淮区', '建邺区', '栖霞区'],
  '成都市': ['锦江区', '青羊区', '金牛区', '武侯区', '成华区'],
  '武汉市': ['江岸区', '江汉区', '硚口区', '汉阳区', '武昌区']
});

// 组合的地区显示文本
const region = computed(() => {
  if (addressForm.value.province && addressForm.value.city && addressForm.value.district) {
    return `${addressForm.value.province} ${addressForm.value.city} ${addressForm.value.district}`;
  }
  return '';
});

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 显示区域选择器
const showRegionPicker = () => {
  const provinceIndex = provinces.value.findIndex(p => p === addressForm.value.province) || 0;
  const selectedProvince = provinces.value[provinceIndex >= 0 ? provinceIndex : 0];
  const citiesOfProvince = cities.value[selectedProvince] || [];
  const cityIndex = citiesOfProvince.findIndex(c => c === addressForm.value.city) || 0;
  const selectedCity = citiesOfProvince[cityIndex >= 0 ? cityIndex : 0];
  const districtsOfCity = districts.value[selectedCity] || [];
  const districtIndex = districtsOfCity.findIndex(d => d === addressForm.value.district) || 0;
  
  uni.showActionSheet({
    itemList: ['选择省份', '选择城市', '选择区县'],
    success: function (res) {
      switch (res.tapIndex) {
        case 0:
          selectProvince();
          break;
        case 1:
          if (!addressForm.value.province) {
            uni.showToast({
              title: '请先选择省份',
              icon: 'none'
            });
            return;
          }
          selectCity();
          break;
        case 2:
          if (!addressForm.value.province || !addressForm.value.city) {
            uni.showToast({
              title: '请先选择省份和城市',
              icon: 'none'
            });
            return;
          }
          selectDistrict();
          break;
      }
    }
  });
};

// 选择省份
const selectProvince = () => {
  uni.showActionSheet({
    itemList: provinces.value,
    success: function (res) {
      addressForm.value.province = provinces.value[res.tapIndex];
      addressForm.value.city = '';
      addressForm.value.district = '';
      
      // 自动弹出城市选择
      setTimeout(() => {
        selectCity();
      }, 500);
    }
  });
};

// 选择城市
const selectCity = () => {
  const citiesOfProvince = cities.value[addressForm.value.province] || [];
  if (citiesOfProvince.length === 0) {
    uni.showToast({
      title: '该省份暂无城市数据',
      icon: 'none'
    });
    return;
  }
  
  uni.showActionSheet({
    itemList: citiesOfProvince,
    success: function (res) {
      addressForm.value.city = citiesOfProvince[res.tapIndex];
      addressForm.value.district = '';
      
      // 自动弹出区县选择
      setTimeout(() => {
        selectDistrict();
      }, 500);
    }
  });
};

// 选择区县
const selectDistrict = () => {
  const districtsOfCity = districts.value[addressForm.value.city] || [];
  if (districtsOfCity.length === 0) {
    uni.showToast({
      title: '该城市暂无区县数据',
      icon: 'none'
    });
    return;
  }
  
  uni.showActionSheet({
    itemList: districtsOfCity,
    success: function (res) {
      addressForm.value.district = districtsOfCity[res.tapIndex];
    }
  });
};

// 选择标签
const selectTag = (tag) => {
  addressForm.value.tag = tag;
};

// 显示自定义标签输入框
const showCustomTagInput = () => {
  showCustomTag.value = !showCustomTag.value;
  if (!showCustomTag.value && customTag.value) {
    addCustomTag();
  }
};

// 添加自定义标签
const addCustomTag = () => {
  if (customTag.value.trim()) {
    if (!addressTags.value.includes(customTag.value)) {
      addressTags.value.push(customTag.value);
    }
    addressForm.value.tag = customTag.value;
    customTag.value = '';
    showCustomTag.value = false;
  }
};

// 切换默认地址状态
const toggleDefault = (e) => {
  addressForm.value.isDefault = e.detail.value;
};

// 保存地址
const saveAddress = async () => {
  try {
    // 表单验证
    if (!addressForm.value.name.trim()) {
      return uni.showToast({
        title: '请输入收货人姓名',
        icon: 'none'
      });
    }
    
    if (!addressForm.value.phone.trim()) {
      return uni.showToast({
        title: '请输入手机号码',
        icon: 'none'
      });
    }
    
    const phoneRegex = /^1\d{10}$/;
    if (!phoneRegex.test(addressForm.value.phone)) {
      return uni.showToast({
        title: '请输入正确的手机号码',
        icon: 'none'
      });
    }
    
    if (!addressForm.value.province || !addressForm.value.city || !addressForm.value.district) {
      return uni.showToast({
        title: '请选择所在地区',
        icon: 'none'
      });
    }
    
    if (!addressForm.value.address.trim()) {
      return uni.showToast({
        title: '请输入详细地址',
        icon: 'none'
      });
    }
    
    let success = false;
    const saveData = { ...addressForm.value };
    
    if (isEdit.value) {
      // 编辑模式：更新现有地址
      saveData.id = editId.value;
      console.log('更新地址数据:', saveData);
      success = await updateAddress(saveData);
    } else {
      // 添加模式：添加新地址
      console.log('新增地址数据:', saveData);
      success = await addAddress(saveData);
    }
    
    if (success) {
      // 触发地址更新事件
      uni.$emit('addressUpdated');
      
      uni.showToast({
        title: isEdit.value ? '地址已更新' : '地址已添加',
        icon: 'success'
      });
      
      // 返回上一页
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    } else {
      throw new Error('操作失败');
    }
  } catch (error) {
    console.error('保存地址失败:', error);
    uni.showToast({
      title: '操作失败，请重试',
      icon: 'none'
    });
  }
};

// 删除地址
const handleDeleteAddress = () => {
  uni.showModal({
    title: '提示',
    content: '确定要删除这个地址吗？',
    success: async (res) => {
      if (res.confirm) {
        const success = await deleteAddress(editId.value);
        if (success) {
          // 触发地址更新事件
          uni.$emit('addressUpdated');
          
          uni.showToast({
            title: '地址已删除',
            icon: 'success'
          });
          
          // 等待 Toast 显示完成后再返回
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        } else {
          uni.showToast({
            title: '删除失败，请重试',
            icon: 'none'
          });
        }
      }
    }
  });
};

// 页面加载
onMounted(async () => {
  try {
    // 获取路由参数
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const options = currentPage.options || {};
    
    console.log('页面参数:', options);
    
    // 判断是编辑模式还是新增模式
    const mode = options.mode || 'add';
    isEdit.value = mode === 'edit';
    
    if (isEdit.value && options.id) {
      // 编辑模式：获取地址ID并加载地址信息
      editId.value = options.id;
      console.log('编辑地址ID:', editId.value);
      
      // 加载地址列表
      const addressList = await getAddressList();
      console.log('地址列表:', addressList);
      
      // 查找要编辑的地址
      const address = addressList.find(item => String(item.id) === String(editId.value));
      console.log('找到的地址:', address);
      
      if (address) {
        // 确保所有必要字段都存在
        const formattedAddress = {
          id: address.id || '',
          name: address.name || '',
          phone: address.phone || '',
          province: address.province || '',
          city: address.city || '',
          district: address.district || '',
          address: address.address || '',
          tag: address.tag || '家',
          isDefault: !!address.isDefault
        };
        
        // 填充表单数据
        addressForm.value = formattedAddress;
        console.log('填充的表单数据:', addressForm.value);
      } else {
        console.error('未找到对应的地址信息');
        uni.showToast({
          title: '地址信息不存在',
          icon: 'none'
        });
        setTimeout(() => {
          uni.navigateBack();
        }, 1500);
      }
    }
  } catch (error) {
    console.error('加载地址信息失败:', error);
    uni.showToast({
      title: '加载地址信息失败',
      icon: 'none'
    });
  }
});
</script>

<style lang="scss">
.address-edit-container {
  min-height: 100vh;
  background-color: #f8f8f8;
  padding-bottom: 150rpx;
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

.form-area {
  margin-top: 20rpx;
  background-color: #ffffff;
}

.form-item {
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  display: flex;
  align-items: flex-start;
  
  &:last-child {
    border-bottom: none;
  }
}

.item-label {
  width: 160rpx;
  font-size: 28rpx;
  color: #333;
  padding-top: 6rpx;
}

.item-input {
  flex: 1;
  height: 60rpx;
  font-size: 28rpx;
}

.item-textarea {
  flex: 1;
  height: 120rpx;
  font-size: 28rpx;
  line-height: 1.5;
}

.item-picker {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.picker-text {
  font-size: 28rpx;
  color: #333;
  
  &.placeholder {
    color: #999;
  }
}

.picker-arrow {
  font-size: 32rpx;
  color: #999;
  transform: rotate(90deg);
}

.address-tag {
  flex-direction: column;
  align-items: flex-start;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  margin-top: 20rpx;
  width: 100%;
}

.tag-item {
  height: 60rpx;
  padding: 0 30rpx;
  border: 1rpx solid #ddd;
  border-radius: 30rpx;
  margin-right: 20rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  color: #666;
  
  &.active {
    border-color: #00BFA6;
    background-color: rgba(0, 191, 166, 0.1);
    color: #00BFA6;
  }
  
  &.custom {
    border-style: dashed;
  }
}

.custom-tag-input {
  width: 100%;
  height: 80rpx;
  margin-top: 20rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  padding: 0 20rpx;
  font-size: 26rpx;
}

.switch-item {
  justify-content: space-between;
}

.delete-btn {
  margin: 60rpx 30rpx;
  height: 90rpx;
  background-color: #fff;
  border: 1rpx solid #ddd;
  border-radius: 45rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-text {
  font-size: 28rpx;
  color: #ff4d4f;
}
</style> 