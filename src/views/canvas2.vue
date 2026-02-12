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
        <div class="title">Canvas 编辑器</div>
        <div class="toolbar">
          <button 
            :class="{ active: currentTool === 'pan' }"
            @click="setTool('pan')"
            title="移动画布"
          >
            移动
          </button>
          <button 
            :class="{ active: currentTool === 'brush' }"
            @click="setTool('brush')"
            title="画笔"
          >
            画笔
          </button>
          <button 
            :class="{ active: currentTool === 'eraser' }"
            @click="setTool('eraser')"
            title="橡皮擦"
          >
            橡皮擦
          </button>
          <div class="brush-controls">
            <label>颜色:</label>
            <input 
              type="color" 
              v-model="brushColor" 
              :disabled="currentTool === 'eraser' || currentTool === 'pan'"
            />
            <label>大小: {{ brushSize }}px</label>
            <input 
              type="range" 
              v-model="brushSize" 
              min="1" 
              max="50" 
              :disabled="currentTool === 'eraser' || currentTool === 'pan'"
            />
          </div>
          <div class="navigation-controls">
            <button @click="zoomOut" title="缩小">-</button>
            <span class="zoom-level">{{ Math.round(scale.value * 100) }}%</span>
            <button @click="zoomIn" title="放大">+</button>
            <button @click="resetView" title="重置视图">重置</button>
          </div>
          <div class="action-buttons">
            <button @click="clearCanvas">清空画布</button>
            <button @click="downloadCanvas">下载图片</button>
          </div>
        </div>
      </div>
      <div
        class="canvas-wrapper"
        @dragover.prevent
        @drop="handleDrop"
        @mousedown="startDrawing"
        @mousemove="draw"
        @mouseup="stopDrawing"
        @mouseleave="stopDrawing"
        @wheel="handleWheel"
      >
        <canvas ref="canvasRef"></canvas>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import image1 from "@/assets/images/1691549357221680.png";
import image2 from "@/assets/images/OIP-C.png";
import image3 from "@/assets/images/OIP-C2.png";

const canvasRef = ref(null);
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

const draggedImage = ref(null);
const isDrawing = ref(false);
const isPanning = ref(false);
const lastX = ref(0);
const lastY = ref(0);
const panLastX = ref(0);
const panLastY = ref(0);
const offsetX = ref(0);
const offsetY = ref(0);
const scale = ref(1);
const currentTool = ref("pan");
const previousTool = ref("pan");
const brushColor = ref("#000000");
const brushSize = ref(5);

const CANVAS_SIZE = 10000;

onMounted(() => {
  initCanvas();
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);
});

const handleKeyDown = (event) => {
  if (event.code === "Space" && !event.repeat) {
    event.preventDefault();
    previousTool.value = currentTool.value;
    currentTool.value = "pan";
    if (canvasRef.value) {
      canvasRef.value.style.cursor = "grab";
    }
  }
};

const handleKeyUp = (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    if (previousTool.value) {
      currentTool.value = previousTool.value;
      if (canvasRef.value) {
        canvasRef.value.style.cursor = currentTool.value === "pan" ? "grab" : "crosshair";
      }
    }
  }
};

const initCanvas = () => {
  const canvas = canvasRef.value;
  if (canvas) {
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    ctx.value = canvas.getContext("2d");
    
    drawBackground();
    resetView();
  }
};

const drawBackground = () => {
  if (ctx.value) {
    ctx.value.fillStyle = "#f5f5f5";
    ctx.value.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    ctx.value.strokeStyle = "#ddd";
    ctx.value.lineWidth = 1;
    ctx.value.setLineDash([5, 5]);
    
    for (let i = 0; i < CANVAS_SIZE; i += 50) {
      ctx.value.beginPath();
      ctx.value.moveTo(i, 0);
      ctx.value.lineTo(i, CANVAS_SIZE);
      ctx.value.stroke();
    }
    
    for (let i = 0; i < CANVAS_SIZE; i += 50) {
      ctx.value.beginPath();
      ctx.value.moveTo(0, i);
      ctx.value.lineTo(CANVAS_SIZE, i);
      ctx.value.stroke();
    }
    
    ctx.value.setLineDash([]);
  }
};

