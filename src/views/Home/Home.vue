<template>
  <div class="layout-container">
    <!-- left-panel -->
    <div class="left-panel" v-show="showLeft">
      <div class="panel-header">
        <span>Memory Gallery</span>
        <button class="close-btn" @click="showLeft = false">
          <svg-icon name="toggle-icon" class="toggle-icon"></svg-icon>
        </button>
      </div>

      <div class="panel-content">
        <PCMListComponent></PCMListComponent>
      </div>
    </div>
    <button
      class="toggle-btn fixed-btn"
      style="position: fixed; left: 20px; top: 10px"
      v-show="!showLeft"
      @click="showLeft = true"
    >
      <svg-icon name="toggle-icon" class="toggle-icon"></svg-icon>
    </button>


    <!-- main-panel -->
    <div class="main-panel">
      <div class="panel-header">
        <div class="header-left"></div>
        <span>Wroking memory</span>
        <div class="header-right"></div>
      </div>
      <div class="main-content">
        <WorkingMemory @renderNodesToTopic="handleRenderNodesToTopic"></WorkingMemory>
      </div>
    </div>

    <!-- right-panel -->
    <div class="right-panel" v-show="showRight">
      <div class="panel-header">
        <span>My Story</span>
        <button class="close-btn" @click="showRight = false">
          <svg-icon name="toggle-icon" class="toggle-icon"></svg-icon>
        </button>
      </div>
      <div class="panel-content">

        <TopicContainerList ref="topicContainerListRef"></TopicContainerList>
      </div>
    </div>
    <button
      class="toggle-btn"
      style="position: fixed; right: 20px; top: 10px"
      v-show="!showRight"
      @click="showRight = true"
    >
      <svg-icon name="toggle-icon" class="toggle-icon"></svg-icon>
    </button>
  </div>
</template>

<script setup>
import { ref } from "vue";
import PCMListComponent from "@/views/Home/components/PCMListComponent.vue";
import TopicContainerList from "@/views/Home/components/TopicContainerList.vue";

import WorkingMemory from "@/views/Home/components/WorkingMemory.vue";

const showLeft = ref(true);
const showRight = ref(true);
const topicContainerListRef = ref(null);

const handleRenderNodesToTopic = (nodesData) => {
    console.log('Home接收到要渲染的节点数据:', nodesData);
    if (topicContainerListRef.value) {
        topicContainerListRef.value.renderNodesToFirstCanvas(nodesData);
    }
};
</script>

<style scoped lang="scss">
.layout-container {
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background: #eee;
  padding: 16px;
  gap: 14px;

  .left-panel,
  .right-panel {
    width: 350px;
    background-color: #ffff;
    display: flex;
    flex-direction: column;
    transition: width 0.3s ease;
    border-radius: 20px;

    

    .panel-content {
      flex: 1;
      overflow-y: auto;
    }
  }

  .right-panel {
    width: 30%;
    min-width: 400px;
    border-right: none;
    border-left: 1px solid #ddd;
  }

  .panel-header {
    
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 0 .5rem;
      padding: .8rem;
      border-bottom: 1px solid #E2E2E2;
       
        span{
             font-weight: 600;
             font-size: 1.125em;
        }
      .toggle-icon {
        width: 16px;
        height: 16px;
      }

      .close-btn {
        display: flex;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        padding: 0 8px;
        color: #666;

        &:hover {
          color: #333;
        }
      }
    }

  .main-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: #fff;
    border-radius: 20px;
    




    .main-content {
      flex: 1;
      overflow-y: auto;
    }
  }

  .toggle-btn {
    background: none;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 4px 12px;
    cursor: pointer;
    font-size: 18px;
    color: #666;

    &:hover {
      background-color: #f0f0f0;
    }

    .toggle-icon {
      width: 16px;
      height: 16px;
    }
  }
}
</style>
