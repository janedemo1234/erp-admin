import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import userData from '../data/userData'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const login = useCallback(async (username, password) => {
    setLoading(true)
    setError(null)
    
    try {
      // Simulate API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Always authenticate successfully with any credentials
      const defaultUser = userData.users[0]
      
      const userInfo = {
        id: defaultUser.id,
        username: username || defaultUser.username,
        name: defaultUser.name,
        email: defaultUser.email
      }
      
      setUser(userInfo)
      setIsAuthenticated(true)
      // Store in localStorage for session persistence
      localStorage.setItem('user', JSON.stringify(userInfo))
      localStorage.setItem('isAuthenticated', 'true')
      return true
    } catch (err) {
      setError('Login failed. Please try again.')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('user')
    localStorage.removeItem('isAuthenticated')
  }, [])

  const checkAuth = useCallback(() => {
    const savedUser = localStorage.getItem('user')
    const savedAuth = localStorage.getItem('isAuthenticated')
    
    if (savedUser && savedAuth === 'true') {
      setUser(JSON.parse(savedUser))
      setIsAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const value = {
    user,
    isAuthenticated,
    error,
    loading,
    login,
    logout,
    checkAuth
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  return useContext(AuthContext)
}