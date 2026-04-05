import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useState, useCallback } from 'react'
import LoginPage      from './pages/LoginPage'
import HomePage       from './pages/HomePage'
import ReportPage     from './pages/ReportPage'
import AdminDashboard from './pages/AdminDashboard'
import CrowdMonitor   from './pages/CrowdMonitor'

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" />
}

export default function App() {
  const [notifications, setNotifications] = useState([])
  const [openReportId,  setOpenReportId]  = useState(null)

  const addNotification = useCallback((type, title, message, reportId = null) => {
    setNotifications(prev => [{
      id: Date.now() + Math.random(),
      type, title, message, reportId,
      time: new Date(),
      read: false,
    }, ...prev].slice(0, 30))
  }, [])

  const clearNotifications = () => setNotifications([])

  const notifProps = { notifications, onClearNotifications: clearNotifications, onOpenReport: setOpenReportId }

  return (
    <BrowserRouter>
      <Toaster position="top-right"
        toastOptions={{ style: { background: '#111827', color: '#f1f5f9', border: '1px solid #1f2937' } }} />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={
          <PrivateRoute>
            <HomePage {...notifProps} addNotification={addNotification} openReportId={openReportId} setOpenReportId={setOpenReportId} />
          </PrivateRoute>
        } />
        <Route path="/report" element={
          <PrivateRoute>
            <ReportPage addNotification={addNotification} />
          </PrivateRoute>
        } />
        <Route path="/crowd" element={
          <PrivateRoute>
            <CrowdMonitor {...notifProps} />
          </PrivateRoute>
        } />
        <Route path="/admin" element={
          <PrivateRoute>
            <AdminDashboard {...notifProps} addNotification={addNotification} openReportId={openReportId} setOpenReportId={setOpenReportId} />
          </PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}