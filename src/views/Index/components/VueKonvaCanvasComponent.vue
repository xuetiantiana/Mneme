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
        <v-stage
          ref="stageRef"
          :config="stageConfig"
          @mousedown="handleStageMouseDown"
          @mousemove="handleStageMouseMove"
          @mouseup="handleStageMouseUp"
          @wheel="handleStageWheel"
        >
          <v-layer ref="layerRef">
            <v-group :config="stageConfig">
              <v-rect
                v-for="(element, index) in canvasElements"
                :key="element.id"
                :config="getRectConfig(element)"
                @mousedown="handleElementMouseDown($event, element)"
                @dragend="handleElementDragEnd($event, element)"
                @transformend="handleElementTransformEnd($event, element)"
                draggable="true"
              />
              <v-circle
                v-for="(element, index) in canvasElements.filter(e => e.type === 'circle')"
                :key="element.id"
                :config="getCircleConfig(element)"
                @mousedown="handleElementMouseDown($event, element)"
                @dragend="handleElementDragEnd($event, element)"
                @transformend="handleElementTransformEnd($event, element)"
                draggable="true"
              />
              <v-line
                v-for="(element, index) in canvasElements.filter(e => e.type === 'line')"
                :key="element.id"
                :config="getLineConfig(element)"
                @mousedown="handleElementMouseDown($event, element)"
                @dragend="handleElementDragEnd($event, element)"
                draggable="true"
              />
              <v-text
                v-for="(element, index) in canvasElements.filter(e => e.type === 'text')"
                :key="element.id"
                :config="getTextConfig(element)"
                @mousedown="handleElementMouseDown($event, element)"
                @dragend="handleElementDragEnd($event, element)"
                draggable="true"
              />
              <v-image
                v-for="(element, index) in canvasElements.filter(e => e.type === 'image')"
                :key="element.id"
                :config="getImageConfig(element)"
                @mousedown="handleElementMouseDown($event, element)"
                @dragend="handleElementDragEnd($event, element)"
                draggable="true"
              />
              <v-group
                v-for="(element, index) in canvasElements.filter(e => e.type === 'card')"
                :key="element.id"
                :config="getCardConfig(element)"
                @mousedown="handleElementMouseDown($event, element)"
                @dragend="handleElementDragEnd($event, element)"
                draggable="true"
              >
                <v-rect :config="getCardBackgroundConfig(element)" />
                <v-text
                  v-for="(child, childIndex) in element.children.filter(c => c.type === 'text')"
                  :key="child.id"
                  :config="getCardTextConfig(element, child)"
                />
                <v-image
                  v-for="(child, childIndex) in element.children.filter(c => c.type === 'image')"
                  :key="child.id"
                  :config="getCardImageConfig(element, child)"
                />
              </v-group>
            </v-group>
          </v-layer>
        </v-stage>

        <input
          v-if="editingText"
          ref="textInputRef"
          class="text-input-overlay"
          :style="{
            left: editingText.x * appState.scale + appState.scrollX + 'px',
            top: editingText.y * appState.scale + appState.scrollY - (24 * appState.scale) + 'px',
            width: editingText.width + 'px',
            height: 'auto',
            fontSize: (16 * appState.scale) + 'px',
            color: editingText.element.strokeColor
          }"
          v-model="editingText.element.text"
          @blur="finishEditingText"
          @keydown="handleTextInputKeydown"
          @mousedown.stop
          @click.stop
        />
      </div>

      <div class="header-section">
        <div class="title">无限画布编辑器 (Vue-Konva)</div>
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
      <div class="status-bar">
        <span>元素数量: {{ canvasElements.length }}</span>
        <span>坐标: ({{ Math.round(appState.scrollX) }}, {{ Math.round(appState.scrollY) }})</span>
        <span>缩放: {{ Math.round(appState.scale * 100) }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive, watch, computed } from "vue";
import image1 from "@/assets/images/1691549357221680.png";
import image2 from "@/assets/images/OIP-C.png";
import image3 from "@/assets/images/OIP-C2.png";

const emit = defineEmits(["showPopup"]);

