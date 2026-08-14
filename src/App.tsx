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
import { FarmGalleryPage } from "./pages/FarmGalleryPage";
import { Settings } from "./pages/Settings";
import { SettingsFarmProfile } from "./pages/SettingsFarmProfile";
import { SettingsContacts } from "./pages/SettingsContacts";
import { SettingsReports } from "./pages/SettingsReports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Loading spinner displayed while restoring active session on page reload
const AuthLoadingScreen = () => (
  <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-center p-6 text-white relative">
    <div className="z-10 space-y-4 max-w-sm">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
      <div>
        <h3 className="text-sm font-black text-emerald-400 tracking-wide">Restoring FarmNest session...</h3>
        <p className="text-slate-400 text-xs mt-1">Connecting to farm records</p>
      </div>
    </div>
  </div>
);

// Protected Route Guard: Waits for Supabase auth initialization before checking session
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, isAuthReady } = useFarm();
  
  if (!isAuthReady) {
    return <AuthLoadingScreen />;
  }

  if (!session.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Public Only Route Guard: Prevents authenticated users from being sent to login/register on refresh
const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, isAuthReady } = useFarm();

  if (!isAuthReady) {
    return <AuthLoadingScreen />;
  }

  if (session.isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
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
      
      <Route 
        path="/onboarding" 
        element={
          <PublicOnlyRoute>
            <Onboarding />
          </PublicOnlyRoute>
        } 
      />
      
      <Route 
        path="/login" 
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        } 
      />
      
      <Route 
        path="/register" 
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        } 
      />

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
        path="/gallery" 
        element={
          <PrivateRoute>
            <FarmGalleryPage />
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