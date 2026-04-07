<template>
  <div class="drawing-board">
    <div class="toolbar-fixed">
      <button
        :class="['tool-btn', { active: currentTool === 'select' }]"
        @click="setTool('select')"
        title="编辑画布"
      >
        <el-icon><Edit /></el-icon>
      </button>
      <button
        :class="['tool-btn', { active: currentTool === 'pan' }]"
        @click="setTool('pan')"
        title="移动整个视图"
      >
        <el-icon><Pointer /></el-icon>
      </button>
      <!-- <button class="tool-btn" @click="resetView">
                重置视图
                </button> -->
      <button
        :class="['tool-btn', { active: currentTool === 'text' }]"
        @click="setTool('text')"
      >
        Text
      </button>
    </div>
    <div class="toolbar">
      <div class="tool-group">
        <!-- <button :class="['tool-btn', { active: currentTool === 'select' }]" @click="setTool('select')" title="编辑画布">
                    编辑画布
                </button>
                <button :class="['tool-btn', { active: currentTool === 'pan' }]" @click="setTool('pan')" title="移动整个视图">
                    移动视图
                </button>
                <button class="tool-btn" @click="resetView">
                    重置视图
                </button> -->
        <!-- <button :class="['tool-btn', { active: currentTool === 'brush' }]" @click="setTool('brush')">
                    画笔
                </button>
                <button :class="['tool-btn', { active: currentTool === 'eraser' }]" @click="setTool('eraser')">
                    橡皮擦
                </button>
                <button :class="['tool-btn', { active: currentTool === 'text' }]" @click="setTool('text')">
                    文字
                </button>
                <button :class="['tool-btn', { active: currentTool === 'image' }]" @click="triggerImageUpload">
                    图片
                </button>
                
                <input
                    ref="imageInput"
                    type="file"
                    accept="image/*"
                    style="display: none"
                    @change="handleImageUpload"
                /> -->
      </div>
      <!-- <div class="tool-group">
                <label class="color-label">
                    颜色:
                    <input type="color" v-model="brushColor" />
                </label>
                <label class="size-label">
                    粗细:
                    <input type="range" v-model="lineWidth" min="1" max="50" />
                    <span>{{ lineWidth }}</span>
                </label>
                <label class="size-label">
                    字号:
                    <input type="range" v-model="fontSize" min="12" max="72" />
                    <span>{{ fontSize }}</span>
                </label>
            </div>
            <div class="tool-group">
                <span class="zoom-label">缩放:</span>
                <span class="zoom-level">{{ Math.round(scale * 100) }}%</span>
            </div>
            <div class="tool-group">
                <button class="delete-btn" @click="deleteSelectedNodes" :disabled="selectedNodes.length === 0">
                    删除
                </button>
                <button class="reset-btn" @click="resetView">
                    重置视图
                </button>
                <button class="export-btn" @click="exportCanvas">
                    导出
                </button>
                <button class="export-info-btn" @click="exportElementInfo">
                    导出元素信息
                </button>

                <button class="send-nodes-btn" @click="sendSelectedNodesToParent">
                    将选中的节点发送给父元素
                </button>
                <button class="get-selected-btn" @click="getSelectedNodes">
                    获取选中节点
                </button>
                <button class="clear-btn" @click="clearCanvas">清除画布</button>
            </div> -->
    </div>
    <div
      style="width: 100%; min-height: 200px; height: 100%; position: relative"
    >
      <div
        ref="container"
        :class="['canvas-container', { panning: currentTool === 'pan' }]"
        style="width: 100%; height: 100%"
        @dragover="handleDragOver"
        @drop="handleDrop"
      ></div>

      <!-- 自定义滚动条 -->
      <div class="scrollbar-h" v-show="scrollbars.h.visible">
        <div
          class="scrollbar-thumb-h"
          :style="{
            width: scrollbars.h.thumbWidth + 'px',
            transform: `translateX(${scrollbars.h.thumbPos}px)`,
          }"
          @mousedown.stop="handleScrollbarDragStart('h', $event)"
        ></div>
      </div>

      <div class="scrollbar-v" v-show="scrollbars.v.visible">
        <div
          class="scrollbar-thumb-v"
          :style="{
            height: scrollbars.v.thumbHeight + 'px',
            transform: `translateY(${scrollbars.v.thumbPos}px)`,
          }"
          @mousedown.stop="handleScrollbarDragStart('v', $event)"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
// 导入 Vue 的响应式 API 和生命周期钩子
import { ref, reactive, onMounted, onUnmounted } from "vue";
import Konva from "konva";
import { Edit, Pointer } from "@element-plus/icons-vue";
import {
  getAiGuidePlacementRectFromLinePoints,
} from "@/utils/aiPopupCanvasRenderer";
import {
  createImageAndTextNodes,
  createTextNode,
  createInterpretationTextNodes,
  DEFAULT_FONT_FAMILY,
} from "@/utils/canvasPositionUtils";
import {
  initMainImages,
  initSegmentsImages,
  initSegmentImagesItem,
  initPCMBubbles,
  bindSegmentGroupFrameSync,
} from "@/utils/initPCM";

const emit = defineEmits([
  "sendSelectedNodes",
  "ai-ring-click",
  "ai-mode-change",
  "stage-transform",
]);

const props = withDefaults(
  defineProps<{
    enableMouseWheelScroll?: boolean;
  }>(),
  {
    enableMouseWheelScroll: true,
  }
);

// DOM 元素引用
const container = ref<HTMLDivElement>(); // 画布容器
const imageInput = ref<HTMLInputElement>(); // 图片上传输入框

// Konva 核心对象
let stage: Konva.Stage | null = null; // 舞台对象，最顶层的容器
let layer: Konva.Layer | null = null; // 图层对象，用于放置图形
let transformer: Konva.Transformer | null = null; // 变换器，用于选中、缩放、旋转图形
let selectionBox: Konva.Rect | null = null; // 选择框，用于框选多个图形
let resizeObserver: ResizeObserver | null = null; // 容器大小变化监听器

// 状态变量
let selectedNodes: Konva.Node[] = []; // 当前选中的节点列表
let clipboardNodes: Konva.Node[] = []; // 复制缓存的节点快照
let clipboardSelectionTopLeft = { x: 0, y: 0 }; // 复制时记录整组选区左上角，供粘贴偏移基准使用
let lastPasteOffset = { x: 24, y: 24 }; // 无鼠标位置时的递增偏移
// Ctrl+C 时不直接保存“绝对几何”，而是保存相对当前 layer 的局部几何。
// 这样 Ctrl+V 时不会把整张画布(stage)的缩放再次算进节点自身大小里。
const CLIPBOARD_LAYER_POS_ATTR = "__clipboardLayerPosition";
const CLIPBOARD_LAYER_SCALE_ATTR = "__clipboardLayerScale";
const CLIPBOARD_LAYER_ROTATION_ATTR = "__clipboardLayerRotation";
// 对 detached clipboard clone 来说，getClientRect 无法稳定反推原始选区左上角，
// 所以复制时把它额外缓存下来，粘贴时直接复用这份基准坐标。
const CLIPBOARD_TOP_LEFT_ATTR = "__clipboardTopLeft";
let isCurrentCanvasLastClicked = false; // 防误删：仅当最后一次点击在当前 canvas 内才允许删除
// Alt+拖拽时，记录当前由“副本”接管拖拽的临时状态，避免一次拖拽重复触发复制。
let altDragDuplicateState: {
  draggedClone: Konva.Node;
} | null = null;

// 历史栈（Undo/Redo）
// - historyPast: 已提交快照栈，栈顶是当前状态
// - historyFuture: 撤回后可前进的快照栈
// - isApplyingHistory: 正在回放历史时，禁止再次录入历史，避免递归
type HistorySnapshot = Konva.Node[];
const HISTORY_MAX_COUNT = 60;
let historyPast: HistorySnapshot[] = [];
let historyFuture: HistorySnapshot[] = [];
let isApplyingHistory = false;
let historyCaptureTimer: ReturnType<typeof setTimeout> | null = null;
let lastHistorySignature = "";
let isDrawing = ref(false); // 是否正在绘制
let isSelecting = ref(false); // 是否正在框选
let isPanning = ref(false); // 是否正在平移
let selectionStartPos = { x: 0, y: 0 }; // 框选起始位置
let panStartPos = { x: 0, y: 0 }; // 平移起始位置
let lastLine: Konva.Line | null = null; // 当前正在绘制的线条

// AI 辅助功能状态变量
let aiRingSlices: Konva.Group[] = []; // 存储环形分区的四个扇形（包含文字）
let aiRightClockLabels: Konva.Text[] = []; // 存储 3 点钟方向固定提示文案
let aiGuideLine: Konva.Line | null = null; // 存储中心到鼠标的引导线
let aiGuideEndCircle: Konva.Circle | null = null; // 引导线最外端圆点
let aiAssistState: {
  centerX: number;
  centerY: number;
  innerRadius: number;
  outerRadius: number;
  target?: Konva.Node; // 关联的节点
  isLocked?: boolean; // 是否锁定交互（点击后）
} | null = null; // 存储 AI 辅助环的几何状态信息

// AI ring 配置
// defaultAiRingLabels: 兜底标签，Hint 接口失败或返回空时回退到这组默认值。
// aiRingLabels: 当前真正用于绘制环形扇区的标签数组，支持在运行时动态替换。
type AiRingThemeMode = "Reflect" | "Constellate" | "Resonance";
type AiRingThemeConfig = {
  bandCount: number;
  fills: string[];
  activeFills: string[];
  rightLabels: string[];
};

const defaultAiRingLabels = ["灵性的感受", "情绪的流动", "思想的火花", "记忆的碎片"];
const AI_RING_BAND_STROKE = "rgba(255, 255, 255, 0.45)";
const AI_RIGHT_DEFAULT_COLOR = "rgba(110, 114, 122, 0.95)";
const AI_GUIDE_START_COLOR = "#3FA7FF";
const AI_GUIDE_END_COLOR = "#FF4D4F";
const AI_RIGHT_INNER_DARK = "#6E727A";
const AI_RIGHT_INNER_LIGHT = "#BFC5CF";
const AI_RIGHT_OUTER_LIGHT = "#AAB3C1";
const AI_RIGHT_OUTER_DARK = "#4E5A6B";

const AI_RING_THEME_CONFIG: Record<AiRingThemeMode, AiRingThemeConfig> = {
  Reflect: {
    bandCount: 5,
    // rightLabels: ["反思细节", "反思转化"],
    rightLabels: ["cue", "transformation"],
    fills: [
      "rgb(216 235 255)",
      "rgb(220 237 255)",
      "rgb(227 240 255)",
      "rgb(237 246 255)",
      "rgb(245 250 255)",
    ],
    activeFills: [
      "rgb(196 223 250)",
      "rgb(203 228 252)",
      "rgb(214 235 252)",
      "rgb(228 241 252)",
      "rgb(238 247 252)",
    ],
  },
  Constellate: {
    bandCount: 4,
    // rightLabels: ["直接检索", "远距离启发"],
    rightLabels: ["Cue Match", "Remote Leap"],
    fills: [
      "rgb(255 233 211)",
      "rgb(255 239 220)",
      "rgb(255 243 230)",
      "rgb(255 249 243)",
    ],
    activeFills: [
      "rgb(250 222 196)",
      "rgb(252 230 208)",
      "rgb(252 237 221)",
      "rgb(252 245 236)",
    ],
  },
  Resonance: {
    bandCount: 4,
    // rightLabels: ["共振追问", "意象扩展"],
    rightLabels: ["Grounded", "Emergent"],
    fills: [
      "rgb(255 217 220)",
      "rgb(255 227 228)",
      "rgb(255 237 237)",
      "rgb(255 245 245)",
    ],
    activeFills: [
      "rgb(250 205 209)",
      "rgb(252 218 220)",
      "rgb(252 229 230)",
      "rgb(252 240 240)",
    ],
  },
};

// AI ring 运行时状态
let aiRingLabels = [...defaultAiRingLabels];
let currentAiRingThemeMode: AiRingThemeMode = "Reflect";

const getCurrentAiRingTheme = () => {
  return AI_RING_THEME_CONFIG[currentAiRingThemeMode] || AI_RING_THEME_CONFIG.Reflect;
};

const getDefaultAiRightLabels = (mode: AiRingThemeMode = currentAiRingThemeMode) => {
  const theme = AI_RING_THEME_CONFIG[mode] || AI_RING_THEME_CONFIG.Reflect;
  return Array.isArray(theme?.rightLabels) && theme.rightLabels.length >= 2
    ? theme.rightLabels.slice(0, 2)
    : AI_RING_THEME_CONFIG.Reflect.rightLabels.slice(0, 2);
};

let aiRightLabels = getDefaultAiRightLabels();

// AI ring 纯计算函数
// 统一计算环形几何参数，避免多处重复计算导致规则不一致。
// 返回值说明：
// - sliceCount: 扇区数量（与标签数量一致，最少为 1）
// - perSliceRadian: 每个扇区在弧度制下的角宽
// - sliceAngle: 每个扇区在角度制下的角宽（用于 Konva.Arc）
// - rotationOffset: 扇区旋转偏移，让分割线与视觉中心对齐
// - startOffset: 索引命中时的角度偏移（与绘制偏移保持一致）
const getAiRingGeometry = () => {
  const sliceCount = aiRingLabels.length || 1;
  const perSliceRadian = (Math.PI * 2) / sliceCount;
  const sliceAngle = 360 / sliceCount;
  const rotationOffset = sliceAngle / 2;
  const startOffset = perSliceRadian / 2;

  return {
    sliceCount,
    perSliceRadian,
    sliceAngle,
    rotationOffset,
    startOffset,
  };
};

// 根据“点相对圆心向量 (dx, dy)”计算当前落在哪个扇区。
// 这个函数用于：
// 1) 鼠标悬停时高亮扇区。
// 2) 点击时确定触发哪个标签。
// 采用统一几何参数，确保“看见的扇区”和“命中的扇区”完全一致。
// 最后的取模归一化用于防止边界角度导致的负索引或越界。
const getAiRingSliceIndex = (dx: number, dy: number) => {
  const { sliceCount, perSliceRadian, startOffset } = getAiRingGeometry();
  const normalized =
    (Math.atan2(dy, dx) + Math.PI * 2 - startOffset) % (Math.PI * 2);
  const rawIndex = Math.floor(normalized / perSliceRadian);
  return ((rawIndex % sliceCount) + sliceCount) % sliceCount;
};

const mixHexColor = (startHex: string, endHex: string, t: number) => {
  const clampT = Math.max(0, Math.min(1, t));
  const s = startHex.replace("#", "");
  const e = endHex.replace("#", "");
  const sr = parseInt(s.slice(0, 2), 16);
  const sg = parseInt(s.slice(2, 4), 16);
  const sb = parseInt(s.slice(4, 6), 16);
  const er = parseInt(e.slice(0, 2), 16);
  const eg = parseInt(e.slice(2, 4), 16);
  const eb = parseInt(e.slice(4, 6), 16);

  const r = Math.round(sr + (er - sr) * clampT);
  const g = Math.round(sg + (eg - sg) * clampT);
  const b = Math.round(sb + (eb - sb) * clampT);

  return `rgb(${r}, ${g}, ${b})`;
};

// AI ring 视图同步函数
const updateAiRightClockLabelsPosition = () => {
  if (!aiAssistState || aiRightClockLabels.length < 2) return;

  const angle = Math.PI / 6; // 4 点钟方向（相对 3 点钟顺时针 30°）
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const edgeGap = 2;
  const innerR = aiAssistState.innerRadius + edgeGap;
  const outerR = aiAssistState.outerRadius;

  const innerX = aiAssistState.centerX + innerR * cosA;
  const innerY = aiAssistState.centerY + innerR * sinA;

  // 第二个标签要求与第一个标签同 y，且 x 起始点贴外环线：
  // 在 y = innerY 的水平线上，求与外圆右侧边界交点 x。
  const dyFromCenter = innerY - aiAssistState.centerY;
  const safeSquare = Math.max(0, outerR * outerR - dyFromCenter * dyFromCenter);
  const outerRingXOnSameY = aiAssistState.centerX + Math.sqrt(safeSquare);
  const outerX = outerRingXOnSameY + edgeGap;
  const outerY = innerY;

  aiRightClockLabels[0].position({ x: innerX, y: innerY });
  aiRightClockLabels[1].position({ x: outerX, y: outerY });
};

const resetAiRightClockLabelsDefaultColor = () => {
  if (aiRightClockLabels.length < 2) return;
  aiRightClockLabels[0].fill(AI_RIGHT_DEFAULT_COLOR);
  aiRightClockLabels[1].fill(AI_RIGHT_DEFAULT_COLOR);
};

const syncAiRightClockLabelText = () => {
  if (aiRightClockLabels.length < 2) return;

  aiRightClockLabels.forEach((labelNode, index) => {
    labelNode.text(aiRightLabels[index] || "");
    labelNode.offset({ x: 0, y: labelNode.height() / 2 });
  });

  updateAiRightClockLabelsPosition();
  resetAiRightClockLabelsDefaultColor();
};

// 仅补偿文字可读性：当画布缩小时放大标签，避免环上文案太小看不清。
const updateAiAssistLabelScale = () => {
  if (!stage || !aiAssistState) return;

  const currentScale = Math.max(stage.scaleX(), 0.001);
  const compensate = 1 / currentScale;

  // 环内标签最多放大到 2.4 倍，避免遮挡过多扇区。
  const ringLabelScale = Math.max(1, Math.min(2.4, compensate));
  aiRingSlices.forEach((group) => {
    const labelGroup = group.findOne(".labelGroup") as Konva.Group;
    if (labelGroup) {
      labelGroup.scale({ x: ringLabelScale, y: ringLabelScale });
    }
  });

  // 右侧两段标签同步补偿，略小于环内标签，避免拥挤。
  const rightLabelScale = Math.max(1, Math.min(2.1, compensate));
  aiRightClockLabels.forEach((label) => {
    label.scale({ x: rightLabelScale, y: rightLabelScale });
  });

  updateAiRightClockLabelsPosition();
};

// 根据“引导线长度 - 内环半径”动态调节右侧两个标签颜色：
// 线越长（越靠外），外侧标签颜色越深，内侧标签颜色越浅。
const updateAiRightClockLabelsColorByGuideLength = (distanceFromCenter: number) => {
  if (!aiAssistState || aiRightClockLabels.length < 2) return;

  const guideLength = Math.max(0, distanceFromCenter - aiAssistState.innerRadius);
  const ringSpan = Math.max(1, aiAssistState.outerRadius - aiAssistState.innerRadius);
  const t = Math.max(0, Math.min(1, guideLength / ringSpan));

  const innerColor = mixHexColor(AI_RIGHT_INNER_DARK, AI_RIGHT_INNER_LIGHT, t);
  const outerColor = mixHexColor(AI_RIGHT_OUTER_LIGHT, AI_RIGHT_OUTER_DARK, t);

  aiRightClockLabels[0].fill(innerColor);
  aiRightClockLabels[1].fill(outerColor);
};

// 供外部（如 WorkingMemory）设置环形标签。
// 规则：
// 1) 传空或非数组 -> 恢复默认标签。
// 2) 传入后会做 trim + 过滤空字符串，避免出现空文案扇区。
// 3) 过滤后若为空，仍回退到默认标签，保证至少有 1 个扇区。
const setAiRingLabels = (labels?: string[]) => {
  if (!Array.isArray(labels) || labels.length === 0) {
    aiRingLabels = [...defaultAiRingLabels];
    return;
  }

  const normalized = labels.map((item) => String(item || "").trim()).filter(Boolean);
  aiRingLabels = normalized.length > 0 ? normalized : [...defaultAiRingLabels];
};

const setAiRingThemeMode = (mode?: string) => {
  if (mode === "Constellate" || mode === "Resonance" || mode === "Reflect") {
    currentAiRingThemeMode = mode;
  } else {
    currentAiRingThemeMode = "Reflect";
  }

  aiRightLabels = getDefaultAiRightLabels(currentAiRingThemeMode);
  syncAiRightClockLabelText();
};

// 引导线渐变：起点（圆心）蓝色，朝向外环最外侧逐步过渡到红色。
// 这样当鼠标位置越靠外，线段末端会显示更多偏红色的部分。
const updateAiGuideLineGradient = (
  line: Konva.Line,
  endPos: { x: number; y: number }
) => {
  if (!aiAssistState) return;

  const startX = aiAssistState.centerX;
  const startY = aiAssistState.centerY;
  const dx = endPos.x - startX;
  const dy = endPos.y - startY;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length <= 0) {
    line.stroke(AI_GUIDE_START_COLOR);
    return AI_GUIDE_START_COLOR;
  }

  const unitX = dx / length;
  const unitY = dy / length;
  const gradientEndX = startX + unitX * aiAssistState.outerRadius;
  const gradientEndY = startY + unitY * aiAssistState.outerRadius;
  const endColorRatio = Math.max(0, Math.min(1, length / aiAssistState.outerRadius));
  const endColor = mixHexColor(
    AI_GUIDE_START_COLOR,
    AI_GUIDE_END_COLOR,
    endColorRatio
  );

  line.setAttrs({
    stroke: AI_GUIDE_START_COLOR,
    strokeLinearGradientStartPoint: { x: startX, y: startY },
    strokeLinearGradientEndPoint: { x: gradientEndX, y: gradientEndY },
    strokeLinearGradientColorStops: [0, AI_GUIDE_START_COLOR, 1, AI_GUIDE_END_COLOR],
  });

  return endColor;
};

// 工具和配置选项
const currentTool = ref<
  "select" | "brush" | "eraser" | "text" | "image" | "pan"
>("select"); // 当前工具类型
const brushColor = ref("#000000"); // 画笔颜色
const lineWidth = ref(5); // 线条粗细
const fontSize = ref(14); // 文字大小
const scale = ref(1); // 当前缩放比例
const minScale = 0.2; // 最小缩放比例
const maxScale = 1.5; // 最大缩放比例

const konvaData = reactive({
  stage: null,
  layer: null,
});

// 滚动条状态
const scrollbars = reactive({
  h: {
    visible: false,
    thumbWidth: 0,
    thumbPos: 0,
    trackSize: 0,
    contentSize: 0,
    viewSize: 0,
  },
  v: {
    visible: false,
    thumbHeight: 0,
    thumbPos: 0,
    trackSize: 0,
    contentSize: 0,
    viewSize: 0,
  },
});

