import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import PageTransition from './components/PageTransition';
import AdminLayout from './components/AdminLayout';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoutes';

import Home from './pages/Home';
import About from './pages/About';
import EventBrowse from './pages/EventBrowse';
import EventDetail from './pages/EventDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import UserDashboard from './pages/UserDashboard';
import ProfilePage from './pages/ProfilePage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminOverview from './pages/AdminOverview';
import AdminEvents from './pages/AdminEvents';
import AdminCreateEvent from './pages/AdminCreateEvent';
import AdminEditEvent from './pages/AdminEditEvent';
import AdminRegistrations from './pages/AdminRegistrations';
import AdminGatePage from './pages/AdminGatePage';
import AdminStaff from './pages/AdminStaff';

export default function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="flex flex-col w-full" style={{ minHeight: '100vh', backgroundColor: 'var(--color-black)', color: 'var(--text-primary)' }}>
      <ScrollToTop />
      
      {/* Render Public Navbar ONLY on Public Routes */}
      {!isAdminRoute && <Navbar />}

      <main className="flex-1 w-full">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Public Brand & Auth Routes */}
            <Route path="/" element={<PageTransition><Home /></PageTransition>} />
            <Route path="/about" element={<PageTransition><About /></PageTransition>} />
            <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
            <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
            <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
            <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
            <Route path="/admin/login" element={<PageTransition><AdminLoginPage /></PageTransition>} />

            {/* Protected Participant Event Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/events" element={<PageTransition><EventBrowse /></PageTransition>} />
              <Route path="/events/:slug" element={<PageTransition><EventDetail /></PageTransition>} />
              <Route path="/dashboard" element={<PageTransition><UserDashboard /></PageTransition>} />
              <Route path="/profile" element={<PageTransition><ProfilePage /></PageTransition>} />
            </Route>

            {/* Standalone Protected Admin Console Layout & Routes */}
            <Route element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<PageTransition><AdminOverview /></PageTransition>} />
                <Route path="/admin/events" element={<PageTransition><AdminEvents /></PageTransition>} />
                <Route path="/admin/events/new" element={<PageTransition><AdminCreateEvent /></PageTransition>} />
                <Route path="/admin/events/edit/:id" element={<PageTransition><AdminEditEvent /></PageTransition>} />
                <Route path="/admin/registrations" element={<PageTransition><AdminRegistrations /></PageTransition>} />
                <Route path="/admin/gate" element={<PageTransition><AdminGatePage /></PageTransition>} />
                <Route path="/admin/staff" element={<PageTransition><AdminStaff /></PageTransition>} />
              </Route>
            </Route>

            {/* Fallback Catch-all Route */}
            <Route path="*" element={<PageTransition><Home /></PageTransition>} />
          </Routes>
        </AnimatePresence>
      </main>

      {/* Render Public Footer ONLY on Public Routes */}
      {!isAdminRoute && <Footer />}
    </div>
  );
}
