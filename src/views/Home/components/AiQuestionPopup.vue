<template>
  <div v-if="visible" ref="popupWrapRef" class="ai-popup-wrap" :style="style">
    <div class="ai-question-popup">
      <!-- 通用头部 -->
      <div
        class="popup-header"
        :class="{ draggable: isDraggableView }"
        @mousedown="handleHeaderMouseDown"
      >
        <span>AI Tool - {{ toolType }}</span>
        <el-icon class="close-icon" @click="handleCancel"><Close /></el-icon>
      </div>

      <!-- 通用加载态 -->
      <div v-if="loading" class="loading-container">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>正在生成建议...</span>
      </div>

      <!-- Constellate 专区：文本 + 可多选图片 -->
      <div v-else-if="isConstellateView" class="popup-content constellate-content">
        <div class="constellate-text">{{ String(title || "").trim() }}</div>
        <div
          v-if="items.length > 0"
          class="constellate-grid"
        >
          <button
            v-for="(img, i) in items"
            :key="i"
            type="button"
            class="constellate-image-item"
            :class="{ selected: selectedConstellateImageIndexes.includes(i) }"
            @click="toggleConstellateImage(i)"
          >
            <span class="constellate-select-icon">
              <el-icon><Check /></el-icon>
            </span>
            <div class="constellate-image-thumb">
              <img :src="img.image_url" alt="" />
            </div>
            <div v-if="img.reason" class="constellate-image-reason">
              {{ img.reason }}
            </div>
          </button>
        </div>
        <div v-else class="empty-state">暂无图片</div>
      </div>

      <!-- Resonance 专区：analysis 列表 -->
      <div v-else-if="isResonanceView" class="popup-content resonance-content">
        <template v-if="items.length > 0">
          <div
            v-for="(item, index) in items"
            :key="item?.id || index"
            class="resonance-card"
            :class="{ active: selectedResonanceIndexes.includes(index) }"
            @click="toggleResonance(index)"
          >
            <span class="resonance-select-icon">
              <el-icon><Check /></el-icon>
            </span>
            <div class="resonance-card-head">
              <span class="resonance-kind">{{ item.kind }}</span>
            </div>
            <div v-if="item.keyword" class="resonance-keyword">{{ item.keyword }}</div>
            <div class="resonance-text">{{ item.text }}</div>
            <div v-if="Array.isArray(item.actions) && item.actions.length > 0" class="resonance-actions">
              <div
                v-for="action in item.actions"
                :key="action.id || `${index}-${action.kind || ''}`"
                class="resonance-action-item"
              >
                {{ action.description }}
              </div>
            </div>
          </div>
        </template>
        <div v-else class="empty-state">暂无分析结果</div>
      </div>

      <!-- Reflect 专区：问题卡片列表 -->
      <div
        v-else-if="isReflectView && items.length > 0"
        class="popup-content"
      >
        <div
          v-for="(item, index) in items"
          :key="index"
          :ref="(el) => setQuestionCardRef(el, index)"
          class="question-card"
          :class="{ active: selectedIndex === index }"
          @click="selectQuestion(index)"
        >
          <div class="question-main">
            <div class="question-text">
              {{ item.text }}
            </div>
            <div v-if="Array.isArray(item.memory) && item.memory.length > 0" class="image-row">
              <img
                v-for="(img, i) in item.memory"
                :key="i"
                :src="img.image_url"
                alt=""
              />
            </div>
            <div v-if="selectedIndex === index" class="selection-indicator checked">
              <el-icon><Check /></el-icon>
            </div>
            <div v-else class="selection-indicator"></div>
          </div>
        </div>
      </div>

      <!-- 通用空态 -->
      <div v-else class="popup-content empty-state">暂无建议</div>

      <!-- 通用确认区 -->
      <div
        v-if="isReflectView || isConstellateView || isResonanceView"
        class="popup-footer"
      >
        <el-button size="small" @click="handleRegenerate">Regenerate</el-button>
        <el-button
          v-if="isConstellateView || isResonanceView"
          type="primary"
          size="small"
          @click="handleConfirm"
          :disabled="confirmDisabled"
        >
          确认
        </el-button>
      </div>
    </div>

    <!-- Reflect 专用右侧工具栏（Constellate 不显示） -->
    <div
      v-if="selectedIndex !== -1 && !loading && !isConstellateView && quickTools.length > 0"
      class="popup-tools-panel"
      :style="toolsPanelStyle"
      @click.stop
    >
      <el-button
        v-for="tool in quickTools"
        :key="tool.value"
        class="tool-mini-btn"
        size="small"
        @click.stop="handleToolClick(tool.value, items[selectedIndex], selectedIndex)"
      >
        {{ tool.label }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { Check, Close, Loading } from "@element-plus/icons-vue";

// ------------------------
// Props / Emits
// ------------------------
const props = defineProps({
  visible: Boolean,
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 }),
  },
  label: {
    type: String,
    default: "",
  },
  toolType: {
    type: String,
    default: "Reflect",
  },
  lineLength: {
    type: Number,
    default: 0,
  },
  items: {
    type: Array,
    default: () => [],
  },
  title: {
    type: String,
    default: "",
  },
  loading: {
    type: Boolean,
    default: false,
  },
  quickTools: {
    type: Array,
    default: () => [
      { label: "💭  Whisper", value: "Whisper" },
      { label: "📷 Add Memory", value: "Add Memory" },
      { label: "✂️  Crop", value: "Crop" },
    ],
  },
});

