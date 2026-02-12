<template>
  <div class="toolbar">
    <button @click="addText">添加文本</button>
    <button @click="addImage">添加图片</button>
    <button @click="toggleDraw">
      {{ drawing ? '退出画线' : '画线' }}
    </button>
    <button @click="undo">上一步</button>
    <button @click="redo">下一步</button>
  </div>

  <canvas ref="canvasEl"></canvas>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import * as fabric from 'fabric'


const canvasEl = ref(null)
let canvas = null

let history = []
let future = []
let drawing = ref(false)

/* ---------- 历史管理 ---------- */

function saveHistory() {
  history.push(JSON.stringify(canvas.toJSON()))
  future = []
}

function undo() {
  if (!history.length) return
  future.push(JSON.stringify(canvas.toJSON()))
  canvas.loadFromJSON(history.pop(), () => {
    canvas.renderAll()
  })
}

function redo() {
  if (!future.length) return
  history.push(JSON.stringify(canvas.toJSON()))
  canvas.loadFromJSON(future.pop(), () => {
    canvas.renderAll()
  })
}

/* ---------- 初始化 ---------- */

onMounted(() => {
  canvas = new fabric.Canvas(canvasEl.value, {
    width: window.innerWidth,
    height: window.innerHeight - 60,
    backgroundColor: '#fff',
    selection: true,
  })

  // 任意对象修改都存历史
  canvas.on('object:modified', saveHistory)
  canvas.on('object:added', saveHistory)
})

/* ---------- 添加文本 ---------- */

function addText() {
  const text = new fabric.Textbox('双击编辑文本', {
    left: 100,
    top: 100,
    fontSize: 20,
    fill: '#333',
    editable: true,
  })
  canvas.add(text)
  canvas.setActiveObject(text)
}

/* ---------- 添加图片 ---------- */

function addImage() {
  fabric.Image.fromURL(
    'https://konvajs.org/assets/lion.png',
    img => {
      img.set({
        left: 150,
        top: 150,
        scaleX: 0.5,
        scaleY: 0.5,
      })
      canvas.add(img)
    },
    { crossOrigin: 'anonymous' }
  )
}

/* ---------- 画线（自由绘制） ---------- */

function toggleDraw() {
  drawing.value = !drawing.value

  if (drawing.value) {
    canvas.isDrawingMode = true
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas)
    canvas.freeDrawingBrush.color = '#000'
    canvas.freeDrawingBrush.width = 2
  } else {
    canvas.isDrawingMode = false
  }
}

</script>

<style scoped>
.toolbar {
  height: 50px;
  padding: 8px;
  background: #f5f5f5;
  display: flex;
  gap: 8px;
}
button {
  cursor: pointer;
}
canvas {
  display: block;
}
</style>
