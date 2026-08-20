import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router";
import React from 'react'

const Protected = ({children}) => {
    const { loading, user } = useAuth()

    if(loading){
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
                <div style={{ fontSize: "2rem", animation: "spin 1s linear infinite" }}>⚙️</div>
                <p style={{ opacity: 0.6, margin: 0 }}>Loading...</p>
            </main>
        )
    }

    if(!user){
        return <Navigate to={'/login'} />
    }
    
    return children
}

export default Protected