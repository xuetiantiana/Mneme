<template>
  <div class="canvas-container">
    <div class="left-panel" v-if="false">
      <div class="panel-title">图片列表</div>
      <div class="image-list">
        <div
          v-for="(image, index) in images"
          :key="index"
          class="image-item"
          draggable="true"
          @dragstart="handleDragStart($event, image)"
        >
          <img :src="image.src" :alt="image.name" />
          <div class="image-name">{{ image.name }}</div>
        </div>
      </div>
    </div>
    <div class="right-panel">
      
      <div
        class="canvas-wrapper"
        ref="canvasContainer"
        @dragover.prevent
        @drop="handleDrop"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp"
        @wheel="handleWheel"
        @dblclick="handleDoubleClick"
        @contextmenu.prevent
      >
        <canvas ref="canvasRef" style="width: 100%;"></canvas>
        
        <textarea
          v-if="editingText"
          ref="textInputRef"
          class="text-input-overlay"
          :style="{
            left: editingText.x * appState.scale + appState.scrollX + 'px',
            top: editingText.y * appState.scale + appState.scrollY - (editingText.element.fontSize || 16) * appState.scale + 'px',
            width: editingText.width * appState.scale + 'px',
            height: editingText.height * appState.scale + 'px',
            fontSize: (editingText.element.fontSize || 16) * appState.scale + 'px',
            color: editingText.element.strokeColor,
            fontWeight: editingText.element.fontWeight || 'normal',
            padding: '0px',
            lineHeight: (editingText.element.fontSize || 16) * appState.scale + 'px'
          }"
          v-model="editingText.element.text"
          @blur="finishEditingText"
          @keydown="handleTextInputKeydown"
          @mousedown.stop
          @click.stop
        ></textarea>
      </div>

      <!-- <div class="header-section">
        <div class="title">无限画布编辑器</div>
        <div class="toolbar">
          <button 
            :class="{ active: currentTool === 'select' }"
            @click="setTool('select')"
            title="选择工具"
          >
            选择
          </button>
          <button 
            :class="{ active: currentTool === 'pan' }"
            @click="setTool('pan')"
            title="移动画布"
          >
            移动
          </button>
          <button 
            :class="{ active: currentTool === 'rectangle' }"
            @click="setTool('rectangle')"
            title="绘制矩形"
          >
            矩形
          </button>
          <button 
            :class="{ active: currentTool === 'circle' }"
            @click="setTool('circle')"
            title="绘制圆形"
          >
            圆形
          </button>
          <button 
            :class="{ active: currentTool === 'line' }"
            @click="setTool('line')"
            title="绘制线条"
          >
            线条
          </button>
          <button 
            :class="{ active: currentTool === 'text' }"
            @click="setTool('text')"
            title="添加文本"
          >
            文本
          </button>
          <div class="brush-controls">
            <label>颜色:</label>
            <input 
              type="color" 
              v-model="strokeColor"
            />
            <label>线宽: {{ strokeWidth }}px</label>
            <input 
              type="range" 
              v-model="strokeWidth" 
              min="1" 
              max="20"
            />
          </div>
          <div class="navigation-controls">
            <button @click="zoomOut" title="缩小">-</button>
            <span class="zoom-level">{{ Math.round(appState.scale * 100) }}%</span>
            <button @click="zoomIn" title="放大">+</button>
            <button @click="resetView" title="重置视图">重置</button>
          </div>
          <div class="action-buttons">
            <button @click="deleteSelected">删除选中</button>
            <button @click="clearCanvas">清空画布</button>
            <button @click="exportCanvas">导出图片</button>
          </div>
        </div>
      </div> -->
      <!-- <div class="status-bar">
        <span>元素数量: {{ canvasElements.length }}</span>
        <span>坐标: ({{ Math.round(appState.scrollX) }}, {{ Math.round(appState.scrollY) }})</span>
        <span>缩放: {{ Math.round(appState.scale * 100) }}%</span>
        
      </div> -->
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive, watch } from "vue";
import image1 from "@/assets/images/1691549357221680.png";
import image2 from "@/assets/images/OIP-C.png";
import image3 from "@/assets/images/OIP-C2.png";

const emit = defineEmits(["showPopup"]);

const canvasRef = ref(null);
const canvasContainer = ref(null);
const ctx = ref(null);

const images = ref([
  {
    name: "示例图片1",
    src: image1
  },
  {
    name: "示例图片2",
    src: image2
  },
  {
    name: "示例图片3",
    src: image3
  }
]);

const appState = reactive({
  scrollX: 0,
  scrollY: 0,
  scale: 1,
  width: 0,
  height: 0,
  offsetLeft: 0,
  offsetTop: 0
});

const canvasElements = ref([]);
const selectedElements = ref([]);

// 监听canvasElements变化
watch(
  canvasElements,
  (newValue, oldValue) => {
    console.log('!!!!!canvasElements变化:', newValue);
  },
  { deep: true }
);
const draggedImage = ref(null);
const currentTool = ref("select");
const isDragging = ref(false);
const isDrawing = ref(false);
const isPanning = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const lastMousePos = ref({ x: 0, y: 0 });
const strokeColor = ref("#000000");
const strokeWidth = ref(2);
const editingText = ref(null);
const textInputRef = ref(null);
const isDoubleClick = ref(false);

// 调整大小相关状态
const isResizing = ref(false);
const resizeHandle = ref(null); // 'nw', 'ne', 'sw', 'se'
const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0 });

// 调整大小手柄大小
const HANDLE_SIZE = 10;

const memoryAddPosition = { x: 0, y: 0 };
// 添加默认文本元素
// 功能：在画布中心添加一个默认的文本元素
const dawnTopicTopic = ()=>{
  const canvas = canvasRef.value;
  if (!canvas) return;
  
  const text = "我和我的猫的故事";
  const fontSize = 18;
  const fontWeight = "bold";
  let textWidth = 200;
  
  // 确保文本宽度至少为33px
  textWidth = Math.max(33, textWidth);
  
  // 计算文本高度
  const textResult = drawTextWithWrapping(ctx.value, text, 0, 0, {
    maxWidth: textWidth,
    fontSize: fontSize,
    fontWeight: fontWeight,
    color: "#000000",
    dryRun: true
  });
  const textHeight = textResult.height;
  
  const textElement = {
    id: Date.now(),
    type: "text",
    x: 0,
    y: -(appState.height / 2) / appState.scale + 50,
    width: textWidth,
    height: textHeight,
    fontSize: fontSize,
    fontWeight: fontWeight,
    strokeColor: "#000",
    strokeWidth: strokeWidth.value,
    text: text,
    backgroundColor: "red"
  };
  canvasElements.value.push(textElement);
  // selectedElements.value = [textElement];
  // startEditingText(textElement);

  const offset = sceneCoordsToCanvasOffset(textElement.x, textElement.y);
  console.log(offset.x, offset.y);
  // 子组件和父组件通信，将文本元素的坐标传递给父组件
  memoryAddPosition.x = textElement.x;
  memoryAddPosition.y = textElement.y;
  emit("showPopup", { x: offset.x, y: offset.y });
  
}

