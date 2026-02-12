<template>
  <div class="diagram-container">
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
        <div class="title">Diagram.js 无限画布</div>
        <div class="toolbar">
          <button 
            :class="{ active: currentTool === 'select' }"
            @click="setTool('select')"
            title="选择工具"
          >
            选择
          </button>
          <button 
            :class="{ active: currentTool === 'hand' }"
            @click="setTool('hand')"
            title="移动画布"
          >
            移动
          </button>
          <div class="shape-buttons">
            <button @click="addShape('rectangle')" title="添加矩形">矩形</button>
            <button @click="addShape('circle')" title="添加圆形">圆形</button>
            <button @click="addShape('diamond')" title="添加菱形">菱形</button>
            <button @click="addShape('text')" title="添加文本">文本</button>
          </div>
          <div class="color-controls">
            <label>填充:</label>
            <input type="color" v-model="fillColor" />
            <label>边框:</label>
            <input type="color" v-model="strokeColor" />
          </div>
          <div class="navigation-controls">
            <button @click="zoomOut" title="缩小">-</button>
            <span class="zoom-level">{{ Math.round(zoom * 100) }}%</span>
            <button @click="zoomIn" title="放大">+</button>
            <button @click="resetView" title="重置视图">重置</button>
          </div>
          <div class="action-buttons">
            <button @click="deleteSelected">删除选中</button>
            <button @click="clearCanvas">清空画布</button>
            <button @click="exportSVG">导出SVG</button>
          </div>
        </div>
      </div>
      <div
        class="canvas-wrapper"
        ref="canvasContainer"
        @dragover.prevent
        @drop="handleDrop"
      >
        <div ref="diagramContainer" class="diagram-container-inner"></div>
      </div>
      <div class="status-bar">
        <span>元素数量: {{ elementCount }}</span>
        <span>视图: ({{ Math.round(viewbox.x) }}, {{ Math.round(viewbox.y) }})</span>
        <span>缩放: {{ Math.round(zoom * 100) }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import Diagram from 'diagram-js';
import 'diagram-js/assets/diagram-js.css';
import image1 from "@/assets/images/1691549357221680.png";
import image2 from "@/assets/images/OIP-C.png";
import image3 from "@/assets/images/OIP-C2.png";

const canvasContainer = ref(null);
const diagramContainer = ref(null);

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

const currentTool = ref("select");
const fillColor = ref("#ffffff");
const strokeColor = ref("#000000");
const zoom = ref(1);
const viewbox = ref({ x: 0, y: 0, width: 0, height: 0 });
const elementCount = ref(0);
const draggedImage = ref(null);

let diagram = null;
let eventBus = null;
let canvas = null;
let elementRegistry = null;
let modeling = null;

onMounted(() => {
  initDiagram();
  window.addEventListener("resize", handleResize);
  window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  if (diagram) {
    diagram.destroy();
  }
  window.removeEventListener("resize", handleResize);
  window.removeEventListener("keydown", handleKeyDown);
});

const initDiagram = () => {
  const container = diagramContainer.value;
  if (!container) return;

  try {
    diagram = new Diagram({
      container: container,
      keyboard: {
        bindTo: window
      }
    });

    canvas = diagram.get('canvas');
    eventBus = diagram.get('eventBus');
    elementRegistry = diagram.get('elementRegistry');
    modeling = diagram.get('modeling');

    eventBus.on('shape.added', (event) => {
      elementCount.value = elementRegistry.getAll().length;
    });

    eventBus.on('shape.remove', (event) => {
      elementCount.value = elementRegistry.getAll().length;
    });

    eventBus.on('canvas.viewbox.changed', (event) => {
      viewbox.value = event.viewbox;
      zoom.value = event.viewbox.scale;
    });

    canvas.zoom('fit-viewport');
    updateViewbox();

  } catch (error) {
    console.error('Failed to initialize diagram:', error);
  }
};

const updateViewbox = () => {
  if (canvas) {
    const vb = canvas.viewbox();
    viewbox.value = vb;
    zoom.value = vb.scale;
  }
};

const handleResize = () => {
  if (diagram) {
    canvas.zoom('fit-viewport');
  }
};

const handleKeyDown = (event) => {
  if (event.code === 'Delete' || event.code === 'Backspace') {
    deleteSelected();
  }
  if (event.code === 'Space' && !event.repeat) {
    event.preventDefault();
    setTool('hand');
  }
};

const setTool = (tool) => {
  currentTool.value = tool;
  
  if (!diagram) return;

  switch (tool) {
    case 'select':
      diagram.get('handTool').deactivate();
      break;
    case 'hand':
      diagram.get('handTool').activate();
      break;
  }
};

const addShape = (type) => {
  if (!modeling || !canvas) return;

  const viewbox = canvas.viewbox();
  const centerX = viewbox.x + viewbox.width / 2;
  const centerY = viewbox.y + viewbox.height / 2;

  let shape;
  const id = `shape_${Date.now()}`;

  switch (type) {
    case 'rectangle':
      shape = {
        id: id,
        type: 'shape',
        x: centerX - 50,
        y: centerY - 35,
        width: 100,
        height: 70,
        businessObject: {
          name: '矩形'
        }
      };
      break;
    case 'circle':
      shape = {
        id: id,
        type: 'shape',
        x: centerX - 40,
        y: centerY - 40,
        width: 80,
        height: 80,
        businessObject: {
          name: '圆形'
        }
      };
      break;
    case 'diamond':
      shape = {
        id: id,
        type: 'shape',
        x: centerX - 50,
        y: centerY - 35,
        width: 100,
        height: 70,
        businessObject: {
          name: '菱形'
        }
      };
      break;
    case 'text':
      shape = {
        id: id,
        type: 'shape',
        x: centerX - 60,
        y: centerY - 20,
        width: 120,
        height: 40,
        businessObject: {
          name: '文本'
        }
      };
      break;
  }

  if (shape) {
    modeling.createShape(shape, null, {
      fill: fillColor.value,
      stroke: strokeColor.value
    });
  }
};

const handleDragStart = (event, image) => {
  draggedImage.value = image;
  event.dataTransfer.effectAllowed = 'copy';
};

const handleDrop = (event) => {
  event.preventDefault();
  
  if (!modeling || !canvas || !draggedImage.value) return;

  const rect = canvasContainer.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const viewbox = canvas.viewbox();
  const sceneX = (x - viewbox.x) / viewbox.scale;
  const sceneY = (y - viewbox.y) / viewbox.scale;

  const img = new Image();
  img.crossOrigin = 'anonymous';
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

    const shape = {
      id: `image_${Date.now()}`,
      type: 'shape',
      x: sceneX - width / 2,
      y: sceneY - height / 2,
      width: width,
      height: height,
      businessObject: {
        name: draggedImage.value.name,
        imageUrl: draggedImage.value.src
      }
    };

    modeling.createShape(shape, null, {
      fill: '#ffffff',
      stroke: strokeColor.value
    });

    draggedImage.value = null;
  };
  img.src = draggedImage.value.src;
};

