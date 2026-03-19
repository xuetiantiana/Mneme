import axios from "axios";
import { createAxios } from "./axios";

//其他配置
const request = createAxios({
    baseURL: "https://mneme-gcakhrgtedbjerhz.westus2-01.azurewebsites.net",
});

export const GetPCMList = (): any => {
    return request.get(
        "https://mneme-gcakhrgtedbjerhz.westus2-01.azurewebsites.net/api/pcm/list",
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
    return request.post("/api/reflect/hint", data);

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
                    name: "过去的你",
                },
                {
                    id: "perspective-YYYY***-***",
                    name: "诗人",
                },
                {
                    id: "perspective-YYYY***-***",
                    name: "人类学家",
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

export const ReflectQuestions = (data: any): any => {
    return request.post("/api/reflect/questions", data);

    const response = {
        success: true,
        data: [
            {
                id: "question-20260313050838889-937a186605",
                text: "这段记忆中，最先浮现在你脑海里的细节是什么？",
                type: "question",
                depth: "感受层",
                perspective: {
                    id: "perspective-20260313050635727-6f33954444",
                    name: "人类学家",
                    type: "perspective",
                    short_prompt: "探寻深圳都市商场日常中的文化符号与仪式感。",
                    created_at: "2026-03-13T05:06:35.727392Z",
                },
                memory: [
                    {
                        id: "",
                        image_url:
                            "https://mneme-gcakhrgtedbjerhz.westus2-01.azurewebsites.net/api/images/data/pcm_units/PCM-20260309135530-54788a/crops/S_overlap_F1.png",
                        text: "",
                    },
                    {
                        id: "",
                        image_url:
                            "https://mneme-gcakhrgtedbjerhz.westus2-01.azurewebsites.net/api/images/data/pcm_units/PCM-20260309135530-54788a/crops/S_overlap_F1.png",
                        text: "",
                    },
                ],
            },
            {
                id: "question-20260313050838889-1c49d24668",
                text: "如果要用一种颜色来形容此刻的感受，你会选什么？",
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
                text: "这段记忆让你想起了生活中的哪个时刻？",
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
        ],
    };

    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(response);
        }, 1000);
    });
};

