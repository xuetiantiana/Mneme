<template>
  <div
    ref="wmContainer"
    :class="{ 'whisper-mode': currentNav === 'Whisper' || currentNav === 'Add Memory' }"
    style="
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      position: relative;
    "
  >
    <div style="height: 100%" @click.self="handleAiPopupCancel">
      <KonvaComponent
        ref="konvaRef"
        @ai-ring-click="handleAiRingClick"
        @ai-mode-change="handleAiModeChange"
        @stage-transform="handleStageTransform"
      />
      <AiQuestionPopup
        :visible="aiPopupVisible"
        :position="aiPopupData.position"
        :label="aiPopupData.label"
        :tool-type="aiPopupData.toolType"
        :line-length="aiPopupData.lineLength"
        :question-list="aiPopupData.questionList"
        :constellate-data="aiPopupData.constellateData"
        :loading="aiPopupData.loading"
        @confirm="handleAiPopupConfirm"
        @tool-click="handleAiPopupToolClick"
        @cancel="handleAiPopupCancel"
      />
      <WhisperInputPopup
        :visible="whisperPopupVisible"
        :position="whisperPopupData.position"
        :title="whisperPopupData.toolType || 'Whisper'"
        :tool-type="whisperPopupData.toolType || 'Whisper'"
        @submit="handleWhisperSubmit"
        @cancel="handleWhisperPopupCancel"
      />
      <CropImagePopup
        :visible="cropPopupVisible"
        :image-src="cropPopupData.imageSrc"
        @confirm="handleCropConfirm"
        @cancel="handleCropCancel"
      />
    </div>

    <!-- 顶部导航栏 -->
    <div class="top-nav-bar">
      <!-- <div v-if="hintLoading" class="nav-loading-tip">提示词加载中，请稍候...</div> -->
      <div
        class="nav-item"
        :class="{ active: currentNav === 'Reflect', disabled: hintLoading, loading: hintLoading && pendingAiTool === 'Reflect' }"
        @click="handleNavClick('Reflect')"
      >
        Reflect
        <el-icon v-if="hintLoading && pendingAiTool === 'Reflect'" class="nav-loading-inline is-loading">
          <Loading />
        </el-icon>
      </div>
      <div
        class="nav-item"
        :class="{ active: currentNav === 'Constellate', disabled: hintLoading, loading: hintLoading && pendingAiTool === 'Constellate' }"
        @click="handleNavClick('Constellate')"
      >
        Constellate
        <el-icon v-if="hintLoading && pendingAiTool === 'Constellate'" class="nav-loading-inline is-loading">
          <Loading />
        </el-icon>
      </div>
      <div
        class="nav-item"
        :class="{ active: currentNav === 'Resonance', disabled: hintLoading }"
        @click="handleNavClick('Resonance')"
      >
        Resonance
      </div>
      <div class="nav-separator">|</div>
      <div
        class="nav-item"
        :class="{ active: currentNav === 'Whisper', disabled: hintLoading }"
        @click="handleNavClick('Whisper')"
      >
        💭  Whisper
      </div>
      <div
        class="nav-item"
        :class="{ active: currentNav === 'Add Memory', disabled: hintLoading }"
        @click="handleNavClick('Add Memory')"
      >
        📷 Add Memory
      </div>
      <div
        class="nav-item"
        :class="{ active: currentNav === 'Crop', disabled: hintLoading }"
        @click="handleNavClick('Crop')"
      >
        ✂️ Crop
      </div>
      <div
        class="nav-item"
        :class="{ active: currentNav === 'Group', disabled: hintLoading }"
        @click="handleNavClick('Group')"
      >
        🔗 Group
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
import { ref, defineProps, onMounted, onUnmounted, nextTick } from "vue";
import { Edit, Promotion, Search, Loading } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import konvaComponent from "@/components/konvaComponent.vue";
import { useStoryStore } from "@/stores/storyStore";
import AiQuestionPopup from "./AiQuestionPopup.vue";
import WhisperInputPopup from "./WhisperInputPopup.vue";
import CropImagePopup from "./CropImagePopup.vue";
import {
  gelConstellateToolData,
  ReflectHint,
  ConstellateHint,
  ReflectQuestions,
} from "@/service/api";

const props = defineProps({
  topicContainers: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["renderNodesToTopic"]);
const storyStore = useStoryStore();

const memoryItems = ref([]);
const konvaRef = ref(null);
const wmContainer = ref(null);
const selectedNodesData = ref([]);
const currentNav = ref(""); // 当前选中的导航项
const reflectSelectedNodes = ref(null); // Reflect 模式下选中的节点
const currentHintPerspectives = ref([]); // 当前 hint 返回的 perspective 列表
const hintLoading = ref(false); // ReflectHint/ConstellateHint 请求中
const pendingAiTool = ref(""); // 当前正在请求提示词的工具
const whisperPopupVisible = ref(false);
const whisperPopupData = ref({
  position: { x: 0, y: 0 },
  stagePos: { x: 0, y: 0 },
  toolType: "Whisper",
});
const AI_RIGHT_LABELS_BY_TOOL = {
  Reflect: ["反思细节", "反思转化"],
  Constellate: ["直接检索", "远距离启发"],
};
const cropPopupVisible = ref(false);
const cropPopupData = ref({
  imageSrc: "",
  targetNode: null,
});
let whisperCanvasEl = null;

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
    // 点击外部不一定需要清除选择，这取决于用户体验需求
    // if (konvaRef.value.clearSelection) {
    //   konvaRef.value.clearSelection();
    // }
  }
};

onMounted(() => {
  // 使用 mousedown 可以在点击开始时就触发，体验可能更好，或者 click
  // 这里使用 click 配合 capture 或者注意冒泡
  document.addEventListener("mousedown", handleClickOutside);

  nextTick(() => {
    const stage = konvaRef.value?.konvaData?.stage;
    whisperCanvasEl = stage?.container?.() || null;
    if (whisperCanvasEl) {
      whisperCanvasEl.addEventListener("click", handleCanvasClick);
      whisperCanvasEl.addEventListener("mousemove", handleCanvasMouseMove);
      whisperCanvasEl.addEventListener("mouseleave", handleCanvasMouseLeave);
    }
  });
});

onUnmounted(() => {
  document.removeEventListener("mousedown", handleClickOutside);
  if (whisperCanvasEl) {
    whisperCanvasEl.removeEventListener("click", handleCanvasClick);
    whisperCanvasEl.removeEventListener("mousemove", handleCanvasMouseMove);
    whisperCanvasEl.removeEventListener("mouseleave", handleCanvasMouseLeave);
    whisperCanvasEl = null;
  }
});

// AI 弹窗状态
const aiPopupVisible = ref(false);
const aiPopupData = ref({
  label: "",
  lineLength: 0,
  position: { x: 0, y: 0 },
  questionList: [], // 新增：存储接口返回的问题列表
  constellateData: { ttt: "", mmm: [] },
  loading: false, // 新增：加载状态
  targetNodeId: null, // 新增：记录点击时关联的节点ID或唯一标识，用于后续位置追踪
  relativePos: { x: 0, y: 0 }, // 新增：记录点击点相对于舞台原点的坐标（未缩放）
  t: "AI Tool - Reflect", // 新增：弹窗标题
});

const handleAddText = () => {
  if (konvaRef.value && konvaRef.value.setTool) {
    konvaRef.value.setTool("text");
  }
};

// 组装 ReflectHint / ReflectQuestions 的基础 UNIT 入参。
// 输入: resetNodesData 返回的选中节点数组（元素通常是 JSON 字符串）。
// 规则:
// 1) 默认使用第一个选中节点作为当前操作节点。
// 2) id 优先取 attrs.id，其次取节点顶层 id。
// 3) type 优先取 attrs.customType，其次 className/type。
// 4) content 为完整节点对象；若解析失败则回退为空对象。
// 5) user_id / session_id / operation_logs 先占位空字符串。
const buildHintPayload = (nodeJsonList) => {
  const firstRaw = Array.isArray(nodeJsonList) && nodeJsonList.length > 0 ? nodeJsonList[0] : null;
  let firstNode = null;

  if (typeof firstRaw === "string") {
    try {
      firstNode = JSON.parse(firstRaw);
    } catch (e) {
      firstNode = null;
    }
  } else if (firstRaw && typeof firstRaw === "object") {
    firstNode = firstRaw;
  }

  const attrs = firstNode?.attrs || {};
  const id = attrs.id || firstNode?.id || "";
  const type = attrs.customType || firstNode?.className || firstNode?.type || "";

  return {
    id,
    type,
    content: firstNode || {},
    user_id: storyStore.user_id || "",
    session_id: storyStore.session_id || "",
    operation_logs: null,
  };
};

