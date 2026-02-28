import axios from 'axios'
import { showNotify } from 'vant'
import 'vant/es/notify/style'

const service = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 5000
})

service.interceptors.request.use(
    (config) => {
        // Add token here if needed
        // const token = useUserStore().token
        // if (token) config.headers.Authorization = `Bearer ${token}`
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
        showNotify({ type: 'danger', message: error.message || 'Request Error' })
        return Promise.reject(error)
    }
)

export default service
