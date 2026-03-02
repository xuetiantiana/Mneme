<template>
  <div class="pcm-list-container">
    <!-- <div class="select-all-bar">
      <span>Select all memories</span>
      <input type="checkbox" v-model="selectAll" @change="handleSelectAll" />
    </div> -->

    <ul class="cards-grid">
      <li
        v-for="(item, index) in memoryItems"
        :key="index"
        class="card-item"
        :class="{ selected: item.selected }"
        
        @click="handleItemClick($event, item)"
      >
        <!-- <button
          class="add-btn"
          :class="{ active: item.selected }"
          @click.stop="toggleItem(item)"
        >
          <svg
            v-if="item.selected"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span v-else>+</span>
        </button> -->

        <button @click.stop="handleShowCanvas($event, item)">展示PCM canvas</button>
        <div class="card-images">
          <img
            v-for="(img, imgIndex) in item.images"
            :key="imgIndex"
            :src="img"
            :alt="item.title"
            class="card-image"
            :style="getImageStyle(imgIndex)"
            
          />
        </div>
        <div class="card-footer">
          <span class="card-title">{{ item.title }}</span>
        </div>
      </li>
    </ul>

    <PCMDetailPopup
      :visible="popupVisible"
      :item="currentItem"
      :position="popupPosition"
      @close="handleClosePopup"
    />
    
    <PCMCanvasPopup
      :visible="canvasPopupVisible"
      :position="canvasPopupPosition"
      :item="currentCanvasItem"
      @close="handleCloseCanvasPopup"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import PCMDetailPopup from "@/components/PCMDetailPopup.vue";
import PCMCanvasPopup from "@/components/PCMCanvasPopup.vue";

const selectAll = ref(false);
const popupVisible = ref(false);
const currentItem = ref({});
const popupPosition = ref({ top: 0, left: 0 });
const canvasPopupVisible = ref(false);
const canvasPopupPosition = ref({ top: 0, left: 0 });
const currentCanvasItem = ref({});

const getImageProxyUrl = (url) => {
  return url.replace("http://localhost:8000/api/images/data", "/data/PCM");
};

const memoryItems = ref([]);

onMounted(async () => {
  try {
    const response = await fetch('/data/PCM/pcm_list_response.json');
    const data = await response.json();
    
    if (data.units && Array.isArray(data.units)) {
      memoryItems.value = data.units.map(unit => ({
        id: unit.id,
        title: unit.unit_summary || '未命名记忆',
        selected: false,
        images: unit.user_input?.images?.map(img => getImageProxyUrl(img)) || [],
        createdAt: unit.created_at,
        text: unit.user_input?.text || '',
        timePlace: unit.user_input?.time_place || '',
        segments: unit.segments || [],
        user_input: unit.user_input || {}
      }));
      
      console.log('已加载 PCM 数据:', memoryItems.value.length, '条记忆', memoryItems.value);
    }
  } catch (error) {
    console.error('加载 PCM 数据失败:', error);
  }
});

const getImageStyle = (index) => {
  const offsets = [
    { top: 0, left: 0, rotate: -5 },
    { top: 10, left: 20, rotate: 8 },
  ];
  return {
    top: `${offsets[index].top}px`,
    left: `${offsets[index].left}px`,
    transform: `rotate(${offsets[index].rotate}deg)`,
    zIndex: offsets.length - index,
  };
};

const toggleItem = (item) => {
  item.selected = !item.selected;
  updateSelectAll();
};

const handleSelectAll = () => {
  memoryItems.value.forEach((item) => {
    item.selected = selectAll.value;
  });
};

const updateSelectAll = () => {
  selectAll.value = memoryItems.value.every((item) => item.selected);
};

const handleImageDragStart = (event, imgSrc, title) => {
  event.dataTransfer.effectAllowed = "copy";
  event.dataTransfer.setData("imageSrc", imgSrc);
  event.dataTransfer.setData("imageTitle", title);
  event.dataTransfer.setData("dragType", "single-image");
};

