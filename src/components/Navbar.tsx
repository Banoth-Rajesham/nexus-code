import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ChevronDown,
  Code,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  ArrowRight,
  Sparkles,
  Zap,
  BookOpen,
  GraduationCap,
  Layers,
  HelpCircle,
  ShieldCheck,
  Compass,
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, data?: any) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { user, quota, logout, openAuthModal } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [appsMenuOpen, setAppsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const appsMenuRef = useRef<HTMLDivElement>(null);

  // Monitor scroll for enhanced glassmorphic intensity
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menus on outside click or escape
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (appsMenuRef.current && !appsMenuRef.current.contains(e.target as Node)) {
        setAppsMenuOpen(false);
      }
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false);
        setAppsMenuOpen(false);
        setActiveDropdown(null);
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const go = (view: string, data?: any) => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setAppsMenuOpen(false);
    setActiveDropdown(null);
    onNavigate(view, data);
  };

  const goToSection = (id: string) => {
    setMobileOpen(false);
    setActiveDropdown(null);
    setAppsMenuOpen(false);
    const scroll = () =>
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (currentView === 'landing') scroll();
    else {
      onNavigate('landing');
      setTimeout(scroll, 140);
    }
  };

  return (
    <header className="fixed top-2 sm:top-3.5 left-0 right-0 z-50 w-full px-2 sm:px-6 pointer-events-none transition-all">
      {/* ─── FLOATING GLASSmORPHIC CAPSULE NAVBAR ─── */}
      <div
        className={`max-w-7xl mx-auto rounded-full pointer-events-auto transition-all duration-300 relative border ${
          scrolled
            ? 'bg-white/85 backdrop-blur-2xl backdrop-saturate-150 border-white/70 shadow-[0_12px_40px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]'
            : 'bg-white/75 backdrop-blur-xl backdrop-saturate-150 border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05),0_1px_4px_rgba(0,0,0,0.03)]'
        }`}
      >
        {/* Subtle glossy top reflection line */}
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none rounded-full" />

        <div className="h-13 sm:h-16 flex items-center justify-between px-3 sm:px-7 gap-1.5 sm:gap-3">
          {/* ─── BRAND: NexusCode (Exact size & weight of the Adobe logo reference) ─── */}
          <button
            onClick={() => go('landing')}
            className="flex items-center gap-2 sm:gap-2.5 shrink-0 group select-none focus:outline-hidden"
            aria-label="NexusCode Home"
          >
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform shrink-0">
              <Code className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            </span>
            <span className="text-lg sm:text-2xl font-black tracking-tight text-slate-950 font-sans">
              Nexus<span className="text-blue-600">Code</span>
            </span>
          </button>

          {/* ─── DESKTOP NAVIGATION LINKS (Adobe-style dropdowns with chevrons) ─── */}
          <nav
            ref={navRef}
            className="hidden lg:flex items-center gap-1 xl:gap-2 text-sm font-medium text-slate-700"
            aria-label="Main"
          >
            {/* Products / Features Dropdown */}
            <div className="relative">
              <button
                onClick={() =>
                  setActiveDropdown(activeDropdown === 'products' ? null : 'products')
                }
                className={`px-3 py-1.5 rounded-full flex items-center gap-1 transition-all ${
                  activeDropdown === 'products'
                    ? 'bg-slate-100/90 text-slate-950 font-semibold'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100/60'
                }`}
              >
                <span>Products</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${
                    activeDropdown === 'products' ? 'rotate-180 opacity-100 text-blue-600' : ''
                  }`}
                />
              </button>

              {activeDropdown === 'products' && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white/95 backdrop-blur-2xl border border-white/80 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    NexusCode Suite
                  </div>
                  <button
                    onClick={() => {
                      goToSection('features');
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-blue-50/70 text-slate-800 transition-colors flex items-start gap-3 group"
                  >
                    <span className="p-2 rounded-lg bg-blue-100/80 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Layers className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Visual Blueprint</p>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Line-by-line semantic breakdown
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      go('workspace');
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-indigo-50/70 text-slate-800 transition-colors flex items-start gap-3 group"
                  >
                    <span className="p-2 rounded-lg bg-indigo-100/80 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Deep Explainer</p>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        4-Layer WHAT, WHY, HOW, VERIFY
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      goToSection('playground');
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-emerald-50/70 text-slate-800 transition-colors flex items-start gap-3 group"
                  >
                    <span className="p-2 rounded-lg bg-emerald-100/80 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Zap className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Step Runtime</p>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Step-by-step memory &amp; variable trace
                      </p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Use Cases Dropdown */}
            <div className="relative">
              <button
                onClick={() =>
                  setActiveDropdown(activeDropdown === 'usecases' ? null : 'usecases')
                }
                className={`px-3 py-1.5 rounded-full flex items-center gap-1 transition-all ${
                  activeDropdown === 'usecases'
                    ? 'bg-slate-100/90 text-slate-950 font-semibold'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100/60'
                }`}
              >
                <span>Use Cases</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${
                    activeDropdown === 'usecases' ? 'rotate-180 opacity-100 text-blue-600' : ''
                  }`}
                />
              </button>

              {activeDropdown === 'usecases' && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white/95 backdrop-blur-2xl border border-white/80 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Solutions by Role
                  </div>
                  <button
                    onClick={() => goToSection('lessons')}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 text-slate-800 transition-colors flex items-start gap-3"
                  >
                    <GraduationCap className="w-4 h-4 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Beginner Programmers</p>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Learn Python with plain-language explanations
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => go('workspace')}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 text-slate-800 transition-colors flex items-start gap-3"
                  >
                    <Compass className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Code Architecture</p>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Understand complex scripts and algorithms fast
                      </p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Solutions / Features direct link */}
            <button
              onClick={() => goToSection('features')}
              className="px-3 py-1.5 rounded-full text-slate-700 hover:text-slate-950 hover:bg-slate-100/60 transition-colors"
            >
              Solutions
            </button>

            {/* Quick Actions Dropdown */}
            <div className="relative">
              <button
                onClick={() =>
                  setActiveDropdown(activeDropdown === 'actions' ? null : 'actions')
                }
                className={`px-3 py-1.5 rounded-full flex items-center gap-1 transition-all ${
                  activeDropdown === 'actions'
                    ? 'bg-slate-100/90 text-slate-950 font-semibold'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100/60'
                }`}
              >
                <span>Quick Actions</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${
                    activeDropdown === 'actions' ? 'rotate-180 opacity-100 text-blue-600' : ''
                  }`}
                />
              </button>

              {activeDropdown === 'actions' && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white/95 backdrop-blur-2xl border border-white/80 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={() => go('workspace')}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-blue-50 text-slate-800 transition-colors flex items-center gap-2.5"
                  >
                    <Code className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900">Launch Online Editor</span>
                  </button>
                  <button
                    onClick={() => goToSection('playground')}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-blue-50 text-slate-800 transition-colors flex items-center gap-2.5"
                  >
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-slate-900">Try Interactive Demo</span>
                  </button>
                  <button
                    onClick={() => goToSection('lessons')}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-blue-50 text-slate-800 transition-colors flex items-center gap-2.5"
                  >
                    <BookOpen className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-bold text-slate-900">Browse Lessons</span>
                  </button>
                </div>
              )}
            </div>

            {/* Learn & Support Dropdown */}
            <div className="relative">
              <button
                onClick={() =>
                  setActiveDropdown(activeDropdown === 'support' ? null : 'support')
                }
                className={`px-3 py-1.5 rounded-full flex items-center gap-1 transition-all ${
                  activeDropdown === 'support'
                    ? 'bg-slate-100/90 text-slate-950 font-semibold'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100/60'
                }`}
              >
                <span>Learn &amp; Support</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${
                    activeDropdown === 'support' ? 'rotate-180 opacity-100 text-blue-600' : ''
                  }`}
                />
              </button>

              {activeDropdown === 'support' && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white/95 backdrop-blur-2xl border border-white/80 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={() => go('docs')}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 text-slate-800 transition-colors flex items-center gap-2.5"
                  >
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900">Documentation &amp; API</span>
                  </button>
                  <button
                    onClick={() => goToSection('faq')}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 text-slate-800 transition-colors flex items-center gap-2.5"
                  >
                    <HelpCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900">Frequently Asked Questions</span>
                  </button>
                  <button
                    onClick={() => go('docs')}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 text-slate-800 transition-colors flex items-center gap-2.5"
                  >
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-900">Privacy &amp; Security</span>
                  </button>
                </div>
              )}
            </div>

            {/* Plans / Pricing */}
            <button
              onClick={() => go('pricing')}
              className={`px-3 py-1.5 rounded-full transition-all ${
                currentView === 'pricing'
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100/60'
              }`}
            >
              Plans
            </button>
          </nav>

          {/* ─── RIGHT CONTROLS: 9-Dots Launcher + Sign In Pill + CTA ─── */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* 9-Dots App Launcher Icon (Exact Adobe / Google style) */}
            <div className="relative hidden sm:flex" ref={appsMenuRef}>
              <button
                onClick={() => setAppsMenuOpen((v) => !v)}
                title="NexusCode Apps &amp; Quick Tools"
                aria-label="Apps menu"
                aria-expanded={appsMenuOpen}
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 transition-colors cursor-pointer focus:outline-hidden"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="5" cy="5" r="2" />
                  <circle cx="12" cy="5" r="2" />
                  <circle cx="19" cy="5" r="2" />
                  <circle cx="5" cy="12" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="19" cy="12" r="2" />
                  <circle cx="5" cy="19" r="2" />
                  <circle cx="12" cy="19" r="2" />
                  <circle cx="19" cy="19" r="2" />
                </svg>
              </button>

              {appsMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white/95 backdrop-blur-2xl border border-white/80 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    NexusCode Apps
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => go('workspace')}
                      className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-left transition-colors group"
                    >
                      <Code className="w-5 h-5 text-blue-600 mb-1 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold text-slate-900">Editor</p>
                      <p className="text-[10px] text-slate-500">Code &amp; explain</p>
                    </button>
                    <button
                      onClick={() => go('dashboard')}
                      className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 text-left transition-colors group"
                    >
                      <LayoutDashboard className="w-5 h-5 text-indigo-600 mb-1 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold text-slate-900">Projects</p>
                      <p className="text-[10px] text-slate-500">Saved workspaces</p>
                    </button>
                    <button
                      onClick={() => goToSection('lessons')}
                      className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 text-left transition-colors group"
                    >
                      <GraduationCap className="w-5 h-5 text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold text-slate-900">Lessons</p>
                      <p className="text-[10px] text-slate-500">Interactive curriculum</p>
                    </button>
                    <button
                      onClick={() => go('pricing')}
                      className="p-3 rounded-xl bg-slate-50 hover:bg-purple-50 text-left transition-colors group"
                    >
                      <Sparkles className="w-5 h-5 text-purple-600 mb-1 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold text-slate-900">Pro · early access</p>
                      <p className="text-[10px] text-slate-500">Join the list</p>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile or Sign in Pill (Adobe rounded-full outline style) */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  className="flex items-center gap-2 py-1 pl-1 pr-2.5 rounded-full hover:bg-slate-100/80 transition-colors border border-slate-200/80 bg-white/60"
                >
                  <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center shadow-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-800 max-w-[100px] truncate hidden sm:inline">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/80 p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                      <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 font-semibold uppercase">
                          {user.plan}
                        </span>
                        <span className="text-slate-500">
                          {quota?.remaining ?? 20} AI Insights left
                        </span>
                      </div>
                    </div>
                    <button
                      role="menuitem"
                      onClick={() => go('workspace')}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm text-slate-700 hover:bg-slate-100/80 flex items-center gap-2.5 font-medium"
                    >
                      <Code className="w-4 h-4 text-blue-600" /> Open workspace
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => go('dashboard')}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm text-slate-700 hover:bg-slate-100/80 flex items-center gap-2.5 font-medium"
                    >
                      <LayoutDashboard className="w-4 h-4 text-blue-600" /> My projects
                    </button>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      role="menuitem"
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-medium"
                    >
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="hidden sm:inline-block rounded-full border border-slate-300 hover:border-slate-400 bg-white/70 hover:bg-white text-slate-900 px-4 sm:px-5 py-1.5 text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                Sign in
              </button>
            )}

            {/* Primary Action Button */}
            <button
              onClick={() => go('workspace')}
              className="rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold px-3 py-1.5 sm:px-5 sm:py-1.5 shadow-sm shadow-blue-600/25 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <span>{user ? 'Workspace' : 'Start free'}</span>
              <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              className="lg:hidden p-1.5 sm:p-2 rounded-full text-slate-700 hover:bg-slate-100/80 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ─── MOBILE DRAWER (Glassmorphic) ─── */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 pointer-events-auto transition-opacity"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="lg:hidden fixed inset-x-3 top-16 sm:top-20 bg-white/95 backdrop-blur-2xl border border-white/80 rounded-3xl shadow-2xl overflow-hidden p-4 sm:p-5 z-50 pointer-events-auto max-h-[85vh] overflow-y-auto animate-in fade-in slide-in-from-top-3 duration-200">
            <nav className="flex flex-col gap-1 text-slate-800" aria-label="Mobile">
              {/* Quick App Shortcuts Grid */}
              <div className="grid grid-cols-2 gap-2 pb-3 mb-2 border-b border-slate-100">
                <button
                  onClick={() => go('workspace')}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-left transition-colors flex items-center gap-2.5"
                >
                  <Code className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Editor</p>
                    <p className="text-[10px] text-slate-500">Code & explain</p>
                  </div>
                </button>
                <button
                  onClick={() => go('dashboard')}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 text-left transition-colors flex items-center gap-2.5"
                >
                  <LayoutDashboard className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Projects</p>
                    <p className="text-[10px] text-slate-500">Saved code</p>
                  </div>
                </button>
                <button
                  onClick={() => goToSection('lessons')}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-left transition-colors flex items-center gap-2.5"
                >
                  <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Lessons</p>
                    <p className="text-[10px] text-slate-500">Interactive track</p>
                  </div>
                </button>
                <button
                  onClick={() => go('pricing')}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-purple-50 text-left transition-colors flex items-center gap-2.5"
                >
                  <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Pro · early access</p>
                    <p className="text-[10px] text-slate-500">Join the list</p>
                  </div>
                </button>
              </div>

              <button
                onClick={() => goToSection('features')}
                className="text-left px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-100/80 transition-colors"
              >
                Products &amp; Features
              </button>
              <button
                onClick={() => goToSection('playground')}
                className="text-left px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-100/80 transition-colors"
              >
                Interactive Playground
              </button>
              <button
                onClick={() => goToSection('how-it-works')}
                className="text-left px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-100/80 transition-colors"
              >
                How It Works
              </button>
              <button
                onClick={() => goToSection('lessons')}
                className="text-left px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-100/80 transition-colors"
              >
                Lessons &amp; Tutorials
              </button>
              <button
                onClick={() => go('pricing')}
                className="text-left px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-100/80 transition-colors"
              >
                Plans &amp; Pricing
              </button>
              <button
                onClick={() => go('docs')}
                className="text-left px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-100/80 transition-colors"
              >
                Documentation
              </button>

              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
                <button
                  onClick={() => go('workspace')}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 text-white font-semibold py-2.5 shadow-md shadow-blue-600/20 active:scale-95 transition-all text-sm"
                >
                  {user ? 'Open workspace' : 'Start coding free'} <ArrowRight className="w-4 h-4" />
                </button>
                {!user ? (
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      openAuthModal('login');
                    }}
                    className="w-full rounded-full border border-slate-300 text-slate-800 font-semibold py-2.5 bg-white hover:bg-slate-50 active:scale-95 transition-all text-sm"
                  >
                    Sign in
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      logout();
                    }}
                    className="w-full rounded-full border border-rose-200 text-rose-600 font-semibold py-2.5 bg-rose-50/50 hover:bg-rose-50 active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Sign out ({user.name})
                  </button>
                )}
              </div>
            </nav>
          </div>
        </>
      )}
    </header>
  );
};
