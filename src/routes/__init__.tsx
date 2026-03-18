import { useEffect, useState } from 'react'
import { Route, Routes, Navigate } from 'react-router'
import Auth from './Auth'
import Protected from './Protected'
import RoleProtected from './RoleProtected'
import { AppShell } from '../components/layout'
import { Authstore } from '../data/Authstore'
import { authService } from '../services/authService'
import { getStoredToken } from '../api'
import { Spinner } from '../components/ui'
import Dashboard from '../pages/dashboard/Dashboard'
import ProjectList from '../pages/projects/ProjectList'
import ProjectDetail from '../pages/projects/ProjectDetail'
import TaskList from '../pages/tasks/TaskList'
import ConsultantTasksPage from '../pages/tasks/ConsultantTasksPage'
import MilestoneList from '../pages/milestones/MilestoneList'
import MilestoneTasksPage from '../pages/milestones/MilestoneTasksPage'
import CalendarPage from '../pages/calendar/CalendarPage'
import ReportsPage from '../pages/reports/ReportsPage'
import FocusPage from '../pages/focus/FocusPage'
import ConsultantsPage from '../pages/consultants/ConsultantsPage'
import InvoicesPage from '../pages/invoices/InvoicesPage'
import ProfilePage from '../pages/profile/ProfilePage'
import SettingsPage from '../pages/settings/SettingsPage'
import NotesPage from '../pages/notes/NotesPage'
import DepartmentsPage from '../pages/departments/DepartmentsPage'
import AssignedProjects from '../pages/projects/AssignedProjects'
import MarketplacePage from '../pages/marketplace/MarketplacePage'
import ProjectPostingDetailPage from '../pages/marketplace/ProjectPostingDetailPage'
import MyApplicationsPage from '../pages/marketplace/MyApplicationsPage'
import MyAssignmentsPage from '../pages/assignments/MyAssignmentsPage'
import FreelancerAnalyticsPage from '../pages/analytics/FreelancerAnalyticsPage'

const TasksPageByRole = () => {
  const user = Authstore((s) => s.user)
  if (user?.role === 'consultant') return <ConsultantTasksPage />
  return <TaskList />
}

const RootRedirect = () => {
  const user = Authstore((s) => s.user)
  const [restoring, setRestoring] = useState(!!getStoredToken() && !user)

  useEffect(() => {
    if (user || !getStoredToken()) {
      setRestoring(false)
      return
    }
    let cancelled = false
    authService.restoreSession().then(() => {
      if (!cancelled) setRestoring(false)
    })
    return () => { cancelled = true }
  }, [user])

  if (restoring) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <Spinner size="md" />
      </div>
    )
  }
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
          <Route path='assigned' Component={AssignedProjects} />
          <Route path="projects/:projectId/milestones/:milestoneId" Component={MilestoneTasksPage} />
          <Route path="projects/:id" Component={ProjectDetail} />
          <Route path="tasks" element={<TasksPageByRole />} />
          <Route path="milestones" Component={MilestoneList} />
          <Route path="calendar" Component={CalendarPage} />
          <Route path="reports" Component={ReportsPage} />
          <Route path="focus" Component={FocusPage} />
          <Route path="marketplace" Component={MarketplacePage} />
          <Route path="marketplace/:id" Component={ProjectPostingDetailPage} />
          <Route path="applications" Component={MyApplicationsPage} />
          <Route path="contracts" Component={MyAssignmentsPage} />
          <Route path="analytics" Component={FreelancerAnalyticsPage} />
          <Route element={<RoleProtected allowedRoles={['company_admin', 'super_admin']} />}>
            <Route path="consultants" Component={ConsultantsPage} />
            <Route path="invoices" Component={InvoicesPage} />
            <Route path="departments" Component={DepartmentsPage} />
          </Route>
          <Route path="profile" Component={ProfilePage} />
          <Route path="settings" Component={SettingsPage} />
          <Route path="notes" Component={NotesPage} />
        </Route>
      </Route>
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  )
}

export default __init__
