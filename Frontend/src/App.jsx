import { RouterProvider } from "react-router-dom"
import { router } from "./app.routes.jsx"

function App() {
  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}

export default App