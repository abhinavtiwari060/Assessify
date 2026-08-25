import React, { useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { CardSkeleton } from './components/LoadingSkeleton';

// Auth Pages (Loaded synchronously for fast entry)
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminLogin from './pages/auth/AdminLogin';
import ForgotPassword from './pages/auth/ForgotPassword';
import ChangePassword from './pages/auth/ChangePassword';

// Student Core Pages (Loaded synchronously for instant student experience)
import StudentDashboard from './pages/student/StudentDashboard';
import AvailableTests from './pages/student/AvailableTests';
import TakeMcqTest from './pages/student/TakeMcqTest';
import TakeEssayTest from './pages/student/TakeEssayTest';
import AttemptResult from './pages/student/AttemptResult';
import TestHistory from './pages/student/TestHistory';

// Lazy Loaded Pages (Code Split for optimal bundle size and speed)
const About = lazy(() => import('./pages/public/About'));
const AboutDeveloper = lazy(() => import('./pages/public/AboutDeveloper'));
const PrivacyPolicy = lazy(() => import('./pages/public/PrivacyPolicy'));

const ReportCard = lazy(() => import('./pages/student/ReportCard'));
const Leaderboard = lazy(() => import('./pages/student/Leaderboard'));
const Profile = lazy(() => import('./pages/student/Profile'));

const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'));
const MyTests = lazy(() => import('./pages/teacher/MyTests'));
const CreateMcqTest = lazy(() => import('./pages/teacher/CreateMcqTest'));
const PdfToMcq = lazy(() => import('./pages/teacher/PdfToMcq'));
const CreateEssayTest = lazy(() => import('./pages/teacher/CreateEssayTest'));
const EvaluateEssay = lazy(() => import('./pages/teacher/EvaluateEssay'));
const QuestionAnalytics = lazy(() => import('./pages/teacher/QuestionAnalytics'));
const PendingApproval = lazy(() => import('./pages/teacher/PendingApproval'));
const TeacherReports = lazy(() => import('./pages/teacher/TeacherReports'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ManageUsers = lazy(() => import('./pages/admin/ManageUsers'));
const ManageSubjects = lazy(() => import('./pages/admin/ManageSubjects'));
const ManageTests = lazy(() => import('./pages/admin/ManageTests'));
const PlatformAnalytics = lazy(() => import('./pages/admin/PlatformAnalytics'));
const PasswordResetRequests = lazy(() => import('./pages/admin/PasswordResetRequests'));
const Settings = lazy(() => import('./pages/admin/Settings'));

const ProtectedRoute = ({ children, allowedRoles, allowPending = false, allowMustChange = false }) => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return null;

  if (!isAuthenticated) {
    if (allowedRoles && allowedRoles.includes('admin')) {
      return <Navigate to="/admin/login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // Forced Password Change Protection
  if (user?.mustChangePassword && !allowMustChange) {
    return <Navigate to="/change-password" replace />;
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
    location.pathname === '/admin/login' ||
    location.pathname === '/forgot-password' ||
    location.pathname === '/change-password';
  const isTestTakingPage = location.pathname.includes('/student/test/');

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-main)] font-sans antialiased transition-colors duration-200">
      {/* Top Navbar */}
      {!isAuthPage && !isTestTakingPage && (
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      )}

      <div className="flex-1 flex relative w-full min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)]">
        {/* Fixed Left Sidebar */}
        {!isAuthPage && !isTestTakingPage && (
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}

        {/* Main Content Area */}
        <main
          className={`flex-1 min-w-0 w-full transition-all duration-200 ${
            !isAuthPage && !isTestTakingPage ? 'lg:pl-56' : ''
          }`}
        >
          <div
            className={`w-full min-w-0 ${
              isAuthPage || isTestTakingPage
                ? 'p-0'
                : 'p-3 sm:p-5 lg:p-6 max-w-7xl mx-auto'
            }`}
          >
            <Suspense fallback={<CardSkeleton />}>
              <Routes>
                {/* Default Landing Redirect */}
                <Route
                  path="/"
                  element={
                    !isAuthenticated ? (
                      <Navigate to="/login" replace />
                    ) : user?.mustChangePassword ? (
                      <Navigate to="/change-password" replace />
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
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route
                  path="/change-password"
                  element={
                    <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']} allowMustChange={true}>
                      <ChangePassword />
                    </ProtectedRoute>
                  }
                />
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
                <Route path="/leaderboard" element={<ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}><Leaderboard /></ProtectedRoute>} />
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
                <Route path="/admin/leaderboard" element={<ProtectedRoute allowedRoles={['admin']}><Leaderboard /></ProtectedRoute>} />
                <Route path="/admin/password-resets" element={<ProtectedRoute allowedRoles={['admin']}><PasswordResetRequests /></ProtectedRoute>} />
                <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><TeacherReports /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><ManageUsers /></ProtectedRoute>} />
                <Route path="/admin/subjects" element={<ProtectedRoute allowedRoles={['admin']}><ManageSubjects /></ProtectedRoute>} />
                <Route path="/admin/tests" element={<ProtectedRoute allowedRoles={['admin']}><ManageTests /></ProtectedRoute>} />
                <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><PlatformAnalytics /></ProtectedRoute>} />
                <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><Settings /></ProtectedRoute>} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