// 添加卡片元素
// 功能：创建一个包含文本和图片的卡片元素
// 参数：
//   - text: 卡片中的文本内容
//   - imageSrc: 卡片中的图片URL
//   - x: 卡片的x坐标
//   - y: 卡片的y坐标
//   - width: 卡片的宽度（默认400px）
const addCardElement = (text, imageSrc, x, y, width = 400) => {
  const img = new Image();
  img.onload = () => {
    // 计算内边距
    const padding = 20;
    
    // 计算文本区域高度
    const fontSize = 14;
    const lineHeight = fontSize * 1.2;
    let textWidth = width - padding * 2;
    
    // 确保文本宽度至少为33px
  textWidth = Math.max(33, textWidth);
  
  // 计算文本行数（使用专门的函数）
  const textResult = drawTextWithWrapping(ctx.value, text, 0, 0, {
    maxWidth: textWidth,
    fontSize: fontSize,
    fontWeight: "normal",
    color: "#000000",
    dryRun: true
  });
  const textHeight = textResult.height;
    
    // 计算图片尺寸：宽度为卡片宽度的90%
    const imgWidth = width * 0.9;
    const aspectRatio = img.width / img.height;
    const imgHeight = imgWidth / aspectRatio;
    
    // 计算卡片总高度（自适应）
    const cardHeight = padding * 3 + textHeight + imgHeight;
    
    // 计算元素位置
    const textX = padding;
    const textY = padding;
    const imgX = (width - imgWidth) / 2;
    const imgY = padding + textHeight + padding;
    
    const cardElement = {
      id: Date.now(),
      type: "card",
      x: x,
      y: y,
      width: width,
      height: cardHeight,
      backgroundColor: "#ffffff",
      borderRadius: 8,
      shadowColor: "rgba(0, 0, 0, 0.1)",
      children: [
        {
          id: Date.now() + 1,
          type: "text",
          x: textX,
          y: textY + lineHeight,
          width: textWidth,
          height: textHeight,
          fontSize: fontSize,
          fontWeight: "normal",
          strokeColor: "#333333",
          text: text,
          parentId: Date.now()
        },
        {
          id: Date.now() + 2,
          type: "image",
          x: imgX,
          y: imgY,
          width: imgWidth,
          height: imgHeight,
          src: imageSrc,
          image: img,
          parentId: Date.now()
        }
      ]
    };
    canvasElements.value.push(cardElement);
    drawElements();
  };
  img.onerror = () => {
    console.error("图片加载失败:", imageSrc);
  };
  img.src = imageSrc;
};

const dwanMemoryC1= (data)=>{
  console.log(data);
  // memoryAddPosition 将图片和文字添加在该位置
  // 使用卡片元素来包含文字和图片
  addCardElement(
    data.description || "",
    data.img,
    memoryAddPosition.x,
    memoryAddPosition.y
  );
}

let rafId = null;

defineExpose({
  dwanMemoryC1
});
onMounted(async() => {
  await initCanvas();
  window.addEventListener("resize", handleResize);
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);

  dawnTopicTopic();
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);
  if (rafId) {
    cancelAnimationFrame(rafId);
  }
});

const initCanvas = async() => {
  const canvas = canvasRef.value;
  const container = canvasContainer.value;
  if (canvas && container) {
    const { offsetWidth, offsetHeight, offsetLeft, offsetTop } = container;
    
    canvas.width = offsetWidth * window.devicePixelRatio;
    canvas.height = offsetHeight * window.devicePixelRatio;
    canvas.style.width = `${offsetWidth}px`;
    canvas.style.height = `${offsetHeight}px`;
    
    ctx.value = canvas.getContext("2d");
    ctx.value.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    appState.width = offsetWidth;
    appState.height = offsetHeight;
    appState.offsetLeft = offsetLeft;
    appState.offsetTop = offsetTop;
    appState.scrollX = offsetWidth / 2;
    appState.scrollY = offsetHeight / 2;
    
    renderScene();
  }
};



// 处理窗口大小变化
// 功能：当窗口大小变化时，重新初始化画布
const handleResize = () => {
  initCanvas();
};

// 处理键盘按下事件
// 功能：处理快捷键，包括空格键切换到平移工具，Delete/Backspace删除选中元素
// 参数：
//   - event: 键盘事件对象
const handleKeyDown = (event) => {
  if (event.code === "Space" && !event.repeat) {
    event.preventDefault();
    appState.previousTool = currentTool.value;
    currentTool.value = "pan";
    if (canvasRef.value) {
      canvasRef.value.style.cursor = "grab";
    }
  }
  if ((event.code === "Delete" || event.code === "Backspace") && selectedElements.value.length > 0) {
    event.preventDefault();
    deleteSelected();
  }
};

// 处理键盘抬起事件
// 功能：当空格键抬起时，恢复到之前的工具
// 参数：
//   - event: 键盘事件对象
const handleKeyUp = (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    if (appState.previousTool) {
      currentTool.value = appState.previousTool;
      updateCursor();
    }
  }
};

// 更新光标样式
// 功能：根据当前工具设置相应的光标样式
const updateCursor = () => {
  if (canvasRef.value) {
    const cursors = {
      select: "default",
      pan: "grab",
      rectangle: "crosshair",
      circle: "crosshair",
      line: "crosshair",
      text: "text"
    };
    canvasRef.value.style.cursor = cursors[currentTool.value] || "default";
  }
};

// 获取canvas的边界矩形
// 功能：获取canvas元素在页面中的位置
// 返回：{ left: number, top: number } - canvas左上角的页面坐标
const getCanvasRect = () => {
  const canvas = canvasRef.value;
  if (!canvas) return { left: 0, top: 0 };
  const rect = canvas.getBoundingClientRect();
  return { left: rect.left, top: rect.top };
};

// 将鼠标点击的屏幕坐标转换为canvas内部坐标（相对于canvas左上角）
// 功能：将页面坐标转换为canvas内部坐标
// 参数：
//   - clientX: 鼠标点击的页面x坐标
//   - clientY: 鼠标点击的页面y坐标
// 返回：{ x: number, y: number } - canvas内部坐标
const clientToCanvasCoords = (clientX, clientY) => {
  const { left, top } = getCanvasRect();
  return {
    x: clientX - left,
    y: clientY - top
  };
};

// 将视口坐标转换为场景坐标
// 功能：将视口坐标（考虑缩放和滚动）转换为场景坐标（原始坐标）
// 参数：
//   - clientX: 视口x坐标
//   - clientY: 视口y坐标
// 返回：{ x: number, y: number } - 场景坐标
const viewportCoordsToSceneCoords = (clientX, clientY) => {
  const { left, top } = getCanvasRect();
  const x = (clientX - left - appState.scrollX) / appState.scale;
  const y = (clientY - top - appState.scrollY) / appState.scale;
  return { x, y };
};

// 将场景坐标转换为视口坐标
// 功能：将场景坐标（原始坐标）转换为视口坐标（考虑缩放和滚动）
// 参数：
//   - sceneX: 场景x坐标
//   - sceneY: 场景y坐标
// 返回：{ x: number, y: number } - 视口坐标
const sceneCoordsToViewportCoords = (sceneX, sceneY) => {
  const x = sceneX * appState.scale + appState.scrollX;
  const y = sceneY * appState.scale + appState.scrollY;
  return { x, y };
};

// 场景坐标转换为画布坐标偏移量，考虑了画布的滚动偏移（ scrollX 、 scrollY ）和缩放比例（ scale ）
// 功能：将场景坐标转换为画布偏移量，用于定位弹窗或其他UI元素
// 参数：
//   - sceneX: 场景x坐标
//   - sceneY: 场景y坐标
// 返回：{ x: number, y: number } - 画布偏移量
const sceneCoordsToCanvasOffset = (sceneX, sceneY) => {
  const { left, top } = getCanvasRect();
  const canvasLeft = appState.scrollX / appState.scale;
  const canvasTop = appState.scrollY / appState.scale;
  const offsetX = canvasLeft + sceneX;
  const offsetY = canvasTop + sceneY;
  return { x: offsetX + left, y: offsetY + top };
};

