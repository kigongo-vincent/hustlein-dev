import { useEffect } from "react"
import InitRouter from "./routes/__init__"
import { ToastContainer } from "react-toastify"
import { Authstore } from "./data/Authstore"

const App = () => {
  useEffect(() => {
    const onLogout = () => Authstore.getState().logout()
    window.addEventListener('auth:logout', onLogout)
    return () => window.removeEventListener('auth:logout', onLogout)
  }, [])

  return (
    <>
      <InitRouter />
      <ToastContainer theme="light" />
    </>
  )
}

export default App