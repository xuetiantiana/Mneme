import { createAxios } from "./axios";
import { createMockGalleryGroup } from "./mockGalleryGroup";

//其他配置
const request = createAxios({
    baseURL: "https://mneme-gcakhrgtedbjerhz.westus2-01.azurewebsites.net",
});

const prependMockGalleryGroup = (topic: any): any => {
    const mockGroup = createMockGalleryGroup();
    const groups = Array.isArray(topic?.groups) ? topic.groups : [];
    const mockItemCount = Array.isArray(mockGroup?.items) ? mockGroup.items.length : 0;

    return {
        ...topic,
        count: Number(topic?.count || 0) + mockItemCount,
        groups: [mockGroup, ...groups],
    };
};

export const GetPCMList = (): any => {
    return request.get(
        "/api/pcm/list",
    );
};

export const GetPCMGallery = (): any => {
    return request.get(
        "/api/pcm/gallery",
    ).then((response: any) => {
        if (!Array.isArray(response?.data?.topics)) {
            return response;
        }

        return {
            ...response,
            data: {
                ...response.data,
                topics: response.data.topics.map((topic: any) => prependMockGalleryGroup(topic)),
            },
        };
    });
};

export const GetStoryList = (): any => {
    return request.get(
        "/api/story/list",
    );
};

