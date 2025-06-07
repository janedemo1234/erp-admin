import { FaUsers, FaTasks, FaClock, FaCalendarCheck } from 'react-icons/fa'

function StatCard({ title, value, icon, color }) {
  return (
    <div className="card flex items-start overflow-hidden">
      <div className="flex flex-1 items-center">
        <div className={`mr-4 flex h-12 w-12 items-center justify-center rounded-lg ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  )
}

function Dashboard() {
  const stats = [
    {
      title: 'Total Employees',
      value: '25',
      icon: <FaUsers className="h-5 w-5 text-white" />,
      color: 'bg-primary-600 text-white'
    },
    {
      title: 'Active Tasks',
      value: '12',
      icon: <FaTasks className="h-5 w-5 text-white" />,
      color: 'bg-accent-600 text-white'
    },
    {
      title: 'Hours Logged',
      value: '164',
      icon: <FaClock className="h-5 w-5 text-white" />,
      color: 'bg-secondary-600 text-white'
    },
    {
      title: 'Completed Tasks',
      value: '38',
      icon: <FaCalendarCheck className="h-5 w-5 text-white" />,
      color: 'bg-success-700 text-white'
    }
  ]

  return (
    <div className="animate-fade-in">
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <div>
          <button className="btn-primary">Generate Report</button>
        </div>
      </div>

      <div className="mb-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h2>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((_, i) => (
              <div key={i} className="flex items-center border-b border-gray-200 pb-3 last:border-0 dark:border-gray-700">
                <div className="mr-3 h-8 w-8 flex-shrink-0 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Task updated by user
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
            View all activity
          </button>
        </div>

        <div className="card">
          <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Upcoming Tasks</h2>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((_, i) => (
              <div key={i} className="flex items-center border-b border-gray-200 pb-3 last:border-0 dark:border-gray-700">
                <div className={`mr-3 h-2 w-2 flex-shrink-0 rounded-full ${
                  i % 3 === 0 ? 'bg-error-500' : i % 3 === 1 ? 'bg-warning-500' : 'bg-success-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {i % 3 === 0 ? 'High' : i % 3 === 1 ? 'Medium' : 'Low'} priority task
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Due in {i + 1} days</p>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
            View all tasks
          </button>
        </div>
      </div>
      
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Employee Performance</h2>
          <div>
            <select className="rounded-md border-gray-300 bg-white py-1 pl-3 pr-8 text-sm font-medium text-gray-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
              <option>This Month</option>
              <option>Last Month</option>
              <option>This Quarter</option>
              <option>This Year</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-4">
          {[
            { name: 'John Doe', role: 'Developer', progress: 75 },
            { name: 'Jane Smith', role: 'Designer', progress: 82 },
            { name: 'Robert Johnson', role: 'Manager', progress: 90 },
            { name: 'Emily Davis', role: 'Marketing', progress: 68 },
          ].map((employee, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{employee.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{employee.role}</p>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{employee.progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div 
                  className={`h-2 rounded-full ${
                    employee.progress >= 80 ? 'bg-success-500' : 
                    employee.progress >= 70 ? 'bg-accent-500' : 'bg-warning-500'
                  }`}
                  style={{ width: `${employee.progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard