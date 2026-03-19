<template>
  <div
    ref="wmContainer"
    :class="{ 'whisper-mode': currentNav === 'Add Memory' }"
    style="
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
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
        :resonance-data="aiPopupData.resonanceData"
        :constellate-data="aiPopupData.constellateData"
        :loading="aiPopupData.loading"
        :quick-tools="aiQuickTools"
        @confirm="handleAiPopupConfirm"
        @tool-click="handleAiPopupToolClick"
        @cancel="handleAiPopupCancel"
      />
      <WhisperInputPopup
        :visible="whisperPopupVisible"
        :position="whisperPopupData.position"
        :title="whisperPopupData.toolType || 'Whisper'"
        :tool-type="whisperPopupData.toolType || 'Whisper'"
        :submit-loading="whisperSubmitting"
        @submit="handleWhisperSubmit"
        @cancel="handleWhisperPopupCancel"
      />
      <CropImagePopup
        :visible="cropPopupVisible"
        :image-src="cropPopupData.imageSrc"
        :confirm-loading="cropSubmitting"
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
        :data-tip="getNavHint('Reflect')"
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
        :data-tip="getNavHint('Constellate')"
        @click="handleNavClick('Constellate')"
      >
        Constellate
        <el-icon v-if="hintLoading && pendingAiTool === 'Constellate'" class="nav-loading-inline is-loading">
          <Loading />
        </el-icon>
      </div>
      <div
        class="nav-item resonance-nav"
        :class="[{ open: resonanceMenuVisible }, { active: currentNav === 'Resonance', disabled: hintLoading, loading: hintLoading && pendingAiTool === 'Resonance' }]"
        :data-tip="getNavHint('Resonance')"
        @mouseenter="handleResonanceMenuEnter"
        @mouseleave="handleResonanceMenuLeave"
      >
        Resonance
        <el-icon v-if="hintLoading && pendingAiTool === 'Resonance'" class="nav-loading-inline is-loading">
          <Loading />
        </el-icon>
        <div class="resonance-submenu" @mouseenter="handleResonanceMenuEnter" @mouseleave="handleResonanceMenuLeave" @click.stop>
          <button
            type="button"
            class="resonance-submenu-btn"
            :disabled="hintLoading"
            @click="handleResonanceSubAction('Analysis')"
          >
            Analysis
          </button>
          <button
            type="button"
            class="resonance-submenu-btn"
            :disabled="hintLoading"
            @click="handleResonanceSubAction('Fuse')"
          >
            Fuse
          </button>
        </div>
      </div>
      <div class="nav-separator">|</div>
      <div
        class="nav-item"
        :class="{ active: currentNav === 'Whisper', disabled: hintLoading }"
        :data-tip="getNavHint('Whisper')"
        @click="handleNavClick('Whisper')"
      >
        💭  Whisper
      </div>
      <div
        class="nav-item"
        :class="{ active: currentNav === 'Crop', disabled: hintLoading }"
        :data-tip="getNavHint('Crop')"
        @click="handleNavClick('Crop')"
      >
        ✂️Crop
      </div>
      <div
        class="nav-item"
        :class="{ active: currentNav === 'Add Memory', disabled: hintLoading }"
        :data-tip="getNavHint('Add Memory')"
        @click="handleNavClick('Add Memory')"
      >
        📷Add Memory
      </div>
      
      <div
        class="nav-item"
        :class="{ active: currentNav === 'Group', disabled: hintLoading }"
        :data-tip="getNavHint('Group')"
        @click="handleNavClick('Group')"
      >
        🔗Group
      </div>
      <!-- <div
        class="nav-item"
        :class="{ active: currentNav === 'Ungroup', disabled: hintLoading }"
        :data-tip="getNavHint('Ungroup')"
        @click="handleNavClick('Ungroup')"
      >
        🔓Ungroup
      </div> -->
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
import { ref, computed, defineProps, onMounted, onUnmounted, nextTick } from "vue";
import { Edit, Promotion, Search, Loading } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import Konva from "konva";
import konvaComponent from "@/components/konvaComponent.vue";
import AiQuestionPopup from "./AiQuestionPopup.vue";
import WhisperInputPopup from "./WhisperInputPopup.vue";
import CropImagePopup from "./CropImagePopup.vue";
import { createImageAndTextNodes } from "@/utils/canvasPositionUtils";
import {
  CreateOnePCM,
  ConstellateSuggest,
  ReflectHint,
  ConstellateHint,
  ResonanceHint,
  ResonanceAnalysis,
  ResonanceFuse,
  ReflectQuestions,
  cropUpdate,
  whisperUpdate,
} from "@/service/api";
import { operation_logs } from "@/service/operationLogs";
import { usePCMStore } from "@/stores/pcmStore";