// 更新滚动条状态
const updateScrollbars = () => {
  if (!stage || !layer) return;
  // 强制重新计算布局
  layer.batchDraw();

  const padding = 301; // 滚动条边缘留白
  const box = layer.getClientRect({ skipTransform: true });

  // 应用 padding 到 box
  box.x -= padding;
  box.y -= padding;
  box.width += padding * 2;
  box.height += padding * 2;

  // console.log("updateScrollbars box:", box);

  const viewRect = {
    width: stage.width() / stage.scaleX(),
    height: stage.height() / stage.scaleY(),
    x: -stage.x() / stage.scaleX(),
    y: -stage.y() / stage.scaleY(),
  };

  // 如果 box 是空的（没有任何元素），或者 box 的大小为 0，则不需要滚动条
  if (
    (box.width === 0 && box.height === 0) ||
    !isFinite(box.width) ||
    !isFinite(box.height)
  ) {
    scrollbars.h.visible = false;
    scrollbars.v.visible = false;
    return;
  }

  // 计算内容区域（包含可视区域和实际内容）
  const contentRect = {
    x: Math.min(box.x, viewRect.x),
    y: Math.min(box.y, viewRect.y),
    width:
      Math.max(box.x + box.width, viewRect.x + viewRect.width) -
      Math.min(box.x, viewRect.x),
    height:
      Math.max(box.y + box.height, viewRect.y + viewRect.height) -
      Math.min(box.y, viewRect.y),
  };

  // 水平滚动条
  const hTrackSize = stage.width() - 20; // 留出一点边距
  const hRatio = viewRect.width / contentRect.width;

  // 只有当内容比视口宽，且比例小于 0.99（避免浮点数误差）时才显示
  if (hRatio < 0.99) {
    scrollbars.h.visible = true;
    scrollbars.h.trackSize = hTrackSize;
    scrollbars.h.contentSize = contentRect.width;
    scrollbars.h.viewSize = viewRect.width;

    // 滑块宽度，最小 20px
    scrollbars.h.thumbWidth = Math.max(hTrackSize * hRatio, 20);

    // 滑块位置
    const hProgress =
      (viewRect.x - contentRect.x) / (contentRect.width - viewRect.width);
    const hMaxPos = hTrackSize - scrollbars.h.thumbWidth;
    scrollbars.h.thumbPos = Math.min(Math.max(hMaxPos * hProgress, 0), hMaxPos);
  } else {
    scrollbars.h.visible = false;
  }

  // 垂直滚动条
  const vTrackSize = stage.height() - 20;
  const vRatio = viewRect.height / contentRect.height;

  if (vRatio < 0.99) {
    scrollbars.v.visible = true;
    scrollbars.v.trackSize = vTrackSize;
    scrollbars.v.contentSize = contentRect.height;
    scrollbars.v.viewSize = viewRect.height;

    scrollbars.v.thumbHeight = Math.max(vTrackSize * vRatio, 20);

    const vProgress =
      (viewRect.y - contentRect.y) / (contentRect.height - viewRect.height);
    const vMaxPos = vTrackSize - scrollbars.v.thumbHeight;
    scrollbars.v.thumbPos = Math.min(Math.max(vMaxPos * vProgress, 0), vMaxPos);
  } else {
    scrollbars.v.visible = false;
  }
};

// 处理滚动条拖拽
let isScrollbarDragging = false;
let scrollbarDragStartPos = { x: 0, y: 0 };
let scrollbarDragStartThumbPos = 0;
let activeScrollbar = "";

const handleScrollbarDragStart = (type: "h" | "v", e: MouseEvent) => {
  isScrollbarDragging = true;
  activeScrollbar = type;
  scrollbarDragStartPos = { x: e.clientX, y: e.clientY };
  scrollbarDragStartThumbPos =
    type === "h" ? scrollbars.h.thumbPos : scrollbars.v.thumbPos;

  document.addEventListener("mousemove", handleScrollbarDragMove);
  document.addEventListener("mouseup", handleScrollbarDragEnd);
};

const handleScrollbarDragMove = (e: MouseEvent) => {
  if (!isScrollbarDragging || !stage) return;

  const padding = 301; // 与 updateScrollbars 保持一致

  if (activeScrollbar === "h") {
    const delta = e.clientX - scrollbarDragStartPos.x;
    const maxThumbPos = scrollbars.h.trackSize - scrollbars.h.thumbWidth;
    let newThumbPos = Math.min(
      Math.max(scrollbarDragStartThumbPos + delta, 0),
      maxThumbPos
    );

    // 反向计算舞台位置
    const progress = newThumbPos / maxThumbPos;
    const contentWidth = scrollbars.h.contentSize;
    const viewWidth = scrollbars.h.viewSize;

    // 获取当前的内容包围盒以确定起始点
    const box = layer!.getClientRect({ skipTransform: true });
    // 同样需要应用 padding
    box.x -= padding;
    box.y -= padding;
    box.width += padding * 2;
    box.height += padding * 2;

    const viewX = -stage.x() / stage.scaleX();
    const minX = Math.min(box.x, viewX);

    const newViewX = minX + progress * (contentWidth - viewWidth);
    stage.x(-newViewX * stage.scaleX());
  } else {
    const delta = e.clientY - scrollbarDragStartPos.y;
    const maxThumbPos = scrollbars.v.trackSize - scrollbars.v.thumbHeight;
    let newThumbPos = Math.min(
      Math.max(scrollbarDragStartThumbPos + delta, 0),
      maxThumbPos
    );

    const progress = newThumbPos / maxThumbPos;
    const contentHeight = scrollbars.v.contentSize;
    const viewHeight = scrollbars.v.viewSize;

    const box = layer!.getClientRect({ skipTransform: true });
    // 同样需要应用 padding
    box.x -= padding;
    box.y -= padding;
    box.width += padding * 2;
    box.height += padding * 2;

    const viewY = -stage.y() / stage.scaleY();
    const minY = Math.min(box.y, viewY);

    const newViewY = minY + progress * (contentHeight - viewHeight);
    stage.y(-newViewY * stage.scaleY());
  }

  stage.batchDraw();
  updateScrollbars();

  // 触发 stage-transform 事件
  emit("stage-transform", {
    x: stage.x(),
    y: stage.y(),
    scale: stage.scaleX(),
  });
};

const handleScrollbarDragEnd = () => {
  isScrollbarDragging = false;
  activeScrollbar = "";
  document.removeEventListener("mousemove", handleScrollbarDragMove);
  document.removeEventListener("mouseup", handleScrollbarDragEnd);
};

// 封装画布拖动方法
const moveStage = (pos: { x: number; y: number }) => {
  if (!stage) return;
  stage.x(stage.x() + pos.x);
  stage.y(stage.y() + pos.y);
  stage.batchDraw();
  updateScrollbars();

  // 触发事件，通知父组件舞台位置发生变化
  emit("stage-transform", {
    x: stage.x(),
    y: stage.y(),
    scale: stage.scaleX(),
  });
};

const applyStageWheelInteraction = (payload: {
  clientX: number;
  clientY: number;
  deltaX?: number;
  deltaY?: number;
  ctrlKey?: boolean;
  shiftKey?: boolean;
}) => {
  // 供外层覆盖 UI（例如 crop 覆盖层）转发滚轮事件，
  // 这样即使鼠标落在 overlay 上，也能复用 Konva 原本的缩放/滚动逻辑。
  if (!props.enableMouseWheelScroll || !stage || !container.value) {
    return;
  }

  const containerRect = container.value.getBoundingClientRect();
  const pointer = {
    x: payload.clientX - containerRect.left,
    y: payload.clientY - containerRect.top,
  };

  if (payload.ctrlKey) {
    const oldScale = scale.value;
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const scaleBy = 1.1;
    const deltaY = Number(payload.deltaY) || 0;
    let newScale = deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    newScale = Math.max(minScale, Math.min(maxScale, newScale));

    stage.scale({ x: newScale, y: newScale });

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    stage.position(newPos);
    scale.value = newScale;

    if (aiAssistState) {
      updateAiAssistLabelScale();
    }

    stage.batchDraw();
    updateScrollbars();
    emit("stage-transform", {
      x: newPos.x,
      y: newPos.y,
      scale: newScale,
    });
    return;
  }

  let dx = Number(payload.deltaX) || 0;
  let dy = Number(payload.deltaY) || 0;

  if (payload.shiftKey && dx === 0) {
    dx = dy;
    dy = 0;
  }

  stage.position({
    x: stage.x() - dx,
    y: stage.y() - dy,
  });
  stage.batchDraw();
  updateScrollbars();
  emit("stage-transform", {
    x: stage.x(),
    y: stage.y(),
    scale: stage.scaleX(),
  });
};

// 清除 AI 辅助相关的图形和状态
// 在切换工具、取消选中或重新触发时调用
const clearAiAssist = () => {
  // 销毁所有扇形
  aiRingSlices.forEach((slice) => slice.destroy());
  aiRingSlices = [];

  // 销毁 3 点钟方向固定文案
  aiRightClockLabels.forEach((label) => label.destroy());
  aiRightClockLabels = [];

  // 销毁引导线
  if (aiGuideLine) {
    aiGuideLine.destroy();
    aiGuideLine = null;
  }

  if (aiGuideEndCircle) {
    aiGuideEndCircle.destroy();
    aiGuideEndCircle = null;
  }

  // 移除事件监听
  if (aiAssistState && aiAssistState.target) {
    const target = aiAssistState.target;
    target.off("dragmove", updateAiAssistPosition);
    target.off("transform", updateAiAssistPosition);
  }

  // 重置状态
  if (aiAssistState) {
    aiAssistState = null;
    emit("ai-mode-change", false);
  }

  // 重绘图层
  if (layer) {
    layer.batchDraw();
  }
};

// 更新 AI 辅助环位置
// 当选中元素移动或变换时调用
const updateAiAssistPosition = () => {
  if (!aiAssistState || !aiAssistState.target) return;
  const { bandCount } = getCurrentAiRingTheme();

  const target = aiAssistState.target;
  const box = target.getClientRect({ skipShadow: true });

  // 将绝对坐标转换为 Layer 局部坐标
  const transform = layer!.getAbsoluteTransform().copy().invert();
  const localPos = transform.point({
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  });

  // 更新圆心位置
  aiAssistState.centerX = localPos.x;
  aiAssistState.centerY = localPos.y;

  // 更新半径 (考虑缩放)
  const scaleX = stage!.scaleX();
  const diagonal = Math.sqrt(box.width * box.width + box.height * box.height);
  // 注意：这里的 box.width 包含了 scale，所以除以 scaleX 得到原始比例下的尺寸
  const innerRadius = diagonal / 2 / scaleX;

  aiAssistState.innerRadius = innerRadius;
  aiAssistState.outerRadius = innerRadius + 300; // 固定画布坐标宽度，缩放时视觉宽度随之变化

  // 更新所有扇形的位置和半径
  aiRingSlices.forEach((group) => {
    group.x(aiAssistState!.centerX);
    group.y(aiAssistState!.centerY);

    // 更新三层环的半径
    const ringWidth = aiAssistState!.outerRadius - aiAssistState!.innerRadius;
    const bandWidth = ringWidth / bandCount;
    let sliceRotation = 0;
    for (let band = 0; band < bandCount; band++) {
      const bandArc = group.findOne(`.slice-band-${band}`) as Konva.Arc;
      if (bandArc) {
        bandArc.innerRadius(aiAssistState!.innerRadius + band * bandWidth);
        bandArc.outerRadius(aiAssistState!.innerRadius + (band + 1) * bandWidth);
        if (band === 0) sliceRotation = bandArc.rotation();
      }
    }

    // 更新文字位置
    const labelGroup = group.findOne(".labelGroup") as Konva.Group;
    if (labelGroup) {
      const { sliceAngle } = getAiRingGeometry();
      const angle = (sliceRotation + sliceAngle / 2) * (Math.PI / 180);
      const radius =
        (aiAssistState!.innerRadius + aiAssistState!.outerRadius) / 2;

      labelGroup.x(Math.cos(angle) * radius);
      labelGroup.y(Math.sin(angle) * radius);
    }
  });

  updateAiRightClockLabelsPosition();

  // 如果引导线存在，隐藏它（因为位置变了，需要鼠标移动触发更新）
  if (aiGuideLine) {
    aiGuideLine.hide();
  }
  if (aiGuideEndCircle) {
    aiGuideEndCircle.hide();
  }

  layer!.batchDraw();
};

// 更新 AI 辅助交互效果
// 根据鼠标位置高亮对应扇区，并更新引导线
// 参数 pos: 鼠标在舞台坐标系中的位置
const updateAiAssistInteraction = (pos: { x: number; y: number }) => {
  if (!aiAssistState || aiRingSlices.length === 0 || !layer) return;
  const { bandCount, fills, activeFills } = getCurrentAiRingTheme();

  // 如果状态被锁定（已点击），则不再更新交互
  if (aiAssistState.isLocked) return;

  // 计算鼠标相对于圆心的距离和角度
  const dx = pos.x - aiAssistState.centerX;
  const dy = pos.y - aiAssistState.centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const currentScale = Math.max(stage?.scaleX?.() || 1, 0.001);
  const ringLabelBaseScale = Math.max(1, Math.min(2.4, 1 / currentScale));

  // 判断鼠标是否在圆环范围内
  const inRing =
    distance >= aiAssistState.innerRadius &&
    distance <= aiAssistState.outerRadius;

  // 计算鼠标所在的象限（扇区索引）
  let activeIndex = -1;
  let activeBandIndex = -1;
  if (inRing) {
    activeIndex = getAiRingSliceIndex(dx, dy);
    const ringWidth = aiAssistState.outerRadius - aiAssistState.innerRadius;
    const bandWidth = ringWidth / bandCount;
    const distanceInRing = Math.max(0, distance - aiAssistState.innerRadius);
    activeBandIndex = Math.min(
      bandCount - 1,
      Math.floor(distanceInRing / bandWidth)
    );
    updateAiRightClockLabelsColorByGuideLength(distance);
  } else {
    // 没有引导线时，两侧标签保持相同默认色
    resetAiRightClockLabelsDefaultColor();
  }

  // 更新所有扇区的样式
  aiRingSlices.forEach((group, index) => {
    const isActiveSlice = index === activeIndex;

    // 更新三层环扇形背景
    for (let band = 0; band < bandCount; band++) {
      const bandArc = group.findOne(`.slice-band-${band}`) as Konva.Arc;
      if (bandArc) {
        const isActiveBand = isActiveSlice && band === activeBandIndex;
        bandArc.setAttrs({
          fill: isActiveBand ? activeFills[band] : fills[band],
          stroke: isActiveBand ? "rgba(255, 255, 255, 0.92)" : AI_RING_BAND_STROKE,
          strokeWidth: isActiveBand ? 2.4 : 2,
          shadowColor: isActiveBand ? "rgba(96, 165, 250, 0.26)" : band === 0 ? "rgba(120, 126, 138, 0.22)" : undefined,
          shadowBlur: isActiveBand ? 18 : band === 0 ? 8 : 0,
          shadowOffset: isActiveBand ? { x: 0, y: 2 } : band === 0 ? { x: 0, y: 1 } : undefined,
          shadowOpacity: isActiveBand ? 1 : band === 0 ? 1 : 0,
        });
      }
    }

    // 更新标签样式
    const labelGroup = group.findOne(".labelGroup") as Konva.Group;
    if (labelGroup) {
      const bg = labelGroup.findOne(".labelBg") as Konva.Rect;
      const text = labelGroup.findOne(".labelText") as Konva.Text;

      if (bg) {
        if (isActiveSlice) {
          // 激活态：浅蓝胶囊背景 + 轻阴影
          bg.setAttrs({
            fill: "#91D5FF",
            shadowColor: "rgba(60, 140, 196, 0.35)",
            shadowBlur: 10,
            shadowOffset: { x: 0, y: 2 },
            shadowOpacity: 1,
          });
          bg.cornerRadius(Math.max(bg.height() / 2, 4));
        } else {
          // 非激活态：透明背景
          bg.setAttrs({
            fill: "rgba(255, 255, 255, 0.9)",
            shadowColor: "transparent",
            shadowBlur: 10,
            shadowOffset: { x: 0, y: 2 },
            shadowOpacity: 1,
          });
          bg.cornerRadius(Math.max(bg.height() / 2, 4));
        }

        // 保持无边框
        bg.stroke(null);
      }

      if (text) {
        // 激活时黑色，非激活时灰色
        text.fill(isActiveSlice ? "#000" : "#999");
      }

      const hoverScale = ringLabelBaseScale * (isActiveSlice ? 1.04 : 1);
      labelGroup.scale({ x: hoverScale, y: hoverScale });
    }
  });

  // 处理引导线（从圆心指向鼠标位置）
  if (inRing) {
    if (!aiGuideLine) {
      // 如果引导线不存在，创建新线条
      aiGuideLine = new Konva.Line({
        points: [aiAssistState.centerX, aiAssistState.centerY, pos.x, pos.y],
        stroke: AI_GUIDE_START_COLOR,
        strokeWidth: 2,
        dash: [10, 5], // 虚线
        listening: false, // 不响应鼠标事件
      });
      const endColor = updateAiGuideLineGradient(aiGuideLine, pos);
      layer.add(aiGuideLine);
      aiGuideLine.moveToTop();

      aiGuideEndCircle = new Konva.Circle({
        x: pos.x,
        y: pos.y,
        radius: 5,
        fill: endColor || AI_GUIDE_START_COLOR,
        stroke: "rgba(255, 255, 255, 0.9)",
        strokeWidth: 1.5,
        listening: false,
      });
      layer.add(aiGuideEndCircle);
      aiGuideEndCircle.moveToTop();
    } else {
      // 如果引导线已存在，更新终点坐标
      aiGuideLine.points([
        aiAssistState.centerX,
        aiAssistState.centerY,
        pos.x,
        pos.y,
      ]);
      const endColor = updateAiGuideLineGradient(aiGuideLine, pos);
      aiGuideLine.show();
      aiGuideLine.moveToTop();

      if (!aiGuideEndCircle) {
        aiGuideEndCircle = new Konva.Circle({
          x: pos.x,
          y: pos.y,
          radius: 5,
          fill: endColor || AI_GUIDE_START_COLOR,
          stroke: "rgba(255, 255, 255, 0.9)",
          strokeWidth: 1.5,
          listening: false,
        });
        layer.add(aiGuideEndCircle);
      } else {
        aiGuideEndCircle.position({ x: pos.x, y: pos.y });
        aiGuideEndCircle.fill(endColor || AI_GUIDE_START_COLOR);
      }
      aiGuideEndCircle.show();
      aiGuideEndCircle.moveToTop();
    }
  } else if (aiGuideLine) {
    // 如果鼠标不在圆环内，且未锁定，则隐藏引导线
    aiGuideLine.hide();
    if (aiGuideEndCircle) {
      aiGuideEndCircle.hide();
    }
    resetAiRightClockLabelsDefaultColor();
  } else {
    resetAiRightClockLabelsDefaultColor();
  }

  // 确保变换器始终在最上层
  if (transformer) {
    transformer.moveToTop();
  }
  layer.batchDraw();
};

// 统一的 stage 点击入口。
// 当前这层承担两类职责：
// 1) AI 辅助环命中检测与事件派发；
// 2) 普通内容节点的事件委托选中。
// 这样做之后，新增节点只需要 add 到 layer，不需要在每条创建路径里重复绑定 click/tap。
// 事件流约定如下：
// - 先判断是否命中 AI 环；命中则直接消费事件并返回。
// - 未命中 AI 环时，再根据 evt.target 反向解析“真正应该被选中的节点”。
// - 解析成功后，统一复用 handleNodeClick，保持原有单选/多选/transformer 行为不变。
const handleStageClick = (
  e: Konva.KonvaEventObject<MouseEvent | TouchEvent>
) => {
  // AI 环属于高优先级交互。只要当前 AI 辅助处于激活态，就先做圆环命中判断，
  // 避免点击扇区时又落入普通节点选中逻辑。
  if (aiAssistState && layer) {
    const pos = getPointerPos(e);
  
    const dx = pos.x - aiAssistState.centerX;
    const dy = pos.y - aiAssistState.centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const inRing =
      distance >= aiAssistState.innerRadius &&
      distance <= aiAssistState.outerRadius;

    if (inRing) {
      // AI 环点击一旦命中就完全消费，防止继续冒泡到普通节点选择流程。
      e.cancelBubble = true;

      // 弹窗已经锁定时，不重复触发同一轮 AI 交互。
      if (aiAssistState.isLocked) return;

      const index = getAiRingSliceIndex(dx, dy);
      const label = aiRingLabels[index];
      const lineLength = distance - aiAssistState.innerRadius;
      const ringWidth = Math.max(
        0,
        aiAssistState.outerRadius - aiAssistState.innerRadius
      );

      const pointerPos = stage!.getPointerPosition();
      const screenPos = pointerPos
        ? {
            x: pointerPos.x + container.value!.getBoundingClientRect().left,
            y: pointerPos.y + container.value!.getBoundingClientRect().top,
          }
        : { x: 0, y: 0 };

      // 进入锁定态后，鼠标移动不会再刷新当前这次 AI 引导结果，
      // 直到上层流程显式结束或清理 AI 辅助状态。
      aiAssistState.isLocked = true;

      if (aiGuideLine) {
        // 点击时把引导线终点固定到当前命中位置，
        // 这样后续挂到画布上的 AI 内容卡片会以用户最终点击位置作为布局基准。
        aiGuideLine.points([
          aiAssistState.centerX,
          aiAssistState.centerY,
          pos.x,
          pos.y,
        ]);
        const endColor = updateAiGuideLineGradient(aiGuideLine, pos);
        updateAiRightClockLabelsColorByGuideLength(distance);
        aiGuideLine.show();

        if (!aiGuideEndCircle) {
          aiGuideEndCircle = new Konva.Circle({
            x: pos.x,
            y: pos.y,
            radius: 5,
            fill: endColor || AI_GUIDE_START_COLOR,
            stroke: "rgba(255, 255, 255, 0.9)",
            strokeWidth: 1.5,
            listening: false,
          });
          layer.add(aiGuideEndCircle);
        } else {
          aiGuideEndCircle.position({ x: pos.x, y: pos.y });
          aiGuideEndCircle.fill(endColor || AI_GUIDE_START_COLOR);
        }
        aiGuideEndCircle.show();
        aiGuideEndCircle.moveToTop();
        layer.batchDraw();
      }

      emit("ai-ring-click", {
        label,
        lineLength,
        ringWidth,
        position: screenPos,
      });

      console.log("AI Ring Click:", { label, lineLength, ringWidth, screenPos });
      return;
    }
  }

  const nativeEvent = e.evt as MouseEvent | TouchEvent | undefined;
  const isMultiSelectToggle = Boolean(
    nativeEvent && (nativeEvent.shiftKey || nativeEvent.ctrlKey || nativeEvent.metaKey)
  );

  let delegatedTarget = e.target as Konva.Node | null;

  // 多选时 Transformer 会开启整块命中区，第三次 Ctrl/Shift 点击很容易先打到 Transformer
  // 自身、它的控制点，或其它系统命中层。这里统一做一次“穿透命中”。
  if (isMultiSelectToggle && delegatedTarget && isStageSystemNode(delegatedTarget) && stage && transformer) {
    const pointer = stage.getPointerPosition();
    if (pointer) {
      const previousOverdraw = transformer.shouldOverdrawWholeArea();
      transformer.shouldOverdrawWholeArea(false);
      layer?.draw();
      delegatedTarget = stage.getIntersection(pointer);
      transformer.shouldOverdrawWholeArea(previousOverdraw);
      layer?.draw();
    }
  }

  // 未命中 AI 环时，走普通节点选择委托：
  // 根据真正被点击的 target，推导出“业务上应该选中的节点”。
  const targetNode = resolveSelectableNodeFromTarget(
    delegatedTarget
  );
  if (targetNode) {
    handleNodeClick(e, targetNode);
  }
};