const stageRef = ref(null);
const layerRef = ref(null);
const canvasContainer = ref(null);

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
  height: 0
});

const canvasElements = ref([]);
const selectedElements = ref([]);

watch(
  canvasElements,
  (newValue, oldValue) => {
    console.log('canvasElements变化:', newValue);
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

const memoryAddPosition = { x: 0, y: 0 };

const stageConfig = computed(() => ({
  width: appState.width,
  height: appState.height,
  scaleX: appState.scale,
  scaleY: appState.scale,
  x: appState.scrollX,
  y: appState.scrollY,
  draggable: currentTool.value === "pan"
}));

const dawnTopicTopic = () => {
  const centerX = (appState.width / 2 - appState.scrollX) / appState.scale;
  const centerY = (appState.height / 2 - appState.scrollY) / appState.scale;

  const text = "我和我的猫的故事";
  const fontSize = 18;
  const fontWeight = "bold";
  let textWidth = 200;

  textWidth = Math.max(33, textWidth);

  const textHeight = calculateTextHeight(text, textWidth, fontSize, fontWeight);

  const textElement = {
    id: Date.now(),
    type: "text",
    x: centerX - 100,
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
};

const addCardElement = (text, imageSrc, x, y, width = 400) => {
  const img = new Image();
  img.onload = () => {
    const padding = 20;
    const fontSize = 14;
    const lineHeight = fontSize * 1.2;
    let textWidth = width - padding * 2;

    textWidth = Math.max(33, textWidth);

    const textHeight = calculateTextHeight(text, textWidth, fontSize, "normal");

    const imgWidth = width * 0.9;
    const aspectRatio = img.width / img.height;
    const imgHeight = imgWidth / aspectRatio;

    const cardHeight = padding * 3 + textHeight + imgHeight;

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
  };
  img.onerror = () => {
    console.error("图片加载失败:", imageSrc);
  };
  img.src = imageSrc;
};

const dwanMemoryC1 = (data) => {
  console.log(data);
  addCardElement(
    data.description || "",
    data.img,
    memoryAddPosition.x,
    memoryAddPosition.y
  );
};

const initCanvas = async () => {
  if (canvasContainer.value) {
    appState.width = canvasContainer.value.clientWidth;
    appState.height = canvasContainer.value.clientHeight;
    appState.scrollX = appState.width / 2;
    appState.scrollY = appState.height / 2;
  }
  dawnTopicTopic();
};

const handleResize = () => {
  if (canvasContainer.value) {
    appState.width = canvasContainer.value.clientWidth;
    appState.height = canvasContainer.value.clientHeight;
  }
};

const handleKeyDown = (event) => {
  if (event.key === "Delete" || event.key === "Backspace") {
    if (editingText.value) return;
    deleteSelected();
  }
};

const handleKeyUp = (event) => {
  if (event.key === "Alt") {
    updateCursor();
  }
};

const updateCursor = () => {
  if (canvasContainer.value) {
    const cursors = {
      select: "default",
      pan: "grab",
      rectangle: "crosshair",
      circle: "crosshair",
      line: "crosshair",
      text: "text"
    };
    canvasContainer.value.style.cursor = cursors[currentTool.value] || "default";
  }
};

const calculateTextHeight = (text, width, fontSize = 16, fontWeight = "normal") => {
  if (!text) return fontSize * 1.2;

  const div = document.createElement("div");
  div.style.position = "absolute";
  div.style.visibility = "hidden";
  div.style.whiteSpace = "normal";
  div.style.wordWrap = "break-word";
  div.style.width = `${width}px`;
  div.style.fontSize = `${fontSize}px`;
  div.style.fontFamily = "Arial";
  div.style.fontWeight = fontWeight;
  div.style.lineHeight = "1.2";
  div.style.padding = "0";
  div.style.margin = "0";
  div.textContent = text;

  document.body.appendChild(div);

  const height = div.offsetHeight;

  document.body.removeChild(div);

  return height;
};

const setTool = (tool) => {
  currentTool.value = tool;
  selectedElements.value = [];
  updateCursor();
};

const handleMouseDown = (event) => {
  if (currentTool.value === "pan" || event.button === 1 || (event.button === 0 && event.altKey)) {
    isPanning.value = true;
    if (canvasContainer.value) {
      canvasContainer.value.style.cursor = "grabbing";
    }
    dragStart.value = { x: event.clientX, y: event.clientY };
    return;
  }

  if (currentTool.value === "select") {
    const { clientX, clientY } = event;
    const stage = stageRef.value.getStage();
    const pos = stage.getPointerPosition();
    
    if (pos) {
      const clickedElement = findElementAt(pos.x, pos.y);
      if (clickedElement) {
        if (!event.shiftKey) {
          selectedElements.value = [clickedElement];
        } else {
          const index = selectedElements.value.findIndex(el => el.id === clickedElement.id);
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
    }
  } else if (["rectangle", "circle", "line", "text"].includes(currentTool.value)) {
    isDrawing.value = true;
    const stage = stageRef.value.getStage();
    const pos = stage.getPointerPosition();
    
    if (pos) {
      dragStart.value = { x: pos.x, y: pos.y };
      
      let initialWidth = 0;
      let initialHeight = 0;
      
      if (currentTool.value === "text") {
        initialWidth = 200;
        initialHeight = 20;
      }
      
      const newElement = {
        id: Date.now(),
        type: currentTool.value,
        x: pos.x,
        y: pos.y,
        width: initialWidth,
        height: initialHeight,
        strokeColor: strokeColor.value,
        strokeWidth: strokeWidth.value,
        text: currentTool.value === "text" ? "双击编辑文本" : ""
      };
      canvasElements.value.push(newElement);
    }
  }
};

const handleDoubleClick = (event) => {
  event.stopPropagation();
  event.preventDefault();

  isDoubleClick.value = true;

  const { clientX, clientY } = event;
  const stage = stageRef.value.getStage();
  const pos = stage.getPointerPosition();

  if (pos) {
    const clickedElement = findElementAt(pos.x, pos.y);

    if (clickedElement && clickedElement.type === "text") {
      startEditingText(clickedElement);
    }
  }
};

const startEditingText = (element) => {
  editingText.value = {
    element: element,
    x: element.x,
    y: element.y,
    width: Math.max(element.width || 200, 33),
    height: 40
  };

  setTimeout(() => {
    if (textInputRef.value) {
      textInputRef.value.focus();
      textInputRef.value.select();
    }
  }, 50);
};

const finishEditingText = () => {
  if (editingText.value) {
    const text = editingText.value.element.text || "文本";
    editingText.value.element.text = text;

    const element = editingText.value.element;
    const fontSize = element.fontSize || 16;
    const fontWeight = element.fontWeight || "normal";
    const textWidth = element.width || 200;

    const finalTextWidth = Math.max(textWidth, 33);
    element.width = finalTextWidth;

    element.height = calculateTextHeight(text, finalTextWidth, fontSize, fontWeight);

    editingText.value = null;
  }
};

const handleTextInputKeydown = (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    finishEditingText();
  } else if (event.key === "Escape") {
    editingText.value = null;
  }
};

const handleMouseMove = (event) => {
  lastMousePos.value = { x: event.clientX, y: event.clientY };

  if (isPanning.value) {
    const dx = event.clientX - dragStart.value.x;
    const dy = event.clientY - dragStart.value.y;
    appState.scrollX += dx;
    appState.scrollY += dy;
    dragStart.value = { x: event.clientX, y: event.clientY };
    return;
  }

  if (isDrawing.value) {
    const stage = stageRef.value.getStage();
    const pos = stage.getPointerPosition();
    
    if (pos && canvasElements.value.length > 0) {
      const currentElement = canvasElements.value[canvasElements.value.length - 1];
      currentElement.width = pos.x - dragStart.value.x;
      currentElement.height = pos.y - dragStart.value.y;
    }
  }
};

const handleMouseUp = () => {
  if (isPanning.value) {
    isPanning.value = false;
    if (canvasContainer.value) {
      canvasContainer.value.style.cursor = "grab";
    }
  }

  if (isDrawing.value) {
    isDrawing.value = false;
  }

  isDragging.value = false;
};

const handleWheel = (event) => {
  event.preventDefault();

  const delta = event.deltaY > 0 ? 0.9 : 1.1;
  const newScale = Math.max(0.1, Math.min(10, appState.scale * delta));

  const { clientX, clientY } = event;
  const rect = canvasContainer.value.getBoundingClientRect();
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
  const stage = stageRef.value.getStage();
  if (!stage) return null;

  const shapes = stage.find("Shape");
  for (let i = shapes.length - 1; i >= 0; i--) {
    const shape = shapes[i];
    const element = canvasElements.value.find(el => el.id === shape.id());
    if (element && shape.getAbsolutePosition()) {
      const pos = shape.getAbsolutePosition();
      const width = element.width || shape.width();
      const height = element.height || shape.height();
      
      if (x >= pos.x && x <= pos.x + width && y >= pos.y && y <= pos.y + height) {
        return element;
      }
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
  const stage = stageRef.value.getStage();
  const pos = stage.getPointerPosition();

  if (draggedImage.value && pos) {
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
        x: pos.x - width / 2,
        y: pos.y - height / 2,
        width: width,
        height: height,
        src: draggedImage.value.src,
        image: img,
        strokeColor: strokeColor.value,
        strokeWidth: strokeWidth.value
      };

      canvasElements.value.push(newElement);
    };
    img.src = draggedImage.value.src;
  }
  draggedImage.value = null;
};

const deleteSelected = () => {
  if (selectedElements.value.length > 0) {
    const ids = selectedElements.value.map(el => el.id);
    canvasElements.value = canvasElements.value.filter(el => !ids.includes(el.id));
    selectedElements.value = [];
  }
};

const clearCanvas = () => {
  canvasElements.value = [];
  selectedElements.value = [];
};

const exportCanvas = () => {
  const stage = stageRef.value.getStage();
  if (stage) {
    const dataURL = stage.toDataURL({ pixelRatio: 2 });
    const link = document.createElement("a");
    link.download = "canvas-export.png";
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

const getRectConfig = (element) => ({
  x: element.x,
  y: element.y,
  width: Math.abs(element.width),
  height: Math.abs(element.height),
  stroke: element.strokeColor,
  strokeWidth: element.strokeWidth,
  fill: element.backgroundColor || "transparent",
  listening: true
});

const getCircleConfig = (element) => {
  const radius = Math.sqrt(element.width * element.width + element.height * element.height) / 2;
  return {
    x: element.x + element.width / 2,
    y: element.y + element.height / 2,
    radius: radius,
    stroke: element.strokeColor,
    strokeWidth: element.strokeWidth,
    fill: element.backgroundColor || "transparent",
    listening: true
  };
};

const getLineConfig = (element) => {
  const points = element.points || [{ x: 0, y: 0 }, { x: element.width, y: element.height }];
  return {
    points: points.map(p => [p.x + element.x, p.y + element.y]).flat(),
    stroke: element.strokeColor,
    strokeWidth: element.strokeWidth,
    lineCap: "round",
    lineJoin: "round",
    listening: true
  };
};

const getTextConfig = (element) => ({
  x: element.x,
  y: element.y,
  text: element.text || "文本",
  fontSize: element.fontSize || 16,
  fontFamily: "Arial",
  fontStyle: element.fontWeight === "bold" ? "bold" : "normal",
  fill: element.strokeColor || "#000000",
  width: element.width || 200,
  height: element.height || 20,
  align: "left",
  verticalAlign: "top",
  padding: 0,
  listening: true
});

const getImageConfig = (element) => ({
  x: element.x,
  y: element.y,
  image: element.image,
  width: element.width,
  height: element.height,
  listening: true
});

const getCardConfig = (element) => ({
  x: element.x,
  y: element.y,
  listening: true
});

const getCardBackgroundConfig = (element) => ({
  width: element.width,
  height: element.height,
  fill: element.backgroundColor || "#ffffff",
  cornerRadius: element.borderRadius || 8,
  shadowColor: element.shadowColor || "rgba(0, 0, 0, 0.1)",
  shadowBlur: 10,
  shadowOffset: { x: 0, y: 2 },
  listening: false
});

const getCardTextConfig = (card, textElement) => ({
  x: textElement.x,
  y: textElement.y,
  text: textElement.text || "文本",
  fontSize: textElement.fontSize || 14,
  fontFamily: "Arial",
  fontStyle: textElement.fontWeight === "bold" ? "bold" : "normal",
  fill: textElement.strokeColor || "#333333",
  width: textElement.width || 200,
  height: textElement.height || 20,
  align: "left",
  verticalAlign: "top",
  padding: 0,
  listening: false
});

const getCardImageConfig = (card, imageElement) => ({
  x: imageElement.x,
  y: imageElement.y,
  image: imageElement.image,
  width: imageElement.width,
  height: imageElement.height,
  listening: false
});

const handleStageMouseDown = (e) => {
  if (e.target === e.target.getStage()) {
    selectedElements.value = [];
  }
};

const handleStageMouseMove = (e) => {
};

const handleStageMouseUp = (e) => {
};

const handleStageWheel = (e) => {
  e.evt.preventDefault();
};

const handleElementMouseDown = (e, element) => {
  e.cancelBubble = true;
  if (currentTool.value === "select") {
    if (!e.shiftKey) {
      selectedElements.value = [element];
    } else {
      const index = selectedElements.value.findIndex(el => el.id === element.id);
      if (index === -1) {
        selectedElements.value.push(element);
      } else {
        selectedElements.value.splice(index, 1);
      }
    }
  }
};

const handleElementDragEnd = (e, element) => {
  const pos = e.target.position();
  element.x = pos.x;
  element.y = pos.y;
};

const handleElementTransformEnd = (e, element) => {
  const attrs = e.target.attrs;
  element.x = attrs.x;
  element.y = attrs.y;
  element.width = attrs.width;
  element.height = attrs.height;
};

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
});
</script>

<style scoped>
.canvas-container {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-color: #f5f5f5;
  font-family: Arial, sans-serif;
}

.left-panel {
  width: 200px;
  background-color: #ffffff;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.panel-title {
  padding: 15px;
  font-weight: bold;
  border-bottom: 1px solid #e0e0e0;
  background-color: #f9f9f9;
}

.image-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.image-item {
  margin-bottom: 15px;
  cursor: move;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  transition: all 0.2s;
}

.image-item:hover {
  border-color: #2196F3;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.image-item img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 4px;
}

.image-name {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
  text-align: center;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

.canvas-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
  background-color: #ffffff;
  cursor: default;
}

.canvas-wrapper :deep(.konvajs-content) {
  background-color: #ffffff;
}

.text-input-overlay {
  position: absolute;
  z-index: 1000;
  border: 2px solid #2196F3;
  border-radius: 4px;
  padding: 5px;
  outline: none;
  background-color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.header-section {
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  padding: 10px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.toolbar button {
  padding: 8px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #ffffff;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.toolbar button:hover {
  background-color: #f5f5f5;
  border-color: #2196F3;
}

.toolbar button.active {
  background-color: #2196F3;
  color: #ffffff;
  border-color: #2196F3;
}

.brush-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 15px;
  border-left: 1px solid #e0e0e0;
  border-right: 1px solid #e0e0e0;
}

.brush-controls label {
  font-size: 14px;
  color: #666;
}

.brush-controls input[type="color"] {
  width: 40px;
  height: 30px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
}

.brush-controls input[type="range"] {
  width: 80px;
  cursor: pointer;
}

.navigation-controls {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 0 15px;
  border-left: 1px solid #e0e0e0;
  border-right: 1px solid #e0e0e0;
}

.navigation-controls button {
  width: 30px;
  height: 30px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.navigation-controls button:hover {
  background-color: #f5f5f5;
  border-color: #2196F3;
}

.zoom-level {
  font-size: 14px;
  color: #666;
  min-width: 50px;
  text-align: center;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.action-buttons button {
  padding: 8px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #ffffff;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.action-buttons button:hover {
  background-color: #f5f5f5;
  border-color: #2196F3;
}

.status-bar {
  background-color: #f9f9f9;
  border-top: 1px solid #e0e0e0;
  padding: 8px 20px;
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: #666;
}

.status-bar span {
  white-space: nowrap;
}
</style>