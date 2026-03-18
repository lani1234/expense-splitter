import axios from "axios"

const client = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
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