// 渲染场景
// 功能：清空画布并重新绘制所有元素（背景、网格、元素、选中框）
// 使用requestAnimationFrame实现循环渲染，保持60fps
const renderScene = () => {
  if (!ctx.value || !canvasRef.value) return;
  
  const canvas = canvasRef.value;
  const { width, height } = appState;
  
  ctx.value.clearRect(0, 0, width, height);
  
  drawBackground();
  drawGrid();
  drawElements();
  drawSelection();
  
  if (rafId) {
    cancelAnimationFrame(rafId);
  }
  rafId = requestAnimationFrame(renderScene);
};

// 绘制背景
// 功能：绘制画布的背景色
const drawBackground = () => {
  if (!ctx.value) return;
  ctx.value.fillStyle = "#E8E8E8";
  ctx.value.fillRect(0, 0, appState.width, appState.height);
};

// 绘制网格
// 功能：绘制背景网格线，帮助用户对齐元素
const drawGrid = () => {
  if (!ctx.value) return;
  
  const gridSize = 50 * appState.scale;
  const startX = appState.scrollX % gridSize;
  const startY = appState.scrollY % gridSize;
  
  ctx.value.strokeStyle = "#e0e0e0";
  ctx.value.lineWidth = 1;
  ctx.value.setLineDash([5, 5]);
  
  ctx.value.beginPath();
  
  for (let x = startX; x < appState.width; x += gridSize) {
    ctx.value.moveTo(x, 0);
    ctx.value.lineTo(x, appState.height);
  }
  
  for (let y = startY; y < appState.height; y += gridSize) {
    ctx.value.moveTo(0, y);
    ctx.value.lineTo(appState.width, y);
  }
  
  ctx.value.stroke();
  ctx.value.setLineDash([]);
  
  drawAxis();
};

// 绘制坐标轴
// 功能：绘制场景原点(0,0)的红色坐标轴，帮助用户定位
const drawAxis = () => {
  if (!ctx.value) return;
  
  const origin = sceneCoordsToViewportCoords(0, 0);
  
  ctx.value.strokeStyle = "#ff0000";
  ctx.value.lineWidth = 2;
  ctx.value.setLineDash([10, 5]);
  
  ctx.value.beginPath();
  ctx.value.moveTo(origin.x, 0);
  ctx.value.lineTo(origin.x, appState.height);
  ctx.value.moveTo(0, origin.y);
  ctx.value.lineTo(appState.width, origin.y);
  ctx.value.stroke();
  
  ctx.value.setLineDash([]);
};

// 绘制所有元素
// 功能：遍历并绘制所有canvas元素
const drawElements = () => {
  if (!ctx.value) return;
  
  canvasElements.value.forEach(element => {
    drawElement(element);
  });
};

// 递归绘制元素及其子元素
// 功能：绘制单个元素及其所有子元素，支持自定义context、scale和坐标系统
// 参数：
//   - element: 要绘制的元素对象
//   - options: 配置选项
//     - context: canvas上下文（默认ctx.value）
//     - scale: 缩放比例（默认appState.scale）
//     - useViewportCoords: 是否使用视口坐标（默认true）
//     - parentTransform: 父元素的变换（默认{ x: 0, y: 0 }）
const drawElement = (element, options = {}) => {
  const {
    context = ctx.value,
    scale = appState.scale,
    useViewportCoords = true,
    parentTransform = { x: 0, y: 0 }
  } = options;
  
  if (!context) return;
  
  const { x, y, width, height, type, strokeColor, strokeWidth, points, children } = element;
  const actualX = x + parentTransform.x;
  const actualY = y + parentTransform.y;
  
  let drawX, drawY;
  if (useViewportCoords) {
    const viewportPos = sceneCoordsToViewportCoords(actualX, actualY);
    drawX = viewportPos.x;
    drawY = viewportPos.y;
  } else {
    drawX = actualX;
    drawY = actualY;
  }
  
  context.save();
  
  switch (type) {
    case "card":
      context.fillStyle = element.backgroundColor;
      context.beginPath();
      context.roundRect(
        drawX,
        drawY,
        width * scale,
        height * scale,
        element.borderRadius * scale
      );
      context.fill();
      
      if (useViewportCoords && element.shadowColor) {
        context.shadowColor = element.shadowColor;
        context.shadowBlur = 10 * scale;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 4 * scale;
        context.fill();
        context.shadowColor = "transparent";
      }
      
      if (children && children.length > 0) {
        children.forEach(child => {
          drawElement(child, { context, scale, useViewportCoords, parentTransform: { x: actualX, y: actualY } });
        });
      }
      break;
      
    case "rectangle":
      context.strokeStyle = strokeColor;
      context.lineWidth = strokeWidth * scale;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.strokeRect(
        drawX,
        drawY,
        width * scale,
        height * scale
      );
      break;
      
    case "circle":
      context.strokeStyle = strokeColor;
      context.lineWidth = strokeWidth * scale;
      context.lineCap = "round";
      context.lineJoin = "round";
      const radius = Math.sqrt(width * width + height * height) / 2;
      context.beginPath();
      context.arc(
        drawX + (width * scale) / 2,
        drawY + (height * scale) / 2,
        radius * scale,
        0,
        Math.PI * 2
      );
      context.stroke();
      break;
      
    case "line":
      if (points && points.length >= 2) {
        context.strokeStyle = strokeColor;
        context.lineWidth = strokeWidth * scale;
        context.lineCap = "round";
        context.lineJoin = "round";
        context.beginPath();
        
        if (useViewportCoords) {
          const start = sceneCoordsToViewportCoords(points[0].x + actualX, points[0].y + actualY);
          context.moveTo(start.x, start.y);
          for (let i = 1; i < points.length; i++) {
            const point = sceneCoordsToViewportCoords(points[i].x + actualX, points[i].y + actualY);
            context.lineTo(point.x, point.y);
          }
        } else {
          context.moveTo(points[0].x + actualX, points[0].y + actualY);
          for (let i = 1; i < points.length; i++) {
            context.lineTo(points[i].x + actualX, points[i].y + actualY);
          }
        }
        
        context.stroke();
      }
      break;
      
    case "text":
      const text = element.text || "文本";
      const fontSize = element.fontSize || 16;
      const fontWeight = element.fontWeight || "normal";
      const fontSizeScaled = fontSize * scale;
      
      if (element.backgroundColor) {
        context.fillStyle = element.backgroundColor;
        context.fillRect(
          drawX,
          drawY - fontSizeScaled,
          (element.width || 200) * scale,
          (element.height || fontSize * 1.2) * scale
        );
      }
      
      const textResult = drawTextWithWrapping(context, text, drawX, drawY, {
        maxWidth: (element.width || Infinity) * scale,
        fontSize: fontSizeScaled,
        fontWeight: fontWeight,
        color: element.strokeColor || "#000000"
      });
      
      element.height = textResult.height;
      break;
      
    case "image":
      if (element.image) {
        context.drawImage(
          element.image,
          drawX,
          drawY,
          width * scale,
          height * scale
        );
      }
      break;
  }
  
  context.restore();
};

// 计算元素的绝对坐标（考虑父元素的位置）
// 功能：递归计算元素在场景中的绝对坐标，考虑所有父元素的偏移
// 参数：
//   - element: 要计算绝对坐标的元素
// 返回：{ x: number, y: number } - 绝对坐标
const getElementAbsolutePosition = (element) => {
  let absoluteX = element.x;
  let absoluteY = element.y;
  
  // 如果元素有父元素，递归计算绝对坐标
  if (element.parentId) {
    const findParent = (elements, parentId) => {
      for (const el of elements) {
        if (el.id === parentId) {
          return el;
        }
        if (el.children && el.children.length > 0) {
          const parent = findParent(el.children, parentId);
          if (parent) {
            return parent;
          }
        }
      }
      return null;
    };
    
    const parent = findParent(canvasElements.value, element.parentId);
    if (parent) {
      const parentAbsPos = getElementAbsolutePosition(parent);
      absoluteX += parentAbsPos.x;
      absoluteY += parentAbsPos.y;
    }
  }
  
  return { x: absoluteX, y: absoluteY };
};

