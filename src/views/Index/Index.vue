<template>
  <div class="index-container">
    <div class="canvas-section" style="width: 100vw; height: 100vh">
      <HierarchicalCanvasComponent
        ref="HierarchicalCanvasComponentRef"
        @showPopup="handleShowPopup"
      ></HierarchicalCanvasComponent>
    </div>

    <!-- <div class="toolbar-section">
      <ToolBar @item-click="handleToolbarItemClick" />
    </div> -->

    <!-- <div class="input-memory-title-section">
      <div class="input-memory-title-container">
        <el-input v-model="inputValue" placeholder="Type the memory you want to create..."></el-input>
      </div>
    </div> -->

    <div class="memory-section-popup" v-if="showMemoryPopup">
      <div
        class="memory-input-container"
        :style="{
          top: `${memoryPopupPosition.y}px`,
          left: `${memoryPopupPosition.x}px`,
        }"
      >
        <MemoryInput
          @close="handleCloseMemoryPopup"
          @confirmMemory="handleConfirmMemory"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import HierarchicalCanvasComponent from "./components/HierarchicalCanvasComponent.vue";
import MemoryInput from "./components/MemoryInput.vue";
import ToolBar from "./components/ToolBar.vue";

const HierarchicalCanvasComponentRef = ref(null);
const showMemoryPopup = ref(false);
const memoryPopupPosition = ref({ x: 0, y: 0 });

const handleCloseMemoryPopup = () => {
  console.log("Close Memory Input");
  showMemoryPopup.value = false;
};

const handleConfirmMemory = (memoryData) => {
  console.log("Upload Memory:", memoryData);
  handleCloseMemoryPopup();
  // 这里可以实现上传逻辑
  const data = {
    description: memoryData.description,
    img: memoryData.mainImage,
  }

  //调用子组件的方法
  HierarchicalCanvasComponentRef.value.dwanMemoryC1(data);
};

const handleToolbarItemClick = (itemData) => {
  console.log("Toolbar Item Click:", itemData);
  // 这里可以实现工具栏项目点击逻辑
};

const handleShowPopup = (textElement) => {
  console.log("Show Popup:", textElement);
  showMemoryPopup.value = true;
  memoryPopupPosition.value = {
    x: textElement.x,
    y: textElement.y,
  };
  // 这里可以实现弹窗逻辑
};

// 响应式数据
const inputValue = ref("");
</script>

<style lang="scss" scoped>
.index-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.toolbar-section {
  position: fixed;
  bottom: 50px;
  left: 50%;
  transform: translate(-50%, 0);
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  z-index: 2;
}

.memory-section-popup {
  position: fixed;
  width: 100vw;
  height: 100vh;
  top: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.05);
  z-index: 10;
  .memory-input-container {
    overflow: auto;
    position: absolute;
    top: 0;
    left: 0;
    // transform: translate(-50%, 0%);
    // width: 450px;
    // height: 550px;
  }
}
.input-memory-title-section {
  position: fixed;
  width: 100vw;
  height: 100vh;
  top: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.05);
  z-index: 10;
  .input-memory-title-container {
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translate(-50%, 0);
    .el-input {
      width: 300px;
      height: 48px;
    }
  }
}
</style>