import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProtectedRoute, PublicRoute } from "@/router";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { WasteManagementPage } from "@/pages/WasteManagementPage";
import { IncinerationPage } from "@/pages/IncinerationPage";
import { FlueGasPage } from "@/pages/FlueGasPage";
import { SlagLeachatePage } from "@/pages/SlagLeachatePage";
import { EquipmentPage } from "@/pages/EquipmentPage";
import { PurchasePage } from "@/pages/PurchasePage";
import { SystemPage } from "@/pages/SystemPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { ForbiddenPage } from "@/pages/ForbiddenPage";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="waste-management" element={<WasteManagementPage />} />
            <Route path="incineration" element={<IncinerationPage />} />
            <Route path="flue-gas" element={<FlueGasPage />} />
            <Route path="slag-leachate" element={<SlagLeachatePage />} />
            <Route path="equipment" element={<EquipmentPage />} />
            <Route path="purchase" element={<PurchasePage />} />
            <Route path="system" element={<SystemPage />} />
          </Route>

          <Route path="/403" element={<ForbiddenPage />} />
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
