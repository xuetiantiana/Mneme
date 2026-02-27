<template >
    <div style="width: 100%;height: 100%;display: flex;flex-direction: column;">
        <div style="padding: 16px;display: flex;gap: 16px;">
            <button class="render-nodes-btn" @click="handleRenderNodes(1)">发送到主题画布</button>
        </div>
        
        <div style="flex: 1;">
            <KonvaComponent ref="konvaRef" />
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import konvaComponent from "@/components/konvaComponent.vue";

const emit = defineEmits(['renderNodesToTopic'])

const memoryItems = ref([])
const konvaRef = ref(null)
const selectedNodesData = ref([])

const handleGetSelectedNodes = () => {
    if (konvaRef.value) {
        const nodes = konvaRef.value.getSelectedNodesInfo()
        if (nodes && nodes.length > 0) {
            selectedNodesData.value = nodes;
            console.log('获取到的选中节点信息:', selectedNodesData.value)
        } else {
            console.log('当前没有选中的节点')
            selectedNodesData.value = []
        }
    }
}

const handleRenderNodes = () => {
    // 先获取选中的节点信息
    handleGetSelectedNodes()
    
    // 如果有选中的节点，则发送到主题画布
    if (selectedNodesData.value.length > 0) {
        console.log('=== 发送节点数据到主题画布 ===')
        console.log(`节点数量: ${selectedNodesData.value.length}`)
        emit('renderNodesToTopic', {
            nodes: selectedNodesData.value,
            canvasIndex: 1
        })
        console.log('已发送节点数据到父组件')
    } else {
        console.log('没有可渲染的节点')
    }
}
</script>

<style scoped lang="scss">
.working-memory-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 0.875rem;
    overflow: hidden;
}

.get-nodes-btn {
    padding: 10px 20px;
    background: #1890ff;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
        background: #40a9ff;
    }

    &:active {
        background: #096dd9;
    }
}

.render-nodes-btn {
    padding: 10px 20px;
    background: #52c41a;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s;

    &:hover:not(:disabled) {
        background: #73d13d;
    }

    &:disabled {
        background: #d9d9d9;
        cursor: not-allowed;
    }
}
</style>
