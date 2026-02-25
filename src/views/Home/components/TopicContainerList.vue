<template>
  <div class="topic-container-list">
    <div class="topic-list-scroll">
      <div
        v-for="(topic, index) in topics"
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
            <konvaComponent></konvaComponent>
          </div>
        </div>
      </div>
    </div>
    <div class="bottom-action">
      <button class="action-btn">Generate</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import konvaComponent from "@/components/konvaComponent.vue";  

const topics = ref([
  {
    title: "猫咪对人的信任",
    selected: true,
    desc: "",
    image:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cat%20sleeping%20on%20sofa%20with%20christmas%20tree&image_size=landscape_4_3",
  },
  {
    title: "Topic 2",
    selected: true,
    details: null,
    image: null,
  },
  {
    title: "Topic 3",
    selected: false,
    details: null,
    image: null,
  },
  {
    title: "Topic 4",
    selected: false,
    details: null,
    image: null,
  },
  {
    title: "Topic 5",
    selected: false,
    details: null,
    image: null,
  },
]);
</script>

<style scoped lang="scss">
.topic-container-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;

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
        top: 10px;
        right: 10px;
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
      background: #999;
      color: #fff;
      border: none;
      border-radius: 24px;
      padding: 12px 32px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: #666;
      }
    }
  }
}
</style>