const getAiGuidePlacementRect = (boxWidth: number, boxHeight: number) => {
  if (!aiAssistState || !aiGuideLine) {
    return null;
  }

  return getAiGuidePlacementRectFromLinePoints(aiGuideLine.points(), boxWidth, boxHeight);
};

// 取消 AI 辅助锁定状态，恢复交互
const cancelAiAssist = () => {
  console.log("cancelAiAssist called - destroying AI ring");
  // 直接销毁 AI 辅助环
  clearAiAssist();
};

// 统一的 AI 弹窗落画布入口。
// util 层先创建好 Konva 节点，这里只负责把现成节点挂到当前画布，
// 再处理 AI guide 定位、批量堆叠、扁平化与选中态同步。
const renderAiPopupSelectionToLayer = (
  {
    toolType = "Reflect",
    nodes = [],
    imageLoadTasks = [],
    layoutMode = "content",
    flattenToNodes = true,
    autoSelectOnFlatten = false,
    rowGap = 16,
  }: {
    toolType?: "Reflect" | "Constellate" | "Resonance";
    nodes?: Konva.Node[];
    imageLoadTasks?: Promise<any>[];
    layoutMode?: string;
    flattenToNodes?: boolean;
    autoSelectOnFlatten?: boolean;
    rowGap?: number;
  } = {}
) => {
  const validNodes = Array.isArray(nodes) ? nodes.filter(Boolean) : [];
  if (validNodes.length === 0) {
    return {
      success: false,
      message: "AI 内容绘制失败，未生成可用节点",
      nodes: [],
    };
  }

  if (toolType === "Resonance" || layoutMode === "resonance-stack") {
    if (!layer || !transformer || !aiAssistState || !aiGuideLine) {
      return {
        success: false,
        message: "Resonance 内容绘制失败，画布未准备好",
        nodes: [],
      };
    }

    const createdGroups = validNodes;
    createdGroups.forEach((group) => {
      if (group.getLayer() !== layer) {
        layer.add(group);
      }
    });

    const groupMetrics = createdGroups.map((group) => {
      const bgNode = group.findOne(".resonance-card-bg") as Konva.Rect | null;
      const rect = group.getClientRect({
        skipShadow: true,
        skipStroke: false,
      });

      return {
        group,
        // Resonance 多卡片堆叠时优先使用卡片背景本身的尺寸作为排布基准，
        // 避免 group 外接 rect 在文本换行/阴影场景下出现高度估算偏小，导致 y 方向重叠。
        width: Math.max(
          0,
          Number(bgNode?.width?.() || 0),
          Number(rect?.width) || 0
        ),
        height: Math.max(
          0,
          Number(bgNode?.height?.() || 0),
          Number(rect?.height) || 0
        ),
      };
    });

    const blockWidth = groupMetrics.reduce((maxWidth, metric) => Math.max(maxWidth, metric.width), 0);
    const blockHeight = groupMetrics.reduce((totalHeight, metric, index) => {
      return totalHeight + metric.height + (index > 0 ? rowGap : 0);
    }, 0);

    const layout = getAiGuidePlacementRect(blockWidth, blockHeight);
    if (!layout) {
      createdGroups.forEach((group) => group.destroy());
      layer.batchDraw();
      return {
        success: false,
        message: "Resonance 内容绘制失败，未生成可用节点",
        nodes: [],
      };
    }

    let currentY = layout.topLeftY;
    groupMetrics.forEach((metric) => {
      metric.group.position({
        x: layout.topLeftX,
        y: currentY,
      });
      currentY += metric.height + rowGap;
    });

    selectCanvasNodes(createdGroups as Konva.Node[]);
    clearAiAssist();

    return {
      success: Array.isArray(createdGroups) && createdGroups.length > 0,
      message: "Resonance 内容绘制失败，未生成可用节点",
      nodes: createdGroups,
    };
  }

  if (toolType === "Constellate") {
    if (!aiAssistState || !aiGuideLine || !layer) {
      return {
        success: false,
        message: "Constellate 内容绘制失败，画布未准备好",
        nodes: [],
      };
    }

    const group = validNodes[0] as Konva.Group | undefined;
    if (!group) {
      return {
        success: false,
        message: "Constellate 内容绘制失败，未生成可用节点",
        nodes: [],
      };
    }

    if (group.getLayer() !== layer) {
      layer.add(group);
    }

    const applyConstellateLayout = () => {
      const bgNode = group.findOne(".ai-content-body-bg") as Konva.Rect | null;
      if (!bgNode) {
        return;
      }

      const layout = getAiGuidePlacementRect(bgNode.width(), bgNode.height());
      if (!layout) {
        return;
      }

      group.position({
        x: layout.centerX,
        y: layout.centerY,
      });
      group.offset({
        x: layout.offsetX,
        y: layout.offsetY,
      });
      layer?.batchDraw();
    };

    applyConstellateLayout();

    const flattenConstellateGroupToNodes = () => {
      const baseX = group.x() - group.offsetX();
      const baseY = group.y() - group.offsetY();
      const children: any[] = group.getChildren() as any;

      const flattenedNodes: Konva.Node[] = children
        .filter((child: any) => child instanceof Konva.Image || child instanceof Konva.Text)
        .map((child: any) => {
          const childNode = child as any;
          childNode.remove();

          childNode.position({
            x: baseX + childNode.x(),
            y: baseY + childNode.y(),
          });

          childNode.draggable(true);
          layer!.add(childNode);
          return childNode;
        });

      children
        .filter((child: any) => !(child instanceof Konva.Image || child instanceof Konva.Text))
        .forEach((child: any) => {
          child.destroy();
        });

      updateDraggableState();
      group.destroy();
      return flattenedNodes;
    };

    Promise.all(Array.isArray(imageLoadTasks) ? imageLoadTasks : []).then(() => {
      applyConstellateLayout();

      if (flattenToNodes) {
        const flattenedNodes = flattenConstellateGroupToNodes();
        if (autoSelectOnFlatten && Array.isArray(flattenedNodes) && flattenedNodes.length > 0) {
          selectedNodes.forEach((n) => removeNodeSelectStyle(n));
          selectedNodes = flattenedNodes;
          transformer?.nodes(selectedNodes);
          selectedNodes.forEach((n) => {
            addNodeSelectStyle(n);
            n.moveToTop();
          });
          transformer?.moveToTop();
        }
      }

      layer!.batchDraw();
      setTimeout(() => updateScrollbars(), 200);
    });

    clearAiAssist();
    layer.batchDraw();

    return {
      success: true,
      message: "Constellate 内容绘制失败，未生成可用节点",
      nodes: [group],
    };
  }

  if (toolType === "Reflect") {
    if (!aiAssistState || !aiGuideLine || !layer) {
      return {
        success: false,
        message: "Reflect 内容绘制失败，画布未准备好",
        nodes: [],
      };
    }

    const group = validNodes[0] as Konva.Group | undefined;
    if (!group) {
      return {
        success: false,
        message: "Reflect 内容绘制失败，未生成可用节点",
        nodes: [],
      };
    }

    if (group.getLayer() !== layer) {
      layer.add(group);
    }

    const applyReflectLayout = () => {
      const bgNode = group.findOne(".ai-content-body-bg") as Konva.Rect | null;
      if (!bgNode) {
        return;
      }

      const layout = getAiGuidePlacementRect(bgNode.width(), bgNode.height());
      if (!layout) {
        return;
      }

      group.position({
        x: layout.centerX,
        y: layout.centerY,
      });
      group.offset({
        x: layout.offsetX,
        y: layout.offsetY,
      });
      layer?.batchDraw();
    };

    applyReflectLayout();

    const flattenReflectGroupToNodes = () => {
      const baseX = group.x() - group.offsetX();
      const baseY = group.y() - group.offsetY();
      const children: any[] = group.getChildren() as any;

      const flattenedNodes: Konva.Node[] = children
        .filter((child: any) => child instanceof Konva.Image || child instanceof Konva.Text)
        .map((child: any) => {
          const childNode = child as any;
          childNode.remove();

          childNode.position({
            x: baseX + childNode.x(),
            y: baseY + childNode.y(),
          });

          childNode.draggable(true);
          layer!.add(childNode);
          return childNode;
        });

      children
        .filter((child: any) => !(child instanceof Konva.Image || child instanceof Konva.Text))
        .forEach((child: any) => {
          child.destroy();
        });

      updateDraggableState();
      group.destroy();
      return flattenedNodes;
    };

    Promise.all(Array.isArray(imageLoadTasks) ? imageLoadTasks : []).then(() => {
      applyReflectLayout();

      if (flattenToNodes) {
        flattenReflectGroupToNodes();
      }

      layer!.batchDraw();
      setTimeout(() => updateScrollbars(), 200);
    });

    clearAiAssist();
    layer.batchDraw();

    return {
      success: true,
      message: "Reflect 内容绘制失败，未生成可用节点",
      nodes: [group],
    };
  }

  return {
    success: false,
    message: "AI 内容绘制失败，未知的工具类型",
    nodes: [],
  };
};

const clearAiGuideLine = () => {
  console.log("clearAiGuideLine called");
  if (aiGuideLine) {
    aiGuideLine.destroy();
    aiGuideLine = null;
  }
  if (aiGuideEndCircle) {
    aiGuideEndCircle.destroy();
    aiGuideEndCircle = null;
  }
  if (aiAssistState) {
    aiAssistState.isLocked = false;
  }
  layer?.batchDraw();
};

// 启动 Hint 后，若 AI 环过大或偏移，自动缩小并居中，确保整环可见。
const ensureAiRingVisible = () => {
  if (!stage || !aiAssistState) {
    return;
  }

  const topOcclusion = 50;
  const bottomOcclusion = 50;
  const viewportWidth = stage.width();
  const viewportHeight = stage.height();
  const effectiveHeight = viewportHeight - topOcclusion - bottomOcclusion;
  if (viewportWidth <= 0 || viewportHeight <= 0) {
    return;
  }
  if (effectiveHeight <= 0) {
    return;
  }

  const safePadding = 36;
  const ringDiameter = aiAssistState.outerRadius * 2 + safePadding * 2;
  const currentScale = stage.scaleX();

  // 仅在环超出可视范围时缩小，避免无故改变用户缩放级别。
  const fitScale = Math.min(viewportWidth / ringDiameter, effectiveHeight / ringDiameter);
  let nextScale = currentScale;
  if (fitScale < currentScale) {
    nextScale = Math.max(minScale, fitScale);
  }

  stage.scale({ x: nextScale, y: nextScale });
  scale.value = nextScale;

  // 将环中心移动到“有效可视区域”中心，避开上下遮挡区。
  const nextPos = {
    x: viewportWidth / 2 - aiAssistState.centerX * nextScale,
    y:
      topOcclusion + effectiveHeight / 2 - aiAssistState.centerY * nextScale,
  };
  stage.position(nextPos);

  updateAiAssistLabelScale();

  stage.batchDraw();
  updateScrollbars();
  emit("stage-transform", {
    x: nextPos.x,
    y: nextPos.y,
    scale: nextScale,
  });
};

// 触发 AI 辅助功能
// 在选中元素周围生成交互式圆环
// 返回值: 包含成功状态和消息的对象
const triggerAiAssist = () => {
  if (!layer) {
    return { success: false, message: "画布未初始化" };
  }
  const { bandCount, fills } = getCurrentAiRingTheme();

  if (selectedNodes.length === 0) {
    return { success: false, message: "请先选中一个元素" };
  }

  if (selectedNodes.length > 1) {
    return { success: false, message: "请只选中一个元素后再试" };
  }

  // 获取选中元素及其边界信息
  const target = selectedNodes[0];
  const box = target.getClientRect({ skipShadow: true });

  // 计算对角线长度的一半作为内圆半径，确保能包住整个元素
  const diagonal = Math.sqrt(box.width * box.width + box.height * box.height);

  // 考虑 Stage 的缩放
  const scaleX = stage!.scaleX();
  const innerRadius = diagonal / 2 / scaleX;

  if (innerRadius <= 0) {
    return { success: false, message: "当前元素尺寸无效" };
  }

  // 先清除已存在的 AI 辅助图形
  clearAiAssist();

  // 计算圆心位置 (转换为 Layer 局部坐标)
  const transform = layer!.getAbsoluteTransform().copy().invert();
  const localPos = transform.point({
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  });

  // 初始化 AI 辅助状态
  aiAssistState = {
    centerX: localPos.x,
    centerY: localPos.y,
    innerRadius,
    outerRadius: innerRadius + 200, // 外圆半径比内圆大 200（画布坐标）
    target: target,
  };

  // 绑定事件监听，确保圆环跟随移动
  target.on("dragmove", updateAiAssistPosition);
  target.on("transform", updateAiAssistPosition);

  // 根据标签数量创建扇形分区
  const { sliceCount, sliceAngle, rotationOffset } = getAiRingGeometry();

  for (let index = 0; index < sliceCount; index++) {
    const group = new Konva.Group({
      x: aiAssistState.centerX,
      y: aiAssistState.centerY,
      listening: true, // 开启监听，拦截点击事件
      customType: "ai-assist-slice-group",
    });

    // 绑定点击事件，阻止冒泡
    group.on("click tap", (e) => {
      // 阻止事件冒泡到下面的节点
      e.cancelBubble = true;
      // 触发舞台点击处理逻辑（复用 handleStageClick）
      handleStageClick(e);
    });

    // 绑定鼠标移入移出事件，增强交互体验（可选，目前主要逻辑在 updateAiAssistInteraction）
    group.on("mouseenter", () => {
      if (stage) stage.container().style.cursor = "pointer";
    });
    group.on("mouseleave", () => {
      if (stage) stage.container().style.cursor = "default";
    });

    // 三层环：将环带等分为 3 段
    const ringWidth = aiAssistState.outerRadius - aiAssistState.innerRadius;
    const bandWidth = ringWidth / bandCount;
    for (let band = 0; band < bandCount; band++) {
      const bandInner = aiAssistState.innerRadius + band * bandWidth;
      const bandOuter = bandInner + bandWidth;
      const bandArc = new Konva.Arc({
        name: `slice-band-${band}`,
        customType: "ai-assist-slice",
        innerRadius: bandInner,
        outerRadius: bandOuter,
        angle: sliceAngle,
        rotation: index * sliceAngle + rotationOffset,
        fill: fills[band],
        stroke: AI_RING_BAND_STROKE,
        strokeWidth: 2,
        shadowColor: band === 0 ? "rgba(120, 126, 138, 0.22)" : undefined,
        shadowBlur: band === 0 ? 8 : 0,
        shadowOffset: band === 0 ? { x: 0, y: 1 } : undefined,
        listening: true,
      });
      group.add(bandArc);
    }

    // 创建标签
    const labelGroup = new Konva.Group({
      name: "labelGroup",
      customType: "ai-assist-label-group",
      listening: false, // 标签本身不需要独立监听，跟随 group
    });

    // 计算文字位置 (扇形中心)
    const angle = (index * sliceAngle + sliceAngle) * (Math.PI / 180);
    const radius = (aiAssistState.innerRadius + aiAssistState.outerRadius) / 2;
    const labelX = Math.cos(angle) * radius;
    const labelY = Math.sin(angle) * radius;

    labelGroup.position({ x: labelX, y: labelY });

    const text = new Konva.Text({
      name: "labelText",
      text: aiRingLabels[index],
      fontSize: 14,
      fontFamily: DEFAULT_FONT_FAMILY,
      fill: "#999", // 默认灰色
      align: "center",
      verticalAlign: "middle",
      padding: 8,
    });

    // 文字背景
    const bg = new Konva.Rect({
      name: "labelBg",
      width: text.width(),
      height: text.height(),
      fill: "transparent", // 默认透明
      stroke: null, // 默认无边框
      strokeWidth: 0,
      cornerRadius: 4,
    });

    // 居中背景和文字
    bg.offset({ x: bg.width() / 2, y: bg.height() / 2 });
    text.offset({ x: text.width() / 2, y: text.height() / 2 });

    labelGroup.add(bg);
    labelGroup.add(text);
    group.add(labelGroup);

    aiRingSlices.push(group);
    layer.add(group);
    group.moveToTop();
  }

  aiRightClockLabels = aiRightLabels.map(
    (textValue) =>
      new Konva.Text({
        text: textValue,
        fontSize: 14,
        fontFamily: DEFAULT_FONT_FAMILY,
        fill: AI_RIGHT_DEFAULT_COLOR,
        listening: false,
      })
  );

  aiRightClockLabels.forEach((labelNode) => {
    labelNode.offset({ x: 0, y: labelNode.height() / 2 });
    layer!.add(labelNode);
    labelNode.moveToTop();
  });
  updateAiAssistLabelScale();
  updateAiRightClockLabelsPosition();
  resetAiRightClockLabelsDefaultColor();

  // 确保变换器在辅助图形之上
  if (transformer) {
    transformer.moveToTop();
  }
  layer.batchDraw();
  ensureAiRingVisible();
  updateScrollbars();

  return { success: true };
};

onMounted(() => {
  stage = new Konva.Stage({
    container: container.value!,
    width: container.value!.offsetWidth,
    height: container.value!.offsetHeight,
  });

  layer = new Konva.Layer();
  stage.add(layer);

  transformer = new Konva.Transformer({
    borderStroke: "#1890ff",
    borderStrokeWidth: 2,
    anchorStroke: "#1890ff",
    anchorFill: "#ffffff",
    anchorSize: 10,
    rotateAnchorOffset: 20,
    // 允许在多选框内部空白区域按下并整体拖拽，不会被误判为空白点击清空选中。
    // shouldOverdrawWholeArea: true,
    boundBoxFunc: (oldBox, newBox) => {
      // 检查当前选中的节点是否是文本节点
      if (selectedNodes.length === 1 && selectedNodes[0] instanceof Konva.Text) {
        // 对于文本节点，只允许通过拖拽改变宽度，不允许缩放高度
        // 如果缩放导致宽度太小，限制最小宽度的改变
        const minWidth = 20;
        if (Math.abs(newBox.width) < minWidth) {
          return oldBox;
        }
      }
      return newBox;
    },
  });
  
  // 监听 Transformer 的缩放事件，专门处理被选中为一个 Text 时的情况
  transformer.on('transform', function () {
    if (selectedNodes.length === 1 && selectedNodes[0] instanceof Konva.Text) {
      const textNode = selectedNodes[0] as Konva.Text;
      // 重置文本节点的 scale 为 1，并用计算出来的宽度重新赋值
      // 如此做到拖拽点只改变 width 属性，而保持字体本身不被压扁/拉长
      const scaleX = textNode.scaleX();
      const newWidth = Math.max(textNode.width() * scaleX, 20); // 最小宽度设为 20
      
      textNode.width(newWidth);
      textNode.scaleX(1);
      textNode.scaleY(1);
    }
  });

  layer.add(transformer);

  selectionBox = new Konva.Rect({
    fill: "rgba(0, 161,255, 0.2)",
    stroke: "#00a1ff",
    strokeWidth: 1,
    visible: false,
  });
  layer.add(selectionBox);

  stage.on("mousedown touchstart", handleMouseDown);
  stage.on("mousemove touchmove", handleMouseMove);
  stage.on("mouseup touchend", handleMouseUp);
  // 监听点击事件，处理 AI 辅助环的点击交互
  stage.on("click tap", handleStageClick);
  stage.on("mouseleave touchcancel", handleMouseUp);
  stage.on("dblclick", handleDoubleClick);
  stage.on("wheel", handleWheel);
  stage.on("dragstart.altDuplicate", handleAltDragDuplicateStart);

  // 中键按下切换到 pan 模式，松开恢复（避免干扰外部系统的右键选中）
  let previousTool = "select";
  let isMiddleMouseDown = false;
  let middleMouseDownPos = { x: 0, y: 0 };
  let middleMouseStartPos = { x: 0, y: 0 };

  stage.on("mousedown", (e) => {
    if (e.evt.button === 1) {
      e.evt.preventDefault();
      isMiddleMouseDown = true;
      middleMouseStartPos = stage!.getPointerPosition() || { x: 0, y: 0 };
      middleMouseDownPos = { ...middleMouseStartPos };
      previousTool = currentTool.value;
      setTool("pan");
      stage!.container().style.cursor = "grabbing";
    }
  });

  stage.on("mousemove", (e) => {
    if (isMiddleMouseDown && currentTool.value === "pan") {
      const pos = stage!.getPointerPosition();
      if (pos) {
        const dx = pos.x - middleMouseDownPos.x;
        const dy = pos.y - middleMouseDownPos.y;
        moveStage({ x: dx, y: dy });
        middleMouseDownPos = { x: pos.x, y: pos.y };
      }
    }
  });

  stage.on("mouseup", (e) => {
    if (e.evt.button === 1) {
      isMiddleMouseDown = false;
      setTool(previousTool as any);
    }
  });

  stage.on("mouseleave", () => {
    if (isMiddleMouseDown) {
      isMiddleMouseDown = false;
      setTool(previousTool as any);
    }
  });

  window.addEventListener("resize", handleResize);
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("mousedown", handleGlobalPointerDown, true);
  window.addEventListener("touchstart", handleGlobalPointerDown, true);

  // 历史监听统一挂在图层层级：节点新增/删除、拖拽结束、变换结束都会触发快照采集。
  // 通过 scheduleHistorySnapshot 做节流，避免一次操作写入过多历史帧。
  layer.on("add.history", scheduleHistorySnapshot);
  layer.on("remove.history", scheduleHistorySnapshot);
  layer.on("dragend.history", scheduleHistorySnapshot);
  layer.on("transformend.history", scheduleHistorySnapshot);

  konvaData.stage = stage;
  konvaData.layer = layer;

  // 记录初始空画布快照，保证第一次 Ctrl+Z 能回到初始状态。
  commitHistorySnapshot();

  // 使用 ResizeObserver 监听容器大小变化
  if (container.value) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (stage) {
          stage.width(width);
          stage.height(height);
        }
      }
    });
    resizeObserver.observe(container.value);
  }
});

onUnmounted(() => {
  clearAiAssist();

  if (historyCaptureTimer) {
    clearTimeout(historyCaptureTimer);
    historyCaptureTimer = null;
  }

  if (layer) {
    layer.off(".history");
  }

  if (stage) {
    stage.destroy();
  }
  // 断开 ResizeObserver 监听
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  window.removeEventListener("resize", handleResize);
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("mousedown", handleGlobalPointerDown, true);
  window.removeEventListener("touchstart", handleGlobalPointerDown, true);
});

