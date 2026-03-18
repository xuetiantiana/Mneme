import { defineStore } from "pinia";
import { ref } from "vue";
import { GetPCMList } from "@/service/api";
import { getImageProxyUrl } from "@/utils/initPCM";
import { ElMessage } from "element-plus";

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

  const resolvePCMUnits = (payload) => {
    if (Array.isArray(payload)) return payload;

    return (
      (Array.isArray(payload?.units) && payload.units) ||
      (Array.isArray(payload?.data?.units) && payload.data.units) ||
      (Array.isArray(payload?.pcm_list) && payload.pcm_list) ||
      (Array.isArray(payload?.data?.pcm_list) && payload.data.pcm_list) ||
      (Array.isArray(payload?.items) && payload.items) ||
      (Array.isArray(payload?.data?.items) && payload.data.items) ||
      []
    );
  };

  const fetchPCMList = async () => {
    isLoading.value = true;
    try {
      const response = await GetPCMList();
      const payload = response?.data || {};
      const units = resolvePCMUnits(payload);

      if (!units.length) {
        ElMessage.warning("PCM为空");
      }

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
