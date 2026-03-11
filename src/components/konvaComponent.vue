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
      <!-- <button
        :class="['tool-btn', { active: currentTool === 'text' }]"
        @click="setTool('text')"
      >
        文字
      </button> -->
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
// 导入 Vue 的响应式 API 和生命周期钩子
import { ref, reactive, onMounted, onUnmounted } from "vue";
import Konva from "konva";
import { Edit, Pointer } from "@element-plus/icons-vue";
import {
  createImageAndTextNodes,
  createTextNode,
  createInterpretationTextNodes,
  createConnection,
} from "@/utils/canvasPositionUtils";
import {
  initMainImages,
  initSegmentsImages,
  initSegmentImagesItem,
  initPCMBubbles,
} from "@/utils/initPCM";

const emit = defineEmits([
  "sendSelectedNodes",
  "ai-ring-click",
  "ai-mode-change",
]);

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
let isDrawing = ref(false); // 是否正在绘制
let isSelecting = ref(false); // 是否正在框选
let isPanning = ref(false); // 是否正在平移
let selectionStartPos = { x: 0, y: 0 }; // 框选起始位置
let panStartPos = { x: 0, y: 0 }; // 平移起始位置
let lastLine: Konva.Line | null = null; // 当前正在绘制的线条

// AI 辅助功能状态变量
let aiRingSlices: Konva.Group[] = []; // 存储环形分区的四个扇形（包含文字）
let aiGuideLine: Konva.Line | null = null; // 存储中心到鼠标的引导线
let aiAssistState: {
  centerX: number;
  centerY: number;
  innerRadius: number;
  outerRadius: number;
  target?: Konva.Node; // 关联的节点
  isLocked?: boolean; // 是否锁定交互（点击后）
} | null = null; // 存储 AI 辅助环的几何状态信息

// 环形分区标签配置
const aiRingLabels = ["灵性的感受", "情绪的流动", "思想的火花", "记忆的碎片"];

// 工具和配置选项
const currentTool = ref<
  "select" | "brush" | "eraser" | "text" | "image" | "pan"
>("select"); // 当前工具类型
const brushColor = ref("#000000"); // 画笔颜色
const lineWidth = ref(5); // 线条粗细
const fontSize = ref(14); // 文字大小
const scale = ref(1); // 当前缩放比例
const minScale = 0.5; // 最小缩放比例
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
};

