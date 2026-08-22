import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminLogin from './pages/auth/AdminLogin';

// Public Informational Pages
import About from './pages/public/About';
import AboutDeveloper from './pages/public/AboutDeveloper';
import PrivacyPolicy from './pages/public/PrivacyPolicy';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import AvailableTests from './pages/student/AvailableTests';
import TakeMcqTest from './pages/student/TakeMcqTest';
import TakeEssayTest from './pages/student/TakeEssayTest';
import AttemptResult from './pages/student/AttemptResult';
import TestHistory from './pages/student/TestHistory';
import ReportCard from './pages/student/ReportCard';
import Leaderboard from './pages/student/Leaderboard';
import Profile from './pages/student/Profile';

// Teacher Pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import MyTests from './pages/teacher/MyTests';
import CreateMcqTest from './pages/teacher/CreateMcqTest';
import PdfToMcq from './pages/teacher/PdfToMcq';
import CreateEssayTest from './pages/teacher/CreateEssayTest';
import EvaluateEssay from './pages/teacher/EvaluateEssay';
import QuestionAnalytics from './pages/teacher/QuestionAnalytics';
import PendingApproval from './pages/teacher/PendingApproval';
import TeacherReports from './pages/teacher/TeacherReports';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageSubjects from './pages/admin/ManageSubjects';
import ManageTests from './pages/admin/ManageTests';
import PlatformAnalytics from './pages/admin/PlatformAnalytics';
import Settings from './pages/admin/Settings';

const ProtectedRoute = ({ children, allowedRoles, allowPending = false }) => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return null;

  if (!isAuthenticated) {
    if (allowedRoles && allowedRoles.includes('admin')) {
      return <Navigate to="/admin/login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    if (allowedRoles.includes('admin')) {
      return <Navigate to="/admin/login" replace />;
    }
    if (user?.role === 'student') return <Navigate to="/student/dashboard" replace />;
    if (user?.role === 'teacher') {
      return user?.isApproved === false ? (
        <Navigate to="/teacher/pending-approval" replace />
      ) : (
        <Navigate to="/teacher/dashboard" replace />
      );
    }
    if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  }

  // Teacher Approval Protection
  if (user?.role === 'teacher' && user?.isApproved === false && !allowPending) {
    return <Navigate to="/teacher/pending-approval" replace />;
  }

  // Approved teacher visiting pending page -> redirect to dashboard
  if (user?.role === 'teacher' && user?.isApproved !== false && allowPending) {
    return <Navigate to="/teacher/dashboard" replace />;
  }

  return children;
};

const App = () => {
  const { isAuthenticated, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/admin/login';
  const isTestTakingPage = location.pathname.includes('/student/test/');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors">
      {/* Top Navbar */}
      {!isAuthPage && !isTestTakingPage && (
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      )}

      <div className="flex-1 flex">
        {/* Compact Sidebar */}
        {!isAuthPage && !isTestTakingPage && (
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}

        {/* Main Content Area */}
        <main
          className={`flex-1 p-3 sm:p-5 max-w-7xl mx-auto w-full ${
            isAuthPage || isTestTakingPage ? 'p-0 sm:p-0 max-w-none' : ''
          }`}
        >
          <Routes>
            {/* Default Landing Redirect */}
            <Route
              path="/"
              element={
                !isAuthenticated ? (
                  <Navigate to="/login" replace />
                ) : user?.role === 'student' ? (
                  <Navigate to="/student/dashboard" replace />
                ) : user?.role === 'teacher' ? (
                  user?.isApproved === false ? (
                    <Navigate to="/teacher/pending-approval" replace />
                  ) : (
                    <Navigate to="/teacher/dashboard" replace />
                  )
                ) : (
                  <Navigate to="/admin/dashboard" replace />
                )
              }
            />

            {/* Public Pages */}
            <Route path="/about" element={<About />} />
            <Route path="/about-developer" element={<AboutDeveloper />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/admin/login"
              element={
                isAuthenticated && user?.role === 'admin' ? (
                  <Navigate to="/admin/dashboard" replace />
                ) : (
                  <AdminLogin />
                )
              }
            />

            {/* Student Routes */}
            <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/available-tests" element={<ProtectedRoute allowedRoles={['student']}><AvailableTests /></ProtectedRoute>} />
            <Route path="/student/test/mcq/:id" element={<ProtectedRoute allowedRoles={['student']}><TakeMcqTest /></ProtectedRoute>} />
            <Route path="/student/test/essay/:id" element={<ProtectedRoute allowedRoles={['student']}><TakeEssayTest /></ProtectedRoute>} />
            <Route path="/student/attempt/:id/result" element={<ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}><AttemptResult /></ProtectedRoute>} />
            <Route path="/student/history" element={<ProtectedRoute allowedRoles={['student']}><TestHistory /></ProtectedRoute>} />
            <Route path="/student/report-card" element={<ProtectedRoute allowedRoles={['student']}><ReportCard /></ProtectedRoute>} />
            <Route path="/student/leaderboard" element={<ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}><Leaderboard /></ProtectedRoute>} />
            <Route path="/student/profile" element={<ProtectedRoute allowedRoles={['student']}><Profile /></ProtectedRoute>} />

            {/* Teacher Routes */}
            <Route path="/teacher/pending-approval" element={<ProtectedRoute allowedRoles={['teacher']} allowPending={true}><PendingApproval /></ProtectedRoute>} />
            <Route path="/teacher/dashboard" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/teacher/tests" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><MyTests /></ProtectedRoute>} />
            <Route path="/teacher/reports" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><TeacherReports /></ProtectedRoute>} />
            <Route path="/teacher/create-test" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><CreateMcqTest /></ProtectedRoute>} />
            <Route path="/teacher/edit-test/:id" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><CreateMcqTest isEditMode={true} /></ProtectedRoute>} />
            <Route path="/teacher/pdf-mcq" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><PdfToMcq /></ProtectedRoute>} />
            <Route path="/teacher/create-essay" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><CreateEssayTest /></ProtectedRoute>} />
            <Route path="/teacher/essays/evaluations" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><EvaluateEssay /></ProtectedRoute>} />
            <Route path="/teacher/analytics" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><QuestionAnalytics /></ProtectedRoute>} />
            <Route path="/teacher/profile" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><Profile /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><TeacherReports /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><ManageUsers /></ProtectedRoute>} />
            <Route path="/admin/subjects" element={<ProtectedRoute allowedRoles={['admin']}><ManageSubjects /></ProtectedRoute>} />
            <Route path="/admin/tests" element={<ProtectedRoute allowedRoles={['admin']}><ManageTests /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><PlatformAnalytics /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><Settings /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;
