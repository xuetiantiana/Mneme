<template>
    <div class="drawing-board">
        <div class="toolbar" >
            <div class="tool-group">
                <button :class="['tool-btn', { active: currentTool === 'select' }]" @click="setTool('select')" title="编辑画布">
                    编辑画布
                </button>
                <button :class="['tool-btn', { active: currentTool === 'pan' }]" @click="setTool('pan')" title="移动整个视图">
                    移动视图
                </button>
                <button class="tool-btn" @click="resetView">
                    重置视图
                </button>
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
                <button class="get-selected-btn" @click="getSelectedNodesInfo">
                    获取选中节点
                </button>
                <button class="clear-btn" @click="clearCanvas">清除画布</button>
            </div> -->
        </div>
        <div style="width: 100%;min-height: 200px;height: 100%;">
            <div 
                ref="container" 
                :class="['canvas-container', { panning: currentTool === 'pan' }]" 
                style="width: 100%;height: 100%;"
                @dragover="handleDragOver"
                @drop="handleDrop"
            ></div>
        </div>
    </div>
</template>

<script setup lang="ts">
// 导入 Vue 的响应式 API 和生命周期钩子
import { ref, onMounted, onUnmounted } from 'vue'
// 导入 Konva 库，用于 2D 画布操作
import Konva from 'konva'

const emit = defineEmits(['sendSelectedNodes'])

// DOM 元素引用
const container = ref<HTMLDivElement>() // 画布容器
const imageInput = ref<HTMLInputElement>() // 图片上传输入框

// Konva 核心对象
let stage: Konva.Stage | null = null // 舞台对象，最顶层的容器
let layer: Konva.Layer | null = null // 图层对象，用于放置图形
let transformer: Konva.Transformer | null = null // 变换器，用于选中、缩放、旋转图形
let selectionBox: Konva.Rect | null = null // 选择框，用于框选多个图形

// 状态变量
let selectedNodes: Konva.Node[] = [] // 当前选中的节点列表
let isDrawing = ref(false) // 是否正在绘制
let isSelecting = ref(false) // 是否正在框选
let isPanning = ref(false) // 是否正在平移
let selectionStartPos = { x: 0, y: 0 } // 框选起始位置
let panStartPos = { x: 0, y: 0 } // 平移起始位置
let lastLine: Konva.Line | null = null // 当前正在绘制的线条

// 工具和配置选项
const currentTool = ref<'select' | 'brush' | 'eraser' | 'text' | 'image' | 'pan'>('select') // 当前工具类型
const brushColor = ref('#000000') // 画笔颜色
const lineWidth = ref(5) // 线条粗细
const fontSize = ref(24) // 文字大小
const scale = ref(1) // 当前缩放比例
const minScale = 0.5 // 最小缩放比例
const maxScale = 1.5 // 最大缩放比例

onMounted(() => {
    stage = new Konva.Stage({
        container: container.value!,
        width: container.value!.offsetWidth,
        height: container.value!.offsetHeight,
    })

    layer = new Konva.Layer()
    stage.add(layer)

    transformer = new Konva.Transformer({
        borderStroke: '#1890ff',
        borderStrokeWidth: 2,
        anchorStroke: '#1890ff',
        anchorFill: '#ffffff',
        anchorSize: 10,
        rotateAnchorOffset: 20
    })
    layer.add(transformer)

    selectionBox = new Konva.Rect({
        fill: 'rgba(0, 161,255, 0.2)',
        stroke: '#00a1ff',
        strokeWidth: 1,
        visible: false
    })
    layer.add(selectionBox)

    stage.on('mousedown touchstart', handleMouseDown)
    stage.on('mousemove touchmove', handleMouseMove)
    stage.on('mouseup touchend', handleMouseUp)
    stage.on('mouseleave touchcancel', handleMouseUp)
    stage.on('dblclick', handleDoubleClick)
    stage.on('wheel', handleWheel)

    window.addEventListener('resize', handleResize)
    window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
    if (stage) {
        stage.destroy()
    }
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('keydown', handleKeyDown)
})

const handleResize = () => {
    if (stage && container.value) {
        stage.width(container.value.offsetWidth)
        stage.height(container.value.offsetHeight)
    }
}

const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelectedNodes()
    }
}

