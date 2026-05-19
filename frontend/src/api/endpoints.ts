import api from './axios'

// Upload Excel file and get predictions
export const uploadFile = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/upload/', formData)
}

// Get all previous batches
export const getBatches = () => api.get('/batches/')

// Get single batch details
export const getBatchDetail = (id: number) => api.get(`/batches/${id}/`)

// Get model metrics
export const getMetrics = () => api.get('/metrics/')

// Download report URL
export const getDownloadUrl = (id: number) =>
  `http://127.0.0.1:8000/api/batches/${id}/download/`

// Download template URL
export const getTemplateUrl = () =>
  `http://127.0.0.1:8000/api/template/`


export const getExplanation = (batchId: number, rowIndex: number) =>
  api.get(`/explain/${batchId}/${rowIndex}/`)