/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from "react";
import { getMe } from "./services/auth.api";


export const AuthContext = createContext()


export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // Fetch user on app startup (runs only once)
    useEffect(() => {
        const getAndSetUser = async () => {
            // Skip on OAuth callback page — OAuthCallback handles auth itself
            if (window.location.pathname === '/oauth/callback') {
                setLoading(false)
                return
            }

            const token = localStorage.getItem("token")

            if (!token) {
                setUser(null)
                setLoading(false)
                return
            }
            try {
                const data = await getMe()
                setUser(data.user)
            } catch {
                setUser(null)
                localStorage.removeItem("hasSession")
                localStorage.removeItem("token")
            } finally {
                setLoading(false)
            }
        }
        getAndSetUser()
    }, [])

    return (
        <AuthContext.Provider value={{ user, setUser, loading, setLoading }} >
            {children}
        </AuthContext.Provider>
    )
}