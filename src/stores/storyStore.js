import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { getSessionId, setSessionId as setMemorySessionId } from "@/service/session";
import { GetStoryList } from "@/service/api";

export const useStoryStore = defineStore("story", () => {
  const savedUserId = localStorage.getItem("user_id");
  const storyList = ref([]);
  const user_id = ref(savedUserId || "");
  const session_id = ref(getSessionId());

  watch(user_id, (newValue) => {
    localStorage.setItem("user_id", newValue || "");
  });

  const addStory = (story) => {
    storyList.value.unshift(story);
  };

  const fetchStoryList = async () => {
    const res = await GetStoryList();
    const stories = res?.data?.stories;
    storyList.value = Array.isArray(stories) ? stories : [];
    return storyList.value;
  };

  const clearStoryList = () => {
    storyList.value = [];
  };

  const setUserId = (value) => {
    user_id.value = value || "";
  };

  const setSessionId = (value) => {
    session_id.value = setMemorySessionId(value);
  };

  return {
    storyList,
    user_id,
    session_id,
    fetchStoryList,
    addStory,
    clearStoryList,
    setUserId,
    setSessionId,
  };
});