// 绘制带自动换行的文本
// 功能：绘制文本并支持自动换行，可只计算高度不绘制（dryRun模式）
// 参数：
//   - ctx: canvas上下文
//   - text: 要绘制的文本内容
//   - x: 绘制位置的x坐标
//   - y: 绘制位置的y坐标
//   - options: 配置选项
//     - maxWidth: 最大宽度（默认Infinity，不换行）
//     - fontSize: 字体大小（默认16）
//     - fontWeight: 字体粗细（默认"normal"）
//     - color: 文本颜色（默认"#000000"）
//     - lineHeight: 行高（默认fontSize * 1.2）
//     - dryRun: 是否只计算不绘制（默认false）
// 返回：{ height: number } - 文本高度
const drawTextWithWrapping = (ctx, text, x, y, options = {}) => {
  const {
    maxWidth = Infinity,
    fontSize = 16,
    fontWeight = "normal",
    color = "#000000",
    lineHeight = fontSize * 1.2,
    dryRun = false
  } = options;
  
  if (!ctx || !text) return { height: 0 };
  
  // 设置字体样式
  ctx.font = `${fontWeight} ${fontSize}px Arial`;
  if (!dryRun) {
    ctx.fillStyle = color;
  }
  
  // 如果没有宽度限制，直接绘制
  if (maxWidth === Infinity) {
    if (!dryRun) {
      ctx.fillText(text, x, y);
    }
    return { height: lineHeight };
  }
  
  // 实现文本自动换行
  const lines = [];
  let currentLine = "";
  
  // 逐字符测量文本宽度
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const testLine = currentLine + char;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  // 绘制多行文本（dryRun模式下不绘制）
  if (!dryRun) {
    lines.forEach((line, index) => {
      ctx.fillText(line, x, y + index * lineHeight);
    });
  }
  
  return { height: lines.length * lineHeight };
};

// 绘制选中框
// 功能：为所有选中的元素绘制选中框和调整大小的手柄
const drawSelection = () => {
  // 1. 安全检查：如果没有画布上下文或没有选中元素，直接返回
  if (!ctx.value || selectedElements.value.length === 0) return;
  
  // 2. 保存当前画布状态
  ctx.value.save();

  // 3. 设置选中框样式
  ctx.value.strokeStyle = "#2196F3";
  ctx.value.lineWidth = 2;
  ctx.value.setLineDash([5, 5]);
  
  selectedElements.value.forEach(element => {
    // 计算元素的绝对坐标（考虑父元素的位置）
    const absolutePos = getElementAbsolutePosition(element);
    // 将元素的绝对场景坐标转换为视口坐标（考虑缩放和滚动）
    const viewportPos = sceneCoordsToViewportCoords(absolutePos.x, absolutePos.y);
    
    if (element.type === "text") {
      const text = element.text || "文本";
      const fontSize = element.fontSize || 16;
      const fontWeight = element.fontWeight || "normal";
      const fontSizeScaled = fontSize * appState.scale;
      const textWidth = element.width || 200;
      
      // 使用drawTextWithWrapping的dryRun模式计算文本高度
      const textResult = drawTextWithWrapping(ctx.value, text, 0, 0, {
        maxWidth: textWidth,
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: "#000000",
        dryRun: true
      });
      const textHeight = textResult.height;
      
      // Canvas文本绘制是从基线开始的，第一行的基线在viewportPos.y位置
      // drawTextWithWrapping返回的height = lines.length * lineHeight
      // 文本的顶部在第一行基线上方一个字体大小的位置
      // 文本的底部在最后一行基线下方一个字体大小的位置
      // 选择框应该从 viewportPos.y - fontSizeScaled 开始，高度为 textHeight + fontSizeScaled
      ctx.value.strokeRect(
        viewportPos.x - 5,
        viewportPos.y - fontSizeScaled - 5,
        textWidth * appState.scale + 10,
        textHeight + fontSizeScaled + 10
      );
    } else {
      // 使用绝对值确保宽度和高度为正数
      const absWidth = Math.abs(element.width);
      const absHeight = Math.abs(element.height);
      const scaledWidth = absWidth * appState.scale;
      const scaledHeight = absHeight * appState.scale;
      
      // 如果宽度或高度为负，调整viewportPos以正确显示选择框
      const actualViewportX = element.width < 0 ? viewportPos.x - scaledWidth : viewportPos.x;
      const actualViewportY = element.height < 0 ? viewportPos.y - scaledHeight : viewportPos.y;
      
      ctx.value.strokeRect(
          actualViewportX - 5,
          actualViewportY - 5,
          scaledWidth + 10,
          scaledHeight + 10
        );
      
      // 绘制调整大小手柄（对图片、矩形和卡片）
      if (element.type === "image" || element.type === "rectangle" || element.type === "card") {
        ctx.value.save();
        ctx.value.setLineDash([]);
        ctx.value.fillStyle = "#2196F3";
        ctx.value.strokeStyle = "#fff";
        ctx.value.lineWidth = 2;
        
        const handleSize = HANDLE_SIZE;
        const handles = [
          { x: actualViewportX - handleSize / 2, y: actualViewportY - handleSize / 2, name: "nw" },
          { x: actualViewportX + scaledWidth / 2 - handleSize / 2, y: actualViewportY - handleSize / 2, name: "n" },
          { x: actualViewportX + scaledWidth - handleSize / 2, y: actualViewportY - handleSize / 2, name: "ne" },
          { x: actualViewportX + scaledWidth - handleSize / 2, y: actualViewportY + scaledHeight / 2 - handleSize / 2, name: "e" },
          { x: actualViewportX + scaledWidth - handleSize / 2, y: actualViewportY + scaledHeight - handleSize / 2, name: "se" },
          { x: actualViewportX + scaledWidth / 2 - handleSize / 2, y: actualViewportY + scaledHeight - handleSize / 2, name: "s" },
          { x: actualViewportX - handleSize / 2, y: actualViewportY + scaledHeight - handleSize / 2, name: "sw" },
          { x: actualViewportX - handleSize / 2, y: actualViewportY + scaledHeight / 2 - handleSize / 2, name: "w" }
        ];
        
        handles.forEach(handle => {
          ctx.value.beginPath();
          ctx.value.arc(handle.x + handleSize / 2, handle.y + handleSize / 2, handleSize / 2, 0, Math.PI * 2);
          ctx.value.fill();
          ctx.value.stroke();
        });
        ctx.value.restore();
      }
    }
  });
  
  ctx.value.restore();
};

// 设置当前工具
// 功能：切换到指定的工具，清空选中元素，更新光标
// 参数：
//   - tool: 工具类型（select、pan、rectangle、circle、line、text）
const setTool = (tool) => {
  currentTool.value = tool;
  selectedElements.value = [];
  updateCursor();
};