// 清除 AI 辅助相关的图形和状态
// 在切换工具、取消选中或重新触发时调用
const clearAiAssist = () => {
  // 销毁所有扇形
  aiRingSlices.forEach((slice) => slice.destroy());
  aiRingSlices = [];

  // 销毁引导线
  if (aiGuideLine) {
    aiGuideLine.destroy();
    aiGuideLine = null;
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
  aiAssistState.outerRadius = innerRadius + 200 / scaleX; // 保持外圈宽度视觉一致? 或者固定数值

  // 更新所有扇形的位置和半径
  aiRingSlices.forEach((group) => {
    group.x(aiAssistState!.centerX);
    group.y(aiAssistState!.centerY);

    const slice = group.findOne(".slice") as Konva.Arc;
    if (slice) {
      slice.innerRadius(aiAssistState!.innerRadius);
      slice.outerRadius(aiAssistState!.outerRadius);
    }

    // 更新文字位置
    const labelGroup = group.findOne(".labelGroup") as Konva.Group;
    if (labelGroup) {
      const angle = (slice.rotation() + 45) * (Math.PI / 180); // 扇形中心角度
      const radius =
        (aiAssistState!.innerRadius + aiAssistState!.outerRadius) / 2;

      labelGroup.x(Math.cos(angle) * radius);
      labelGroup.y(Math.sin(angle) * radius);
    }
  });

  // 如果引导线存在，隐藏它（因为位置变了，需要鼠标移动触发更新）
  if (aiGuideLine) {
    aiGuideLine.hide();
  }

  layer!.batchDraw();
};

// 更新 AI 辅助交互效果
// 根据鼠标位置高亮对应扇区，并更新引导线
// 参数 pos: 鼠标在舞台坐标系中的位置
const updateAiAssistInteraction = (pos: { x: number; y: number }) => {
  if (!aiAssistState || aiRingSlices.length === 0 || !layer) return;

  // 如果状态被锁定（已点击），则不再更新交互
  if (aiAssistState.isLocked) return;

  // 计算鼠标相对于圆心的距离和角度
  const dx = pos.x - aiAssistState.centerX;
  const dy = pos.y - aiAssistState.centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // 判断鼠标是否在圆环范围内
  const inRing =
    distance >= aiAssistState.innerRadius &&
    distance <= aiAssistState.outerRadius;

  // 计算鼠标所在的象限（扇区索引）
  let activeIndex = -1;
  if (inRing) {
    // 将角度标准化为 0 到 2PI，并减去起始偏移量 45 度（PI/4）
    // 这样 45-135 度对应 index 0，以此类推
    const normalized =
      (Math.atan2(dy, dx) + Math.PI * 2 - Math.PI / 4) % (Math.PI * 2);
    // 每个扇区 90 度 (PI/2)，计算当前索引
    activeIndex = Math.floor(normalized / (Math.PI / 2));
  }

  // 更新所有扇区的样式
  aiRingSlices.forEach((group, index) => {
    const isActive = index === activeIndex;

    // 更新扇形背景
    const slice = group.findOne(".slice") as Konva.Arc;
    if (slice) {
      slice.fill(
        isActive
          ? "rgba(24, 144, 255, 0.2)" // 高亮颜色 (加深一点)
          : "rgba(24, 144, 255, 0.05)" // 默认颜色 (很浅)
      );
    }

    // 更新标签样式
    const labelGroup = group.findOne(".labelGroup") as Konva.Group;
    if (labelGroup) {
      const bg = labelGroup.findOne(".labelBg") as Konva.Rect;
      const text = labelGroup.findOne(".labelText") as Konva.Text;

      if (bg) {
        // 激活时浅蓝色背景，非激活时透明
        bg.fill(isActive ? "#e6f7ff" : "transparent");
        // 激活时无边框，非激活时也无边框
        bg.stroke(null);
      }

      if (text) {
        // 激活时黑色，非激活时灰色
        text.fill(isActive ? "#000" : "#999");
      }

      // 激活时稍微放大
      labelGroup.scale({ x: isActive ? 1.1 : 1, y: isActive ? 1.1 : 1 });
    }
  });

  // 处理引导线（从圆心指向鼠标位置）
  if (inRing) {
    if (!aiGuideLine) {
      // 如果引导线不存在，创建新线条
      aiGuideLine = new Konva.Line({
        points: [aiAssistState.centerX, aiAssistState.centerY, pos.x, pos.y],
        stroke: "#8cc5ff", // 浅蓝色
        strokeWidth: 2,
        dash: [10, 5], // 虚线
        listening: false, // 不响应鼠标事件
      });
      layer.add(aiGuideLine);
      aiGuideLine.moveToTop();
    } else {
      // 如果引导线已存在，更新终点坐标
      aiGuideLine.points([
        aiAssistState.centerX,
        aiAssistState.centerY,
        pos.x,
        pos.y,
      ]);
      aiGuideLine.show();
      aiGuideLine.moveToTop();
    }
  } else if (aiGuideLine) {
    // 如果鼠标不在圆环内，且未锁定，则隐藏引导线
    aiGuideLine.hide();
  }

  // 确保变换器始终在最上层
  if (transformer) {
    transformer.moveToTop();
  }
  layer.batchDraw();
};

// 处理舞台点击事件，用于检测 AI 辅助环的点击
const handleStageClick = (
  e: Konva.KonvaEventObject<MouseEvent | TouchEvent>
) => {
  // 如果 AI 辅助未激活，不处理
  if (!aiAssistState || !layer) return;

  const pos = getPointerPos(e);

  // 计算鼠标相对于圆心的距离和角度
  const dx = pos.x - aiAssistState.centerX;
  const dy = pos.y - aiAssistState.centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // 判断点击是否在圆环范围内
  const inRing =
    distance >= aiAssistState.innerRadius &&
    distance <= aiAssistState.outerRadius;

  if (inRing) {
    // 阻止事件继续传播，避免触发取消选中等逻辑
    e.cancelBubble = true;

    // 如果已经锁定（弹窗已显示），则不再响应点击
    if (aiAssistState.isLocked) return;

    // 计算点击的扇区索引
    const normalized =
      (Math.atan2(dy, dx) + Math.PI * 2 - Math.PI / 4) % (Math.PI * 2);
    const index = Math.floor(normalized / (Math.PI / 2));

    // 获取标签和连线长度
    const label = aiRingLabels[index];
    const lineLength = distance - aiAssistState.innerRadius;

    // 获取屏幕坐标用于定位弹窗
    const pointerPos = stage!.getPointerPosition();
    const screenPos = pointerPos
      ? {
          x: pointerPos.x + container.value!.getBoundingClientRect().left,
          y: pointerPos.y + container.value!.getBoundingClientRect().top,
        }
      : { x: 0, y: 0 };

    // 停止 AI 交互更新，锁定引导线位置
    aiAssistState.isLocked = true;

    // 如果已经锁定，需要更新引导线的位置到新的点击点，以便 createAiContentNode 获取正确的终点
    if (aiGuideLine) {
      aiGuideLine.points([
        aiAssistState.centerX,
        aiAssistState.centerY,
        pos.x,
        pos.y,
      ]);
      aiGuideLine.show(); // 确保显示
      layer.batchDraw();
    }

    // 触发事件通知父组件
    emit("ai-ring-click", {
      label,
      lineLength,
      position: screenPos,
    });

    console.log("AI Ring Click:", { label, lineLength, screenPos });
  }
};

// 创建 AI 生成的内容节点（在确认后调用）
const createAiContentNode = (content: string) => {
  if (!aiAssistState || !aiGuideLine || !layer) return;

  // 获取引导线的起点和终点
  const points = aiGuideLine.points();
  const startX = points[0];
  const startY = points[1];
  const endX = points[2];
  const endY = points[3];

  // 计算引导线向量
  const dx = endX - startX;
  const dy = endY - startY;
  const currentLength = Math.sqrt(dx * dx + dy * dy);

  // 1. 先初步创建节点以获取其宽高
  const textNode = new Konva.Text({
    x: 0,
    y: 0,
    text: content,
    fontSize: 14,
    fontFamily: "Arial",
    fill: "#333",
    padding: 10,
    width: 200, // 限制宽度自动换行
    align: "left",
  });

  const bgNode = new Konva.Rect({
    x: 0,
    y: 0,
    width: textNode.width(),
    height: textNode.height(),
    fill: "#fff",
    stroke: "#8cc5ff",
    strokeWidth: 1,
    cornerRadius: 8,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowBlur: 10,
    shadowOffset: { x: 0, y: 4 },
  });

  // 2. 计算从中心点到矩形边界在指定方向上的距离
  // 设矩形半宽为 w, 半高为 h, 射线向量为 (dx, dy)
  const w = bgNode.width() / 2;
  const h = bgNode.height() / 2;

  let finalCenterX = endX;
  let finalCenterY = endY;

  if (currentLength > 0) {
    const unitX = dx / currentLength;
    const unitY = dy / currentLength;

    // 计算射线与矩形四边交点的距离 d
    // 根据相似三角形原理：
    // 如果 unitX 不为 0，与左右边交点距离 d1 = w / |unitX|
    // 如果 unitY 不为 0，与上下边交点距离 d2 = h / |unitY|
    // 取其中的最小值即为中心到边界的真实距离
    const d1 = unitX !== 0 ? Math.abs(w / unitX) : Infinity;
    const d2 = unitY !== 0 ? Math.abs(h / unitY) : Infinity;
    const distanceToEdge = Math.min(d1, d2);

    // 最终中心点 = 引导线终点 + 方向向量 * 距离边界的长度
    finalCenterX = endX + unitX * distanceToEdge;
    finalCenterY = endY + unitY * distanceToEdge;
  }

  // 3. 创建内容组
  const group = new Konva.Group({
    x: finalCenterX,
    y: finalCenterY,
    draggable: true,
    name: "ai-content-node",
  });
  group.add(bgNode);
  group.add(textNode);

  // 设置偏移量，使 finalCenterX/Y 对应节点的中心位置
  group.offset({
    x: w,
    y: h,
  });

  layer.add(group);

  // 获取源节点
  const sourceNode = aiAssistState.target;

  if (sourceNode) {
    // 创建持久化连线
    createConnection(sourceNode, group);
  } else {
    // 降级：如果找不到源节点（极少情况），使用静态坐标
    const persistentLine = new Konva.Line({
      points: [startX, startY, endX, endY], // 静态连线连到边界点
      stroke: "#8cc5ff",
      strokeWidth: 2,
      dash: [10, 5],
      listening: false,
    });
    layer.add(persistentLine);
    persistentLine.moveToBottom();
  }

  // 清除 AI 辅助环，但保留这个新创建的内容和连线
  // clearAiAssist 会销毁 aiGuideLine，所以上面我们已经读取了 points
  clearAiAssist();

  // 重新绘制
  layer.batchDraw();

  return group;
};

const createConnection = (node1: Konva.Node, node2: Konva.Node) => {
  const line = new Konva.Line({
    stroke: "#8cc5ff",
    strokeWidth: 2,
    dash: [10, 5],
    listening: false, // 确保连线不响应鼠标事件，也就无法被选中
  });

  // 存储连接关系
  line.setAttr("fromNodeId", node1.id() || node1.name());
  line.setAttr("toNodeId", node2.id() || node2.name());

  layer!.add(line);
  line.moveToBottom();

  const updateLine = () => {
    // 获取节点在 Layer 坐标系中的中心点
    const getCenter = (node: Konva.Node) => {
      // 使用 relativeTo: node 获取节点自身的局部包围盒
      // 这不受节点旋转/缩放/位移的影响，只反映内容的几何尺寸
      const localBox = node.getClientRect({
        skipShadow: true,
        relativeTo: node,
      });

      // 计算局部中心点
      const localCenter = {
        x: localBox.x + localBox.width / 2,
        y: localBox.y + localBox.height / 2,
      };

      // 将局部中心点转换为绝对坐标（Stage 坐标）
      // 使用 getAbsoluteTransform()，它包含了节点的所有变换矩阵（包括 Transformer 施加的）
      const absoluteCenter = node.getAbsoluteTransform().point(localCenter);

      // 将绝对坐标转回 Layer 坐标，以便连线使用
      const layerTransform = layer!.getAbsoluteTransform().copy().invert();
      return layerTransform.point(absoluteCenter);
    };

    const p1 = getCenter(node1);
    const p2 = getCenter(node2);

    line.points([p1.x, p1.y, p2.x, p2.y]);
  };

  // 辅助函数：检查连线本身是否被 Transformer 选中
  const isLineSelected = () => {
    if (!transformer) return false;
    const nodes = transformer.nodes();
    return nodes.includes(line);
  };

  // 绑定事件：总是监听 dragend/transformend 确保最终位置正确
  node1.on("dragend transformend", updateLine);
  node2.on("dragend transformend", updateLine);

  // 绑定 dragmove/transform 事件：
  const handleMove = () => {
    // 如果连线也被选中了，就不需要手动更新位置（Transformer 会带着它移动）
    if (!isLineSelected()) {
      updateLine();
    }
  };

  node1.on("dragmove transform", handleMove);
  node2.on("dragmove transform", handleMove);

  // 监听 Transformer 事件
  if (transformer) {
    transformer.on("dragmove transform", () => {
      const nodes = transformer!.nodes();
      // 如果连线本身被选中，跳过更新
      if (nodes.includes(line)) return;

      if (nodes.includes(node1) || nodes.includes(node2)) {
        updateLine();
      }
    });

    transformer.on("dragend transformend", () => {
      // 无论如何，操作结束时强制更新一次
      // 使用 setTimeout 确保在下一帧更新，避免坐标尚未完全同步
      const nodes = transformer!.nodes();
      if (
        nodes.includes(node1) ||
        nodes.includes(node2) ||
        nodes.includes(line)
      ) {
        setTimeout(() => {
          updateLine();
          layer!.batchDraw(); // 确保重绘
        }, 0);
      }
    });
  }

  // 初始更新一次
  updateLine();

  return line;
};

// 取消 AI 辅助锁定状态，恢复交互
const cancelAiAssist = () => {
  console.log("cancelAiAssist called - destroying AI ring");
  // 直接销毁 AI 辅助环
  clearAiAssist();
};

const clearAiGuideLine = () => {
  console.log("clearAiGuideLine called");
  if (aiGuideLine) {
    aiGuideLine.destroy();
    aiGuideLine = null;
  }
  if (aiAssistState) {
    aiAssistState.isLocked = false;
  }
  layer?.batchDraw();
};

// 触发 AI 辅助功能
// 在选中元素周围生成交互式圆环
// 返回值: 包含成功状态和消息的对象
const triggerAiAssist = () => {
  if (!layer) {
    return { success: false, message: "画布未初始化" };
  }

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
    outerRadius: innerRadius + 200 / scaleX, // 外圆半径比内圆大 200 (视觉像素)
    target: target,
  };

  // 绑定事件监听，确保圆环跟随移动
  target.on("dragmove", updateAiAssistPosition);
  target.on("transform", updateAiAssistPosition);

  // 创建四个扇形分区
  for (let index = 0; index < 4; index++) {
    const group = new Konva.Group({
      x: aiAssistState.centerX,
      y: aiAssistState.centerY,
      listening: true, // 开启监听，拦截点击事件
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

    const slice = new Konva.Arc({
      name: "slice",
      innerRadius: aiAssistState.innerRadius,
      outerRadius: aiAssistState.outerRadius,
      angle: 90, // 每个扇形 90 度
      rotation: index * 90 + 45, // 旋转 45 度，使扇区分割线呈 X 型
      fill: "rgba(24, 144, 255, 0.05)", // 初始颜色更浅
      stroke: null, // 移除描边，使扇区之间无分界线
      strokeWidth: 0,
      listening: true, // 开启监听
    });
    group.add(slice);

    // 创建标签
    const labelGroup = new Konva.Group({
      name: "labelGroup",
      listening: false, // 标签本身不需要独立监听，跟随 group
    });

    // 计算文字位置 (扇形中心)
    // 扇形起始角度为 index*90 + 45，中心线再加 45 度，即 index*90 + 90
    const angle = (index * 90 + 90) * (Math.PI / 180);
    const radius = (aiAssistState.innerRadius + aiAssistState.outerRadius) / 2;
    const labelX = Math.cos(angle) * radius;
    const labelY = Math.sin(angle) * radius;

    labelGroup.position({ x: labelX, y: labelY });

    const text = new Konva.Text({
      name: "labelText",
      text: aiRingLabels[index],
      fontSize: 14,
      fontFamily: "Arial",
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

  // 确保变换器在辅助图形之上
  if (transformer) {
    transformer.moveToTop();
  }
  layer.batchDraw();
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

  // 右键按下切换到 pan 模式，松开恢复
  let previousTool = "select";
  let isRightMouseDown = false;
  let rightMouseDownPos = { x: 0, y: 0 };
  let rightMouseStartPos = { x: 0, y: 0 };

  stage.on("contextmenu", (e) => {
    e.evt.preventDefault();
  });

  stage.on("mousedown", (e) => {
    if (e.evt.button === 2) {
      e.evt.preventDefault();
      isRightMouseDown = true;
      rightMouseStartPos = stage!.getPointerPosition() || { x: 0, y: 0 };
      rightMouseDownPos = { ...rightMouseStartPos };
      previousTool = currentTool.value;
      setTool("pan");
    }
  });

  stage.on("mousemove", (e) => {
    if (isRightMouseDown && currentTool.value === "pan") {
      const pos = stage!.getPointerPosition();
      if (pos) {
        const dx = pos.x - rightMouseDownPos.x;
        const dy = pos.y - rightMouseDownPos.y;
        moveStage({ x: dx, y: dy });
        rightMouseDownPos = { x: pos.x, y: pos.y };
      }
    }
  });

  stage.on("mouseup", (e) => {
    if (e.evt.button === 2) {
      isRightMouseDown = false;
      setTool("select");
    }
  });

  stage.on("mouseleave", () => {
    if (isRightMouseDown) {
      isRightMouseDown = false;
      setTool("select");
    }
  });

  window.addEventListener("resize", handleResize);
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("contextmenu", (e) => e.preventDefault());
  konvaData.stage = stage;
  konvaData.layer = layer;

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
});

const handleResize = () => {
  if (stage && container.value) {
    stage.width(container.value.offsetWidth);
    stage.height(container.value.offsetHeight);
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Delete" || e.key === "Backspace") {
    deleteSelectedNodes();
  }
};

// 处理鼠标滚轮事件，实现画布的缩放和滚动功能
const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
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

  lastLine.on("click tap", (evt) => {
    handleNodeClick(evt, lastLine!);
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
        shape.name() === "slice" ||
        shape.name() === "labelGroup" ||
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

    transformer!.nodes(selectedNodes);
    selectedNodes.forEach((n) => n.moveToTop());
    transformer!.moveToTop();
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

  // 检查是否按下了修饰键（Shift、Ctrl 或 Meta），用于多选
  const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;

  // 如果没有按下修饰键，执行单选操作
  if (!metaPressed) {
    // 先移除所有节点的选中样式
    selectedNodes.forEach((n) => removeNodeSelectStyle(n));

    // 如果点击的节点不在已选列表中，则只选中该节点
    if (selectedNodes.indexOf(node) === -1) {
      selectedNodes = [node];
    } else {
      // 如果点击的节点已在已选列表中，保持选中
      selectedNodes = [node];
    }
  } else {
    // 如果按下了修饰键，执行多选/取消选择操作
    const isSelected = selectedNodes.indexOf(node) >= 0;
    if (!isSelected) {
      // 如果节点未被选中，则添加到选中列表
      selectedNodes.push(node);
    } else {
      // 如果节点已被选中，则从选中列表中移除
      selectedNodes.splice(selectedNodes.indexOf(node), 1);
    }
  }

  // 为所有选中的节点添加选中样式
  selectedNodes.forEach((n) => addNodeSelectStyle(n));

  // 更新变换器的选中节点列表
  transformer!.nodes(selectedNodes);
  // 将所有选中的节点移到图层顶部
  selectedNodes.forEach((n) => n.moveToTop());
  // 将变换器移到最顶部，确保选择框可见
  transformer!.moveToTop();
};

// 封装节点阴影设置方法
const setNodeShadow = (node: Konva.Node, isSelected: boolean) => {
  // 连线（Arrow/Line）不处理
  if (node instanceof Konva.Arrow || node instanceof Konva.Line) {
    return;
  }

  const applyShadow = (n: Konva.Node) => {
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
      n.shadowColor(n.getAttr("_originalShadowColor") || null);
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

// 处理文字添加事件
// 在画布上点击位置添加文字
// 参数 e: 事件对象
const handleTextClick = (
  e: Konva.KonvaEventObject<MouseEvent | TouchEvent>
) => {
  // 获取点击位置在舞台坐标系中的坐标
  const pos = getPointerPos(e);

  // 直接创建文本节点，使用默认文字
  const defaultText = "双击编辑文字";
  const textNode = new Konva.Text({
    x: pos.x,
    y: pos.y,
    text: defaultText,
    fontSize: fontSize.value,
    fontFamily: "Arial",
    fill: brushColor.value,
    draggable: true,
    width: 150, // 设置文本宽度，超出自动换行
    wrap: "word", // 按单词换行
  });

  // 为文字节点添加点击事件，用于选中
  textNode.on("click tap", (evt) => {
    handleNodeClick(evt, textNode);
  });

  // 将文字节点添加到图层
  layer!.add(textNode);
  currentTool.value = "select";

  // 选中新创建的文字节点
  selectedNodes = [textNode];
  transformer!.nodes(selectedNodes);
  textNode.moveToTop();
  transformer!.moveToTop();
  addNodeSelectStyle(textNode);

  // 保持文字工具模式，方便继续添加文字
  // 不自动切换回选择工具
};

// 处理双击事件
// 用于编辑已存在的文字内容
// 参数 e: 事件对象
const handleDoubleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
  const target = e.target;
  // 检查双击的目标是否是文字节点
  if (target instanceof Konva.Text) {
    const textNodeKonva = target;
    const stage = textNodeKonva.getStage();
    const textPosition = textNodeKonva.absolutePosition();
    const stageBox = stage!.container().getBoundingClientRect();

    const areaPosition = {
      x: stageBox.left + textPosition.x,
      y: stageBox.top + textPosition.y,
    };

    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);

    textarea.value = textNodeKonva.text();
    textarea.style.position = "absolute";
    textarea.style.top = areaPosition.y + "px";
    textarea.style.left = areaPosition.x + "px";
    textarea.style.width =
      textNodeKonva.width() - textNodeKonva.padding() * 2 + "px";
    textarea.style.height =
      textNodeKonva.height() - textNodeKonva.padding() * 2 + 5 + "px";
    textarea.style.fontSize = textNodeKonva.fontSize() + "px";
    textarea.style.border = "none";
    textarea.style.padding = "0px";
    textarea.style.margin = "0px";
    textarea.style.overflow = "hidden";
    textarea.style.background = "none";
    textarea.style.outline = "none";
    textarea.style.resize = "none";
    textarea.style.lineHeight = textNodeKonva.lineHeight();
    textarea.style.fontFamily = textNodeKonva.fontFamily();
    textarea.style.transformOrigin = "left top";
    textarea.style.textAlign = textNodeKonva.align();
    textarea.style.color = textNodeKonva.fill();
    textarea.style.zIndex = "1001";

    const rotation = textNodeKonva.rotation();
    let transform = "";
    if (rotation) {
      transform += "rotateZ(" + rotation + "deg)";
    }
    textarea.style.transform = transform;

    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + 3 + "px";

    textNodeKonva.visible(false);
    textarea.focus();

    function removeTextarea() {
      textarea.parentNode.removeChild(textarea);
      window.removeEventListener("click", handleOutsideClick);
      window.removeEventListener("touchstart", handleOutsideClick);
      textNodeKonva.visible(true);
    }

    function setTextareaWidth(newWidth) {
      if (!newWidth) {
        newWidth = textNodeKonva.placeholder?.length * textNodeKonva.fontSize();
      }
      textarea.style.width = newWidth + "px";
    }

    textarea.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        textNodeKonva.text(textarea.value);
        removeTextarea();
      }
      if (e.key === "Escape") {
        removeTextarea();
      }
    });

    textarea.addEventListener("input", function () {
      const scale = textNodeKonva.getAbsoluteScale().x;
      setTextareaWidth(textNodeKonva.width() * scale);
      textarea.style.height = "auto";
      textarea.style.height =
        textarea.scrollHeight + textNodeKonva.fontSize() + "px";
    });

    function handleOutsideClick(e) {
      if (e.target !== textarea) {
        textNodeKonva.text(textarea.value);
        removeTextarea();
      }
    }
    setTimeout(() => {
      window.addEventListener("click", handleOutsideClick);
      window.addEventListener("touchstart", handleOutsideClick);
    });
  }
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

      // 为图片添加点击事件，用于选中
      konvaImage.on("click tap", (evt) => {
        handleNodeClick(evt, konvaImage);
      });

      // 将图片添加到图层
      layer!.add(konvaImage);
      // 选中刚添加的图片
      selectedNodes = [konvaImage];
      transformer!.nodes(selectedNodes);
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
    transformer.nodes([]);
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
    child.draggable(isSelectMode);
  });
};