const handleResize = () => {
  if (stage && container.value) {
    stage.width(container.value.offsetWidth);
    stage.height(container.value.offsetHeight);
  }
};

const handleGlobalPointerDown = (event: MouseEvent | TouchEvent) => {
  if (!container.value) return;
  const target = event.target as Node | null;
  if (!target) return;
  isCurrentCanvasLastClicked = container.value.contains(target);
};

const getStagePointerPos = () => {
  if (!stage) return null;
  const pointer = stage.getPointerPosition();
  if (!pointer) return null;

  const transform = stage.getAbsoluteTransform().copy();
  transform.invert();
  return transform.point(pointer);
};

const getNodesTopLeft = (nodes: Konva.Node[]) => {
  let minX = Infinity;
  let minY = Infinity;

  nodes.forEach((node) => {
    // clipboard 里的节点已经脱离 stage/layer 树，
    // 这时优先读取复制当下缓存的 top-left，避免 detached 节点的 rect 失真。
    const storedTopLeft = node.getAttr(CLIPBOARD_TOP_LEFT_ATTR) as
      | { x?: number; y?: number }
      | undefined;
    const rect =
      !node.getStage() && storedTopLeft
        ? { x: Number(storedTopLeft.x) || 0, y: Number(storedTopLeft.y) || 0 }
        : node.getClientRect({ skipShadow: true });
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
  });

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    return { x: 0, y: 0 };
  }

  return { x: minX, y: minY };
};

// 判断当前命中的节点是否落在某个已选节点的子树内。
// 多选时鼠标往往点中的是 group/text wrapper 内部节点，不能只靠 === 判断归属。
const isNodeWithinSelection = (
  target: Konva.Node | null | undefined,
  selectedNode: Konva.Node | null | undefined
) => {
  if (!target || !selectedNode) return false;

  let current: Konva.Node | null = target;
  while (current) {
    if (current === selectedNode) {
      return true;
    }
    current = current.getParent?.() || null;
  }

  return false;
};

// 识别“业务 group 的子节点”。
// 这类节点在 group 内通常带有 dragBoundFunc 约束，单独复制出去后需要主动解除旧约束。
const isGroupedChildNode = (node: Konva.Node | null | undefined) => {
  if (!node) return false;

  let current: Konva.Node | null = node.getParent?.() || null;
  while (current) {
    if (
      current instanceof Konva.Group &&
      current.getAttr("customType") === "group"
    ) {
      return true;
    }
    current = current.getParent?.() || null;
  }

  return false;
};

// 识别 AI 辅助环相关节点，统一用于“不可被普通选中”的判断。

// 把来自 group 内部的节点克隆后，重新换算到当前 layer 坐标系。
// 否则 clone 会保留 group-local 的 x/y，直接 add 到 layer 后就会“跳”到 group 原点附近。
const syncClonedNodeToLayerSpace = (
  sourceNode: Konva.Node,
  clonedNode: Konva.Node
) => {
  if (!layer) return;

  // Ctrl+C 缓存出来的 clipboard node 不在当前舞台树里，
  // 这类节点不能再依赖 getAbsolutePosition/getAbsoluteScale 重新推导，
  // 而要优先使用复制时保存下来的 layer 局部几何。
  const storedLayerPos = sourceNode.getAttr(CLIPBOARD_LAYER_POS_ATTR) as
    | { x?: number; y?: number }
    | undefined;
  const storedLayerScale = sourceNode.getAttr(CLIPBOARD_LAYER_SCALE_ATTR) as
    | { x?: number; y?: number }
    | undefined;
  const storedLayerRotation = sourceNode.getAttr(CLIPBOARD_LAYER_ROTATION_ATTR);
  const useStoredGeometry = !sourceNode.getStage() && !!storedLayerPos;

  // 普通 live node 走“绝对坐标 -> layer 局部坐标”的换算；
  // clipboard node 则直接复用已缓存的 layer 坐标，避免把 stage 缩放混进来。
  const layerPos = useStoredGeometry
    ? {
        x: Number(storedLayerPos?.x) || 0,
        y: Number(storedLayerPos?.y) || 0,
      }
    : layer.getAbsoluteTransform().copy().invert().point(sourceNode.getAbsolutePosition());
  const layerScale = useStoredGeometry
    ? {
        x: Number(storedLayerScale?.x) || 1,
        y: Number(storedLayerScale?.y) || 1,
      }
    : (() => {
        const absScale = sourceNode.getAbsoluteScale();
        const layerAbsScale = layer.getAbsoluteScale();
        return {
          x:
            Math.abs(layerAbsScale.x) > Number.EPSILON
              ? absScale.x / layerAbsScale.x
              : absScale.x,
          y:
            Math.abs(layerAbsScale.y) > Number.EPSILON
              ? absScale.y / layerAbsScale.y
              : absScale.y,
        };
      })();
  const layerRotation = useStoredGeometry
    ? Number(storedLayerRotation) || 0
    : sourceNode.getAbsoluteRotation() - layer.getAbsoluteRotation();

  // 这里全部写回 layer 局部几何，而不是 absolute 几何，
  // 目的是保证粘贴节点的“自身大小”只由节点本身决定，不受当前画布缩放影响。
  clonedNode.position(layerPos);
  clonedNode.rotation(layerRotation);
  clonedNode.scale(layerScale);
};
const isAiAssistNode = (node?: Konva.Node | null) => {
  if (!node) return false;

  let current: Konva.Node | null = node;
  while (current) {
    if (current === aiGuideLine || current === aiGuideEndCircle) return true;
    if (aiRingSlices.includes(current as Konva.Group)) return true;
    if (aiRightClockLabels.includes(current as Konva.Text)) return true;

    const nodeName = String(current.name?.() || "");
    const customType = String(current.getAttr?.("customType") || "");
    if (nodeName.startsWith("ai-assist") || customType.startsWith("ai-assist")) {
      return true;
    }

    current = current.getParent?.() || null;
  }

  return false;
};

// 识别“舞台系统节点”，这些节点只负责交互辅助，不应该进入普通选择逻辑。
// 典型例子：
// - transformer / selectionBox：选择器自身的控制层
// - group-ungroup-btn：分组后的悬浮操作按钮
// - hover-action-btn：hover 工具按钮
// 如果不在这里排除，stage 委托会把这些控制节点误当成业务内容选中。
const isStageSystemNode = (node?: Konva.Node | null) => {
  if (!node) return false;

  let current: Konva.Node | null = node;
  while (current) {
    if (current === transformer || current === selectionBox) {
      return true;
    }

    const nodeName = String(current.name?.() || "");
    if (nodeName === "group-ungroup-btn" || nodeName === "hover-action-btn") {
      return true;
    }

    current = current.getParent?.() || null;
  }

  return false;
};

const WM_GROUP_SCAFFOLD_NODE_NAMES = new Set([
  "group-bg",
  "group-meaning-text",
  "group-meaning-bg",
]);

// 根据实际命中的 Konva target，反推出“最终应该被选中的节点”。
// 这是事件委托方案的核心：
// - 用户点击的往往是 group 内部的 rect/text/image，而不是我们真正想选中的外层容器；
// - 这里统一处理各种结构差异，避免每种节点创建时都手工绑定一遍 click。
// 解析规则从高优先级到低优先级依次为：
// 1) 过滤 stage/layer/system 控件/AI 节点；
// 2) segment_group 特殊处理：点 frame 选整个组，点内容选具体子节点；
// 3) customType=group 的业务组按命中区域分流：点背景/标题区选 group，点真实内容选子节点；
// 4) 对 createTextNode 这类显式标记为文本包装组的结构，向上折叠为外层节点；
// 5) 其余普通顶层节点，直接返回当前节点。
const resolveSelectableNodeFromTarget = (target?: Konva.Node | null) => {
  if (!target || !layer || !stage) return null;
  if (target === stage || target === layer) return null;
  if (isAiAssistNode(target) || isStageSystemNode(target)) return null;

  let current: Konva.Node | null = target;
  while (current && current !== layer) {
    const currentName = String(current.name?.() || "");
    const parent = current.getParent?.() || null;

    // segment_group 的 frame 只是边框命中层。
    // 点击它时，业务上希望选中整个 group，而不是这条 frame 本身。
    if (currentName === "segment-group-frame") {
      return parent instanceof Konva.Group ? parent : null;
    }

    // 走到顶层时，说明当前节点已经是可直接参与选择的内容节点。
    if (!(parent instanceof Konva.Group) || parent === layer) {
      return current;
    }

    const parentName = String(parent.name?.() || "");
    const parentCustomType = String(parent.getAttr?.("customType") || "");
    const currentCustomType = String(current.getAttr?.("customType") || "");
    const parentId = typeof parent.id === "function" ? parent.id() : "";
    const currentId = typeof current.id === "function" ? current.id() : "";

    // 即便命中的是按钮内部文本/背景，也不要进入内容选择。
    if (parentName === "group-ungroup-btn" || parentName === "hover-action-btn") {
      return null;
    }

    // createTextNode 返回的文本包装 group 会显式打标。
    // 点到它内部的 rect/text 时，统一折叠为外层文本 group，避免继续依赖同 id / 同 customType 猜结构。
    if (parent.getAttr?.("selectAsTextWrapperGroup")) {
      return parent;
    }

    // 对 Group 按钮创建的业务组，只有点击“壳层节点”时才选整个 group；
    // 点击组内真实内容（图片、segment、bubble 等）时，允许选中具体子节点。
    if (parentCustomType === "group") {
      return WM_GROUP_SCAFFOLD_NODE_NAMES.has(currentName) ? parent : current;
    }

    // segment_group 允许“边框选组、内容选子节点”的混合行为。
    if (parentCustomType === "segment_group") {
      return currentName === "segment-group-frame" ? parent : current;
    }

    // 兼容旧包装结构：若父子共用 id 或 customType，仍向上折叠为外层节点。
    if (
      (parentId && currentId && parentId === currentId) ||
      (parentCustomType && currentCustomType && parentCustomType === currentCustomType)
    ) {
      return parent;
    }

    current = parent;
  }

  return null;
};

// 过滤掉不应进入历史的临时节点（选择框、Transformer、AI 辅助元素等）。
const isHistoryTransientNode = (node: Konva.Node) => {
  if (!node) return true;
  if (node === transformer || node === selectionBox) return true;
  if (isAiAssistNode(node)) return true;
  const nodeName = String(node.name?.() || "");
  return nodeName === "slice" || nodeName === "labelGroup" || nodeName === "hover-action-btn";
};

// 给从历史恢复出的节点重新绑定交互事件。
// 这里在委托重构后有一个重要约束：
// - 普通节点不再恢复 click/tap 选中事件；
// - 只恢复那些“无法依赖 stage 委托”的特殊控件事件，例如 ungroup 按钮、group 的拖拽联动等。
// 这样可以避免历史恢复之后重新回到“每个节点都各绑一次 click”的旧模式。
const bindNodeEventsForHistoryRestore = (node: Konva.Node) => {
  if (!node) return;

  // 先清空序列化/克隆带回来的旧监听，避免历史节点上的回调引用旧实例状态。
  node.off();

  if (node.name?.() === "group-ungroup-btn") {
    const ungroupBtn = node as Konva.Group;
    const ungroupBtnBg = ungroupBtn.findOne("Rect") as Konva.Rect | null;

    ungroupBtn.on("mousedown touchstart", (evt: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      evt.cancelBubble = true;
    });

    ungroupBtn.on("click tap", (evt: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      evt.cancelBubble = true;
      const targetGroupId = String(ungroupBtn.getAttr("targetGroupId") || "");
      if (!targetGroupId || !layer) return;
      const groupNode = layer.findOne(`#${targetGroupId}`);
      const result = ungroupSelectedNodes(groupNode);
      if (!result?.success) {
        console.warn("Ungroup from history-restored button failed:", result?.message || "unknown");
      }
    });

    ungroupBtn.on("mouseenter", () => {
      if (stage) {
        stage.container().style.cursor = "pointer";
      }
      if (ungroupBtnBg) {
        ungroupBtnBg.fill("rgba(240, 240, 240, 0.98)");
      }
      layer?.batchDraw();
    });

    ungroupBtn.on("mouseleave", () => {
      if (stage) {
        stage.container().style.cursor = "default";
      }
      if (ungroupBtnBg) {
        ungroupBtnBg.fill("rgba(255, 255, 255, 0.92)");
      }
      layer?.batchDraw();
    });

    return;
  }

  if (node instanceof Konva.Group) {
    if (node.getAttr("customType") === "group") {
      // 分组节点仍需保留位置同步逻辑：拖动/缩放 group 时，悬浮 ungroup 按钮要跟着更新。
      node.on("dragmove transform", () => {
        if (!layer) return;
        const groupId = node.id?.();
        if (!groupId) return;
        const groupRect = node.getClientRect({
          relativeTo: layer,
          skipShadow: true,
          skipStroke: false,
        });
        const floatingBtns = layer.find(".group-ungroup-btn");
        floatingBtns.forEach((btn: Konva.Node) => {
          if (String(btn.getAttr("targetGroupId") || "") !== groupId) return;
          const btnGroup = btn as Konva.Group;
          const bg = btnGroup.findOne("Rect") as Konva.Rect | null;
          const btnWidth = bg?.width?.() || 64;
          const gap = 6;
          btnGroup.position({
            x: groupRect.x + groupRect.width - btnWidth - gap,
            y: groupRect.y + gap,
          });
          btnGroup.moveToTop();
        });
        layer.batchDraw();
      });
    }
    return;
  }
};

// 统一的节点克隆入口，供 Ctrl+C/Ctrl+V 与 Alt+拖拽复制复用。
// clone 后需要补三件事：
// 1) 重新绑定运行时事件；
// 2) 把 clone 加回当前图层；
// 3) 重绑/清理 group 相关的拖拽约束。
const cloneNodesIntoLayer = (
  sourceNodes: Konva.Node[],
  options?: {
    // 为 true 时，如果复制的是 group 内部 child，则解除它继承来的旧 group 边界约束。
    detachGroupedChildConstraints?: boolean;
  }
) => {
  if (!layer) return [];

  const { detachGroupedChildConstraints = false } = options || {};

  return sourceNodes.map((sourceNode) => {
    const clonedNode = sourceNode.clone({ listening: true });
    bindNodeEventsForHistoryRestore(clonedNode);
    layer!.add(clonedNode);
    syncClonedNodeToLayerSpace(sourceNode, clonedNode);
    rebindGroupedChildConstraintsDeep(clonedNode);

    if (
      detachGroupedChildConstraints &&
      !(clonedNode instanceof Konva.Group && clonedNode.getAttr("customType") === "group") &&
      isGroupedChildNode(sourceNode)
    ) {
      // 从 group 内单独拖出来的副本应该是自由节点，不能继续继承原 group 的边界限制。
      restoreGroupedChildDragConstraint(clonedNode);
    }

    removeNodeSelectStyle(clonedNode);
    return clonedNode;
  });
};

// Alt+拖拽的交互语义：
// - 单节点：复制当前节点，并直接拖动副本；
// - 多选：复制整个当前选中集，并拖动副本集合；
// - 如果命中的是 group 内 child，优先根据当前选中集归属来决定复制范围。
const handleAltDragDuplicateStart = (
  e: Konva.KonvaEventObject<DragEvent | MouseEvent>
) => {
  if (!stage || !layer || !transformer) return;
  if (currentTool.value !== "select") return;
  if (altDragDuplicateState) return;

  const nativeEvent = e.evt as MouseEvent | undefined;
  if (!nativeEvent?.altKey) return;

  const rawTarget = e.target as Konva.Node | null;
  if (!rawTarget || isStageSystemNode(rawTarget) || isAiAssistNode(rawTarget)) {
    return;
  }

  const dragTarget = resolveSelectableNodeFromTarget(rawTarget) || rawTarget;
  if (!dragTarget || dragTarget === layer || dragTarget === stage) {
    return;
  }

  // 先把实际命中的内部节点，映射回当前真正参与拖拽的选中节点。
  const draggedSelectionNode =
    selectedNodes.find(
      (selectedNode) =>
        isNodeWithinSelection(rawTarget, selectedNode) ||
        isNodeWithinSelection(dragTarget, selectedNode)
    ) || dragTarget;

  const sourceNodes = selectedNodes.includes(draggedSelectionNode)
    ? [...selectedNodes]
    : [draggedSelectionNode];

  if (sourceNodes.length === 0) return;

  const draggedIndex = Math.max(sourceNodes.indexOf(draggedSelectionNode), 0);
  const sourceAbsolutePositions = sourceNodes.map((node) =>
    node.getAbsolutePosition()
  );

  // 原节点只作为“被复制源”，接下来的拖拽应完全由副本接管。
  selectedNodes.forEach((node) => removeNodeSelectStyle(node));
  transformer.nodes([]);

  const clonedNodes = cloneNodesIntoLayer(sourceNodes, {
    detachGroupedChildConstraints: true,
  });
  if (clonedNodes.length === 0) return;

  const draggedClone = clonedNodes[draggedIndex] || clonedNodes[0];
  const clonedAbsolutePositions = clonedNodes.map((node) =>
    node.getAbsolutePosition()
  );

  // 立即把原节点钉回起始位置，避免原集合继续跟着这次拖拽移动。
  sourceNodes.forEach((node, index) => {
    node.stopDrag();
    node.absolutePosition(sourceAbsolutePositions[index]);
  });

  selectedNodes = clonedNodes;
  selectedNodes.forEach((node) => addNodeSelectStyle(node));
  syncTransformerSelectionState();
  selectedNodes.forEach((node) => node.moveToTop());
  transformer.moveToTop();
  bringRelatedUngroupButtonsToTop(selectedNodes);

  altDragDuplicateState = { draggedClone };

  const syncClonedSelectionOffset = () => {
    const currentPos = draggedClone.getAbsolutePosition();
    const startPos = clonedAbsolutePositions[draggedIndex] || currentPos;
    const dx = currentPos.x - startPos.x;
    const dy = currentPos.y - startPos.y;

    // 拖拽过程中持续把原节点钉回原位，避免旧选中集残留联动。
    sourceNodes.forEach((node, index) => {
      const nodeStartPos = sourceAbsolutePositions[index];
      if (!nodeStartPos) return;
      node.absolutePosition(nodeStartPos);
    });

    // 其余副本节点跟随“主拖拽副本”的位移量整体平移，保持复制集相对布局不变。
    clonedNodes.forEach((node, index) => {
      if (node === draggedClone) return;
      const nodeStartPos = clonedAbsolutePositions[index];
      if (!nodeStartPos) return;
      node.absolutePosition({
        x: nodeStartPos.x + dx,
        y: nodeStartPos.y + dy,
      });
    });

    layer?.batchDraw();
  };

  draggedClone.off(".altDuplicate");
  draggedClone.on("dragmove.altDuplicate", syncClonedSelectionOffset);
  draggedClone.on("dragend.altDuplicate", () => {
    draggedClone.off(".altDuplicate");
    altDragDuplicateState = null;
    // Alt+拖拽复制本质上产生了新内容，结束后补录历史，保证可撤销。
    scheduleHistorySnapshot();
  });

  // 把当前鼠标位置重新灌回 stage，然后显式把拖拽切换到副本节点上。
  stage.setPointersPositions(nativeEvent);
  draggedClone.startDrag();
  e.cancelBubble = true;
};

// 构造当前画布的历史快照：
// 1) 只取可持久化内容节点（排除临时节点）
// 2) 克隆并移除选中态，防止“仅选中变化”污染历史
const buildHistorySnapshot = (): HistorySnapshot => {
  if (!layer) return [];
  const snapshot: HistorySnapshot = [];
  layer.getChildren().forEach((node: Konva.Node) => {
    if (isHistoryTransientNode(node)) return;
    const cloned = node.clone({ listening: node.listening() });
    clearNodeListenersDeep(cloned);
    removeNodeSelectStyle(cloned);
    snapshot.push(cloned);
  });
  return snapshot;
};

const getHistorySignature = (snapshot: HistorySnapshot) => {
  return snapshot.map((node) => node.toJSON()).join("||");
};

const commitHistorySnapshot = () => {
  if (!layer || isApplyingHistory) return;

  const snapshot = buildHistorySnapshot();
  const signature = getHistorySignature(snapshot);
  if (signature === lastHistorySignature) {
    return;
  }

  historyPast.push(snapshot);
  if (historyPast.length > HISTORY_MAX_COUNT) {
    historyPast.shift();
  }
  historyFuture = [];
  lastHistorySignature = signature;
};

const scheduleHistorySnapshot = () => {
  if (isApplyingHistory) return;
  if (historyCaptureTimer) {
    clearTimeout(historyCaptureTimer);
  }
  historyCaptureTimer = setTimeout(() => {
    historyCaptureTimer = null;
    commitHistorySnapshot();
  }, 80);
};

const restoreHistorySnapshot = (snapshot: HistorySnapshot) => {
  if (!layer || !transformer) return;

  isApplyingHistory = true;
  clearAiAssist();

  selectedNodes.forEach((node) => removeNodeSelectStyle(node));
  selectedNodes = [];
  syncTransformerSelectionState();

  const rawChildren: any = layer.getChildren();
  const currentNodes: Konva.Node[] =
    typeof rawChildren?.each === "function"
      ? (() => {
          const snapshot: Konva.Node[] = [];
          rawChildren.each((child: Konva.Node) => snapshot.push(child));
          return snapshot;
        })()
      : Array.isArray(rawChildren)
      ? [...rawChildren]
      : typeof rawChildren?.toArray === "function"
      ? [...rawChildren.toArray()]
      : Array.from(rawChildren || []);
  currentNodes.forEach((node) => {
    if (isHistoryTransientNode(node)) return;
    node.destroy();
  });

  snapshot.forEach((node) => {
    const restoredNode = node.clone({ listening: node.listening() });
    bindNodeEventsForHistoryRestore(restoredNode);
    layer!.add(restoredNode);
    rebindGroupedChildConstraintsDeep(restoredNode);
  });

  transformer.moveToTop();
  layer.batchDraw();
  updateScrollbars();

  isApplyingHistory = false;
};

const undoLastStep = () => {
  if (historyPast.length <= 1) return;

  const current = historyPast.pop();
  if (current) {
    historyFuture.push(current);
  }

  const previous = historyPast[historyPast.length - 1];
  if (!previous) return;

  restoreHistorySnapshot(previous);
  lastHistorySignature = getHistorySignature(previous);
};

const redoNextStep = () => {
  if (historyFuture.length === 0) return;

  const next = historyFuture.pop();
  if (!next) return;

  historyPast.push(next);
  if (historyPast.length > HISTORY_MAX_COUNT) {
    historyPast.shift();
  }

  restoreHistorySnapshot(next);
  lastHistorySignature = getHistorySignature(next);
};

