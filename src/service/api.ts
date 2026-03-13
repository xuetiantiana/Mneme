import axios from "axios";
import { createAxios } from "./axios";

//其他配置
const request = createAxios({
  baseURL: "https://mneme-gcakhrgtedbjerhz.westus2-01.azurewebsites.net",
});

export const GetPCMList = (data: any): any => {
  return request.get(
    "https://mneme-gcakhrgtedbjerhz.westus2-01.azurewebsites.net/api/pcm/list"
  );
};

export const CreateStory = (data: any): any => {
  return request.post("/api/story/create", data);

  const response = {
    success: true,
    data: {
      story_id: "STORY-20260303171610-16edfc",
      title: "温暖的片段交织",
      markdown: `在那个温暖的午后，我漫步在阿陶亚的小巷中，阳光洒在白色陶瓷物品上，反射出柔和的光芒。每一个瓷器都像是一段静谧的旋律，唤起内心深处的宁静舒适。这里的每一件物品都散发着淡雅平和的气息，仿佛时间在这一刻凝固，世界变得纯净简约。
 
![白色陶瓷物品](/api/images/data/PCM-20260304222800-961e20/crops/S_overlap_F1.png)
 
走进日式风格的茶室，木质桌椅和柔和的灯光营造出一种怀旧温馨的氛围。墙上的画作和角落里的绿植，似乎在诉说着一个悠远的故事。那种文化氛围让人不禁想起童年时光，那些简单却充满意义的日子。舒适宁静的环境让心灵得到片刻的休憩，仿佛在这里，所有的烦恼都被轻轻地抚平。
 
在这如梦般的时光里，我感受到一种久违的平和与安宁。每一个细节都在提醒我，生活的美好往往蕴藏在这些不起眼的瞬间。在这片陶瓷与木质的交融中，我找到了属于自己的片刻宁静，成为记忆中温暖的一部分。`,
    },
  };

  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve(response);
    }, 1000);
  });
};

export const gelReflectToolData = (data: any): any => {
  // return request.post("/api/story/create", data);

  const response = {
    success: true,
    data: {
      questionList: [
        {
          question: "你最近在做什么？",
          answer: "我最近在学习React Native。",
          images: [
            "https://mneme-gcakhrgtedbjerhz.westus2-01.azurewebsites.net/api/images/data/pcm_units/PCM-20260309135530-54788a/crops/S_overlap_F1.png",
          ],
        },
        {
          question: "你最近在学习什么？",
          answer: "我最近在学习React Native。",
        },
      ],
    },
  };

  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve(response);
    }, 1000);
  });
};

export const gelConstellateToolData = (data: any): any => {
  // return request.post("/api/story/create", data);

  const response = {
    success: true,
    data: {
      questionList: [
        {
          images: [
            "https://mneme-gcakhrgtedbjerhz.westus2-01.azurewebsites.net/api/images/data/pcm_units/PCM-20260309135530-54788a/crops/S_overlap_F1.png",
          ],
        },
        {
          images: [
            "https://mneme-gcakhrgtedbjerhz.westus2-01.azurewebsites.net/api/images/data/pcm_units/PCM-20260305145501-bc432d/generated/S_text_F2.png",
          ],
        },
      ],
    },
  };

  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve(response);
    }, 1000);
  });
};

export const ReflectHint = (data: any): any => {
  console.log("ReflectHint data:", data);
  return request.post("/api/reflect/hint", data);

  const response = {
    success: true,
    data: {
  "depths": [
    "描述层",
    "感受层",
    "评价层",
    "分析层",
    "结论层",
    "行动层"
  ],
  "perspectives": [
    {
      "id": "perspective-YYYY***-***", 
      "name": "过去的你"
    },
    {
      "id": "perspective-YYYY***-***",
      "name": "诗人"
    },
    {
      "id": "perspective-YYYY***-***",
      "name": "人类学家"
    }
  ]
}
  };

  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve(response);
    }, 1000);
  });
};



export const ConstellateHint = (data: any): any => {
  console.log("ConstellateHint data:", data);
  // return request.post("/api/reflect/hint", data);

  const response = {
    success: true,
    data: {
  "depths": [
    "描述层",
    "感受层",
    "评价层",
    "分析层",
    "结论层",
    "行动层"
  ],
  "perspectives": [
    {
      "id": "perspective-YYYY***-***", 
      "name": "过去的你11222"
    },
    {
      "id": "perspective-YYYY***-***",
      "name": "诗人"
    },
    {
      "id": "perspective-YYYY***-***",
      "name": "人类学家"
    }
  ]
}
  };

  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve(response);
    }, 1000);
  });
};


export const ReflectQuestions = (data: any): any => {
  return request.post("/api/reflect/questions", data);

  const response = {
    success: true,
    data: {
    "id": "question-xxx-xxx",
    "text": "",
    "type": "question",
    "depth": "传入的深度值",
    "memory":[{
        "id": "",
        "image_url": "https://mneme-gcakhrgtedbjerhz.westus2-01.azurewebsites.net/api/images/data/pcm_units/PCM-20260309135530-54788a/crops/S_overlap_F1.png",
        "text": "111111"
    },
  {
        "id": "",
        "image_url": "",
        "text": "111111"
    }]
}
  };

  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve(response);
    }, 1000);
  });
};
