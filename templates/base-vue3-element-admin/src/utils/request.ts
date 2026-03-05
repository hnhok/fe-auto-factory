import axios from 'axios'
import { ElMessage } from 'element-plus'

const service = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 5000
})

service.interceptors.request.use(
    (config) => {
        // Add token here if needed
        // const token = useUserStore().token
        // if (token) config.headers.Authorization = `Bearer ${token}`

        // Handle dynamic base url for different environments when proxy is not used
        if (import.meta.env.VITE_APP_ENV !== 'development' && import.meta.env.VITE_API_BASE_URL) {
            config.baseURL = import.meta.env.VITE_API_BASE_URL
        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

service.interceptors.response.use(
    (response) => {
        return response.data
    },
    (error) => {
        ElMessage.error(error.message || 'Request Error')
        return Promise.reject(error)
    }
)

export default service
