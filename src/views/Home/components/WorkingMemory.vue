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
        @selection-change="handleCanvasSelectionChange"
        @stage-transform="handleStageTransform"
      />
      <AiQuestionPopup
        :visible="aiPopupVisible"
        :position="aiPopupData.position"
        :label="aiPopupData.label"
        :tool-type="aiPopupData.toolType"
        :line-length="aiPopupData.lineLength"
        :items="aiPopupData.items"
        :title="aiPopupData.title"
        :loading="aiPopupData.loading"
        :quick-tools="aiQuickTools"
        @confirm="handleAiPopupConfirm"
        @regenerate="handleAiPopupRegenerate"
        @tool-click="handleAiPopupToolClick"
        @cancel="handleAiPopupCancel"
      />
      <WhisperInputPopup
        ref="whisperPopupRef"
        :visible="whisperPopupVisible"
        :position="whisperPopupData.position"
        :title="whisperPopupData.toolType || 'Whisper'"
        :tool-type="whisperPopupData.toolType || 'Whisper'"
        :submit-loading="whisperSubmitting"
        @submit="handleWhisperSubmit"
        @cancel="handleWhisperPopupCancel"
      />
      <!-- Crop 覆盖层内部仍允许中键拖动画布与滚轮缩放/滚动画布 -->
      <CropImagePopup
        :visible="cropPopupVisible"
        :image-src="cropPopupData.imageSrc"
        :frame="cropPopupData.frame"
        :confirm-loading="cropSubmitting"
        @confirm="handleCropConfirm"
        @cancel="handleCropCancel"
        @stage-pan-by="handleCropStagePanBy"
        @stage-wheel="handleCropStageWheel"
      />
    </div>

    <!-- 顶部导航栏 -->
    <div class="top-nav-bar">
      <!-- <div v-if="hintLoading" class="nav-loading-tip">提示词加载中，请稍候...</div> -->
      <el-tooltip
        v-for="item in primaryTopNavItems"
        :key="item.key"
        placement="bottom"
        effect="dark"
        popper-class="wm-nav-tooltip"
        :popper-style="navTooltipPopperStyle"
      >
        <template #content>
          <div class="nav-tooltip-content" :style="navTooltipContentStyle">{{ getNavHint(item.hintKey) }}</div>
        </template>
        <div class="nav-tooltip-trigger">
          <div
            class="nav-item"
            :class="{ active: item.active, disabled: item.disabled, loading: item.loading }"
            @click="item.onClick()"
          >
            {{ item.label }}
            <el-icon v-if="item.loading" class="nav-loading-inline is-loading">
              <Loading />
            </el-icon>
          </div>
        </div>
      </el-tooltip>
      <div class="nav-separator">|</div>
      <el-tooltip
        v-for="item in secondaryTopNavItems"
        :key="item.key"
        placement="bottom"
        effect="dark"
        popper-class="wm-nav-tooltip"
        :popper-style="navTooltipPopperStyle"
      >
        <template #content>
          <div class="nav-tooltip-content" :style="navTooltipContentStyle">{{ getNavHint(item.hintKey) }}</div>
        </template>
        <div class="nav-tooltip-trigger">
          <div
            class="nav-item"
            :class="{ active: item.active, disabled: item.disabled, loading: item.loading }"
            @click="item.onClick()"
          >
            {{ item.label }}
            <el-icon v-if="item.loading" class="nav-loading-inline is-loading">
              <Loading />
            </el-icon>
          </div>
        </div>
      </el-tooltip>
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
            {{ t("popupTexts.topicContainer.sendToTopic", { index: index + 1 }) }}
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
import { useI18n } from "vue-i18n";
import konvaComponent from "@/components/konvaComponent.vue";
import AiQuestionPopup from "./AiQuestionPopup.vue";
import WhisperInputPopup from "./WhisperInputPopup.vue";
import CropImagePopup from "./CropImagePopup.vue";
import { createImageAndTextNodes, createTextNode } from "@/utils/canvasPositionUtils";
import { drawAiPopupSelectionToCanvas } from "@/utils/aiPopupCanvasRenderer";
import {
  CreateOnePCM,
  ConstellateSuggest,
  ReflectHint,
  ConstellateHint,
  ResonanceHint,
  ResonanceAnalysis,
  ResonanceFuseNew,
  ReflectQuestions,
  feedbackConfirm,
  cropUpdate,
  whisperUpdate,
} from "@/service/api";
import { consumeOperationLogs } from "@/service/operationLogs";
import { usePCMStore } from "@/stores/pcmStore";

