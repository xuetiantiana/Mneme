<template>
  <div 
    v-if="visible" 
    class="pcm-detail-popup"
    :style="{ top: position.top + 'px', left: position.left + 'px' }"
  >
    <div class="popup-header">
      <h3>{{ item.title }}</h3>
      <button class="close-btn" @click="handleClose">×</button>
    </div>
    <div class="popup-content">
      <div class="popup-section">
        <span class="popup-label">标题：</span>
        <p 
          class="popup-text draggable-text"
          draggable="true"
          @dragstart="handleTextDragStart($event, item.title)"
        >
          {{ item.title }}
        </p>
      </div>
      <div class="popup-section">
        <span class="popup-label">图片数量：</span>
        <p class="popup-text">{{ item.images ? item.images.length : 0 }} 张</p>
      </div>
      <div class="popup-section">
        <span class="popup-label">选中状态：</span>
        <p class="popup-text">{{ item.selected ? '已选中' : '未选中' }}</p>
      </div>
      <div class="popup-section">
        <span class="popup-label">图片预览：</span>
        <div class="popup-images">
          <img
            v-for="(img, index) in item.images"
            :key="index"
            :src="img"
            :alt="item.title"
            class="popup-image"
            draggable="true"
            @dragstart="handleImageDragStart($event, img, item.title)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  item: {
    type: Object,
    default: () => ({})
  },
  position: {
    type: Object,
    default: () => ({ top: 0, left: 0 })
  }
})

const emit = defineEmits(['close'])

const handleClose = () => {
  emit('close')
}

const handleImageDragStart = (event, imgSrc, title) => {
  event.dataTransfer.effectAllowed = "copy";
  event.dataTransfer.setData("imageSrc", imgSrc);
  event.dataTransfer.setData("imageTitle", title);
  event.dataTransfer.setData("dragType", "single-image");
}

const handleTextDragStart = (event, text) => {
  event.dataTransfer.effectAllowed = "copy";
  event.dataTransfer.setData("textContent", text);
  event.dataTransfer.setData("dragType", "text");
}
</script>

<style scoped lang="scss">
.pcm-detail-popup {
  position: fixed;
  z-index: 1000;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 300px;
  max-width: 400px;
  animation: fadeIn 0.2s ease;

  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #e8e8e8;

    h3 {
      margin: 0;
      font-size: 16px;
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
      transition: color 0.2s;

      &:hover {
        color: #333;
      }
    }
  }

  .popup-content {
    padding: 16px;

    .popup-section {
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }

      .popup-label {
        display: block;
        font-size: 14px;
        font-weight: 500;
        color: #666;
        margin-bottom: 8px;
      }

      .popup-text {
        margin: 0;
        font-size: 14px;
        color: #333;
        line-height: 1.6;

        &.draggable-text {
          cursor: move;
          padding: 8px;
          border-radius: 4px;
          transition: background 0.2s;

          &:hover {
            background: #f5f5f5;
          }

          &:active {
            background: #e8e8e8;
          }
        }
      }

      .popup-images {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;

        .popup-image {
          width: 100%;
          height: 80px;
          object-fit: cover;
          border-radius: 6px;
          border: 1px solid #e8e8e8;
          cursor: move;
          transition: all 0.2s;

          &:hover {
            border-color: #1890ff;
            box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
          }

          &:active {
            opacity: 0.8;
          }
        }
      }
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
