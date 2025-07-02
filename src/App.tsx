import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem } from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { IssueAuthProvider } from "@/contexts/IssueAuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import ComprehensiveHome from './pages/ComprehensiveIndex';
import Dashboard from '@/components/ComprehensiveDashboard';
import FeedbackManagement from '@/components/FeedbackManagement';
import IssueEndorsement from '@/components/IssueEndorsement';
import Login from "./pages/Login";
import BankEmployeeAnalytics from '@/components/BankEmployeeAnalytics';
import UserProfile from '@/components/UserProfile';
import NotFound from './pages/NotFound';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminDashboard from './components/AdminDashboard';
import CustomerSentimental from './pages/CustomerSentimental';
import SummaryViewer from '@/components/SummaryViewer'; // ✅ ADDED

import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 0,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
    },
  },
});

const MainLayout = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [issueCounts, setIssueCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0
  });

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const getNavigationItems = () => {
    const isAdmin = user?.role === 'admin';
    const items = [
      { name: 'Admin Dashboard', key: 'admin-dashboard', path: '/admin-dashboard', show: isAdmin },
      { name: 'Home', key: 'home', path: '/', show: !isAdmin },
      { name: 'Dashboard', key: 'dashboard', path: '/dashboard', show: !isAdmin },
      { name: 'Feedback', key: 'feedback', path: '/feedback', show: !isAdmin },
      { name: 'Customer Sentimental', key: 'customer-sentimental', path: '/customer-sentimental', show: isAdmin },
      { name: `Pending Issues`, key: 'pending-issues', path: '/issues/pending', show: isAdmin },
      { name: `Approved Issues`, key: 'approved-issues', path: '/issues/approved', show: isAdmin },
      { name: `Rejected Issues`, key: 'rejected-issues', path: '/issues/rejected', show: isAdmin },
      { name: 'Summaries', key: 'summary', path: '/summary', show: isAdmin }, // ✅ ADDED
      { name: 'Employees', key: 'employees', path: '/employees', show: !isAdmin },
    ];
    return items.filter(item => item.show);
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 dark:from-gray-900 dark:to-gray-800">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">Mau Bank</span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">VoC Analysis</span>
            </div>
            <NavigationMenu>
              <NavigationMenuList className="flex space-x-4">
                {navigationItems.map((item) => (
                  <NavigationMenuItem key={item.key}>
                    <Link
                      to={item.path}
                      className={cn(
                        "group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                      )}
                    >
                      {item.name}
                    </Link>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
            <div className="flex items-center">
              <Link
                to="/profile"
                className="flex items-center px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <span className="mr-2">👤</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{user?.username || 'Profile'}</span>
              </Link>
              <button 
                onClick={() => logout()}
                className="ml-4 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white"
              >
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-16">
        <Routes>
          {user?.role === 'admin' ? (
            <>
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/customer-sentimental" element={<CustomerSentimental />} />
              <Route path="/summary" element={<SummaryViewer />} /> {/* ✅ ADDED */}
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/issues/pending" element={<IssueEndorsement tab="pending" onCountsUpdate={setIssueCounts} />} />
              <Route path="/issues/approved" element={<IssueEndorsement tab="approved" onCountsUpdate={setIssueCounts} />} />
              <Route path="/issues/rejected" element={<IssueEndorsement tab="rejected" onCountsUpdate={setIssueCounts} />} />
              <Route path="*" element={<Navigate to="/admin-dashboard" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<ComprehensiveHome />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/feedback" element={<FeedbackManagement />} />
              <Route path="/issues" element={<Navigate to="/" replace />} />
              <Route path="/employees" element={<BankEmployeeAnalytics />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="*" element={<NotFound />} />
            </>
          )}
        </Routes>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <IssueAuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Router>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/*" element={
                    <ProtectedRoute>
                      <MainLayout />
                    </ProtectedRoute>
                  } />
                </Routes>
              </Router>
            </TooltipProvider>
          </IssueAuthProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
