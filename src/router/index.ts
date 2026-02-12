import { createRouter, RouteRecordRaw, createWebHashHistory } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
  },
  {
    path: '/Index',
    name: 'Index',
    component: () => import('../views/Index/Index.vue'),
  },
  {
    path: "/canvas",
    name: "canvas",
    component: () => import('../views/canvas.vue'),
  },
  {
    path: "/canvas2",
    name: "canvas2",
    component: () => import('../views/canvas2.vue'),
  },
  {
    path: "/canvas3",
    name: "canvas3",
    component: () => import('../views/canvas3.vue'),
  },

  {
    path: "/FabricEditor",
    name: "FabricEditor",
    component: () => import('../views/FabricEditor.vue'),
  },
  {
    path: "/qqq",
    name: "qqq",
    component: () => import('../views/qqq.vue'),
  },


]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 前端添加密码，防止release流程未走完，外部人员访问
// router.beforeEach((to, from, next) => {
//   console.log(from)
//   if (!!to.meta && to.meta.requiresFrontEndAuth === false) {
//     //这里判断用户是否登录，验证本地存储是否有token
//     next();
//     return;
//   }
//   if (!sessionStorage.getItem("token")) { // 判断当前的token是否存在
//     next({
//       name: 'Login',
//       query: { redirect: to.fullPath }
//     })
//   } else {
//     next();
//   }
// })

// router.beforeEach((to, from, next) => {
//   const isAuthenticated = sessionStorage.getItem('token');
//   if (to.path === '/protected' && !isAuthenticated) {
//     next('/'); // 重定向到登录页面
//   } else {
//     next();
//   }
// });

export default router