const applyHintRingLabels = async (toolType = "Reflect") => {
  if (!konvaRef.value?.setAiRingLabels) {
    return false;
  }

  hintLoading.value = true;
  try {
    const hintApi = toolType === "Constellate" ? ConstellateHint : ReflectHint;
    const hintRes = await hintApi(buildHintPayload(reflectSelectedNodes.value));
    const perspectives = hintRes?.data?.perspectives || [];
    currentHintPerspectives.value = Array.isArray(perspectives) ? perspectives : [];
    const labels = perspectives
      .map((item) => item?.name)
      .filter((name) => typeof name === "string" && name.trim().length > 0);
    konvaRef.value.setAiRingLabels(labels);
    return true;
  } catch (error) {
    currentHintPerspectives.value = [];
    konvaRef.value.setAiRingLabels();
    ElMessage({
      message:
        toolType === "Constellate"
          ? "ConstellateHint 获取失败，已使用默认标签"
          : "ReflectHint 获取失败，已使用默认标签",
      type: "warning",
    });
    return false;
  } finally {
    hintLoading.value = false;
  }
};

const getPerspectivePayloadByLabel = (label) => {
  const matched = (currentHintPerspectives.value || []).find(
    (item) => item?.name === label
  );

  if (matched) {
    return matched;
  }

  return {
    id: "",
    name: label || "",
    type: "perspective",
    short_prompt: "",
    created_at: "",
  };
};

const applyToolRightLabels = (toolType = "Reflect") => {
  if (!konvaRef.value?.setAiRightLabels) {
    return;
  }

  const labels = AI_RIGHT_LABELS_BY_TOOL[toolType] || AI_RIGHT_LABELS_BY_TOOL.Reflect;
  konvaRef.value.setAiRightLabels(labels);
};

const handleAiAssistClick = async (toolType = "Reflect") => {
  if (hintLoading.value) {
    ElMessage({
      message: "提示词仍在加载中，请稍候",
      type: "info",
    });
    return;
  }

  // 如果当前点击的工具已经是激活状态，再次点击则取消
  if (currentNav.value === toolType) {
    if (konvaRef.value && konvaRef.value.cancelAiAssist) {
      konvaRef.value.cancelAiAssist();
    }
    closeAiPopup();
    currentNav.value = "";
    return;
  }

  // 如果之前有其他工具处于激活状态，先取消之前的
  if (currentNav.value === "Reflect" || currentNav.value === "Constellate") {
    if (konvaRef.value && konvaRef.value.cancelAiAssist) {
      konvaRef.value.cancelAiAssist();
    }
    closeAiPopup();
  }

  if (!konvaRef.value || !konvaRef.value.triggerAiAssist) {
    ElMessage({
      message: "画布未准备好",
      type: "warning",
    });
    return;
  }

  // 获取选中的节点并存储
  const selectedNodes = konvaRef.value.getSelectedNodes() || [];
  if (toolType === "Reflect" || toolType === "Constellate") {
    if (selectedNodes.length === 0) {
      ElMessage({
        message: "请先选中一个node",
        type: "warning",
      });
      currentNav.value = "";
      return;
    }

    if (selectedNodes.length > 1) {
      ElMessage({
        message: "只能选择一个node",
        type: "warning",
      });
      currentNav.value = "";
      return;
    }
  }

  reflectSelectedNodes.value = konvaRef.value.resetNodesData(selectedNodes);

  if (toolType === "Reflect" || toolType === "Constellate") {
    pendingAiTool.value = toolType;
    const hintSuccess = await applyHintRingLabels(toolType);
    pendingAiTool.value = "";
    if (!hintSuccess) {
      currentNav.value = "";
      return;
    }
    applyToolRightLabels(toolType);
  } else if (konvaRef.value?.setAiRingLabels) {
    konvaRef.value.setAiRingLabels();
    applyToolRightLabels("Reflect");
  }

  const result = konvaRef.value.triggerAiAssist();
  if (!result?.success) {
    ElMessage({
      message: result?.message || "AI辅助启动失败",
      type: "warning",
    });
  } else {
    // 启动成功，设置当前工具状态
    currentNav.value = toolType;
  }
};

