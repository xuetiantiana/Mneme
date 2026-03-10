<template>
  <div
    ref="wmContainer"
    style="
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      position: relative;
    "
  >
    <div style="height: 100%" @click.self="closeAiPopup">
      <KonvaComponent ref="konvaRef" @ai-ring-click="handleAiRingClick" />
      <AiQuestionPopup
        :visible="aiPopupVisible"
        :position="aiPopupData.position"
        :label="aiPopupData.label"
        :line-length="aiPopupData.lineLength"
        @confirm="handleAiPopupConfirm"
        @cancel="handleAiPopupCancel"
      />
    </div>

    <!-- 顶部导航栏 -->
    <div class="top-nav-bar">
      <div class="nav-item">Reflect</div>
      <div class="nav-item">Constellate</div>
      <div class="nav-item">Resonance</div>
      <div class="nav-icon">
        <el-icon><Search /></el-icon>
      </div>
    </div>

    <!-- 左下角按钮列表 -->
    <ul class="bottom-btn-list">
      <li>
        <el-tooltip content="添加文本" placement="right" effect="light">
          <el-button circle size="medium" @click="handleAddText">
            <el-icon><Edit /></el-icon>
          </el-button>
        </el-tooltip>
      </li>
      <!-- <li>
        <el-tooltip content="添加图片" placement="right" effect="light">
          <el-button circle size="medium">
            <el-icon><Picture /></el-icon>
          </el-button>
        </el-tooltip>
      </li> -->
      <li>
        <el-tooltip content="AI辅助" placement="right" effect="light">
          <el-button circle size="medium" @click="handleAiAssistClick">
            AI
          </el-button>
        </el-tooltip>
      </li>
      <li>
        <el-popover placement="right" :width="200" trigger="hover">
          <template #reference>
            <el-button circle size="medium">
              <el-icon><Promotion /></el-icon>
            </el-button>
          </template>
          <ul class="send-menu-list">
            <li
              v-for="(topic, index) in topicContainers"
              :key="index"
              class="send-menu-item"
              @click="handleRenderNodes(index)"
            >
              发送到主题容器{{ index + 1 }}
            </li>
          </ul>
        </el-popover>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, defineProps, onMounted, onUnmounted } from "vue";
import { Edit, Promotion, Search } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import konvaComponent from "@/components/konvaComponent.vue";
import AiQuestionPopup from "./AiQuestionPopup.vue";

const props = defineProps({
  topicContainers: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["renderNodesToTopic"]);

const memoryItems = ref([]);
const konvaRef = ref(null);
const wmContainer = ref(null);
const selectedNodesData = ref([]);

// 处理点击外部区域取消选中的逻辑
const handleClickOutside = (event) => {
  // 确保 konvaRef 和 wmContainer 存在
  if (!konvaRef.value || !wmContainer.value) return;

  // 检查点击的目标是否在 Working Memory 容器内部
  const isClickInside = wmContainer.value.contains(event.target);

  // 检查点击的目标是否是 Popover 菜单或其子元素
  // Element Plus 的 Popover 内容通常挂载在 body 上，类名包含 el-popover 或我们自定义的 send-menu-list
  const isMenuClick =
    event.target.closest(".send-menu-list") ||
    event.target.closest(".el-popover");

  // 如果点击在外部，且不是点击菜单
  if (!isClickInside && !isMenuClick) {
    if (konvaRef.value.clearSelection) {
      konvaRef.value.clearSelection();
    }
  }
};

onMounted(() => {
  // 使用 mousedown 可以在点击开始时就触发，体验可能更好，或者 click
  // 这里使用 click 配合 capture 或者注意冒泡
  document.addEventListener("mousedown", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("mousedown", handleClickOutside);
});

// AI 弹窗状态
const aiPopupVisible = ref(false);
const aiPopupData = ref({
  label: "",
  lineLength: 0,
  position: { x: 0, y: 0 },
});

const handleAddText = () => {
  if (konvaRef.value && konvaRef.value.setTool) {
    konvaRef.value.setTool("text");
  }
};

const handleAiAssistClick = () => {
  if (!konvaRef.value || !konvaRef.value.triggerAiAssist) {
    ElMessage({
      message: "画布未准备好",
      type: "warning",
    });
    return;
  }

  const result = konvaRef.value.triggerAiAssist();
  if (!result?.success) {
    ElMessage({
      message: result?.message || "AI辅助启动失败",
      type: "warning",
    });
  }
};

// 处理 AI 环点击事件
const handleAiRingClick = (data) => {
  aiPopupData.value = {
    label: data.label,
    lineLength: data.lineLength,
    position: data.position,
  };
  aiPopupVisible.value = true;
};

const handleAiPopupConfirm = (data) => {
  if (konvaRef.value && konvaRef.value.createAiContentNode) {
    konvaRef.value.createAiContentNode(data.question);
  }
  closeAiPopup();
};

const handleAiPopupCancel = () => {
  if (konvaRef.value && konvaRef.value.cancelAiAssist) {
    konvaRef.value.cancelAiAssist();
  }
  closeAiPopup();
};

// 点击画布其他地方关闭弹窗 (需要在 KonvaComponent 中透传或全局监听，这里简化处理)
// 实际可以给 AiQuestionPopup 添加 click-outside 指令或遮罩层
const closeAiPopup = () => {
  aiPopupVisible.value = false;
};

const handleRenderNodes = (canvasIndex) => {
  // 先获取选中的节点信息
  selectedNodesData.value = konvaRef.value.getSelectedNodes();
  console.log("111", selectedNodesData.value);
  // 如果有选中的节点，则发送到主题画布
  if (selectedNodesData.value.length > 0) {
    emit("renderNodesToTopic", {
      nodes: selectedNodesData.value,
      canvasIndex: canvasIndex,
    });
    console.log("已发送节点数据到父组件");
    // 清除选中状态
    // if (konvaRef.value && konvaRef.value.clearSelection) {
    //   konvaRef.value.clearSelection();
    // }
  } else {
    ElMessage({
      message: "请先在画布中选择要渲染的节点",
      type: "warning",
    });
    console.log("没有可渲染的节点");
  }
};
</script>

<style scoped lang="scss">
.working-memory-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0.875rem;
  overflow: hidden;
}

.get-nodes-btn {
  padding: 10px 20px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: #40a9ff;
  }

  &:active {
    background: #096dd9;
  }
}

.render-nodes-btn {
  padding: 10px 20px;
  background: #52c41a;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    background: #73d13d;
  }

  &:disabled {
    background: #d9d9d9;
    cursor: not-allowed;
  }
}

.bottom-btn-list {
  position: absolute;
  left: 20px;
  bottom: 20px;
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 100;

  li {
    margin: 0;
  }
}

.send-menu-list {
  list-style: none;
  padding: 0;
  margin: 0;

  .send-menu-item {
    padding: 8px 5px;
    cursor: pointer;
    font-size: 14px;
    color: #333;
    transition: all 0.2s;
    border-radius: 4px;

    &:hover {
      background-color: #f5f5f5;
      color: #1890ff;
    }
  }
}

.top-nav-bar {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  padding: 8px 24px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  gap: 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  z-index: 100;
  border: 1px solid rgba(0, 0, 0, 0.05);

  .nav-item {
    font-size: 14px;
    font-weight: 500;
    color: #333;
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
      color: #1890ff;
    }
  }

  .nav-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    color: #333;
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
      color: #1890ff;
    }
  }
}
</style>
