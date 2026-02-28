<template>
  <div class="topic-container-list">
    <el-button class="add-topic-btn" style="width: 10em;" @click="addNewTopic">新建主题容器</el-button>
    <div class="topic-list-scroll">
      <div
        v-for="(topic, index) in topicContainers"
        :key="index"
        class="topic-container-item"
        :class="{ active: topic.selected }"
      >
        <input
          type="checkbox"
          v-model="topic.selected"
          class="topic-checkbox"
        />
        <div class="topic-container-header">
          <div class="title-input-wrapper">
            <span class="title-label">一句话主题：</span>
            <div class="title-input-container">
              <el-input
                width="100%"
                type="text"
                v-model="topic.title"
                placeholder="请输入一句话主题"
                class="title-input"
              />
            </div>
          </div>
        </div>
        <div class="topic-container-content">
          <div class="detail-item">
            <span class="detail-label">细节描述：</span>
            <el-input
              type="textarea"
              v-model="topic.desc"
              placeholder="请输入细节描述"
              class="detail-textarea"
              :autosize="{ minRows: 2, maxRows: 4 }"
            />
          </div>

          <div style="height: 300px">
            <konvaComponent 
              :ref="(el) => setKonvaRef(el, index)" 
              @sendSelectedNodes="handleSelectedNodes">
            </konvaComponent>
          </div>
        </div>
      </div>
    </div>
    <div class="bottom-action">
      <el-button class="action-btn" type="primary" :disabled="selectedCount === 0">Generate</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import konvaComponent from "@/components/konvaComponent.vue";  

const topicContainers = ref([
  {
    title: "猫咪对人的信任",
    selected: true,
    desc: "人物：\n场景：\n 情节：",
  },
]);

const selectedCount = computed(() => {
  return topicContainers.value.filter(topic => topic.selected).length;
});

const addNewTopic = () => {
  const newTopic = {
    title: ``,
    selected: false,
    desc: "人物：\n场景：\n 情节：",
    image: null,
  };
  topicContainers.value.push(newTopic);
};

const handleSelectedNodes = (nodesData) => {
  console.log('父组件接收到选中的节点数据:', nodesData);
};

const konvaRefs = ref([]);

const setKonvaRef = (el, index) => {
  konvaRefs.value[index] = el;
};

const renderNodesToFirstCanvas = (nodesData) => {
  console.log('TopicContainerList接收到要渲染的节点数据:', nodesData.nodes);
  console.log('目标画布索引:', nodesData.canvasIndex);
  
  const canvasIndex = nodesData.canvasIndex || 0;
  
  if (konvaRefs.value[canvasIndex]) {
    console.log(`konvaRefs.value[${canvasIndex}] 存在`);
    console.log('方法:', Object.keys(konvaRefs.value[canvasIndex]));
    if (typeof konvaRefs.value[canvasIndex].renderNodes === 'function') {
      konvaRefs.value[canvasIndex].renderNodes(nodesData.nodes);
      console.log(`已将节点渲染到画布 ${canvasIndex}`);
    } else {
      console.log('renderNodes 方法不存在');
    }
  } else {
    console.log(`画布 ${canvasIndex} 引用不存在`);
  }
};

defineExpose({
  topicContainers,
  renderNodesToFirstCanvas
});
</script>

<style scoped lang="scss">
.topic-container-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;

  .add-topic-btn {
    width: 100%;
    background: #1890ff;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: 16px;

    &:hover {
      background: #40a9ff;
    }

    &:active {
      background: #096dd9;
    }
  }

  .topic-list-scroll {
    flex: 1;
    overflow-y: auto;
    padding-right: 8px;

    .topic-container-item {
      border: 2px solid transparent;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
      background: #0000000d;
      transition: all 0.2s ease;
      --el-font-size-base: 0.875rem;
      font-size: 0.875rem;
      position: relative;
      &:last-child {
        margin-bottom: 0;
      }
      &.active {
        // border-color: #000;
      }

      .topic-checkbox {
        position: absolute;
        top: 0px;
        right: 0px;
        width: 1rem;
        height: 1rem;
        cursor: pointer;
      }

      .topic-container-header {
        background: #fff;
        padding: 8px 12px;
        border-radius: 8px;
        margin-bottom: 12px;
        .title-input-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: center;
          .title-input-container {
            flex: 1;
            :deep(.el-input) {
              --el-input-text-color: #000;
              .el-input__wrapper {
                padding: 0;
                outline: none;
                box-shadow: none;
                color: #000;
              }
            }
          }
        }
      }

      .topic-container-content {
        .detail-item {
          background: #fff;
          border-radius: 8px;
          margin: 8px 0;
          display: flex;
          flex-direction: column;
          padding: 8px 12px;

          .detail-label {
            font-weight: 500;
            color: #333;
            margin-bottom: 4px;
          }

          .detail-textarea {
            :deep(.el-textarea__inner) {
              box-shadow: none;
              padding: 0;
              color: #000;
            }
          }
        }

        .topic-image {
          width: 100%;
          border-radius: 8px;
          overflow: hidden;

          img {
            width: 100%;
            height: auto;
            display: block;
          }
        }
      }
    }
  }

  .bottom-action {
    padding-top: 16px;
    display: flex;
    justify-content: center;

    .action-btn {
     
      border: none;
      border-radius: 24px;
      padding: 12px 32px;
      font-size: 16px;
      font-weight: 500;
      transition: all 0.2s ease;

    }
  }
}
</style>
