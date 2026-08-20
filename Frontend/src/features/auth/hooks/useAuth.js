import { useContext } from "react"
import { AuthContext } from "../auth.context"
import { login, register, logout } from "../services/auth.api"

export const useAuth = () => {
  const context = useContext(AuthContext)
  const { user, setUser, loading, setLoading } = context

  const handleLogin = async ({ email, password }) => {
    setLoading(true)
    try {
      const data = await login({ email, password })
      localStorage.setItem("hasSession", "true")
      localStorage.setItem("token", data.token)
      setUser(data.user)
    } catch (err) {
      console.error("Login error:", err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async ({ username, email, password }) => {
    setLoading(true)
    try {
      const data = await register({ username, email, password })
      localStorage.setItem("hasSession", "true")
      localStorage.setItem("token", data.token)
      setUser(data.user)
    } catch (err) {
      console.error("Register error:", err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setLoading(true)
    try {
      await logout()
      localStorage.removeItem("hasSession")
      localStorage.removeItem("token")
      setUser(null)
    } catch (err) {
      console.error("Logout error:", err)
      localStorage.removeItem("hasSession")
      localStorage.removeItem("token")
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  return { user, loading, handleRegister, handleLogin, handleLogout, setUser, setLoading }
}