// 检测是否点击了调整手柄
// 功能：检测鼠标位置是否在选中元素的调整大小手柄上
// 参数：
//   - clientX: 鼠标x坐标
//   - clientY: 鼠标y坐标
// 返回：手柄名称（nw、ne、sw、se）或null
const getResizeHandleAt = (clientX, clientY) => {
  if (selectedElements.value.length !== 1) return null;
  
  const element = selectedElements.value[0];
  if (element.type !== "image" && element.type !== "rectangle" && element.type !== "card") return null;
  
  const absolutePos = getElementAbsolutePosition(element);
  const viewportPos = sceneCoordsToViewportCoords(absolutePos.x, absolutePos.y);
  
  // 使用绝对值确保宽度和高度为正数
  const absWidth = Math.abs(element.width);
  const absHeight = Math.abs(element.height);
  const scaledWidth = absWidth * appState.scale;
  const scaledHeight = absHeight * appState.scale;
  
  // 如果宽度或高度为负，调整viewportPos
  const actualViewportX = element.width < 0 ? viewportPos.x - scaledWidth : viewportPos.x;
  const actualViewportY = element.height < 0 ? viewportPos.y - scaledHeight : viewportPos.y;
  
  // 计算鼠标相对于canvas的坐标
  const mouseCanvasCoords = clientToCanvasCoords(clientX, clientY);
  
  const handleSize = HANDLE_SIZE;
  const handles = [
    { x: actualViewportX - handleSize / 2, y: actualViewportY - handleSize / 2, name: "nw" },
    { x: actualViewportX + scaledWidth / 2 - handleSize / 2, y: actualViewportY - handleSize / 2, name: "n" },
    { x: actualViewportX + scaledWidth - handleSize / 2, y: actualViewportY - handleSize / 2, name: "ne" },
    { x: actualViewportX + scaledWidth - handleSize / 2, y: actualViewportY + scaledHeight / 2 - handleSize / 2, name: "e" },
    { x: actualViewportX + scaledWidth - handleSize / 2, y: actualViewportY + scaledHeight - handleSize / 2, name: "se" },
    { x: actualViewportX + scaledWidth / 2 - handleSize / 2, y: actualViewportY + scaledHeight - handleSize / 2, name: "s" },
    { x: actualViewportX - handleSize / 2, y: actualViewportY + scaledHeight - handleSize / 2, name: "sw" },
    { x: actualViewportX - handleSize / 2, y: actualViewportY + scaledHeight / 2 - handleSize / 2, name: "w" }
  ];
  
  for (const handle of handles) {
    if (mouseCanvasCoords.x >= handle.x && mouseCanvasCoords.x <= handle.x + handleSize &&
        mouseCanvasCoords.y >= handle.y && mouseCanvasCoords.y <= handle.y + handleSize) {
      return handle.name;
    }
  }
  
  return null;
};

// 处理鼠标按下事件
// 功能：根据当前工具和鼠标位置，开始相应的操作（平移、选择、绘制、调整大小等）
// 参数：
//   - event: 鼠标事件对象
const handleMouseDown = (event) => {
  const { clientX, clientY } = event;
  const sceneCoords = viewportCoordsToSceneCoords(clientX, clientY);
  
  dragStart.value = sceneCoords;
  lastMousePos.value = { x: clientX, y: clientY };
  
  if (currentTool.value === "pan" || event.button === 1 || (event.button === 0 && event.altKey)) {
    isPanning.value = true;
    if (canvasRef.value) {
      canvasRef.value.style.cursor = "grabbing";
    }
    return;
  }
  
  if (currentTool.value === "select") {
    // 先检查是否点击了调整手柄
    const handle = getResizeHandleAt(clientX, clientY);
    if (handle) {
      isResizing.value = true;
      resizeHandle.value = handle;
      const element = selectedElements.value[0];
      resizeStart.value = {
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        mouseX: sceneCoords.x,
        mouseY: sceneCoords.y
      };
      return;
    }
    
    const clickedElement = findElementAt(sceneCoords.x, sceneCoords.y);
    if (clickedElement) {
      if (!event.shiftKey) {
        selectedElements.value = [clickedElement];
      } else {
        const index = selectedElements.value.indexOf(clickedElement);
        if (index === -1) {
          selectedElements.value.push(clickedElement);
        } else {
          selectedElements.value.splice(index, 1);
        }
      }
      isDragging.value = true;
    } else {
      selectedElements.value = [];
    }
    return;
  }
  
  if (["rectangle", "circle", "line", "text"].includes(currentTool.value)) {
    isDrawing.value = true;
    
    // 文本元素需要设置初始宽高
    let initialWidth = 0;
    let initialHeight = 0;
    
    if (currentTool.value === "text") {
      initialWidth = 200;
      initialHeight = 20;
    }
    
    const newElement = {
      id: Date.now(),
      type: currentTool.value,
      x: sceneCoords.x,
      y: sceneCoords.y,
      width: initialWidth,
      height: initialHeight,
      strokeColor: strokeColor.value,
      strokeWidth: strokeWidth.value,
      points: currentTool.value === "line" ? [{ x: sceneCoords.x, y: sceneCoords.y }] : [],
      text: currentTool.value === "text" ? "双击编辑文本" : ""
    };
    canvasElements.value.push(newElement);
  }
};

// 处理鼠标双击事件
// 功能：双击文本元素时进入编辑模式
// 参数：
//   - event: 鼠标事件对象
const handleDoubleClick = (event) => {
  event.stopPropagation();
  event.preventDefault();
  
  isDoubleClick.value = true;
  
  const { clientX, clientY } = event;
  const sceneCoords = viewportCoordsToSceneCoords(clientX, clientY);
  
  const clickedElement = findElementAt(sceneCoords.x, sceneCoords.y);
  
  if (clickedElement && clickedElement.type === "text") {
    startEditingText(clickedElement);
  }
  
  setTimeout(() => {
    isDoubleClick.value = false;
  }, 200);
};

// 开始编辑文本
// 功能：显示文本输入框，允许用户编辑文本内容
// 参数：
//   - element: 要编辑的文本元素
const startEditingText = (element) => {
  // 计算元素的绝对坐标（考虑父元素的位置）
  const absolutePos = getElementAbsolutePosition(element);
  
  // 确保文本宽度至少为33px
  const textWidth = Math.max(element.width || 200, 33);
  
  // 使用元素的fontSize和height
  const fontSize = element.fontSize || 16;
  const textHeight = element.height || fontSize * 1.2;
  
  editingText.value = {
    element: element,
    x: absolutePos.x,
    y: absolutePos.y,
    width: textWidth,
    height: textHeight
  };
  
  setTimeout(() => {
    if (textInputRef.value) {
      textInputRef.value.focus();
      textInputRef.value.select();
    }
  }, 50);
};

// 完成编辑文本
// 功能：隐藏文本输入框，更新文本元素的高度
const finishEditingText = () => {
  if (editingText.value) {
    const text = editingText.value.element.text || "文本";
    editingText.value.element.text = text;
    
    // 重新计算文本高度
    const element = editingText.value.element;
    const fontSize = element.fontSize || 16;
    const fontWeight = element.fontWeight || "normal";
    const textWidth = element.width || 200;
    
    // 确保文本宽度至少为33px
    const finalTextWidth = Math.max(textWidth, 33);
    element.width = finalTextWidth;
    
    // 使用drawTextWithWrapping的dryRun模式计算文本高度
    const textResult = drawTextWithWrapping(ctx.value, text, 0, 0, {
      maxWidth: finalTextWidth,
      fontSize: fontSize,
      fontWeight: fontWeight,
      color: "#000000",
      dryRun: true
    });
    element.height = textResult.height;
    
    editingText.value = null;
  }
};

// 处理文本输入框的键盘事件
// 功能：按Enter完成编辑，按Escape取消编辑
// 参数：
//   - event: 键盘事件对象
const handleTextInputKeydown = (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    finishEditingText();
  } else if (event.key === "Escape") {
    editingText.value = null;
  }
};