const handleDragStart = (event, image) => {
  draggedImage.value = image;
  event.dataTransfer.effectAllowed = "copy";
};

const handleDrop = (event) => {
  event.preventDefault();
  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();
  
  const x = (event.clientX - rect.left - 20) / scale.value;
  const y = (event.clientY - rect.top - 20) / scale.value;
  
  if (draggedImage.value) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const maxWidth = 150;
      const maxHeight = 150;
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      ctx.value.drawImage(img, x - width / 2, y - height / 2, width, height);
    };
    img.src = draggedImage.value.src;
    draggedImage.value = null;
  }
};

const setTool = (tool) => {
  currentTool.value = tool;
  canvasRef.value.style.cursor = tool === "pan" ? "grab" : "crosshair";
};

const startDrawing = (event) => {
  if (currentTool.value === "pan") {
    isPanning.value = true;
    panLastX.value = event.clientX;
    panLastY.value = event.clientY;
    canvasRef.value.style.cursor = "grabbing";
  } else {
    isDrawing.value = true;
    const canvas = canvasRef.value;
    const rect = canvas.getBoundingClientRect();
    lastX.value = (event.clientX - rect.left - 20) / scale.value;
    lastY.value = (event.clientY - rect.top - 20) / scale.value;
  }
};

const draw = (event) => {
  if (currentTool.value === "pan" && isPanning.value) {
    const deltaX = event.clientX - panLastX.value;
    const deltaY = event.clientY - panLastY.value;
    offsetX.value += deltaX;
    offsetY.value += deltaY;
    panLastX.value = event.clientX;
    panLastY.value = event.clientY;
    updateCanvasTransform();
  } else if (isDrawing.value) {
    const canvas = canvasRef.value;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - 20) / scale.value;
    const y = (event.clientY - rect.top - 20) / scale.value;
    
    ctx.value.beginPath();
    ctx.value.moveTo(lastX.value, lastY.value);
    ctx.value.lineTo(x, y);
    ctx.value.strokeStyle = currentTool.value === "eraser" ? "#f5f5f5" : brushColor.value;
    ctx.value.lineWidth = currentTool.value === "eraser" ? 20 : brushSize.value;
    ctx.value.lineCap = "round";
    ctx.value.lineJoin = "round";
    ctx.value.stroke();
    
    lastX.value = x;
    lastY.value = y;
  }
};

const stopDrawing = () => {
  isDrawing.value = false;
  isPanning.value = false;
  if (currentTool.value === "pan") {
    canvasRef.value.style.cursor = "grab";
  }
};

const updateCanvasTransform = () => {
  if (canvasRef.value) {
    canvasRef.value.style.transform = `translate(${offsetX.value}px, ${offsetY.value}px) scale(${scale.value})`;
    canvasRef.value.style.transformOrigin = "0 0";
  }
};

const handleWheel = (event) => {
  event.preventDefault();
  const delta = event.deltaY > 0 ? 0.9 : 1.1;
  const newScale = Math.max(0.1, Math.min(5, scale.value * delta));
  
  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  
  const worldX = (mouseX - offsetX.value) / scale.value;
  const worldY = (mouseY - offsetY.value) / scale.value;
  
  scale.value = newScale;
  
  offsetX.value = mouseX - worldX * scale.value;
  offsetY.value = mouseY - worldY * scale.value;
  
  updateCanvasTransform();
};

