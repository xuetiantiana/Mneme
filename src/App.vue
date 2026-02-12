<template>
  <div id="app" class="app-container">
    
     <router-view v-slot="{ Component }">
          <keep-alive>
            <component
              :is="Component"
              :key="$route.name"
              v-if="$route.meta.keepAlive"
            />
          </keep-alive>
          <component
            :is="Component"
            :key="$route.name"
            v-if="!$route.meta.keepAlive"
          />
        </router-view>
  </div>
</template>
<script setup lang="ts">
import { provide, nextTick, ref } from "vue";


</script>

<style scoped lang="scss">
#app {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
  position: relative;
}
</style>
