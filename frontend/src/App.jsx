import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppShell from './components/AppShell';
import LoginPage from './components/LoginPage';
import HomePage from './pages/HomePage';
import AssetsPage from './pages/AssetsPage';
import AssetDetailPage from './pages/AssetDetailPage';
import TasksPage from './pages/TasksPage';
import NewTaskPage from './pages/NewTaskPage';
import JournalsPage from './pages/JournalsPage';
import DocumentsPage from './pages/DocumentsPage';
import UploadDocumentPage from './pages/UploadDocumentPage';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import RenewalDashboard from './pages/RenewalDashboard';
import BudgetDashboard from './pages/BudgetDashboard';
import TaskDashboard from './pages/TaskDashboard';
import ConsolidationDashboard from './pages/ConsolidationDashboard';
import DepartmentDashboard from './pages/DepartmentDashboard';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/assets/:id" element={<AssetDetailPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/tasks/new" element={<NewTaskPage />} />
        <Route path="/journals" element={<JournalsPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/upload" element={<UploadDocumentPage />} />
        <Route path="/dashboard/executive" element={<ExecutiveDashboard />} />
        <Route path="/dashboard/renewals" element={<RenewalDashboard />} />
        <Route path="/dashboard/budget" element={<BudgetDashboard />} />
        <Route path="/dashboard/tasks" element={<TaskDashboard />} />
        <Route path="/dashboard/consolidation" element={<ConsolidationDashboard />} />
        <Route path="/dashboard/departments" element={<DepartmentDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