const emit = defineEmits(["confirm", "cancel", "tool-click", "regenerate"]);

// ------------------------
// 通用状态
// ------------------------
const selectedIndex = ref(-1);
const selectedResonanceIndexes = ref([]);
const selectedConstellateImageIndexes = ref([]);
const popupWrapRef = ref(null);
const questionCardRefs = ref([]);
const toolsPanelTop = ref(0);
// 记录用户手动拖拽后的偏移量，叠加到父组件传入位置上
const popupOffset = ref({ x: 0, y: 0 });
const isDragging = ref(false);
let dragStartMouse = { x: 0, y: 0 };
let dragStartOffset = { x: 0, y: 0 };

// ------------------------
// 观察与重置
// ------------------------
// 弹窗打开时重置 Reflect/Constellate 的选择状态
watch(
  () => props.visible,
  (val) => {
    if (val) {
      selectedIndex.value = -1;
      selectedResonanceIndexes.value = [];
      selectedConstellateImageIndexes.value = [];
      popupOffset.value = { x: 0, y: 0 };
      nextTick(() => {
        updateToolsPanelTop();
      });
    } else {
      stopDragging();
    }
  }
);

// Reflect 列表更新时，重算右侧工具栏锚点
watch(
  () => props.items,
  (val) => {
    if (val && val.length > 0) {
    }
    nextTick(() => {
      updateToolsPanelTop();
    });
  }
);

// Reflect 选中项变化时，重算右侧工具栏锚点
watch(selectedIndex, () => {
  nextTick(() => {
    updateToolsPanelTop();
  });
});

// 切到 Constellate / Resonance 时清空其他选中态
watch(
  () => props.toolType,
  (val) => {
    if (val === "Constellate") {
      selectedIndex.value = -1;
      selectedConstellateImageIndexes.value = [];
    }
    if (val === "Resonance") {
      selectedIndex.value = -1;
      selectedResonanceIndexes.value = [];
      selectedConstellateImageIndexes.value = [];
    }
  }
);

// 数据更新后清空多选勾选状态
watch(
  () => props.items,
  () => {
    selectedResonanceIndexes.value = [];
    selectedConstellateImageIndexes.value = [];
  },
  { deep: true }
);

// ------------------------
// 视图计算
// ------------------------
const style = computed(() => {
  // 位置 = 基础锚点 + 手动拖拽偏移，并做基础边界钳制
  const left = Math.min(
    props.position.x + popupOffset.value.x,
    window.innerWidth - 580
  );
  const top = Math.min(
    props.position.y + popupOffset.value.y,
    window.innerHeight - 400
  );

  return {
    left: `${Math.max(20, left)}px`,
    top: `${Math.max(20, top)}px`,
  };
});