const zoomIn = () => {
  const wrapper = document.querySelector(".canvas-wrapper");
  const wrapperRect = wrapper.getBoundingClientRect();
  
  const PADDING = 20;
  const centerX = (wrapperRect.width - PADDING * 2) / 2 + PADDING;
  const centerY = (wrapperRect.height - PADDING * 2) / 2 + PADDING;
  
  const worldX = (centerX - offsetX.value) / scale.value;
  const worldY = (centerY - offsetY.value) / scale.value;
  
  scale.value = Math.min(5, scale.value * 1.2);
  
  offsetX.value = centerX - worldX * scale.value;
  offsetY.value = centerY - worldY * scale.value;
  
  updateCanvasTransform();
};

const zoomOut = () => {
  const wrapper = document.querySelector(".canvas-wrapper");
  const wrapperRect = wrapper.getBoundingClientRect();
  
  const PADDING = 20;
  const centerX = (wrapperRect.width - PADDING * 2) / 2 + PADDING;
  const centerY = (wrapperRect.height - PADDING * 2) / 2 + PADDING;
  
  const worldX = (centerX - offsetX.value) / scale.value;
  const worldY = (centerY - offsetY.value) / scale.value;
  
  scale.value = Math.max(0.1, scale.value / 1.2);
  
  offsetX.value = centerX - worldX * scale.value;
  offsetY.value = centerY - worldY * scale.value;
  
  updateCanvasTransform();
};

const resetView = () => {
  const wrapper = document.querySelector(".canvas-wrapper");
  const wrapperRect = wrapper.getBoundingClientRect();
  
  offsetX.value = (wrapperRect.width - CANVAS_SIZE) / 2;
  offsetY.value = (wrapperRect.height - CANVAS_SIZE) / 2;
  scale.value = 1;
  
  updateCanvasTransform();
};

const clearCanvas = () => {
  drawBackground();
};

const downloadCanvas = () => {
  const link = document.createElement("a");
  link.download = "canvas-image.png";
  link.href = canvasRef.value.toDataURL("image/png");
  link.click();
};
</script>

<style lang="scss" scoped>
.canvas-container {
  display: flex;
  height: 100vh;
  background-color: #fff;
}

.left-panel {
  width: 280px;
  background-color: #f8f9fa;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #fff;
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
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #fafafa;
}

.title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.toolbar {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;

  button {
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    color: #fff;
    background-color: #2196F3;
    border: none;
    border-radius: 6px;
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
    gap: 12px;
    align-items: center;
    padding: 6px 12px;
    background-color: #f5f5f5;
    border-radius: 6px;

    label {
      font-size: 14px;
      color: #666;
      white-space: nowrap;
    }

    input[type="color"] {
      width: 36px;
      height: 28px;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    input[type="range"] {
      width: 100px;
      cursor: pointer;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }

  .navigation-controls {
    display: flex;
    gap: 6px;
    align-items: center;
    padding: 6px 12px;
    background-color: #f5f5f5;
    border-radius: 6px;

    button {
      width: 28px;
      height: 28px;
      padding: 0;
      font-size: 16px;
      font-weight: 600;
      color: #fff;
      background-color: #607D8B;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background-color: #455A64;
      }
    }

    .zoom-level {
      font-size: 13px;
      font-weight: 500;
      color: #666;
      min-width: 45px;
      text-align: center;
    }
  }

  .action-buttons {
    display: flex;
    gap: 10px;

    button {
      padding: 8px 20px;
      font-size: 14px;
      font-weight: 500;
      color: #fff;
      background-color: #4CAF50;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background-color: #45a049;
      }

      &:first-child {
        background-color: #f44336;

        &:hover {
          background-color: #da190b;
        }
      }
    }
  }
}

.canvas-wrapper {
  flex: 1;
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 20px;
  background-color: #fafafa;
  transition: border-color 0.3s;
  overflow: hidden;
  position: relative;

  &:hover {
    border-color: #4CAF50;
  }

  canvas {
    position: absolute;
    background-color: #fff;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    transform-origin: 0 0;
  }
}
</style>