const props = defineProps({
  topicContainers: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["renderNodesToTopic"]);
const pcmStore = usePCMStore();

const memoryItems = ref([]);
const konvaRef = ref(null);
const wmContainer = ref(null);
const selectedNodesData = ref([]);
const currentNav = ref(""); // 当前选中的导航项
const reflectSelectedNodes = ref(null); // Reflect 模式下选中的节点
const reflectTargetNode = ref(null); // Reflect 对应的真实 Konva 节点
const reflectTargetType = ref(""); // Reflect 对应节点类型
const reflectPopupTargetNode = ref(null); // 弹窗生命周期内用于 QuickTools 的目标节点
const currentHintPerspectives = ref([]); // 当前 hint 返回的 perspective 列表
const hintLoading = ref(false); // ReflectHint/ConstellateHint 请求中
const pendingAiTool = ref(""); // 当前正在请求提示词的工具
const resonanceMenuVisible = ref(false);
let resonanceMenuCloseTimer = null;
const whisperPopupVisible = ref(false);
const whisperPopupData = ref({
  position: { x: 0, y: 0 },
  stagePos: { x: 0, y: 0 },
  toolType: "Whisper",
  targetNode: null,
});
const whisperSubmitting = ref(false);
const AI_RIGHT_LABELS_BY_TOOL = {
  Reflect: ["反思细节", "反思转化"],
  Constellate: ["直接检索", "远距离启发"],
  Resonance: ["共振追问", "意象扩展"],
};
const aiQuickTools = computed(() => {
  if (aiPopupData.value?.toolType === "Resonance") {
    return [];
  }

  const quickType = aiPopupData.value?.reflectTargetType || reflectTargetType.value;

  if (quickType === "pcm_unit") {
    return [
      { label: "✂️  Crop", value: "Crop" },
      { label: "📷 Add Memory", value: "Add Memory" },
    ];
  }

  if (quickType === "segment") {
    return [
      { label: "💭  Whisper", value: "Whisper" },
      { label: "📷 Add Memory", value: "Add Memory" },
    ];
  }

  return [{ label: "📷 Add Memory", value: "Add Memory" }];
});
const NAV_HINTS = {
  Reflect: "先选中一个主图/子图再点击",
  Constellate: "先选中一个主图/子图/泡泡节点再点击",
  Resonance: "仅支持选中 Group 按钮创建的 group",
  Whisper: "点击之后选中子图",
  Crop: "点击之后选择主图进行裁剪",
  "Add Memory": "点击画布位置后上传图文",
  Group: "选中多个节点后使用",
  Ungroup: "选中一个 group 后使用",
};

const getNavHint = (navItem) => NAV_HINTS[navItem] || "";
const cropPopupVisible = ref(false);
const cropPopupData = ref({
  imageSrc: "",
  targetNode: null,
});
const cropSubmitting = ref(false);
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

const isTypingElement = (target) => {
  if (!target || typeof target.closest !== "function") {
    return false;
  }

  return !!target.closest(
    'input, textarea, [contenteditable="true"], .el-input__inner, .el-textarea__inner'
  );
};

const handleGlobalKeydown = (event) => {
  const key = String(event?.key || "").toLowerCase();
  const isGroupShortcut = (event.ctrlKey || event.metaKey) && key === "g";

  if (!isGroupShortcut) {
    return;
  }

  if (isTypingElement(event.target)) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  handleNavClick("Group");
};

onMounted(() => {
  // 使用 mousedown 可以在点击开始时就触发，体验可能更好，或者 click
  // 这里使用 click 配合 capture 或者注意冒泡
  document.addEventListener("mousedown", handleClickOutside);
  window.addEventListener("keydown", handleGlobalKeydown);

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
  window.removeEventListener("keydown", handleGlobalKeydown);
  if (resonanceMenuCloseTimer) {
    clearTimeout(resonanceMenuCloseTimer);
    resonanceMenuCloseTimer = null;
  }
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
  resonanceData: [],
  constellateData: {},
  loading: false, // 新增：加载状态
  targetNodeId: null, // 新增：记录点击时关联的节点ID或唯一标识，用于后续位置追踪
  relativePos: { x: 0, y: 0 }, // 新增：记录点击点相对于舞台原点的坐标（未缩放）
  reflectTargetType: "", // Reflect 目标类型，用于弹窗内 QuickTools 持续显示
  reflectTargetId: "", // Reflect 目标节点 id
  reflectRequestData: null, // Reflect 请求参数快照
  t: "AI Tool - Reflect", // 新增：弹窗标题
});

const handleAddText = () => {
  if (konvaRef.value && konvaRef.value.setTool) {
    konvaRef.value.setTool("text");
  }
};

// 组装 ReflectHint / ReflectQuestions 的基础 UNIT 入参。
// 输入: resetNodesData 返回的选中节点数组（元素通常是 JSON 对象）。
// 规则:
// 1) 默认使用第一个选中节点作为当前操作节点。
// 2) id 优先取 attrs.id，其次取节点顶层 id。
// 3) type 优先取 attrs.customType，其次 className/type。
// 4) content 为完整节点对象；若首项缺失则回退为空对象。
// 5) user_id / session_id 通过请求头传递，不再放在 body 内。
const buildHintPayload = (nodeJsonList) => {
  const firstRaw = Array.isArray(nodeJsonList) && nodeJsonList.length > 0 ? nodeJsonList[0] : null;
  const firstNode = firstRaw && typeof firstRaw === "object" ? firstRaw : null;

  const attrs = firstNode?.attrs || {};
  const id = attrs.id || firstNode?.id || "";
  const type = attrs.customType || firstNode?.className || firstNode?.type || "";

  return {
    id,
    type,
    content: firstNode || {},
    operation_logs,
  };
};

const RESONANCE_GROUP_EXCLUDED_NAMES = new Set([
  "group-bg",
  "group-ungroup-btn",
]);

// Resonance 业务过滤：排除 group 的装饰/操作节点，避免把背景和按钮传给后端。
// 可删除性：不建议删除。resetNodesData 只做快照导出，不做业务级过滤。
const isExcludedResonanceGroupChildName = (name) =>
  RESONANCE_GROUP_EXCLUDED_NAMES.has(String(name || "").trim());

// 将 resetNodesData 快照 children 递归转换为 Resonance 接口需要的结构：
// - 字段名使用 attr/className（与后端约定一致）
// - 递归保留嵌套 children
// - 过滤掉 group-bg / group-ungroup-btn
// 可删除性：不建议删除。若直接把 resetNodesData 原始 children 透传，
// 字段结构与无效节点会一并进入 payload，可能导致后端语义偏差。
const serializeResonanceSnapshotChild = (child) => {
  if (!child) return null;

  const childName = child?.attrs?.name;
  if (isExcludedResonanceGroupChildName(childName)) {
    return null;
  }

  const serialized = {
    attrs: (typeof child?.attrs === "object" && child.attrs) || {},
    className: String(child?.className || ""),
  };

  if (Array.isArray(child?.children)) {
    const nestedChildren = child.children
      .map((nested) => serializeResonanceSnapshotChild(nested))
      .filter(Boolean);
    if (nestedChildren.length > 0) {
      serialized.children = nestedChildren;
    }
  }

  return serialized;
};

const buildResonanceHintPayload = (nodeJsonList) => {
  // 与 buildHintPayload 保持一致：优先取第一个快照作为当前操作节点。
  const firstRaw = Array.isArray(nodeJsonList) && nodeJsonList.length > 0 ? nodeJsonList[0] : null;
  const firstNode = firstRaw && typeof firstRaw === "object" ? firstRaw : null;

  const attrs = firstNode?.attrs || {};

  // Resonance 先做 children 业务过滤，再根据 content.className 决定是否回传 groups。
  let content = firstNode || {};
  const isGroupNode =
    String(attrs?.customType || "") === "group" ||
    String(attrs?.name || "") === "wm-group" ||
    String(firstNode?.className || "") === "Group";

  if (isGroupNode && Array.isArray(firstNode?.children)) {
    const filteredChildren = firstNode.children
      .map((child) => serializeResonanceSnapshotChild(child))
      .filter(Boolean);

    content = {
      ...firstNode,
      attrs: {
        ...(firstNode?.attrs || {}),
        children: filteredChildren,
      },
      children: filteredChildren,
    };
  }

  const groups =
    String(content?.className || "").toLowerCase() === "group"
      ? Array.isArray(content?.attrs?.children)
        ? content.attrs.children
        : []
      : [];

  return {
    groups,
    operation_logs,
    group_meaning: String(attrs?.group_meaning || attrs?.groupMeaning || "").trim(),
  };
};

const applyHintRingLabels = async (toolType = "Reflect") => {
  if (!konvaRef.value?.setAiRingLabels) {
    return false;
  }

  hintLoading.value = true;
  try {
    const hintApi =
      toolType === "Constellate"
        ? ConstellateHint
        : toolType === "Resonance"
        ? ResonanceHint
        : ReflectHint;
    const hintPayload =
      toolType === "Resonance"
        ? buildResonanceHintPayload(reflectSelectedNodes.value)
        : buildHintPayload(reflectSelectedNodes.value);
    const hintRes = await hintApi(hintPayload);
    const rawPerspectives =
      hintRes?.data?.perspectives ?? hintRes?.data?.dimensions ?? [];
    const perspectives = Array.isArray(rawPerspectives) ? rawPerspectives : [];
    currentHintPerspectives.value = perspectives;
    const labels = perspectives
      .map((item) => item?.name || item?.text)
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
          : toolType === "Resonance"
          ? "ResonanceHint 获取失败，已使用默认标签"
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
    (item) => (item?.name || item?.text || "") === label
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
  if (
    currentNav.value === "Reflect" ||
    currentNav.value === "Constellate" ||
    currentNav.value === "Resonance"
  ) {
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
  if (toolType === "Reflect" || toolType === "Constellate" || toolType === "Resonance") {
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

  if (toolType === "Reflect") {
    const selectedType = selectedNodes[0]?.getAttr?.("customType") || "";
    if (selectedType !== "pcm_unit" && selectedType !== "segment") {
      ElMessage({
        message: 'Reflect 仅支持选中 type 为 "pcm_unit" 或 "segment" 的节点',
        type: "warning",
      });
      currentNav.value = "";
      return;
    }
  }

  if (toolType === "Constellate") {
    const selectedType = selectedNodes[0]?.getAttr?.("customType") || "";
    if (
      selectedType !== "pcm_unit" &&
      selectedType !== "segment" &&
      selectedType !== "bubble"
    ) {
      ElMessage({
        message:
          'Constellate 仅支持选中 type 为 "pcm_unit"、"segment" 或 "bubble" 的节点',
        type: "warning",
      });
      currentNav.value = "";
      return;
    }
  }

  if (toolType === "Resonance") {
    const selectedType = selectedNodes[0]?.getAttr?.("customType") || "";
    const selectedName = String(selectedNodes[0]?.name?.() || "");
    if (selectedType !== "group" || selectedName !== "wm-group") {
      ElMessage({
        message: "Resonance 仅支持选中 Group 按钮创建的 group",
        type: "warning",
      });
      currentNav.value = "";
      return;
    }
  }

  reflectSelectedNodes.value = konvaRef.value.resetNodesData(selectedNodes);
  reflectTargetNode.value = selectedNodes[0] || null;
  reflectTargetType.value = selectedNodes[0]?.getAttr?.("customType") || "";

  if (toolType === "Reflect" || toolType === "Constellate" || toolType === "Resonance") {
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

const handleNavClick = async (navItem) => {
  if (hintLoading.value) {
    ElMessage({
      message: "提示词仍在加载中，请稍候",
      type: "info",
    });
    return;
  }

  if (navItem === "Reflect" || navItem === "Constellate" || navItem === "Resonance") {
    closeWhisperPopup();
    handleAiAssistClick(navItem);
  } else {
    if (navItem === "Ungroup") {
      if (konvaRef.value?.ungroupSelectedNodes) {
        const result = konvaRef.value.ungroupSelectedNodes();
        if (!result?.success) {
          ElMessage({
            message: result?.message || "解组失败",
            type: "warning",
          });
        } else {
          ElMessage({
            message: `解组成功，已恢复 ${result.count || 0} 个节点`,
            type: "success",
          });
        }
      } else {
        ElMessage({
          message: "解组功能未准备好",
          type: "warning",
        });
      }
      currentNav.value = "";
      return;
    }

    if (navItem === "Group") {
      if (konvaRef.value?.groupSelectedNodes) {
        const result = konvaRef.value.groupSelectedNodes();
        if (!result?.success) {
          ElMessage({
            message: result?.message || "分组失败",
            type: "warning",
          });
        } else {
          ElMessage({
            message: `分组成功，已圈住 ${result.count || 0} 个节点`,
            type: "success",
          });
        }
      } else {
        ElMessage({
          message: "分组功能未准备好",
          type: "warning",
        });
      }
      currentNav.value = "";
      return;
    }

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

      const stage = konvaRef.value?.konvaData?.stage;
      if (stage && navItem === "Whisper") {
        stage.container().style.cursor = "default";
        stage.container().removeAttribute("title");
      }
      return;
    }

    // 其他导航项点击逻辑，切换时取消 AI 状态
    if (
      currentNav.value === "Reflect" ||
      currentNav.value === "Constellate" ||
      currentNav.value === "Resonance"
    ) {
      if (konvaRef.value && konvaRef.value.cancelAiAssist) {
        konvaRef.value.cancelAiAssist();
      }
      closeAiPopup();
    }
    closeWhisperPopup();
    currentNav.value = navItem;

    const stage = konvaRef.value?.konvaData?.stage;
    if (stage && navItem !== "Crop" && navItem !== "Whisper") {
      stage.container().style.cursor = "default";
      stage.container().removeAttribute("title");
    }
  }
};

const handleResonanceSubAction = (action) => {
  if (hintLoading.value) {
    return;
  }

  resonanceMenuVisible.value = false;
  if (resonanceMenuCloseTimer) {
    clearTimeout(resonanceMenuCloseTimer);
    resonanceMenuCloseTimer = null;
  }

  if (action === "Analysis") {
    handleNavClick("Resonance");
    return;
  }

  if (action === "Fuse") {
    runResonanceFuse();
  }
};

const handleResonanceMenuEnter = () => {
  if (resonanceMenuCloseTimer) {
    clearTimeout(resonanceMenuCloseTimer);
    resonanceMenuCloseTimer = null;
  }
  resonanceMenuVisible.value = true;
};

const handleResonanceMenuLeave = () => {
  if (resonanceMenuCloseTimer) {
    clearTimeout(resonanceMenuCloseTimer);
  }

  // 给鼠标从主按钮移动到下方菜单留一个短暂缓冲，避免闪退。
  resonanceMenuCloseTimer = setTimeout(() => {
    resonanceMenuVisible.value = false;
    resonanceMenuCloseTimer = null;
  }, 120);
};

const captureGroupScreenshotForFuse = (groupNode) => {
  if (!groupNode || typeof groupNode.toDataURL !== "function") {
    return "";
  }

  const hiddenNodeSnapshots = [];
  const shadowSnapshots = [];

  try {
    // 复用同一套排除规则，隐藏 group 背景与 ungroup 按钮。
    const excludedNodes = groupNode.find((node) =>
      isExcludedResonanceGroupChildName(node?.name?.())
    ) || [];
    excludedNodes.forEach((node) => {
      if (!node) return;
      hiddenNodeSnapshots.push({ node, visible: node.visible() });
      node.visible(false);
    });

    // 去掉 group 内 shape 的阴影，避免把选中态 boxshadow 带进截图。
    const shapeNodes = groupNode.find((node) => node instanceof Konva.Shape) || [];
    shapeNodes.forEach((shape) => {
      shadowSnapshots.push({
        node: shape,
        shadowColor: shape.shadowColor(),
        shadowBlur: shape.shadowBlur(),
        shadowOpacity: shape.shadowOpacity(),
        shadowOffset: shape.shadowOffset(),
      });

      shape.shadowColor("transparent");
      shape.shadowBlur(0);
      shape.shadowOpacity(0);
      shape.shadowOffset({ x: 0, y: 0 });
    });

    groupNode.getLayer?.()?.batchDraw?.();
    return String(groupNode.toDataURL({ pixelRatio: 1 }) || "").trim();
  } catch (error) {
    return "";
  } finally {
    hiddenNodeSnapshots.forEach((item) => {
      item.node.visible(item.visible);
    });

    shadowSnapshots.forEach((item) => {
      item.node.shadowColor(item.shadowColor);
      item.node.shadowBlur(item.shadowBlur);
      item.node.shadowOpacity(item.shadowOpacity);
      item.node.shadowOffset(item.shadowOffset || { x: 0, y: 0 });
    });

    groupNode.getLayer?.()?.batchDraw?.();
  }
};

const runResonanceFuse = async () => {
  const selectedNodes = konvaRef.value?.getSelectedNodes?.() || [];
  if (selectedNodes.length !== 1) {
    ElMessage({
      message: "请先选中一个 group 后再使用 Fuse",
      type: "warning",
    });
    return;
  }

  const groupNode = selectedNodes[0];
  const selectedType = String(groupNode?.getAttr?.("customType") || "");
  const selectedName = String(groupNode?.name?.() || "");
  if (selectedType !== "group" || selectedName !== "wm-group") {
    ElMessage({
      message: "Fuse 仅支持 Group 按钮创建的 group",
      type: "warning",
    });
    return;
  }

  reflectSelectedNodes.value = konvaRef.value?.resetNodesData?.([groupNode]) || [];
  reflectTargetNode.value = groupNode;
  reflectTargetType.value = selectedType;

  const payload = buildResonanceHintPayload(reflectSelectedNodes.value);

  // 为 Fuse 请求补充当前 group 的截图快照。
  const screenshot = captureGroupScreenshotForFuse(groupNode);
  payload.screenshot = screenshot;

  pendingAiTool.value = "Resonance";
  hintLoading.value = true;
  try {
    const res = await ResonanceFuse(payload);
    const fuseData = res?.data || {};

    const imageSrc = String(
      fuseData?.image_url || fuseData?.imageUrl || fuseData?.imageSrc || ""
    ).trim();
    const description = String(
      fuseData?.description || fuseData?.text || ""
    ).trim();
    const nodeId = String(fuseData?.id || "").trim();
    const nodeType = String(fuseData?.type || "resonance_fuse").trim();

    const fallbackScreenshot = String(payload?.screenshot || "").trim();
    let renderImageSrc = imageSrc || fallbackScreenshot;

    if (!renderImageSrc) {
      ElMessage({
        message: "Fuse 返回缺少图片，无法创建图文节点",
        type: "warning",
      });
      return;
    }

    const anchor = getPopupPositionRightOfNode(groupNode);
    const layer = konvaRef.value?.konvaData?.layer;
    if (!anchor?.stagePos || !layer) {
      ElMessage({
        message: "Fuse 节点创建失败，画布未准备好",
        type: "warning",
      });
      return;
    }

    let created;
    try {
      created = await createImageAndTextNodes(
        {
          imageSrc: renderImageSrc,
          text: description || "Fuse",
          id: nodeId,
          customType: nodeType,
        },
        {
          startX: anchor.stagePos.x,
          startY: anchor.stagePos.y,
          center: false,
          group: false,
        }
      );
    } catch (imageError) {
      // 接口图片加载失败时，自动回退到截图，避免 Fuse 直接失败。
      if (!fallbackScreenshot || renderImageSrc === fallbackScreenshot) {
        throw imageError;
      }

      renderImageSrc = fallbackScreenshot;
      created = await createImageAndTextNodes(
        {
          imageSrc: renderImageSrc,
          text: description || "Fuse",
          id: nodeId,
          customType: nodeType,
        },
        {
          startX: anchor.stagePos.x,
          startY: anchor.stagePos.y,
          center: false,
          group: true,
        }
      );
    }

    const createdNodes = Array.isArray(created) ? created : [created];
    createdNodes.forEach((node) => {
      if (!(node instanceof Konva.Node)) return;

      if (nodeId) {
        node.id(nodeId);
      }
      if (nodeType) {
        node.setAttr("customType", nodeType);
      }

      if (node instanceof Konva.Group) {
        const children = node.getChildren();
        children.forEach((child) => {
          if (child instanceof Konva.Image) {
            child.setAttr("imageSrc", renderImageSrc);
          }
        });
      } else if (node instanceof Konva.Image) {
        node.setAttr("imageSrc", renderImageSrc);
      }
    });

    if (konvaRef.value?.addExternalNodes) {
      konvaRef.value.addExternalNodes(createdNodes, { autoSelect: true });
    } else {
      createdNodes.forEach((node) => {
        if (!(node instanceof Konva.Node)) return;
        layer.add(node);
      });
      layer.batchDraw();
    }

    ElMessage({
      message: "Fuse 已生成图文节点",
      type: "success",
    });
  } catch (error) {
    console.error("ResonanceFuse failed:", error);
    const detail = String(
      error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.message ||
        "未知错误"
    ).trim();
    ElMessage({
      message: `Fuse 调用失败：${detail}`,
      type: "error",
    });
  } finally {
    pendingAiTool.value = "";
    hintLoading.value = false;
  }
};

const handleWhisperCanvasClick = (event) => {
  if (currentNav.value !== "Whisper" && currentNav.value !== "Add Memory") {
    return;
  }

  const stage = konvaRef.value?.konvaData?.stage;
  if (!stage) {
    return;
  }

  const stageRect = stage.container().getBoundingClientRect();

  const localX = event.clientX - stageRect.left;
  const localY = event.clientY - stageRect.top;

  const stagePos = {
    x: (localX - stage.x()) / stage.scaleX(),
    y: (localY - stage.y()) / stage.scaleY(),
  };

  if (currentNav.value === "Whisper") {
    const targetNode = getSegmentTargetAtPointer(event);
    if (!targetNode) {
      return;
    }

    const popupAnchor = getPopupPositionRightOfNode(targetNode);
    if (!popupAnchor) {
      return;
    }

    whisperPopupData.value = {
      position: popupAnchor.position,
      stagePos: popupAnchor.stagePos,
      toolType: currentNav.value,
      targetNode,
    };
  } else {
    whisperPopupData.value = {
      position: {
        x: event.clientX,
        y: event.clientY,
      },
      stagePos,
      toolType: currentNav.value,
      targetNode: null,
    };
  }

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

  if (target.getAttr("customType") !== "pcm_unit") {
    return null;
  }

  const img = target.image?.();
  const imageSrc = img?.src || "";
  if (!imageSrc) {
    return null;
  }

  return target;
};

const getSegmentTargetAtPointer = (event) => {
  // Whisper 仅允许命中 segment 节点，避免误触主图或泡泡。
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
  if (!target) {
    return null;
  }

  if (target.getAttr("customType") !== "segment") {
    return null;
  }

  return target;
};

const getPopupPositionRightOfNode = (targetNode) => {
  // 弹窗锚定在 segment 右侧；用舞台 transform 换算成屏幕坐标。
  const stage = konvaRef.value?.konvaData?.stage;
  const layer = konvaRef.value?.konvaData?.layer;
  if (!stage || !layer || !targetNode) {
    return null;
  }

  const nodeRect = targetNode.getClientRect({
    relativeTo: layer,
    skipShadow: true,
    skipStroke: true,
  });

  const anchorStagePos = {
    x: nodeRect.x + nodeRect.width + 16,
    y: nodeRect.y,
  };

  const stageRect = stage.container().getBoundingClientRect();
  const transform = stage.getAbsoluteTransform();
  const localPos = transform.point(anchorStagePos);

  return {
    stagePos: anchorStagePos,
    position: {
      x: stageRect.left + localPos.x,
      y: stageRect.top + localPos.y,
    },
  };
};

const exitReflectMode = () => {
  // 工具跳转时仅退出 Reflect 交互态，不主动关闭已打开的 AI 弹窗。
  currentNav.value = "";

  if (konvaRef.value && konvaRef.value.clearAiGuideLine) {
    konvaRef.value.clearAiGuideLine();
  }
  if (konvaRef.value && konvaRef.value.cancelAiAssist) {
    konvaRef.value.cancelAiAssist();
  }

  if (konvaRef.value && konvaRef.value.clearSelection) {
    konvaRef.value.clearSelection();
  }

  // 清空 Reflect 目标与序列化数据，避免后续仍按旧节点分流 QuickTools。
  reflectSelectedNodes.value = null;
  reflectTargetNode.value = null;
  reflectTargetType.value = "";
};

const openCropPopupForNode = (targetNode) => {
  if (!targetNode || targetNode.getAttr?.("customType") !== "pcm_unit") {
    ElMessage({
      message: "当前 Reflect 节点不支持 Crop",
      type: "warning",
    });
    return;
  }

  const img = targetNode.image?.();
  const imageSrc = img?.src || "";
  if (!imageSrc) {
    ElMessage({
      message: "当前节点缺少可裁剪图片",
      type: "warning",
    });
    return;
  }

  cropPopupData.value = {
    imageSrc,
    targetNode,
  };
  cropPopupVisible.value = true;
};

const openWhisperPopupForNode = (targetNode) => {
  if (!targetNode || targetNode.getAttr?.("customType") !== "segment") {
    ElMessage({
      message: "当前 Reflect 节点不支持 Whisper",
      type: "warning",
    });
    return;
  }

  const popupAnchor = getPopupPositionRightOfNode(targetNode);
  if (!popupAnchor) {
    ElMessage({
      message: "Whisper 弹窗定位失败",
      type: "warning",
    });
    return;
  }

  whisperPopupData.value = {
    position: popupAnchor.position,
    stagePos: popupAnchor.stagePos,
    toolType: "Whisper",
    targetNode,
  };
  whisperPopupVisible.value = true;
};

const handleWhisperCanvasHover = (event) => {
  const stage = konvaRef.value?.konvaData?.stage;
  if (!stage) {
    return;
  }

  if (currentNav.value !== "Whisper") {
    return;
  }

  // 仅 segment 显示“可点击并分析”的提示语。
  const target = getSegmentTargetAtPointer(event);
  stage.container().style.cursor = target ? "pointer" : "default";
  if (target) {
    stage.container().setAttribute("title", "点击后输入文本，重新分析该 segment");
  } else {
    stage.container().removeAttribute("title");
  }
};

const handleCropCanvasHover = (event) => {
  const stage = konvaRef.value?.konvaData?.stage;
  if (!stage) {
    return;
  }

  if (currentNav.value !== "Crop") {
    stage.container().style.cursor = "default";
    stage.container().removeAttribute("title");
    return;
  }

  const target = getImageTargetAtPointer(event);
  stage.container().style.cursor = target ? "pointer" : "default";
  if (target) {
    stage.container().setAttribute("title", "点击裁剪并分析主图");
  } else {
    stage.container().removeAttribute("title");
  }
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
  // 按当前工具分流 hover 逻辑，避免 Whisper 与 Crop 的提示互相覆盖。
  if (currentNav.value === "Whisper") {
    handleWhisperCanvasHover(event);
    return;
  }

  if (currentNav.value === "Crop") {
    handleCropCanvasHover(event);
    return;
  }

  const stage = konvaRef.value?.konvaData?.stage;
  if (stage) {
    stage.container().style.cursor = "default";
    stage.container().removeAttribute("title");
  }
};

const handleCanvasMouseLeave = () => {
  const stage = konvaRef.value?.konvaData?.stage;
  if (!stage) {
    return;
  }
  if (currentNav.value === "Crop" || currentNav.value === "Whisper") {
    stage.container().style.cursor = "default";
    stage.container().removeAttribute("title");
  }
};

const handleCanvasClick = (event) => {
  handleWhisperCanvasClick(event);
  handleCropCanvasClick(event);
};

const closeWhisperPopup = () => {
  whisperPopupVisible.value = false;
  // 关闭时清理节点引用，防止复用上一次的 segment。
  whisperPopupData.value = {
    ...whisperPopupData.value,
    targetNode: null,
  };
};

const handleWhisperPopupCancel = () => {
  if (whisperSubmitting.value) {
    return;
  }

  const stage = konvaRef.value?.konvaData?.stage;
  if (stage) {
    stage.container().style.cursor = "default";
    stage.container().removeAttribute("title");
  }

  closeWhisperPopup();
  if (currentNav.value === "Whisper" || currentNav.value === "Add Memory") {
    currentNav.value = "";
  }
};

const handleCropConfirm = async ({ dataUrl }) => {
  const node = cropPopupData.value.targetNode;
  if (!node || !dataUrl) {
    return;
  }

  if (!konvaRef.value || !konvaRef.value.addSegmentsAroundTarget) {
    ElMessage({
      message: "裁剪更新功能未准备好",
      type: "warning",
    });
    return;
  }

  cropSubmitting.value = true;
  try {
    // const response = await cropUpdate({
    //   imageDataUrl: dataUrl,
    //   target: {
    //     id: node.id?.() || "",
    //     type: node.getAttr?.("customType") || "",
    //   },
    // });
    const response = await cropUpdate({
      "type": "action",
      "action": "crop",
      "image":dataUrl,
      "parent_ref": node.id?.() || "" ,
      "operation_logs": operation_logs,
    });

    const payload = response?.data?.data ?? response?.data ?? null;
    payload.segment.image_url = dataUrl; // 直接用裁剪后的图覆盖原 segment 的图片，避免接口未返回 image_url 时无法渲染。
    const segments = [payload?.segment].filter(
      (seg) => seg && typeof seg === "object"
    );

    if (!segments.length) {
      throw new Error("cropUpdate 未返回可渲染的 segment");
    }

    const count = await konvaRef.value.addSegmentsAroundTarget(node, segments);
    if (!count) {
      throw new Error("segment 渲染失败");
    }

    cropPopupVisible.value = false;
    cropPopupData.value = {
      imageSrc: "",
      targetNode: null,
    };

    const stage = konvaRef.value?.konvaData?.stage;
    if (stage) {
      stage.container().style.cursor = "default";
      stage.container().removeAttribute("title");
    }

    currentNav.value = "";
    ElMessage({
      message: "图片分析完成，已在主图周边生成 segment 与泡泡",
      type: "success",
    });
  } catch (error) {
    console.error("cropUpdate failed:", error);
    ElMessage({
      message: "裁剪分析失败，请稍后重试",
      type: "error",
    });
  } finally {
    cropSubmitting.value = false;
  }
};

const handleCropCancel = () => {
  if (cropSubmitting.value) {
    return;
  }

  cropPopupVisible.value = false;
  cropPopupData.value = {
    imageSrc: "",
    targetNode: null,
  };

  const stage = konvaRef.value?.konvaData?.stage;
  if (stage) {
    stage.container().style.cursor = "default";
    stage.container().removeAttribute("title");
  }

  if (currentNav.value === "Crop") {
    currentNav.value = "";
  }
};

const handleWhisperSubmit = async (payload) => {
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

  if (whisperPopupData.value.toolType === "Add Memory") {
    if (!imageDataUrl) {
      ElMessage({
        message: "Add Memory 请上传图片后再提交",
        type: "warning",
      });
      return;
    }

    if (!konvaRef.value.addPCMAtPosition) {
      ElMessage({
        message: "图文添加功能未准备好",
        type: "warning",
      });
      return;
    }

    whisperSubmitting.value = true;
    try {
      const response = await CreateOnePCM({
        text: content,
        // imageFile: payload?.imageFile || null,
        // imageDataUrl,
        time_place: "",
        images: [imageDataUrl],
      });
      const pcmDetail = response?.data?.data || response?.data || null;

      if (!pcmDetail || typeof pcmDetail !== "object") {
        throw new Error("CreateOnePCM 响应缺少有效 pcm detail");
      }

      const insertedItem = pcmStore.insertPCMDetailToFront(pcmDetail);
      if (!insertedItem) {
        throw new Error("PCM 数据映射失败，无法插入列表");
      }

      konvaRef.value.addPCMAtPosition(
        insertedItem,
        whisperPopupData.value.stagePos,
        false
      );

      closeWhisperPopup();
      currentNav.value = "";
      ElMessage({
        message: "记忆创建成功，已添加到列表与画布",
        type: "success",
      });
    } catch (error) {
      console.error("CreateOnePCM failed:", error);
      ElMessage({
        message: "创建记忆失败，请稍后重试",
        type: "error",
      });
    } finally {
      whisperSubmitting.value = false;
    }

    return;
  }

  if (whisperPopupData.value.toolType === "Whisper") {
    // Whisper 分支：提交文本 + 当前 segment，返回 bubbles 后回填到该 segment 周边。
    const targetNode = whisperPopupData.value.targetNode;
    if (!targetNode) {
      ElMessage({
        message: "请点击一个 segment 后再进行分析",
        type: "warning",
      });
      return;
    }

    if (!konvaRef.value.addBubblesAroundTarget) {
      ElMessage({
        message: "泡泡渲染功能未准备好",
        type: "warning",
      });
      return;
    }

    whisperSubmitting.value = true;
    try {
      // const response = await whisperUpdate({
      //   text: content,
      //   segment: {
      //     id: targetNode.id?.() || "",
      //     type: targetNode.getAttr?.("customType") || "segment",
      //   },
      // });

       const response = await whisperUpdate({
        "id": targetNode.id?.() || "",
        "type": "action",
        "action": "whisper",
        "text" : content,
        "operation_logs" : operation_logs,
      });

      const result = response?.data?.data ?? response?.data ?? {};
      const bubbles = Array.isArray(result?.bubbles)
        ? result.bubbles
        : Array.isArray(result)
        ? result
        : [];
      // const bubbles = [result.whisper]

      if (!bubbles.length) {
        throw new Error("whisperUpdate 未返回 bubbles");
      }

      const count = await konvaRef.value.addBubblesAroundTarget(targetNode, bubbles);
      if (!count) {
        throw new Error("bubbles 渲染失败");
      }

      const stage = konvaRef.value?.konvaData?.stage;
      if (stage) {
        stage.container().style.cursor = "default";
        stage.container().removeAttribute("title");
      }

      closeWhisperPopup();
      currentNav.value = "";
      ElMessage({
        message: "分析完成，已在该 segment 周边生成泡泡",
        type: "success",
      });
    } catch (error) {
      console.error("whisperUpdate failed:", error);
      ElMessage({
        message: "Whisper 分析失败，请稍后重试",
        type: "error",
      });
    } finally {
      whisperSubmitting.value = false;
    }

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
    resonanceData: [],
    constellateData: {},
    loading: true, // 开始加载
    relativePos: { x: relativeX, y: relativeY },
    reflectTargetType: reflectTargetType.value || "",
    reflectTargetId: reflectTargetNode.value?.id?.() || "",
    reflectRequestData: null,
  };

  // 弹窗侧缓存 Reflect 目标节点，供 QuickTools 在退出圆环后继续使用。
  reflectPopupTargetNode.value = reflectTargetNode.value || null;
  aiPopupVisible.value = true;

  const hintBasePayload =
    currentNav.value === "Resonance"
      ? buildResonanceHintPayload(reflectSelectedNodes.value)
      : buildHintPayload(reflectSelectedNodes.value);
  const selectedDimensionOrPerspective = getPerspectivePayloadByLabel(data.label);
  const rawRingWidth = Math.max(1, Number(data.ringWidth) || 1);
  const rawLineLength = Math.max(0, Number(data.lineLength) || 0);
  const depthRatio = Math.max(0, Math.min(1, rawLineLength / rawRingWidth));
  // 统一用视觉圆环宽度作为 depth.max，避免画布缩放时 depth 数值漂移。
  const depthMax = 200;

  // 构建请求参数
  const requestData = {
    ...hintBasePayload,
    ...(currentNav.value === "Resonance"
      ? { dimension: selectedDimensionOrPerspective }
      : { perspective: selectedDimensionOrPerspective }),
    depth: {
      min: 0,
      max: depthMax,
      value: Math.round(depthRatio * depthMax),
    },
  };
  aiPopupData.value.reflectRequestData = requestData;
  console.log("requestData", requestData);

  try {
    let res;
    if (currentNav.value === "Constellate") {
      res = await ConstellateSuggest(requestData);
      const payload = res?.data || {};
      aiPopupData.value.constellateData = payload;
      aiPopupData.value.questionList = [];
      aiPopupData.value.resonanceData = [];
    } else if (currentNav.value === "Resonance") {
      res = await ResonanceAnalysis(requestData);
      const resonanceList = Array.isArray(res?.data?.analysis)
        ? res.data.analysis
        : [];

      // Resonance 数据直接透传给弹窗，不做字段转换。
      aiPopupData.value.resonanceData = resonanceList;
      aiPopupData.value.questionList = [];
      aiPopupData.value.constellateData = {};
    } else {
      res = await ReflectQuestions(requestData);
      const questionList =
        (Array.isArray(res?.data) && res.data) ||
        (Array.isArray(res?.data?.data) && res.data.data) ||
        (Array.isArray(res?.data?.questionList) && res.data.questionList) ||
        [];
      aiPopupData.value.questionList = questionList;
      aiPopupData.value.resonanceData = [];
      aiPopupData.value.constellateData = {};
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
    (currentNav.value === "Reflect" ||
      currentNav.value === "Constellate" ||
      currentNav.value === "Resonance")
  ) {
    currentNav.value = "";
    closeAiPopup();
  }
};

const handleAiPopupConfirm = (data) => {
  if (aiPopupData.value?.toolType === "Resonance") {
    // Resonance 确认后：把选中的分析结果（主文本 + actions）绘制到 group 右侧。
    const targetGroupNode = reflectTargetNode.value;
    const anchor = getPopupPositionRightOfNode(targetGroupNode);
    const resonanceItem = data?.resonanceItem || null;
    const textContent = String(
      resonanceItem?.text || resonanceItem?.keyword || data?.question || ""
    ).trim();

    if (!textContent) {
      ElMessage({
        message: "请选择一条分析结果后再确认",
        type: "warning",
      });
      return;
    }

    if (!anchor?.stagePos || !konvaRef.value?.addResonanceGroupAtPosition) {
      ElMessage({
        message: "Resonance 文本绘制失败，画布未准备好",
        type: "warning",
      });
      return;
    }

    // 组内文本节点禁用拖拽与编辑；仅外层 group 可整体拖动。
    konvaRef.value.addResonanceGroupAtPosition(
      resonanceItem || { text: textContent, actions: [] },
      anchor.stagePos
    );
    if (konvaRef.value && konvaRef.value.cancelAiAssist) {
      konvaRef.value.cancelAiAssist();
    }
    closeAiPopup();
    currentNav.value = "";
    return;
  }

  if (konvaRef.value && konvaRef.value.createAiContentNode) {
    const isConstellate = currentNav.value === "Constellate";
    // 传入问题（作为标题/label）、图片列表
    konvaRef.value.createAiContentNode(
      data.images,
      data.question,
      data.nodeMeta,
      {
        flattenToNodes: isConstellate,
      }
    );
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

  const inReflectPopup = aiPopupData.value?.toolType === "Reflect";
  if (inReflectPopup) {
    const popupNode = reflectPopupTargetNode.value || reflectTargetNode.value;

    if (tool === "Crop") {
      const node = popupNode;
      exitReflectMode();
      openCropPopupForNode(node);
      return;
    }

    if (tool === "Whisper") {
      const node = popupNode;
      exitReflectMode();
      openWhisperPopupForNode(node);
      return;
    }

    if (tool === "Add Memory") {
      exitReflectMode();
      handleNavClick(tool);
      return;
    }
  }

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
  reflectTargetNode.value = null;
  reflectTargetType.value = "";
  reflectPopupTargetNode.value = null;
  aiPopupData.value.reflectTargetType = "";
  aiPopupData.value.reflectTargetId = "";
  aiPopupData.value.reflectRequestData = null;
  aiPopupData.value.questionList = [];
  aiPopupData.value.resonanceData = [];
  aiPopupData.value.constellateData = {};
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
    const stage = konvaRef.value?.konvaData?.stage;
    const stagePos = whisperPopupData.value.stagePos;
    let whisperPos = null;

    if (stage && stagePos) {
      const stageRect = stage.container().getBoundingClientRect();
      const transform = stage.getAbsoluteTransform();
      const localPos = transform.point(stagePos);
      whisperPos = {
        x: stageRect.left + localPos.x,
        y: stageRect.top + localPos.y,
      };
    }

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
  top: 10px;
  left: 10px;
  // left: 50%;
  // transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  padding: 8px 20px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  gap: 5px;
  max-width: calc(100% - 70px);
  flex-wrap: wrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  z-index: 100;
  border: 1px solid rgba(0, 0, 0, 0.05);

  .nav-item {
    position: relative;
    font-size: 14px;
    font-weight: 500;
    color: #333;
    cursor: pointer;
    transition: all 0.2s;
    padding: 6px 10px;
    border-radius: 20px;
    white-space: nowrap;

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

    &::after {
      content: attr(data-tip);
      position: absolute;
      left: 50%;
      top: calc(100% + 8px);
      transform: translateX(-50%);
      padding: 4px 8px;
      font-size: 12px;
      line-height: 1.3;
      color: #fff;
      background: rgba(30, 30, 30, 0.92);
      border-radius: 6px;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.18s ease;
      z-index: 2;
    }

    &:hover::after {
      opacity: 1;
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

    &.resonance-nav::after {
      display: none;
    }

    &.resonance-nav.open .resonance-submenu {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
      pointer-events: auto;
    }

    .resonance-submenu {
      position: absolute;
      left: 50%;
      top: calc(100% + 14px);
      transform: translateX(-50%) translateY(4px);
      width: 176px;
      border-radius: 16px;
      background: #f6f6f6;
      border: 2px solid #1f2937;
      box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
      padding: 10px 0;
      display: flex;
      flex-direction: column;
      gap: 0;
      opacity: 0;
      pointer-events: none;
      transition: all 0.18s ease;
      z-index: 12;
    }

    .resonance-submenu-btn {
      border: none;
      background: transparent;
      padding: 12px 16px;
      font-size: 14px;
      line-height: 1.2;
      font-weight: 500;
      color: #222;
      cursor: pointer;
      text-align: center;
      transition: background-color 0.15s ease, color 0.15s ease;

      &:hover:not(:disabled) {
        background: rgba(0, 0, 0, 0.05);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      &:first-child {
        border-bottom: 1px solid #d5d5d5;
      }
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

.resonance-popup {
  position: absolute;
  width: min(480px, calc(100% - 32px));
  max-height: 60vh;
  z-index: 130;
  border: 1px solid #dbe5f2;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.18);
  overflow: hidden;
}

.resonance-popup-header {
  height: 38px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  background: #f8fafc;
}

.resonance-popup-close {
  border: 0;
  background: transparent;
  color: #64748b;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}

.resonance-result-pre {
  max-height: calc(60vh - 38px);
  margin: 0;
  padding: 12px;
  overflow: auto;
  border-radius: 0;
  border: 0;
  background: transparent;
  color: #1f2937;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
