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
      <section class="upload-card">
        <h2>Upload file</h2>
        <p class="helper-text">Maximum size 50MB. Supported for any file type.</p>

        <input ref="fileInput" type="file" @change="handleFileSelect" />

        <div v-if="selectedFile" class="selected-file">
          <strong>{{ selectedFile.name }}</strong>
          <span>{{ formatSize(selectedFile.size) }}</span>
        </div>

        <div v-if="uploadProgress > 0" class="progress">
          <div class="progress-fill" :style="{ width: `${uploadProgress}%` }" />
          <span class="progress-label">{{ uploadProgress }}%</span>
        </div>

        <div v-if="uploadError" class="error">{{ uploadError }}</div>

        <button
          class="primary-btn"
          :disabled="!selectedFile || isUploading"
          @click="handleUpload"
        >
          {{ isUploading ? 'Uploading...' : 'Upload' }}
        </button>
      </section>

      <section class="files-card">
        <header class="section-header">
          <div>
            <h2>Your files</h2>
            <p class="helper-text">
              {{ total }} file{{ total === 1 ? '' : 's' }} stored
            </p>
          </div>

          <div class="controls">
            <label>
              Sort by
              <select v-model="sortBy">
                <option value="upload_timestamp">Upload time</option>
                <option value="filename">Filename</option>
                <option value="size">Size</option>
              </select>
            </label>
            <label>
              Order
              <select v-model="order">
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </label>
          </div>
        </header>

        <div v-if="tableError" class="error">{{ tableError }}</div>
        <div v-else-if="isListLoading" class="empty-state">Loading files...</div>
        <div v-else-if="!files.length" class="empty-state">
          No files yet. Upload your first file above.
        </div>
        <div v-else class="file-table">
          <div v-for="file in files" :key="file.id" class="file-row">
            <div class="file-info">
              <div class="thumbnail">
                <img
                  v-if="isImage(file.filename)"
                  :src="file.url"
                  :alt="file.filename"
                />
                <span v-else>{{ file.filename[0]?.toUpperCase() }}</span>
              </div>
              <div>
                <p class="filename">{{ file.filename }}</p>
                <p class="meta">
                  {{ formatSize(file.size) }} • {{ formatDate(file.upload_timestamp) }}
                </p>
              </div>
            </div>

            <div class="actions">
              <button @click="handleDownload(file)">Download</button>
              <button @click="handleRename(file)">Rename</button>
              <button class="danger" @click="handleDelete(file)">Delete</button>
            </div>
          </div>
        </div>

        <div v-if="totalPages > 1" class="pagination">
          <button :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">
            Prev
          </button>
          <span>Page {{ currentPage }} / {{ totalPages }}</span>
          <button :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">
            Next
          </button>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { extractError } from '../utils/errorUtils'
import {
  deleteFile,
  downloadFile,
  getFiles,
  updateFilename,
  uploadFile,
} from '../api/fileService'
import type { FileResponse, Order, SortBy } from '../types/api'

const MAX_FILE_SIZE = 50 * 1024 * 1024

const router = useRouter()
const authStore = useAuthStore()

const files = ref<FileResponse[]>([])
const total = ref(0)
const limit = ref(3)
const offset = ref(0)
const sortBy = ref<SortBy>('upload_timestamp')
const order = ref<Order>('desc')
const isListLoading = ref(false)
const tableError = ref('')

const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const uploadError = ref('')
const uploadProgress = ref(0)
const isUploading = ref(false)

const currentPage = computed(() => Math.floor(offset.value / limit.value) + 1)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit.value)))

watch([sortBy, order], () => {
  offset.value = 0
  fetchFiles()
})

onMounted(() => {
  fetchFiles()
})

async function fetchFiles() {
  tableError.value = ''
  isListLoading.value = true
  try {
    const response = await getFiles({
      limit: limit.value,
      offset: offset.value,
      sort_by: sortBy.value,
      order: order.value,
    })

    files.value = response.file_list
    total.value = response.total
  } catch (err) {
    tableError.value = extractError(err)
  } finally {
    isListLoading.value = false
  }
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  uploadError.value = ''
  uploadProgress.value = 0

  if (!file) {
    selectedFile.value = null
    return
  }

  if (file.size > MAX_FILE_SIZE) {
    uploadError.value = 'File exceeds 50MB limit.'
    selectedFile.value = null
    input.value = ''
    return
  }

  selectedFile.value = file
}

