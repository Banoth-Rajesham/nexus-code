/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { LandingPage } from './pages/LandingPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { DashboardPage } from './pages/DashboardPage';
import { PricingPage } from './pages/PricingPage';
import { DocsPage } from './pages/DocsPage';

export function AppContent() {
  const [currentView, setCurrentView] = useState<'landing' | 'workspace' | 'dashboard' | 'pricing' | 'docs'>('landing');
  const [activeProjectData, setActiveProjectData] = useState<any>(null);

  const handleNavigate = (view: string, data?: any) => {
    if (data !== undefined) {
      setActiveProjectData(data);
    }
    setCurrentView(view as any);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`flex flex-col bg-white text-[#242424] ${currentView === 'workspace' ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      {/* Universal Top Navigation — Hidden on /workspace to maximize code editing area */}
      {currentView !== 'workspace' && (
        <Navbar currentView={currentView} onNavigate={handleNavigate} />
      )}

      {/* Main Page Views */}
      <main className={`flex-1 flex flex-col ${currentView === 'workspace' ? 'overflow-hidden min-h-0' : ''}`}>
        {currentView === 'landing' && <LandingPage onNavigate={handleNavigate} />}
        {currentView === 'workspace' && (
          <WorkspacePage onNavigate={handleNavigate} initialProject={activeProjectData} />
        )}
        {currentView === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
        {currentView === 'pricing' && <PricingPage onNavigate={handleNavigate} />}
        {currentView === 'docs' && <DocsPage onNavigate={handleNavigate} />}
      </main>

      {/* Global Authentication Modal */}
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
