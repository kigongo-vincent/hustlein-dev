import { useEffect } from "react"
import InitRouter from "./routes/__init__"
import { ToastContainer } from "react-toastify"
import { Authstore } from "./data/Authstore"
import { Themestore, applyThemeToDocument } from "./data/Themestore"

const ThemeDocumentSync = () => {
  const current = Themestore((s) => s.current)
  const mode = Themestore((s) => s.mode)
  useEffect(() => {
    applyThemeToDocument(current, mode)
  }, [current, mode])
  return null
}

const App = () => {
  useEffect(() => {
    const onLogout = () => Authstore.getState().logout()
    window.addEventListener('auth:logout', onLogout)
    return () => window.removeEventListener('auth:logout', onLogout)
  }, [])

  return (
    <>
      <ThemeDocumentSync />
      <InitRouter />
      <ToastContainer theme="light" />
    </>
  )
}

export default App