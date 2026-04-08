const MOCK_GALLERY_GROUP = {
  "group_id": "gallery-group-20260403023242400-243a4fa3d6",
  "title": "Group Title",
  "items": [
    {
      "id": "PCM-20260319110940449-3cfa2dde94",
      "type": "pcm_unit",
      "created_at": "2026-03-19T11:11:43.961035",
      "unit_summary": "broken orchid at home ",
      "context": {
        "time_anchor": "之前",
        "place_anchor": "西安"
      },
      "user_input": {
        "images": [
          "/image_for_video/PCM1.png"
        ],
        "text": "这个猫是之前在西安的时候拍的我觉得他很佛系",
        "time_place": null,
        "received_at": "2026-03-19T11:09:40.449788"
      },
      "upload_images": [
        {
          "image_id": "img-upload-20260319110940460-0f5c19c2b4",
          "image_url": "https://mneme-gcakhrgtedbjerhz.westus2-01.azurewebsites.net/api/images/test_user/pcm/PCM-20260319110940449-3cfa2dde94/uploads/img-upload-20260319110940460-0f5c19c2b4.png",
          "index": 0,
          "width": 730,
          "height": 805
        }
      ],
      "segments": [
        {
          "signifier_ref": "signifier-20260319111143960-d1ac9a537f",
          "id": "segment-20260319111143960-158abd45f9",
          "type": "segment",
          "parent_ref": "PCM-20260319110940449-3cfa2dde94",
          "label": "broken orchid at home ",
          "category": "text_image_overlap",
          "source": [
            "author_text",
            "image"
          ],
          "image_id": "img-crop-20260319111143706-032f3840c8",
          "image_url": "/image_for_video/PCM1.png",
          "interpretations": {
            "meaning": [
              {
                "id": "interp-20260319111143960-310a041f73",
                "type": "interpretation",
                "parent_ref": "signifier-20260319111143960-d1ac9a537f",
                "text": "snaped",
                "kind": "meaning",
                "t": 0,
                "specificity": 5,
                "status": "user_provided",
                "source": [
                  "author_text",
                  "image"
                ],
                "modality": null,
                "ai_confidence": null
              }
            ],
            "emotion": [
              {
                "id": "interp-20260319111143960-f49a06bfff",
                "type": "interpretation",
                "parent_ref": "signifier-20260319111143960-d1ac9a537f",
                "text": "relax",
                "kind": "emotion",
                "t": 0,
                "specificity": 5,
                "status": "user_provided",
                "source": [
                  "author_text",
                  "image"
                ],
                "modality": null,
                "ai_confidence": null
              },
            ],
            "sensory": [
              {
                "id": "interp-20260319111143960-8597e7363f",
                "type": "interpretation",
                "parent_ref": "signifier-20260319111143960-d1ac9a537f",
                "text": "water glass",
                "kind": "sensory",
                "t": 0,
                "specificity": 5,
                "status": "ai_recommended",
                "source": [
                  "author_text",
                  "image"
                ],
                "modality": "tactile",
                "ai_confidence": 2
              }
            ],
            "aesthetic": [
              {
                "id": "interp-20260319111143960-dc4c58cf67",
                "type": "interpretation",
                "parent_ref": "signifier-20260319111143960-d1ac9a537f",
                "text": "home still life",
                "kind": "aesthetic",
                "t": 3,
                "specificity": 5,
                "status": "ai_recommended",
                "source": [
                  "image"
                ],
                "modality": null,
                "ai_confidence": 3
              },
              {
                "id": "interp-20260319111143960-9d0e6c8575",
                "type": "interpretation",
                "parent_ref": "signifier-20260319111143960-d1ac9a537f",
                "text": "broken elegance",
                "kind": "aesthetic",
                "t": 0,
                "specificity": 5,
                "status": "ai_recommended",
                "source": [
                  "image"
                ],
                "modality": null,
                "ai_confidence": 3
              }
            ]
          },
          "image_index": 0,
          "image_width": 470,
          "image_height": 487,
          "layout": {
            "x": 255,
            "y": -442,
            "w": 192,
            "h": 217,
            "group_ref": "group-20260319111156919-6102ee437c",
            "bubbles": [
              {
                "interpretation_ref": "interp-20260319111143960-310a041f73",
                "text": "snaped",
                "kind": "meaning",
                "x": 149,
                "y": 0,
                "r": 30,
                "specificity": 5,
                "id": "bubble-20260319111156930-c2cfe8b1b6",
                "type": "bubble",
                "parent_ref": "segment-20260319111143960-158abd45f9"
              },
              {
                "interpretation_ref": "interp-20260319111143960-f49a06bfff",
                "text": "relax",
                "kind": "emotion",
                "x": 0,
                "y": -130,
                "r": 30,
                "specificity": 5,
                "id": "bubble-20260319111156930-84bd7a4048",
                "type": "bubble",
                "parent_ref": "segment-20260319111143960-158abd45f9"
              },
              
              {
                "interpretation_ref": "interp-20260319111143960-8597e7363f",
                "text": "water glass",
                "kind": "sensory",
                "x": -155,
                "y": 0,
                "r": 30,
                "specificity": 5,
                "id": "bubble-20260319111156930-395868c5ea",
                "type": "bubble",
                "parent_ref": "segment-20260319111143960-158abd45f9"
              },
              {
                "interpretation_ref": "interp-20260319111143960-9d0e6c8575",
                "text": "broken elegance",
                "kind": "aesthetic",
                "x": 0,
                "y": 190,
                "r": 30,
                "specificity": 5,
                "id": "bubble-20260319111156931-d8a6f94252",
                "type": "bubble",
                "parent_ref": "segment-20260319111143960-158abd45f9"
              },
              {
                "interpretation_ref": "interp-20260319111143960-dc4c58cf67",
                "text": "home still life",
                "kind": "aesthetic",
                "x": 0,
                "y": 155,
                "r": 30,
                "specificity": 5,
                "id": "bubble-20260319111156931-2cbb437056",
                "type": "bubble",
                "parent_ref": "segment-20260319111143960-158abd45f9"
              }
            ]
          }
        }
       
       
      ],
      "layout": {
        "canvas": {
          "w": 2202,
          "h": 1376
        },
        "main_cluster": {
          "cx": 0,
          "cy": 0,
          "label": "一只佛系的猫，拍于西安。",
          "images": [
            {
              "index": 0,
              "x": 0,
              "y": 0,
              "w": 317,
              "h": 350,
              "rotation": 0,
              "z_index": 1
            }
          ]
        },
        
        "origin": {
          "x": 0,
          "y": 0
        },
        "bubble_coords": "relative",
        "planning_elapsed_ms": 12975.33
      }
    },
  ]
}

export const createMockGalleryGroup = () => {
  return JSON.parse(JSON.stringify(MOCK_GALLERY_GROUP));
};