// 处理鼠标滚轮事件，实现画布的缩放功能
const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    // 检查是否按下了 Ctrl 键，只有按住 Ctrl 键时才进行缩放操作
    if (!e.evt.ctrlKey) {
        return
    }

    // 阻止默认的滚动行为
    e.evt.preventDefault()

    // 获取当前缩放比例
    const oldScale = scale.value
    // 获取鼠标在舞台上的当前位置
    const pointer = stage!.getPointerPosition()!

    // 计算鼠标相对于舞台原点的位置（考虑当前的缩放和平移）
    const mousePointTo = {
        x: (pointer.x - stage!.x()) / oldScale,
        y: (pointer.y - stage!.y()) / oldScale
    }

    // 设置缩放因子为 1.1（每次缩放 10%）
    const scaleBy = 1.1
    // 根据滚轮方向计算新的缩放比例：向下滚动缩小，向上滚动放大
    let newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy

    // 限制缩放比例在最小值和最大值之间
    newScale = Math.max(minScale, Math.min(maxScale, newScale))

    // 应用新的缩放比例到舞台
    stage!.scale({ x: newScale, y: newScale })

    // 计算新的舞台位置，使缩放以鼠标位置为中心
    const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale
    }

    // 更新舞台位置
    stage!.position(newPos)
    // 更新缩放比例的响应式变量
    scale.value = newScale
}

// 获取鼠标/触摸点在舞台坐标系中的位置
// 将屏幕坐标转换为考虑了缩放和平移后的舞台坐标
const getPointerPos = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    // 从事件目标获取舞台对象
    const stage = e.target.getStage()
    // 如果舞台不存在，返回原点
    if (!stage) return { x: 0, y: 0 }
    // 获取舞台的绝对变换矩阵（包括缩放和平移）
    const transform = stage.getAbsoluteTransform().copy()
    // 对变换矩阵求逆，用于将屏幕坐标转换为舞台坐标
    transform.invert()
    // 获取鼠标在屏幕上的位置
    const pos = stage.getPointerPosition()
    // 如果位置不存在，返回原点
    if (!pos) return { x: 0, y: 0 }
    // 使用逆变换矩阵将屏幕坐标转换为舞台坐标
    return transform.point(pos)
}

// 处理鼠标按下事件
// 根据当前工具类型执行不同的操作：
// - text: 点击添加文字
// - pan: 开始平移画布
// - select: 开始框选或选择图形
// - brush/eraser: 开始绘制线条
const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (currentTool.value === 'text') {
        handleTextClick(e)
        return
    }

    if (currentTool.value === 'pan') {
        isPanning.value = true
        panStartPos = stage!.getPointerPosition()!
        return
    }

    if (currentTool.value === 'select') {
        const clickedOnEmpty = e.target === e.target.getStage()
        if (clickedOnEmpty) {
            // 先移除所有节点的选中样式
            selectedNodes.forEach(n => removeNodeSelectStyle(n))
            
            selectedNodes = []
            transformer!.nodes([])
            
            isSelecting.value = true
            selectionStartPos = getPointerPos(e)
            selectionBox!.visible(true)
            selectionBox!.width(0)
            selectionBox!.height(0)
            selectionBox!.x(selectionStartPos.x)
            selectionBox!.y(selectionStartPos.y)
            selectionBox!.moveToTop()
        }
        return
    }

    isDrawing.value = true
    const pos = getPointerPos(e)

    lastLine = new Konva.Line({
        stroke: currentTool.value === 'eraser' ? '#ffffff' : brushColor.value,
        strokeWidth: currentTool.value === 'eraser' ? lineWidth.value * 2 : lineWidth.value,
        globalCompositeOperation: currentTool.value === 'eraser' ? 'destination-out' : 'source-over',
        lineCap: 'round',
        lineJoin: 'round',
        points: [pos.x, pos.y],
        draggable: true
    })

    lastLine.on('click tap', (evt) => {
        handleNodeClick(evt, lastLine!)
    })

    layer!.add(lastLine)
}

// 处理鼠标移动事件
// 根据当前状态执行不同的操作：
// - 平移：移动画布位置
// - 框选：更新选择框的大小和位置
// - 绘制：向线条添加新的点
const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    // 处理平移操作
    if (isPanning.value) {
        // 获取当前鼠标位置
        const pos = stage!.getPointerPosition()!
        // 计算鼠标移动的偏移量
        const dx = pos.x - panStartPos.x
        const dy = pos.y - panStartPos.y
        
        // 更新舞台位置，实现画布平移
        stage!.x(stage!.x() + dx)
        stage!.y(stage!.y() + dy)
        
        // 更新起始位置为当前位置
        panStartPos = pos
        return
    }

    // 处理框选操作
    if (isSelecting.value) {
        // 获取鼠标在舞台坐标系中的位置
        const pos = getPointerPos(e)
        
        // 计算选择框的左上角坐标（取起始点和当前点的最小值）
        const x = Math.min(selectionStartPos.x, pos.x)
        const y = Math.min(selectionStartPos.y, pos.y)
        // 计算选择框的宽度和高度
        const width = Math.abs(pos.x - selectionStartPos.x)
        const height = Math.abs(pos.y - selectionStartPos.y)
        
        // 更新选择框的位置和尺寸
        selectionBox!.x(x)
        selectionBox!.y(y)
        selectionBox!.width(width)
        selectionBox!.height(height)
        return
    }

    // 如果不在绘制状态或没有当前线条，直接返回
    if (!isDrawing.value || !lastLine) return

    // 处理绘制操作
    // 获取鼠标在舞台坐标系中的位置
    const pos = getPointerPos(e)
    // 将新点添加到线条的点数组中
    const newPoints = lastLine.points().concat([pos.x, pos.y])
    // 更新线条的点
    lastLine.points(newPoints)
}