export const CreateOnePCM = (data: any): any => {
    return request.post("/api/pcm/create", data);

    const response = {
        success: true,
        data: {
            id: "PCM-20260314055223235-372f15e117",
            type: "pcm_unit",
            created_at: "2026-03-14T05:53:01.946873",
            unit_summary: "在深圳的宠物店里看小狗，让人放松的记忆。",
            context: {
                time_anchor: "2025.11",
                place_anchor: "深圳宠物店",
            },
            user_input: {
                images: [
                    "https://mneme-gcakhrgtedbjerhz.westus2-01.azurewebsites.net/api/images/test_user/pcm/PCM-20260314055223235-372f15e117/uploads/20260314055223_0_1aacaf23e158.png",
                ],
                text: "看宠物店里面很多小狗\n我住在深圳的时候，每天都会去深圳楼下的商场吃饭，然后顺便去看一看这个宠物店的小狗小猫放松一下。",
                time_place: "2025.11，深圳宠物店",
                received_at: "2026-03-14T05:52:23.235092",
            },
            segments: [
                {
                    signifier_ref:
                        "PCM-20260314055223235-372f15e117-signifier-1",
                    id: "PCM-20260314055223235-372f15e117-segment-1",
                    type: "segment",
                    label: "宠物店小狗趴在玻璃柜",
                    category: "text_image_overlap",
                    source: ["author_text", "image"],
                    image_url:
                        "https://mneme-gcakhrgtedbjerhz.westus2-01.azurewebsites.net/api/images/test_user/pcm/PCM-20260314055223235-372f15e117/crops/crop-20260314055301895-9fc9af16f2.png",
                    interpretations: {
                        meaning: [
                            {
                                id: "PCM-20260314055223235-372f15e117-interp-3",
                                type: "interpretation",
                                text: "宠物陪伴",
                                kind: "meaning",
                                t: 3,
                                specificity: 4,
                                status: "user_provided",
                                source: ["author_text", "image"],
                                modality: null,
                                ai_confidence: null,
                            },
                        ],
                        emotion: [
                            {
                                id: "PCM-20260314055223235-372f15e117-interp-5",
                                type: "interpretation",
                                text: "怀念温暖",
                                kind: "emotion",
                                t: 3,
                                specificity: 5,
                                status: "user_provided",
                                source: ["author_text"],
                                modality: null,
                                ai_confidence: null,
                            },
                            {
                                id: "PCM-20260314055223235-372f15e117-interp-4",
                                type: "interpretation",
                                text: "放松愉悦",
                                kind: "emotion",
                                t: 0,
                                specificity: 4,
                                status: "user_provided",
                                source: ["author_text", "image"],
                                modality: null,
                                ai_confidence: null,
                            },
                        ],
                        sensory: [
                            {
                                id: "PCM-20260314055223235-372f15e117-interp-6",
                                type: "interpretation",
                                text: "毛软蓬松",
                                kind: "sensory",
                                t: 0,
                                specificity: 2,
                                status: "ai_recommended",
                                source: ["image"],
                                modality: "tactile",
                                ai_confidence: 2,
                            },
                        ],
                        aesthetic: [
                            {
                                id: "PCM-20260314055223235-372f15e117-interp-8",
                                type: "interpretation",
                                text: "温馨柔和",
                                kind: "aesthetic",
                                t: 0,
                                specificity: 3,
                                status: "ai_recommended",
                                source: ["image"],
                                modality: null,
                                ai_confidence: 3,
                            },
                            {
                                id: "PCM-20260314055223235-372f15e117-interp-9",
                                type: "interpretation",
                                text: "画面静谧",
                                kind: "aesthetic",
                                t: 3,
                                specificity: 3,
                                status: "ai_recommended",
                                source: ["image"],
                                modality: null,
                                ai_confidence: 2,
                            },
                        ],
                    },
                    image_index: 0,
                    image_width: 164,
                    image_height: 247,
                    layout: {
                        x: -411,
                        y: 0,
                        w: 198,
                        h: 217,
                        group_ref: "PCM-20260314055223235-372f15e117-group-1",
                        bubbles: [
                            {
                                interpretation_ref:
                                    "PCM-20260314055223235-372f15e117-interp-3",
                                text: "宠物陪伴",
                                kind: "meaning",
                                x: -115,
                                y: 107,
                                r: 30,
                                specificity: 4,
                                id: "PCM-20260314055223235-372f15e117-bubble-3",
                                type: "bubble",
                            },
                            {
                                interpretation_ref:
                                    "PCM-20260314055223235-372f15e117-interp-4",
                                text: "放松愉悦",
                                kind: "emotion",
                                x: -152,
                                y: 39,
                                r: 30,
                                specificity: 4,
                                id: "PCM-20260314055223235-372f15e117-bubble-4",
                                type: "bubble",
                            },
                            {
                                interpretation_ref:
                                    "PCM-20260314055223235-372f15e117-interp-5",
                                text: "怀念温暖",
                                kind: "emotion",
                                x: -152,
                                y: -39,
                                r: 30,
                                specificity: 5,
                                id: "PCM-20260314055223235-372f15e117-bubble-5",
                                type: "bubble",
                            },
                            {
                                interpretation_ref:
                                    "PCM-20260314055223235-372f15e117-interp-6",
                                text: "毛软蓬松",
                                kind: "sensory",
                                x: -115,
                                y: -107,
                                r: 30,
                                specificity: 2,
                                id: "PCM-20260314055223235-372f15e117-bubble-6",
                                type: "bubble",
                            },
                            {
                                interpretation_ref:
                                    "PCM-20260314055223235-372f15e117-interp-8",
                                text: "温馨柔和",
                                kind: "aesthetic",
                                x: -50,
                                y: -149,
                                r: 30,
                                specificity: 3,
                                id: "PCM-20260314055223235-372f15e117-bubble-7",
                                type: "bubble",
                            },
                            {
                                interpretation_ref:
                                    "PCM-20260314055223235-372f15e117-interp-9",
                                text: "画面静谧",
                                kind: "aesthetic",
                                x: 27,
                                y: -155,
                                r: 30,
                                specificity: 3,
                                id: "PCM-20260314055223235-372f15e117-bubble-8",
                                type: "bubble",
                            },
                        ],
                    },
                },
                {
                    signifier_ref:
                        "PCM-20260314055223235-372f15e117-signifier-2",
                    id: "PCM-20260314055223235-372f15e117-segment-2",
                    type: "segment",
                    label: "去商场吃饭后顺便看宠物",
                    category: "text_has_image_missing",
                    source: ["author_text"],
                    image_url: null,
                    interpretations: {
                        meaning: [
                            {
                                id: "PCM-20260314055223235-372f15e117-interp-10",
                                type: "interpretation",
                                text: "日常放松",
                                kind: "meaning",
                                t: 0,
                                specificity: 5,
                                status: "user_provided",
                                source: ["author_text"],
                                modality: null,
                                ai_confidence: null,
                            },
                            {
                                id: "PCM-20260314055223235-372f15e117-interp-11",
                                type: "interpretation",
                                text: "生活闲趣",
                                kind: "meaning",
                                t: 3,
                                specificity: 4,
                                status: "user_provided",
                                source: ["author_text"],
                                modality: null,
                                ai_confidence: null,
                            },
                        ],
                        emotion: [
                            {
                                id: "PCM-20260314055223235-372f15e117-interp-13",
                                type: "interpretation",
                                text: "温馨怀旧",
                                kind: "emotion",
                                t: 3,
                                specificity: 5,
                                status: "user_provided",
                                source: ["author_text"],
                                modality: null,
                                ai_confidence: null,
                            },
                        ],
                        sensory: [],
                        aesthetic: [
                            {
                                id: "PCM-20260314055223235-372f15e117-interp-16",
                                type: "interpretation",
                                text: "生活流畅",
                                kind: "aesthetic",
                                t: 0,
                                specificity: 2,
                                status: "ai_recommended",
                                source: ["author_text"],
                                modality: null,
                                ai_confidence: 1,
                            },
                        ],
                    },
                    layout: {
                        x: 402,
                        y: 0,
                        w: 180,
                        h: 136,
                        group_ref: "PCM-20260314055223235-372f15e117-group-2",
                        bubbles: [
                            {
                                interpretation_ref:
                                    "PCM-20260314055223235-372f15e117-interp-10",
                                text: "日常放松",
                                kind: "meaning",
                                x: 15,
                                y: -147,
                                r: 30,
                                specificity: 5,
                                id: "PCM-20260314055223235-372f15e117-bubble-9",
                                type: "bubble",
                            },
                            {
                                interpretation_ref:
                                    "PCM-20260314055223235-372f15e117-interp-11",
                                text: "生活闲趣",
                                kind: "meaning",
                                x: 110,
                                y: -99,
                                r: 30,
                                specificity: 4,
                                id: "PCM-20260314055223235-372f15e117-bubble-10",
                                type: "bubble",
                            },
                            {
                                interpretation_ref:
                                    "PCM-20260314055223235-372f15e117-interp-13",
                                text: "温馨怀旧",
                                kind: "emotion",
                                x: 110,
                                y: 99,
                                r: 30,
                                specificity: 5,
                                id: "PCM-20260314055223235-372f15e117-bubble-12",
                                type: "bubble",
                            },
                            {
                                interpretation_ref:
                                    "PCM-20260314055223235-372f15e117-interp-16",
                                text: "生活流畅",
                                kind: "aesthetic",
                                x: 15,
                                y: 147,
                                r: 30,
                                specificity: 2,
                                id: "PCM-20260314055223235-372f15e117-bubble-13",
                                type: "bubble",
                            },
                        ],
                    },
                },
            ],
            layout: {
                canvas: {
                    w: 1333,
                    h: 833,
                },
                main_cluster: {
                    cx: 0,
                    cy: 0,
                    label: "在深圳的宠物店里看小狗，让人放松的记忆。",
                    images: [
                        {
                            index: 0,
                            x: 0,
                            y: 0,
                            w: 264,
                            h: 350,
                            rotation: 0,
                            z_index: 1,
                        },
                    ],
                },
                groups: [
                    {
                        id: "PCM-20260314055223235-372f15e117-group-1",
                        type: "group",
                        label: "宠物店小狗趴在玻",
                        concept: "",
                        placement: "left",
                        segment_refs: [
                            "PCM-20260314055223235-372f15e117-segment-1",
                        ],
                    },
                    {
                        id: "PCM-20260314055223235-372f15e117-group-2",
                        type: "group",
                        label: "去商场吃饭后顺便",
                        concept: "",
                        placement: "right",
                        segment_refs: [
                            "PCM-20260314055223235-372f15e117-segment-2",
                        ],
                    },
                ],
                connections: [
                    {
                        from: "main",
                        to: "PCM-20260314055223235-372f15e117-segment-1",
                    },
                    {
                        from: "main",
                        to: "PCM-20260314055223235-372f15e117-segment-2",
                    },
                ],
                origin: {
                    x: 0,
                    y: 0,
                },
                bubble_coords: "relative",
                planning_elapsed_ms: 6.68,
            },
        },
    };

    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(response);
        }, 1000);
    });
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



