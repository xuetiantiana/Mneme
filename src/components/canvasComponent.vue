<template>
  <div class="canvas-container">
    <div class="left-panel">
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
      <div class="header-section">
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
      </div>
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
        @contextmenu.prevent
      >
        <canvas ref="canvasRef"></canvas>
      </div>
      <div class="status-bar">
        <span>元素数量: {{ elements.length }}</span>
        <span>坐标: ({{ Math.round(appState.scrollX) }}, {{ Math.round(appState.scrollY) }})</span>
        <span>缩放: {{ Math.round(appState.scale * 100) }}%</span>
        {{ elements }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive } from "vue";
import image1 from "@/assets/images/1691549357221680.png";
import image2 from "@/assets/images/OIP-C.png";
import image3 from "@/assets/images/OIP-C2.png";

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

const elements = ref([]);
const selectedElements = ref([]);
const draggedImage = ref(null);
const currentTool = ref("select");
const isDragging = ref(false);
const isDrawing = ref(false);
const isPanning = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const lastMousePos = ref({ x: 0, y: 0 });
const strokeColor = ref("#000000");
const strokeWidth = ref(2);

let rafId = null;

onMounted(() => {
  initCanvas();
  window.addEventListener("resize", handleResize);
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);
  if (rafId) {
    cancelAnimationFrame(rafId);
  }
});

const initCanvas = () => {
  // 获取Canvas和容器的引用
  const canvas = canvasRef.value;
  const container = canvasContainer.value;
  if (canvas && container) {
    // 获取容器的尺寸和偏移量
    const { offsetWidth, offsetHeight, offsetLeft, offsetTop } = container;
    
    // 设置Canvas的实际像素尺寸（考虑设备像素比以支持高清屏）
    canvas.width = offsetWidth * window.devicePixelRatio;
    canvas.height = offsetHeight * window.devicePixelRatio;
    // 设置Canvas的CSS显示尺寸
    canvas.style.width = `${offsetWidth}px`;
    canvas.style.height = `${offsetHeight}px`;
    
    // 获取2D绘图上下文并应用缩放
    ctx.value = canvas.getContext("2d");
    ctx.value.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // 初始化应用状态
    appState.width = offsetWidth;
    appState.height = offsetHeight;
    appState.offsetLeft = offsetLeft;
    appState.offsetTop = offsetTop;
    // 将视图中心设置为初始滚动位置
    appState.scrollX = offsetWidth / 2;
    appState.scrollY = offsetHeight / 2;
    
    // 开始渲染场景
    renderScene();
  }
};

const handleResize = () => {
  initCanvas();
};

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

const handleKeyUp = (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    if (appState.previousTool) {
      currentTool.value = appState.previousTool;
      updateCursor();
    }
  }
};

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

// 将视口坐标转换为场景坐标
const viewportCoordsToSceneCoords = (clientX, clientY) => {
  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();
  // 公式：(视口坐标 - Canvas左边距 - 滚动偏移量) / 缩放比例
  const x = (clientX - rect.left - appState.scrollX) / appState.scale;
  const y = (clientY - rect.top - appState.scrollY) / appState.scale;
  return { x, y };
};

// 将场景坐标转换为视口坐标
const sceneCoordsToViewportCoords = (sceneX, sceneY) => {
  // 公式：场景坐标 * 缩放比例 + 滚动偏移量
  const x = sceneX * appState.scale + appState.scrollX;
  const y = sceneY * appState.scale + appState.scrollY;
  return { x, y };
};

// 渲染场景主函数
const renderScene = () => {
  // 检查Canvas上下文和引用是否存在
  if (!ctx.value || !canvasRef.value) return;
  
  const canvas = canvasRef.value;
  const { width, height } = appState;
  
  // 清空Canvas画布
  ctx.value.clearRect(0, 0, width, height);
  
  // 绘制背景
  drawBackground();
  // 绘制网格
  drawGrid();
  // 绘制所有元素
  drawElements();
  // 绘制选中框
  drawSelection();
  
  // 取消之前的动画帧请求，避免重复渲染
  if (rafId) {
    cancelAnimationFrame(rafId);
  }
  // 请求下一帧动画，实现持续渲染
  rafId = requestAnimationFrame(renderScene);
};

const drawBackground = () => {
  if (!ctx.value) return;
  ctx.value.fillStyle = "#f8f9fa";
  ctx.value.fillRect(0, 0, appState.width, appState.height);
};

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

const drawElements = () => {
  if (!ctx.value) return;
  
  elements.value.forEach(element => {
    drawElement(element);
  });
};

