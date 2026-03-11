<template>
  <div v-if="visible" class="ai-question-popup" :style="style">
    <div class="popup-header">
      <span>AI 思考助手 Reflect</span>
      <el-icon class="close-icon" @click="handleCancel"><Close /></el-icon>
    </div>

    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>正在生成建议...</span>
    </div>

    <div
      v-else-if="questionList && questionList.length > 0"
      class="popup-content"
    >
      <div
        v-for="(item, index) in questionList"
        :key="index"
        class="question-card"
        :class="{ active: selectedIndex === index }"
        @click="selectQuestion(index)"
      >
        <div class="question-text">
          {{ item.question }}
        </div>
        <div v-if="item.images && item.images.length" class="image-row">
          <img v-for="(img, i) in item.images" :key="i" :src="img" alt="" />
        </div>
        <div v-if="selectedIndex === index" class="selection-indicator checked">
          <el-icon><Check /></el-icon>
        </div>
        <div v-else class="selection-indicator"></div>
      </div>
    </div>

    <div v-else class="popup-content empty-state">暂无建议</div>

    <div class="popup-footer">
      <el-button
        type="primary"
        size="small"
        @click="handleConfirm"
        :disabled="selectedIndex === -1"
      >
        确认
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { Check, Close, Loading } from "@element-plus/icons-vue";

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
  lineLength: {
    type: Number,
    default: 0,
  },
  questionList: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["confirm", "cancel"]);

const selectedIndex = ref(-1);

// 当弹窗显示或列表更新时，重置选择
watch(
  () => props.visible,
  (val) => {
    if (val) selectedIndex.value = -1;
  }
);

watch(
  () => props.questionList,
  (val) => {
    if (val && val.length > 0) {
      // 默认选中第一个? 或者不选中
      // selectedIndex.value = 0;
    }
  }
);

const style = computed(() => {
  // 简单的边界检查，防止弹出屏幕外 (可选优化)
  const left = Math.min(props.position.x, window.innerWidth - 340);
  const top = Math.min(props.position.y, window.innerHeight - 400);

  return {
    left: `${Math.max(20, left)}px`,
    top: `${Math.max(20, top)}px`,
  };
});

const selectQuestion = (index) => {
  selectedIndex.value = index;
};

const handleConfirm = () => {
  if (selectedIndex.value === -1) return;

  const selectedItem = props.questionList[selectedIndex.value];
  emit("confirm", {
    label: props.label,
    question: selectedItem.question,
    answer: selectedItem.answer, // 还可以传递 answer 或其他信息
    ...selectedItem,
  });
};

const handleCancel = () => {
  emit("cancel");
};
</script>

<style scoped>
.ai-question-popup {
  position: fixed;
  width: 320px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 2000;
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

.popup-footer {
  padding: 12px;
  border-top: 1px solid #f0f0f0;
  text-align: right;
  background: #fafafa;
}

.question-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  position: relative;
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

.question-text {
  font-size: 13px;
  color: #333;
  line-height: 1.5;
  margin-bottom: 8px;
  padding-right: 24px;
}

.highlight {
  color: #1890ff;
  font-weight: 500;
  font-size: 12px;
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
