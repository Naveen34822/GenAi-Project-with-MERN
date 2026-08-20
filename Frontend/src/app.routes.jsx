import { createBrowserRouter } from "react-router"
import Login from "./features/auth/pages/Login"
import Register from "./features/auth/pages/Register"
import OAuthCallback from "./features/auth/pages/OAuthCallback"
import Protected from "./features/auth/components/Protected"
import Home from "./features/interview/pages/Home"
import Interview from "./features/interview/pages/Interview"

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/register",
    element: <Register />
  },
  {
    path: "/oauth/callback",
    element: <OAuthCallback />
  },
  {
    path: "/",
    element: <Protected><Home /></Protected>
  },
  {
    path: "/interview/:interviewId",
    element: <Protected><Interview /></Protected>
  }
])