const copySelectedNodes = () => {
  if (selectedNodes.length === 0) return;

  // 复制前临时移除选中态，避免把蓝色选中阴影一并克隆到剪贴板。
  const snapshotNodes = [...selectedNodes];
  snapshotNodes.forEach((node) => removeNodeSelectStyle(node));
  // 统一记录当前整组选区在 layer 坐标系下的左上角。
  // Ctrl+V 时会用 hover 点减去这个基准，得到整组节点要平移的 dx/dy。
  let minX = Infinity;
  let minY = Infinity;
  snapshotNodes.forEach((node) => {
    const rect = node.getClientRect({
      relativeTo: layer || undefined,
      skipShadow: true,
    });
    minX = Math.min(minX, Number(rect?.x) || 0);
    minY = Math.min(minY, Number(rect?.y) || 0);
  });
  clipboardSelectionTopLeft = {
    x: Number.isFinite(minX) ? minX : 0,
    y: Number.isFinite(minY) ? minY : 0,
  };

  clipboardNodes = snapshotNodes.map((node) => {
    const clonedNode = node.clone({ listening: true });
    // 把节点的绝对位置转换成相对当前 layer 的局部位置，
    // 这样后续无论 stage 怎么缩放，粘贴出来的节点都能保持原始尺寸。
    const layerPoint = layer!
      .getAbsoluteTransform()
      .copy()
      .invert()
      .point(node.getAbsolutePosition());
    const absScale = node.getAbsoluteScale();
    const layerAbsScale = layer!.getAbsoluteScale();
    clonedNode.setAttr(CLIPBOARD_LAYER_POS_ATTR, layerPoint);
    // 节点真实缩放 = 绝对缩放 / layer 缩放。
    // 这里显式剥离整张画布的缩放，避免 Ctrl+V 时节点大小跟着 stage 一起放大/缩小。
    clonedNode.setAttr(CLIPBOARD_LAYER_SCALE_ATTR, {
      x:
        Math.abs(layerAbsScale.x) > Number.EPSILON
          ? absScale.x / layerAbsScale.x
          : absScale.x,
      y:
        Math.abs(layerAbsScale.y) > Number.EPSILON
          ? absScale.y / layerAbsScale.y
          : absScale.y,
    });
    clonedNode.setAttr(
      CLIPBOARD_LAYER_ROTATION_ATTR,
      node.getAbsoluteRotation() - layer!.getAbsoluteRotation()
    );

    // 单个节点也缓存一份 top-left，供 detached clipboard node 在后续几何计算中直接复用。
    const rect = node.getClientRect({
      relativeTo: layer || undefined,
      skipShadow: true,
    });
    clonedNode.setAttr(CLIPBOARD_TOP_LEFT_ATTR, {
      x: Number(rect?.x) || 0,
      y: Number(rect?.y) || 0,
    });
    return clonedNode;
  });

  // 恢复画布上当前选中节点的视觉状态。
  snapshotNodes.forEach((node) => addNodeSelectStyle(node));
  layer?.batchDraw();
  lastPasteOffset = { x: 24, y: 24 };
};

const pasteCopiedNodes = () => {
  if (!layer || !transformer || clipboardNodes.length === 0) return;
  const currentLayer = layer;

  // 保持原有交互：Ctrl+V 以鼠标当前 hover 到的画布坐标为锚点。
  const pasteAnchor = getStagePointerPos();
  const sourceTopLeft = clipboardSelectionTopLeft;

  // dx/dy 统一在 layer 坐标系里计算，
  // 与 clipboardSelectionTopLeft、clonedNode.position() 保持同一坐标系，避免位置漂移。
  const dx = pasteAnchor
    ? pasteAnchor.x - sourceTopLeft.x
    : lastPasteOffset.x;
  const dy = pasteAnchor
    ? pasteAnchor.y - sourceTopLeft.y
    : lastPasteOffset.y;

  clearAiAssist();
  selectedNodes.forEach((node) => removeNodeSelectStyle(node));

  const pastedNodes: Konva.Node[] = cloneNodesIntoLayer(clipboardNodes);

  pastedNodes.forEach((pastedNode) => {
    pastedNode.position({
      x: pastedNode.x() + dx,
      y: pastedNode.y() + dy,
    });
  });

  selectedNodes = pastedNodes;
  selectedNodes.forEach((node) => addNodeSelectStyle(node));
  transformer.nodes(selectedNodes);
  selectedNodes.forEach((node) => node.moveToTop());
  transformer.moveToTop();

  currentLayer.batchDraw();
  updateScrollbars();

  if (!pasteAnchor) {
    lastPasteOffset = {
      x: lastPasteOffset.x + 24,
      y: lastPasteOffset.y + 24,
    };
  } else {
    lastPasteOffset = { x: 24, y: 24 };
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  // 如果当前正在编辑文本（有 textarea 存在并且被聚焦），则不触发全局删除快捷键
  if (
    document.activeElement?.tagName === "TEXTAREA" ||
    document.activeElement?.tagName === "INPUT"
  ) {
    return;
  }

  // 仅在当前画布是最后一次被点击的区域时，才拦截快捷键。
  // 否则保留浏览器默认行为（例如在弹窗里 Ctrl+C 复制文本）。
  if (!isCurrentCanvasLastClicked) {
    return;
  }

  const lowerKey = String(e.key || "").toLowerCase();
  const isMetaPressed = e.ctrlKey || e.metaKey;
  const isUndo = isMetaPressed && !e.shiftKey && lowerKey === "z";
  const isRedo =
    (isMetaPressed && lowerKey === "y") ||
    (isMetaPressed && e.shiftKey && lowerKey === "z");

  if (isUndo) {
    e.preventDefault();
    undoLastStep();
    return;
  }

  if (isRedo) {
    e.preventDefault();
    redoNextStep();
    return;
  }

  const isCopy = isMetaPressed && lowerKey === "c";
  if (isCopy) {
    e.preventDefault();
    copySelectedNodes();
    return;
  }

  const isPaste = isMetaPressed && lowerKey === "v";
  if (isPaste) {
    e.preventDefault();
    pasteCopiedNodes();
    scheduleHistorySnapshot();
    return;
  }
  
  if (e.key === "Delete" || e.key === "Backspace") {
    e.preventDefault();
    deleteSelectedNodes();
    scheduleHistorySnapshot();
  }
};

// 处理鼠标滚轮事件，实现画布的缩放和滚动功能
const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
  if (!props.enableMouseWheelScroll) {
    return;
  }

  // 阻止默认的滚动行为
  e.evt.preventDefault();

  // 检查是否按下了 Ctrl 键，按住 Ctrl 键时进行缩放操作
  if (e.evt.ctrlKey) {
    // 获取当前缩放比例
    const oldScale = scale.value;
    // 获取鼠标在舞台上的当前位置
    const pointer = stage!.getPointerPosition()!;

    // 计算鼠标相对于舞台原点的位置（考虑当前的缩放和平移）
    const mousePointTo = {
      x: (pointer.x - stage!.x()) / oldScale,
      y: (pointer.y - stage!.y()) / oldScale,
    };

    // 设置缩放因子为 1.1（每次缩放 10%）
    const scaleBy = 1.1;
    // 根据滚轮方向计算新的缩放比例：向下滚动缩小，向上滚动放大
    let newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

    // 限制缩放比例在最小值和最大值之间
    newScale = Math.max(minScale, Math.min(maxScale, newScale));

    // 应用新的缩放比例到舞台
    stage!.scale({ x: newScale, y: newScale });

    // 计算新的舞台位置，使缩放以鼠标位置为中心
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    // 更新舞台位置
    stage!.position(newPos);
    // 更新缩放比例的响应式变量
    scale.value = newScale;

    if (aiAssistState) {
      updateAiAssistLabelScale();
    }

    // 触发 stage-transform 事件
    emit("stage-transform", {
      x: newPos.x,
      y: newPos.y,
      scale: newScale,
    });
  } else {
    // 滚动画布
    // 如果按住 Shift 键，且垂直滚动，转换为水平滚动
    let dx = e.evt.deltaX;
    let dy = e.evt.deltaY;

    if (e.evt.shiftKey && dx === 0) {
      dx = dy;
      dy = 0;
    }

    const newPos = {
      x: stage!.x() - dx,
      y: stage!.y() - dy,
    };

    stage!.position(newPos);
    stage!.batchDraw();

    // 触发 stage-transform 事件
    emit("stage-transform", {
      x: newPos.x,
      y: newPos.y,
      scale: stage!.scaleX(),
    });
  }

  updateScrollbars();
};

// 获取鼠标/触摸点在舞台坐标系中的位置
// 将屏幕坐标转换为考虑了缩放和平移后的舞台坐标
const getPointerPos = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
  // 从事件目标获取舞台对象
  const stage = e.target.getStage();
  // 如果舞台不存在，返回原点
  if (!stage) return { x: 0, y: 0 };
  // 获取舞台的绝对变换矩阵（包括缩放和平移）
  const transform = stage.getAbsoluteTransform().copy();
  // 对变换矩阵求逆，用于将屏幕坐标转换为舞台坐标
  transform.invert();
  // 获取鼠标在屏幕上的位置
  const pos = stage.getPointerPosition();
  // 如果位置不存在，返回原点
  if (!pos) return { x: 0, y: 0 };
  // 使用逆变换矩阵将屏幕坐标转换为舞台坐标
  return transform.point(pos);
};

// 处理鼠标按下事件
// 根据当前工具类型执行不同的操作：
// - text: 点击添加文字
// - pan: 开始平移画布
// - select: 开始框选或选择图形
// - brush/eraser: 开始绘制线条
const handleMouseDown = (
  e: Konva.KonvaEventObject<MouseEvent | TouchEvent>
) => {
  if (currentTool.value === "text") {
    handleTextClick(e);
    return;
  }

  if (currentTool.value === "pan") {
    isPanning.value = true;
    panStartPos = stage!.getPointerPosition()!;
    return;
  }

  if (currentTool.value === "select") {
    const clickedOnEmpty = e.target === e.target.getStage();

    // 如果 AI 辅助开启且点击了 AI 环内的区域，不进行清空操作
    let isAiRingClick = false;
    if (aiAssistState) {
      const pos = getPointerPos(e);
      const dx = pos.x - aiAssistState.centerX;
      const dy = pos.y - aiAssistState.centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (
        distance >= aiAssistState.innerRadius &&
        distance <= aiAssistState.outerRadius
      ) {
        isAiRingClick = true;
      }
    }

    if (clickedOnEmpty && !isAiRingClick) {
      // 移除 clearAiAssist() 调用，使 AI 环在点击空白处时不消失
      // clearAiAssist();
      // 先移除所有节点的选中样式
      selectedNodes.forEach((n) => removeNodeSelectStyle(n));

      selectedNodes = [];
      transformer!.nodes([]);

      isSelecting.value = true;
      selectionStartPos = getPointerPos(e);
      selectionBox!.visible(true);
      selectionBox!.width(0);
      selectionBox!.height(0);
      selectionBox!.x(selectionStartPos.x);
      selectionBox!.y(selectionStartPos.y);
      selectionBox!.moveToTop();
    }
    return;
  }

  isDrawing.value = true;
  const pos = getPointerPos(e);

  lastLine = new Konva.Line({
    stroke: currentTool.value === "eraser" ? "#ffffff" : brushColor.value,
    strokeWidth:
      currentTool.value === "eraser" ? lineWidth.value * 2 : lineWidth.value,
    globalCompositeOperation:
      currentTool.value === "eraser" ? "destination-out" : "source-over",
    lineCap: "round",
    lineJoin: "round",
    points: [pos.x, pos.y],
    draggable: true,
  });

  layer!.add(lastLine);
  updateScrollbars();
};

// 处理鼠标移动事件
// 根据当前状态执行不同的操作：
// - 平移：移动画布位置
// - 框选：更新选择框的大小和位置
// - 绘制：向线条添加新的点
const handleMouseMove = (
  e: Konva.KonvaEventObject<MouseEvent | TouchEvent>
) => {
  const pointerPos = getPointerPos(e);
  updateAiAssistInteraction(pointerPos);

  // 处理平移操作
  if (isPanning.value) {
    // 获取当前鼠标位置
    const pos = stage!.getPointerPosition()!;
    // 计算鼠标移动的偏移量
    const dx = pos.x - panStartPos.x;
    const dy = pos.y - panStartPos.y;

    // 更新舞台位置，实现画布平移
    moveStage({ x: dx, y: dy });

    // 更新起始位置为当前位置
    panStartPos = pos;
    return;
  }

  // 处理框选操作
  if (isSelecting.value) {
    // 获取鼠标在舞台坐标系中的位置
    const pos = pointerPos;

    // 计算选择框的左上角坐标（取起始点和当前点的最小值）
    const x = Math.min(selectionStartPos.x, pos.x);
    const y = Math.min(selectionStartPos.y, pos.y);
    // 计算选择框的宽度和高度
    const width = Math.abs(pos.x - selectionStartPos.x);
    const height = Math.abs(pos.y - selectionStartPos.y);

    // 更新选择框的位置和尺寸
    selectionBox!.x(x);
    selectionBox!.y(y);
    selectionBox!.width(width);
    selectionBox!.height(height);
    return;
  }

  // 如果不在绘制状态或没有当前线条，直接返回
  if (!isDrawing.value || !lastLine) return;

  // 处理绘制操作
  // 获取鼠标在舞台坐标系中的位置
  const pos = pointerPos;
  // 将新点添加到线条的点数组中
  const newPoints = lastLine.points().concat([pos.x, pos.y]);
  // 更新线条的点
  lastLine.points(newPoints);
  updateScrollbars();
};

// 处理鼠标释放事件
// 根据当前状态结束相应的操作：
// - 平移：结束平移状态
// - 框选：完成选择，选中与选择框相交的图形
// - 绘制：结束绘制状态
const handleMouseUp = () => {
  console.log("鼠标释放事件");
  if (isPanning.value) {
    isPanning.value = false;
    return;
  }

  if (isSelecting.value) {
    isSelecting.value = false;
    selectionBox!.visible(false);

    const box = selectionBox!.getClientRect();
    const shapes = layer!.getChildren();

    // 先移除所有节点的选中样式
    selectedNodes.forEach((n) => removeNodeSelectStyle(n));

    selectedNodes = [];
    shapes.forEach((shape) => {
      // 过滤掉 Transformer、选择框、AI 辅助元素以及 listening=false 的元素
      if (
        shape === transformer ||
        shape === selectionBox ||
        isAiAssistNode(shape) ||
        shape.listening() === false
      )
        return;

      const shapeBox = shape.getClientRect();
      if (haveIntersection(box, shapeBox)) {
        selectedNodes.push(shape);
      }
    });

    // 为所有选中的节点添加选中样式
    selectedNodes.forEach((n) => addNodeSelectStyle(n));

    syncTransformerSelectionState();
    selectedNodes.forEach((n) => n.moveToTop());
    transformer!.moveToTop();
    bringRelatedUngroupButtonsToTop(selectedNodes);
    return;
  }

  isDrawing.value = false;
  lastLine = null;

  // 只有在画笔或橡皮擦模式下，画完后才自动切换回选择工具
  if (currentTool.value === "brush" || currentTool.value === "eraser") {
    currentTool.value = "select";
    updateDraggableState();
  }
};

// 判断两个矩形是否相交
// 参数 r1, r2: 矩形对象，包含 x, y, width, height 属性
// 返回值: 如果两个矩形相交返回 true，否则返回 false
const haveIntersection = (r1: any, r2: any) => {
  return !(
    r2.x > r1.x + r1.width ||
    r2.x + r2.width < r1.x ||
    r2.y > r1.y + r1.height ||
    r2.y + r2.height < r1.y
  );
};

// 选中 group 后，确保悬浮 Ungroup 按钮位于 transformer 之上，避免被遮挡无法点击。
const bringRelatedUngroupButtonsToTop = (nodes: Konva.Node[] = []) => {
  if (!layer || !Array.isArray(nodes) || nodes.length === 0) return;

  const groupIds = new Set<string>();
  nodes.forEach((node) => {
    if (node instanceof Konva.Group && node.getAttr("customType") === "group") {
      const id = node.id?.();
      if (id) groupIds.add(id);
      return;
    }

    if (node?.name?.() === "group-bg") {
      const parent = node.getParent();
      if (parent instanceof Konva.Group && parent.getAttr("customType") === "group") {
        const id = parent.id?.();
        if (id) groupIds.add(id);
      }
    }
  });

  if (groupIds.size === 0) return;

  const floatingBtns = layer.find(".group-ungroup-btn");
  floatingBtns.forEach((btn: Konva.Node) => {
    const targetGroupId = String(btn.getAttr("targetGroupId") || "");
    if (groupIds.has(targetGroupId)) {
      btn.moveToTop();
    }
  });
};

const syncTransformerSelectionState = () => {
  if (!transformer) return;

  transformer.nodes(selectedNodes);

  // 只在多选时启用整块覆盖命中区，避免遮住单个文本的双击编辑。
  transformer.shouldOverdrawWholeArea(selectedNodes.length > 1);

  if (selectedNodes.length === 1 && selectedNodes[0] instanceof Konva.Text) {
    transformer.enabledAnchors(["middle-left", "middle-right"]);
  } else {
    transformer.enabledAnchors(["top-left", "top-right", "bottom-left", "bottom-right"]);
  }
};

// 处理节点点击事件
// 用于选中图形，支持单选和多选（按住 Shift/Ctrl/Meta 键）
// 参数 e: 事件对象
// 参数 node: 被点击的节点
const handleNodeClick = (
  e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  node: Konva.Node
) => {
  clearAiAssist();
  // 如果当前是平移模式，不处理节点点击事件
  if (currentTool.value === "pan") {
    return;
  }

  // 阻止事件冒泡，避免触发其他点击事件
  e.cancelBubble = true;

  // AI 辅助环及其子节点不进入普通单选/多选逻辑。
  if (isAiAssistNode(node) || isAiAssistNode(e.target as Konva.Node)) {
    return;
  }

  // 只按绑定时传入的节点选中；对于 Group，不再穿透选中子节点
  const targetNode: Konva.Node = node;

  // 检查是否按下了修饰键（Shift、Ctrl 或 Meta），用于多选
  const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;

  // 如果没有按下修饰键，执行单选操作
  if (!metaPressed) {
    // 先移除所有节点的选中样式
    selectedNodes.forEach((n) => removeNodeSelectStyle(n));

    // 如果点击的节点不在已选列表中，则只选中该节点
    if (selectedNodes.indexOf(targetNode) === -1) {
      selectedNodes = [targetNode];
    } else {
      // 如果点击的节点已在已选列表中，保持选中
      selectedNodes = [targetNode];
    }
  } else {
    // 如果按下了修饰键，执行多选/取消选择操作
    const isSelected = selectedNodes.indexOf(targetNode) >= 0;
    if (!isSelected) {
      // 如果节点未被选中，则添加到选中列表
      selectedNodes.push(targetNode);
    } else {
      // 如果节点已被选中，则从选中列表中移除
      selectedNodes.splice(selectedNodes.indexOf(targetNode), 1);
    }
  }

  // 为所有选中的节点添加选中样式
  selectedNodes.forEach((n) => addNodeSelectStyle(n));

  syncTransformerSelectionState();
  
  // 将所有选中的节点移到图层顶部
  selectedNodes.forEach((n) => n.moveToTop());
  // 将变换器移到最顶部，确保选择框可见
  transformer!.moveToTop();
  bringRelatedUngroupButtonsToTop(selectedNodes);
};

// 封装节点阴影设置方法
const setNodeShadow = (node: Konva.Node, isSelected: boolean) => {
  // 连线（Arrow/Line）不处理
  if (node instanceof Konva.Arrow || node instanceof Konva.Line) {
    return;
  }

  const applyShadow = (n: Konva.Node) => {
    // 仅对 Shape 处理，避免 Group/Node 运行时报错
    if (!(n instanceof Konva.Shape)) {
      return;
    }

    // Whisper 高亮优先级高于选中样式，跳过覆盖
    if (n.getAttr("_whisperActive")) {
      return;
    }

    if (isSelected) {
      if (!n.getAttr("_originalShadowColor")) {
        n.setAttr("_originalShadowColor", n.shadowColor());
        n.setAttr("_originalShadowBlur", n.shadowBlur());
        n.setAttr("_originalShadowOffset", n.shadowOffset());
        n.setAttr("_originalShadowOpacity", n.shadowOpacity());
      }
      n.shadowColor("#1890ff");
      n.shadowBlur(10);
      n.shadowOffset({ x: 0, y: 0 });
      n.shadowOpacity(0.3);
    } else {
      n.shadowColor(n.getAttr("_originalShadowColor") || undefined);
      n.shadowBlur(n.getAttr("_originalShadowBlur") || 0);
      n.shadowOffset(n.getAttr("_originalShadowOffset") || { x: 0, y: 0 });
      n.shadowOpacity(n.getAttr("_originalShadowOpacity") || 0);
    }
  };

  if (node instanceof Konva.Group) {
    node.getChildren().forEach((child) => {
      if (child instanceof Konva.Arrow || child instanceof Konva.Line) {
        return;
      }
      if (String(child.name?.() || "") === "segment-group-frame") {
        return;
      }
      applyShadow(child);
    });
    return;
  }

  applyShadow(node);
};

// 为节点添加选中样式
const addNodeSelectStyle = (node: Konva.Node) => {
  setNodeShadow(node, true);
};

// 移除节点的选中样式
const removeNodeSelectStyle = (node: Konva.Node) => {
  setNodeShadow(node, false);
};

/**
 * 为 segment 节点应用/移除 Whisper 高亮（白色描边 + 红色阴影）。
 * Whisper 样式优先级高于选中样式；移除时若节点仍在选中态则重新补回选中阴影。
 */
const setWhisperHighlight = (node: Konva.Node | null, enable: boolean) => {
  if (!node) return;

  const applyHighlight = (n: Konva.Node) => {
    if (!(n instanceof Konva.Shape)) return;

    if (enable) {
      n.setAttr("_whisperActive", true);
      n.setAttr("_whisperOrigStroke", n.stroke());
      n.setAttr("_whisperOrigStrokeWidth", n.strokeWidth());
      n.setAttr("_whisperOrigShadowColor", n.shadowColor());
      n.setAttr("_whisperOrigShadowBlur", n.shadowBlur());
      n.setAttr("_whisperOrigShadowOffset", n.shadowOffset());
      n.setAttr("_whisperOrigShadowOpacity", n.shadowOpacity());
      n.stroke("white");
      n.strokeWidth(6);
      n.shadowColor("red");
      n.shadowBlur(24);
      n.shadowOffset({ x: 0, y: 0 });
      n.shadowOpacity(0.75);
    } else {
      n.stroke(n.getAttr("_whisperOrigStroke") ?? null);
      n.strokeWidth(n.getAttr("_whisperOrigStrokeWidth") ?? 0);
      n.shadowColor(n.getAttr("_whisperOrigShadowColor") ?? undefined);
      n.shadowBlur(n.getAttr("_whisperOrigShadowBlur") ?? 0);
      n.shadowOffset(n.getAttr("_whisperOrigShadowOffset") ?? { x: 0, y: 0 });
      n.shadowOpacity(n.getAttr("_whisperOrigShadowOpacity") ?? 0);
      n.setAttr("_whisperActive", undefined);
      n.setAttr("_whisperOrigStroke", undefined);
      n.setAttr("_whisperOrigStrokeWidth", undefined);
      n.setAttr("_whisperOrigShadowColor", undefined);
      n.setAttr("_whisperOrigShadowBlur", undefined);
      n.setAttr("_whisperOrigShadowOffset", undefined);
      n.setAttr("_whisperOrigShadowOpacity", undefined);
    }
  };

  if (node instanceof Konva.Group) {
    node.getChildren().forEach((child) => {
      if (child instanceof Konva.Arrow || child instanceof Konva.Line) return;
      if (String(child.name?.() || "") === "segment-group-frame") return;
      applyHighlight(child);
    });
  } else {
    applyHighlight(node);
  }

  // 移除高亮后，按当前真实选中状态重算阴影，避免残留上一次选中样式
  if (!enable) {
    setNodeShadow(node, selectedNodes.includes(node));
  }

  node.getLayer()?.batchDraw();
};