const deleteSelected = () => {
  if (!modeling || !elementRegistry) return;

  const selectedElements = elementRegistry.filter(element => element.selected);
  selectedElements.forEach(element => {
    modeling.removeShape(element);
  });
};

const clearCanvas = () => {
  if (!modeling || !elementRegistry) return;

  const allElements = elementRegistry.getAll();
  allElements.forEach(element => {
    if (element.type !== 'root') {
      modeling.removeShape(element);
    }
  });
};

const zoomIn = () => {
  if (!canvas) return;
  canvas.zoom(canvas.zoom() * 1.2);
};

const zoomOut = () => {
  if (!canvas) return;
  canvas.zoom(canvas.zoom() / 1.2);
};

const resetView = () => {
  if (!canvas) return;
  canvas.zoom('fit-viewport');
};

const exportSVG = () => {
  if (!canvas) return;

  const svg = canvas.getSvg();
  const svgData = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([svgData], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.download = `diagram-export-${Date.now()}.svg`;
  link.href = url;
  link.click();
  
  URL.revokeObjectURL(url);
};
</script>

<style lang="scss" scoped>
.diagram-container {
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

  .shape-buttons {
    display: flex;
    gap: 6px;

    button {
      background-color: #4CAF50;

      &:hover {
        background-color: #45a049;
      }
    }
  }

  .color-controls {
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

      &:nth-child(3) {
        background-color: #9C27B0;

        &:hover {
          background-color: #7B1FA2;
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

  .diagram-container-inner {
    width: 100%;
    height: 100%;
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

:deep(.djs-palette) {
  top: 20px;
  left: 20px;
}

:deep(.djs-shape) {
  cursor: move;
}

:deep(.djs-element.selected) {
  outline: 2px solid #2196F3;
  outline-offset: 2px;
}

:deep(.djs-element.hover) {
  outline: 1px dashed #2196F3;
  outline-offset: 1px;
}
</style>
