import { Outlet } from 'react-router'
import View from '../base/View'
import Sidebar from './Sidebar'
import Header from './Header'

const AppShell = () => {
  return (
    <View bg="bg" className="h-screen flex overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <Header/>
        <main className="flex-1 px-4 py-2 overflow-auto min-h-0">
          <Outlet />
        </main>
      </div>
    </View>
  )
}

export default AppShell