// 处理文字添加事件
// 在画布上点击位置添加文字
// 参数 e: 事件对象
const handleTextClick = (
  e: Konva.KonvaEventObject<MouseEvent | TouchEvent>
) => {
  // 获取点击位置在舞台坐标系中的坐标
  const pos = getPointerPos(e);

  // 直接创建空的文本节点
  const defaultText = "";
  const textNode = new Konva.Text({
    x: pos.x,
    y: pos.y,
    text: defaultText,
    fontSize: fontSize.value,
    fontFamily: DEFAULT_FONT_FAMILY,
    fill: brushColor.value,
    draggable: true,
    width: 200, // 设置一个具体的基础宽度
    wrap: "word", // 按单词换行
  });

  // 将文字节点添加到图层
  layer!.add(textNode);
  currentTool.value = "select";

  // 恢复光标状态
  stage?.container().style.setProperty("cursor", "default", "important");

  // 选中新创建的文字节点
  selectedNodes = [textNode];
  syncTransformerSelectionState();
  textNode.moveToTop();
  transformer!.moveToTop();
  addNodeSelectStyle(textNode);
  layer!.batchDraw();

  // 保持文字工具模式，方便继续添加文字
  // 不自动切换回选择工具
  setTimeout(() => {
    enterTextEditMode(textNode);
  }, 100);
};

// 处理双击事件
// 用于编辑已存在的文字内容
// 参数 e: 事件对象
const resolveEditableTextNode = (node?: Konva.Node | null): Konva.Text | null => {
  if (!node) return null;

  if (node instanceof Konva.Text) {
    return node;
  }

  const nodeName = String(node.name?.() || "");

  if (nodeName === "group-meaning-bg") {
    const parent = node.getParent();
    const textNode = parent?.findOne?.(".group-meaning-text");
    return textNode instanceof Konva.Text ? textNode : null;
  }

  if (node instanceof Konva.Group) {
    const directTextChild = node.getChildren().find((child: Konva.Node) => child instanceof Konva.Text);
    return directTextChild instanceof Konva.Text ? directTextChild : null;
  }

  const parent = node.getParent();
  if (parent instanceof Konva.Group) {
    const directTextChild = parent.getChildren().find((child: Konva.Node) => child instanceof Konva.Text);
    return directTextChild instanceof Konva.Text ? directTextChild : null;
  }

  return null;
};

const handleDoubleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
  const editableTextNode =
    resolveEditableTextNode(e.target) ||
    (selectedNodes.length === 1 ? resolveEditableTextNode(selectedNodes[0]) : null);
  if (editableTextNode) {
    enterTextEditMode(editableTextNode);
  }
};

// 进入文字编辑模式
const enterTextEditMode = (textNodeKonva: Konva.Text) => {
  const stage = textNodeKonva.getStage();
  if (!stage) return;
  const isGroupMeaningText = textNodeKonva?.name?.() === "group-meaning-text";

  const textarea = document.createElement("textarea");
  document.body.appendChild(textarea);

  textarea.value = textNodeKonva.text();
  textarea.style.position = "fixed";
  textarea.style.width =
    (textNodeKonva.width() || 200) - textNodeKonva.padding() * 2 + "px";
  // 确保初始高度，即使文字为空也有一行高度
  const initialHeight = textNodeKonva.text() ? textNodeKonva.height() : textNodeKonva.fontSize() * 1.2;
  textarea.style.height =
    initialHeight - textNodeKonva.padding() * 2 + 5 + "px";
  textarea.style.fontSize = textNodeKonva.fontSize() + "px";
  textarea.style.border = "1px solid #1890ff"; // 添加边框更容易看见
  textarea.style.padding = "0px";
  textarea.style.margin = "0px";
  textarea.style.overflow = "hidden";
  textarea.style.background = "white"; // 背景全白
  textarea.style.outline = "none";
  textarea.style.resize = "none";
  textarea.style.lineHeight = textNodeKonva.lineHeight().toString();
  textarea.style.fontFamily = textNodeKonva.fontFamily();
  textarea.style.transformOrigin = "left top";
  textarea.style.textAlign = textNodeKonva.align();
  textarea.style.color = textNodeKonva.fill().toString();
  textarea.style.zIndex = "1001";

  const syncTextareaTransform = () => {
    const stageBox = stage.container().getBoundingClientRect();
    const stageScaleX = stage.scaleX() || 1;
    const stageScaleY = stage.scaleY() || 1;
    const absScale = textNodeKonva.getAbsoluteScale();
    const nodeScaleX = absScale.x / stageScaleX;
    const nodeScaleY = absScale.y / stageScaleY;
    const textPosition = textNodeKonva.getAbsolutePosition(stage);
    // Whisper 文本会以中心点作为 offset，编辑器定位需要换算为可见文本左上角
    const textTopLeft = {
      x: textPosition.x - textNodeKonva.offsetX() * nodeScaleX,
      y: textPosition.y - textNodeKonva.offsetY() * nodeScaleY,
    };
    const areaPosition = {
      x: stageBox.left + stage.x() + textTopLeft.x * stageScaleX,
      y: stageBox.top + stage.y() + textTopLeft.y * stageScaleY,
    };

    textarea.style.left = areaPosition.x + "px";
    textarea.style.top = areaPosition.y + "px";

    const rotation = textNodeKonva.getAbsoluteRotation();
    let transform = "";
    if (rotation) {
      transform += `rotateZ(${rotation}deg) `;
    }
    transform += `scaleX(${absScale.x}) scaleY(${absScale.y})`;
    textarea.style.transform = transform;
    textarea.style.transformOrigin = "left top";
  };

  syncTextareaTransform();

  // 使用 setTimeout 确保 DOM 渲染后再 focus
  setTimeout(() => {
    textarea.focus();
    textarea.style.height = "auto";
    textarea.style.height = (textarea.scrollHeight || initialHeight) + 3 + "px";
  }, 0);

  textNodeKonva.visible(false);

  let isRemoving = false;

  const handleViewportOrStageChange = () => {
    if (isRemoving) return;
    syncTextareaTransform();
  };

  const resizeGroupMeaningBg = () => {
    if (!isGroupMeaningText) {
      return;
    }

    const parent = textNodeKonva.getParent();
    if (!(parent instanceof Konva.Group)) {
      return;
    }

    const bg = parent.findOne(".group-meaning-bg") as Konva.Rect | null;
    if (!bg) {
      return;
    }

    const minHeight = 24;
    bg.height(Math.max(minHeight, textNodeKonva.height() + 8));
    parent.getLayer?.()?.batchDraw?.();
  };

  function removeTextarea() {
    if (isRemoving) return;
    isRemoving = true;
    if (textarea.parentNode) {
      textarea.parentNode.removeChild(textarea);
    }
    stage.off("xChange.textEdit", handleViewportOrStageChange);
    stage.off("yChange.textEdit", handleViewportOrStageChange);
    stage.off("scaleXChange.textEdit", handleViewportOrStageChange);
    stage.off("scaleYChange.textEdit", handleViewportOrStageChange);
    stage.off("rotationChange.textEdit", handleViewportOrStageChange);
    textNodeKonva.off("xChange.textEdit", handleViewportOrStageChange);
    textNodeKonva.off("yChange.textEdit", handleViewportOrStageChange);
    textNodeKonva.off("scaleXChange.textEdit", handleViewportOrStageChange);
    textNodeKonva.off("scaleYChange.textEdit", handleViewportOrStageChange);
    textNodeKonva.off("rotationChange.textEdit", handleViewportOrStageChange);
    textNodeKonva.off("offsetXChange.textEdit", handleViewportOrStageChange);
    textNodeKonva.off("offsetYChange.textEdit", handleViewportOrStageChange);
    window.removeEventListener("resize", handleViewportOrStageChange);
    window.removeEventListener("scroll", handleViewportOrStageChange, true);
    window.removeEventListener("mousedown", handleOutsideClick);
    window.removeEventListener("touchstart", handleOutsideClick);
    textNodeKonva.visible(true);
    // 文本编辑结束后补一次历史快照，确保文字修改可撤回/重做。
    scheduleHistorySnapshot();
  }

  function setTextareaWidth(newWidth: number) {
    if (!newWidth) {
      newWidth = Math.max((textNodeKonva.text() || "").length * textNodeKonva.fontSize(), textNodeKonva.width(), 200);
    }
    textarea.style.width = newWidth + "px";
  }

  textarea.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      textNodeKonva.text(textarea.value);
      resizeGroupMeaningBg();
      removeTextarea();
      if (!isGroupMeaningText && !textarea.value.trim()) {
        textNodeKonva.destroy();
        transformer!.nodes([]);
      }
    }
    if (e.key === "Escape") {
      textNodeKonva.text(textarea.value);
      resizeGroupMeaningBg();
      removeTextarea();
      if (!isGroupMeaningText && !textarea.value.trim()) {
        textNodeKonva.destroy();
        transformer!.nodes([]);
      }
    }
  });

  textarea.addEventListener("input", function () {
    setTextareaWidth(textNodeKonva.width());
    textarea.style.height = "auto";
    textarea.style.height =
      textarea.scrollHeight + textNodeKonva.fontSize() + "px";
  });

  function handleOutsideClick(e: MouseEvent | TouchEvent) {
    if (e.target !== textarea) {
      textNodeKonva.text(textarea.value);
      resizeGroupMeaningBg();
      removeTextarea();
      if (!isGroupMeaningText && !textarea.value.trim()) {
        textNodeKonva.destroy();
        transformer!.nodes([]);
      }
    }
  }

  stage.on("xChange.textEdit", handleViewportOrStageChange);
  stage.on("yChange.textEdit", handleViewportOrStageChange);
  stage.on("scaleXChange.textEdit", handleViewportOrStageChange);
  stage.on("scaleYChange.textEdit", handleViewportOrStageChange);
  stage.on("rotationChange.textEdit", handleViewportOrStageChange);
  textNodeKonva.on("xChange.textEdit", handleViewportOrStageChange);
  textNodeKonva.on("yChange.textEdit", handleViewportOrStageChange);
  textNodeKonva.on("scaleXChange.textEdit", handleViewportOrStageChange);
  textNodeKonva.on("scaleYChange.textEdit", handleViewportOrStageChange);
  textNodeKonva.on("rotationChange.textEdit", handleViewportOrStageChange);
  textNodeKonva.on("offsetXChange.textEdit", handleViewportOrStageChange);
  textNodeKonva.on("offsetYChange.textEdit", handleViewportOrStageChange);
  window.addEventListener("resize", handleViewportOrStageChange);
  window.addEventListener("scroll", handleViewportOrStageChange, true);
  
  // 使用 setTimeout 并在 mousedown 事件处理点击外部，避免因 click 冒泡直接触发
  setTimeout(() => {
    window.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("touchstart", handleOutsideClick);
  }, 100);
};

// 触发图片上传
// 设置当前工具为图片模式，并触发隐藏的文件输入框
const triggerImageUpload = () => {
  currentTool.value = "image";
  imageInput.value?.click();
};

// 处理图片上传事件
// 读取用户选择的图片文件，调整大小后添加到画布中心
// 参数 e: 文件输入框的 change 事件对象
const handleImageUpload = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const imgObj = new Image();
    imgObj.onload = () => {
      const stageWidth = stage!.width();
      const stageHeight = stage!.height();

      let width = imgObj.width;
      let height = imgObj.height;

      // 如果图片宽度超过舞台宽度的 80%，按比例缩小
      if (width > stageWidth * 0.8) {
        const ratio = (stageWidth * 0.8) / width;
        width = stageWidth * 0.8;
        height = height * ratio;
      }

      // 如果图片高度超过舞台高度的 80%，按比例缩小
      if (height > stageHeight * 0.8) {
        const ratio = (stageHeight * 0.8) / height;
        height = stageHeight * 0.8;
        width = width * ratio;
      }

      // 创建 Konva 图片对象，放置在画布中心
      const konvaImage = new Konva.Image({
        image: imgObj,
        x: (stageWidth - width) / 2,
        y: (stageHeight - height) / 2,
        width: width,
        height: height,
        draggable: true,
      });

      // 将图片添加到图层
      layer!.add(konvaImage);
      // 选中刚添加的图片
      selectedNodes = [konvaImage];
      syncTransformerSelectionState();
      // 将图片和变换器移到最上层
      konvaImage.moveToTop();
      transformer!.moveToTop();

      // 清空文件输入框，允许重复上传同一文件
      target.value = "";

      // 添加完图片后，自动切换回选择工具
      currentTool.value = "select";
      // 更新节点的可拖拽状态
      updateDraggableState();
    };
    imgObj.src = event.target?.result as string;
  };
  reader.readAsDataURL(file);
};

// 设置当前工具
// 参数 tool: 工具类型，包括选择、画笔、橡皮擦、文字、图片、平移
const setTool = (
  tool: "select" | "brush" | "eraser" | "text" | "image" | "pan"
) => {
  currentTool.value = tool;
  if (tool !== "select") {
    clearAiAssist();
  }
  // 如果切换到非选择工具，清空选中节点并移除选中样式
  if (tool !== "select" && transformer) {
    selectedNodes.forEach((n) => removeNodeSelectStyle(n));
    selectedNodes = [];
    syncTransformerSelectionState();
  }
  
  // 设置鼠标指针样式
  if (stage) {
    if (tool === "text") {
      stage.container().style.cursor = "text";
    } else if (tool === "pan") {
      stage.container().style.cursor = "grab";
    } else {
      stage.container().style.cursor = "default";
    }
  }
  
  // 更新所有节点的可拖拽状态
  updateDraggableState();
};

// 更新节点的可拖拽状态
// 只有在选择模式下，节点才可拖拽
const updateDraggableState = () => {
  if (!layer) return;

  const children = layer.getChildren();
  const isSelectMode = currentTool.value === "select";

  children.forEach((child) => {
    if (child?.name?.() === "group-ungroup-btn") {
      child.draggable(false);
      child.listening(true);
      return;
    }

    if (child instanceof Konva.Group && child.getAttr("customType") === "group") {
      child.draggable(isSelectMode);

      const groupChildren = child.getChildren();
      groupChildren.forEach((groupChild: Konva.Node) => {
        if (groupChild?.name?.() === "group-bg") {
          groupChild.draggable(false);
          groupChild.listening(true);
          return;
        }

        if (
          groupChild?.name?.() === "group-meaning-text" ||
          groupChild?.name?.() === "group-meaning-bg"
        ) {
          groupChild.draggable(false);
          groupChild.listening(true);
          return;
        }

        groupChild.draggable(isSelectMode);
        groupChild.listening(true);
      });
      return;
    }

    child.draggable(isSelectMode);
  });
};

// 删除当前选中的所有节点
// 清空选中列表并重置变换器
const deleteSelectedNodes = () => {
  if (selectedNodes.length === 0) return;
  if (!isCurrentCanvasLastClicked) {
    console.warn("Delete blocked: last pointer action was not on current canvas.");
    return;
  }

  clearAiAssist();
  selectedNodes.forEach((node) => {
    node.destroy();
  });

  selectedNodes = [];
  transformer!.nodes([]);
};

// 重置视图到初始状态
// 将缩放比例设置为 1，位置设置为原点
const resetView = () => {
  stage!.scale({ x: 1, y: 1 });
  stage!.position({ x: 0, y: 0 });
  scale.value = 1;
};

// 导出画布内容为图片
// 计算所有图形的边界，调整画布大小以适应内容，然后导出为 PNG 格式
const exportCanvas = () => {
  // 获取图层中的所有子节点
  const children = layer!.getChildren();
  if (children.length === 0) return;

  // 过滤掉变换器和选择框，只保留实际的图形节点
  const nodes = children.filter((n) => n !== transformer && n !== selectionBox);
  if (nodes.length === 0) return;

  // 保存当前的舞台状态（缩放、位置、尺寸）
  const oldScale = stage!.scale();
  const oldPosition = stage!.position();
  const oldWidth = stage!.width();
  const oldHeight = stage!.height();

  // 重置舞台的缩放和位置，以便计算准确的边界
  stage!.scale({ x: 1, y: 1 });
  stage!.position({ x: 0, y: 0 });

  // 计算所有图形的边界矩形
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach((node) => {
    const box = node.getClientRect();
    minX = Math.min(minX, box.x);
    minY = Math.min(minY, box.y);
    maxX = Math.max(maxX, box.x + box.width);
    maxY = Math.max(maxY, box.y + box.height);
  });

  // 添加内边距，使导出的图片周围有留白
  const padding = 20;
  const contentWidth = maxX - minX + padding * 2;
  const contentHeight = maxY - minY + padding * 2;

  // 调整舞台大小以适应内容
  stage!.width(contentWidth);
  stage!.height(contentHeight);

  // 计算偏移量，将图形移动到画布中心
  const offsetX = -minX + padding;
  const offsetY = -minY + padding;

  // 临时移动所有节点到新位置
  nodes.forEach((node) => {
    const oldX = node.x();
    const oldY = node.y();
    node.x(oldX + offsetX);
    node.y(oldY + offsetY);
  });

  // 生成图片数据，使用 2 倍像素比以提高清晰度
  const dataURL = stage!.toDataURL({ pixelRatio: 2 });

  // 恢复所有节点的原始位置
  nodes.forEach((node) => {
    const oldX = node.x();
    const oldY = node.y();
    node.x(oldX - offsetX);
    node.y(oldY - offsetY);
  });

  // 恢复舞台的原始状态
  stage!.scale(oldScale);
  stage!.position(oldPosition);
  stage!.width(oldWidth);
  stage!.height(oldHeight);

  return dataURL;

  // 创建下载链接并触发下载
  const link = document.createElement("a");
  link.download = `canvas_${Date.now()}.png`;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 导出画布中所有元素的详细信息到控制台
const exportElementInfo = () => {
  if (!layer) {
    console.log("图层不存在");
    return;
  }

  const children = layer.getChildren();
  if (children.length === 0) {
    console.log("画布中没有元素");
    return;
  }

  const nodes = children.filter((n) => {
    // 过滤掉变换器、选择框、AI 引导线和 AI 环
    return (
      n !== transformer &&
      n !== selectionBox &&
      n !== aiGuideLine &&
      !aiRingSlices.includes(n) &&
      n.name() !== "hover-action-btn" // 过滤掉悬浮按钮
    );
  });

  return resetNodesData(nodes);
};

// 将传入的 Konva 节点序列化为可安全透传/持久化的 JSON 快照。
// 额外补充 imageSrc，避免后续仅凭 toJSON 丢失图片来源信息。
const resetNodesData = (nodes) => {
  return nodes.map((node) => {
    const json = JSON.parse(node.toJSON());

    // 如果是 Image 节点，手动添加 src 信息
    if (node instanceof Konva.Image) {
      const img = node.image();
      if (img && img instanceof HTMLImageElement) {
        json.attrs.imageSrc = img.src;
      }
    } else if (node instanceof Konva.Group) {
      // Group 节点需要递归遍历 children，同步补齐嵌套图片的 imageSrc。
      const processGroup = (groupNode: any, groupJson: any) => {
        if (groupJson.children) {
          groupJson.children.forEach((childJson: any, index: number) => {
            const childNode = groupNode.children[index];
            if (childNode instanceof Konva.Image) {
              const img = childNode.image();
              if (img && img instanceof HTMLImageElement) {
                childJson.attrs.imageSrc = img.src;
              }
            } else if (childNode instanceof Konva.Group) {
              processGroup(childNode, childJson);
            }
          });
        }
      };
      processGroup(node, json);
    }

    return json;
  });
};

// 获取节点的详细信息
const getNodeInfo = (node: Konva.Node, index: number) => {
  console.log("node", node);
  const nodeInfo = {
    index: index + 1,
    type: node.className,
    id: node.id() || "未设置",
    position: {
      x: node.x(),
      y: node.y(),
    },
    size: {
      width: node.width(),
      height: node.height(),
    },
    rotation: node.rotation(),
    scale: {
      x: node.scaleX(),
      y: node.scaleY(),
    },
    draggable: node.draggable(),
    visible: node.visible(),
    opacity: node.opacity(),
  };

  if (node instanceof Konva.Image) {
    nodeInfo["imageInfo"] = {
      src: (node.image() as HTMLImageElement)?.src || "",
      originalWidth: node.image()?.width || 0,
      originalHeight: node.image()?.height || 0,
    };
  } else if (node instanceof Konva.Text) {
    nodeInfo["textInfo"] = {
      content: node.text(),
      fontSize: node.fontSize(),
      fontFamily: node.fontFamily(),
      color: node.fill(),
    };
  } else if (node instanceof Konva.Line) {
    nodeInfo["lineInfo"] = {
      pointCount: node.points().length / 2,
      color: node.stroke(),
      strokeWidth: node.strokeWidth(),
      lineCap: node.lineCap(),
      lineJoin: node.lineJoin(),
    };
  } else if (node instanceof Konva.Rect) {
    nodeInfo["rectInfo"] = {
      fill: node.fill(),
      stroke: node.stroke(),
      strokeWidth: node.strokeWidth(),
      cornerRadius: node.cornerRadius(),
    };
  }

  return nodeInfo;
};

// 获取当前选中的节点详细信息
const getSelectedNodes = () => {
  if (selectedNodes.length === 0) {
    console.log("当前没有选中的节点");
    return [];
  }

  // const nodesData = selectedNodes.map((node, index) => {
  //     const nodeInfo = getNodeInfo(node, index)
  //     console.log(`选中节点 ${index + 1}:`, nodeInfo)
  //     return nodeInfo
  // })

  return selectedNodes;
};

// 将选中的节点发送给父元素
const sendSelectedNodesToParent = () => {
  if (selectedNodes.length === 0) {
    console.log("当前没有选中的节点");
    return;
  }

  const nodesData = selectedNodes.map((node, index) => {
    return getNodeInfo(node, index);
  });

  emit("sendSelectedNodes", nodesData);
  console.log("已将选中的节点发送给父元素:", nodesData);
};

// 清除画布
// 删除图层中的所有节点，包括图形、文字、图片等
const clearCanvas = () => {
  clearAiAssist();
  layer!.destroyChildren();
};

// 处理拖拽悬停事件
// 当拖拽元素进入画布区域时触发，设置拖拽效果为复制
const handleDragOver = (e: DragEvent) => {
  e.preventDefault();
  e.dataTransfer!.dropEffect = "copy";
};

// 处理拖拽放置事件
// 当拖拽的图片被放置到画布上时触发，创建Konva图片对象并添加到画布
const handleDrop = (e: DragEvent) => {
  e.preventDefault();

  // 切换到选择模式
  currentTool.value = "select";

  // 获取拖拽数据
  const dragDataStr = e.dataTransfer!.getData("dragData");
  if (!dragDataStr) {
    return;
  }

  // 解析拖拽数据（数组格式）
  const dragDataArray = JSON.parse(dragDataStr);
  console.log("拖拽数据:", dragDataArray);

  // 遍历数组中的每个数据项
  dragDataArray.forEach((dragData: any) => {
    // 根据拖拽类型处理
    if (dragData.dragType === "single-image") {
      const imgSrc = dragData.imageSrc;
      const id = dragData.id || "";
      const text = dragData.text || "";

      if (!imgSrc) {
        return;
      }
      const dropPos = getDropPosition(e);
      createImageAndTextNodes(
        { imageSrc: imgSrc, text, id },
        { startX: dropPos.x, startY: dropPos.y, center: true }
      )
        .then((nodes) => {
          nodes.forEach((node) => {
            if (node instanceof Konva.Image) {
            } else if (node instanceof Konva.Text) {
              const imageNode = nodes[0] as Konva.Image;
            }

            layer!.add(node);
          });

          // // 选中刚添加的图片
          // selectedNodes = nodes;
          // // 将图片和变换器移到最上层
          // transformer!.nodes(selectedNodes);
          // nodes.forEach((node) => {
          //   node.moveToTop();
          // });
          // transformer!.moveToTop();

          // 添加完图片后，自动切换回选择工具
          currentTool.value = "select";
          // 更新节点的可拖拽状态
          updateDraggableState();

          // 判断是否有interpretations
          if (dragData.interpretations) {
            const imageNode = nodes[0] as Konva.Image;
            const imageX = dropPos.x - imageNode.width() / 2;
            const imageY = dropPos.y - imageNode.height() / 2;
            const maxDimension = Math.max(
              imageNode.width(),
              imageNode.height()
            );

            createInterpretationTextNodes(dragData.interpretations, {
              imageX,
              imageY,
              imageWidth: imageNode.width(),
              imageHeight: imageNode.height(),
              radius: maxDimension * 0.5 + 30,
              startAngle: -Math.PI / 8,
              endAngle: Math.PI / 8,
              fontSize: 12,
              fill: "#666666",
            })
              .then((interpretationNodes) => {
                interpretationNodes.forEach((interpretationNode) => {
                  layer!.add(interpretationNode);
                });
                setTimeout(() => updateScrollbars(), 1000);
              })
              .catch((error) => {
                console.error(
                  "Failed to create interpretation text nodes:",
                  error
                );
              });
          }

          setTimeout(() => updateScrollbars(), 1000);
        })
        .catch((error) => {
          console.error("Failed to create image and text nodes:", error);
        });
    } else if (dragData.dragType === "text") {
      const textContent = dragData.textContent;
      const id = dragData.id || "";
      if (!textContent) {
        return;
      }

      const dropPos = getDropPosition(e);

      createTextNode(
        { text: textContent, id, customType: "bubble" },
        {
          startX: dropPos.x,
          startY: dropPos.y,
          ...dragData.style,
          center: true,
          isBubble: false,
          align: "center",
          width: 60,
        }
      )
        .then((konvaText) => {
          layer!.add(konvaText);
          // // 选中刚添加的文本
          // selectedNodes = [konvaText];
          // // 将文本和变换器移到最上层
          // transformer!.nodes(selectedNodes);
          // konvaText.moveToTop();
          // transformer!.moveToTop();

          // 添加完文本后，自动切换回选择工具
          currentTool.value = "select";
          // 更新节点的可拖拽状态
          updateDraggableState();
          setTimeout(() => updateScrollbars(), 1000);
        })
        .catch((error) => {
          console.error("Failed to create text node:", error);
        });
    } else if (dragData.dragType === "PCM") {
      const item = dragData.data;
      if (!item) {
        return;
      }
      const dropPos = getDropPosition(e);
      addPCMAtPosition(item, dropPos);
    } else if (dragData.dragType === "segment-image") {
      const dropPos = getDropPosition(e);
      const segment = dragData.segment;
      console.log("dropPos:", dropPos);
      console.log("segment.layout:", segment.layout);
      console.log("segment.layout x,y:", segment.layout?.x, segment.layout?.y);
      console.log(
        "segment.layout cx,cy:",
        segment.layout?.cx,
        segment.layout?.cy
      );
      initSegmentImagesItem(segment, {
        offsetX: dropPos.x - (segment.layout?.cx || segment.layout?.x || 0),
        offsetY: dropPos.y - (segment.layout?.cy || segment.layout?.y || 0),
        initBubbles: true,
      }).then((result) => {
        console.log("created nodes:", result);
        result.images.forEach((node) => {
          console.log("image node position:", node.x(), node.y());
        });
        const nodes = [...result.images, ...result.bubbles];
        nodes.forEach((node) => {
          layer!.add(node);
        });
        setTimeout(() => updateScrollbars(), 1000);
      });
    }
  });
};

// 获取拖拽位置在舞台坐标系中的坐标
// 将屏幕坐标转换为考虑了缩放和平移后的舞台坐标
const getDropPosition = (e: DragEvent) => {
  // 获取画布容器的边界矩形
  const rect = container.value!.getBoundingClientRect();
  // 计算鼠标相对于容器的坐标
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // 获取舞台的绝对变换矩阵（包括缩放和平移）
  const transform = stage!.getAbsoluteTransform().copy();
  // 对变换矩阵求逆，用于将屏幕坐标转换为舞台坐标
  transform.invert();

  // 使用逆变换矩阵将屏幕坐标转换为舞台坐标
  return transform.point({ x, y });
};

// 将别的 canvas 的节点（多个）复制到当前画布中心，垂直水平居中
const clearNodeListenersDeep = (node: Konva.Node) => {
  if (!node) return;
  node.off();

  if (node instanceof Konva.Group) {
    node.getChildren().forEach((child: Konva.Node) => {
      clearNodeListenersDeep(child);
    });
  }
};

const renderNodes = (nodesData) => {
  console.log("nodesData:", nodesData);
  if (!layer || !nodesData || nodesData.length === 0) return;

  const isKonvaNodes = nodesData[0] instanceof Konva.Node;
  if (!isKonvaNodes) return;

  const canvasWidth = stage.width();
  const canvasHeight = stage.height();

  // 先克隆所有节点（不添加到画布）
  const clonedNodes = [];
  nodesData.forEach((node, index) => {
    const clonedNode = node.clone({
      id: node.id(),
    });
    // 清理克隆节点及其所有子节点上的旧事件，避免点击回流到来源画布实例。
    clearNodeListenersDeep(clonedNode);
    // 移除选中阴影
    removeNodeSelectStyle(clonedNode);
    clonedNodes.push(clonedNode);
  });

  // 计算克隆节点的边界
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  clonedNodes.forEach((node) => {
    const rect = node.getClientRect();
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height);
  });

  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;
  const padding = 40;

  // 计算缩放比例
  const fitScaleX = (canvasWidth - padding * 2) / contentWidth;
  const fitScaleY = (canvasHeight - padding * 2) / contentHeight;
  const fitScale = Math.min(fitScaleX, fitScaleY, 1);

  // 计算偏移量，使内容居中
  const fitOffsetX =
    (canvasWidth - contentWidth * fitScale) / 2 - minX * fitScale;
  const fitOffsetY =
    (canvasHeight - contentHeight * fitScale) / 2 - minY * fitScale;

  // 应用缩放和偏移，然后添加到画布
  clonedNodes.forEach((node) => {
    node.x(node.x() * fitScale + fitOffsetX);
    node.y(node.y() * fitScale + fitOffsetY);
    node.scaleX(node.scaleX() * fitScale);
    node.scaleY(node.scaleY() * fitScale);
    layer.add(node);
    rebindGroupedChildConstraintsDeep(node);
  });
  setTimeout(() => updateScrollbars(), 1000);
};

const createKonvaImage = (nodeData) => {
  const img = new Image();
  img.crossOrigin = "anonymous";

  if (nodeData.imageInfo && nodeData.imageInfo.src) {
    img.src = nodeData.imageInfo.src;
  }

  return new Konva.Image({
    image: img,
    x: nodeData.position.x,
    y: nodeData.position.y,
    width: nodeData.size.width,
    height: nodeData.size.height,
    rotation: nodeData.rotation,
    scaleX: nodeData.scale.x,
    scaleY: nodeData.scale.y,
    draggable: nodeData.draggable,
    visible: nodeData.visible,
    opacity: nodeData.opacity,
  });
};

const createKonvaText = (nodeData) => {
  return new Konva.Text({
    x: nodeData.position.x,
    y: nodeData.position.y,
    text: nodeData.textInfo.content,
    fontSize: nodeData.textInfo.fontSize,
    fontFamily: nodeData.textInfo.fontFamily,
    fill: nodeData.textInfo.color,
    rotation: nodeData.rotation,
    scaleX: nodeData.scale.x,
    scaleY: nodeData.scale.y,
    draggable: nodeData.draggable,
    visible: nodeData.visible,
    opacity: nodeData.opacity,
  });
};

const createKonvaLine = (nodeData) => {
  return new Konva.Line({
    x: nodeData.position.x,
    y: nodeData.position.y,
    points: [],
    stroke: nodeData.lineInfo.color,
    strokeWidth: nodeData.lineInfo.strokeWidth,
    lineCap: nodeData.lineInfo.lineCap,
    lineJoin: nodeData.lineInfo.lineJoin,
    rotation: nodeData.rotation,
    scaleX: nodeData.scale.x,
    scaleY: nodeData.scale.y,
    draggable: nodeData.draggable,
    visible: nodeData.visible,
    opacity: nodeData.opacity,
  });
};

const createKonvaRect = (nodeData) => {
  return new Konva.Rect({
    x: nodeData.position.x,
    y: nodeData.position.y,
    width: nodeData.size.width,
    height: nodeData.size.height,
    fill: nodeData.rectInfo.fill,
    stroke: nodeData.rectInfo.stroke,
    strokeWidth: nodeData.rectInfo.strokeWidth,
    cornerRadius: nodeData.rectInfo.cornerRadius,
    rotation: nodeData.rotation,
    scaleX: nodeData.scale.x,
    scaleY: nodeData.scale.y,
    draggable: nodeData.draggable,
    visible: nodeData.visible,
    opacity: nodeData.opacity,
  });
};

const addTextAtPosition = (
  text: string,
  position: { x: number; y: number }
) => {
  if (!layer || !transformer || !position) return;

  const value = (text || "").trim();
  if (!value) return;

  // 先清理旧选中样式
  selectedNodes.forEach((n) => removeNodeSelectStyle(n));

  const textNode = new Konva.Text({
    x: position.x,
    y: position.y,
    text: value,
    fontSize: fontSize.value,
    fontFamily: DEFAULT_FONT_FAMILY,
    fill: brushColor.value,
    draggable: true,
    width: 220,
    wrap: "word",
  });

  layer.add(textNode);

  selectedNodes = [textNode];
  transformer.nodes(selectedNodes);
  addNodeSelectStyle(textNode);
  textNode.moveToTop();
  transformer.moveToTop();

  layer.batchDraw();
  updateScrollbars();
};

const mountResonanceCardGroup = (
  resonanceItem: any,
  position: { x: number; y: number },
  options?: { autoSelect?: boolean }
) => {
  if (!layer || !transformer || !position) return null;

  const shouldAutoSelect = options?.autoSelect !== false;
  // 仅在自动选中时清理旧选中，便于外部批量创建后统一选中。
  if (shouldAutoSelect) {
    selectedNodes.forEach((n) => removeNodeSelectStyle(n));
  }

  const group = createAiPopupResonanceGroup({
    resonanceItem,
    position,
    fontFamily: DEFAULT_FONT_FAMILY,
  });
  if (!group) return null;

  layer.add(group);

  if (shouldAutoSelect) {
    selectedNodes = [group];
    transformer.nodes(selectedNodes);
    addNodeSelectStyle(group);
    group.moveToTop();
    transformer.moveToTop();
  }

  layer.batchDraw();
  updateScrollbars();

  return group;
};

// 选中已存在于当前图层中的节点（不会重复 add 到 layer）。
const selectCanvasNodes = (nodesInput: Konva.Node[] | Konva.Node) => {
  if (!layer || !transformer) return 0;

  const nodes = Array.isArray(nodesInput) ? nodesInput : [nodesInput];
  const validNodes = nodes.filter((node) => node instanceof Konva.Node && node.getLayer() === layer);
  if (validNodes.length === 0) return 0;

  selectedNodes.forEach((n) => removeNodeSelectStyle(n));
  selectedNodes = validNodes;
  transformer.nodes(selectedNodes);
  selectedNodes.forEach((n) => {
    addNodeSelectStyle(n);
    n.moveToTop();
  });
  transformer.moveToTop();

  layer.batchDraw();
  updateScrollbars();
  return validNodes.length;
};

const addPCMAtPosition = (
  item: any,
  position: { x: number; y: number },
  isCenter = true
) => {
  if (!layer || !stage || !item || !position) {
    return;
  }

  const clusterCenter = item?.layout?.main_cluster || { cx: 0, cy: 0 };
  const centerX = Number(clusterCenter?.cx) || 0;
  const centerY = Number(clusterCenter?.cy) || 0;
  const mainClusterImages = Array.isArray(clusterCenter?.images)
    ? clusterCenter.images
    : [];

  let anchorX = centerX;
  let anchorY = centerY;

  if (!isCenter && mainClusterImages.length > 0) {
    let minX = Infinity;
    let minY = Infinity;

    mainClusterImages.forEach((img: any) => {
      const x = Number(img?.x) || 0;
      const y = Number(img?.y) || 0;
      const w = Number(img?.w) || 0;
      const h = Number(img?.h) || 0;
      minX = Math.min(minX, x - w / 2);
      minY = Math.min(minY, y - h / 2);
    });

    if (Number.isFinite(minX) && Number.isFinite(minY)) {
      anchorX = minX;
      anchorY = minY;
    }
  }

  initMainImages(item, {
    offsetX: position.x - anchorX,
    offsetY: position.y - anchorY,
    stage,
    onButtonClick: (data: any, node: Konva.Image) => {
      const currentOffsetX = node.x() + node.width() / 2 - centerX;
      const currentOffsetY = node.y() + node.height() / 2 - centerY;

      initSegmentsImages(data, {
        offsetX: currentOffsetX,
        offsetY: currentOffsetY,
      })
        .then((nodes: any[]) => {
          nodes.forEach((segmentNode: any) => {
            layer!.add(segmentNode);
          });

          setTimeout(() => updateScrollbars(), 1000);
        })
        .catch((error: any) => {
          console.error("Failed to create PCM nodes:", error);
        });
    },
  })
    .then((nodes: any[]) => {
      nodes.forEach((node: any) => {
        layer!.add(node);
      });
      setTimeout(() => updateScrollbars(), 1000);
    })
    .catch((error: any) => {
      console.error("Failed to create PCM main nodes:", error);
    });
};

const addMemoryAtPosition = (
  text: string,
  imageSrc: string,
  position: { x: number; y: number }
) => {
  if (!layer || !transformer || !position) return;

  const value = (text || "").trim();
  if (!value) return;

  if (!imageSrc) {
    addTextAtPosition(value, position);
    return;
  }

  selectedNodes.forEach((n) => removeNodeSelectStyle(n));

  createImageAndTextNodes(
    {
      imageSrc,
      text: value,
      id: "",
    },
    {
      startX: position.x,
      startY: position.y,
      center: false,
      group: false,
    }
  )
    .then((nodes) => {
      const createdNodes = nodes instanceof Konva.Group ? [nodes] : nodes;

      createdNodes.forEach((node) => {
        layer!.add(node);
      });

      selectedNodes = createdNodes;
      syncTransformerSelectionState();
      selectedNodes.forEach((n) => addNodeSelectStyle(n));
      selectedNodes.forEach((n) => n.moveToTop());
      transformer!.moveToTop();

      layer!.batchDraw();
      updateScrollbars();
    })
    .catch((error) => {
      console.error("Failed to add memory node:", error);
    });
};

// 将外部创建的 Konva 节点安全挂载到当前图层，并由 stage 事件委托接管选中。
// 典型场景：WorkingMemory 中先异步创建节点（如 Resonance Fuse），再交给画布统一接管交互。
// 处理规则：
// 1) 入参支持单节点或节点数组；非 Konva.Node 会被自动忽略。
// 2) 不再逐个绑定 click/tap，统一由 stage 级别委托处理单选/多选。
// 3) 当 autoSelect=true 时，会清空旧选中并选中新节点，同时更新 transformer 与选中样式。
// 4) 统一调用 updateDraggableState / batchDraw / updateScrollbars，保证交互状态与视图同步。
// 返回值：实际成功添加到 layer 的节点数量。
const addExternalNodes = (
  nodesInput: Konva.Node[] | Konva.Node,
  options?: { autoSelect?: boolean }
) => {
  if (!layer) return 0;

  // 统一归一化为数组，便于后续批处理。
  const nodes = Array.isArray(nodesInput) ? nodesInput : [nodesInput];
  // 防御式过滤：只接收真正的 Konva 节点实例。
  const validNodes = nodes.filter((node) => node instanceof Konva.Node);
  if (validNodes.length === 0) return 0;

  validNodes.forEach((node) => {
    // 这里只负责把节点接管进当前 layer。
    // 选中交互已经统一改为 stage 委托，所以这里不再补绑 click/tap。
    layer!.add(node);
  });

  if (options?.autoSelect && transformer) {
    // 切换选中集前，先移除旧节点的选中视觉态。
    selectedNodes.forEach((n) => removeNodeSelectStyle(n));
    selectedNodes = validNodes;
    transformer.nodes(selectedNodes);
    // 新节点进入选中态，并确保视觉层级位于上方。
    selectedNodes.forEach((n) => addNodeSelectStyle(n));
    selectedNodes.forEach((n) => n.moveToTop());
    transformer.moveToTop();
  }

  updateDraggableState();
  layer.batchDraw();
  updateScrollbars();

  return validNodes.length;
};

const replaceImageNodeSource = (targetNode: Konva.Node, imageSrc: string) => {
  if (!layer || !targetNode || !imageSrc) return;
  if (!(targetNode instanceof Konva.Image)) return;

  const imgObj = new Image();
  imgObj.crossOrigin = "anonymous";
  imgObj.onload = () => {
    targetNode.image(imgObj);
    layer!.batchDraw();
    updateScrollbars();
  };
  imgObj.onerror = () => {
    console.error("Failed to load cropped image source");
  };
  imgObj.src = imageSrc;
};

