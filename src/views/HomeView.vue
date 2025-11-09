<template>
  <div class="home">
    <header>
      <h1>File Management System</h1>
      <div class="user-info">
        <span>Welcome, {{ authStore.username }}!</span>
        <button @click="handleLogout" class="logout-btn">Logout</button>
      </div>
    </header>

    <main>
      <p>File management features coming soon...</p>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: #f5f5f5;
}

header {
  background: white;
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

h1 {
  font-size: 1.5rem;
  color: #333;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logout-btn {
  padding: 0.5rem 1rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.logout-btn:hover {
  background: #c82333;
}

main {
  padding: 2rem;
}
</style>
