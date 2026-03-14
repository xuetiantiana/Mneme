import { defineStore } from "pinia";
import { ref } from "vue";
import { GetPCMList } from "@/service/api";
import { getImageProxyUrl } from "@/utils/initPCM";

const mapPCMUnitToCard = (unit = {}) => {
  const mainImages =
    unit.user_input?.images?.map((img, index) => ({
      image_url: getImageProxyUrl(img),
      id: unit.id,
      layout: unit.layout?.main_cluster?.images?.[index] || {},
    })) || [];

  return {
    id: unit.id,
    title: unit.unit_summary || "未命名记忆",
    selected: false,
    images:
      unit.user_input?.images?.map((img) => getImageProxyUrl(img)) || [],
    mainImages,
    createdAt: unit.created_at,
    text: unit.user_input?.text || "",
    timePlace: unit.user_input?.time_place || "",
    segments: unit.segments || [],
    user_input: unit.user_input || {},
    layout: unit.layout || {},
    type: unit.type || "pcm_unit",
  };
};

export const usePCMStore = defineStore("pcm", () => {
  const memoryItems = ref([]);
  const isLoading = ref(false);

  const fetchPCMList = async () => {
    isLoading.value = true;
    try {
      const response = await GetPCMList();
      const payload = response?.data || {};
      const units =
        (Array.isArray(payload?.units) && payload.units) ||
        (Array.isArray(payload?.data?.units) && payload.data.units) ||
        [];

      memoryItems.value = units.map((unit) => mapPCMUnitToCard(unit));
      return memoryItems.value;
    } finally {
      isLoading.value = false;
    }
  };

  const insertPCMDetailToFront = (pcmDetail) => {
    if (!pcmDetail || typeof pcmDetail !== "object") {
      return null;
    }

    const newItem = mapPCMUnitToCard(pcmDetail);
    if (!newItem.id) {
      return null;
    }

    memoryItems.value = memoryItems.value.filter((item) => item.id !== newItem.id);
    memoryItems.value.unshift(newItem);
    return newItem;
  };

  return {
    memoryItems,
    isLoading,
    fetchPCMList,
    insertPCMDetailToFront,
  };
});