const drawElement = (element) => {
  if (!ctx.value) return;
  
  const { x, y, width, height, type, strokeColor, strokeWidth, points } = element;
  const viewportPos = sceneCoordsToViewportCoords(x, y);
  
  ctx.value.save();
  ctx.value.strokeStyle = strokeColor;
  ctx.value.lineWidth = strokeWidth * appState.scale;
  ctx.value.lineCap = "round";
  ctx.value.lineJoin = "round";
  
  switch (type) {
    case "rectangle":
      ctx.value.strokeRect(
        viewportPos.x,
        viewportPos.y,
        width * appState.scale,
        height * appState.scale
      );
      break;
      
    case "circle":
      const radius = Math.sqrt(width * width + height * height) / 2;
      ctx.value.beginPath();
      ctx.value.arc(
        viewportPos.x + (width * appState.scale) / 2,
        viewportPos.y + (height * appState.scale) / 2,
        radius * appState.scale,
        0,
        Math.PI * 2
      );
      ctx.value.stroke();
      break;
      
    case "line":
      if (points && points.length >= 2) {
        ctx.value.beginPath();
        const start = sceneCoordsToViewportCoords(points[0].x, points[0].y);
        ctx.value.moveTo(start.x, start.y);
        for (let i = 1; i < points.length; i++) {
          const point = sceneCoordsToViewportCoords(points[i].x, points[i].y);
          ctx.value.lineTo(point.x, point.y);
        }
        ctx.value.stroke();
      }
      break;
      
    case "text":
      ctx.value.font = `${16 * appState.scale}px Arial`;
      ctx.value.fillStyle = strokeColor;
      ctx.value.fillText(element.text || "文本", viewportPos.x, viewportPos.y);
      break;
      
    case "image":
      if (element.image) {
        ctx.value.drawImage(
          element.image,
          viewportPos.x,
          viewportPos.y,
          width * appState.scale,
          height * appState.scale
        );
      }
      break;
  }
  
  ctx.value.restore();
};

const drawSelection = () => {
  if (!ctx.value || selectedElements.value.length === 0) return;
  
  ctx.value.save();
  ctx.value.strokeStyle = "#2196F3";
  ctx.value.lineWidth = 2;
  ctx.value.setLineDash([5, 5]);
  
  selectedElements.value.forEach(element => {
    const viewportPos = sceneCoordsToViewportCoords(element.x, element.y);
    ctx.value.strokeRect(
      viewportPos.x - 5,
      viewportPos.y - 5,
      element.width * appState.scale + 10,
      element.height * appState.scale + 10
    );
  });
  
  ctx.value.restore();
};

const setTool = (tool) => {
  currentTool.value = tool;
  selectedElements.value = [];
  updateCursor();
};

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
    const newElement = {
      id: Date.now(),
      type: currentTool.value,
      x: sceneCoords.x,
      y: sceneCoords.y,
      width: 0,
      height: 0,
      strokeColor: strokeColor.value,
      strokeWidth: strokeWidth.value,
      points: currentTool.value === "line" ? [{ x: sceneCoords.x, y: sceneCoords.y }] : [],
      text: currentTool.value === "text" ? "双击编辑文本" : ""
    };
    elements.value.push(newElement);
  }
};

