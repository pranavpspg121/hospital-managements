import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Shared Pages
import Login from './pages/shared/Login';
import Register from './pages/shared/Register';
import Profile from './pages/shared/Profile';
import Unauthorized from './pages/shared/Unauthorized';
import NotFound from './pages/shared/NotFound';
import Home from './pages/shared/Home';
import Careers from './pages/shared/Careers';
import About from './pages/shared/About';
import Departments from './pages/shared/Departments';
import Services from './pages/shared/Services';
import Doctors from './pages/shared/Doctors';
import Contact from './pages/shared/Contact';

// Patient Pages
import PatientDashboard from './pages/patient/PatientDashboard';
import BookAppointment from './pages/patient/BookAppointment';
import PatientAppointments from './pages/patient/PatientAppointments';
import PatientReports from './pages/patient/PatientReports';

// Doctor Pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import ManageSlots from './pages/doctor/ManageSlots';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import DepartmentManagement from './pages/admin/DepartmentManagement';
import DoctorManagement from './pages/admin/DoctorManagement';
import PatientManagement from './pages/admin/PatientManagement';
import AppointmentManagement from './pages/admin/AppointmentManagement';
import BillingManagement from './pages/admin/BillingManagement';
import ReportManagement from './pages/admin/ReportManagement';
import AuditLogs from './pages/admin/AuditLogs';
import SettingsManagement from './pages/admin/SettingsManagement';
import JobApplications from './pages/admin/JobApplications';
import ContactMessages from './pages/admin/ContactMessages';

// Receptionist Pages
import ReceptionDashboard from './pages/reception/ReceptionDashboard';

// Root Redirection Component based on User Role
const HomeRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user.role === 'DOCTOR') return <Navigate to="/doctor" replace />;
  if (user.role === 'RECEPTIONIST') return <Navigate to="/reception" replace />;
  return <Navigate to="/patient" replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/about" element={<About />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/services" element={<Services />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/contact" element={<Contact />} />

          {/* Protected Routes Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<HomeRedirect />} />
              <Route path="/profile" element={<Profile />} />

              {/* Patient Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={['PATIENT']} />}>
                <Route path="/patient" element={<PatientDashboard />} />
                <Route path="/patient/book" element={<BookAppointment />} />
                <Route path="/patient/appointments" element={<PatientAppointments />} />
                <Route path="/patient/reports" element={<PatientReports />} />
              </Route>

              {/* Doctor Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={['DOCTOR']} />}>
                <Route path="/doctor" element={<DoctorDashboard />} />
                <Route path="/doctor/slots" element={<ManageSlots />} />
              </Route>

              {/* Admin Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/departments" element={<DepartmentManagement />} />
                <Route path="/admin/doctors" element={<DoctorManagement />} />
                <Route path="/admin/patients" element={<PatientManagement />} />
                <Route path="/admin/appointments" element={<AppointmentManagement />} />
                <Route path="/admin/billing" element={<BillingManagement />} />
                <Route path="/admin/reports" element={<ReportManagement />} />
                <Route path="/admin/audit-logs" element={<AuditLogs />} />
                <Route path="/admin/settings" element={<SettingsManagement />} />
                <Route path="/admin/careers" element={<JobApplications />} />
                <Route path="/admin/contact-messages" element={<ContactMessages />} />
              </Route>

              {/* Receptionist Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN']} />}>
                <Route path="/reception" element={<ReceptionDashboard />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
