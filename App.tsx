
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import SignUp from './components/SignUp';
import Dashboard from './components/Dashboard';
import Agenda from './components/Agenda';
import PatientList from './components/PatientList';
import MedicalConsultation from './components/MedicalConsultation';
import Surgeries from './components/Surgeries';
import NewSurgery from './components/NewSurgery';
import PatientDetail from './components/PatientDetail';
import NewPatient from './components/NewPatient';
import NewAppointment from './components/NewAppointment';
import Reschedule from './components/Reschedule';
import ManagementTables from './components/ManagementTables';
import { AuthProvider, useAuth } from './components/AuthContext';

import PendingApproval from './components/PendingApproval';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading, user } = useAuth();
  // Check if we are already on the pending page to avoid loop
  const isPendingPage = window.location.hash.includes('pending-approval');

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
      <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
    </div>;
  }

  if (!session) {
    return <Navigate to="/" />;
  }

  // Check approval status
  // Allow access if approved is true OR undefined (for legacy/admin users)
  // Block only if explicitly false
  if (user?.user_metadata?.approved === false && !isPendingPage) {
    return <Navigate to="/pending-approval" />;
  }

  // If user is approved but tries to access pending page, redirect to dashboard
  if (user?.user_metadata?.approved !== false && isPendingPage) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

// Route for Login that redirects to dashboard if already logged in
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading } = useAuth();

  if (loading) return null; // Or a spinner

  if (session) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

import ForgotPassword from './components/ForgotPassword';
import UpdatePassword from './components/UpdatePassword';
import Settings from './components/Settings';
import Profile from './components/Profile';
import { LanguageProvider } from './components/LanguageContext';

import ApproveUser from './components/ApproveUser';

import RegistrationSuccess from './components/RegistrationSuccess';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
      <Route path="/registration-success" element={<PublicRoute><RegistrationSuccess /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/update-password" element={<UpdatePassword />} />
      <Route path="/pending-approval" element={<ProtectedRoute><PendingApproval /></ProtectedRoute>} />
      <Route path="/approve-user" element={<ProtectedRoute><ApproveUser /></ProtectedRoute>} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
      <Route path="/agenda/new" element={
        <ProtectedRoute>
          <NewAppointment />
        </ProtectedRoute>
      } />
      <Route path="/reschedule/:appointmentId" element={
        <ProtectedRoute>
          <Reschedule />
        </ProtectedRoute>
      } />
      <Route path="/consultation/:appointmentId" element={
        <ProtectedRoute>
          <MedicalConsultation />
        </ProtectedRoute>
      } />
      <Route path="/patients" element={<ProtectedRoute><PatientList /></ProtectedRoute>} />
      <Route path="/patients/new" element={<ProtectedRoute><NewPatient /></ProtectedRoute>} />
      <Route path="/patients/:id" element={<ProtectedRoute><PatientDetail /></ProtectedRoute>} />
      <Route path="/surgeries" element={<ProtectedRoute><Surgeries /></ProtectedRoute>} />
      <Route path="/surgeries/new" element={<ProtectedRoute><NewSurgery /></ProtectedRoute>} />
      <Route path="/doctors" element={<ProtectedRoute><ManagementTables type="doctors" /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/cities" element={<ProtectedRoute><ManagementTables type="cities" /></ProtectedRoute>} />
      <Route path="/locations" element={<ProtectedRoute><ManagementTables type="locations" /></ProtectedRoute>} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;