const isReflectView = computed(() => props.toolType === "Reflect");
const isResonanceView = computed(() => props.toolType === "Resonance");
const isDraggableView = computed(
  () => props.toolType === "Reflect" || props.toolType === "Constellate"
);
const isConstellateView = computed(() => props.toolType === "Constellate");

// Constellate：必须至少选择 1 张图片
// Reflect：必须选择 1 个问题项
const confirmDisabled = computed(() => {
  if (isConstellateView.value) {
    return props.items.length === 0 || selectedConstellateImageIndexes.value.length === 0;
  }
  if (isResonanceView.value) {
    return selectedResonanceIndexes.value.length === 0;
  }
  return selectedIndex.value === -1;
});

const toggleConstellateImage = (index) => {
  const next = [...selectedConstellateImageIndexes.value];
  const pos = next.indexOf(index);
  if (pos >= 0) {
    next.splice(pos, 1);
  } else {
    next.push(index);
  }
  selectedConstellateImageIndexes.value = next;
};

const toolsPanelStyle = computed(() => ({
  top: `${toolsPanelTop.value}px`,
}));

// ------------------------
// Reflect 交互
// ------------------------
const setQuestionCardRef = (el, index) => {
  if (el) {
    questionCardRefs.value[index] = el;
    return;
  }
  questionCardRefs.value[index] = null;
};

const updateToolsPanelTop = () => {
  if (selectedIndex.value < 0) {
    toolsPanelTop.value = 0;
    return;
  }

  const wrapEl = popupWrapRef.value;
  const cardEl = questionCardRefs.value[selectedIndex.value];
  if (!wrapEl || !cardEl) {
    toolsPanelTop.value = 0;
    return;
  }

  const wrapRect = wrapEl.getBoundingClientRect();
  const cardRect = cardEl.getBoundingClientRect();
  toolsPanelTop.value = Math.max(0, Math.round(cardRect.top - wrapRect.top));
};

const selectQuestion = (index) => {
  selectedIndex.value = index;
};

const toggleResonance = (index) => {
  const next = [...selectedResonanceIndexes.value];
  const found = next.indexOf(index);
  if (found >= 0) {
    next.splice(found, 1);
  } else {
    next.push(index);
  }
  selectedResonanceIndexes.value = next;
};

// Reflect 项上的快捷工具点击
const handleToolClick = (tool, item, index) => {
  emit("tool-click", {
    tool,
    item,
    index,
  });
};

const handleHeaderMouseDown = (event) => {
  // 仅左键可拖拽；Reflect / Constellate 都允许
  if (!isDraggableView.value || event.button !== 0) {
    return;
  }

  isDragging.value = true;
  dragStartMouse = {
    x: event.clientX,
    y: event.clientY,
  };
  dragStartOffset = {
    x: popupOffset.value.x,
    y: popupOffset.value.y,
  };

  document.addEventListener("mousemove", handleHeaderMouseMove);
  document.addEventListener("mouseup", stopDragging);
};

const handleHeaderMouseMove = (event) => {
  if (!isDragging.value) {
    return;
  }

  // 以按下时刻为基准累加位移，避免抖动和漂移
  popupOffset.value = {
    x: dragStartOffset.x + (event.clientX - dragStartMouse.x),
    y: dragStartOffset.y + (event.clientY - dragStartMouse.y),
  };
};

const stopDragging = () => {
  if (!isDragging.value) {
    return;
  }

  isDragging.value = false;
  document.removeEventListener("mousemove", handleHeaderMouseMove);
  document.removeEventListener("mouseup", stopDragging);
};

// ------------------------
// Constellate / Resonance 确认
// ------------------------
const handleConfirm = () => {
  let selectedItems = [];

  if (props.toolType === "Constellate") {
    selectedItems = selectedConstellateImageIndexes.value
      .map((idx) => props.items[idx])
      .filter(Boolean);
  } else if (props.toolType === "Resonance") {
    selectedItems = selectedResonanceIndexes.value
      .map((index) => props.items[index])
      .filter(Boolean);
  } else if (selectedIndex.value >= 0) {
    selectedItems = [props.items[selectedIndex.value]].filter(Boolean);
  }

  emit("confirm", {
    toolType: props.toolType,
    label: props.label,
    title: props.toolType === "Constellate" ? props.title || "" : "",
    selectedItems,
  });
};

