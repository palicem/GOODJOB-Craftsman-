<template>
  <view class="spec-popup-mask" @click.self="close">
    <view class="spec-popup">
      <view class="spec-title">请选择规格</view>
      <view v-for="spec in product.specs" :key="spec.name" class="spec-group">
        <view class="spec-label">{{ spec.name }}</view>
        <view class="spec-options">
          <view v-for="opt in spec.options" :key="opt" :class="['spec-option', selected[spec.name] === opt ? 'selected' : '']" @click="select(spec.name, opt)">{{ opt }}</view>
        </view>
      </view>
      <view class="spec-qty">
        <view>数量</view>
        <input type="number" v-model.number="quantity" min="1" :max="product.stock" />
        <view class="stock">库存：{{ product.stock }}</view>
      </view>
      <view class="spec-actions">
        <button class="btn-cancel" @click="close">取消</button>
        <button class="btn-confirm" @click="confirm">确定</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch } from 'vue';
const props = defineProps({
  product: Object,
  mode: String
});
const emit = defineEmits(['close', 'confirm']);
const selected = ref({});
const quantity = ref(1);

watch(() => props.product, (val) => {
  if (val && val.specs) {
    selected.value = {};
    val.specs.forEach(spec => {
      selected.value[spec.name] = spec.options[0];
    });
    console.log('初始化规格选择:', selected.value);
    quantity.value = 1;
  } else {
    console.warn('商品规格数据不完整:', val);
  }
}, { immediate: true });

const select = (name, opt) => {
  selected.value[name] = opt;
  console.log('选择规格:', name, opt, '当前选择:', selected.value);
};
const close = () => emit('close');
const confirm = () => {
  console.log('确认规格选择:', selected.value, '数量:', quantity.value);
  emit('confirm', { selectedSpecs: { ...selected.value }, quantity: quantity.value });
};
</script>

<style scoped>
.spec-popup-mask { position: fixed; left: 0; top: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); z-index: 100; display: flex; align-items: flex-end; }
.spec-popup { 
  background: #fff; 
  width: 100%; 
  border-radius: 20rpx 20rpx 0 0; 
  padding: 30rpx; 
  /* #ifdef H5 */
  max-width: 750rpx; /* Max width for H5 */
  margin-left: auto;   /* Center horizontally in H5 */
  margin-right: auto;  /* Center horizontally in H5 */
  /* #endif */
}
.spec-title { font-size: 30rpx; font-weight: bold; margin-bottom: 20rpx; }
.spec-group { margin-bottom: 20rpx; }
.spec-label { font-size: 26rpx; color: #333; margin-bottom: 10rpx; }
.spec-options { display: flex; flex-wrap: wrap; }
.spec-option { background: #f7f7f7; border-radius: 8rpx; padding: 10rpx 24rpx; margin-right: 16rpx; margin-bottom: 10rpx; font-size: 24rpx; color: #333; cursor: pointer; }
.spec-option.selected { background: #00BFA6; color: #fff; }
.spec-qty { display: flex; align-items: center; margin-bottom: 20rpx; }
.spec-qty input { width: 80rpx; margin: 0 10rpx; text-align: center; border: 1rpx solid #eee; border-radius: 6rpx; }
.stock { color: #999; font-size: 22rpx; margin-left: 20rpx; }
.spec-actions { display: flex; justify-content: flex-end; }
.btn-cancel { background: #eee; color: #333; border: none; border-radius: 8rpx; padding: 10rpx 30rpx; margin-right: 20rpx; }
.btn-confirm { background: #00BFA6; color: #fff; border: none; border-radius: 8rpx; padding: 10rpx 30rpx; }
</style> 