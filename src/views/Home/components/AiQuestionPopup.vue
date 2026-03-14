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
        <div class="constellate-text">{{ String(constellateData?.ttt || "").trim() }}</div>
        <div
          v-if="(Array.isArray(constellateData?.mmm) ? constellateData.mmm : []).flatMap((item) => (Array.isArray(item?.images) ? item.images : ((typeof item?.imageUrl === 'string' && item.imageUrl.trim().length > 0) ? [item.imageUrl] : []))).filter((url) => typeof url === 'string' && url.trim().length > 0).length"
          class="constellate-grid"
        >
          <button
            v-for="(img, i) in (Array.isArray(constellateData?.mmm) ? constellateData.mmm : []).flatMap((item) => (Array.isArray(item?.images) ? item.images : ((typeof item?.imageUrl === 'string' && item.imageUrl.trim().length > 0) ? [item.imageUrl] : []))).filter((url) => typeof url === 'string' && url.trim().length > 0)"
            :key="i"
            type="button"
            class="constellate-image-item"
            :class="{ selected: selectedConstellateImageIndexes.includes(i) }"
            @click="toggleConstellateImage(i)"
          >
            <span class="constellate-select-icon">
              <el-icon><Check /></el-icon>
            </span>
            <img :src="img" alt="" />
          </button>
        </div>
        <div v-else class="empty-state">暂无图片</div>
      </div>

      <!-- Reflect 专区：问题卡片列表 -->
      <div
        v-else-if="questionList && questionList.length > 0"
        class="popup-content"
      >
        <div
          v-for="(item, index) in questionList"
          :key="index"
          :ref="(el) => setQuestionCardRef(el, index)"
          class="question-card"
          :class="{ active: selectedIndex === index }"
          @click="selectQuestion(index)"
        >
          <div class="question-main">
            <div class="question-text">
              {{ item?.text || item?.question || "" }}
            </div>
            <div
              v-if="((Array.isArray(item?.images) && item.images.length > 0) ? item.images.filter(Boolean) : ((Array.isArray(item?.memory) && item.memory.length > 0) ? item.memory.map((m) => m?.image_url).filter((url) => typeof url === 'string' && url.trim().length > 0) : [])).length"
              class="image-row"
            >
              <img
                v-for="(img, i) in ((Array.isArray(item?.images) && item.images.length > 0) ? item.images.filter(Boolean) : ((Array.isArray(item?.memory) && item.memory.length > 0) ? item.memory.map((m) => m?.image_url).filter((url) => typeof url === 'string' && url.trim().length > 0) : []))"
                :key="i"
                :src="img"
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
      <div v-if="isConstellateView" class="popup-footer">
        <el-button
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
      v-if="selectedIndex !== -1 && !loading && !isConstellateView"
      class="popup-tools-panel"
      :style="toolsPanelStyle"
      @click.stop
    >
      <el-button
        v-for="tool in quickTools"
        :key="tool.value"
        class="tool-mini-btn"
        size="small"
        @click.stop="handleToolClick(tool.value, selectedItem, selectedIndex)"
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
  questionList: {
    type: Array,
    default: () => [],
  },
  constellateData: {
    type: Object,
    default: () => ({ ttt: "", mmm: [] }),
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

const emit = defineEmits(["confirm", "cancel", "tool-click"]);

// ------------------------
// 通用状态
// ------------------------
const selectedIndex = ref(-1);
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
      selectedConstellateImageIndexes.value = [];
      popupOffset.value = { x: 0, y: 0 };
      nextTick(() => {
        updateToolsPanelTop();
      });
    } else {
      // 弹窗关闭时确保注销全局拖拽监听
      stopDragging();
    }
  }
);

// Reflect 列表更新时，重算右侧工具栏锚点
watch(
  () => props.questionList,
  (val) => {
    if (val && val.length > 0) {
      // 默认选中第一个? 或者不选中
      // selectedIndex.value = 0;
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

// 切到 Constellate 时清空 Reflect/Constellate 选中态
watch(
  () => props.toolType,
  (val) => {
    if (val === "Constellate") {
      selectedIndex.value = -1;
      selectedConstellateImageIndexes.value = [];
    }
  }
);

// Constellate 数据更新后清空图片勾选
watch(
  () => props.constellateData,
  () => {
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

const selectedItem = computed(() => {
  if (selectedIndex.value < 0) return null;
  return props.questionList?.[selectedIndex.value] || null;
});

const isReflectView = computed(() => props.toolType === "Reflect");
const isDraggableView = computed(
  () => props.toolType === "Reflect" || props.toolType === "Constellate"
);

// 区分 Constellate / Reflect 渲染分支
const isConstellateView = computed(() => props.toolType === "Constellate");

// Constellate：必须至少选择 1 张图片
// Reflect：必须选择 1 个问题项
const confirmDisabled = computed(() => {
  if (isConstellateView.value) {
    const images = (Array.isArray(props.constellateData?.mmm)
      ? props.constellateData.mmm
      : []
    )
      .flatMap((item) => (Array.isArray(item?.images)
        ? item.images
        : ((typeof item?.imageUrl === "string" && item.imageUrl.trim().length > 0)
          ? [item.imageUrl]
          : [])))
      .filter((url) => typeof url === "string" && url.trim().length > 0);
    return images.length === 0 || selectedConstellateImageIndexes.value.length === 0;
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
// Constellate 交互
// ------------------------
const handleConfirm = () => {
  // Constellate：提交被勾选的图片，并附带首张图片元信息
  if (isConstellateView.value) {
    const text = String(props.constellateData?.ttt || "").trim();
    const allImageItems = (Array.isArray(props.constellateData?.mmm)
      ? props.constellateData.mmm
      : []
    )
      .flatMap((item) => {
        if (Array.isArray(item?.images) && item.images.length > 0) {
          return item.images
            .filter((url) => typeof url === "string" && url.trim().length > 0)
            .map((url) => ({
              url,
              id: item?.id || "",
              type: item?.type || "",
            }));
        }

        if (typeof item?.imageUrl === "string" && item.imageUrl.trim().length > 0) {
          return [{
            url: item.imageUrl,
            id: item?.id || "",
            type: item?.type || "",
          }];
        }

        return [];
      });

    const selectedImageItems = selectedConstellateImageIndexes.value
      .map((idx) => allImageItems[idx])
      .filter(Boolean);
    const images = selectedImageItems
      .map((item) => item.url)
      .filter((url) => typeof url === "string" && url.trim().length > 0);
    const firstMeta = selectedImageItems[0] || null;

    emit("confirm", {
      label: props.label,
      question: text,
      images,
      ttt: text,
      mmm: props.constellateData?.mmm || [],
      nodeMeta: {
        id: firstMeta?.id || "",
        customType: firstMeta?.type || "",
      },
    });
    return;
  }
};

// 通用关闭事件
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
  /* transform: translate(20px, 20px); Offset from cursor */
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
  max-height: 400px;
  overflow-y: auto;
}

/* ===== Constellate 样式 ===== */
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
  padding: 0;
  border: 2px solid transparent;
  background: transparent;
  border-radius: 10px;
  cursor: pointer;
}

.constellate-select-icon {
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

/* ===== Reflect 样式 ===== */
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

/* ===== Reflect 右侧工具栏 ===== */
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
