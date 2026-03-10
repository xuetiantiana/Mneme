<template>
  <div v-if="visible" class="ai-question-popup" :style="style">
    <div class="popup-header">
      <span>Choose a question</span>
      <el-icon class="close-icon" @click="handleCancel"><Close /></el-icon>
    </div>
    <div class="popup-content">
      <div class="question-card">
        <div class="question-text">
          氛围捕手：上海文创园的“雨前静谧”和你其他记忆中的哪些“氛围时刻”有关联？是厦门海边的潮湿，还是雪天屋内的温暖？它们之间是相似，还是互补？
        </div>
        <div class="image-row">
          <img src="https://picsum.photos/80/80?random=1" alt="" />
          <img src="https://picsum.photos/80/80?random=2" alt="" />
          <img src="https://picsum.photos/80/80?random=3" alt="" />
        </div>
        <div class="selection-indicator"></div>
      </div>

      <div class="question-card active">
        <div class="question-text">
          你提到“{{
            label
          }}”——当时的环境里，你听到了什么？是风声、远处的交谈，还是纯粹的寂静？
          <br />
          <span class="highlight"
            >距离中心点: {{ Math.round(lineLength) }}px</span
          >
        </div>
        <div class="selection-indicator checked">
          <el-icon><Check /></el-icon>
        </div>
      </div>

      <div class="question-card">
        <div class="question-text">
          为什么你觉得下雨之前的时候是舒适的？为什么你期待下雨？
        </div>
        <div class="selection-indicator"></div>
      </div>
    </div>
    <div class="popup-footer">
      <el-button type="primary" size="small" @click="handleConfirm"
        >确认</el-button
      >
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { Check, Close } from "@element-plus/icons-vue";

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
});

const emit = defineEmits(["confirm", "cancel"]);

const style = computed(() => {
  return {
    left: `${props.position.x}px`,
    top: `${props.position.y}px`,
  };
});

const handleConfirm = () => {
  emit("confirm", {
    label: props.label,
    question: `你提到“${props.label}”——当时的环境里，你听到了什么？`,
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
</style>
