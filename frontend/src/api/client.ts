import axios from "axios"
import { getAccessToken } from "@/lib/auth"

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  headers: { "Content-Type": "application/json" },
})

client.interceptors.request.use(async (config) => {
  const token = await getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Unwrap ApiResponse<T> — throw if success=false
client.interceptors.response.use(
  (response) => {
    const body = response.data
    if (body && typeof body === "object" && "success" in body) {
      if (!body.success) {
        throw new Error(body.message ?? "Request failed")
      }
      return { ...response, data: body.data }
    }
    return response
  },
  (error) => {
    const msg =
      error.response?.data?.message ?? error.message ?? "Network error"
    throw new Error(msg)
  }
)

export default client