// 处理鼠标移动事件
// 功能：根据当前操作状态（拖动、绘制、平移、调整大小）更新元素位置或绘制预览
// 参数：
//   - event: 鼠标事件对象
const handleMouseMove = (event) => {
  const { clientX, clientY } = event;
  const sceneCoords = viewportCoordsToSceneCoords(clientX, clientY);
  
  // 更新光标样式（在选择模式下）
  if (currentTool.value === "select" && !isDragging.value && !isResizing.value && !isPanning.value) {
    const handle = getResizeHandleAt(clientX, clientY);
    if (handle) {
      const cursors = {
        "nw": "nw-resize",
        "n": "n-resize",
        "ne": "ne-resize",
        "e": "e-resize",
        "se": "se-resize",
        "s": "s-resize",
        "sw": "sw-resize",
        "w": "w-resize"
      };
      if (canvasRef.value) {
        canvasRef.value.style.cursor = cursors[handle];
      }
    } else {
      const clickedElement = findElementAt(sceneCoords.x, sceneCoords.y);
      if (canvasRef.value) {
        canvasRef.value.style.cursor = clickedElement ? "move" : "default";
      }
    }
  }
  
  if (isPanning.value) {
    const deltaX = clientX - lastMousePos.value.x;
    const deltaY = clientY - lastMousePos.value.y;
    appState.scrollX += deltaX;
    appState.scrollY += deltaY;
    lastMousePos.value = { x: clientX, y: clientY };
    return;
  }
  
  if (isResizing.value && selectedElements.value.length > 0) {
    const element = selectedElements.value[0];
    const deltaX = sceneCoords.x - resizeStart.value.mouseX;
    const deltaY = sceneCoords.y - resizeStart.value.mouseY;
    
    let newX = resizeStart.value.x;
    let newY = resizeStart.value.y;
    let newWidth = resizeStart.value.width;
    let newHeight = resizeStart.value.height;
    
    const aspectRatio = resizeStart.value.width / resizeStart.value.height;
    
    switch (resizeHandle.value) {
      case "se": // 右下角 - 按比例缩放
        newWidth = Math.max(10, resizeStart.value.width + deltaX);
        newHeight = newWidth / aspectRatio;
        break;
      case "sw": // 左下角 - 按比例缩放
        newWidth = Math.max(10, resizeStart.value.width - deltaX);
        newHeight = newWidth / aspectRatio;
        newX = resizeStart.value.x + resizeStart.value.width - newWidth;
        break;
      case "ne": // 右上角 - 按比例缩放
        newWidth = Math.max(10, resizeStart.value.width + deltaX);
        newHeight = newWidth / aspectRatio;
        newY = resizeStart.value.y + resizeStart.value.height - newHeight;
        break;
      case "nw": // 左上角 - 按比例缩放
        newWidth = Math.max(10, resizeStart.value.width - deltaX);
        newHeight = newWidth / aspectRatio;
        newX = resizeStart.value.x + resizeStart.value.width - newWidth;
        newY = resizeStart.value.y + resizeStart.value.height - newHeight;
        break;
      case "n": // 上边 - 只改变高度
        newHeight = Math.max(10, resizeStart.value.height - deltaY);
        newY = resizeStart.value.y + resizeStart.value.height - newHeight;
        break;
      case "s": // 下边 - 只改变高度
        newHeight = Math.max(10, resizeStart.value.height + deltaY);
        break;
      case "e": // 右边 - 只改变宽度
        newWidth = Math.max(10, resizeStart.value.width + deltaX);
        break;
      case "w": // 左边 - 只改变宽度
        newWidth = Math.max(10, resizeStart.value.width - deltaX);
        newX = resizeStart.value.x + resizeStart.value.width - newWidth;
        break;
    }
    
    element.x = newX;
    element.y = newY;
    element.width = newWidth;
    element.height = newHeight;
    return;
  }
  
  if (isDragging.value && selectedElements.value.length > 0) {
    const deltaX = sceneCoords.x - dragStart.value.x;
    const deltaY = sceneCoords.y - dragStart.value.y;
    
    selectedElements.value.forEach(element => {
      element.x += deltaX;
      element.y += deltaY;
    });
    
    dragStart.value = sceneCoords;
    return;
  }
  
  if (isDrawing.value && canvasElements.value.length > 0) {
    const currentElement = canvasElements.value[canvasElements.value.length - 1];
    
    if (currentElement.type === "line") {
      currentElement.points.push({ x: sceneCoords.x, y: sceneCoords.y });
      currentElement.width = sceneCoords.x - currentElement.x;
      currentElement.height = sceneCoords.y - currentElement.y;
    } else {
      currentElement.width = sceneCoords.x - currentElement.x;
      currentElement.height = sceneCoords.y - currentElement.y;
    }
  }
};

// 处理鼠标抬起事件
// 功能：结束当前操作（拖动、绘制、平移、调整大小）
const handleMouseUp = () => {
  if (isPanning.value) {
    isPanning.value = false;
    updateCursor();
  }
  
  if (isResizing.value) {
    isResizing.value = false;
    resizeHandle.value = null;
    updateCursor();
  }
  
  if (isDrawing.value && canvasElements.value.length > 0 && !isDoubleClick.value) {
    const currentElement = canvasElements.value[canvasElements.value.length - 1];
    
    if (currentElement.type !== "text" && Math.abs(currentElement.width) < 5 && Math.abs(currentElement.height) < 5) {
      canvasElements.value.pop();
    } else {
      selectedElements.value = [currentElement];
      // 绘制完成后切换回选择工具
      currentTool.value = "select";
      updateCursor();
    }
  }
  
  isDragging.value = false;
  isDrawing.value = false;
};

// 处理鼠标滚轮事件
// 功能：以鼠标位置为中心进行缩放
// 参数：
//   - event: 鼠标滚轮事件对象
const handleWheel = (event) => {
  event.preventDefault();
  
  const delta = event.deltaY > 0 ? 0.9 : 1.1;
  const newScale = Math.max(0.1, Math.min(10, appState.scale * delta));
  
  const { clientX, clientY } = event;
  const mouseCanvasCoords = clientToCanvasCoords(clientX, clientY);
  
  const worldX = (mouseCanvasCoords.x - appState.scrollX) / appState.scale;
  const worldY = (mouseCanvasCoords.y - appState.scrollY) / appState.scale;
  
  appState.scale = newScale;
  
  appState.scrollX = mouseCanvasCoords.x - worldX * appState.scale;
  appState.scrollY = mouseCanvasCoords.y - worldY * appState.scale;
};

// 放大视图
// 功能：以画布中心为中心放大视图（最大10倍）
const zoomIn = () => {
  const centerX = appState.width / 2;
  const centerY = appState.height / 2;
  const worldX = (centerX - appState.scrollX) / appState.scale;
  const worldY = (centerY - appState.scrollY) / appState.scale;
  
  appState.scale = Math.min(10, appState.scale * 1.2);
  
  appState.scrollX = centerX - worldX * appState.scale;
  appState.scrollY = centerY - worldY * appState.scale;
};

// 缩小视图
// 功能：以画布中心为中心缩小视图（最小0.1倍）
const zoomOut = () => {
  const centerX = appState.width / 2;
  const centerY = appState.height / 2;
  const worldX = (centerX - appState.scrollX) / appState.scale;
  const worldY = (centerY - appState.scrollY) / appState.scale;
  
  appState.scale = Math.max(0.1, appState.scale / 1.2);
  
  appState.scrollX = centerX - worldX * appState.scale;
  appState.scrollY = centerY - worldY * appState.scale;
};

// 重置视图
// 功能：将视图重置到初始状态（缩放1倍，滚动到中心）
const resetView = () => {
  appState.scrollX = appState.width / 2;
  appState.scrollY = appState.height / 2;
  appState.scale = 1;
};