// 处理鼠标释放事件
// 根据当前状态结束相应的操作：
// - 平移：结束平移状态
// - 框选：完成选择，选中与选择框相交的图形
// - 绘制：结束绘制状态
const handleMouseUp = () => {
    if (isPanning.value) {
        isPanning.value = false
        return
    }

    if (isSelecting.value) {
        isSelecting.value = false
        selectionBox!.visible(false)
        
        const box = selectionBox!.getClientRect()
        const shapes = layer!.getChildren()
        
        // 先移除所有节点的选中样式
        selectedNodes.forEach(n => removeNodeSelectStyle(n))
        
        selectedNodes = []
        shapes.forEach(shape => {
            if (shape === transformer || shape === selectionBox) return
            
            const shapeBox = shape.getClientRect()
            if (haveIntersection(box, shapeBox)) {
                selectedNodes.push(shape)
            }
        })
        
        // 为所有选中的节点添加选中样式
        selectedNodes.forEach(n => addNodeSelectStyle(n))
        
        transformer!.nodes(selectedNodes)
    selectedNodes.forEach(n => n.moveToTop())
    transformer!.moveToTop()
        return
    }

    isDrawing.value = false
    lastLine = null
    
    // 画完线后，自动切换回选择工具
    currentTool.value = 'select'
    // 更新节点的可拖拽状态
    updateDraggableState()
}

// 判断两个矩形是否相交
// 参数 r1, r2: 矩形对象，包含 x, y, width, height 属性
// 返回值: 如果两个矩形相交返回 true，否则返回 false
const haveIntersection = (r1: any, r2: any) => {
    return !(r2.x > r1.x + r1.width || 
             r2.x + r2.width < r1.x || 
             r2.y > r1.y + r1.height || 
             r2.y + r2.height < r1.y)
}

// 处理节点点击事件
// 用于选中图形，支持单选和多选（按住 Shift/Ctrl/Meta 键）
// 参数 e: 事件对象
// 参数 node: 被点击的节点
const handleNodeClick = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>, node: Konva.Node) => {
    // 如果当前是平移模式，不处理节点点击事件
    if (currentTool.value === 'pan') {
        return
    }
    
    // 阻止事件冒泡，避免触发其他点击事件
    e.cancelBubble = true

    // 检查是否按下了修饰键（Shift、Ctrl 或 Meta），用于多选
    const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey

    // 如果没有按下修饰键，执行单选操作
    if (!metaPressed) {
        // 先移除所有节点的选中样式
        selectedNodes.forEach(n => removeNodeSelectStyle(n))
        
        // 如果点击的节点不在已选列表中，则只选中该节点
        if (selectedNodes.indexOf(node) === -1) {
            selectedNodes = [node]
        } else {
            // 如果点击的节点已在已选列表中，保持选中
            selectedNodes = [node]
        }
    } else {
        // 如果按下了修饰键，执行多选/取消选择操作
        const isSelected = selectedNodes.indexOf(node) >= 0
        if (!isSelected) {
            // 如果节点未被选中，则添加到选中列表
            selectedNodes.push(node)
        } else {
            // 如果节点已被选中，则从选中列表中移除
            selectedNodes.splice(selectedNodes.indexOf(node), 1)
        }
    }

    // 为所有选中的节点添加选中样式
    selectedNodes.forEach(n => addNodeSelectStyle(n))

    // 更新变换器的选中节点列表
    transformer!.nodes(selectedNodes)
    // 将所有选中的节点移到图层顶部
    selectedNodes.forEach(n => n.moveToTop())
    // 将变换器移到最顶部，确保选择框可见
    transformer!.moveToTop()
}

