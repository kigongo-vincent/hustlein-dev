import { Route, Routes, Navigate } from 'react-router'
import Auth from './Auth'
import Protected from './Protected'
import { AppShell } from '../components/layout'
import Dashboard from '../pages/dashboard/Dashboard'
import ProjectList from '../pages/projects/ProjectList'
import ProjectDetail from '../pages/projects/ProjectDetail'
import TaskList from '../pages/tasks/TaskList'
import MilestoneList from '../pages/milestones/MilestoneList'
import CalendarPage from '../pages/calendar/CalendarPage'
import ReportsPage from '../pages/reports/ReportsPage'
import FocusPage from '../pages/focus/FocusPage'

const __init__ = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth" replace />} />
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
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  )
}

export default __init__
