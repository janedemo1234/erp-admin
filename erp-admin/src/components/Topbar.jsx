import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FaBell, FaUser, FaSignOutAlt, FaCog } from 'react-icons/fa'

function Topbar() {
  const { user, logout } = useAuth()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileMenuRef = useRef(null)
  
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu)
  }

  const handleLogout = () => {
    setShowProfileMenu(false)
    logout()
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-10 h-16 bg-white shadow ml-64">
      <div className="flex h-full items-center justify-end px-6">
        <div className="flex items-center">
          <button
            className="relative mr-3 rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Notifications"
          >
            <FaBell className="h-5 w-5" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></span>
          </button>

          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              className="flex items-center rounded-full text-sm focus:outline-none"
              onClick={toggleProfileMenu}
              aria-expanded={showProfileMenu}
              aria-haspopup="true"
            >
              <span className="sr-only">Open user menu</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600 ring-2 ring-white">
                <span className="font-medium">
                  {user?.name?.first?.[0]}{user?.name?.last?.[0]}
                </span>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="border-b border-gray-200 px-4 py-2">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.name?.first} {user?.name?.last}
                  </p>
                  <p className="truncate text-xs text-gray-500">{user?.email}</p>
                </div>
                
                <Link
                  to="/user-info"
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <FaUser className="mr-2 h-4 w-4" />
                  Profile
                </Link>
                
                <Link
                  to="/settings"
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <FaCog className="mr-2 h-4 w-4" />
                  Settings
                </Link>
                
                <button
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={handleLogout}
                >
                  <FaSignOutAlt className="mr-2 h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Topbar