const handleNavClick = (navItem) => {
  if (hintLoading.value) {
    ElMessage({
      message: "提示词仍在加载中，请稍候",
      type: "info",
    });
    return;
  }

  if (navItem === "Reflect" || navItem === "Constellate") {
    closeWhisperPopup();
    handleAiAssistClick(navItem);
  } else {
    if (navItem === "Whisper" || navItem === "Add Memory") {
      if (currentNav.value === navItem) {
        currentNav.value = "";
        closeWhisperPopup();
        return;
      }

      if (konvaRef.value && konvaRef.value.setTool) {
        konvaRef.value.setTool("select");
      }

      currentNav.value = navItem;
      closeWhisperPopup();
      return;
    }

    // 其他导航项点击逻辑，切换时取消 AI 状态
    if (currentNav.value === "Reflect" || currentNav.value === "Constellate") {
      if (konvaRef.value && konvaRef.value.cancelAiAssist) {
        konvaRef.value.cancelAiAssist();
      }
      closeAiPopup();
    }
    closeWhisperPopup();
    currentNav.value = navItem;

    const stage = konvaRef.value?.konvaData?.stage;
    if (stage && navItem !== "Crop") {
      stage.container().style.cursor = "default";
    }
  }
};

const handleWhisperCanvasClick = (event) => {
  if (currentNav.value !== "Whisper" && currentNav.value !== "Add Memory") {
    return;
  }

  const stage = konvaRef.value?.konvaData?.stage;
  if (!stage || !wmContainer.value) {
    return;
  }

  const stageRect = stage.container().getBoundingClientRect();
  const wmRect = wmContainer.value.getBoundingClientRect();

  const localX = event.clientX - stageRect.left;
  const localY = event.clientY - stageRect.top;

  const stagePos = {
    x: (localX - stage.x()) / stage.scaleX(),
    y: (localY - stage.y()) / stage.scaleY(),
  };

  whisperPopupData.value = {
    position: {
      x: event.clientX - wmRect.left,
      y: event.clientY - wmRect.top,
    },
    stagePos,
    toolType: currentNav.value,
  };

  whisperPopupVisible.value = true;
};

const getImageTargetAtPointer = (event) => {
  const stage = konvaRef.value?.konvaData?.stage;
  if (!stage) {
    return null;
  }

  const rect = stage.container().getBoundingClientRect();
  const pointer = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };

  const target = stage.getIntersection(pointer);
  if (!target || target.className !== "Image") {
    return null;
  }

  const img = target.image?.();
  const imageSrc = img?.src || "";
  if (!imageSrc) {
    return null;
  }

  return target;
};

const handleCropCanvasHover = (event) => {
  const stage = konvaRef.value?.konvaData?.stage;
  if (!stage) {
    return;
  }

  if (currentNav.value !== "Crop") {
    stage.container().style.cursor = "default";
    return;
  }

  const target = getImageTargetAtPointer(event);
  stage.container().style.cursor = target ? "pointer" : "default";
};

const handleCropCanvasClick = (event) => {
  if (currentNav.value !== "Crop") {
    return;
  }

  const target = getImageTargetAtPointer(event);
  if (!target) return;

  const img = target.image?.();
  const imageSrc = img?.src || "";

  cropPopupData.value = {
    imageSrc,
    targetNode: target,
  };
  cropPopupVisible.value = true;
};

const handleCanvasMouseMove = (event) => {
  handleCropCanvasHover(event);
};

const handleCanvasMouseLeave = () => {
  const stage = konvaRef.value?.konvaData?.stage;
  if (!stage) {
    return;
  }
  if (currentNav.value === "Crop") {
    stage.container().style.cursor = "default";
  }
};

const handleCanvasClick = (event) => {
  handleWhisperCanvasClick(event);
  handleCropCanvasClick(event);
};

const closeWhisperPopup = () => {
  whisperPopupVisible.value = false;
};

const handleWhisperPopupCancel = () => {
  closeWhisperPopup();
  if (currentNav.value === "Whisper" || currentNav.value === "Add Memory") {
    currentNav.value = "";
  }
};

const handleCropConfirm = ({ dataUrl }) => {
  const node = cropPopupData.value.targetNode;
  if (!node || !dataUrl) {
    return;
  }

  if (!konvaRef.value || !konvaRef.value.addImageNodeRightOfTarget) {
    ElMessage({
      message: "裁剪更新功能未准备好",
      type: "warning",
    });
    return;
  }

  konvaRef.value.addImageNodeRightOfTarget(node, dataUrl);
  cropPopupVisible.value = false;
  cropPopupData.value = {
    imageSrc: "",
    targetNode: null,
  };

  const stage = konvaRef.value?.konvaData?.stage;
  if (stage) {
    stage.container().style.cursor = "default";
  }

  currentNav.value = "";
};