const handleMouseMove = (event) => {
  const { clientX, clientY } = event;
  const sceneCoords = viewportCoordsToSceneCoords(clientX, clientY);
  
  if (isPanning.value) {
    const deltaX = clientX - lastMousePos.value.x;
    const deltaY = clientY - lastMousePos.value.y;
    appState.scrollX += deltaX;
    appState.scrollY += deltaY;
    lastMousePos.value = { x: clientX, y: clientY };
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
  
  if (isDrawing.value && elements.value.length > 0) {
    const currentElement = elements.value[elements.value.length - 1];
    
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

const handleMouseUp = () => {
  if (isPanning.value) {
    isPanning.value = false;
    updateCursor();
  }
  
  if (isDrawing.value && elements.value.length > 0) {
    const currentElement = elements.value[elements.value.length - 1];
    
    if (Math.abs(currentElement.width) < 5 && Math.abs(currentElement.height) < 5) {
      elements.value.pop();
    } else {
      selectedElements.value = [currentElement];
    }
  }
  
  isDragging.value = false;
  isDrawing.value = false;
};

const handleWheel = (event) => {
  event.preventDefault();
  
  const delta = event.deltaY > 0 ? 0.9 : 1.1;
  const newScale = Math.max(0.1, Math.min(10, appState.scale * delta));
  
  const { clientX, clientY } = event;
  const rect = canvasRef.value.getBoundingClientRect();
  const mouseX = clientX - rect.left;
  const mouseY = clientY - rect.top;
  
  const worldX = (mouseX - appState.scrollX) / appState.scale;
  const worldY = (mouseY - appState.scrollY) / appState.scale;
  
  appState.scale = newScale;
  
  appState.scrollX = mouseX - worldX * appState.scale;
  appState.scrollY = mouseY - worldY * appState.scale;
};

const zoomIn = () => {
  const centerX = appState.width / 2;
  const centerY = appState.height / 2;
  const worldX = (centerX - appState.scrollX) / appState.scale;
  const worldY = (centerY - appState.scrollY) / appState.scale;
  
  appState.scale = Math.min(10, appState.scale * 1.2);
  
  appState.scrollX = centerX - worldX * appState.scale;
  appState.scrollY = centerY - worldY * appState.scale;
};

const zoomOut = () => {
  const centerX = appState.width / 2;
  const centerY = appState.height / 2;
  const worldX = (centerX - appState.scrollX) / appState.scale;
  const worldY = (centerY - appState.scrollY) / appState.scale;
  
  appState.scale = Math.max(0.1, appState.scale / 1.2);
  
  appState.scrollX = centerX - worldX * appState.scale;
  appState.scrollY = centerY - worldY * appState.scale;
};

const resetView = () => {
  appState.scrollX = appState.width / 2;
  appState.scrollY = appState.height / 2;
  appState.scale = 1;
};

const findElementAt = (x, y) => {
  for (let i = elements.value.length - 1; i >= 0; i--) {
    const element = elements.value[i];
    const { x: ex, y: ey, width, height } = element;
    
    const minX = Math.min(ex, ex + width);
    const maxX = Math.max(ex, ex + width);
    const minY = Math.min(ey, ey + height);
    const maxY = Math.max(ey, ey + height);
    
    if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
      return element;
    }
  }
  return null;
};

const handleDragStart = (event, image) => {
  draggedImage.value = image;
  event.dataTransfer.effectAllowed = "copy";
};

const handleDrop = (event) => {
  event.preventDefault();
  const sceneCoords = viewportCoordsToSceneCoords(event.clientX, event.clientY);
  
  if (draggedImage.value) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const maxWidth = 200;
      const maxHeight = 200;
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
        x: sceneCoords.x - width / 2,
        y: sceneCoords.y - height / 2,
        width: width,
        height: height,
        image: img,
        strokeColor: strokeColor.value,
        strokeWidth: strokeWidth.value
      };
      
      elements.value.push(newElement);
      selectedElements.value = [newElement];
    };
    img.src = draggedImage.value.src;
    draggedImage.value = null;
  }
};

const deleteSelected = () => {
  selectedElements.value.forEach(element => {
    const index = elements.value.indexOf(element);
    if (index !== -1) {
      elements.value.splice(index, 1);
    }
  });
  selectedElements.value = [];
};

const clearCanvas = () => {
  elements.value = [];
  selectedElements.value = [];
};

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
  
  elements.value.forEach(element => {
    drawElementToContext(tempCtx, element, 1);
  });
  
  tempCtx.restore();
  
  const link = document.createElement("a");
  link.download = `canvas-export-${Date.now()}.png`;
  link.href = tempCanvas.toDataURL("image/png");
  link.click();
};

const drawElementToContext = (context, element, scale) => {
  const { x, y, width, height, type, strokeColor, strokeWidth, points, image, text } = element;
  
  context.save();
  context.strokeStyle = strokeColor;
  context.lineWidth = strokeWidth * scale;
  context.lineCap = "round";
  context.lineJoin = "round";
  
  switch (type) {
    case "rectangle":
      context.strokeRect(x, y, width, height);
      break;
      
    case "circle":
      const radius = Math.sqrt(width * width + height * height) / 2;
      context.beginPath();
      context.arc(x + width / 2, y + height / 2, radius, 0, Math.PI * 2);
      context.stroke();
      break;
      
    case "line":
      if (points && points.length >= 2) {
        context.beginPath();
        context.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          context.lineTo(points[i].x, points[i].y);
        }
        context.stroke();
      }
      break;
      
    case "text":
      context.font = `${16 * scale}px Arial`;
      context.fillStyle = strokeColor;
      context.fillText(text || "文本", x, y);
      break;
      
    case "image":
      if (image) {
        context.drawImage(image, x, y, width, height);
      }
      break;
  }
  
  context.restore();
};

const calculateBounds = () => {
  if (elements.value.length === 0) {
    return { x: 0, y: 0, width: 100, height: 100 };
  }
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  elements.value.forEach(element => {
    const ex = element.x;
    const ey = element.y;
    const ew = element.width;
    const eh = element.height;
    
    minX = Math.min(minX, ex, ex + ew);
    minY = Math.min(minY, ey, ey + eh);
    maxX = Math.max(maxX, ex, ex + ew);
    maxY = Math.max(maxY, ey, ey + eh);
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
  height: 100vh;
  background-color: #fff;
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
  flex: 1;
  position: relative;
  overflow: hidden;
  background-color: #fafafa;

  canvas {
    display: block;
    background-color: #fff;
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
