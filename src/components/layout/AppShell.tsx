import { Outlet } from 'react-router'
import View from '../base/View'
import Sidebar from './Sidebar'
import Header from './Header'

const AppShell = () => {
  return (
    <View bg="bg" className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </View>
  )
}

export default AppShell
