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
      <KonvaComponent
        ref="konvaRef"
        @ai-ring-click="handleAiRingClick"
        @ai-mode-change="handleAiModeChange"
      />
      <AiQuestionPopup
        :visible="aiPopupVisible"
        :position="aiPopupData.position"
        :label="aiPopupData.label"
        :line-length="aiPopupData.lineLength"
        :question-list="aiPopupData.questionList"
        :loading="aiPopupData.loading"
        @confirm="handleAiPopupConfirm"
        @cancel="handleAiPopupCancel"
      />
    </div>

    <!-- 顶部导航栏 -->
    <div class="top-nav-bar">
      <div
        class="nav-item"
        :class="{ active: currentNav === 'Reflect' }"
        @click="handleNavClick('Reflect')"
      >
        Reflect
      </div>
      <div
        class="nav-item"
        :class="{ active: currentNav === 'Constellate' }"
        @click="handleNavClick('Constellate')"
      >
        Constellate
      </div>
      <div
        class="nav-item"
        :class="{ active: currentNav === 'Resonance' }"
        @click="handleNavClick('Resonance')"
      >
        Resonance
      </div>
      <div class="nav-icon">
        <el-icon><Search /></el-icon>
      </div>
    </div>

    <!-- 左下角按钮列表 -->
    <ul class="bottom-btn-list" style="display: none">
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
      <!-- <li>
        <el-tooltip content="AI辅助" placement="right" effect="light">
          <el-button circle size="medium" @click="handleAiAssistClick">
            AI
          </el-button>
        </el-tooltip>
      </li> -->
    </ul>

    <!-- 右上角按钮列表 -->
    <div class="top-right-actions">
      <el-popover placement="left" :width="200" trigger="hover">
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
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, onMounted, onUnmounted } from "vue";
import { Edit, Promotion, Search } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import konvaComponent from "@/components/konvaComponent.vue";
import AiQuestionPopup from "./AiQuestionPopup.vue";
import { gelReflectToolData } from "@/service/api";

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
const currentNav = ref(""); // 当前选中的导航项
const reflectSelectedNodes = ref(null); // Reflect 模式下选中的节点

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

    // 如果处于 Reflect (AI) 模式，点击外部时是否要取消？
    // 根据需求 "如果ai编辑取消了，就不点亮"，通常点击外部会取消 AI 辅助环
    // 但这里可能需要更精细的判断，暂时保留 AI 辅助环的关闭逻辑由 KonvaComponent 内部处理
    // 我们可以监听 AI 状态变化，或者在这里简单处理
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
  questionList: [], // 新增：存储接口返回的问题列表
  loading: false, // 新增：加载状态
});

const handleAddText = () => {
  if (konvaRef.value && konvaRef.value.setTool) {
    konvaRef.value.setTool("text");
  }
};

const handleAiAssistClick = () => {
  // 如果已经是 Reflect 状态，再次点击则取消
  if (currentNav.value === "Reflect") {
    // 主动点击按钮取消时，完全关闭 AI 辅助
    if (konvaRef.value && konvaRef.value.cancelAiAssist) {
      konvaRef.value.cancelAiAssist();
    }
    closeAiPopup();
    currentNav.value = "";
    return;
  }

  if (!konvaRef.value || !konvaRef.value.triggerAiAssist) {
    ElMessage({
      message: "画布未准备好",
      type: "warning",
    });
    return;
  }

  // 获取选中的节点并存储
  const selectedNodes = konvaRef.value.getSelectedNodes();
  if (selectedNodes && selectedNodes.length > 0) {
    reflectSelectedNodes.value = konvaRef.value.resetNodesData(selectedNodes);
  } else {
    reflectSelectedNodes.value = null;
  }

  const result = konvaRef.value.triggerAiAssist();
  if (!result?.success) {
    ElMessage({
      message: result?.message || "AI辅助启动失败",
      type: "warning",
    });
  } else {
    // 启动成功，点亮 Reflect
    currentNav.value = "Reflect";
  }
};

const handleNavClick = (navItem) => {
  if (navItem === "Reflect") {
    handleAiAssistClick();
  } else {
    // 其他导航项点击逻辑，切换时取消 Reflect 状态
    if (currentNav.value === "Reflect") {
      if (konvaRef.value && konvaRef.value.cancelAiAssist) {
        konvaRef.value.cancelAiAssist();
      }
      closeAiPopup();
    }
    currentNav.value = navItem;
  }
};

// 处理 AI 环点击事件
const handleAiRingClick = async (data) => {
  aiPopupData.value = {
    label: data.label,
    lineLength: data.lineLength,
    position: data.position,
    questionList: [], // 重置问题列表
    loading: true, // 开始加载
  };
  aiPopupVisible.value = true;

  const parsedCanvasData = reflectSelectedNodes.value.map((jsonStr) =>
    JSON.parse(jsonStr)
  );

  // 构建请求参数
  const requestData = {
    tag: data.label,
    depth: data.lineLength,
    nodeInfo: parsedCanvasData, // 使用 Reflect 开启时存储的节点
  };
  console.log("requestData", requestData);

  try {
    const res = await gelReflectToolData(requestData);
    if (res && res.data && res.data.questionList) {
      aiPopupData.value.questionList = res.data.questionList;
    }
  } catch (error) {
    console.error("Failed to fetch reflect tool data:", error);
    ElMessage.error("获取AI建议失败");
  } finally {
    aiPopupData.value.loading = false;
  }
};

const handleAiModeChange = (isActive) => {
  if (!isActive && currentNav.value === "Reflect") {
    currentNav.value = "";
    closeAiPopup();
  }
};

const handleAiPopupConfirm = (data) => {
  if (konvaRef.value && konvaRef.value.createAiContentNode) {
    konvaRef.value.createAiContentNode(data.question);
  }
  closeAiPopup();
  // AI操作完成后，取消高亮状态
  currentNav.value = "";
};

const handleAiPopupCancel = () => {
  // 仅仅关闭弹窗，不取消 AI 辅助（不关闭环，不熄灭 Reflect 按钮）
  // 但是要清除引导线，以便用户重新选择
  if (konvaRef.value && konvaRef.value.clearAiGuideLine) {
    konvaRef.value.clearAiGuideLine();
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
  left: 50px;
  // left: 50%;
  // transform: translateX(-50%);
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
    transition: all 0.2s;
    padding: 6px 16px;
    border-radius: 20px;

    &:hover {
      color: #1890ff;
      background-color: rgba(0, 0, 0, 0.02);
    }

    &.active {
      color: #1890ff;
      background-color: #f0f2f5;
      font-weight: 600;
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

.top-right-actions {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