// 为节点添加选中样式
const addNodeSelectStyle = (node: Konva.Node) => {
    // 保存节点的原始样式
    if (!node.getAttr('_originalShadowColor')) {
        node.setAttr('_originalShadowColor', node.shadowColor())
        node.setAttr('_originalShadowBlur', node.shadowBlur())
        node.setAttr('_originalShadowOffset', node.shadowOffset())
        node.setAttr('_originalShadowOpacity', node.shadowOpacity())
    }
    
    // 添加选中样式：蓝色阴影
    node.shadowColor('red')
    node.shadowBlur(15)
    node.shadowOffset({ x: 0, y: 0 })
    node.shadowOpacity(0.6)
    
    // 如果是文字，添加边框效果
    if (node instanceof Konva.Text) {
        if (!node.getAttr('_originalStroke')) {
            node.setAttr('_originalStroke', node.stroke())
            node.setAttr('_originalStrokeWidth', node.strokeWidth())
        }
        node.stroke('#1890ff')
        node.strokeWidth(2)
    }
    
    // 如果是线条，改变颜色
    if (node instanceof Konva.Line) {
        if (!node.getAttr('_originalStroke')) {
            node.setAttr('_originalStroke', node.stroke())
            node.setAttr('_originalStrokeWidth', node.strokeWidth())
        }
        node.setAttr('_originalStroke', node.stroke())
        node.stroke('#1890ff')
        node.strokeWidth(node.strokeWidth() + 2)
    }
}

// 移除节点的选中样式
const removeNodeSelectStyle = (node: Konva.Node) => {
    // 恢复节点的原始样式
    node.shadowColor(node.getAttr('_originalShadowColor') || 'black')
    node.shadowBlur(node.getAttr('_originalShadowBlur') || 0)
    node.shadowOffset(node.getAttr('_originalShadowOffset') || { x: 0, y: 0 })
    node.shadowOpacity(node.getAttr('_originalShadowOpacity') || 0)
    
    // 如果是文字，移除边框效果
    if (node instanceof Konva.Text) {
        node.stroke(node.getAttr('_originalStroke') || 'transparent')
        node.strokeWidth(node.getAttr('_originalStrokeWidth') || 0)
    }
    
    // 如果是线条，恢复原始颜色和线宽
    if (node instanceof Konva.Line) {
        node.stroke(node.getAttr('_originalStroke') || '#000000')
        node.strokeWidth(node.getAttr('_originalStrokeWidth') || 5)
    }
}

// 处理文字添加事件
// 在画布上点击位置添加文字
// 参数 e: 事件对象
const handleTextClick = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    // 获取点击位置在舞台坐标系中的坐标
    const pos = getPointerPos(e)
    // 弹出输入框让用户输入文字
    const text = prompt('请输入文字:', '文字')

    // 如果用户输入了有效文字，则创建文字节点
    if (text && text.trim()) {
        const textNode = new Konva.Text({
            x: pos.x,
            y: pos.y,
            text: text,
            fontSize: fontSize.value,
            fontFamily: 'Arial',
            fill: brushColor.value,
            draggable: true
        })

        // 为文字节点添加点击事件，用于选中
        textNode.on('click tap', (evt) => {
            handleNodeClick(evt, textNode)
        })

        // 将文字节点添加到图层
        layer!.add(textNode)
        
        // 添加完文字后，自动切换回选择工具
        currentTool.value = 'select'
        // 更新节点的可拖拽状态
        updateDraggableState()
    }
}

// 处理双击事件
// 用于编辑已存在的文字内容
// 参数 e: 事件对象
const handleDoubleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const target = e.target
    // 检查双击的目标是否是文字节点
    if (target instanceof Konva.Text) {
        // 弹出输入框让用户编辑文字
        const newText = prompt('编辑文字:', target.text())
        // 如果用户输入了有效文字，则更新文字内容
        if (newText !== null && newText.trim()) {
            target.text(newText)
        }
    }
}

// 触发图片上传
// 设置当前工具为图片模式，并触发隐藏的文件输入框
const triggerImageUpload = () => {
    currentTool.value = 'image'
    imageInput.value?.click()
}

