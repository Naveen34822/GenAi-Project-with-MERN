import { useEffect, useRef } from "react"
import { useNavigate } from "react-router"
import { useAuth } from "../hooks/useAuth"
import { getMe } from "../services/auth.api"

const OAuthCallback = () => {
  const navigate = useNavigate()
  const { setUser, setLoading } = useAuth()

  // Prevents React StrictMode double-execution.
  // useRef value survives StrictMode's simulated unmount/remount cycle.
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return   // skip StrictMode second run
    hasRun.current = true

    const params = new URLSearchParams(window.location.search)
    const token = params.get("token")
    const error = params.get("error")

    const handleCallback = async () => {
      if (!error && token) {
        try {
          // Store token so axios interceptor picks it up for getMe()
          localStorage.setItem("token", token)
          localStorage.setItem("hasSession", "true")

          // Fetch user and set in global context
          const data = await getMe()
          setUser(data.user)

          // Navigate directly — no page reload, no flicker
          navigate("/", { replace: true })
        } catch (err) {
          console.error("OAuth callback error:", err)
          localStorage.removeItem("token")
          localStorage.removeItem("hasSession")
          navigate("/login", { replace: true })
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
        navigate("/login", { replace: true })
      }
    }

    handleCallback()
  }, [navigate, setUser, setLoading])

  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: "1rem",
      background: "#0d1117",
      color: "#e6edf3"
    }}>
      <div style={{ fontSize: "2rem" }}>🔐</div>
      <p style={{ opacity: 0.6, margin: 0 }}>Signing you in with Google...</p>
    </main>
  )
}

export default OAuthCallback