// 删除当前选中的所有节点
// 清空选中列表并重置变换器
const deleteSelectedNodes = () => {
  if (selectedNodes.length === 0) return;

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
      // 递归处理 Group 中的 Image 节点
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

    return JSON.stringify(json);
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

            node.on("click tap", (evt) => {
              handleNodeClick(evt, node);
            });

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
                  interpretationNode.on("click tap", (evt) => {
                    handleNodeClick(evt, interpretationNode);
                  });
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
        { text: textContent, id },
        {
          startX: dropPos.x,
          startY: dropPos.y,
          ...dragData.style,
          center: true,
          isBubble: true,
          align: "center",
          width: 60,
        }
      )
        .then((konvaText) => {
          konvaText.on("click tap", (evt) => {
            handleNodeClick(evt, konvaText);
          });

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
      initMainImages(item, {
        offsetX: dropPos.x - item.layout.main_cluster.cx,
        offsetY: dropPos.y - item.layout.main_cluster.cy,
        stage: stage!,
        onButtonClick: (data, node) => {
          const mainNode = node;
          console.log("Image button clicked, data:", data, node);

          // 根据当前 node 的中心点位置计算 offsetX 和 offsetY
          const currentOffsetX =
            node.x() + node.width() / 2 - item.layout.main_cluster.cx;
          const currentOffsetY =
            node.y() + node.height() / 2 - item.layout.main_cluster.cy;

          initSegmentsImages(data, {
            offsetX: currentOffsetX,
            offsetY: currentOffsetY,
          })
            .then((nodes) => {
              nodes.forEach((node) => {
                node.on("click tap", (evt) => {
                  handleNodeClick(evt, node);
                });
                layer!.add(node);
                // if (node.className === "Image") {
                //   // 创建从 mainNode 到当前节点的连接线
                //   const connectionLine = createConnection(mainNode, node, {
                //     strokeWidth: 2,
                //     arrow: true,
                //     dashed: true,
                //     onDragMove: (line, source, target) => {
                //       const getNodeCenter = (n) => {
                //         const absPos = n.getAbsolutePosition();
                //         return {
                //           x: absPos.x + (n.width() * n.scaleX()) / 2,
                //           y: absPos.y + (n.height() * n.scaleY()) / 2,
                //         };
                //       };
                //       const sourcePos = getNodeCenter(source);
                //       const targetPos = getNodeCenter(target);
                //       line.points([
                //         sourcePos.x,
                //         sourcePos.y,
                //         targetPos.x,
                //         targetPos.y,
                //       ]);
                //     },
                //   });
                //   if (connectionLine) {
                //     layer!.add(connectionLine);
                //     connectionLine.moveToBottom();
                //   }
                // }
              });

              setTimeout(() => updateScrollbars(), 1000);
              // data.segments.forEach((segment, index) => {
              //   initPCMBubbles(segment.layout.bubbles, {
              //     offsetX: currentOffsetX,
              //     offsetY: currentOffsetY,
              //   })
              //     .then((nodes) => {
              //       nodes.forEach((node) => {
              //         node.on("click tap", (evt) => {
              //           handleNodeClick(evt, node);
              //         });
              //         layer!.add(node);
              //       });
              //     })
              //     .catch((error) => {
              //       console.error("Failed to create PCM nodes:", error);
              //     });
              // });
            })
            .catch((error) => {
              console.error("Failed to create PCM nodes:", error);
            });
        },
      }).then((nodes) => {
        console.log(nodes);
        nodes.forEach((node) => {
          node.on("click tap", (evt) => {
            handleNodeClick(evt, node);
          });
          layer!.add(node);
        });
        setTimeout(() => updateScrollbars(), 1000);
      });
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
          node.on("click tap", (evt) => {
            handleNodeClick(evt, node);
          });
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
const renderNodes = (nodesData) => {
  if (!layer || !nodesData || nodesData.length === 0) return;

  const isKonvaNodes = nodesData[0] instanceof Konva.Node;
  if (!isKonvaNodes) return;

  const canvasWidth = stage.width();
  const canvasHeight = stage.height();

  // 先克隆所有节点（不添加到画布）
  const clonedNodes = [];
  nodesData.forEach((node, index) => {
    const clonedNode = node.clone({
      id: node.id() ? `${node.id()}_clone` : `clone_${index}`,
    });
    clonedNode.off();
    // 移除选中阴影
    removeNodeSelectStyle(clonedNode);
    clonedNode.on("click tap", (evt) => handleNodeClick(evt, clonedNode));
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
    lineCap: "round",
    lineJoin: "round",
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

const clearSelection = () => {
  if (!transformer) return;

  // 移除所有节点的选中样式
  selectedNodes.forEach((n) => removeNodeSelectStyle(n));

  selectedNodes = [];
  transformer.nodes([]);
  layer?.batchDraw();
};

defineExpose({
  createAiContentNode,
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