const handleCardDragStart = (event, item) => {
  event.dataTransfer.effectAllowed = "copy";
  event.dataTransfer.setData("cardData", JSON.stringify(item));
  event.dataTransfer.setData("dragType", "whole-card");
};

const handleItemClick = (event, item) => {
  const liElement = event.currentTarget;
  const rect = liElement.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  const popupWidth = 400;
  const popupHeight = 500;
  const margin = 8;
  
  let top = rect.bottom + margin;
  let left = rect.left;
  
  if (top + popupHeight > viewportHeight) {
    top = rect.top - popupHeight - margin;
  }
  
  if (left + popupWidth > viewportWidth) {
    left = viewportWidth - popupWidth - margin;
  }
  
  if (left < margin) {
    left = margin;
  }
  
  if (top < margin) {
    top = margin;
  }
  
  popupPosition.value = {
    top: top,
    left: left
  };
  
  currentItem.value = item;
  popupVisible.value = true;
};

const handleClosePopup = () => {
  popupVisible.value = false;
};

const handleShowCanvas = (event, item) => {
  const buttonElement = event.currentTarget;
  const rect = buttonElement.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  const popupWidth = 800;
  const popupHeight = 600;
  const margin = 8;
  
  let top = rect.bottom + margin;
  let left = rect.left;
  
  if (top + popupHeight > viewportHeight) {
    top = rect.top - popupHeight - margin;
  }
  
  if (left + popupWidth > viewportWidth) {
    left = viewportWidth - popupWidth - margin;
  }
  
  if (left < margin) {
    left = margin;
  }
  
  if (top < margin) {
    top = margin;
  }
  
  canvasPopupPosition.value = {
    top: top,
    left: left
  };
  
  currentCanvasItem.value = item;
  canvasPopupVisible.value = true;
};

const handleCloseCanvasPopup = () => {
  canvasPopupVisible.value = false;
};
</script>

<style scoped lang="scss">
.pcm-list-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0.875rem;
  overflow: hidden;

  .select-all-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.8rem;
    margin-bottom: 16px;
    border-bottom: 1px solid #e0e0e0;
    font-size: 1em;
    font-weight: 500;
    color: #777777;

    input[type="checkbox"] {
      width: 1rem;
      height: 1rem;
      cursor: pointer;
    }
  }

  .cards-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5em;
    background-color: #f1f1f1;
    padding: 0.5em;
    border-radius: 12px;
    overflow-y: auto;

    .card-item {
      position: relative;
      border: 1px solid transparent;
      border-radius: 12px;
      padding: 1.5em 0.9em 0.9em;
      cursor: pointer;
      transition: all 0.2s ease;
      background-color: #ddd;

      &.selected {
        border-color: #333;
      }

      &:hover {
        // border-color: #999;
      }

      button {
        position: absolute;
        top: 8px;
        right: 8px;
        padding: 4px 12px;
        font-size: 12px;
        background: #fff;
        border: 1px solid #d9d9d9;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
        z-index: 10;

        &:hover {
          background: #f0f0f0;
          border-color: #999;
        }
      }

      .add-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 1em;
        height: 1em;
        border: 2px solid #999;
        border-radius: 50%;
        background: #fff;
        font-size: 18px;
        font-weight: 500;
        color: #999;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        line-height: 1;
        transition: all 0.2s ease;
        z-index: 10;

        &.active {
          border-color: #333;
          background: #333;
          color: #fff;
        }

        &:hover:not(.active) {
          border-color: #333;
          color: #333;
        }
      }

      .card-images {
        position: relative;
        height: 120px;
        margin-bottom: 12px;

        .card-image {
          position: absolute;
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
      }

      .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .card-title {
          font-size: 0.875em;
          color: #333;
        }
      }
    }
  }
}
</style>