const handleCropCancel = () => {
  cropPopupVisible.value = false;
  cropPopupData.value = {
    imageSrc: "",
    targetNode: null,
  };

  const stage = konvaRef.value?.konvaData?.stage;
  if (stage) {
    stage.container().style.cursor = "default";
  }

  if (currentNav.value === "Crop") {
    currentNav.value = "";
  }
};

const handleWhisperSubmit = (payload) => {
  const content = (payload?.text || "").trim();
  const imageDataUrl = payload?.imageDataUrl || "";

  if (!content) {
    ElMessage({
      message: "请输入或录入文字后再提交",
      type: "warning",
    });
    return;
  }

  if (!konvaRef.value) {
    ElMessage({
      message: "画布未准备好",
      type: "warning",
    });
    return;
  }

  if (whisperPopupData.value.toolType === "Add Memory" && imageDataUrl) {
    if (!konvaRef.value.addMemoryAtPosition) {
      ElMessage({
        message: "图文添加功能未准备好",
        type: "warning",
      });
      return;
    }

    konvaRef.value.addMemoryAtPosition(
      content,
      imageDataUrl,
      whisperPopupData.value.stagePos
    );
    closeWhisperPopup();
    currentNav.value = "";
    return;
  }

  if (!konvaRef.value.addTextAtPosition) {
    ElMessage({
      message: "文字添加功能未准备好",
      type: "warning",
    });
    return;
  }

  konvaRef.value.addTextAtPosition(content, whisperPopupData.value.stagePos);
  closeWhisperPopup();
  currentNav.value = "";
};

// 处理 AI 环点击事件
const handleAiRingClick = async (data) => {
  // data.position 是屏幕坐标 (screenPos)
  // 我们需要计算出它在 Stage 坐标系中的位置，以便后续缩放时重新计算屏幕坐标

  // 假设 konvaComponent 暴露了 konvaData.stage
  const stage = konvaRef.value?.konvaData?.stage;
  let relativeX = 0;
  let relativeY = 0;

  if (stage) {
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    // 这里的 data.position 是相对于 container 的坐标
    // 但是 konvaComponent 传出来的是 clientRect 修正过的坐标
    // 我们需要把 data.position 转换回 stage 坐标
    // 实际上 data.position = stagePos * scale + stageOffset + containerOffset
    // 简化处理：我们直接记录点击时的 stage transform，后续根据 diff 更新

    // 更准确的做法：
    // 获取点击点的 stage 坐标
    const stagePos = transform.point({
      x: data.position.x,
      y: data.position.y - wmContainer.value.getBoundingClientRect().top,
    });
    relativeX = stagePos.x;
    relativeY = stagePos.y;
  }

  aiPopupData.value = {
    label: data.label,
    toolType: `${currentNav.value || "Reflect"}`, // 动态设置标题
    lineLength: data.lineLength,
    position: {
      x: data.position.x,
      y: data.position.y - wmContainer.value.getBoundingClientRect().top,
    },
    questionList: [], // 重置问题列表
    constellateData: { ttt: "", mmm: [] },
    loading: true, // 开始加载
    relativePos: { x: relativeX, y: relativeY },
  };
  aiPopupVisible.value = true;

  const reflectBasePayload = buildHintPayload(reflectSelectedNodes.value);

  // 构建请求参数
  const requestData = {
    ...reflectBasePayload,
    perspective: getPerspectivePayloadByLabel(data.label),
    depth: {
      min: 0,
      max: 500,
      value: Math.max(0, Math.round(data.lineLength || 0)),
    },
  };
  console.log("requestData", requestData);

  try {
    let res;
    if (currentNav.value === "Constellate") {
      res = await gelConstellateToolData(requestData);
      const payload = res?.data || {};
      const mmm =
        (Array.isArray(payload?.mmm) && payload.mmm) ||
        (Array.isArray(payload?.questionList) && payload.questionList) ||
        [];
      aiPopupData.value.constellateData = {
        ttt: payload?.ttt || "",
        mmm,
      };
      aiPopupData.value.questionList = [];
    } else {
      res = await ReflectQuestions(requestData);
      const questionList =
        (Array.isArray(res?.data) && res.data) ||
        (Array.isArray(res?.data?.data) && res.data.data) ||
        (Array.isArray(res?.data?.questionList) && res.data.questionList) ||
        [];
      aiPopupData.value.questionList = questionList;
      aiPopupData.value.constellateData = { ttt: "", mmm: [] };
    }
  } catch (error) {
    console.error(`Failed to fetch ${currentNav.value} tool data:`, error);
    ElMessage.error("获取AI建议失败");
  } finally {
    aiPopupData.value.loading = false;
  }
};