// 处理图片上传事件
// 读取用户选择的图片文件，调整大小后添加到画布中心
// 参数 e: 文件输入框的 change 事件对象
const handleImageUpload = (e: Event) => {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
        const imgObj = new Image()
        imgObj.onload = () => {
            const stageWidth = stage!.width()
            const stageHeight = stage!.height()
            
            let width = imgObj.width
            let height = imgObj.height
            
            // 如果图片宽度超过舞台宽度的 80%，按比例缩小
            if (width > stageWidth * 0.8) {
                const ratio = (stageWidth * 0.8) / width
                width = stageWidth * 0.8
                height = height * ratio
            }
            
            // 如果图片高度超过舞台高度的 80%，按比例缩小
            if (height > stageHeight * 0.8) {
                const ratio = (stageHeight * 0.8) / height
                height = stageHeight * 0.8
                width = width * ratio
            }

            // 创建 Konva 图片对象，放置在画布中心
            const konvaImage = new Konva.Image({
                image: imgObj,
                x: (stageWidth - width) / 2,
                y: (stageHeight - height) / 2,
                width: width,
                height: height,
                draggable: true
            })

            // 为图片添加点击事件，用于选中
            konvaImage.on('click tap', (evt) => {
                handleNodeClick(evt, konvaImage)
            })

            // 将图片添加到图层
            layer!.add(konvaImage)
            // 选中刚添加的图片
            selectedNodes = [konvaImage]
            transformer!.nodes(selectedNodes)
            // 将图片和变换器移到最上层
            konvaImage.moveToTop()
            transformer!.moveToTop()
            
            // 清空文件输入框，允许重复上传同一文件
            target.value = ''
            
            // 添加完图片后，自动切换回选择工具
            currentTool.value = 'select'
            // 更新节点的可拖拽状态
            updateDraggableState()
        }
        imgObj.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
}

// 设置当前工具
// 参数 tool: 工具类型，包括选择、画笔、橡皮擦、文字、图片、平移
const setTool = (tool: 'select' | 'brush' | 'eraser' | 'text' | 'image' | 'pan') => {
    currentTool.value = tool
    // 如果切换到非选择工具，清空选中节点并移除选中样式
    if (tool !== 'select' && transformer) {
        selectedNodes.forEach(n => removeNodeSelectStyle(n))
        selectedNodes = []
        transformer.nodes([])
    }
    // 更新所有节点的可拖拽状态
    updateDraggableState()
}

// 更新节点的可拖拽状态
// 只有在选择模式下，节点才可拖拽
const updateDraggableState = () => {
    if (!layer) return
    
    const children = layer.getChildren()
    const isSelectMode = currentTool.value === 'select'
    
    children.forEach(child => {
        child.draggable(isSelectMode)
    })
}

// 删除当前选中的所有节点
// 清空选中列表并重置变换器
const deleteSelectedNodes = () => {
    if (selectedNodes.length === 0) return
    
    selectedNodes.forEach(node => {
        node.destroy()
    })
    
    selectedNodes = []
    transformer!.nodes([])
}

// 重置视图到初始状态
// 将缩放比例设置为 1，位置设置为原点
const resetView = () => {
    stage!.scale({ x: 1, y: 1 })
    stage!.position({ x: 0, y: 0 })
    scale.value = 1
}

