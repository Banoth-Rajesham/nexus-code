/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useEffect, useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { LandingPage } from './pages/LandingPage';

// Heavier pages load only when they are opened, so the home page stays fast
const WorkspacePage = lazy(() => import('./pages/WorkspacePage').then((m) => ({ default: m.WorkspacePage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const PricingPage = lazy(() => import('./pages/PricingPage').then((m) => ({ default: m.PricingPage })));
const DocsPage = lazy(() => import('./pages/DocsPage').then((m) => ({ default: m.DocsPage })));
const LegalPage = lazy(() => import('./pages/LegalPage').then((m) => ({ default: m.LegalPage })));

type View = 'landing' | 'workspace' | 'dashboard' | 'pricing' | 'docs' | 'privacy' | 'terms';

const PATHS: Record<View, string> = {
  landing: '/',
  workspace: '/workspace',
  dashboard: '/dashboard',
  pricing: '/pricing',
  docs: '/docs',
  privacy: '/privacy',
  terms: '/terms',
};

const TITLES: Record<View, string> = {
  landing: 'NexusCode — Understand every line of code you write',
  workspace: 'Workspace · NexusCode',
  dashboard: 'My projects · NexusCode',
  pricing: 'Pricing · NexusCode',
  docs: 'Docs & resources · NexusCode',
  privacy: 'Privacy Policy · NexusCode',
  terms: 'Terms of Service · NexusCode',
};

const viewFromPath = (pathname: string): View => {
  const clean = pathname.replace(/\/+$/, '') || '/';
  const match = (Object.entries(PATHS) as [View, string][]).find(([, p]) => p === clean);
  return match ? match[0] : 'landing';
};

const PageLoader: React.FC<{ dark?: boolean }> = ({ dark }) => (
  <div className={`flex-1 flex items-center justify-center ${dark ? 'bg-[#0d1117]' : 'bg-white'}`} role="status" aria-label="Loading">
    <span className="w-7 h-7 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
  </div>
);

export function AppContent() {
  const [currentView, setCurrentView] = useState<View>(() => viewFromPath(window.location.pathname));
  const [activeProjectData, setActiveProjectData] = useState<any>(null);

  // Browser back / forward buttons
  useEffect(() => {
    const onPop = () => setCurrentView(viewFromPath(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    document.title = TITLES[currentView];
  }, [currentView]);

  const handleNavigate = (view: string, data?: any) => {
    const next = (view in PATHS ? view : 'landing') as View;
    if (data !== undefined) {
      setActiveProjectData(data);
    }
    if (window.location.pathname !== PATHS[next]) {
      window.history.pushState({ view: next }, '', PATHS[next]);
    }
    setCurrentView(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Fixed Floating Navbar — rendered at root so fixed positioning works globally */}
      {currentView !== 'workspace' && <Navbar currentView={currentView} onNavigate={handleNavigate} />}

      <div className={`flex flex-col bg-white text-[#242424] ${currentView === 'workspace' ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>

        {/* Main Page Views */}
        <main className={`flex-1 flex flex-col ${currentView === 'workspace' ? 'overflow-hidden min-h-0' : 'pt-16 sm:pt-20'}`}>
          <Suspense fallback={<PageLoader dark={currentView === 'workspace'} />}>
            {currentView === 'landing' && <LandingPage onNavigate={handleNavigate} />}
            {currentView === 'workspace' && <WorkspacePage onNavigate={handleNavigate} initialProject={activeProjectData} />}
            {currentView === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
            {currentView === 'pricing' && <PricingPage onNavigate={handleNavigate} />}
            {currentView === 'docs' && <DocsPage onNavigate={handleNavigate} />}
            {(currentView === 'privacy' || currentView === 'terms') && <LegalPage page={currentView} onNavigate={handleNavigate} />}
          </Suspense>
        </main>

        {/* Global Authentication Modal */}
        <AuthModal />
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
