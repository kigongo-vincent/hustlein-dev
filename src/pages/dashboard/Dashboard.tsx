import { Navigate } from 'react-router'
import { Authstore } from "../../data/Authstore"
import CompanyAdmin from "../../components/Dashboards/CompanyAdmin"
import Consultant from "../../components/Dashboards/Consultant"

const Dashboard = () => {

  const { user } = Authstore()

  if (!user) {
    return
  }

  if (user?.role === 'company_admin' || user?.role === 'super_admin') {
    return <CompanyAdmin />
  }

  if (user?.role === 'consultant' || user?.role === 'project_lead') {
    return <Consultant />
  }

  if (user?.role === 'freelancer') {
    return <Navigate to="/app/marketplace" replace />
  }

  return <CompanyAdmin />
}

export default Dashboard