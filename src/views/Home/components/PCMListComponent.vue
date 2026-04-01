<template>
  <div class="pcm-list-container">
    <div v-if="isLoading" class="loading-tip">Loading PCM list...</div>

    <template v-else>
      <div v-if="kindTabs.length > 0" class="kind-tabs">
        <button
          v-for="tab in kindTabs"
          :key="tab.kind"
          type="button"
          class="kind-tab"
          :class="{ active: activeKind === tab.kind }"
          @click="activeKind = tab.kind"
        >
          <span class="kind-tab-icon">{{ tab.icon }}</span>
          <span class="kind-tab-label">{{ tab.label }}</span>
        </button>
      </div>

      <section v-if="currentThematicSynthesis" class="thematic-synthesis-card">
        <div class="thematic-synthesis-title">
          <span class="thematic-synthesis-icon">✨</span>
          <span>Thematic Synthesis</span>
        </div>
        <p class="thematic-synthesis-text">{{ currentThematicSynthesis }}</p>
      </section>

      <div v-if="visibleGroups.length > 0" class="groups-scroll">
        <section
          v-for="(group, groupIndex) in visibleGroups"
          :key="`${activeKind}-${group.title}-${groupIndex}`"
          class="group-section"
        >
          <h3 class="group-title">{{ group.title }}</h3>

          <ul class="cards-grid">
            <li
              v-for="(item, index) in group.items"
              :key="item.id || index"
              class="card-item"
              :class="{ selected: item.selected }"
              @click="handleItemClick($event, item)"
            >
              <div class="card-images">
                <img
                  v-for="(img, imgIndex) in item.mainImages"
                  :key="imgIndex"
                  :src="img.image_url"
                  :alt="item.title"
                  class="card-image draggable-item"
                  :style="getImageStyle(imgIndex, img.layout)"
                  draggable="true"
                  @dragstart="handlePCMDragStart($event, item)"
                />
              </div>
              <div class="card-footer">
                <span class="card-title">{{ item.title }}</span>
              </div>
            </li>
          </ul>
        </section>
      </div>

      <div v-else class="empty-tip">当前分类下暂无 PCM 记忆</div>
    </template>

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
import { computed, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import PCMDetailPopup from "@/components/PCMDetailPopup.vue";
import PCMCanvasPopup from "@/components/PCMCanvasPopup.vue";
import { usePCMStore } from "@/stores/pcmStore";

const selectAll = ref(false);
const popupVisible = ref(false);
const currentItem = ref({});
const popupPosition = ref({ top: 0, left: 0 });
const canvasPopupVisible = ref(false);
const canvasPopupPosition = ref({ top: 0, left: 0 });
const currentCanvasItem = ref({});
const activeKind = ref("");

const pcmStore = usePCMStore();
const { pcmTopicGroups, isLoading } = storeToRefs(pcmStore);

const KIND_META = {
  sensory: { label: "Sensory", icon: "👁️" },
  emotion: { label: "Emotion", icon: "😊" },
  meaning: { label: "Meaning", icon: "✨" },
  aesthetic: { label: "Aesthetic", icon: "🎨" },
  all: { label: "All", icon: "🗂️" },
};

const kindTabs = computed(() => {
  return pcmTopicGroups.value.map((section) => {
    const kind = String(section?.kind || "").trim();
    return {
      kind,
      label: String(section?.label || "").trim() || KIND_META[kind]?.label || kind,
      icon: KIND_META[kind]?.icon || "🗂️",
    };
  });
});

const visibleGroups = computed(() => {
  const currentSection = pcmTopicGroups.value.find((section) => section.kind === activeKind.value);

  return Array.isArray(currentSection?.groups) ? currentSection.groups : [];
});

const currentThematicSynthesis = computed(() => {
  const currentSection = pcmTopicGroups.value.find((section) => section.kind === activeKind.value);

  return String(currentSection?.thematicSynthesis || "").trim();
});

const visibleItems = computed(() =>
  visibleGroups.value.flatMap((group) => (Array.isArray(group?.items) ? group.items : []))
);

watch(
  kindTabs,
  (tabs) => {
    if (!tabs.length) {
      activeKind.value = "";
      return;
    }

    const hasCurrentKind = tabs.some((tab) => tab.kind === activeKind.value);
    if (!hasCurrentKind) {
      activeKind.value = tabs[0].kind;
    }
  },
  { immediate: true }
);

onMounted(async () => {
  try {
    await pcmStore.fetchPCMList();
  } catch (error) {
    console.error("加载 PCM 数据失败:", error);
  }
});

const getImageStyle = (index, layout) => {
  const offsets = [
    { top: 0, left: 0, rotate: layout.rotation },
    { top: 10, left: 20, rotate: layout.rotation || 8 },
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
  visibleItems.value.forEach((item) => {
    item.selected = selectAll.value;
  });
};

const updateSelectAll = () => {
  selectAll.value =
    visibleItems.value.length > 0 && visibleItems.value.every((item) => item.selected);
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
    // left: left
    left: 18,
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
    left: left,
  };

  currentCanvasItem.value = item;
  canvasPopupVisible.value = true;
};

const handleCloseCanvasPopup = () => {
  canvasPopupVisible.value = false;
};

const handlePCMDragStart = (event, item) => {
  event.dataTransfer.effectAllowed = "copy";
  const dragData = [
    {
      dragType: "PCM",
      data: item,
    },
  ];
  event.dataTransfer.setData("dragData", JSON.stringify(dragData));
};
</script>

<style scoped lang="scss">
.pcm-list-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 30px;
  padding: 12px 10px 14px;
  overflow: hidden;
  background: linear-gradient(180deg, #fbfbfc 0%, #f5f5f7 100%);

  .kind-tabs {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
    flex-shrink: 0;
  }

  .kind-tab {
    border: none;
    background: transparent;
    border-radius: 18px;
    padding: 12px 6px 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 10px 22px rgba(15, 23, 42, 0.06);

    &.active {
      background: linear-gradient(180deg, #dcebff 0%, #eef4ff 100%);
      color: #1677ff;
      box-shadow: inset 0 0 0 1px rgba(22, 119, 255, 0.08);
    }
  }

  .kind-tab-icon {
    font-size: 28px;
    line-height: 1;
  }

  .kind-tab-label {
    font-size: 12px;
    font-weight: 500;
  }

  .thematic-synthesis-card {
    flex-shrink: 0;
    border-radius: 28px;
    border: 1px solid #ddd;
    background: rgba(255, 255, 255, 0.96);
    padding: 8px 20px 20px;
    box-shadow: 0 12px 30px rgba(39, 148, 248, 0.08);
  }

  .thematic-synthesis-title {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
    color: #7a7a7a;
    font-size: 18px;
    font-weight: 500;
  }

  .thematic-synthesis-icon {
    font-size: 22px;
    line-height: 1;
    color: #ffbf00;
  }

  .thematic-synthesis-text {
    margin: 0;
    font-size: 15px;
    line-height: 1.55;
    color: #6d6d6d;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .groups-scroll {
    flex: 1;
    overflow-y: auto;
    padding-right: 4px;
  }

  .group-section + .group-section {
    margin-top: 22px;
    padding-top: 20px;
    border-top: 1px solid rgba(15, 23, 42, 0.08);
  }

  .group-title {
    margin: 0 0 12px;
    font-size: 15px;
    line-height: 1.25;
    font-weight: 500;
    color: #767676;
  }

  .loading-tip {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.95em;
    color: #666;
    background: #f7f7f7;
    border: 1px dashed #d9d9d9;
    border-radius: 10px;
    margin: 0.5em;
  }

  .empty-tip {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: #7a7a7a;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.75);
    border: 1px solid rgba(15, 23, 42, 0.06);
  }

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
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
    padding: 0;
    margin: 0;
    list-style: none;

    .card-item {
      position: relative;
      border: 1px solid rgba(15, 23, 42, 0.06);
      border-radius: 12px;
      padding: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: rgba(255, 255, 255, 0.94);
      box-shadow: 0 18px 38px rgba(15, 23, 42, 0.08);

      &.selected {
        border-color: rgba(22, 119, 255, 0.4);
        box-shadow: 0 18px 38px rgba(22, 119, 255, 0.12);
      }

      &:hover {
        transform: translateY(-1px);
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
        margin-bottom: 10px;
        border-radius: 10px;
        overflow: hidden;

        .card-image {
          position: absolute;
          width: 100%;
          height: 120px;
          object-fit: cover;
          border-radius: 10px;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
        }

        .draggable-item {
          cursor: move;
        }
      }

      .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .card-title {
          font-size: 12px;
          line-height: 1.35;
          color: #616161;
        }
      }
    }
  }
}
</style>
