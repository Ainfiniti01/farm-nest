import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { FarmProvider, useFarm } from "./context/FarmContext";

// Master Layout
import { Layout } from "./components/Layout";

// Multi-page imports
import { Onboarding } from "./pages/Onboarding";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { Animals } from "./pages/Animals";
import { AnimalProfilePage } from "./pages/AnimalProfilePage";
import { FarmAi } from "./pages/FarmAi";
import { Inventory } from "./pages/Inventory";
import { FarmNotesPage } from "./pages/FarmNotesPage";
import { Settings } from "./pages/Settings";
import { SettingsFarmProfile } from "./pages/SettingsFarmProfile";
import { SettingsContacts } from "./pages/SettingsContacts";
import { SettingsReports } from "./pages/SettingsReports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Clean Security Guard Wrapper redirects to login if unauthenticated, and ensures layout bounds
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useFarm();
  
  // Real authentication protection logic
  if (!session.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
  const { onboardingCompleted } = useFarm();

  return (
    <Routes>
      {/* Auth Gates */}
      <Route 
        path="/" 
        element={<Navigate to={onboardingCompleted ? "/dashboard" : "/onboarding"} replace />} 
      />
      
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Layout Paths */}
      <Route 
        path="/dashboard" 
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } 
      />

      <Route 
        path="/animals" 
        element={
          <PrivateRoute>
            <Animals />
          </PrivateRoute>
        } 
      />

      <Route 
        path="/animals/:id" 
        element={
          <PrivateRoute>
            <AnimalProfilePage />
          </PrivateRoute>
        } 
      />

      <Route 
        path="/farm-ai" 
        element={
          <PrivateRoute>
            <FarmAi />
          </PrivateRoute>
        } 
      />

      <Route 
        path="/inventory" 
        element={
          <PrivateRoute>
            <Inventory />
          </PrivateRoute>
        } 
      />

      <Route 
        path="/notes" 
        element={
          <PrivateRoute>
            <FarmNotesPage />
          </PrivateRoute>
        } 
      />

      <Route 
        path="/settings" 
        element={
          <PrivateRoute>
            <Settings />
          </PrivateRoute>
        } 
      />

      <Route 
        path="/settings/farm-profile" 
        element={
          <PrivateRoute>
            <SettingsFarmProfile />
          </PrivateRoute>
        } 
      />

      <Route 
        path="/settings/contacts" 
        element={
          <PrivateRoute>
            <SettingsContacts />
          </PrivateRoute>
        } 
      />

      <Route 
        path="/settings/reports" 
        element={
          <PrivateRoute>
            <SettingsReports />
          </PrivateRoute>
        } 
      />

      {/* CATCH ALL */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <FarmProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </FarmProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;