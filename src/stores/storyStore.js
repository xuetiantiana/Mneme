import { defineStore } from "pinia";
import { ref } from "vue";

export const useStoryStore = defineStore("story", () => {
  const storyList = ref([]);

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
