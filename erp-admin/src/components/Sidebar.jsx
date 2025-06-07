import { useAuth } from '../context/AuthContext'
import { NavLink } from 'react-router-dom'
import { 
  FaUser, 
  FaTachometerAlt, 
  FaUsersCog, 
  FaClipboardList, 
  FaCalendarAlt, 
  FaTools, 
  FaCog
} from 'react-icons/fa'

function SidebarLink({ to, icon, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `
        group mb-1 flex items-center rounded-md px-3 py-2 font-medium transition-colors 
        ${isActive 
          ? 'bg-primary-100 text-primary-800' 
          : 'text-gray-700 hover:bg-gray-100'}
      `}
    >
      <div className="mr-3 text-lg">{icon}</div>
      <span className="truncate">{children}</span>
    </NavLink>
  )
}

function Sidebar() {
  const { user } = useAuth()

  const sidebarClass = `
    relative w-64 flex flex-col overflow-y-auto bg-white pb-4 pt-5
  `

  return (
    <aside className={sidebarClass}>
      <div className="flex items-center px-4">
        <div className="flex items-center">
          <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-md bg-primary-600 text-white">
            <span className="text-lg font-bold">E</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">ERP System</h1>
        </div>
      </div>

      <div className="mt-4 border-t border-gray-200 pt-4">
        <div className="px-4 pb-4">
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="flex items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                <span className="text-lg font-semibold">
                  {user?.name?.first?.[0]}{user?.name?.last?.[0]}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name?.first} {user?.name?.last}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        <nav className="space-y-1 px-3">
          <p className="mb-2 px-3 text-xs font-semibold uppercase text-gray-500">
            Main
          </p>
          <SidebarLink to="/admin/dashboard" icon={<FaTachometerAlt />}>
            Dashboard
          </SidebarLink>
          <SidebarLink to="/admin/user-info" icon={<FaUser />}>
            Add Employee
          </SidebarLink>
          <SidebarLink to="/admin/employees" icon={<FaUsersCog />}>
            Employee Register
          </SidebarLink>
          
          <p className="mb-2 mt-6 px-3 text-xs font-semibold uppercase text-gray-500">
            Management
          </p>
          <SidebarLink to="/admin/tasks" icon={<FaClipboardList />}>
            Tasks
          </SidebarLink>
          <SidebarLink to="/admin/calendar" icon={<FaCalendarAlt />}>
            Calendar
          </SidebarLink>
          
          <p className="mb-2 mt-6 px-3 text-xs font-semibold uppercase text-gray-500">
            System
          </p>
          <SidebarLink to="/admin/resources" icon={<FaTools />}>
            Resources
          </SidebarLink>
          <SidebarLink to="/admin/settings" icon={<FaCog />}>
            Settings
          </SidebarLink>
        </nav>
      </div>
    </aside>
  )
}

export default Sidebar