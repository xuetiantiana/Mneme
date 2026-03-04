import axios from "axios";
import { createAxios } from "./axios";

//其他配置
const request = createAxios({
  baseURL: "http://20.1.170.90:2233/chat",
});

export const CreateStory = (data: any): any => {
  //   return request.post("/api/story/create", data);

  const response = {
    success: true,
    data: {
      story_id: "STORY-20260303171610-16edfc",
      title: "温暖的片段交织",
      markdown: "# 温暖的片段交织 ...(Markdown 正文，图片为完整 URL)温暖的片段交织 ...(Markdown 正文，图片为完整 URL)温暖的片段交织 ...(Markdown 正文，图片为完整 URL)",
      image_refs: [
        {
          placeholder: "IMAGE_1",
          description: "宠物店玻璃柜中的小狗",
          url: "http://host/api/images/.../S_overlap_F1.png",
        },
      ],
      screenshot_url: "http://host/api/images/.../screenshot.png",
      pcm_ids: ["PCM-20260302192935-dc603e"],
      created_at: "2026-03-03T17:16:18.152073",
      elapsed_ms: 8073.49,
    },
  };

  return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(response);
        }, 1000);
    });
};
