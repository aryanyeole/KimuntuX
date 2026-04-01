import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserProvider } from './contexts/UserContext';
import { ChatbotProvider } from './providers/ChatbotProvider';
import { GlobalStyles } from './styles/GlobalStyles';
import Header from './components/Header';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';
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

// Import all page components
import CRMDashboard from './pages/CRMDashboard';
import CRMComingSoon from './pages/CRMComingSoon';
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

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <GlobalStyles />
        <Router>
          <ChatbotProvider>
            <div className="App">
              <Header />
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
                <Route path="/crm" element={<CRMDashboard />} />
                <Route path="/crm/leads" element={<CRMComingSoon title="Leads Management" icon="👥" />} />
                <Route path="/crm/pipeline" element={<CRMComingSoon title="Pipeline View" icon="📈" />} />
                <Route path="/crm/campaigns" element={<CRMComingSoon title="Campaigns" icon="🎯" />} />
                <Route path="/crm/ai-tools" element={<CRMComingSoon title="AI Tools" icon="🤖" />} />
                <Route path="/crm/settings" element={<CRMComingSoon title="CRM Settings" icon="⚙️" />} />
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
              </Routes>
              <Footer />
            </div>
            <ChatWidget />
          </ChatbotProvider>
        </Router>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;