export const ReflectHint = (data: any): any => {
    console.log("ReflectHint data:", data);
    // return request.post("/api/reflect/hint", data);

    const response = {
        success: true,
        data: {
            depths: [
                "描述层",
                "感受层",
                "评价层",
                "分析层",
                "结论层",
                "行动层",
            ],
            perspectives: [
                
                {
                    id: "perspective-YYYY***-***",
                    name: "Quiet Shape",
                },
                {
                    id: "perspective-YYYY***-***",
                    name: "Tender Failure",
                },
                {
                    id: "perspective-YYYY***-***",
                    name: "Domestic Mending",
                },
                {
                    id: "perspective-YYYY***-***",
                    name: "Why Snap",
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

let ReflectQuestionsNum = 0;
export const ReflectQuestions = (data: any): any => {
    console.log("ReflectQuestions data:", data);
    // return request.post("/api/reflect/questions", data);
    ReflectQuestionsNum++;

    const data1 =  [
        {
            id: "question-20260313050838889-937a186605",
            text: "Do you remember the moment it snapped?",
            type: "question",
            depth: "感受层",
            perspective: {
                id: "perspective-20260313050635727-6f33954444",
                name: "人类学家",
                type: "perspective",
                short_prompt: "探寻深圳都市商场日常中的文化符号与仪式感。",
                created_at: "2026-03-13T05:06:35.727392Z",
            },
            // memory: [
            //     {
            //         id: "",
            //         image_url:
            //             "https://mneme-gcakhrgtedbjerhz.westus2-01.azurewebsites.net/api/images/data/pcm_units/PCM-20260309135530-54788a/crops/S_overlap_F1.png",
            //         text: "",
            //     },
            //     {
            //         id: "",
            //         image_url:
            //             "https://mneme-gcakhrgtedbjerhz.westus2-01.azurewebsites.net/api/images/data/pcm_units/PCM-20260309135530-54788a/crops/S_overlap_F1.png",
            //         text: "",
            //     },
            // ],
        },
        {
            id: "question-20260313050838889-1c49d24668",
            text: "Why still place the broken orchid in the bottle?",
            type: "question",
            depth: "感受层",
            perspective: {
                id: "perspective-20260313050635727-6f33954444",
                name: "人类学家",
                type: "perspective",
                short_prompt: "探寻深圳都市商场日常中的文化符号与仪式感。",
                created_at: "2026-03-13T05:06:35.727392Z",
            },
            memory: [],
        },
        {
            id: "question-20260313050838889-2a85315616",
            text: "What do you think caused it to break?",
            type: "question",
            depth: "感受层",
            perspective: {
                id: "perspective-20260313050635727-6f33954444",
                name: "人类学家",
                type: "perspective",
                short_prompt: "探寻深圳都市商场日常中的文化符号与仪式感。",
                created_at: "2026-03-13T05:06:35.727392Z",
            },
            memory: [],
        },
    ];
    const data2 =  [
        {
            id: "question-20260313050838889-937a186605",
            text: "What made you treat it so gently, even after it broke?",
            type: "question",
            depth: "感受层",
            perspective: {
                id: "perspective-20260313050635727-6f33954444",
                name: "人类学家",
                type: "perspective",
                short_prompt: "探寻深圳都市商场日常中的文化符号与仪式感。",
                created_at: "2026-03-13T05:06:35.727392Z",
            },
            // memory: [
            //     {
            //         id: "",
            //         image_url:
            //             "https://mneme-gcakhrgtedbjerhz.westus2-01.azurewebsites.net/api/images/data/pcm_units/PCM-20260309135530-54788a/crops/S_overlap_F1.png",
            //         text: "",
            //     },
            //     {
            //         id: "",
            //         image_url:
            //             "https://mneme-gcakhrgtedbjerhz.westus2-01.azurewebsites.net/api/images/data/pcm_units/PCM-20260309135530-54788a/crops/S_overlap_F1.png",
            //         text: "",
            //     },
            // ],
        },
        {
            id: "question-20260313050838889-1c49d24668",
            text: "What feels important about this now?",
            type: "question",
            depth: "感受层",
            perspective: {
                id: "perspective-20260313050635727-6f33954444",
                name: "人类学家",
                type: "perspective",
                short_prompt: "探寻深圳都市商场日常中的文化符号与仪式感。",
                created_at: "2026-03-13T05:06:35.727392Z",
            },
            memory: [],
        },
        {
            id: "question-20260313050838889-2a85315616",
            text: "What made it stay in your mind?",
            type: "question",
            depth: "感受层",
            perspective: {
                id: "perspective-20260313050635727-6f33954444",
                name: "人类学家",
                type: "perspective",
                short_prompt: "探寻深圳都市商场日常中的文化符号与仪式感。",
                created_at: "2026-03-13T05:06:35.727392Z",
            },
            memory: [],
        },
    ];

    const data3 =  [
        {
            id: "question-20260313050838889-937a186605",
            text: "If this moment meant one thing, what would it be?",
            type: "question",
            depth: "感受层",
            perspective: {
                id: "perspective-20260313050635727-6f33954444",
                name: "人类学家",
                type: "perspective",
                short_prompt: "探寻深圳都市商场日常中的文化符号与仪式感。",
                created_at: "2026-03-13T05:06:35.727392Z",
            },
            // memory: [
            //     {
            //         id: "",
            //         image_url:
            //             "https://mneme-gcakhrgtedbjerhz.westus2-01.azurewebsites.net/api/images/data/pcm_units/PCM-20260309135530-54788a/crops/S_overlap_F1.png",
            //         text: "",
            //     },
            //     {
            //         id: "",
            //         image_url:
            //             "https://mneme-gcakhrgtedbjerhz.westus2-01.azurewebsites.net/api/images/data/pcm_units/PCM-20260309135530-54788a/crops/S_overlap_F1.png",
            //         text: "",
            //     },
            // ],
        },
        {
            id: "question-20260313050838889-1c49d24668",
            text: "If this became a picture-book scene, would it be about loss, care, or living with what cannot be repaired?",
            type: "question",
            depth: "感受层",
            perspective: {
                id: "perspective-20260313050635727-6f33954444",
                name: "人类学家",
                type: "perspective",
                short_prompt: "探寻深圳都市商场日常中的文化符号与仪式感。",
                created_at: "2026-03-13T05:06:35.727392Z",
            },
            memory: [],
        },
        {
            id: "question-20260313050838889-2a85315616",
            text: "What feels bigger than the orchid here?",
            type: "question",
            depth: "感受层",
            perspective: {
                id: "perspective-20260313050635727-6f33954444",
                name: "人类学家",
                type: "perspective",
                short_prompt: "探寻深圳都市商场日常中的文化符号与仪式感。",
                created_at: "2026-03-13T05:06:35.727392Z",
            },
            memory: [],
        },
    ];


    const response = {
        success: true,
        data: ReflectQuestionsNum === 1 ? data1 : ReflectQuestionsNum === 2 ? data2 : data3,
    };

    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(response);
        }, 1000);
    });
};

export const ConstellateHint = (data: any): any => {
    console.log("ConstellateHint data:", data);
    // return request.post("/api/constellate/hint", data);
    const response = {
        success: true,
        data: {
            depths: [
                "描述层",
                "感受层",
                "评价层",
                "分析层",
                "结论层",
                "行动层",
            ],
            perspectives: [
                {
                    id: "perspective-YYYY***-***",
                    name: "After Repair",
                },
                {
                    id: "Soft Glitch",
                    name: "Soft Glitch",
                },
                {
                    id: "Gentle Ruin ",
                    name: "Gentle Ruin",
                },
                {
                    id: "Quiet Survival ",
                    name: "Quiet Survival",
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

let ConstellateSuggestNum = 0;
export const ConstellateSuggest = (_data: any): any => {
    // return request.post("/api/constellate/suggest", data);

    ConstellateSuggestNum++;
    const data1= {
  "title": "What cannot be restored may still be revered. \nWhat do you still keep, even broken?",
  "images": [
    {
      "image_id": "img-upload-pcm26",
      "image_url": "/image_for_video/constellate1_1.png",
      "pcm_ref": "PCM-26",
      "reason": "A rough saw becomes music, turning damage into a new kind of value."
    },
    {       
        "image_id": "img-upload-pcm24",
      "image_url": "/image_for_video/constellate1_2.png",
      "pcm_ref": "PCM-24",
      "reason": "A children's book kept for its imperfect truth about an adult self."
    },
    {
      "image_id": "img-upload-pcm46",
      "image_url": "/image_for_video/constellate1_3.png",
      "pcm_ref": "PCM-46",
      "reason": "A rustic ceramic piece feels worth keeping even when its use is incomplete."
    }
  ]
}
    const data2 = {
  "title": "A missing part can open a larger horizon. \nWhat did loss allow you to see?",
  "images": [
    {
      "image_id": "img-upload-pcm31",
      "image_url": "/image_for_video/constellate2_1.png",
      "pcm_ref": "PCM-31",
      "reason": "The sea view opened a wider future and a new way of seeing life."
    },
    {
      "image_id": "img-upload-pcm48",
      "image_url": "/image_for_video/constellate2_2.png",
      "pcm_ref": "PCM-48",
      "reason": "A sculpture carries quiet force, as if absence makes its presence stronger."
    },
    {
      "image_id": "img-upload-pcm58",
      "image_url": "/image_for_video/constellate2_3.png",
      "pcm_ref": "PCM-58",
      "reason": "Venus de Milo shows how a missing part can deepen awe instead of reduce it."
    }
  ]
}

    const data3 = {
  "title": "Beauty begins where precision loosens. \nWhen did imperfection feel more alive?",
  "images": [
    {
      "image_id": "img-upload-pcm12",
        "image_url": "/image_for_video/constellate3_1.png",
      "pcm_ref": "PCM-12",
      "reason": "The wool version is not exact, but its awkwardness gives it charm."
    },
    {
      "image_id": "img-upload-pcm35",
      "image_url": "/image_for_video/constellate3_2.png",
      "pcm_ref": "PCM-35",
      "reason": "The handmade cat bag feels vivid because its shape is strange and slightly off."
    },
    {
      "image_id": "img-upload-pcm41",
      "image_url": "/image_for_video/constellate3_3.png",
      "pcm_ref": "PCM-41",
      "reason": "These odd dolls feel more alive because their details are weirdly imperfect."
    }
  ]
}
    const response = {
        success: true,
        data: ConstellateSuggestNum === 1 ? data1 : ConstellateSuggestNum === 2 ? data2 : data3,
    };

    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(response);
        }, 1000);
    });
};


export const ResonanceHint = (data: any): any => {
    console.log("ResonanceHint data:", data);
    // return request.post("/api/resonance/hint", data);

    const response = {
        success: true,
        data: {
            depths: [
                "描述层",
                "感受层",
                "评价层",
                "分析层",
                "结论层",
                "行动层",
            ],
            perspectives: [
                {
                    id: "perspective-YYYY***-***",
                    name: "Sacred Contraption",
                },
                {
                    id: "perspective-YYYY***-***",
                    name: "Resonant Scar",
                },
                {
                    id: "perspective-YYYY***-***",
                    name: "Earned Reverence",
                },
                {
                    id: "perspective-YYYY***-***",
                    name: "After Function",
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

export const ResonanceAnalysis = (_data: any): any => {
    // return request.post("/api/resonance/analysis", _data);

    const response = {
        success: true,
        data: {
    "analysis": [
        {
          "kind": "sequence",
          "level": 4,
          "keyword": "Retired Voice",
          "text": "A story could grow from an object that fails at its assigned task, then slowly learns it can move people in another way.",
          "confidence": 0.89,
          "actions": [
            {
              "kind": "whisper",
              "description": "Write one line about a life beginning after usefulness."
            },
            {
              "kind": "crop",
              "description": "Crop the detail that feels closest to a mouth or voice."
            },
            {
              "kind": "add_memory",
              "description": "Add a memory of quiet attachment to an old object."
            }
          ]
        },
        {
          "kind": "metaphor",
          "level": 4,
          "keyword": "Sacred Scrap",
          "text": "This could become a world where damaged things gather followers because their flaws make them more believable than perfect ones.",
          "confidence": 0.85,
          "actions": [
            {
              "kind": "whisper",
              "description": "Frame the group as devotion to imperfect things."
            },
            {
              "kind": "crop",
              "description": "Crop the flaw that feels most magnetic."
            },
            {
              "kind": "add_memory",
              "description": "Add a memory of being drawn to something visibly imperfect."
            }
          ]
        },
        {
          "kind": "echo",
          "level": 4,
          "keyword": "After Duty",
          "text": "The pair suggests a character who was built to serve, but becomes unforgettable only after leaving its proper function behind.",
          "confidence": 0.82,
          "actions": [
            {
              "kind": "whisper",
              "description": "Write a line about identity arriving after duty ends."
            },
            {
              "kind": "crop",
              "description": "Crop the detail that feels most like a scar or emblem."
            },
            {
              "kind": "add_memory",
              "description": "Add a memory of someone or something changed by no longer being needed."
            }
          ]}]
},
    };

    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(response);
        }, 1000);
    });
};

export const ResonanceFuse = (_data: any): any => {
    return request.post("/api/resonance/fuse", _data);

    const response = {
        success: true,
        data: {
  "id": "fuse-20260318100000000-a1b2c3d4e5",
  "type": "fuse",
  "image_url": "https://mneme-gcakhrgtedbjerhz.westus2-01.azurewebsites.net/api/images/test_user/pcm/PCM-20260316014203014-9081ad0ba7/generated/img-gen-20260316014229726-25d90aaa7f.png"
,
  "image_prompt": "A soft picture-book collage illustration blending temple cats, serene water reflections, and warm golden light into a dreamlike composite scene",
  "description": "两段记忆中的宁静氛围被融合——寺庙中猫咪的安然与水面雕塑的灵性共存，交织出一个温暖又略带神秘的拼贴画面。",
  "keywords": ["宁静", "融合", "灵性", "温暖", "拼贴"],
  "created_at": "2026-03-18T10:00:00.000Z"
},
    };

    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(response);
        }, 1000);
    });
};


