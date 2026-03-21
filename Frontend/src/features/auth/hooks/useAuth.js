import { useContext, useEffect } from "react"
import { AuthContext } from "../auth.context"
import { login, register, logout, getMe } from "../services/auth.api"

export const useAuth = () => {
  const context = useContext(AuthContext)
  const { user, setUser, loading, setLoading } = context

  const handleLogin = async ({ email, password }) => {
    setLoading(true)
    try {
      const data = await login({ email, password })
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
      setUser(null)
    } catch (err) {
      console.error("Logout error:", err)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const getAndSetUser = async () => {
      try {
        const data = await getMe()
        setUser(data.user)
      } catch (err) {
        if (err.response?.status === 401) {
          setUser(null)
        } else {
          console.error("getMe error:", err)
          setUser(null)
        }
      } finally {
        setLoading(false)
      }
    }
    getAndSetUser()
  }, [])

  return { user, loading, handleRegister, handleLogin, handleLogout }
}