// 导出画布内容为图片
// 计算所有图形的边界，调整画布大小以适应内容，然后导出为 PNG 格式
const exportCanvas = () => {
    // 获取图层中的所有子节点
    const children = layer!.getChildren()
    if (children.length === 0) return

    // 过滤掉变换器和选择框，只保留实际的图形节点
    const nodes = children.filter(n => n !== transformer && n !== selectionBox)
    if (nodes.length === 0) return

    // 保存当前的舞台状态（缩放、位置、尺寸）
    const oldScale = stage!.scale()
    const oldPosition = stage!.position()
    const oldWidth = stage!.width()
    const oldHeight = stage!.height()

    // 重置舞台的缩放和位置，以便计算准确的边界
    stage!.scale({ x: 1, y: 1 })
    stage!.position({ x: 0, y: 0 })

    // 计算所有图形的边界矩形
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    nodes.forEach(node => {
        const box = node.getClientRect()
        minX = Math.min(minX, box.x)
        minY = Math.min(minY, box.y)
        maxX = Math.max(maxX, box.x + box.width)
        maxY = Math.max(maxY, box.y + box.height)
    })

    // 添加内边距，使导出的图片周围有留白
    const padding = 20
    const contentWidth = maxX - minX + padding * 2
    const contentHeight = maxY - minY + padding * 2

    // 调整舞台大小以适应内容
    stage!.width(contentWidth)
    stage!.height(contentHeight)

    // 计算偏移量，将图形移动到画布中心
    const offsetX = -minX + padding
    const offsetY = -minY + padding

    // 临时移动所有节点到新位置
    nodes.forEach(node => {
        const oldX = node.x()
        const oldY = node.y()
        node.x(oldX + offsetX)
        node.y(oldY + offsetY)
    })

    // 生成图片数据，使用 2 倍像素比以提高清晰度
    const dataURL = stage!.toDataURL({ pixelRatio: 2 })

    // 恢复所有节点的原始位置
    nodes.forEach(node => {
        const oldX = node.x()
        const oldY = node.y()
        node.x(oldX - offsetX)
        node.y(oldY - offsetY)
    })

    // 恢复舞台的原始状态
    stage!.scale(oldScale)
    stage!.position(oldPosition)
    stage!.width(oldWidth)
    stage!.height(oldHeight)

    // 创建下载链接并触发下载
    const link = document.createElement('a')
    link.download = `canvas_${Date.now()}.png`
    link.href = dataURL
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

// 导出画布中所有元素的详细信息到控制台
const exportElementInfo = () => {
    if (!layer) {
        console.log('图层不存在')
        return
    }

    const children = layer.getChildren()
    if (children.length === 0) {
        console.log('画布中没有元素')
        return
    }

    const nodes = children.filter(n => n !== transformer && n !== selectionBox)
    if (nodes.length === 0) {
        console.log('画布中没有图形元素')
        return
    }

    console.log('=== 画布元素详细信息 ===')
    console.log(`总元素数量: ${nodes.length}`,nodes)
    console.log('')

    nodes.forEach((node, index) => {
        const elementInfo = getNodeInfo(node, index)
        console.log(`元素 ${index + 1}:`, elementInfo)
    })

    console.log('')
    console.log('=== 完整 JSON 数据 ===')
    console.log(stage.toJSON())
}

// 获取节点的详细信息
const getNodeInfo = (node: Konva.Node, index: number) => {
    console.log('node', node)
    const nodeInfo = {
        index: index + 1,
        type: node.className,
        id: node.id() || '未设置',
        position: {
            x: node.x(),
            y: node.y()
        },
        size: {
            width: node.width(),
            height: node.height()
        },
        rotation: node.rotation(),
        scale: {
            x: node.scaleX(),
            y: node.scaleY()
        },
        draggable: node.draggable(),
        visible: node.visible(),
        opacity: node.opacity()
    }

    if (node instanceof Konva.Image) {
        nodeInfo['imageInfo'] = {
            src: (node.image() as HTMLImageElement)?.src || '',
            originalWidth: node.image()?.width || 0,
            originalHeight: node.image()?.height || 0
        }
    } else if (node instanceof Konva.Text) {
        nodeInfo['textInfo'] = {
            content: node.text(),
            fontSize: node.fontSize(),
            fontFamily: node.fontFamily(),
            color: node.fill()
        }
    } else if (node instanceof Konva.Line) {
        nodeInfo['lineInfo'] = {
            pointCount: node.points().length / 2,
            color: node.stroke(),
            strokeWidth: node.strokeWidth(),
            lineCap: node.lineCap(),
            lineJoin: node.lineJoin()
        }
    } else if (node instanceof Konva.Rect) {
        nodeInfo['rectInfo'] = {
            fill: node.fill(),
            stroke: node.stroke(),
            strokeWidth: node.strokeWidth(),
            cornerRadius: node.cornerRadius()
        }
    }

    return nodeInfo
}

// 获取当前选中的节点详细信息
const getSelectedNodesInfo = () => {
    if (selectedNodes.length === 0) {
        console.log('当前没有选中的节点')
        return []
    }

    console.log('=== 当前选中的节点信息 ===')
    console.log(`选中节点数量: ${selectedNodes.length}`)
    console.log('')

    const nodesData = selectedNodes.map((node, index) => {
        const nodeInfo = getNodeInfo(node, index)
        console.log(`选中节点 ${index + 1}:`, nodeInfo)
        return nodeInfo
    })

    return nodesData
}

// 将选中的节点发送给父元素
const sendSelectedNodesToParent = () => {
    if (selectedNodes.length === 0) {
        console.log('当前没有选中的节点')
        return
    }

    const nodesData = selectedNodes.map((node, index) => {
        return getNodeInfo(node, index)
    })

    emit('sendSelectedNodes', nodesData)
    console.log('已将选中的节点发送给父元素:', nodesData)
}

// 清除画布
// 删除图层中的所有节点，包括图形、文字、图片等
const clearCanvas = () => {
    layer!.destroyChildren()
}

// 处理拖拽悬停事件
// 当拖拽元素进入画布区域时触发，设置拖拽效果为复制
const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer!.dropEffect = 'copy'
}