export const ResonanceFuseNew = (_data: any): any => {
    // return request.post("/api/resonance/fuse_new", _data);

    const response = {
        success: true,
        data: {
  "id": "fuse-20260331100000000-a1b2c3d4e5",
  "type": "fuse_new",
  "description": "一段故事描述",
  "keywords": ["窗台暖光", "旧书走廊", "雨后小院"],
  "images": [
    {
      "index": 0,
            "image_url": "/image_for_video/fuse1_1.png",
      "image_prompt": "A soft picture-book collage illustration of a small tabby cat waking up on a sunlit windowsill..."
    },
    {
      "index": 1,
            "image_url": "/image_for_video/fuse1_2.png",
      "image_prompt": "A soft picture-book collage illustration of a narrow corridor filled with old books and dried flowers..."
    },
    {
      "index": 2,
            "image_url": "/image_for_video/fuse1_3.png",
      "image_prompt": "A soft picture-book collage illustration of a rain-washed courtyard with moss between stone tiles..."
    }
  ],
  "created_at": "2026-03-31T10:00:00.000Z"
},
    };

    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(response);
        }, 1000);
    });
};



export const cropUpdate = (data: any): any => {
    console.log("ConstellateHint data:", data);
    return request.post("/api/crop/add", data);

    const response = {
        success: true,
        data: {
            signifier_ref: "PCM-20260314055223235-372f15e117-signifier-1",
            id: "PCM-20260314055223235-372f15e117-segment-1",
            type: "segment",
            label: "宠物店小狗趴在玻璃柜",
            category: "text_image_overlap",
            source: ["author_text", "image"],
            image_url:
                "https://mneme-gcakhrgtedbjerhz.westus2-01.azurewebsites.net/api/images/test_user/pcm/PCM-20260314055223235-372f15e117/crops/crop-20260314055301895-9fc9af16f2.png",
            interpretations: {
                meaning: [
                    {
                        id: "PCM-20260314055223235-372f15e117-interp-3",
                        type: "interpretation",
                        text: "宠物陪伴",
                        kind: "meaning",
                        t: 3,
                        specificity: 4,
                        status: "user_provided",
                        source: ["author_text", "image"],
                        modality: null,
                        ai_confidence: null,
                    },
                ],
                emotion: [
                    {
                        id: "PCM-20260314055223235-372f15e117-interp-5",
                        type: "interpretation",
                        text: "怀念温暖",
                        kind: "emotion",
                        t: 3,
                        specificity: 5,
                        status: "user_provided",
                        source: ["author_text"],
                        modality: null,
                        ai_confidence: null,
                    },
                    {
                        id: "PCM-20260314055223235-372f15e117-interp-4",
                        type: "interpretation",
                        text: "放松愉悦",
                        kind: "emotion",
                        t: 0,
                        specificity: 4,
                        status: "user_provided",
                        source: ["author_text", "image"],
                        modality: null,
                        ai_confidence: null,
                    },
                ],
                sensory: [
                    {
                        id: "PCM-20260314055223235-372f15e117-interp-6",
                        type: "interpretation",
                        text: "毛软蓬松",
                        kind: "sensory",
                        t: 0,
                        specificity: 2,
                        status: "ai_recommended",
                        source: ["image"],
                        modality: "tactile",
                        ai_confidence: 2,
                    },
                ],
                aesthetic: [
                    {
                        id: "PCM-20260314055223235-372f15e117-interp-8",
                        type: "interpretation",
                        text: "温馨柔和",
                        kind: "aesthetic",
                        t: 0,
                        specificity: 3,
                        status: "ai_recommended",
                        source: ["image"],
                        modality: null,
                        ai_confidence: 3,
                    },
                    {
                        id: "PCM-20260314055223235-372f15e117-interp-9",
                        type: "interpretation",
                        text: "画面静谧",
                        kind: "aesthetic",
                        t: 3,
                        specificity: 3,
                        status: "ai_recommended",
                        source: ["image"],
                        modality: null,
                        ai_confidence: 2,
                    },
                ],
            },
            image_index: 0,
            image_width: 164,
            image_height: 247,
            layout: {
                x: -411,
                y: 0,
                w: 198,
                h: 217,
                group_ref: "PCM-20260314055223235-372f15e117-group-1",
                bubbles: [
                    {
                        interpretation_ref:
                            "PCM-20260314055223235-372f15e117-interp-3",
                        text: "宠物陪伴",
                        kind: "meaning",
                        x: -115,
                        y: 107,
                        r: 30,
                        specificity: 4,
                        id: "PCM-20260314055223235-372f15e117-bubble-3",
                        type: "bubble",
                    },
                    {
                        interpretation_ref:
                            "PCM-20260314055223235-372f15e117-interp-4",
                        text: "放松愉悦",
                        kind: "emotion",
                        x: -152,
                        y: 39,
                        r: 30,
                        specificity: 4,
                        id: "PCM-20260314055223235-372f15e117-bubble-4",
                        type: "bubble",
                    },
                    {
                        interpretation_ref:
                            "PCM-20260314055223235-372f15e117-interp-5",
                        text: "怀念温暖",
                        kind: "emotion",
                        x: -152,
                        y: -39,
                        r: 30,
                        specificity: 5,
                        id: "PCM-20260314055223235-372f15e117-bubble-5",
                        type: "bubble",
                    },
                    {
                        interpretation_ref:
                            "PCM-20260314055223235-372f15e117-interp-6",
                        text: "毛软蓬松",
                        kind: "sensory",
                        x: -115,
                        y: -107,
                        r: 30,
                        specificity: 2,
                        id: "PCM-20260314055223235-372f15e117-bubble-6",
                        type: "bubble",
                    },
                    {
                        interpretation_ref:
                            "PCM-20260314055223235-372f15e117-interp-8",
                        text: "温馨柔和",
                        kind: "aesthetic",
                        x: -50,
                        y: -149,
                        r: 30,
                        specificity: 3,
                        id: "PCM-20260314055223235-372f15e117-bubble-7",
                        type: "bubble",
                    },
                    {
                        interpretation_ref:
                            "PCM-20260314055223235-372f15e117-interp-9",
                        text: "画面静谧",
                        kind: "aesthetic",
                        x: 27,
                        y: -155,
                        r: 30,
                        specificity: 3,
                        id: "PCM-20260314055223235-372f15e117-bubble-8",
                        type: "bubble",
                    },
                ],
            },
        },
    };

    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(response);
        }, 1000);
    });
};

