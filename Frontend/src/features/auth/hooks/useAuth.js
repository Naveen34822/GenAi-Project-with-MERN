import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context";
import { login, logout, register, getMe } from "../services/auth.api"
export const useAuth = () => {
    const context = useContext(AuthContext)
    const { user, setUser, loading, setLoading } = context

    const handleLogin = async ({ email, password }) => {
        setLoading(true)
        try {
            const data = await login({ email, password })
            setUser(data.user)
        }
        catch (err) {

        }
        finally {
            setLoading(false)
        }
    }

    const handleRegister = async ({ username, email, password }) => {
        setLoading(true)
        try {
            const data = await register({ username, email, password })
            setUser(data.user)
        }
        catch {

        }
        finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        setLoading(true)
        try {
            const data = await logout()
            setUser(null)
        }
        catch {

        }
        finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const getAndSetUser = async () => {
            try {
                const data = await getMe();
                setUser(data.user);
                setLoading(false);
            } catch (error) {
                console.log(error);
                setLoading(false);
            }
        }
        getAndSetUser();
    }, [])

    return { user, loading, handleLogin, handleRegister, handleLogout }

}