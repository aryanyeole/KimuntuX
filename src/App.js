import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { GlobalStyles } from './styles/GlobalStyles';
import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './components/LandingPage';

// Import all page components
import CRMPage from './pages/CRMPage';
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
import SignupPage from './pages/SignupPage';

function App() {
  return (
    <ThemeProvider>
      <GlobalStyles />
      <Router>
        <div className="App">
          <Header />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/crm" element={<CRMPage />} />
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
            <Route path="/signup" element={<SignupPage />} />
          </Routes>
          <Footer />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;