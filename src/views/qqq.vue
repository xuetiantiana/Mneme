<template>
  <div class="container">
    <div class="left-panel">
      <h3>图片列表</h3>
      <div 
        v-for="(image, index) in imageList" 
        :key="index"
        class="image-item"
        draggable="true"
        @dragstart="onDragStart($event, image)"
      >
        <img :src="image.src" :alt="image.name" />
        <span>{{ image.name }}</span>
      </div>
    </div>
    
    <div class="right-panel">
      <div class="toolbar">
        <button @click="addText">添加文本</button>
        <button @click="addImage">添加图片</button>
        <button @click="mode = 'line'">画线</button>
        <button @click="undo">上一步</button>
        <button @click="redo">下一步</button>
        <div class="zoom-controls">
          <button @click="zoomIn">放大</button>
          <button @click="zoomOut">缩小</button>
          <span>{{ Math.round(scale.value * 100) }}%</span>
        </div>
      </div>

      <v-stage
        ref="stageRef"
        :config="stageConfig"
        @mousedown="onStageMouseDown"
        @mousemove="onStageMouseMove"
        @mouseup="onStageMouseUp"
        @mouseleave="onStageMouseUp"
        @wheel="onWheel"
        @dragover.prevent
        @drop="onDrop"
        @mounted="onStageMounted"
      >
        <v-layer>
          <component
            v-for="node in nodes"
            :key="node.id"
            :is="getComp(node.type)"
            :config="node.attrs"
            @dragend="saveHistory"
            @dblclick="node.type === 'text' && editText(node)"
          />
        </v-layer>
      </v-stage>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const stageConfig = {
  width: window.innerWidth - 300,
  height: window.innerHeight - 60,
  draggable: false,
  scale: { x: 1, y: 1 },
  position: { x: 0, y: 0 },
}

let stageInstance = null

const stageRef = ref(null)
const nodes = ref([])
const history = ref([])
const future = ref([])
const mode = ref('select')
const draggedImage = ref(null)
const stagePos = ref({ x: 0, y: 0 })
const isDraggingStage = ref(false)
const lastPos = ref({ x: 0, y: 0 })
const scale = ref(1)
const minScale = 0.1
const maxScale = 5

let drawingLine = null

const imageList = ref([
  { src: new URL('@/assets/images/1.jpg', import.meta.url).href, name: '示例图片1' },
  { src: new URL('@/assets/images/2.png', import.meta.url).href, name: '示例图片2' },
  { src: new URL('@/assets/images/3.png', import.meta.url).href, name: '示例图片3' },
  { src: new URL('@/assets/images/OIP-C.png', import.meta.url).href, name: '示例图片4' },
  { src: new URL('@/assets/images/OIP-C2.png', import.meta.url).href, name: '示例图片5' },
])

/* ---------- 工具 ---------- */

function saveHistory() {
  history.value.push(JSON.stringify(nodes.value))
  future.value = []
}

function undo() {
  if (!history.value.length) return
  future.value.push(JSON.stringify(nodes.value))
  nodes.value = JSON.parse(history.value.pop())
}

function redo() {
  if (!future.value.length) return
  history.value.push(JSON.stringify(nodes.value))
  nodes.value = JSON.parse(future.value.pop())
}

function getComp(type) {
  return {
    image: 'v-image',
    text: 'v-text',
    line: 'v-line',
  }[type]
}

/* ---------- 添加元素 ---------- */

function addText() {
  saveHistory()
  nodes.value.push({
    id: uuid(),
    type: 'text',
    attrs: {
      x: 100,
      y: 100,
      text: '双击编辑文本',
      fontSize: 20,
      draggable: true,
      fill: '#333',
    },
  })
}

function addImage() {
  const img = new Image()
  img.src = 'https://konvajs.org/assets/lion.png'
  img.onload = () => {
    saveHistory()
    nodes.value.push({
      id: uuid(),
      type: 'image',
      attrs: {
        x: 150,
        y: 150,
        image: img,
        width: 200,
        height: 150,
        draggable: true,
      },
    })
  }
}

/* ---------- 文本编辑 ---------- */

function editText(node) {
  const value = prompt('编辑文本', node.attrs.text)
  if (value !== null) {
    saveHistory()
    node.attrs.text = value
  }
}

/* ---------- 画布拖拽 ---------- */

function onStageMouseDown(e) {
  // 检查是否是空白区域点击（用于拖拽画布）
  if (e.target === e.target.getStage() && mode.value === 'select') {
    isDraggingStage.value = true
    const pos = e.target.getStage().getPointerPosition()
    lastPos.value = pos
  } 
  // 画线模式
  else if (mode.value === 'line') {
    saveHistory()
    const pos = e.target.getStage().getPointerPosition()
    drawingLine = {
      id: uuid(),
      type: 'line',
      attrs: {
        points: [(pos.x - stagePos.value.x) / scale.value, (pos.y - stagePos.value.y) / scale.value],
        stroke: '#000',
        strokeWidth: 2,
      },
    }
    nodes.value.push(drawingLine)
  }
}