// 处理拖拽放置事件
// 当拖拽的图片被放置到画布上时触发，创建Konva图片对象并添加到画布
const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    
    // 获取拖拽类型，只处理单个图片的拖拽
    const dragType = e.dataTransfer!.getData('dragType')
    if (dragType !== 'single-image') {
        return
    }
    
    // 获取拖拽的图片URL
    const imgSrc = e.dataTransfer!.getData('imageSrc')
    if (!imgSrc) {
        return
    }
    
    // 创建图片对象并设置跨域属性
    const imgObj = new Image()
    imgObj.crossOrigin = 'anonymous'
    imgObj.onload = () => {
        // 获取舞台尺寸
        const stageWidth = stage!.width()
        const stageHeight = stage!.height()
        
        // 获取原始图片尺寸
        let width = imgObj.width
        let height = imgObj.height
        
        // 如果图片宽度超过200px，按比例缩小
        if (width > 200) {
            const ratio = 200 / width
            width = 200
            height = height * ratio
        }
        
        // 如果图片高度超过舞台高度的80%，按比例缩小
        if (height > stageHeight * 0.8) {
            const ratio = (stageHeight * 0.8) / height
            height = stageHeight * 0.8
            width = width * ratio
        }

        // 获取放置位置（考虑画布的缩放和平移）
        const dropPos = getDropPosition(e)
        
        // 创建Konva图片对象，以鼠标位置为中心
        const konvaImage = new Konva.Image({
            image: imgObj,
            x: dropPos.x - width / 2,
            y: dropPos.y - height / 2,
            width: width,
            height: height,
            draggable: true
        })

        // 为图片添加点击事件，用于选中
        konvaImage.on('click tap', (evt) => {
            handleNodeClick(evt, konvaImage)
        })

        // 将图片添加到图层
        layer!.add(konvaImage)
        // 选中刚添加的图片
        selectedNodes = [konvaImage]
        transformer!.nodes(selectedNodes)
        // 将图片和变换器移到最上层
        konvaImage.moveToTop()
        transformer!.moveToTop()
        
        // 添加完图片后，自动切换回选择工具
        currentTool.value = 'select'
        // 更新节点的可拖拽状态
        updateDraggableState()
    }
    
    // 处理图片加载错误
    imgObj.onerror = () => {
        console.error('Failed to load image:', imgSrc)
    }
    
    // 开始加载图片
    imgObj.src = imgSrc
}

// 获取拖拽位置在舞台坐标系中的坐标
// 将屏幕坐标转换为考虑了缩放和平移后的舞台坐标
const getDropPosition = (e: DragEvent) => {
    // 获取画布容器的边界矩形
    const rect = container.value!.getBoundingClientRect()
    // 计算鼠标相对于容器的坐标
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // 获取舞台的绝对变换矩阵（包括缩放和平移）
    const transform = stage!.getAbsoluteTransform().copy()
    // 对变换矩阵求逆，用于将屏幕坐标转换为舞台坐标
    transform.invert()
    
    // 使用逆变换矩阵将屏幕坐标转换为舞台坐标
    return transform.point({ x, y })
}

