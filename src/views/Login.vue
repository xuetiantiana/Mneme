<template>
  <div class="login-page">
    <div class="login-card">
      <h2>Welcome</h2>
      <p>请输入 user_id 和 session_id 后继续</p>

      <el-form @submit.prevent>
        <el-form-item label="user_id">
          <el-input v-model="form.user_id" placeholder="请输入 user_id" clearable />
        </el-form-item>
        <el-form-item label="session_id">
          <el-input v-model="form.session_id" placeholder="请输入 session_id" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            进入系统
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { useStoryStore } from "@/stores/storyStore";

const router = useRouter();
const route = useRoute();
const storyStore = useStoryStore();

const form = reactive({
  user_id: "",
  session_id: "",
});

const submitting = ref(false);

const handleSubmit = async () => {
  const userId = (form.user_id || "").trim();
  const sessionId = (form.session_id || "").trim();

  if (!userId || !sessionId) {
    ElMessage({
      message: "请填写完整的 user_id 和 session_id",
      type: "warning",
    });
    return;
  }

  submitting.value = true;
  try {
    storyStore.setUserId(userId);
    storyStore.setSessionId(sessionId);

    const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/";
    await router.replace(redirect);
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.login-page {
  width: 100%;
  height: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eef4ff 0%, #f7fbff 45%, #e8f5f2 100%);
}

.login-card {
  width: 420px;
  max-width: calc(100% - 32px);
  background: #ffffff;
  border-radius: 14px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(20, 35, 80, 0.12);
  border: 1px solid #edf1f7;
}

.login-card h2 {
  margin: 0;
  font-size: 24px;
  color: #1f2d3d;
}

.login-card p {
  margin: 8px 0 20px;
  color: #5c6b7a;
  font-size: 14px;
}
</style>
