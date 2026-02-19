import { Route, Routes, Navigate } from 'react-router'
import Auth from './Auth'
import Protected from './Protected'
import { AppShell } from '../components/layout'
import { Authstore } from '../data/Authstore'
import Dashboard from '../pages/dashboard/Dashboard'
import ProjectList from '../pages/projects/ProjectList'
import ProjectDetail from '../pages/projects/ProjectDetail'
import TaskList from '../pages/tasks/TaskList'
import MilestoneList from '../pages/milestones/MilestoneList'
import CalendarPage from '../pages/calendar/CalendarPage'
import ReportsPage from '../pages/reports/ReportsPage'
import FocusPage from '../pages/focus/FocusPage'
import ConsultantsPage from '../pages/consultants/ConsultantsPage'
import ProfilePage from '../pages/profile/ProfilePage'
import SettingsPage from '../pages/settings/SettingsPage'

const RootRedirect = () => {
  const user = Authstore((s) => s.user)
  return <Navigate to={user ? '/app' : '/auth'} replace />
}

const __init__ = () => {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/auth/*" Component={Auth} />
      <Route path="/app" element={<Protected />}>
        <Route element={<AppShell />}>
          <Route index Component={Dashboard} />
          <Route path="projects" Component={ProjectList} />
          <Route path="projects/:id" Component={ProjectDetail} />
          <Route path="tasks" Component={TaskList} />
          <Route path="milestones" Component={MilestoneList} />
          <Route path="calendar" Component={CalendarPage} />
          <Route path="reports" Component={ReportsPage} />
          <Route path="focus" Component={FocusPage} />
          <Route path="consultants" Component={ConsultantsPage} />
          <Route path="profile" Component={ProfilePage} />
          <Route path="settings" Component={SettingsPage} />
        </Route>
      </Route>
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  )
}

export default __init__
