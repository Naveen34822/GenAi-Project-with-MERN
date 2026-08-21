import { RouterProvider } from "react-router"
import { router } from "./app.routes.jsx"
import { AuthProvider } from "./features/auth/auth.context.jsx"
import { Toaster } from "react-hot-toast"

function App() {

  return (
    <AuthProvider>
        <RouterProvider router={router} />
        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'rgba(20, 24, 35, 0.9)',
              color: '#e6edf3',
              border: '1px solid rgba(165, 180, 252, 0.2)',
              backdropFilter: 'blur(10px)',
            },
            success: {
              iconTheme: {
                primary: '#a5b4fc',
                secondary: 'rgba(20, 24, 35, 0.9)',
              },
            },
          }}
        />
    </AuthProvider>
  )
}

export default App