import { defineStore } from "pinia";
import { ref, watch } from "vue";

export const useStoryStore = defineStore("story", () => {
  // 从 localStorage 初始化数据
  const savedStoryList = localStorage.getItem("storyList");
  const savedUserId = localStorage.getItem("user_id");
  const savedSessionId = localStorage.getItem("session_id");
  const storyList = ref(savedStoryList ? JSON.parse(savedStoryList) : []);
  const user_id = ref(savedUserId || "");
  const session_id = ref(savedSessionId || "");

  // 监听 storyList 变化并同步到 localStorage
  watch(
    storyList,
    (newList) => {
      localStorage.setItem("storyList", JSON.stringify(newList));
    },
    { deep: true }
  );

  watch(user_id, (newValue) => {
    localStorage.setItem("user_id", newValue || "");
  });

  watch(session_id, (newValue) => {
    localStorage.setItem("session_id", newValue || "");
  });

  const addStory = (story) => {
    storyList.value.unshift(story);
  };

  const clearStoryList = () => {
    storyList.value = [];
  };

  const setUserId = (value) => {
    user_id.value = value || "";
  };

  const setSessionId = (value) => {
    session_id.value = value || "";
  };

  return {
    storyList,
    user_id,
    session_id,
    addStory,
    clearStoryList,
    setUserId,
    setSessionId,
  };
});