// 递归查找元素
// 功能：从后往前遍历所有元素，返回指定坐标处的元素（优先返回上层元素）
// 参数：
//   - x: 场景x坐标
//   - y: 场景y坐标
// 返回：找到的元素或null
const findElementAt = (x, y) => {
  // 从后往前遍历，优先返回上层元素
  for (let i = canvasElements.value.length - 1; i >= 0; i--) {
    const element = canvasElements.value[i];
    const found = findElementAtRecursive(element, x, y);
    if (found) {
      return found;
    }
  }
  return null;
};

// 递归检查元素及其子元素
// 功能：递归检查指定坐标是否在元素或其子元素内
// 参数：
//   - element: 要检查的元素
//   - x: 场景x坐标
//   - y: 场景y坐标
//   - parentTransform: 父元素的变换（默认{ x: 0, y: 0 }）
// 返回：找到的元素或null
const findElementAtRecursive = (element, x, y, parentTransform = { x: 0, y: 0 }) => {
  const { x: ex, y: ey, width, height, type, text, children } = element;
  const actualX = ex + parentTransform.x;
  const actualY = ey + parentTransform.y;
  
  // 对于包含子元素的卡片，先检查子元素
  if (children && children.length > 0) {
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i];
      const foundChild = findElementAtRecursive(child, x, y, { x: actualX, y: actualY });
      if (foundChild) {
        return foundChild;
      }
    }
  }
  
  // 检查当前元素是否被点击
  if (isPointInElement(actualX, actualY, width, height, type, text, x, y)) {
    return element;
  }
  
  return null;
};

// 检查点是否在元素内
// 功能：判断指定坐标是否在元素的边界内
// 参数：
//   - ex: 元素的x坐标
//   - ey: 元素的y坐标
//   - width: 元素的宽度
//   - height: 元素的高度
//   - type: 元素类型
//   - text: 文本内容（仅用于text类型）
//   - x: 要检查的点x坐标
//   - y: 要检查的点y坐标
// 返回：boolean - 是否在元素内
const isPointInElement = (ex, ey, width, height, type, text, x, y) => {
  if (type === "text") {
    // 文本元素使用实际的width和height属性
    // Canvas文本绘制是从基线开始的，第一行的基线在ey位置
    // drawTextWithWrapping返回的height = lines.length * lineHeight
    // 文本的顶部在第一行基线上方一个字体大小的位置
    // 文本的底部在最后一行基线下方一个字体大小的位置
    const fontSize = 16;
    const textWidth = width || 200;
    const textHeight = height || fontSize;
    
    const minX = ex;
    const maxX = ex + textWidth;
    // 文本的顶部在第一行基线上方一个字体大小的位置
    const minY = ey - fontSize;
    // 文本的底部在 ey + textHeight 的位置（因为textHeight已经包含了最后一行的高度）
    const maxY = ey + textHeight;
    
    return x >= minX && x <= maxX && y >= minY && y <= maxY;
  } else {
    const minX = Math.min(ex, ex + width);
    const maxX = Math.max(ex, ex + width);
    const minY = Math.min(ey, ey + height);
    const maxY = Math.max(ey, ey + height);
    
    return x >= minX && x <= maxX && y >= minY && y <= maxY;
  }
};

// 处理拖拽开始事件
// 功能：开始拖拽图片，设置拖拽效果
// 参数：
//   - event: 拖拽事件对象
//   - image: 被拖拽的图片对象
const handleDragStart = (event, image) => {
  draggedImage.value = image;
  event.dataTransfer.effectAllowed = "copy";
};

// 处理拖拽放下事件
// 功能：将拖拽的图片添加到画布中
// 参数：
//   - event: 拖拽事件对象
const handleDrop = (event) => {
  event.preventDefault();
  const sceneCoords = viewportCoordsToSceneCoords(event.clientX, event.clientY);
  const dragType = event.dataTransfer.getData('dragType');
  
  if (draggedImage.value) {
    addImageToCanvas(draggedImage.value.src, 200, 200, sceneCoords.x, sceneCoords.y);
    draggedImage.value = null;
  } else if (dragType === 'whole-card') {
    const cardData = event.dataTransfer.getData('cardData');
    if (cardData) {
      const card = JSON.parse(cardData);
      addCardToCanvas(card, sceneCoords.x, sceneCoords.y);
    }
  } else if (dragType === 'single-image') {
    const imageSrc = event.dataTransfer.getData('imageSrc');
    if (imageSrc) {
      addImageToCanvas(imageSrc, 200, 200, sceneCoords.x, sceneCoords.y);
    }
  }
};

const addImageToCanvas = (imageSrc, maxWidth, maxHeight, centerX, centerY) => {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    let width = img.width;
    let height = img.height;
    
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width *= ratio;
      height *= ratio;
    }
    
    const newElement = {
      id: Date.now(),
      type: "image",
      x: centerX - width / 2,
      y: centerY - height / 2,
      width: width,
      height: height,
      src: imageSrc,
      image: img,
      strokeColor: strokeColor.value,
      strokeWidth: strokeWidth.value
    };
    
    canvasElements.value.push(newElement);
    selectedElements.value = [newElement];
  };
  img.onerror = () => {
    console.error('Failed to load image:', imageSrc);
  };
  img.src = imageSrc;
};

const createImageElement = (imageSrc, maxWidth, maxHeight, x, y, parentId) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      const imgElement = {
        id: Date.now(),
        type: "image",
        x: x,
        y: y,
        width: width,
        height: height,
        src: imageSrc,
        image: img,
        parentId: parentId
      };
      
      resolve(imgElement);
    };
    img.onerror = () => {
      console.error('Failed to load image:', imageSrc);
      reject(new Error('Failed to load image'));
    };
    img.src = imageSrc;
  });
};

const addCardToCanvas = (card, centerX, centerY) => {
  const padding = 20;
  const cardWidth = 400;
  const fontSize = 14;
  const lineHeight = fontSize * 1.2;
  
  const textHeight = lineHeight * 2;
  const imagesPerRow = 2;
  const imgItemWidth = (cardWidth - padding * 3) / imagesPerRow;
  const imgItemHeight = 120;
  const imgStartY = padding + textHeight + padding;
  
  const totalImages = card.images.length;
  const rows = Math.ceil(totalImages / imagesPerRow);
  const totalImgHeight = rows * imgItemHeight + (rows > 0 ? (rows - 1) * padding : 0);
  const cardHeight = padding * 3 + textHeight + totalImgHeight;
  
  const cardElement = {
    id: Date.now(),
    type: "card",
    x: centerX - cardWidth / 2,
    y: centerY - cardHeight / 2,
    width: cardWidth,
    height: cardHeight,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    children: []
  };
  
  const textElement = {
    id: Date.now() + 1,
    type: "text",
    x: padding,
    y: padding + lineHeight,
    width: cardWidth - padding * 2,
    height: textHeight,
    fontSize: fontSize,
    fontWeight: "bold",
    strokeColor: "#333333",
    text: card.title,
    parentId: cardElement.id
  };
  cardElement.children.push(textElement);
  
  let loadedImagesCount = 0;
  
  if (totalImages === 0) {
    canvasElements.value.push(cardElement);
    return;
  }
  
  const imagePromises = card.images.map((imgSrc, index) => {
    const col = index % imagesPerRow;
    const row = Math.floor(index / imagesPerRow);
    
    return createImageElement(
      imgSrc,
      imgItemWidth,
      imgItemHeight,
      padding + col * (imgItemWidth + padding),
      imgStartY + row * (imgItemHeight + padding),
      cardElement.id
    ).then(imgElement => {
      const aspectRatio = imgElement.image.width / imgElement.image.height;
      let displayWidth = imgItemWidth;
      let displayHeight = imgItemHeight;
      
      if (aspectRatio > 1) {
        displayHeight = imgItemWidth / aspectRatio;
      } else {
        displayWidth = imgItemHeight * aspectRatio;
      }
      
      imgElement.x += (imgItemWidth - displayWidth) / 2;
      imgElement.y += (imgItemHeight - displayHeight) / 2;
      imgElement.width = displayWidth;
      imgElement.height = displayHeight;
      
      cardElement.children.push(imgElement);
      loadedImagesCount++;
    });
  });
  
  Promise.all(imagePromises).then(() => {
    canvasElements.value.push(cardElement);
  }).catch(err => {
    console.error('Error loading images for card:', err);
    canvasElements.value.push(cardElement);
  });
};

