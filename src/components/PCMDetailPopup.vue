<template>
  <div 
    v-if="visible" 
    class="pcm-detail-popup"
    :style="{ top: position.top + 'px', left: position.left + 'px' }"
  >
    <div class="popup-header">
      <button class="close-btn" @click="handleClose">×</button>
    </div>
    <div class="popup-content">
      <div class="popup-section main-image-section" v-if="item.images && item.images.length > 0">
        <img
          :src="item.images[0]"
          :alt="item.title"
          class="main-image draggable-item"
          draggable="true"
          @dragstart="handleImageDragStart($event, item.images[0], item.title, item.id)"
        />
      </div>
      <div class="popup-section">
        <h3 
          class="popup-title draggable-item" 
          draggable="true"
          @dragstart="handleTextDragStart($event, item.title, item.id)"
        >
          {{ item.title }}
        </h3>
      </div>
      <div class="popup-section interpretations-section" v-if="item.segments && item.segments.length > 0">
        <div class="interpretations-list">
          <div 
            v-for="segment in item.segments" 
            :key="segment.seg_id"
            class="segment-item"
          >
            <div class="segment-left">
              <div class="segment-header">
                <span 
                  class="segment-label draggable-item"
                  draggable="true"
                  @dragstart="handleTextDragStart($event, segment.label, segment.seg_id)"
                >
                  {{ segment.label }}
                </span>
              </div>
              <div class="segment-image" v-if="segment.image_url">
                <img
                  :src="getImageProxyUrl(segment.image_url)"
                  :alt="segment.label"
                  class="segment-image-img draggable-item"
                  draggable="true"
                  @dragstart="handleImageDragStart($event, getImageProxyUrl(segment.image_url), segment.label, segment.seg_id)"
                />
              </div>
            </div>
            <div class="segment-right">
              <div class="interpretations-content" v-if="segment.interpretations">
                <div class="interpretation-group" v-if="segment.interpretations.meaning && segment.interpretations.meaning.length > 0">
                  <span class="interpretation-type-label">含义：</span>
                  <div class="interpretation-items">
                    <span 
                      v-for="interp in segment.interpretations.meaning" 
                      :key="interp.id"
                      class="interpretation-item draggable-item"
                      :style="getInterpretationStyle('meaning', interp.specificity)"
                      draggable="true"
                      @dragstart="handleTextDragStart($event, interp.text, 'meaning', interp.id)"
                    >
                      {{ interp.text }}
                    </span>
                  </div>
                </div>
                <div class="interpretation-group" v-if="segment.interpretations.emotion && segment.interpretations.emotion.length > 0">
                  <span class="interpretation-type-label">情感：</span>
                  <div class="interpretation-items">
                    <span 
                      v-for="interp in segment.interpretations.emotion" 
                      :key="interp.id"
                      class="interpretation-item draggable-item"
                      :style="getInterpretationStyle('emotion', interp.specificity)"
                      draggable="true"
                      @dragstart="handleTextDragStart($event, interp.text, 'emotion', interp.id)"
                    >
                      {{ interp.text }}
                    </span>
                  </div>
                </div>
                <div class="interpretation-group" v-if="segment.interpretations.sensory && segment.interpretations.sensory.length > 0">
                  <span class="interpretation-type-label">感官：</span>
                  <div class="interpretation-items">
                    <span 
                      v-for="interp in segment.interpretations.sensory" 
                      :key="interp.id"
                      class="interpretation-item draggable-item"
                      :style="getInterpretationStyle('sensory', interp.specificity)"
                      draggable="true"
                      @dragstart="handleTextDragStart($event, interp.text, 'sensory', interp.id)"
                    >
                      {{ interp.text }}
                      <span class="modality-tag" v-if="interp.modality">{{ interp.modality }}</span>
                    </span>
                  </div>
                </div>
                <div class="interpretation-group" v-if="segment.interpretations.aesthetic && segment.interpretations.aesthetic.length > 0">
                  <span class="interpretation-type-label">美学：</span>
                  <div class="interpretation-items">
                    <span 
                      v-for="interp in segment.interpretations.aesthetic" 
                      :key="interp.id"
                      class="interpretation-item draggable-item"
                      :style="getInterpretationStyle('aesthetic', interp.specificity)"
                      draggable="true"
                      @dragstart="handleTextDragStart($event, interp.text, 'aesthetic', interp.id)"
                    >
                      {{ interp.text }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
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

const getImageProxyUrl = (url) => {
  return url.replace("http://localhost:8000/api/images/data", "/data/PCM");
}



const getInterpretationStyle = (type, specificity) => {
  const baseColors = {
    meaning: { r: 24, g: 144, b: 255 },
    emotion: { r: 255, g: 77, b: 79 },
    sensory: { r: 82, g: 196, b: 26 },
    aesthetic: { r: 114, g: 46, b: 209 }
  }
  
  const color = baseColors[type] || { r: 150, g: 150, b: 150 }
  const intensity = specificity / 5
  
  return {
    backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity})`
  }
}

const handleImageDragStart = (event, imgSrc, title, id) => {
  event.dataTransfer.effectAllowed = "copy";
  event.dataTransfer.setData("imageSrc", imgSrc);
  event.dataTransfer.setData("imageTitle", title);
  event.dataTransfer.setData("dragType", "single-image");
  event.dataTransfer.setData("id", id || "");
}

const handleTextDragStart = (event, text, id) => {
  event.dataTransfer.effectAllowed = "copy";
  event.dataTransfer.setData("textContent", text);
  event.dataTransfer.setData("dragType", "text");
  event.dataTransfer.setData("id", id || "");
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
  max-height: 500px;
  overflow-y: auto;
  .popup-header {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #e8e8e8;
    background: #fff;

    .close-btn {
      width: 28px;
      height: 28px;
      border: none;
      background: #f5f5f5;
      border-radius: 50%;
      cursor: pointer;
      font-size: 20px;
      line-height: 1;
      color: #666;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      &:hover {
        background: #e8e8e8;
        color: #333;
      }
    }
  }

  .popup-content {
    padding: 16px;

    .draggable-item {
      cursor: move;
    }

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
        font-size: 14px;
        color: #333;
        line-height: 1.6;
        margin: 0;
      }

      .popup-title {
        font-size: 1em;
        font-weight: 400;
        color: #333;
        margin: 0;
        line-height: 1.4;
      }

      &.main-image-section {
        text-align: center;
        padding: 0;
        margin-bottom: 16px;

        .main-image {
          width: 100px;
          height: 100px;
          background: #f1f1f1;
          object-fit: contain;
          border-radius: 8px;
          transition: all 0.2s;

          &:hover {
            box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
            transform: scale(1.02);
          }

          &:active {
            opacity: 0.8;
          }
        }
      }
    }

    .interpretations-section {
      .interpretations-list {
        display: flex;
        flex-direction: column;
        gap: 16px;

        .segment-item {
          background: #f9f9f9;
          border-radius: 8px;
          padding: 12px;
          border: 1px solid #e8e8e8;
          display: flex;
          gap: 12px;

          .segment-left {
            flex: 0 0 150px;
            display: flex;
            flex-direction: column;
            gap: 8px;

            .segment-header {
              display: flex;
              flex-direction: column;
              gap: 4px;

              .segment-label {
                font-size: 14px;
                font-weight: 600;
                color: #333;
              }

              .segment-type {
                font-size: 12px;
                padding: 4px 8px;
                background: #e8e8e8;
                border-radius: 4px;
                color: #666;
                align-self: flex-start;
              }
            }

            .segment-image {
              margin: 0;
              text-align: center;

              .segment-image-img {
                max-width: 100%;
                max-height: 120px;
                border-radius: 6px;
                cursor: move;
                transition: all 0.2s;

                &:hover {
                  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
                }
              }
            }
          }

          .segment-right {
            flex: 1;
            display: flex;
            flex-direction: column;

            .interpretations-content {
              display: flex;
              flex-direction: column;
              gap: 12px;

              .interpretation-group {
                .interpretation-type-label {
                  display: block;
                  font-size: 13px;
                  font-weight: 600;
                  color: #666;
                  margin-bottom: 8px;
                  padding-left: 8px;
                  border-left: 3px solid #1890ff;
                }

                .interpretation-items {
                  display: flex;
                  flex-wrap: wrap;
                  gap: 8px;
                  padding-left: 8px;

                  .interpretation-item {
                    font-size: 13px;
                    background: #fff;
                    padding: 6px 12px;
                    border-radius: 4px;
                    border: 1px solid #d9d9d9;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.2s;

                    &:hover {
                      transform: translateY(-1px);
                      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    }

                    .modality-tag {
                      font-size: 11px;
                      padding: 2px 6px;
                      background: rgba(0, 0, 0, 0.05);
                      color: #666;
                      border-radius: 3px;
                    }
                  }
                }
              }
            }
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