export const ConstellateHint = (data: any): any => {
    console.log("ConstellateHint data:", data);
    return request.post("/api/constellate/hint", data);

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
                    name: "过去的你11222",
                },
                {
                    id: "perspective-YYYY***-***",
                    name: "诗人",
                },
                {
                    id: "perspective-YYYY***-***",
                    name: "人类学家",
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

export const ConstellateSuggest = (data: any): any => {
    return request.post("/api/constellate/suggest", data);

    const response = {
        success: true,
        data: {
            title: "constellate text",
            images: [
                {
                    image_url:
                        "https://mneme-gcakhrgtedbjerhz.westus2-01.azurewebsites.net/api/images/test_user/pcm/PCM-20260314082828077-88c89eceac/uploads/20260314082828_0_dc4c1a5b26ae.png",
                    image_id: "img-crop-20260312161530-a8f3c1d2b0",
                    pcm_ref: "PCM-yyy",
                    reason: "画中白鹿被金色光芒环绕，与'包裹'的温暖感共鸣",
                },
                {
                    image_url:
                        "https://mneme-gcakhrgtedbjerhz.westus2-01.azurewebsites.net/api/images/test_user/pcm/PCM-20260314082828077-88c89eceac/uploads/20260314082828_0_dc4c1a5b26ae.png",
                    image_id: "memory-20260313050838889-937a186605",
                    type: "memory",
                    text: "这是一段记忆的文本描述，包含了丰富的细节和情感。它可能描述了一个特定的事件、场景或经历，唤起了人们内心深处的共鸣和回忆。这段文本可能充满了生动的语言和形象的描绘，让人仿佛身临其境，感受到当时的氛围和情绪。无论是快乐、悲伤、激动还是平静，这段记忆文本都承载着独特的故事和意义，成为人们心中珍贵的回忆之一。",
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


export const ResonanceHint = (data: any): any => {
    console.log("ResonanceHint data:", data);
    return request.post("/api/resonance/hint", data);

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
                    name: "过去的你",
                },
                {
                    id: "perspective-YYYY***-***",
                    name: "诗人",
                },
                {
                    id: "perspective-YYYY***-***",
                    name: "人类学家",
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
    return request.post("/api/resonance/analysis", _data);

    const response = {
        success: true,
        data: {
    "analysis": [
        {
            "id": "analysis-20260318102859808-6eb5255b0f",
            "type": "analysis",
            "kind": "similarity",
            "level": 1,
            "keyword": "温暖亲切",
            "text": "这两个记忆元素都表达了对宠物店环境的温暖亲切感，尤其是在情感和美学的微特征上高度一致，因此揭示了个人放松和慰藉的本质渴望。",
            "confidence": 0.88,
            "created_at": "2026-03-18T10:28:59.808Z",
            "actions": [
                {
                    "id": "action-20260318102859808-15126c87d4",
                    "type": "action",
                    "kind": "whisper",
                    "description": "为这组温暖亲切的元素写一段低语注释，捕捉其情感共鸣",
                    "created_at": "2026-03-18T10:28:59.808Z"
                },
                {
                    "id": "action-20260318102859808-bff8d9b560",
                    "type": "action",
                    "kind": "crop",
                    "description": "裁取图片中温暖亲切的核心画面，突出这份感受",
                    "created_at": "2026-03-18T10:28:59.808Z"
                },
                {
                    "id": "action-20260318102859808-13a88e717d",
                    "type": "action",
                    "kind": "add_memory",
                    "description": "补充一段曾在类似环境中获得温暖亲切的记忆",
                    "created_at": "2026-03-18T10:28:59.808Z"
                }
            ]
        },
        {
            "id": "analysis-20260318102859808-c42ad2fbe8",
            "type": "analysis",
            "kind": "contrast",
            "level": 2,
            "keyword": "仅剩思念",
            "text": "元素 1 的“怡然自得”和元素 2 的“仅剩思念”略显对比，尽管表面相似，却反映出个人内心存在的一丝差异状态。",
            "confidence": 0.75,
            "created_at": "2026-03-18T10:28:59.808Z",
            "actions": [
                {
                    "id": "action-20260318102859808-744065fdd7",
                    "type": "action",
                    "kind": "whisper",
                    "description": "为这组对比写一段低语注释，探讨内心差异感",
                    "created_at": "2026-03-18T10:28:59.808Z"
                },
                {
                    "id": "action-20260318102859808-10ae2c3c74",
                    "type": "action",
                    "kind": "crop",
                    "description": "裁取图片中体现微小情感差异的细节",
                    "created_at": "2026-03-18T10:28:59.808Z"
                },
                {
                    "id": "action-20260318102859808-d5cfa00b71",
                    "type": "action",
                    "kind": "add_memory",
                    "description": "补充一段感受到内心微小变化的记忆",
                    "created_at": "2026-03-18T10:28:59.808Z"
                }
            ]
        },
        {
            "id": "analysis-20260318102859808-9d45cf4f8c",
            "type": "analysis",
            "kind": "sequence",
            "level": 3,
            "keyword": "日常放松",
            "text": "这两个记忆元素反映了个体在宠物店中获得日常放松感的过程，揭示了日常环境如何引导到心灵休憩的轨迹。",
            "confidence": 0.65,
            "created_at": "2026-03-18T10:28:59.808Z",
            "actions": [
                {
                    "id": "action-20260318102859808-91455d5c3e",
                    "type": "action",
                    "kind": "whisper",
                    "description": "为这段放松过程写下低语注释，探索日常放松的微妙变化",
                    "created_at": "2026-03-18T10:28:59.808Z"
                },
                {
                    "id": "action-20260318102859808-f23c4dbc56",
                    "type": "action",
                    "kind": "crop",
                    "description": "裁取图片中展示日常放松轨迹的部分",
                    "created_at": "2026-03-18T10:28:59.808Z"
                },
                {
                    "id": "action-20260318102859808-47d990e7f7",
                    "type": "action",
                    "kind": "add_memory",
                    "description": "补充一段有关日常环境如何帮助心灵休憩的记忆",
                    "created_at": "2026-03-18T10:28:59.808Z"
                }
            ]
        }
    ]
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
    return request.post("/api/whisper/add ", data);

    const response = {
        success: true,
        data: {
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
    };

    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(response);
        }, 1000);
    });
};

export const ResonanceCompose = (data: any): any => {
    console.log("ResonanceCompose data:", data);
    // return request.post("/api/resonance/compose", data);

    const response = {
        success: true,
        data: {
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
    };

    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(response);
        }, 1000);
    });
};