// 将别的canvas的节点（多个）旋绕到当前的canvas中，垂直水平居中
const renderNodes = (nodesData) => {
    if (!layer) {
        console.log('图层不存在')
        return
    }

    if (!nodesData || nodesData.length === 0) {
        console.log('没有可渲染的节点')
        return
    }

    console.log('=== 开始渲染节点到画布 ===')
    console.log(`节点数量: ${nodesData.length}`)

    // 计算所有节点的边界框
    // 用于确定节点占据的区域，以便后续计算缩放和居中
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    nodesData.forEach((nodeData) => {
        // 计算节点的右下角坐标（考虑缩放）
        const nodeRight = nodeData.position.x + nodeData.size.width * nodeData.scale.x
        const nodeBottom = nodeData.position.y + nodeData.size.height * nodeData.scale.y

        // 更新边界框的最小值和最大值
        minX = Math.min(minX, nodeData.position.x)
        minY = Math.min(minY, nodeData.position.y)
        maxX = Math.max(maxX, nodeRight)
        maxY = Math.max(maxY, nodeBottom)
    })

    // 计算节点内容的总宽度和高度
    const contentWidth = maxX - minX
    const contentHeight = maxY - minY

    // 获取画布的宽度和高度
    const canvasWidth = stage.width()
    const canvasHeight = stage.height()

    console.log('节点边界框:', { minX, minY, maxX, maxY })
    console.log('节点内容尺寸:', { contentWidth, contentHeight })
    console.log('画布尺寸:', { canvasWidth, canvasHeight })

    // 计算缩放比例，确保所有节点都能放入画布中
    // 留出 40px 的边距，避免节点贴边
    const padding = 40
    const scaleX = (canvasWidth - padding * 2) / contentWidth
    const scaleY = (canvasHeight - padding * 2) / contentHeight
    // 取较小的缩放比例，确保宽度和高度都能放入
    let newScale = Math.min(scaleX, scaleY)
    // 限制最大缩放比例为 1，避免节点过大
    newScale = Math.min(newScale, 1)

    console.log('计算出的缩放比例:', newScale)

    // 计算居中偏移量
    // 将节点内容居中显示在画布中央
    // 公式：(画布尺寸 - 缩放后的内容尺寸) / 2 - 缩放后的最小坐标
    const offsetX = (canvasWidth - contentWidth * newScale) / 2 - minX * newScale
    const offsetY = (canvasHeight - contentHeight * newScale) / 2 - minY * newScale

    console.log('=== 垂直居中调试信息 ===')
    console.log('minY:', minY, 'maxY:', maxY)
    console.log('contentHeight:', contentHeight)
    console.log('canvasHeight:', canvasHeight)
    console.log('newScale:', newScale)
    console.log('offsetY 计算公式: (canvasHeight - contentHeight * newScale) / 2 - minY * newScale')
    console.log('offsetY 计算过程:', `(${canvasHeight} - ${contentHeight} * ${newScale}) / 2 - ${minY} * ${newScale}`)
    console.log('offsetY 计算结果:', (canvasHeight - contentHeight * newScale) / 2 - minY * newScale)
    console.log('居中偏移量:', { offsetX, offsetY })
    console.log('验证居中计算:')
    console.log('  水平中心:', (minX + maxX) / 2, '-> 缩放后:', (minX + maxX) / 2 * newScale + offsetX, '画布中心:', canvasWidth / 2)
    console.log('  垂直中心:', (minY + maxY) / 2, '-> 缩放后:', (minY + maxY) / 2 * newScale + offsetY, '画布中心:', canvasHeight / 2)

    // 调整所有节点的坐标和缩放比例
    // 保持节点的原始scale，只调整位置
    const adjustedNodesData = nodesData.map((nodeData) => {
        return {
            ...nodeData,
            position: {
                x: nodeData.position.x * newScale + offsetX,
                y: nodeData.position.y * newScale + offsetY
            },
            scale: {
                x: nodeData.scale.x * newScale,
                y: nodeData.scale.y * newScale
            }
        }
    })

    // 不设置stage的缩放比例
    // 保持stage.scale为1，让每个节点独立缩放
    // stage.scale({ x: 1, y: 1 })
    console.log('节点独立缩放，stage保持scale为1')

    // 渲染调整后的节点
    adjustedNodesData.forEach((nodeData, index) => {
        console.log(`渲染节点 ${index + 1}:`, nodeData)
        console.log(`  原始位置: (${nodeData.position.x}, ${nodeData.position.y})`)
        console.log(`  调整后位置: (${nodeData.position.x}, ${nodeData.position.y})`)
        console.log(`  原始尺寸: ${nodeData.size.width} x ${nodeData.size.height}`)
        console.log(`  节点缩放: ${nodeData.scale.x} x ${nodeData.scale.y}`)
        
        let konvaNode = null

        if (nodeData.type === 'Image') {
            konvaNode = createKonvaImage(nodeData)
        } else if (nodeData.type === 'Text') {
            konvaNode = createKonvaText(nodeData)
        } else if (nodeData.type === 'Line') {
            konvaNode = createKonvaLine(nodeData)
        } else if (nodeData.type === 'Rect') {
            konvaNode = createKonvaRect(nodeData)
        }

        if (konvaNode) {
            konvaNode.on('click tap', (evt) => {
                handleNodeClick(evt, konvaNode)
            })
            layer.add(konvaNode)
            console.log(`节点 ${index + 1} 已添加到画布，实际位置: (${konvaNode.x()}, ${konvaNode.y()})`, konvaNode)
        }
    })

    console.log('=== 所有节点已渲染到画布 ===')
}

const createKonvaImage = (nodeData) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    if (nodeData.imageInfo && nodeData.imageInfo.src) {
        img.src = nodeData.imageInfo.src
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
        opacity: nodeData.opacity
    })
}

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
        opacity: nodeData.opacity
    })
}

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
        lineCap: 'round',
        lineJoin: 'round'
    })
}

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
        opacity: nodeData.opacity
    })
}

defineExpose({
    getSelectedNodesInfo,
    renderNodes
})
</script>

<style scoped>
.drawing-board {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    position: relative;
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
    transform: translateY(-50%);
    left: 0;
    right: 0;
    z-index: 100;
}

.tool-group {
    display: flex;
    gap: 10px;
    align-items: center;
}

.tool-btn {
    font-size: .875em;
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
