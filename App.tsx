
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
import SurgicalMaps from './components/SurgicalMaps';
import NewSurgicalMap from './components/NewSurgicalMap';
import SurgicalMapDetail from './components/SurgicalMapDetail';
import PatientDetail from './components/PatientDetail';
import NewPatient from './components/NewPatient';
import NewAppointment from './components/NewAppointment';
import ManagementTables from './components/ManagementTables';
import TriagePanel from './components/TriagePanel';
import { AuthProvider, useAuth } from './components/AuthContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
      <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
    </div>;
  }

  if (!session) {
    return <Navigate to="/" />;
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

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/update-password" element={<UpdatePassword />} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/triage" element={<ProtectedRoute><TriagePanel /></ProtectedRoute>} />
      <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
      <Route path="/agenda/new" element={
        <ProtectedRoute>
          <NewAppointment />
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
      <Route path="/surgical-maps" element={<ProtectedRoute><SurgicalMaps /></ProtectedRoute>} />
      <Route path="/surgical-maps/new" element={<ProtectedRoute><NewSurgicalMap /></ProtectedRoute>} />
      <Route path="/surgical-maps/:id" element={<ProtectedRoute><SurgicalMapDetail /></ProtectedRoute>} />
      <Route path="/doctors" element={<ProtectedRoute><ManagementTables type="doctors" /></ProtectedRoute>} />
      <Route path="/cities" element={<ProtectedRoute><ManagementTables type="cities" /></ProtectedRoute>} />
      <Route path="/locations" element={<ProtectedRoute><ManagementTables type="locations" /></ProtectedRoute>} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
