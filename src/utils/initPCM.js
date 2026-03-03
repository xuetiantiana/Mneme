import Konva from 'konva'
import { createTextNode } from './canvasPositionUtils'

const getImageProxyUrl = (url) => {
  return url.replace("http://localhost:8000/api/images/data", "/data/PCM2");
};

export const initMainImages = (data) => {
    console.log("!!!",data)
  return new Promise((resolve, reject) => {
    if (!data) {
      reject(new Error('data is required'))
      return
    }

    const { mainImages, layout } = data

    try {
      if (mainImages && Array.isArray(mainImages) && mainImages.length > 0) {
        let loadedCount = 0
        const totalImages = mainImages.length
        const nodes = []

        mainImages.forEach((imgData, index) => {
          const x = imgData.layout.x || 0
          const y = imgData.layout.y || 0
          const w = imgData.layout.w || 200
          const h = imgData.layout.h || 200
          const rotation = imgData.layout.rotation || 0
          const z_index = imgData.layout.z_index || index + 1
          const url = getImageProxyUrl(imgData.image_url || '')

          const imgObj = new Image()
          imgObj.crossOrigin = 'anonymous'
          imgObj.onerror = (error) => {
            console.error('Image load error:', error)
            loadedCount++
            if (loadedCount === totalImages) {
              resolve(nodes)
            }
          }
          imgObj.onload = () => {
            try {
              const ratio = imgObj.height / imgObj.width
              const calculatedHeight = w * ratio

              const konvaImage = new Konva.Image({
                image: imgObj,
                x,
                y,
                width: w,
                height: calculatedHeight,
                rotation,
                draggable: true,
                id: `main_image_${index}`,
                zIndex: z_index
              })

              nodes.push(konvaImage)

              loadedCount++
              if (loadedCount === totalImages) {
                resolve(nodes)
              }
            } catch (error) {
              console.error('Failed to create Konva image:', error)
              loadedCount++
              if (loadedCount === totalImages) {
                resolve(nodes)
              }
            }
          }
          imgObj.src = url
        })
      } else {
        resolve([])
      }
    } catch (error) {
      reject(error)
    }
  })
}

export const initSegmentsImages = (data) => {
  return new Promise((resolve, reject) => {
    if (!data) {
      reject(new Error('data is required'))
      return
    }

    const { segments, layout } = data

    try {
      if (segments && Array.isArray(segments) && segments.length > 0) {
        let loadedCount = 0
        let totalImages = 0

        segments.forEach(segment => {
          if (segment.image_url) {
            totalImages++
          }
        })

        if (totalImages === 0) {
          resolve([])
          return
        }

        const nodes = []
        const bubblePromises = []

        segments.forEach((segment, index) => {
          if (!segment.image_url) {
            return
          }

          const layoutData = segments[index].layout || {}
          const x = layoutData.x || 0
          const y = layoutData.y || 0
          const w = layoutData.w || 150
          const h = layoutData.h || 150
          const rotation = layoutData.rotation || 0
          const z_index = layoutData.z_index || index + 1

          const imgObj = new Image()
          imgObj.crossOrigin = 'anonymous'
          imgObj.onerror = (error) => {
            console.error('Segment image load error:', error)
            loadedCount++
            if (loadedCount === totalImages) {
              Promise.all(bubblePromises).then(bubbleNodesArrays => {
                const allBubbleNodes = bubbleNodesArrays.flat()
                resolve([...nodes, ...allBubbleNodes])
              }).catch(() => {
                resolve(nodes)
              })
            }
          }
          imgObj.onload = () => {
            try {
              const ratio = imgObj.height / imgObj.width
              const calculatedHeight = w * ratio

              const konvaImage = new Konva.Image({
                image: imgObj,
                x,
                y,
                width: w,
                height: calculatedHeight,
                rotation,
                draggable: true,
                id: `segment_image_${segment.seg_id}`,
                zIndex: z_index
              })

              nodes.push(konvaImage)

              loadedCount++
              if (loadedCount === totalImages) {
                Promise.all(bubblePromises).then(bubbleNodesArrays => {
                  const allBubbleNodes = bubbleNodesArrays.flat()
                  resolve([...nodes, ...allBubbleNodes])
                }).catch(() => {
                  resolve(nodes)
                })
              }
            } catch (error) {
              console.error('Failed to create segment Konva image:', error)
              loadedCount++
              if (loadedCount === totalImages) {
                Promise.all(bubblePromises).then(bubbleNodesArrays => {
                  const allBubbleNodes = bubbleNodesArrays.flat()
                  resolve([...nodes, ...allBubbleNodes])
                }).catch(() => {
                  resolve(nodes)
                })
              }
            }
          }
          imgObj.src = getImageProxyUrl(segment.image_url)

          if (segment.bubbles && Array.isArray(segment.bubbles)) {
            bubblePromises.push(initPCMBubbles(segment.bubbles))
          }
        })
      } else {
        resolve([])
      }
    } catch (error) {
      reject(error)
    }
  })
}


export const initPCMBubbles = (bubbles) => {
  return new Promise((resolve, reject) => {
    if (!bubbles || !Array.isArray(bubbles)) {
      resolve([])
      return
    }

    try {
      const nodes = []
      let completedCount = 0
      const totalBubbles = bubbles.length

      bubbles.forEach((bubble, bubbleIndex) => {
        const x = bubble.x || 0
        const y = bubble.y || 0
        const radius = bubble.radius || 50
        const fill = bubble.fill || 'rgba(255, 255, 255, 0.9)'
        const stroke = bubble.stroke || '#333'
        const strokeWidth = bubble.strokeWidth || 2
        const z_index = bubble.z_index || bubbleIndex + 1

        // const konvaCircle = new Konva.Circle({
        //   x,
        //   y,
        //   radius,
        //   fill,
        //   stroke,
        //   strokeWidth,
        //   draggable: true,
        //   id: `bubble_${bubbleIndex}`,
        //   zIndex: z_index
        // })

        // nodes.push(konvaCircle)

        if (bubble.text) {
          createTextNode({ text: bubble.text, id: `bubble_text_${bubbleIndex}` }, {
            startX: x,
            startY: y,
            fontSize: bubble.fontSize || 14,
            fontFamily: bubble.fontFamily || 'Arial',
            fill: bubble.textColor || '#333',
            backgroundColor: bubble.textBackgroundColor,
            padding: bubble.textPadding || 5,
            cornerRadius: bubble.textCornerRadius || 4,
            center: false,
            backgroundColor: bubble.color,
          }).then((textNode) => {
            nodes.push(textNode)
            completedCount++
            if (completedCount === totalBubbles) {
              resolve(nodes)
            }
          }).catch((error) => {
            console.error('Failed to create bubble text:', error)
            completedCount++
            if (completedCount === totalBubbles) {
              resolve(nodes)
            }
          })
        } else {
          completedCount++
          if (completedCount === totalBubbles) {
            resolve(nodes)
          }
        }
      })
    } catch (error) {
      reject(error)
    }
  })
}
