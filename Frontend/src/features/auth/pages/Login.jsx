import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'

const BACKEND_URL = import.meta.env.DEV ? "http://localhost:5050" : "https://genai-project-with-mern.onrender.com"

const Login = () => {
    const { loading, handleLogin } = useAuth()
    const navigate = useNavigate()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        try {
            await handleLogin({ email, password })
            navigate('/')
        } catch (err) {
            setError(err.response?.data?.message || "Login failed. Please try again.")
        }
    }

    const handleGoogleLogin = () => {
        window.location.href = `${BACKEND_URL}/api/auth/google`
    }

    if (loading) {
        return (
            <main className="auth-page">
                <div className="form-container" style={{ textAlign: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '2rem' }}>🔐</span>
                    <p style={{ color: 'rgba(240,244,255,0.5)' }}>Loading...</p>
                </div>
            </main>
        )
    }

    return (
        <main className="auth-page">
            <div className="form-container">

                <div className="form-header">
                    <span className="form-logo">🤖</span>
                    <h1>Welcome Back</h1>
                    <p>Sign in to continue your AI interview prep journey</p>
                </div>

                {error && <p className="auth-error">{error}</p>}

                {/* Google Sign In */}
                <button
                    id="google-login-btn"
                    className="google-button"
                    onClick={handleGoogleLogin}
                    type="button"
                >
                    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                </button>

                <div className="divider"><span>or</span></div>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email" id="email" name="email"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password" id="password" name="password"
                            placeholder="••••••••"
                        />
                    </div>
                    <button type="submit" className="button primary-button" style={{ width: '100%', marginTop: '0.25rem' }}>
                        Sign In
                    </button>
                </form>

                <div className="form-footer">
                    Don't have an account? <Link to="/register">Create one free</Link>
                </div>
            </div>
        </main>
    )
}

export default Login