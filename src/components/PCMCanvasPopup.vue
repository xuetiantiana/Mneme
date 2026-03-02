<template>
  <div 
    v-if="visible" 
    class="pcm-canvas-popup"
    :style="{ top: position.top + 'px', left: position.left + 'px' }"
  >
    <div class="popup-header">
      <span class="popup-title">PCM Canvas</span>
      <button class="close-btn" @click="handleClose">×</button>
    </div>
    <div class="popup-content">
      <KonvaComponent ref="konvaRef" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import KonvaComponent from '@/components/konvaComponent.vue'
import { createImageAndTextNodes } from '@/utils/canvasPositionUtils'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  position: {
    type: Object,
    default: () => ({ top: 0, left: 0 })
  },
  item: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close'])

const konvaRef = ref(null)

const handleClose = () => {
  emit('close')
}

const renderPCMContent = async () => {
  console.log(konvaRef.value, props.item)
  if (!konvaRef.value || !props.item ) {
    return
  }
  
  if (!konvaRef.value.konvaData.stage || !konvaRef.value.konvaData.stage) {
    setTimeout(() => {
      renderPCMContent()
    }, 200)
    return
  }
  
  try {
    const nodes = await createImageAndTextNodes({
      imageSrc: props.item.images[0],
      text: props.item.title,
      id: props.item.id
    })
    nodes.forEach(node => {
      console.log(node)
      konvaRef.value.konvaData.layer.add(node)
    })
  } catch (error) {
    console.error('Failed to create PCM nodes:', error)
  }
}

// 当弹窗可见时渲染PCM内容
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    setTimeout(() => {
      renderPCMContent()
    }, 500) // 进一步增加延迟时间，确保 Konva 组件初始化完成
  }
})

</script>
<style scoped lang="scss">
.pcm-canvas-popup {
  position: fixed;
  z-index: 1000;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  
  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #e8e8e8;
    background: #fafafa;
    
    .popup-title {
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }
    
    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      color: #999;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s;
      
      &:hover {
        background: #f0f0f0;
        color: #333;
      }
    }
  }
  
  .popup-content {
    width: 800px;
    height: 600px;
    padding: 0;
  }
}
</style>