export const whisperUpdate = (data: any): any => {
    console.log("ConstellateHint data:", data);
    // return request.post("/api/whisper/add ", data);


    const response = {
        success: true,
        data: {
            bubbles: [
                {
                    interpretation_ref:
                        "PCM-20260314055223235-372f15e117-interp-3",
                    text: ReflectQuestionsNum == 1 ? "Not ready to \nthrow it away" : ReflectQuestionsNum == 2 ? "Caring for what \ncannot be repaired" : "A robot learns to live\n with its brokenness",
                    kind: "meaning",
                    x: ReflectQuestionsNum== 1 ? 160 : ReflectQuestionsNum== 2 ? 280 : 427,
                    y: ReflectQuestionsNum== 1 ? 50 : 0,
                    r: 30,
                    specificity: ReflectQuestionsNum == 1 ? 5 : ReflectQuestionsNum == 2 ? 3 : 1,
                    id: "PCM-20260314055223235-372f15e117-bubble-3",
                    type: "bubble",
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

export const feedbackConfirm = (data: any): any => {
    console.log("feedbackConfirm data:", data);
    // return request.post("/api/feedback/confirm", data);

    const response = {
        success: true,
        data: {
  "interpretation_id": "interp-20260319100900123-a8f3c1d2b0",
  "confirmed_id": "question-20260319100832555-a1b2c3d4e5",
  "confirmed_at": "2026-03-19T10:15:30.456Z"
},
    };

    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(response);
        }, 1000);
    });
};

export const ExportData = (formData: any, config: any = {}): any => {
    console.log("ExportData data:", formData);
    const isFormData = typeof FormData !== "undefined" && formData instanceof FormData;

    if (isFormData) {
        const entries = Array.from(formData.entries()).map(([key, value]) => {
            if (value instanceof File) {
                return {
                    key,
                    name: value.name,
                    size: value.size,
                    type: value.type,
                };
            }
            return {
                key,
                value,
            };
        });
        console.log("ExportData form entries:", entries);
    }

    const headers: Record<string, any> = {
        ...(config?.headers || {}),
    };

    if (isFormData) {
        // FormData 交给浏览器自动注入 multipart boundary，避免请求体解析失败。
        delete headers["Content-Type"];
        delete headers["content-type"];
    }

    return request.post(
        "/api/export/data",
        formData,
        {
            ...config,
            headers,
        },
    );


};