// 删除选中的元素
// 功能：从画布中删除所有选中的元素（包括子元素）
const deleteSelected = () => {
  selectedElements.value.forEach(element => {
    const index = canvasElements.value.indexOf(element);
    if (index !== -1) {
      canvasElements.value.splice(index, 1);
    } else {
      const deleteFromParent = (elements, parentId) => {
        for (const el of elements) {
          if (el.id === parentId) {
            const childIndex = el.children?.indexOf(element);
            if (childIndex !== -1) {
              el.children.splice(childIndex, 1);
            }
            return true;
          }
          if (el.children && el.children.length > 0) {
            if (deleteFromParent(el.children, parentId)) {
              return true;
            }
          }
        }
        return false;
      };
      deleteFromParent(canvasElements.value, element.parentId);
    }
  });
  selectedElements.value = [];
};

// 清空画布
// 功能：删除所有元素和选中状态
const clearCanvas = () => {
  canvasElements.value = [];
  selectedElements.value = [];
};

// 导出画布为图片
// 功能：将画布内容导出为PNG图片并下载
const exportCanvas = () => {
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");
  
  const bounds = calculateBounds();
  const padding = 50;
  
  tempCanvas.width = (bounds.width + padding * 2) * window.devicePixelRatio;
  tempCanvas.height = (bounds.height + padding * 2) * window.devicePixelRatio;
  tempCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
  
  tempCtx.fillStyle = "#ffffff";
  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
  
  tempCtx.save();
  tempCtx.translate(-bounds.x + padding, -bounds.y + padding);
  
  canvasElements.value.forEach(element => {
    drawElement(element, { context: tempCtx, scale: 1, useViewportCoords: false });
  });
  
  tempCtx.restore();
  
  const link = document.createElement("a");
  link.download = `canvas-export-${Date.now()}.png`;
  link.href = tempCanvas.toDataURL("image/png");
  link.click();
};

// 递归计算元素及其子元素的边界
// 功能：计算元素及其所有子元素的最小包围盒
// 参数：
//   - element: 要计算边界的元素
//   - parentTransform: 父元素的变换（默认{ x: 0, y: 0 }）
// 返回：{ minX, minY, maxX, maxY } - 边界坐标
const calculateElementBounds = (element, parentTransform = { x: 0, y: 0 }) => {
  const actualX = element.x + parentTransform.x;
  const actualY = element.y + parentTransform.y;
  const actualRight = actualX + element.width;
  const actualBottom = actualY + element.height;
  
  let minX = actualX;
  let minY = actualY;
  let maxX = actualRight;
  let maxY = actualBottom;
  
  // 处理子元素
  if (element.children && element.children.length > 0) {
    element.children.forEach(child => {
      const childBounds = calculateElementBounds(child, { x: actualX, y: actualY });
      minX = Math.min(minX, childBounds.minX);
      minY = Math.min(minY, childBounds.minY);
      maxX = Math.max(maxX, childBounds.maxX);
      maxY = Math.max(maxY, childBounds.maxY);
    });
  }
  
  return { minX, minY, maxX, maxY };
};

// 计算所有元素的边界
// 功能：计算画布中所有元素的最小包围盒
// 返回：{ x, y, width, height } - 边界矩形
const calculateBounds = () => {
  if (canvasElements.value.length === 0) {
    return { x: 0, y: 0, width: 100, height: 100 };
  }
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  canvasElements.value.forEach(element => {
    const bounds = calculateElementBounds(element);
    minX = Math.min(minX, bounds.minX);
    minY = Math.min(minY, bounds.minY);
    maxX = Math.max(maxX, bounds.maxX);
    maxY = Math.max(maxY, bounds.maxY);
  });
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
};














</script>

<style lang="scss" scoped>
.canvas-container {
  display: flex;
  height: 100%;
  width: 100%;
  background-color: #E8E8E8;
  overflow: hidden;
}

.left-panel {
  width: 280px;
  background-color: #f8f9fa;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  min-width: 0;
}

.panel-title {
  padding: 16px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #e0e0e0;
}

.image-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.image-item {
  margin-bottom: 16px;
  cursor: move;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  img {
    width: 100%;
    height: 150px;
    object-fit: cover;
    display: block;
  }

  .image-name {
    padding: 8px 12px;
    background-color: #fff;
    font-size: 14px;
    color: #666;
    text-align: center;
  }
}

.header-section {
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #fafafa;
  flex-shrink: 0;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.toolbar {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;

  button {
    padding: 6px 12px;
    font-size: 13px;
    font-weight: 500;
    color: #fff;
    background-color: #2196F3;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: #1976D2;
    }

    &.active {
      background-color: #0D47A1;
      box-shadow: 0 2px 8px rgba(13, 71, 161, 0.3);
    }
  }

  .brush-controls {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 4px 10px;
    background-color: #f5f5f5;
    border-radius: 4px;

    label {
      font-size: 13px;
      color: #666;
      white-space: nowrap;
    }

    input[type="color"] {
      width: 32px;
      height: 24px;
      border: 1px solid #ddd;
      border-radius: 3px;
      cursor: pointer;
    }

    input[type="range"] {
      width: 80px;
      cursor: pointer;
    }
  }

  .navigation-controls {
    display: flex;
    gap: 4px;
    align-items: center;
    padding: 4px 10px;
    background-color: #f5f5f5;
    border-radius: 4px;

    button {
      width: 24px;
      height: 24px;
      padding: 0;
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      background-color: #607D8B;
      border: none;
      border-radius: 3px;
      cursor: pointer;

      &:hover {
        background-color: #455A64;
      }
    }

    .zoom-level {
      font-size: 12px;
      font-weight: 500;
      color: #666;
      min-width: 40px;
      text-align: center;
    }
  }

  .action-buttons {
    display: flex;
    gap: 8px;

    button {
      padding: 6px 12px;
      font-size: 13px;
      font-weight: 500;
      color: #fff;
      background-color: #4CAF50;
      border: none;
      border-radius: 4px;
      cursor: pointer;

      &:hover {
        background-color: #45a049;
      }

      &:nth-child(1) {
        background-color: #f44336;

        &:hover {
          background-color: #da190b;
        }
      }

      &:nth-child(2) {
        background-color: #FF9800;

        &:hover {
          background-color: #F57C00;
        }
      }
    }
  }
}

.canvas-wrapper {
  height: 100%;
  position: relative;
  overflow: hidden;
  background-color: #fafafa;

  canvas {
    display: block;
    background-color: #fff;
  }
  
  .text-input-overlay {
    position: absolute;
    border: 2px solid #2196F3;
    border-radius: 4px;
    padding: 8px 12px;
    outline: none;
    background-color: rgba(255, 255, 255, 0.98);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    font-family: Arial, sans-serif;
    z-index: 1000;
    min-width: 150px;
    min-height: 30px;
    line-height: 1.4;
  }
}

.status-bar {
  padding: 8px 16px;
  background-color: #f5f5f5;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 24px;
  font-size: 12px;
  color: #666;
  flex-shrink: 0;

  span {
    white-space: nowrap;
  }
}
</style>