<template>
  <div
    style="
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      position: relative;
    "
  >
    <div style="height: 100%">
      <KonvaComponent ref="konvaRef" />
    </div>

    <!-- 左下角按钮列表 -->
    <ul class="bottom-btn-list">
      <li>
        <el-tooltip content="添加文本" placement="right" effect="light">
          <el-button circle size="medium" @click="handleAddText">
            <el-icon><Edit /></el-icon>
          </el-button>
        </el-tooltip>
      </li>
      <!-- <li>
        <el-tooltip content="添加图片" placement="right" effect="light">
          <el-button circle size="medium">
            <el-icon><Picture /></el-icon>
          </el-button>
        </el-tooltip>
      </li> -->
      <li>
        <el-tooltip content="AI辅助" placement="right" effect="light">
          <el-button circle size="medium"> AI </el-button>
        </el-tooltip>
      </li>
      <li>
        <el-popover placement="right" :width="200" trigger="hover">
          <template #reference>
            <el-button circle size="medium">
              <el-icon><Promotion /></el-icon>
            </el-button>
          </template>
          <ul class="send-menu-list">
            <li
              v-for="(topic, index) in topicContainers"
              :key="index"
              class="send-menu-item"
              @click="handleRenderNodes(index)"
            >
              发送到主题容器{{ index + 1 }}
            </li>
          </ul>
        </el-popover>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, defineProps } from "vue";
import { Edit, Picture, Promotion } from "@element-plus/icons-vue";
import konvaComponent from "@/components/konvaComponent.vue";

const props = defineProps({
  topicContainers: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["renderNodesToTopic"]);

const memoryItems = ref([]);
const konvaRef = ref(null);
const selectedNodesData = ref([]);

const handleAddText = () => {
  if (konvaRef.value && konvaRef.value.setTool) {
    konvaRef.value.setTool("text");
  }
};

const handleRenderNodes = (canvasIndex) => {
  // 先获取选中的节点信息
  selectedNodesData.value = konvaRef.value.getSelectedNodes();
  console.log("111", selectedNodesData.value);
  // 如果有选中的节点，则发送到主题画布
  if (selectedNodesData.value.length > 0) {
    emit("renderNodesToTopic", {
      nodes: selectedNodesData.value,
      canvasIndex: canvasIndex,
    });
    console.log("已发送节点数据到父组件");
  } else {
    ElMessage({
      message: "请先在画布中选择要渲染的节点",
      type: "warning",
    });
    console.log("没有可渲染的节点");
  }
};
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

.bottom-btn-list {
  position: absolute;
  left: 20px;
  bottom: 20px;
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 100;

  li {
    margin: 0;
  }
}

.send-menu-list {
  list-style: none;
  padding: 0;
  margin: 0;

  .send-menu-item {
    padding: 8px 5px;
    cursor: pointer;
    font-size: 14px;
    color: #333;
    transition: all 0.2s;
    border-radius: 4px;

    &:hover {
      background-color: #f5f5f5;
      color: #1890ff;
    }
  }
}
</style>