const handleRegenerate = () => {
  emit("regenerate");
};

const handleCancel = () => {
  emit("cancel");
};

onBeforeUnmount(() => {
  // 组件卸载兜底清理监听，防止内存泄漏
  stopDragging();
});
</script>

<style scoped>
/* ===== 通用布局 ===== */
.ai-popup-wrap {
  position: fixed;
  z-index: 2000;
}

.ai-question-popup {
  position: relative;
  width: 300px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
    Arial, sans-serif;
}

.popup-header {
  padding: 12px 16px;
  font-weight: 600;
  font-size: 14px;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.popup-header.draggable {
  cursor: move;
}

.close-icon {
  cursor: pointer;
  font-size: 16px;
  color: #999;
  transition: color 0.2s;
}

.close-icon:hover {
  color: #333;
}

.popup-content {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.constellate-content {
  gap: 10px;
}

.constellate-text {
  font-size: 13px;
  line-height: 1.6;
  color: #2f3a4a;
  background: #f7fbff;
  border: 1px solid #e6edf7;
  border-radius: 8px;
  padding: 10px;
  white-space: pre-wrap;
}

.constellate-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.constellate-grid img {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e6edf7;
}

.constellate-image-item {
  position: relative;
  padding: 6px;
  border: 2px solid transparent;
  background: #fff;
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
}

.constellate-image-thumb {
  width: 100%;
}

.constellate-image-reason {
  margin-top: 6px;
  font-size: 12px;
  color: #475569;
  line-height: 1.4;
  line-clamp: 2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.constellate-select-icon,
.resonance-select-icon {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid #c4cedd;
  background: rgba(255, 255, 255, 0.92);
  color: #a7b4c8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  font-size: 12px;
}

.constellate-image-item.selected {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.18);
}

.constellate-image-item.selected .constellate-select-icon {
  border-color: #1890ff;
  background: #1890ff;
  color: #fff;
}

.resonance-card.active .resonance-select-icon {
  border-color: #1890ff;
  background: #1890ff;
  color: #fff;
}

.resonance-content {
  gap: 10px;
}

.resonance-card {
  position: relative;
  border: 1px solid #e6edf7;
  border-radius: 10px;
  padding: 10px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.resonance-card:hover {
  border-color: #93c5fd;
}

.resonance-card.active {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.resonance-card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.resonance-kind {
  font-size: 12px;
  color: #475569;
}

.resonance-keyword {
  font-size: 13px;
  color: #1d4ed8;
  margin-bottom: 6px;
}

.resonance-text {
  font-size: 13px;
  color: #334155;
  line-height: 1.6;
}

.resonance-actions {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.resonance-action-item {
  font-size: 12px;
  color: #475569;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 6px 8px;
}

.popup-footer {
  padding: 12px;
  border-top: 1px solid #f0f0f0;
  text-align: right;
  background: #fafafa;
}

.question-card {
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.question-card:hover {
  border-color: #1890ff;
}

.question-card.active {
  background: #e6f7ff;
  border-color: #91d5ff;
}

.question-main {
  position: relative;
  flex: 1;
  padding: 12px;
}

.question-text {
  font-size: 13px;
  color: #333;
  line-height: 1.5;
  margin-bottom: 8px;
  padding-right: 28px;
}

.popup-tools-panel {
  position: absolute;
  left: calc(100% + 12px);
  width: 136px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid #e6edf7;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(24, 57, 94, 0.12);
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tool-mini-btn {
  width: 100%;
  justify-content: center;
  margin-left: 0;
}

.image-row {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.image-row img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}

.selection-indicator {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #d9d9d9;
  background: white;
}

.selection-indicator.checked {
  background: #1890ff;
  border-color: #1890ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #666;
  gap: 10px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #999;
}
</style>