async function handleUpload() {
  if (!selectedFile.value) return

  uploadError.value = ''
  isUploading.value = true
  uploadProgress.value = 0

  try {
    await uploadFile(selectedFile.value, (percent) => {
      uploadProgress.value = percent
    })
    selectedFile.value = null
    if (fileInput.value) {
      fileInput.value.value = ''
    }
    await fetchFiles()
  } catch (err) {
    uploadError.value = extractError(err)
  } finally {
    isUploading.value = false
    uploadProgress.value = 0
  }
}

async function handleDownload(file: FileResponse) {
  tableError.value = ''
  try {
    const { blob, filename } = await downloadFile(file.id)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename ?? file.filename
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    tableError.value = extractError(err)
  }
}

async function handleRename(file: FileResponse) {
  const newName = window.prompt('Enter new filename', file.filename)
  if (!newName || newName.trim() === '' || newName === file.filename) return

  tableError.value = ''
  try {
    await updateFilename(file.id, newName.trim())
    await fetchFiles()
  } catch (err) {
    tableError.value = extractError(err)
  }
}

async function handleDelete(file: FileResponse) {
  const confirmed = window.confirm(`Delete "${file.filename}"?`)
  if (!confirmed) return

  tableError.value = ''
  try {
    await deleteFile(file.id)
    await fetchFiles()
  } catch (err) {
    tableError.value = extractError(err)
  }
}

function goToPage(page: number) {
  if (page < 1 || page > totalPages.value) return
  offset.value = (page - 1) * limit.value
  fetchFiles()
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, index)
  return `${value.toFixed(1)} ${units[index]}`
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleString()
}

function isImage(filename: string): boolean {
  const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp']
  return extensions.some((ext) => filename.toLowerCase().endsWith(ext))
}

async function handleLogout() {
  tableError.value = '' // Clear previous errors
  try {
    await authStore.logout()
    router.push('/login')
  } catch (err) {
    tableError.value = extractError(err)
    // Even if logout API fails, we still clear local storage and redirect for UX consistency
    // The user will see an error message but will be logged out locally.
    router.push('/login')
  }
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
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.upload-card,
.files-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.helper-text {
  color: #777;
  font-size: 0.9rem;
  margin: 0.25rem 0 1rem;
}

.selected-file {
  display: flex;
  justify-content: space-between;
  margin: 0.75rem 0;
  color: #444;
}

.progress {
  position: relative;
  background: #eee;
  border-radius: 4px;
  height: 12px;
  margin: 0.75rem 0;
}

.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 4px;
}

.progress-label {
  display: block;
  text-align: right;
  font-size: 0.85rem;
  color: #555;
  margin-bottom: 0.5rem;
}

.primary-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  background: #667eea;
  color: white;
  cursor: pointer;
  font-weight: 600;
}

.primary-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.files-card h2 {
  margin: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
  flex-wrap: wrap;
}

.controls {
  display: flex;
  gap: 1rem;
}

.controls label {
  font-size: 0.85rem;
  color: #555;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.controls select {
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.file-table {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.file-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
}

.file-info {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.thumbnail {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: #f0f0f0;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  font-weight: 600;
  color: #555;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.filename {
  margin: 0;
  font-weight: 600;
}

.meta {
  margin: 0.25rem 0 0;
  color: #777;
  font-size: 0.85rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.actions button {
  padding: 0.4rem 0.75rem;
  border-radius: 4px;
  border: 1px solid #ccc;
  background: white;
  cursor: pointer;
  font-size: 0.85rem;
}

.actions button:hover {
  background: #f2f2f2;
}

.actions .danger {
  border-color: #f5a3a3;
  color: #c0392b;
}

.actions .danger:hover {
  background: #fdecec;
}

.pagination {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.pagination button {
  padding: 0.5rem 1rem;
  border: none;
  background: #667eea;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}

.pagination button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.empty-state {
  text-align: center;
  padding: 2rem 0;
  color: #777;
}

.error {
  background: #fdecea;
  border: 1px solid #f5c2c0;
  color: #a33a32;
  padding: 0.75rem;
  border-radius: 6px;
  margin: 0.75rem 0;
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .controls {
    width: 100%;
    flex-direction: column;
  }

  .file-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .actions {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>
