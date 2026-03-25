import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { I18nProvider, useI18n } from '@/lib/i18n';
import LanguageSelector from '@/components/LanguageSelector';
import Demo from './pages/Demo';
import AdminNewRegistrations from './pages/AdminNewRegistrations';
import AdminPersonTracking from './pages/AdminPersonTracking';
import SystemAdminDashboard from './pages/SystemAdminDashboard';
import SystemAdminBilling from './pages/SystemAdminBilling';
import MobileAufgabenDetail from './pages/MobileAufgabenDetail';
import MobileEinrichtungen from './pages/MobileEinrichtungen';
import MobileEinrichtungsDetail from './pages/MobileEinrichtungsDetail';
import MobileKalender from './pages/MobileKalender';
import JagdkalenderKalender from './pages/JagdkalenderKalender';
import SystemAdminDebug from './pages/SystemAdminDebug';
const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/Demo" element={<Demo />} />
      <Route path="/MobileAufgabenDetail" element={
        <LayoutWrapper currentPageName="MobileAufgabenDetail">
          <MobileAufgabenDetail />
        </LayoutWrapper>
      } />
      <Route path="/MobileEinrichtungen" element={
        <LayoutWrapper currentPageName="MobileEinrichtungen">
          <MobileEinrichtungen />
        </LayoutWrapper>
      } />
      <Route path="/MobileEinrichtungsDetail" element={
        <LayoutWrapper currentPageName="MobileEinrichtungsDetail">
          <MobileEinrichtungsDetail />
        </LayoutWrapper>
      } />
      <Route path="/MobileKalender" element={
        <LayoutWrapper currentPageName="MobileKalender">
          <MobileKalender />
        </LayoutWrapper>
      } />
      <Route path="/JagdkalenderKalender" element={
        <LayoutWrapper currentPageName="JagdkalenderKalender">
          <JagdkalenderKalender />
        </LayoutWrapper>
      } />
      <Route path="/SystemAdminDebug" element={
        <LayoutWrapper currentPageName="SystemAdminDebug">
          <SystemAdminDebug />
        </LayoutWrapper>
      } />
      <Route path="/AdminNewRegistrations" element={
        <LayoutWrapper currentPageName="AdminNewRegistrations">
          <AdminNewRegistrations />
        </LayoutWrapper>
      } />
      <Route path="/AdminPersonTracking" element={
        <LayoutWrapper currentPageName="AdminPersonTracking">
          <AdminPersonTracking />
        </LayoutWrapper>
      } />
      <Route path="/SystemAdminDashboard" element={
        <LayoutWrapper currentPageName="SystemAdminDashboard">
          <SystemAdminDashboard />
        </LayoutWrapper>
      } />
      <Route path="/SystemAdminBilling" element={
        <LayoutWrapper currentPageName="SystemAdminBilling">
          <SystemAdminBilling />
        </LayoutWrapper>
      } />
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function AppWithLanguage() {
  const { isLanguageSelected } = useI18n();
  if (!isLanguageSelected) return <LanguageSelector />;
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
          <Toaster />
        </Router>
      </QueryClientProvider>
    </AuthProvider>
  );
}

function App() {
  return (
    <I18nProvider>
      <AppWithLanguage />
    </I18nProvider>
  );
}

export default App