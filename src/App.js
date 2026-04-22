import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserProvider } from './contexts/UserContext';
import { TenantProvider } from './contexts/TenantContext';
import { ChatbotProvider } from './providers/ChatbotProvider';
import { GlobalStyles } from './styles/GlobalStyles';
import Header from './components/Header';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './components/LandingPage';
import AboutPage from './pages/AboutPage';
import PricingPage from './pages/PricingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import FAQPage from './pages/FAQPage';
import SolutionsPage from './pages/SolutionsPage';
import BenefitsBySectorPage from './pages/BenefitsBySectorPage';
import BlogPage from './pages/BlogPage';

import B2BBrokeragePage from './pages/B2BBrokeragePage';
import B2CMarketplacePage from './pages/B2CMarketplacePage';
import AffiliateHubPage from './pages/AffiliateHubPage';
import ECommercePage from './pages/eCommercePage';
import AIDashboardPage from './pages/AIDashboardPage';
import BlockchainPage from './pages/BlockchainPage';
import FintechPage from './pages/FintechPage';
import CommerceIntelligencePage from './pages/CommerceIntelligencePage';
import DeveloperPage from './pages/DeveloperPage';
import MonetizationPage from './pages/MonetizationPage';
import USBHPage from './pages/USBHPage';
import ContentGeneratorPage from './pages/ContentGeneratorPage';
import MarketingReportPage from './pages/MarketingReportPage';

// CRM layout + pages
import CRMLayout from './layouts/CRMLayout';
import CRMDashboard from './pages/crm/CRMDashboard';
import CRMOffers from './pages/crm/CRMOffers';
import CRMCampaigns from './pages/crm/CRMCampaigns';
import CRMLeads from './pages/crm/CRMLeads';
import CRMPipeline from './pages/crm/CRMPipeline';
import CRMCommunication from './pages/crm/CRMCommunication';
import CRMAnalytics from './pages/crm/CRMAnalytics';
import CRMSettings from './pages/crm/CRMSettings';
import ContentSchedulerPage from './pages/ContentSchedulerPage';
import CRMStrategy from './pages/crm/CRMStrategy';
import CRMFintech from './pages/crm/CRMFintech';
import CRMAcademy from './pages/crm/CRMAcademy';
import CRMContentScheduler from './pages/crm/CRMContentScheduler';

function AppInner() {
  const location = useLocation();
  const isCRM = location.pathname.startsWith('/crm');

  return (
    <div className="App">
      {!isCRM && <Header />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/solutions" element={<SolutionsPage />} />
        <Route path="/benefits" element={<BenefitsBySectorPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/b2b-brokerage" element={<B2BBrokeragePage />} />
        <Route path="/b2c-marketplace" element={<B2CMarketplacePage />} />
        <Route path="/affiliate-hub" element={<AffiliateHubPage />} />
        <Route path="/ecommerce" element={<ECommercePage />} />
        <Route path="/ai-dashboard" element={<AIDashboardPage />} />
        <Route path="/blockchain" element={<BlockchainPage />} />
        <Route path="/fintech" element={<FintechPage />} />
        <Route path="/commerce-intelligence" element={<CommerceIntelligencePage />} />
        <Route path="/developer" element={<DeveloperPage />} />
        <Route path="/monetization" element={<MonetizationPage />} />
        <Route path="/usbh" element={<USBHPage />} />
        <Route
          path="/content-scheduler"
          element={(
            <ProtectedRoute>
              <ContentSchedulerPage />
            </ProtectedRoute>
          )}
        />
        <Route path="/digital-marketing-report" element={<MarketingReportPage />} />

        <Route path="/crm" element={<CRMLayout />}>
          <Route index element={<Navigate to="/crm/dashboard" replace />} />
          <Route path="dashboard" element={<CRMDashboard />} />
          <Route path="offers" element={<CRMOffers />} />
          <Route path="campaigns" element={<CRMCampaigns />} />
          <Route path="content-gen" element={<ContentGeneratorPage />} />
          <Route path="leads" element={<CRMLeads />} />
          <Route path="pipeline" element={<CRMPipeline />} />
          <Route path="communication" element={<CRMCommunication />} />
          <Route path="blockchain" element={<Navigate to="/crm/fintech" replace />} />
          <Route path="strategy" element={<CRMStrategy />} />
          <Route path="fintech" element={<CRMFintech />} />
          <Route path="academy" element={<CRMAcademy />} />
          <Route path="content-scheduler" element={<CRMContentScheduler />} />
          <Route path="analytics" element={<CRMAnalytics />} />
          <Route path="settings" element={<CRMSettings />} />
        </Route>
      </Routes>
      {!isCRM && <ChatWidget />}
      {!isCRM && <Footer />}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <TenantProvider>
          <GlobalStyles />
          <Router>
            <ChatbotProvider>
              <AppInner />
            </ChatbotProvider>
          </Router>
        </TenantProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