const props = defineProps({
  topicContainers: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["renderNodesToTopic"]);
const pcmStore = usePCMStore();
const { t } = useI18n();

const memoryItems = ref([]);
const konvaRef = ref(null);
const whisperPopupRef = ref(null);
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
const fuseLoading = ref(false); // Fuse 图片生成请求中
const whisperPopupVisible = ref(false);
const whisperPopupData = ref({
  position: { x: 0, y: 0 },
  stagePos: { x: 0, y: 0 },
  toolType: "Whisper",
  targetNode: null,
});
const whisperSubmitting = ref(false);
/** 当前正在展示 Whisper 高亮样式的 node 引用 */
const whisperHighlightNode = ref(null);

const applyWhisperHighlight = (node) => {
  if (!node || !konvaRef.value?.setWhisperHighlight) return;
  // 如果之前已有高亮节点，先移除
  if (whisperHighlightNode.value && whisperHighlightNode.value !== node) {
    konvaRef.value.setWhisperHighlight(whisperHighlightNode.value, false);
  }
  whisperHighlightNode.value = node;
  konvaRef.value.setWhisperHighlight(node, true);
};

const clearWhisperHighlight = () => {
  if (whisperHighlightNode.value && konvaRef.value?.setWhisperHighlight) {
    konvaRef.value.setWhisperHighlight(whisperHighlightNode.value, false);
  }
  whisperHighlightNode.value = null;
};

const isWmGroupNode = (node) => {
  const selectedType = String(node?.getAttr?.("customType") || "");
  const selectedName = String(node?.name?.() || "");
  return selectedType === "group" && selectedName === "wm-group";
};

// 只要祖先链上已经进入某个 wm-group，就不允许再次参与顶部 Group，
// 避免形成嵌套 group，导致交互和导出结构都变复杂。
const isNodeInsideWmGroup = (node) => {
  if (!node || typeof node.getParent !== "function") {
    return false;
  }

  let current = node;
  while (current && typeof current.getParent === "function") {
    if (isWmGroupNode(current)) {
      return true;
    }
    current = current.getParent();
  }

  return false;
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
  Reflect: "反思单个记忆\n先选中一个主图/子图，\n或 Group 按钮创建的 group 再点击",
  Constellate: "关联更多记忆\n先选中一个主图/子图/泡泡节点，\n或 Group 按钮创建的 group 再点击",
  Resonance: "涌现创意想法\n仅支持选中 Group 按钮创建的 group",
  Fuse: "生成图片\n仅支持选中 Group 按钮创建的 group",
  Whisper: "先选中一个子图 segment，\n再点击按钮输入文本重新分析",
  Crop: "先选中一个主图 pcm_unit，\n再点击按钮进行裁剪",
  "Add Memory": "点击画布位置后上传图文",
  Group: "先选中至少两个未分组节点，\n再点击按钮创建 group",
  Ungroup: "选中一个 group 后使用",
};

const getNavHint = (navItem) => NAV_HINTS[navItem] || "";
// 把 Konva 当前选中节点标准化成单选判定需要的数据，
// 顶部 Reflect / Connect / Compose / Fuse 都基于这一组计算结果控制禁用态。
const selectedCanvasNodes = computed(() =>
  Array.isArray(selectedNodesData.value) ? selectedNodesData.value.filter(Boolean) : []
);
const selectedCanvasNode = computed(() =>
  selectedCanvasNodes.value.length === 1 ? selectedCanvasNodes.value[0] : null
);
const selectedCanvasNodeType = computed(() =>
  String(selectedCanvasNode.value?.getAttr?.("customType") || "")
);
const selectedCanvasNodeIsGroup = computed(() => isWmGroupNode(selectedCanvasNode.value));
const selectedCanvasNodeHasImage = computed(() => {
  const imageSrc = String(selectedCanvasNode.value?.image?.()?.src || "").trim();
  return imageSrc.length > 0;
});
// Whisper: 仅允许单选 segment，且提交过程中不再允许重复打开弹窗。
const canUseWhisper = computed(() => {
  if (hintLoading.value || whisperSubmitting.value || selectedCanvasNodes.value.length !== 1) {
    return false;
  }

  return selectedCanvasNodeType.value === "segment";
});
// Crop: 仅允许单选 pcm_unit，且目标节点必须真的带有图片资源。
const canUseCrop = computed(() => {
  if (hintLoading.value || cropSubmitting.value || selectedCanvasNodes.value.length !== 1) {
    return false;
  }

  return selectedCanvasNodeType.value === "pcm_unit" && selectedCanvasNodeHasImage.value;
});
// 只要多选里混入了已在 group 内的节点，就整体禁用 Group 按钮，
// 让按钮态和 konva 侧的实际分组约束保持一致。
const selectedCanvasNodesContainGroupedNode = computed(() =>
  selectedCanvasNodes.value.some((node) => isNodeInsideWmGroup(node))
);
// Group: 至少两个未分组节点才能执行分组，避免嵌套 group。
const canUseGroup = computed(() => {
  if (hintLoading.value) {
    return false;
  }

  return (
    selectedCanvasNodes.value.length >= 2 &&
    !selectedCanvasNodesContainGroupedNode.value
  );
});
// Reflect: 仅允许单选 pcm_unit / segment / wm-group。
const canUseReflect = computed(() => {
  if (hintLoading.value || selectedCanvasNodes.value.length !== 1) {
    return false;
  }

  return (
    selectedCanvasNodeType.value === "pcm_unit" ||
    selectedCanvasNodeType.value === "segment" ||
    selectedCanvasNodeIsGroup.value
  );
});
// Constellate: 比 Reflect 多支持 bubble。
const canUseConstellate = computed(() => {
  if (hintLoading.value || selectedCanvasNodes.value.length !== 1) {
    return false;
  }

  return (
    selectedCanvasNodeType.value === "pcm_unit" ||
    selectedCanvasNodeType.value === "segment" ||
    selectedCanvasNodeType.value === "bubble" ||
    selectedCanvasNodeIsGroup.value
  );
});
// Resonance/Compose: 仅允许单选由 Group 按钮创建出的 wm-group。
const canUseResonance = computed(() => {
  if (hintLoading.value || selectedCanvasNodes.value.length !== 1) {
    return false;
  }

  return selectedCanvasNodeIsGroup.value;
});
// Fuse 与 Resonance 的节点约束一致，同时在接口请求进行中保持禁用，避免重复提交。
const canUseFuse = computed(() => {
  if (hintLoading.value || fuseLoading.value || selectedCanvasNodes.value.length !== 1) {
    return false;
  }

  return selectedCanvasNodeIsGroup.value;
});
const navTooltipPopperStyle = {
  maxWidth: "260px",
  whiteSpace: "pre-line",
  lineHeight: "1.45",
  padding: "8px 10px",
};
const navTooltipContentStyle = {
  whiteSpace: "pre-line",
  lineHeight: "1.45",
};
// 顶部导航统一收口到配置数组里，避免同一套 tooltip/trigger/button 模板重复维护。
const primaryTopNavItems = computed(() => [
  {
    key: "Reflect",
    label: "Reflect",
    hintKey: "Reflect",
    active: currentNav.value === "Reflect",
    disabled: currentNav.value !== "Reflect" && !canUseReflect.value,
    loading: hintLoading.value && pendingAiTool.value === "Reflect",
    onClick: () => handleNavClick("Reflect"),
  },
  {
    key: "Constellate",
    label: "Connect",
    hintKey: "Constellate",
    active: currentNav.value === "Constellate",
    disabled: currentNav.value !== "Constellate" && !canUseConstellate.value,
    loading: hintLoading.value && pendingAiTool.value === "Constellate",
    onClick: () => handleNavClick("Constellate"),
  },
  {
    key: "Resonance",
    label: "Compose",
    hintKey: "Resonance",
    active: currentNav.value === "Resonance",
    disabled: currentNav.value !== "Resonance" && !canUseResonance.value,
    loading: hintLoading.value && pendingAiTool.value === "Resonance",
    onClick: () => handleNavClick("Resonance"),
  },
]);
const secondaryTopNavItems = computed(() => [
  {
    key: "Whisper",
    label: "💭  Whisper",
    hintKey: "Whisper",
    active: currentNav.value === "Whisper" && whisperPopupVisible.value,
    disabled: !canUseWhisper.value,
    loading: false,
    onClick: () => handleNavClick("Whisper"),
  },
  {
    key: "Crop",
    label: "✂️Crop",
    hintKey: "Crop",
    active: currentNav.value === "Crop" && cropPopupVisible.value,
    disabled: !canUseCrop.value,
    loading: false,
    onClick: () => handleNavClick("Crop"),
  },
  {
    key: "Add Memory",
    label: "📷Add Memory",
    hintKey: "Add Memory",
    active: currentNav.value === "Add Memory",
    disabled: hintLoading.value,
    loading: false,
    onClick: () => handleNavClick("Add Memory"),
  },
  {
    key: "Group",
    label: "🔗Group",
    hintKey: "Group",
    active: false,
    disabled: !canUseGroup.value,
    loading: false,
    onClick: () => handleNavClick("Group"),
  },
  {
    key: "Fuse",
    label: "Fuse",
    hintKey: "Fuse",
    active: false,
    disabled: !canUseFuse.value,
    loading: fuseLoading.value,
    onClick: () => runResonanceFuse(),
  },
]);
const cropPopupVisible = ref(false);
const cropPopupData = ref({
  imageSrc: "",
  targetNode: null,
  frame: null,
});
const cropSubmitting = ref(false);
let cropFrameUpdateRaf = 0;
let pendingCropFrame = null;
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

// Konva 会在每次选择集变化时抛出 selection-change，这里同步到父组件本地状态，
// 供顶部按钮实时切换禁用态，而不是等点击后再做校验。
const handleCanvasSelectionChange = (nodes) => {
  selectedNodesData.value = Array.isArray(nodes) ? [...nodes] : [];
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
  items: [],
  title: "",
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
    operation_logs: consumeOperationLogs(),
  };
};

