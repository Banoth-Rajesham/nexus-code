import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Globe, ChevronDown, Code, LayoutDashboard, LogOut, Sparkles, Check, Search, Terminal } from 'lucide-react';
import { SUPPORTED_NATIVE_LANGUAGES } from '../types';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { user, quota, logout, openAuthModal } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  return (
    <>
      {/* Top Outlook-style announcement ribbon */}
      {!bannerDismissed && currentView === 'landing' && (
        <div className="bg-[#091f2c] text-[#f4fafd] text-[13px] py-2 px-4 flex items-center justify-between z-50">
          <div className="max-w-[1360px] mx-auto w-full flex items-center justify-center gap-2 text-center">
            <span>Learn to code and master algorithms in your mother tongue with BhashaCode AI.</span>
            <button
              onClick={() => onNavigate('workspace')}
              className="text-[#8dc8e8] hover:text-white underline font-semibold transition-colors inline-flex items-center gap-1"
            >
              <span>Try the interactive Telugu sandbox now</span>
              <span>&rarr;</span>
            </button>
          </div>
          <button
            onClick={() => setBannerDismissed(true)}
            className="text-slate-400 hover:text-white p-1 text-sm font-semibold ml-2 transition-colors"
            title="Dismiss notification"
            aria-label="Dismiss banner"
          >
            ✕
          </button>
        </div>
      )}

      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-[#e6e9ea] shadow-2xs">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          
          {/* Left: Custom BhashaCode Brand Emblem & Title (Clean, NO Microsoft logos) */}
          <div className="flex items-center gap-7">
            <button
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-2.5 text-left transition-opacity hover:opacity-90 active:scale-98 whitespace-nowrap shrink-0 group"
            >
              {/* Custom BhashaCode Logo Emblem */}
              <div className="w-7 h-7 rounded-[4px] bg-[#0078d4] text-white flex items-center justify-center font-bold text-sm shadow-xs transition-transform group-hover:scale-105">
                <span>భ</span>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-[17px] font-bold text-[#0e1726] tracking-tight">Bhasha</span>
                <span className="text-[17px] font-bold text-[#0078d4] tracking-tight">Code</span>
              </div>
            </button>

            {/* Navigation Menu (Single line links) */}
            <nav className="hidden lg:flex items-center gap-6 text-[14px] font-normal text-[#3a4c56]">
              <button
                onClick={() => onNavigate('workspace')}
                className={`hover:text-[#0e1726] transition-colors whitespace-nowrap shrink-0 ${
                  currentView === 'workspace' ? 'font-semibold text-[#0e1726] border-b-2 border-[#0078d4] pb-0.5' : ''
                }`}
              >
                Workspace
              </button>

              <button
                onClick={() => onNavigate('landing')}
                className={`hover:text-[#0e1726] transition-colors whitespace-nowrap shrink-0 ${
                  currentView === 'landing' ? 'font-semibold text-[#0e1726]' : ''
                }`}
              >
                Overview
              </button>

              <button
                onClick={() => onNavigate('pricing')}
                className={`hover:text-[#0e1726] transition-colors whitespace-nowrap shrink-0 ${
                  currentView === 'pricing' ? 'font-semibold text-[#0e1726]' : ''
                }`}
              >
                Plans & pricing
              </button>

              <button
                onClick={() => onNavigate('docs')}
                className={`hover:text-[#0e1726] transition-colors whitespace-nowrap shrink-0 ${
                  currentView === 'docs' ? 'font-semibold text-[#0e1726]' : ''
                }`}
              >
                Mentors & resources
              </button>
            </nav>
          </div>

        {/* Right Side: Multi-Language Globe, User / Sign in, Primary Blue CTA */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Multi-language Globe Popover */}
          <div className="relative">
            <button
              onClick={() => {
                setLangMenuOpen(!langMenuOpen);
                setUserDropdownOpen(false);
              }}
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-[#616161] hover:text-[#242424] hover:bg-[#F3F4F6] rounded-[2px] transition-colors"
              title="Select Native Dialect"
              aria-label="Language selector"
            >
              <Globe className="w-3.5 h-3.5 text-[#0078D4]" />
              <span className="hidden sm:inline font-medium">8 Languages</span>
              <ChevronDown className="w-3 h-3 text-[#747474]" />
            </button>

            {langMenuOpen && (
              <div
                className="absolute right-0 mt-1 w-64 bg-white rounded-md shadow-lg border border-[#E1DFDD] p-2 text-xs z-50 animate-in fade-in"
                onClick={() => setLangMenuOpen(false)}
              >
                <div className="px-3 py-1.5 text-[11px] font-semibold text-[#616161] border-b border-[#EDEBE9] flex items-center justify-between">
                  <span>Supported Mother Tongues</span>
                  <span className="text-[#0067B8] font-bold">Free</span>
                </div>
                <div className="py-1 space-y-0.5 max-h-60 overflow-y-auto">
                  {SUPPORTED_NATIVE_LANGUAGES.map((lang) => (
                    <div
                      key={lang.key}
                      onClick={() => onNavigate('workspace')}
                      className="px-3 py-1.5 rounded-[2px] hover:bg-[#F3F4F6] flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <span className="font-medium text-[#242424]">
                        {lang.native} <span className="text-[#747474] font-normal">({lang.english})</span>
                      </span>
                      <span className="text-[11px] text-[#0067B8] font-mono">{lang.greeting}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile or Primary Blue CTA */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => {
                  setUserDropdownOpen(!userDropdownOpen);
                  setLangMenuOpen(false);
                }}
                className="flex items-center gap-2 py-1 pl-1.5 pr-2 rounded-[2px] hover:bg-[#F3F4F6] transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-[#0078D4] text-white font-bold text-xs flex items-center justify-center">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-[#242424] max-w-[90px] truncate hidden sm:inline">
                  {user.name}
                </span>
                <ChevronDown className="w-3 h-3 text-[#747474]" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-1 w-60 bg-white rounded-md shadow-lg border border-[#E1DFDD] p-2 text-xs z-50 animate-in fade-in"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-[#EDEBE9] mb-1">
                    <p className="text-[11px] text-[#747474]">Student Account</p>
                    <p className="font-bold text-[#242424] truncate">{user.email}</p>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-[#0067B8]">
                      <span>{user.plan.toUpperCase()} Tier</span>
                      <span className="font-bold">{quota?.remaining ?? 20} daily uses left</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('workspace')}
                    className="w-full text-left px-3 py-2 rounded-[2px] text-xs text-[#242424] hover:bg-[#F3F4F6] flex items-center gap-2 transition-colors"
                  >
                    <Code className="w-3.5 h-3.5 text-[#0078D4]" />
                    <span>Open Code Workspace</span>
                  </button>

                  <button
                    onClick={() => onNavigate('dashboard')}
                    className="w-full text-left px-3 py-2 rounded-[2px] text-xs text-[#242424] hover:bg-[#F3F4F6] flex items-center gap-2 transition-colors"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-[#0067B8]" />
                    <span>My Projects & Quota</span>
                  </button>

                  <div className="my-1 border-t border-[#EDEBE9]" />

                  <button
                    onClick={() => logout()}
                    className="w-full text-left px-3 py-2 rounded-[2px] text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => onNavigate('workspace')}
                className="hidden md:flex items-center gap-1.5 text-xs text-[#3a4c56] hover:text-[#0e1726] px-2 py-1.5 rounded-[4px] transition-colors"
                title="Search algorithms and lessons"
              >
                <span>Search</span>
                <Search className="w-3.5 h-3.5 text-[#3a4c56]" />
              </button>

              <button
                onClick={() => onNavigate('pricing')}
                className="px-3.5 py-1.5 rounded-[4px] border border-[#8e989e] hover:border-[#0e1726] hover:bg-[#f4fafd] text-[#0e1726] font-semibold text-xs transition-colors"
              >
                Buy now
              </button>

              <button
                onClick={() => openAuthModal('login')}
                className="px-2.5 py-1.5 text-xs font-semibold text-[#0e1726] hover:underline transition-colors"
              >
                Sign in
              </button>
            </div>
          )}

        </div>
      </div>
    </header>
    </>
  );
};
