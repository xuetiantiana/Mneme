<template>
  <div class="toolbar-container">
    <div
      v-for="(item, index) in toolbarItems"
      :key="index"
      class="toolbar-item"
      :class="{ active: activeItem === index }"
      @click="handleItemClick(index)"
      :title="item.title"
    >
      <div class="icon">
        <SvgIcon class="compare-hide-icon" :name="item.icon"></SvgIcon>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

// 定义事件
const emit = defineEmits(["item-click"]);

// 响应式数据
const activeItem = ref(null);

// 工具栏项目
const toolbarItems = [
  {
    title: "添加",
    icon: "icon1",
  },
  {
    title: "时间",
    icon: "icon2",
  },
  {
    title: "分享",
    icon: "icon3",
  },
  {
    title: "网络",
    icon: "icon4",
  },
  {
    title: "知识库",
    icon: "icon5",
  },
];

// 方法
const handleItemClick = (index) => {
  activeItem.value = activeItem.value === index ? null : index;
  emit("item-click", {
    index,
    item: toolbarItems[index],
  });
};
</script>

<script>
export default {
  components: {
    AddIcon: {
      template: `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="#333" stroke-width="2"/>
          <path d="M12 8V16" stroke="#333" stroke-width="2" stroke-linecap="round"/>
          <path d="M8 12H16" stroke="#333" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `,
    },
    ClockIcon: {
      template: `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="#333" stroke-width="2"/>
          <path d="M12 6V12L16 14" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 2V4" stroke="#333" stroke-width="2" stroke-linecap="round"/>
          <path d="M12 20V22" stroke="#333" stroke-width="2" stroke-linecap="round"/>
          <path d="M4 12H2" stroke="#333" stroke-width="2" stroke-linecap="round"/>
          <path d="M22 12H20" stroke="#333" stroke-width="2" stroke-linecap="round"/>
          <path d="M17.6569 6.34315L16.95 5.63608" stroke="#333" stroke-width="2" stroke-linecap="round"/>
          <path d="M7.05005 18.3639L7.75699 17.6569" stroke="#333" stroke-width="2" stroke-linecap="round"/>
          <path d="M17.6569 17.6569L16.95 18.3639" stroke="#333" stroke-width="2" stroke-linecap="round"/>
          <path d="M7.05005 5.63608L7.75699 6.34315" stroke="#333" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `,
    },
    ShareIcon: {
      template: `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="18" cy="5" r="3" stroke="#333" stroke-width="2"/>
          <circle cx="6" cy="12" r="3" stroke="#333" stroke-width="2"/>
          <circle cx="18" cy="19" r="3" stroke="#333" stroke-width="2"/>
          <path d="M8.59 13.51L15.42 17.49" stroke="#333" stroke-width="2" stroke-linecap="round"/>
          <path d="M15.41 6.51L8.59 10.49" stroke="#333" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `,
    },
    NetworkIcon: {
      template: `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="2" stroke="#333" stroke-width="2"/>
          <circle cx="6" cy="6" r="2" stroke="#333" stroke-width="2"/>
          <circle cx="18" cy="6" r="2" stroke="#333" stroke-width="2"/>
          <circle cx="6" cy="18" r="2" stroke="#333" stroke-width="2"/>
          <circle cx="18" cy="18" r="2" stroke="#333" stroke-width="2"/>
          <path d="M12 14V16" stroke="#333" stroke-width="2" stroke-linecap="round"/>
          <path d="M12 8V10" stroke="#333" stroke-width="2" stroke-linecap="round"/>
          <path d="M14 12H16" stroke="#333" stroke-width="2" stroke-linecap="round"/>
          <path d="M8 12H10" stroke="#333" stroke-width="2" stroke-linecap="round"/>
          <path d="M8.41421 8.41421L9.82843 9.82843" stroke="#333" stroke-width="2" stroke-linecap="round"/>
          <path d="M14.1716 9.82843L15.5858 8.41421" stroke="#333" stroke-width="2" stroke-linecap="round"/>
          <path d="M8.41421 15.5858L9.82843 14.1716" stroke="#333" stroke-width="2" stroke-linecap="round"/>
          <path d="M14.1716 14.1716L15.5858 15.5858" stroke="#333" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `,
    },
    BookIcon: {
      template: `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" stroke="#333" stroke-width="2" stroke-linecap="round"/>
          <path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z" stroke="#333" stroke-width="2"/>
          <path d="M10 9H14" stroke="#333" stroke-width="2" stroke-linecap="round"/>
          <path d="M10 13H14" stroke="#333" stroke-width="2" stroke-linecap="round"/>
          <path d="M10 17H12" stroke="#333" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `,
    },
  },
};
</script>

<style scoped>
.toolbar-container {
  display: flex;
  align-items: center;
  gap: 24px;
  background-color: #ffffff;
  border-radius: 12px;
  padding: 16px 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  max-width: 500px;
  margin: 0 auto;
}

.toolbar-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  max-width: 48px;
}

.toolbar-item:hover {
  background-color: #f5f5f5;
  transform: translateY(-1px);
}

.toolbar-item.active {
  background-color: #e3f2fd;
  box-shadow: 0 2px 4px rgba(33, 150, 243, 0.2);
}

.toolbar-item.active .icon {
  color: #2196f3;
}

.icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666666;
  transition: color 0.2s;
}

.icon svg {
  width: 24px;
  height: 24px;
}

@media (max-width: 480px) {
  .toolbar-container {
    gap: 16px;
    padding: 12px 16px;
  }

  .toolbar-item {
    max-width: 40px;
  }

  .icon {
    width: 20px;
    height: 20px;
  }

  .icon svg {
    width: 20px;
    height: 20px;
  }
}
</style>