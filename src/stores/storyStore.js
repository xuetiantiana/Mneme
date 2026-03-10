import { defineStore } from "pinia";
import { ref, watch } from "vue";

export const useStoryStore = defineStore("story", () => {
  // 从 localStorage 初始化数据
  const savedStoryList = localStorage.getItem("storyList");
  const storyList = ref(savedStoryList ? JSON.parse(savedStoryList) : []);

  // 监听 storyList 变化并同步到 localStorage
  watch(
    storyList,
    (newList) => {
      localStorage.setItem("storyList", JSON.stringify(newList));
    },
    { deep: true }
  );

  const addStory = (story) => {
    storyList.value.unshift(story);
  };

  const clearStoryList = () => {
    storyList.value = [];
  };

  return {
    storyList,
    addStory,
    clearStoryList,
  };
});