function onStageMouseMove(e) {
  // 拖拽画布
  if (isDraggingStage.value) {
    const pos = e.target.getStage().getPointerPosition()
    const dx = pos.x - lastPos.value.x
    const dy = pos.y - lastPos.value.y
    
    stagePos.value.x += dx
    stagePos.value.y += dy
    
    // 更新所有元素的位置
    nodes.value.forEach(node => {
      if (node.attrs.x !== undefined) node.attrs.x += dx / scale.value
      if (node.attrs.y !== undefined) node.attrs.y += dy / scale.value
      if (node.attrs.points) {
        for (let i = 0; i < node.attrs.points.length; i += 2) {
          node.attrs.points[i] += dx / scale.value
          node.attrs.points[i + 1] += dy / scale.value
        }
      }
    })
    
    lastPos.value = pos
  }
  // 画线
  else if (drawingLine) {
    const pos = e.target.getStage().getPointerPosition()
    drawingLine.attrs.points.push((pos.x - stagePos.value.x) / scale.value, (pos.y - stagePos.value.y) / scale.value)
    // 重绘画布，确保线条实时更新
    if (stageInstance) {
      stageInstance.draw()
    }
  }
}

function onStageMouseUp() {
  isDraggingStage.value = false
  drawingLine = null
}


function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/* ---------- 拖拽功能 ---------- */

function onDragStart(event, image) {
  draggedImage.value = image
}

function onDrop(event) {
  if (!draggedImage.value) return
  
  // 获取鼠标在canvas中的位置
  const stage = event.target.getStage()
  const pos = stage.getPointerPosition()
  
  // 创建新图片元素
  const img = new Image()
  img.src = draggedImage.value.src
  img.onload = () => {
    saveHistory()
    nodes.value.push({
      id: uuid(),
      type: 'image',
      attrs: {
        x: (pos.x - stagePos.value.x) / scale.value,
        y: (pos.y - stagePos.value.y) / scale.value,
        image: img,
        width: 200,
        height: 150,
        draggable: true,
      },
    })
  }
  
  draggedImage.value = null
}

/* ---------- 缩放功能 ---------- */

function zoomIn() {
  if (scale.value < maxScale) {
    scale.value *= 1.2
    updateStageScale()
  }
}

function zoomOut() {
  if (scale.value > minScale) {
    scale.value /= 1.2
    updateStageScale()
  }
}

function onStageMounted() {
  stageInstance = stageRef.value.getStage()
}

function updateStageScale() {
  if (stageInstance) {
    stageInstance.scale({ x: scale.value, y: scale.value })
    stageInstance.draw()
  }
  stageConfig.scale = { x: scale.value, y: scale.value }
}

function onWheel(e) {
  e.evt.preventDefault()
  
  const stage = e.target.getStage()
  const oldScale = scale.value
  
  // 计算缩放因子
  const mousePointTo = {
    x: stage.getPointerPosition().x / oldScale - stagePos.value.x / oldScale,
    y: stage.getPointerPosition().y / oldScale - stagePos.value.y / oldScale
  }
  
  // 根据滚轮方向缩放
  const delta = e.evt.deltaY > 0 ? 0.9 : 1.1
  const newScale = Math.max(minScale, Math.min(maxScale, oldScale * delta))
  scale.value = newScale
  
  // 更新舞台缩放
  if (stageInstance) {
    stageInstance.scale({ x: newScale, y: newScale })
    stageInstance.draw()
  }
  updateStageScale()
  
  // 调整舞台位置，使鼠标指针保持在同一位置
  const newPos = {
    x: (stage.getPointerPosition().x / newScale) - mousePointTo.x,
    y: (stage.getPointerPosition().y / newScale) - mousePointTo.y
  }
  
  // 更新所有元素位置和大小
  const scaleRatio = newScale / oldScale
  nodes.value.forEach(node => {
    if (node.attrs.x !== undefined) node.attrs.x /= scaleRatio
    if (node.attrs.y !== undefined) node.attrs.y /= scaleRatio
    if (node.attrs.width) node.attrs.width /= scaleRatio
    if (node.attrs.height) node.attrs.height /= scaleRatio
    if (node.attrs.fontSize) node.attrs.fontSize /= scaleRatio
    if (node.attrs.strokeWidth) node.attrs.strokeWidth /= scaleRatio
  })
  
  // 重绘画布
  if (stageInstance) {
    stageInstance.draw()
  }
}
</script>

<style scoped>
.container {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.left-panel {
  width: 300px;
  height: 100%;
  background: #f0f0f0;
  border-right: 1px solid #ddd;
  padding: 20px;
  overflow-y: auto;
}

.left-panel h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 18px;
  color: #333;
}

.image-item {
  width: 100%;
  margin-bottom: 15px;
  cursor: move;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.image-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.image-item img {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.image-item span {
  display: block;
  padding: 10px;
  background: #fff;
  font-size: 14px;
  color: #666;
  text-align: center;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.toolbar {
  height: 60px;
  padding: 0 20px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #ddd;
}

.zoom-controls {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.zoom-controls span {
  min-width: 60px;
  text-align: center;
  font-size: 14px;
  color: #666;
}

button {
  cursor: pointer;
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  font-size: 14px;
  transition: all 0.3s ease;
}

button:hover {
  background: #f0f0f0;
  border-color: #ccc;
}

v-stage {
  flex: 1;
  background: #fafafa;
}
</style>