const addImageNodeRightOfTarget = (targetNode: Konva.Node, imageSrc: string) => {
  if (!layer || !transformer || !targetNode || !imageSrc) return;
  if (!(targetNode instanceof Konva.Image)) return;

  const imgObj = new Image();
  imgObj.crossOrigin = "anonymous";
  imgObj.onload = () => {
    selectedNodes.forEach((n) => removeNodeSelectStyle(n));

    const targetRect = targetNode.getClientRect({
      relativeTo: layer,
      skipShadow: true,
      skipStroke: true,
    });
    const gap = 24;
    const originId = targetNode.id() || "";
    const newId = `crop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const newNode = new Konva.Image({
      id: newId,
      x: targetRect.x + targetRect.width + gap,
      y: targetRect.y,
      image: imgObj,
      width: imgObj.width,
      height: imgObj.height,
      draggable: true,
      customType: "crop-image",
    });
    newNode.setAttr("originId", originId);

    layer!.add(newNode);

    selectedNodes = [newNode];
    syncTransformerSelectionState();
    addNodeSelectStyle(newNode);
    newNode.moveToTop();
    transformer!.moveToTop();

    layer!.batchDraw();
    updateScrollbars();
  };

  imgObj.onerror = () => {
    console.error("Failed to load cropped image source");
  };

  imgObj.src = imageSrc;
};

const addSegmentsAroundTarget = async (
  targetNode: Konva.Node,
  segmentsInput: any
) => {
  if (!layer || !targetNode || !(targetNode instanceof Konva.Image)) {
    return 0;
  }

  const segments = Array.isArray(segmentsInput)
    ? segmentsInput.filter(Boolean)
    : segmentsInput
    ? [segmentsInput]
    : [];

  if (segments.length === 0) {
    return 0;
  }

  const targetCenterX = targetNode.x() + targetNode.width() / 2;
  const targetCenterY = targetNode.y() + targetNode.height() / 2;

  const segmentResults = await Promise.all(
    segments.map((segment: any, index: number) => {
      const rawX = Number(segment?.layout?.x);
      const rawY = Number(segment?.layout?.y);

      // 后端若未返回布局坐标，使用主图右侧的兜底布局。
      const fallbackAbsX =
        targetCenterX + targetNode.width() / 2 + 44 + (index % 2) * 28;
      const fallbackAbsY = targetCenterY + Math.floor(index / 2) * 48;

      const normalizedSegment = {
        ...segment,
        layout: {
          ...(segment?.layout || {}),
          x: Number.isFinite(rawX) ? rawX : fallbackAbsX - targetCenterX,
          y: Number.isFinite(rawY) ? rawY : fallbackAbsY - targetCenterY,
        },
      };

      return initSegmentImagesItem(normalizedSegment, {
        offsetX: targetCenterX,
        offsetY: targetCenterY,
        initBubbles: true,
      }).catch(() => ({ images: [], bubbles: [] }));
    })
  );

  const createdNodes = segmentResults.flatMap((result: any) => [
    ...(Array.isArray(result?.images) ? result.images : []),
    ...(Array.isArray(result?.bubbles) ? result.bubbles : []),
  ]);

  if (!Array.isArray(createdNodes) || createdNodes.length === 0) {
    return 0;
  }

  selectedNodes.forEach((n) => removeNodeSelectStyle(n));

  createdNodes.forEach((node: Konva.Node) => {
    layer!.add(node);
  });

  if (createdNodes.length > 0) {
    selectedNodes = createdNodes;
    transformer?.nodes(selectedNodes);
    selectedNodes.forEach((n) => {
      addNodeSelectStyle(n);
      n.moveToTop();
    });
    transformer?.moveToTop();
    layer.batchDraw();
    setTimeout(() => updateScrollbars(), 300);
  }

  return createdNodes.length;
};

const addBubblesAroundTarget = async (
  targetNode: Konva.Node,
  bubblesInput: any,
  options?: {
    // 可选：把 Whisper 输入原文渲染到新泡泡上方。
    topText?: string;
  }
) => {
  // 在目标节点周边渲染一组泡泡文本节点，用于 Whisper/Crop 结果回填。
  if (!layer || !targetNode) {
    return 0;
  }

  const bubbles = Array.isArray(bubblesInput)
    ? bubblesInput.filter(Boolean)
    : bubblesInput
    ? [bubblesInput]
    : [];

  if (bubbles.length === 0) {
    return 0;
  }

  const targetRect = targetNode.getClientRect({
    relativeTo: layer,
    skipShadow: true,
    skipStroke: true,
  });
  const targetCenterX = targetRect.x + targetRect.width / 2;
  const targetCenterY = targetRect.y + targetRect.height / 2;

  const normalizedBubbles = bubbles.map((bubble: any, index: number) => {
    const rawX = Number(bubble?.x);
    const rawY = Number(bubble?.y);
    const hasXY = Number.isFinite(rawX) && Number.isFinite(rawY);

    // 后端缺失坐标时，默认做环绕排布，保证每个泡泡都有落点。
    const theta = (index / Math.max(bubbles.length, 1)) * Math.PI * 2;
    const fallbackRadius = 92;

    return {
      ...bubble,
      x: hasXY ? rawX : Math.round(Math.cos(theta) * fallbackRadius),
      y: hasXY ? rawY : Math.round(Math.sin(theta) * fallbackRadius),
      radius: Number(bubble?.radius) || Number(bubble?.r) || 30,
    };
  });

  const bubbleNodes = await initPCMBubbles(normalizedBubbles, {
    offsetX: targetCenterX,
    offsetY: targetCenterY,
  }).catch(() => []);

  if (!Array.isArray(bubbleNodes) || bubbleNodes.length === 0) {
    return 0;
  }

  // 替换选中态到新泡泡，方便用户继续拖拽或二次操作。
  selectedNodes.forEach((n) => removeNodeSelectStyle(n));

  bubbleNodes.forEach((node: Konva.Node) => {
    layer!.add(node);
  });

  // ...existing code...
  const topText = String(options?.topText || "").trim();
  if (topText) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;

    bubbleNodes.forEach((node: Konva.Node) => {
      const rect = node.getClientRect({
        relativeTo: layer,
        skipShadow: true,
        skipStroke: true,
      });

      minX = Math.min(minX, rect.x);
      maxX = Math.max(maxX, rect.x + rect.width);
      minY = Math.min(minY, rect.y);
    });

    if (Number.isFinite(minX) && Number.isFinite(maxX) && Number.isFinite(minY)) {
      const textWidth = Math.max(160, maxX - minX + 24);
      const textAnchorX = minX + (maxX - minX) / 2;
      const textAnchorY = minY - 16;

      try {
        const topTextNode = await createTextNode(
          {
            text: topText,
            id: `whisper-top-${Date.now()}`,
            customType: "whisper-input-text",
          },
          {
            startX: textAnchorX,
            startY: textAnchorY,
            width: textWidth,
            align: "center",
            center: true,
            fontSize: 14,
            lineHeight: 1.5,
            fontFamily: DEFAULT_FONT_FAMILY,
            fill: "#334155",
            backgroundColor: "rgba(156, 163, 175, 0.22)", // 灰色背景
            padding: 8,
            cornerRadius: 8,
            isBubble: false,
          }
        );

        layer!.add(topTextNode);
      } catch (error) {
        console.error("Failed to create whisper top text node:", error);
      }
    }
  }
// ...existing code...

  selectedNodes = bubbleNodes;
  transformer?.nodes(selectedNodes);
  selectedNodes.forEach((n) => {
    addNodeSelectStyle(n);
    n.moveToTop();
  });
  transformer?.moveToTop();

  layer.batchDraw();
  setTimeout(() => updateScrollbars(), 300);

  return bubbleNodes.length;
};

const clearSelection = () => {
  if (!transformer) return;

  // 移除所有节点的选中样式
  selectedNodes.forEach((n) => removeNodeSelectStyle(n));

  selectedNodes = [];
  syncTransformerSelectionState();
  layer?.batchDraw();
};

const GROUP_PREV_DRAG_BOUND_FUNC_ATTR = "__groupPrevDragBoundFunc";
const GROUP_MEANING_DEFAULT_TEXT = "这是对group的描述";

const applyGroupedChildDragConstraint = (
  node: Konva.Node,
  group: Konva.Group,
  bgRect: Konva.Rect
) => {
  const prevDragBoundFunc = node.dragBoundFunc();
  if (!node.getAttr(GROUP_PREV_DRAG_BOUND_FUNC_ATTR)) {
    node.setAttr(GROUP_PREV_DRAG_BOUND_FUNC_ATTR, prevDragBoundFunc || null);
  }

  node.dragBoundFunc((pos: Konva.Vector2d) => {
    // Konva 传入的是绝对坐标，先转换到 group 局部坐标再做边界约束。
    const groupAbsTransform = group.getAbsoluteTransform();
    const groupAbsInverse = groupAbsTransform.copy().invert();
    const targetLocalPos = groupAbsInverse.point(pos);
    const currentLocalPos = node.position();
    const deltaX = targetLocalPos.x - currentLocalPos.x;
    const deltaY = targetLocalPos.y - currentLocalPos.y;

    const nodeRect = node.getClientRect({
      relativeTo: group,
      skipShadow: true,
      skipStroke: false,
    });
    const bgRectBox = bgRect.getClientRect({
      relativeTo: group,
      skipShadow: true,
      skipStroke: false,
    });

    let boundedLocalX = targetLocalPos.x;
    let boundedLocalY = targetLocalPos.y;

    const nextLeft = nodeRect.x + deltaX;
    const nextRight = nodeRect.x + nodeRect.width + deltaX;
    const nextTop = nodeRect.y + deltaY;
    const nextBottom = nodeRect.y + nodeRect.height + deltaY;

    if (nextLeft < bgRectBox.x) {
      boundedLocalX += bgRectBox.x - nextLeft;
    }
    if (nextRight > bgRectBox.x + bgRectBox.width) {
      boundedLocalX -= nextRight - (bgRectBox.x + bgRectBox.width);
    }
    if (nextTop < bgRectBox.y) {
      boundedLocalY += bgRectBox.y - nextTop;
    }
    if (nextBottom > bgRectBox.y + bgRectBox.height) {
      boundedLocalY -= nextBottom - (bgRectBox.y + bgRectBox.height);
    }

    return groupAbsTransform.point({
      x: boundedLocalX,
      y: boundedLocalY,
    });
  });

  node.draggable(currentTool.value === "select");
  node.listening(true);
};

const restoreGroupedChildDragConstraint = (node: Konva.Node) => {
  const prevDragBoundFunc = node.getAttr(GROUP_PREV_DRAG_BOUND_FUNC_ATTR);

  if (typeof prevDragBoundFunc === "function") {
    node.dragBoundFunc(prevDragBoundFunc);
  } else {
    node.dragBoundFunc((pos: Konva.Vector2d) => pos);
  }

  node.setAttr(GROUP_PREV_DRAG_BOUND_FUNC_ATTR, null);
};

// 节点经过 clone（跨画布发送、复制粘贴）后，子节点可能仍持有旧 group/bg 的拖拽约束闭包。
// 这里统一重绑，确保拖拽计算始终基于当前画布中的 group 实例。
const rebindGroupedChildConstraintsDeep = (node: Konva.Node) => {
  if (!(node instanceof Konva.Group)) {
    return;
  }

  if (node.getAttr("customType") === "group") {
    const bgRect = node.findOne(".group-bg") as Konva.Rect | null;
    if (bgRect) {
      node.getChildren().forEach((child: Konva.Node) => {
        const childName = String(child?.name?.() || "");
        if (
          childName === "group-bg" ||
          childName === "group-ungroup-btn" ||
          childName === "group-meaning-text" ||
          childName === "group-meaning-bg"
        ) {
          return;
        }

        // 先清空旧约束，再绑定到当前 group，避免坐标错乱。
        child.setAttr(GROUP_PREV_DRAG_BOUND_FUNC_ATTR, null);
        child.dragBoundFunc((pos: Konva.Vector2d) => pos);
        applyGroupedChildDragConstraint(child, node, bgRect);
      });
    }
  }

  // segment_group 的外框刷新依赖运行时事件；节点一旦经过 clone，必须在当前实例上重新绑定。
  bindSegmentGroupFrameSync(node, {
    eventNamespace: "segmentGroupFrame",
    afterRefresh: () => {
      node.getLayer()?.batchDraw();
    },
  });

  node.getChildren().forEach((child: Konva.Node) => {
    rebindGroupedChildConstraintsDeep(child);
  });
};

const groupSelectedNodes = () => {
  if (!layer || !transformer) {
    return { success: false, message: "画布未准备好" };
  }

  if (!Array.isArray(selectedNodes) || selectedNodes.length < 2) {
    return { success: false, message: "请先选中至少两个节点后再分组" };
  }

  const nodesToGroup = selectedNodes.filter((node) => {
    if (!node) return false;
    if (node === transformer || node === selectionBox) return false;
    if (node.listening() === false) return false;
    return node.getLayer() === layer;
  });

  if (nodesToGroup.length < 2) {
    return { success: false, message: "当前选中节点不支持分组" };
  }

  clearAiAssist();
  selectedNodes.forEach((n) => removeNodeSelectStyle(n));

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodesToGroup.forEach((node) => {
    const rect = node.getClientRect({
      relativeTo: layer,
      skipShadow: true,
      skipStroke: false,
    });
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height);
  });

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    return { success: false, message: "分组范围计算失败" };
  }

  const padding = 16;
  const groupHeaderReserve = 42;
  const groupId = `group-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const group = new Konva.Group({
    id: groupId,
    name: "wm-group",
    draggable: true,
    customType: "group",
  });

  const bgRect = new Konva.Rect({
    x: minX - padding,
    y: minY - padding - groupHeaderReserve,
    width: Math.max(1, maxX - minX + padding * 2),
    height: Math.max(1, maxY - minY + padding * 2 + groupHeaderReserve),
    fill: "rgba(140, 140, 140, 0.18)",
    stroke: "rgba(120, 120, 120, 0.65)",
    strokeWidth: 1.5,
    cornerRadius: 12,
    // 背景需要参与命中，才能选中/拖动整个 group。
    listening: true,
    draggable: false,
    name: "group-bg",
  });

  layer.add(group);
  group.add(bgRect);

  const meaningFieldWidth = Math.max(140, Math.min(280, bgRect.width() - 20));
  const meaningFieldX = bgRect.x() + 10;
  const meaningFieldY = bgRect.y() + 8;

  const groupMeaningText = new Konva.Text({
    x: meaningFieldX + 6,
    y: meaningFieldY + 4,
    text: GROUP_MEANING_DEFAULT_TEXT,
    width: Math.max(60, meaningFieldWidth - 12),
    fontSize: 12,
    lineHeight: 1.4,
    fontFamily: DEFAULT_FONT_FAMILY,
    fill: "#4b5563",
    draggable: false,
    listening: true,
    name: "group-meaning-text",
    wrap: "word",
  });

  const groupMeaningBg = new Konva.Rect({
    x: meaningFieldX,
    y: meaningFieldY,
    width: meaningFieldWidth,
    height: Math.max(24, groupMeaningText.height() + 8),
    fill: "rgba(156, 163, 175, 0.25)",
    stroke: "rgba(107, 114, 128, 0.4)",
    strokeWidth: 1,
    cornerRadius: 6,
    draggable: false,
    listening: true,
    name: "group-meaning-bg",
  });

  group.add(groupMeaningBg);
  group.add(groupMeaningText);

  const ungroupBtnWidth = 64;
  const ungroupBtnHeight = 22;
  const ungroupBtnGap = 6;
  const ungroupBtn = new Konva.Group({
    x: 0,
    y: 0,
    name: "group-ungroup-btn",
    listening: true,
    draggable: false,
  });
  ungroupBtn.setAttr("targetGroupId", groupId);

  const ungroupBtnBg = new Konva.Rect({
    x: 0,
    y: 0,
    width: ungroupBtnWidth,
    height: ungroupBtnHeight,
    cornerRadius: 6,
    fill: "rgba(255, 255, 255, 0.92)",
    stroke: "rgba(120, 120, 120, 0.7)",
    strokeWidth: 1,
    // 需要可命中，点击事件才能冒泡到 ungroupBtn 触发解组。
    listening: true,
  });

  const ungroupBtnText = new Konva.Text({
    x: 0,
    y: 0,
    width: ungroupBtnWidth,
    height: ungroupBtnHeight,
    text: "Ungroup",
    fontSize: 12,
    fontFamily: DEFAULT_FONT_FAMILY,
    fill: "#333",
    align: "center",
    verticalAlign: "middle",
    listening: false,
  });

  const updateUngroupBtnPosition = () => {
    if (!layer) return;
    const rect = group.getClientRect({
      relativeTo: layer,
      skipShadow: true,
      skipStroke: false,
    });
    ungroupBtn.position({
      x: rect.x + rect.width - ungroupBtnWidth - ungroupBtnGap,
      y: rect.y + ungroupBtnGap,
    });
    ungroupBtn.moveToTop();
  };

  ungroupBtn.add(ungroupBtnBg);
  ungroupBtn.add(ungroupBtnText);
  layer.add(ungroupBtn);
  updateUngroupBtnPosition();
  ungroupBtn.on("mousedown touchstart", (evt: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    // 防止事件冒泡到 group，避免被当成拖拽起点。
    evt.cancelBubble = true;
  });

  ungroupBtn.on("click tap", (evt: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    evt.cancelBubble = true;
    const result = ungroupSelectedNodes(group);
    if (!result?.success) {
      console.warn("Ungroup from group button failed:", result?.message || "unknown");
    }
  });

  ungroupBtn.on("mouseenter", () => {
    if (stage) {
      stage.container().style.cursor = "pointer";
    }
    ungroupBtnBg.fill("rgba(240, 240, 240, 0.98)");
    layer?.batchDraw();
  });

  ungroupBtn.on("mouseleave", () => {
    if (stage) {
      stage.container().style.cursor = "default";
    }
    ungroupBtnBg.fill("rgba(255, 255, 255, 0.92)");
    layer?.batchDraw();
  });

  nodesToGroup.forEach((node) => {
    node.moveTo(group);
    applyGroupedChildDragConstraint(node, group, bgRect);
  });
  group.on("dragmove transform", () => {
    updateUngroupBtnPosition();
    layer?.batchDraw();
  });

  selectedNodes = [group];
  transformer.nodes(selectedNodes);
  addNodeSelectStyle(group);
  group.moveToTop();
  transformer.moveToTop();
  ungroupBtn.moveToTop();

  layer.batchDraw();
  setTimeout(() => updateScrollbars(), 200);

  return { success: true, groupId, count: nodesToGroup.length };
};

const ungroupSelectedNodes = (groupCandidate?: Konva.Node | null) => {
  if (!layer || !transformer) {
    return { success: false, message: "画布未准备好" };
  }

  const selected =
    groupCandidate ||
    (Array.isArray(selectedNodes) && selectedNodes.length === 1
      ? selectedNodes[0]
      : null);

  if (!selected) {
    return { success: false, message: "请先选中一个 group 后再解组" };
  }

  const target =
    selected instanceof Konva.Group
      ? selected
      : selected?.name?.() === "group-bg"
      ? selected.getParent()
      : selected?.name?.() === "group-ungroup-btn"
      ? layer?.findOne(`#${String(selected.getAttr("targetGroupId") || "")}`) || null
      : null;

  if (!(target instanceof Konva.Group) || target.getAttr("customType") !== "group") {
    return { success: false, message: "当前选中项不是可解组的 group" };
  }

  const groupNode = target as Konva.Group;
  const layerAbsScale = layer.getAbsoluteScale();
  const layerAbsRotation = layer.getAbsoluteRotation();
  const groupId = groupNode.id?.() || "";
  if (groupId && layer) {
    const floatingBtns = layer.find(".group-ungroup-btn");
    floatingBtns.forEach((node: Konva.Node) => {
      if (String(node.getAttr("targetGroupId") || "") === groupId) {
        node.destroy();
      }
    });
  }

  const rawChildren: any = groupNode.getChildren();
  // 先做快照，避免边遍历边 move 导致集合变化而漏节点。
  const children: Konva.Node[] =
    typeof rawChildren?.each === "function"
      ? (() => {
          const snapshot: Konva.Node[] = [];
          rawChildren.each((child: Konva.Node) => snapshot.push(child));
          return snapshot;
        })()
      : Array.isArray(rawChildren)
      ? [...rawChildren]
      : typeof rawChildren?.toArray === "function"
      ? [...rawChildren.toArray()]
      : Array.from(rawChildren || []);
  const restoredNodes: Konva.Node[] = [];

  children.forEach((child) => {
    if (
      child.name() === "group-bg" ||
      child.name() === "group-ungroup-btn" ||
      child.name() === "group-meaning-text" ||
      child.name() === "group-meaning-bg"
    ) {
      child.destroy();
      return;
    }

    restoreGroupedChildDragConstraint(child);

    const absPos = child.getAbsolutePosition();
    const absRotation = child.getAbsoluteRotation();
    const absScale = child.getAbsoluteScale();

    // 还原到 layer 时要使用“相对 layer 的局部变换”，避免把 stage/layer 缩放重复叠加。
    const localScaleX =
      Math.abs(layerAbsScale.x) > Number.EPSILON
        ? absScale.x / layerAbsScale.x
        : absScale.x;
    const localScaleY =
      Math.abs(layerAbsScale.y) > Number.EPSILON
        ? absScale.y / layerAbsScale.y
        : absScale.y;
    const localRotation = absRotation - layerAbsRotation;

    child.moveTo(layer!);
    child.absolutePosition(absPos);
    child.rotation(localRotation);
    child.scale({ x: localScaleX, y: localScaleY });
    child.draggable(currentTool.value === "select");
    child.listening(true);

    if (!child.hasName("ungrouped-node")) {
      child.addName("ungrouped-node");
    }

    restoredNodes.push(child);
  });

  // 只有在子节点全部迁移后再销毁 group，避免误删未迁移节点。
  groupNode.destroy();

  selectedNodes = restoredNodes;
  transformer.nodes(selectedNodes);
  selectedNodes.forEach((n) => {
    addNodeSelectStyle(n);
    n.moveToTop();
  });
  transformer.moveToTop();

  layer.batchDraw();
  setTimeout(() => updateScrollbars(), 200);

  return { success: true, count: restoredNodes.length };
};

defineExpose({
  renderAiPopupSelectionToLayer,
  cancelAiAssist,
  getSelectedNodes,
  renderNodes,
  konvaData,
  exportCanvas,
  exportElementInfo,
  setTool,
  triggerAiAssist,
  clearSelection,
  clearAiGuideLine,
  resetNodesData,
  addTextAtPosition,
  addResonanceGroupAtPosition: mountResonanceCardGroup,
  selectCanvasNodes,
  addPCMAtPosition,
  addMemoryAtPosition,
  addExternalNodes,
  replaceImageNodeSource,
  addImageNodeRightOfTarget,
  addSegmentsAroundTarget,
  addBubblesAroundTarget,
  setAiRingLabels,
  setAiRingThemeMode,
  groupSelectedNodes,
  ungroupSelectedNodes,
  setWhisperHighlight,
  panStageBy: moveStage,
  applyStageWheelInteraction,
});
</script>

<style scoped>
/* 滚动条样式 */
.scrollbar-h {
  position: absolute;
  bottom: 10px;
  left: 10px;
  right: 10px;
  height: 8px;
  background: transparent;
  pointer-events: none;
  z-index: 100;
}

.scrollbar-v {
  position: absolute;
  top: 10px;
  right: 10px;
  bottom: 10px;
  width: 8px;
  background: transparent;
  pointer-events: none;
  z-index: 100;
}

.scrollbar-thumb-h {
  height: 100%;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  cursor: pointer;
  pointer-events: auto;
  transition: background 0.2s;
}

.scrollbar-thumb-v {
  width: 100%;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  cursor: pointer;
  pointer-events: auto;
  transition: background 0.2s;
}

.scrollbar-thumb-h:hover,
.scrollbar-thumb-v:hover {
  background: rgba(0, 0, 0, 0.4);
}

.drawing-board {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  position: relative;
}

.toolbar-fixed {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.toolbar {
  display: flex;
  gap: 20px;
  padding: 10px;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
  align-items: center;
  flex-wrap: wrap;
  position: absolute;
  top: 0;
  transform: translateY(-100%);
  left: 0;
  right: 0;
  z-index: 100;
  display: none;
}

.tool-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.tool-btn {
  font-size: 0.875em;
  padding: 2px 8px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.tool-btn:hover {
  background: #e0e0e0;
}

.tool-btn.active {
  background: #1890ff;
  color: white;
  border-color: #1890ff;
}

.color-label,
.size-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

input[type="color"] {
  width: 40px;
  height: 30px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

input[type="range"] {
  width: 100px;
}

.size-label span {
  min-width: 30px;
  text-align: center;
}

.zoom-label {
  font-size: 14px;
  font-weight: 500;
}

.zoom-level {
  padding: 8px 12px;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-width: 60px;
  text-align: center;
}

.clear-btn {
  padding: 8px 16px;
  background: #ff4d4f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.clear-btn:hover {
  background: #ff7875;
}

.delete-btn {
  padding: 8px 16px;
  background: #faad14;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.delete-btn:hover:not(:disabled) {
  background: #ffc53d;
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.reset-btn {
  padding: 8px 16px;
  background: #52c41a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.reset-btn:hover {
  background: #73d13d;
}

.export-btn {
  padding: 8px 16px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.export-btn:hover {
  background: #40a9ff;
}

.export-info-btn {
  padding: 8px 16px;
  background: #722ed1;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.export-info-btn:hover {
  background: #9254de;
}

.get-selected-btn {
  padding: 8px 16px;
  background: #fa8c16;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.get-selected-btn:hover {
  background: #ffa940;
}

.send-nodes-btn {
  padding: 8px 16px;
  background: #52c41a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.send-nodes-btn:hover {
  background: #73d13d;
}

.canvas-container {
  flex: 1;
  background: white;
  /* background-image: 
        linear-gradient(to right, #f0f0f0 1px, transparent 1px),
        linear-gradient(to bottom, #f0f0f0 1px, transparent 1px);
    background-size: 20px 20px; */
  background: #fff;
  border: 1px solid #ddd;
  overflow: hidden;
  cursor: default;
}

.canvas-container.panning {
  cursor: grab;
}

.canvas-container.panning:active {
  cursor: grabbing;
}
</style>