const handleAiModeChange = (isActive) => {
  if (
    !isActive &&
    (currentNav.value === "Reflect" || currentNav.value === "Constellate")
  ) {
    currentNav.value = "";
    closeAiPopup();
  }
};

const handleAiPopupConfirm = (data) => {
  if (konvaRef.value && konvaRef.value.createAiContentNode) {
    // 传入问题（作为标题/label）、图片列表
    konvaRef.value.createAiContentNode(data.images, data.question, data.nodeMeta);
  }
  if (konvaRef.value && konvaRef.value.cancelAiAssist) {
    konvaRef.value.cancelAiAssist();
  }
  closeAiPopup();
  // AI操作完成后，取消高亮状态/工具状态
  currentNav.value = "";
};

const handleAiPopupToolClick = ({ tool }) => {
  if (!tool) return;

  // if (currentNav.value === "Reflect" || currentNav.value === "Constellate") {
  //   if (konvaRef.value && konvaRef.value.clearAiGuideLine) {
  //     konvaRef.value.clearAiGuideLine();
  //   }
  //   if (konvaRef.value && konvaRef.value.cancelAiAssist) {
  //     konvaRef.value.cancelAiAssist();
  //   }
  //   closeAiPopup();
  //   currentNav.value = "";
  // }

  handleNavClick(tool);
};

const handleAiPopupCancel = () => {
  // 关闭弹窗时同步退出 AI 工具，并清理引导线
  if (konvaRef.value && konvaRef.value.clearAiGuideLine) {
    konvaRef.value.clearAiGuideLine();
  }
  if (konvaRef.value && konvaRef.value.cancelAiAssist) {
    konvaRef.value.cancelAiAssist();
  }
  closeAiPopup();
  currentNav.value = "";
};

// 点击画布其他地方关闭弹窗 (需要在 KonvaComponent 中透传或全局监听，这里简化处理)
// 实际可以给 AiQuestionPopup 添加 click-outside 指令或遮罩层
const closeAiPopup = () => {
  aiPopupVisible.value = false;
};

// 复用：将 stage 坐标转换为 WorkingMemory 容器内的弹窗坐标
const getPopupPositionFromStagePos = (stagePos) => {
  const stage = konvaRef.value?.konvaData?.stage;
  if (!stage || !wmContainer.value || !stagePos) {
    return null;
  }

  const stageRect = stage.container().getBoundingClientRect();
  const wmRect = wmContainer.value.getBoundingClientRect();
  const transform = stage.getAbsoluteTransform();
  const localPos = transform.point(stagePos);

  return {
    x: stageRect.left - wmRect.left + localPos.x,
    y: stageRect.top - wmRect.top + localPos.y,
  };
};

const handleStageTransform = () => {
  if (aiPopupVisible.value) {
    const aiPos = getPopupPositionFromStagePos(aiPopupData.value.relativePos);
    if (aiPos) {
      aiPopupData.value.position = aiPos;
    }
  }

  if (whisperPopupVisible.value) {
    const whisperPos = getPopupPositionFromStagePos(whisperPopupData.value.stagePos);
    if (whisperPos) {
      whisperPopupData.value.position = whisperPos;
    }
  }
};

const handleRenderNodes = (canvasIndex) => {
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
  gap: 20px;
  flex-wrap: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  z-index: 100;
  border: 1px solid rgba(0, 0, 0, 0.05);

  .nav-item {
    position: relative;
    font-size: 16px;
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

    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }

    .nav-loading-inline {
      position: absolute;
      right: -1px;
      top: calc(50% - 5px);
      transform: translateY(-50%);
      font-size: 14px;
      color: #999;
      display: inline-flex;
      align-items: center;
      pointer-events: none;
    }
  }

  .nav-loading-tip {
    font-size: 12px;
    color: #666;
    padding: 4px 10px;
    border-radius: 12px;
    background: #f5f7fa;
    border: 1px solid #e5eaf3;
    white-space: nowrap;
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

  .nav-separator {
    color: #999;
    font-size: 16px;
    line-height: 1;
    user-select: none;
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

.whisper-mode :deep(.canvas-container),
:deep(.working-memory-container.whisper-mode .canvas-container) {
  cursor: crosshair !important;
}
</style>
