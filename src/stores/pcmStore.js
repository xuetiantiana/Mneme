import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { GetPCMGallery } from "@/service/api";
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
    title: unit.unit_summary,
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
    type: unit.type,
  };
};

const normalizePCMKind = (kind) => {
  return String(kind || "").trim().toLowerCase();
};

const mapPCMTopic = (topic = {}) => {
  const kind = normalizePCMKind(topic.kind);
  const label = String(topic.label || "").trim();
  const thematicSynthesis = String(topic.thematic_synthesis || "").trim();
  const count = Number(topic.count || 0);
  const groups = Array.isArray(topic.groups)
    ? topic.groups.map((group = {}) => ({
        groupId: String(group.group_id || "").trim(),
        title: String(group.title || "").trim(),
        items: Array.isArray(group.items)
          ? group.items.map((unit) => mapPCMUnitToCard(unit))
          : [],
      }))
    : [];

  return {
    kind,
    label,
    count,
    thematicSynthesis,
    groups,
  };
};

export const usePCMStore = defineStore("pcm", () => {
  const memoryItems = ref([]);
  const pcmTopicGroups = ref([]);
  const isLoading = ref(false);

  const pcmKinds = computed(() =>
    pcmTopicGroups.value
      .map((section) => String(section?.kind || "").trim())
      .filter(Boolean)
  );

  const fetchPCMList = async () => {
    isLoading.value = true;
    try {
      const response = await GetPCMGallery();
      const topicList = Array.isArray(response?.data?.topics)
        ? response.data.topics.map((topic) => mapPCMTopic(topic))
        : [];

      pcmTopicGroups.value = topicList;
      memoryItems.value = topicList.flatMap((section) =>
        (Array.isArray(section?.groups) ? section.groups : []).flatMap((group) =>
          Array.isArray(group?.items) ? group.items : []
        )
      );

      if (!memoryItems.value.length) {
        ElMessage.warning("PCM为空");
      }

      return pcmTopicGroups.value;
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
    pcmTopicGroups,
    pcmKinds,
    isLoading,
    fetchPCMList,
    insertPCMDetailToFront,
  };
});