const RESONANCE_GROUP_EXCLUDED_NAMES = new Set([
  "group-bg",
  "group-ungroup-btn",
  "group-meaning-text",
  "group-meaning-bg",
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
  const groupMeaningFromChild = Array.isArray(firstNode?.children)
    ? firstNode.children.find(
        (child) => String(child?.attrs?.name || "") === "group-meaning-text"
      )?.attrs?.text
    : "";

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
    operation_logs: consumeOperationLogs(),
    group_meaning: String(groupMeaningFromChild || "").trim(),
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
    const hintPayload = buildAiBasePayload(
      toolType,
      reflectSelectedNodes.value,
      reflectTargetNode.value
    );
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
    const detail = String(
      error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.message ||
        "未知错误"
    ).trim();
    ElMessage({
      message:
        toolType === "Constellate"
          ? `ConstellateHint 获取失败，已使用默认标签：${detail}`
          : toolType === "Resonance"
          ? `ResonanceHint 获取失败，已使用默认标签：${detail}`
          : `ReflectHint 获取失败，已使用默认标签：${detail}`,
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

const applyAiRingTheme = (toolType = "Reflect") => {
  if (!konvaRef.value?.setAiRingThemeMode) {
    return;
  }

  konvaRef.value.setAiRingThemeMode(toolType);
};

const handleAiAssistClick = async (toolType = "Reflect") => {
  if (hintLoading.value) {
    ElMessage({
      message: "提示词仍在加载中，请稍候",
      type: "info",
    });
    return;
  }

  const selectedNodes = konvaRef.value?.getSelectedNodes?.() || [];

  // 顶部 AI 工具按钮再次点击时，统一视为“关闭当前环”，
  // 不继续请求 hint，也不因为当前已切到别的节点而重建新环。
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
    if (
      selectedType !== "pcm_unit" &&
      selectedType !== "segment" &&
      !isWmGroupNode(selectedNodes[0])
    ) {
      ElMessage({
        message:
          'Reflect 仅支持选中 type 为 "pcm_unit"、"segment"，或 Group 按钮创建的 group',
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
      selectedType !== "bubble" &&
      !isWmGroupNode(selectedNodes[0])
    ) {
      ElMessage({
        message:
          'Constellate 仅支持选中 type 为 "pcm_unit"、"segment"、"bubble"，或 Group 按钮创建的 group',
        type: "warning",
      });
      currentNav.value = "";
      return;
    }
  }

  if (toolType === "Resonance") {
    if (!isWmGroupNode(selectedNodes[0])) {
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
  const lockedTargetNode = reflectTargetNode.value;

  if (toolType === "Reflect" || toolType === "Constellate" || toolType === "Resonance") {
    pendingAiTool.value = toolType;
    applyAiRingTheme(toolType);
    const hintSuccess = await applyHintRingLabels(toolType);
    pendingAiTool.value = "";
    if (!hintSuccess) {
      currentNav.value = "";
      return;
    }
  } else if (konvaRef.value?.setAiRingLabels) {
    applyAiRingTheme("Reflect");
    konvaRef.value.setAiRingLabels();
  }

  const result = konvaRef.value.triggerAiAssist(lockedTargetNode);
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
      if (!canUseGroup.value) {
        return;
      }

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

    if (navItem === "Whisper") {
      if (currentNav.value === navItem && whisperPopupVisible.value) {
        currentNav.value = "";
        closeWhisperPopup();
        return;
      }

      if (!canUseWhisper.value) {
        return;
      }

      const targetNode = selectedCanvasNode.value;
      currentNav.value = navItem;
      if (cropPopupVisible.value) {
        handleCropCancel();
      }
      closeWhisperPopup();
      const opened = openWhisperPopupForNode(targetNode);
      if (!opened) {
        currentNav.value = "";
        return;
      }

      const stage = konvaRef.value?.konvaData?.stage;
      if (stage) {
        stage.container().style.cursor = "default";
        stage.container().removeAttribute("title");
      }
      return;
    }

    if (navItem === "Add Memory") {
      if (currentNav.value === navItem) {
        currentNav.value = "";
        closeWhisperPopup();
        return;
      }

      if (konvaRef.value && konvaRef.value.setTool) {
        konvaRef.value.setTool("select");
      }

      currentNav.value = navItem;
      if (cropPopupVisible.value) {
        handleCropCancel();
      }
      closeWhisperPopup();

      return;
    }

    if (navItem === "Crop") {
      if (currentNav.value === navItem && cropPopupVisible.value) {
        handleCropCancel();
        return;
      }

      if (!canUseCrop.value) {
        return;
      }

      currentNav.value = navItem;
      closeWhisperPopup();
      const opened = openCropPopupForNode(selectedCanvasNode.value);
      if (!opened) {
        currentNav.value = "";
        return;
      }

      const stage = konvaRef.value?.konvaData?.stage;
      if (stage) {
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

const buildGroupAiPayload = (nodeJsonList, groupNode) => {
  const payload = buildResonanceHintPayload(nodeJsonList);
  const screenshot = captureGroupScreenshotForFuse(groupNode);

  if (screenshot) {
    payload.screenshot = screenshot;
  }

  return payload;
};

const buildAiBasePayload = (toolType = "Reflect", nodeJsonList, targetNode) => {
  if (isWmGroupNode(targetNode)) {
    return buildGroupAiPayload(nodeJsonList, targetNode);
  }

  return toolType === "Resonance"
    ? buildResonanceHintPayload(nodeJsonList)
    : buildHintPayload(nodeJsonList);
};

const buildResonanceFuseImageEntries = (fuseData, fallbackScreenshot = "") => {
  const images = Array.isArray(fuseData?.images) ? fuseData.images : [];

  const normalized = images
    .map((item, index) => ({
      index,
      imageSrc: String(item?.image_url || "").trim(),
      text: "",
    }))
    .filter((item) => item.imageSrc);

  if (normalized.length > 0) {
    return normalized;
  }

  if (!fallbackScreenshot) {
    return [];
  }

  return [
    {
      index: 0,
      imageSrc: fallbackScreenshot,
      text: "",
    },
  ];
};

const createResonanceFuseNode = async ({
  fuseData,
  startX,
  startY,
  fallbackScreenshot = "",
}) => {
  const nodeId = String(fuseData?.id || "").trim();
  const nodeType = String(fuseData?.type || "fuse_new").trim();
  const description = String(fuseData?.description || "").trim();
  const imageEntries = buildResonanceFuseImageEntries(fuseData, fallbackScreenshot);

  if (!description && imageEntries.length === 0) {
    throw new Error("Fuse 返回缺少 description 与 images");
  }

  const createdNodes = [];

  let currentY = 0;

  if (description) {
    const descriptionNode = await createTextNode(
      {
        text: description,
        id: nodeId ? `${nodeId}-description` : "",
        customType: `${nodeType}-description`,
      },
      {
        startX,
        startY,
        width: 560,
        fontSize: 15,
        fill: "#1f2937",
        backgroundColor: "#ffffff",
        padding: 14,
        cornerRadius: 14,
      }
    );

    const descriptionRect = descriptionNode.getClientRect({
      skipShadow: true,
      skipStroke: false,
    });
    currentY += Math.max(Number(descriptionRect?.height) || 0, 0) + 18;

    createdNodes.push(descriptionNode);
  }

  if (imageEntries.length === 0) {
    return createdNodes;
  }

  const imageGap = 18;
  const imageNodes = [];

  for (const entry of imageEntries) {
    try {
      const created = await createImageAndTextNodes(
        {
          imageSrc: entry.imageSrc,
          text: entry.text,
          id: nodeId ? `${nodeId}-image-${entry.index}` : "",
          customType: `${nodeType}-image`,
        },
        {
          startX: startX + imageNodes.length * (168 + imageGap),
          startY: startY + currentY,
          mainImageWidth: 168,
          titleGap: 8,
          fontSize: 13,
          center: false,
          group: false,
        }
      );

      const nodes = Array.isArray(created) ? created : [created];
      nodes.forEach((node) => {
        if (!(node instanceof Konva.Node)) return;
        imageNodes.push(node);
      });
    } catch (error) {
      if (!fallbackScreenshot || entry.imageSrc === fallbackScreenshot) {
        throw error;
      }

      const fallbackCreated = await createImageAndTextNodes(
        {
          imageSrc: fallbackScreenshot,
          text: entry.text,
          id: nodeId ? `${nodeId}-image-${entry.index}` : "",
          customType: `${nodeType}-image`,
        },
        {
          startX: startX + imageNodes.length * (168 + imageGap),
          startY: startY + currentY,
          mainImageWidth: 168,
          titleGap: 8,
          fontSize: 13,
          center: false,
          group: false,
        }
      );

      const nodes = Array.isArray(fallbackCreated) ? fallbackCreated : [fallbackCreated];
      nodes.forEach((node) => {
        if (!(node instanceof Konva.Node)) return;
        imageNodes.push(node);
      });
    }
  }

  createdNodes.push(...imageNodes);

  return createdNodes;
};

const runResonanceFuse = async () => {
  if (fuseLoading.value) {
    ElMessage({
      message: "Fuse 仍在生成中，请稍候",
      type: "info",
    });
    return;
  }

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

  if (konvaRef.value?.cancelAiAssist) {
    konvaRef.value.cancelAiAssist();
  }
  closeAiPopup();
  currentNav.value = "";

  const payload = buildAiBasePayload(
    "Resonance",
    reflectSelectedNodes.value,
    groupNode
  );

  fuseLoading.value = true;
  try {
    const res = await ResonanceFuseNew(payload);
    const fuseData = res?.data || {};

    const fallbackScreenshot = String(payload?.screenshot || "").trim();
    const imageEntries = buildResonanceFuseImageEntries(fuseData, fallbackScreenshot);
    const description = String(fuseData?.description || "").trim();

    if (!description && imageEntries.length === 0) {
      ElMessage({
        message: "Fuse 返回为空，无法创建节点",
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

    const createdNode = await createResonanceFuseNode({
      fuseData,
      startX: anchor.stagePos.x,
      startY: anchor.stagePos.y,
      fallbackScreenshot,
    });

    const createdNodes = Array.isArray(createdNode) ? createdNode : [createdNode];

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
      message: "Fuse 已生成多图节点",
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
    fuseLoading.value = false;
  }
};

const handleWhisperCanvasClick = (event) => {
  if (currentNav.value !== "Add Memory") {
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

  whisperPopupData.value = {
    position: {
      x: event.clientX,
      y: event.clientY,
    },
    stagePos,
    toolType: currentNav.value,
    targetNode: null,
  };

  whisperPopupVisible.value = true;
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

const getNodeFrameInWorkingMemory = (targetNode) => {
  // 把 Konva 节点当前的舞台包围盒换算成 WorkingMemory 容器坐标，
  // 供 crop 覆盖层直接贴在原图上方渲染。
  const stage = konvaRef.value?.konvaData?.stage;
  const layer = konvaRef.value?.konvaData?.layer;
  const wmRect = wmContainer.value?.getBoundingClientRect?.();
  if (!stage || !layer || !targetNode || !wmRect) {
    return null;
  }

  const nodeRect = targetNode.getClientRect({
    relativeTo: layer,
    skipShadow: true,
    skipStroke: true,
  });

  if (!Number.isFinite(nodeRect?.width) || !Number.isFinite(nodeRect?.height)) {
    return null;
  }

  const stageRect = stage.container().getBoundingClientRect();
  const transform = stage.getAbsoluteTransform();
  const topLeft = transform.point({ x: nodeRect.x, y: nodeRect.y });
  const bottomRight = transform.point({
    x: nodeRect.x + nodeRect.width,
    y: nodeRect.y + nodeRect.height,
  });

  return {
    x: stageRect.left - wmRect.left + topLeft.x,
    y: stageRect.top - wmRect.top + topLeft.y,
    width: Math.max(bottomRight.x - topLeft.x, 1),
    height: Math.max(bottomRight.y - topLeft.y, 1),
  };
};

const applyCropPopupFrame = (frame) => {
  if (!frame) {
    cropPopupData.value.frame = null;
    return;
  }

  if (!cropPopupData.value.frame) {
    cropPopupData.value.frame = { ...frame };
    return;
  }

  // 只更新 frame 数值，避免整对象替换导致 crop 覆盖层额外重渲染。
  cropPopupData.value.frame.x = frame.x;
  cropPopupData.value.frame.y = frame.y;
  cropPopupData.value.frame.width = frame.width;
  cropPopupData.value.frame.height = frame.height;
};

const scheduleCropPopupFrameUpdate = (frame) => {
  // 画布拖拽/缩放时 stage-transform 触发非常频繁，
  // 这里合并到下一帧统一更新，减少 crop 覆盖层抖动。
  pendingCropFrame = frame;
  if (cropFrameUpdateRaf) {
    return;
  }

  cropFrameUpdateRaf = requestAnimationFrame(() => {
    cropFrameUpdateRaf = 0;
    applyCropPopupFrame(pendingCropFrame);
    pendingCropFrame = null;
  });
};

const resetCropPopupState = () => {
  // 关闭 crop 时顺带清掉未执行的 frame 更新，避免旧帧回写到新状态。
  if (cropFrameUpdateRaf) {
    cancelAnimationFrame(cropFrameUpdateRaf);
    cropFrameUpdateRaf = 0;
  }
  pendingCropFrame = null;
  cropPopupData.value = {
    imageSrc: "",
    targetNode: null,
    frame: null,
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
      message: "当前选中节点不支持 Crop",
      type: "warning",
    });
    return false;
  }

  const img = targetNode.image?.();
  const imageSrc = img?.src || "";
  if (!imageSrc) {
    ElMessage({
      message: "当前节点缺少可裁剪图片",
      type: "warning",
    });
    return false;
  }

  const frame = getNodeFrameInWorkingMemory(targetNode);
  if (!frame) {
    ElMessage({
      message: "Crop 覆盖层定位失败",
      type: "warning",
    });
    return false;
  }

  // Crop 改为直接贴在画布原图上操作，因此打开时要同时带上目标图位置。
  cropPopupData.value = {
    imageSrc,
    targetNode,
    frame: { ...frame },
  };
  cropPopupVisible.value = true;
  return true;
};

const openWhisperPopupForNode = (targetNode) => {
  if (!targetNode || targetNode.getAttr?.("customType") !== "segment") {
    ElMessage({
      message: "当前选中节点不支持 Whisper",
      type: "warning",
    });
    return false;
  }

  const popupAnchor = getPopupPositionRightOfNode(targetNode);
  if (!popupAnchor) {
    ElMessage({
      message: "Whisper 弹窗定位失败",
      type: "warning",
    });
    return false;
  }

  whisperPopupData.value = {
    position: popupAnchor.position,
    stagePos: popupAnchor.stagePos,
    toolType: "Whisper",
    targetNode,
  };
  applyWhisperHighlight(targetNode);
  whisperPopupVisible.value = true;
  whisperPopupRef.value?.prepareForOpen?.({ autoStart: true });
  return true;
};

const handleCropCanvasClick = (event) => {
  if (currentNav.value !== "Crop" || !cropPopupVisible.value) {
    return;
  }
};

const handleCanvasMouseMove = (event) => {
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
  stage.container().style.cursor = "default";
  stage.container().removeAttribute("title");
};

const handleCanvasClick = (event) => {
  handleWhisperCanvasClick(event);
  handleCropCanvasClick(event);
};

const closeWhisperPopup = () => {
  clearWhisperHighlight();
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
      "operation_logs": consumeOperationLogs(),
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
    resetCropPopupState();

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
  resetCropPopupState();

  const stage = konvaRef.value?.konvaData?.stage;
  if (stage) {
    stage.container().style.cursor = "default";
    stage.container().removeAttribute("title");
  }

  if (currentNav.value === "Crop") {
    currentNav.value = "";
  }
};

const handleCropStagePanBy = (payload) => {
  // Crop 覆盖层内部的中键拖拽，最终仍复用 Konva 的舞台平移逻辑。
  const dx = Number(payload?.dx) || 0;
  const dy = Number(payload?.dy) || 0;
  if (!dx && !dy) {
    return;
  }

  konvaRef.value?.panStageBy?.({ dx, dy });
};

const handleCropStageWheel = (payload) => {
  // Crop 覆盖层内部的滚轮缩放/滚动，同样转发给 Konva 统一处理。
  if (!payload) {
    return;
  }

  konvaRef.value?.applyStageWheelInteraction?.(payload);
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
        "operation_logs" : consumeOperationLogs(),
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

      // Whisper 成功后把用户输入原文同步写到新泡泡上方。
      const count = await konvaRef.value.addBubblesAroundTarget(targetNode, bubbles, {
        topText: content,
      });
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
  // data.position 来自 konvaComponent 发出的 screenPos，含义是“AI 连线终点在视口中的位置”。
  // AiQuestionPopup 自身是 fixed 定位，因此传给弹窗的 position 必须继续保持为视口坐标；
  // 如果这里提前转成容器内坐标，子组件再按 fixed 去摆放时就会出现整体偏下/偏上的错位。
  // 同时我们还要额外记录一份 stage 坐标，用于后续 stage 缩放、平移后重新推回最新的视口坐标。

  // 假设 konvaComponent 暴露了 konvaData.stage
  const stage = konvaRef.value?.konvaData?.stage;
  let relativeX = 0;
  let relativeY = 0;

  if (stage) {
    const stageRect = stage.container().getBoundingClientRect();
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    // transform.point 需要吃的是“stage 容器本地坐标”，不是整个页面的 client 坐标。
    // 所以这里先减掉 stage 容器左上角在视口中的偏移，再通过逆变换把点反算回 stage 坐标。
    // 这样保存下来的 relativePos 才会和当前 stage 的缩放、平移状态解耦。
    const stagePos = transform.point({
      x: data.position.x - stageRect.left,
      y: data.position.y - stageRect.top,
    });
    relativeX = stagePos.x;
    relativeY = stagePos.y;
  }

  aiPopupData.value = {
    label: data.label,
    toolType: `${currentNav.value || "Reflect"}`, // 动态设置标题
    lineLength: data.lineLength,
    position: {
      // 直接保留视口坐标，供 fixed 弹窗立即定位。
      x: data.position.x,
      y: data.position.y,
    },
    items: [],
    title: "",
    loading: true, // 开始加载
    // 保存同一个锚点在 stage 坐标系中的位置。
    // handleStageTransform 会用这份数据在画布变换后重新计算屏幕位置，
    // 避免弹窗停留在旧屏幕坐标上，看起来像“没有跟着线头走”。
    relativePos: { x: relativeX, y: relativeY },
    reflectTargetType: reflectTargetType.value || "",
    reflectTargetId: reflectTargetNode.value?.id?.() || "",
    reflectRequestData: null,
  };

  // 弹窗侧缓存 Reflect 目标节点，供 QuickTools 在退出圆环后继续使用。
  reflectPopupTargetNode.value = reflectTargetNode.value || null;
  aiPopupVisible.value = true;

  const hintBasePayload = buildAiBasePayload(
    currentNav.value,
    reflectSelectedNodes.value,
    reflectTargetNode.value
  );
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

  await fetchAiPopupSuggestions(currentNav.value, requestData);
};

const fetchAiPopupSuggestions = async (toolType, requestData) => {
  if (!requestData) {
    return;
  }

  aiPopupData.value.loading = true;

  try {
    let res;
    if (toolType === "Constellate") {
      res = await ConstellateSuggest(requestData);
      const payload = res?.data || {};
      aiPopupData.value.items = Array.isArray(payload?.images) ? payload.images : [];
      aiPopupData.value.title = String(payload?.title || "").trim();
    } else if (toolType === "Resonance") {
      res = await ResonanceAnalysis(requestData);
      const resonanceList = Array.isArray(res?.data?.analysis)
        ? res.data.analysis
        : [];

      aiPopupData.value.items = resonanceList;
      aiPopupData.value.title = "";
    } else {
      res = await ReflectQuestions(requestData);
      const questionList =
        (Array.isArray(res?.data) && res.data) ||
        (Array.isArray(res?.data?.data) && res.data.data) ||
        (Array.isArray(res?.data?.questionList) && res.data.questionList) ||
        [];
      aiPopupData.value.items = questionList;
      aiPopupData.value.title = "";
    }
  } catch (error) {
    console.error(`Failed to fetch ${toolType} tool data:`, error);
    ElMessage.error("获取AI建议失败");
  } finally {
    aiPopupData.value.loading = false;
  }
};

const handleAiPopupRegenerate = async () => {
  const toolType = aiPopupData.value?.toolType || currentNav.value;
  const requestData = aiPopupData.value?.reflectRequestData;
  await fetchAiPopupSuggestions(toolType, requestData);
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

const collectConfirmedIds = (input) => {
  if (!Array.isArray(input)) {
    return [];
  }

  return Array.from(
    new Set(
      input
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => value.length > 0)
    )
  );
};

const extractImageId = (item) => {
  if (!item || typeof item !== "object") {
    return "";
  }

  const raw =
    item.image_id ||
    item.imageID ||
    item.imageId ||
    item.id ||
    item?.raw?.image_id ||
    item?.raw?.id ||
    "";

  return typeof raw === "string" ? raw.trim() : "";
};

const submitFeedbackConfirm = async (candidateIds) => {
  const confirmedIds = collectConfirmedIds(candidateIds);
  if (!confirmedIds.length) {
    return;
  }

  try {
    await feedbackConfirm({
      confirmed_ids: confirmedIds,
    });
  } catch (error) {
    console.error("feedbackConfirm failed:", error);
  }
};

const resolveConstellateConfirmedIds = (data) => {
  const selectedImageIds = Array.isArray(data?.selectedItems)
    ? data.selectedItems.map((item) => extractImageId(item))
    : [];

  return collectConfirmedIds(selectedImageIds);
};

const resolveResonanceConfirmedIds = (data) => {
  const resonanceItems = Array.isArray(data?.selectedItems) ? data.selectedItems : [];
  return collectConfirmedIds(resonanceItems.map((item) => item?.id));
};

const resolveReflectConfirmedIds = (data) => {
  const reflectItems = Array.isArray(data?.selectedItems) ? data.selectedItems : [];
  return collectConfirmedIds(reflectItems.map((item) => item?.id));
};

const buildReflectConfirmPayload = (item) => {
  if (!item || typeof item !== "object") {
    return null;
  }

  return {
    toolType: aiPopupData.value?.toolType || "Reflect",
    label: aiPopupData.value?.label || String(item.text || "").trim(),
    title: "",
    selectedItems: [item],
  };
};

const commitAiPopupSelection = async (
  data,
  {
    preserveReflectContext = false,
    clearCurrentNav = true,
    cancelAiAssist = true,
  } = {}
) => {
  const selectedItems = Array.isArray(data?.selectedItems) ? data.selectedItems.filter(Boolean) : [];
  const toolType = data?.toolType || aiPopupData.value?.toolType;

  if (selectedItems.length === 0) {
    ElMessage({
      message:
        toolType === "Resonance"
          ? "请至少选择一条分析结果后再确认"
          : "请先选择至少一项内容后再确认",
      type: "warning",
    });
    return false;
  }

  if (toolType === "Resonance") {
    await submitFeedbackConfirm(resolveResonanceConfirmedIds(data));
  } else if (toolType === "Constellate") {
    await submitFeedbackConfirm(resolveConstellateConfirmedIds(data));
  } else if (toolType === "Reflect") {
    await submitFeedbackConfirm(resolveReflectConfirmedIds(data));
  }

  const drawResult = drawAiPopupSelectionToCanvas(
    {
      toolType,
      title: String(data?.title || "").trim(),
      selectedItems,
      preserveAiAssist: !cancelAiAssist,
    },
    konvaRef.value
  );

  if (!drawResult?.success) {
    ElMessage({
      message: drawResult?.message || "AI 内容绘制失败",
      type: "warning",
    });
    return false;
  }

  if (cancelAiAssist && konvaRef.value?.cancelAiAssist) {
    konvaRef.value.cancelAiAssist();
  }

  // 确认后若保留 AI 环，需要把“点击后锁定”的交互态解开；
  // 否则环虽然还在，但 hover 不会继续更新引导线。
  if (!cancelAiAssist && konvaRef.value?.unlockAiAssistInteraction) {
    konvaRef.value.unlockAiAssistInteraction();
  }

  closeAiPopup({ preserveReflectContext });
  if (clearCurrentNav) {
    currentNav.value = "";
  }
  return true;
};

const handleAiPopupConfirm = async (data) => {
  // 普通确认后只关闭弹窗，保留当前 AI 环与工具态，
  // 这样用户可以继续沿用同一组 ring/selection 继续操作。
  await commitAiPopupSelection(data, {
    preserveReflectContext: true,
    clearCurrentNav: false,
    cancelAiAssist: false,
  });
};

const handleAiPopupToolClick = async ({ tool, item }) => {
  if (!tool) return;

  const inReflectPopup = aiPopupData.value?.toolType === "Reflect";
  if (inReflectPopup) {
    const reflectConfirmPayload =
      tool === "Crop" || tool === "Add Memory" || tool === "Whisper"
        ? buildReflectConfirmPayload(item)
        : null;
    const popupNode = reflectPopupTargetNode.value || reflectTargetNode.value;
    let shouldCommitReflectSelection = false;

    if (tool === "Crop" || tool === "Add Memory" || tool === "Whisper") {
      if (!reflectConfirmPayload) {
        ElMessage({
          message: "请先选择一条 Reflect 建议",
          type: "warning",
        });
        return;
      }
    }

    if (tool === "Crop") {
      const node = popupNode;
      // exitReflectMode();
      openCropPopupForNode(node);
      shouldCommitReflectSelection = true;
    } else if (tool === "Whisper") {
      const node = popupNode;
      // exitReflectMode();
      openWhisperPopupForNode(node);
      shouldCommitReflectSelection = true;
    } else if (tool === "Add Memory") {
      // exitReflectMode();
      handleNavClick(tool);
      shouldCommitReflectSelection = true;
    }

    if (shouldCommitReflectSelection) {
      await commitAiPopupSelection(reflectConfirmPayload, {
        preserveReflectContext: true,
        clearCurrentNav: false,
        cancelAiAssist: false,
      });
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
  // 关闭弹窗并清除当前引导线，保持 AI 模式可继续在环上画线
  if (konvaRef.value && konvaRef.value.clearAiGuideLine) {
    konvaRef.value.clearAiGuideLine();
  }
  closeAiPopup({ preserveReflectContext: true });
};

// 点击画布其他地方关闭弹窗 (需要在 KonvaComponent 中透传或全局监听，这里简化处理)
// 实际可以给 AiQuestionPopup 添加 click-outside 指令或遮罩层
const closeAiPopup = ({ preserveReflectContext = false } = {}) => {
  aiPopupVisible.value = false;
  if (!preserveReflectContext) {
    reflectTargetNode.value = null;
    reflectTargetType.value = "";
    reflectPopupTargetNode.value = null;
    aiPopupData.value.reflectTargetType = "";
    aiPopupData.value.reflectTargetId = "";
  }
  aiPopupData.value.reflectRequestData = null;
  aiPopupData.value.items = [];
  aiPopupData.value.title = "";
};

// 复用：把 stage 坐标重新映射成当前视口坐标，供 fixed 定位弹窗直接使用。
// 这个函数和 handleAiRingClick 里的反算逻辑互为逆过程：
// 1. 点击时把视口坐标反算成 stage 坐标保存下来；
// 2. stage 发生缩放/平移时，再把保存的 stage 坐标推回新的视口坐标。
const getPopupPositionFromStagePos = (stagePos) => {
  const stage = konvaRef.value?.konvaData?.stage;
  if (!stage || !stagePos) {
    return null;
  }

  const stageRect = stage.container().getBoundingClientRect();
  const transform = stage.getAbsoluteTransform();
  const localPos = transform.point(stagePos);

  return {
    // transform.point 的结果仍然是 stage 容器内部坐标，
    // 这里再叠加 stage 容器本身在视口中的偏移，最终得到浏览器视口坐标。
    // AiQuestionPopup 是 fixed 定位，因此必须返回这一套坐标。
    x: stageRect.left + localPos.x,
    y: stageRect.top + localPos.y,
  };
};

const handleStageTransform = () => {
  if (aiPopupVisible.value) {
    // AI 弹窗打开后如果画布继续缩放/平移，
    // 需要用之前缓存的 stage 锚点重新计算一次屏幕位置，
    // 这样弹窗才能持续贴着 AI 连线的终点。
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

  if (cropPopupVisible.value && cropPopupData.value.targetNode) {
    // Crop 覆盖层跟随目标主图位置同步，但更新节流到 rAF，避免视觉闪烁。
    const frame = getNodeFrameInWorkingMemory(cropPopupData.value.targetNode);
    if (frame) {
      scheduleCropPopupFrameUpdate(frame);
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

// 给父组件使用：导出当前工作画布截图（dataURL）。
const exportCurrentCanvasScreenshot = () => {
  if (!konvaRef.value?.exportCanvas) {
    return "";
  }
  return String(konvaRef.value.exportCanvas() || "");
};

defineExpose({
  exportCurrentCanvasScreenshot,
});
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
  display: flex;
  flex-direction: column;
  gap: 8px;

  .send-menu-item {
    padding: 8px 10px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    color: #1677ff;
    background: #e6f4ff;
    border: 1px solid #91caff;
    text-align: center;
    transition: all 0.2s;
    border-radius: 999px;

    &:hover {
      background: #d0e9ff;
      border-color: #69b1ff;
      color: #0958d9;
    }

    &:active {
      background: #bae0ff;
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

  .nav-tooltip-trigger {
    display: inline-flex;
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

:deep(.wm-nav-tooltip) {
  max-width: 260px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(17, 24, 39, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.24);
}

:deep(.wm-nav-tooltip .nav-tooltip-content) {
  white-space: pre-line;
  line-height: 1.45;
  color: #f8fafc;
}

:deep(.wm-nav-tooltip .el-popper__arrow::before) {
  background: rgba(17, 24, 39, 0.96);
  border-color: rgba(148, 163, 184, 0.2);
}

.top-right-actions {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;
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
