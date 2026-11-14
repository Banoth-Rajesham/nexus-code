import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Code,
  Sparkles,
  Trash2,
  ExternalLink,
  Settings,
  CheckCircle2,
  Globe,
  ArrowRight,
  BookOpen,
  Layers,
} from 'lucide-react';
import { Project, SUPPORTED_NATIVE_LANGUAGES } from '../types';

interface DashboardPageProps {
  onNavigate: (view: string, data?: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user, token, quota, updateSettings, logout, openAuthModal } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [langInput, setLangInput] = useState(user?.defaultLanguage || 'english');
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;

    fetchProjects();
  }, [token]);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/v1/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this saved project?')) return;
    try {
      const res = await fetch(`/api/v1/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error('Delete project failed:', err);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await updateSettings(nameInput, langInput);
    if (res.success) {
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 2500);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Permanently delete your NexusCode account and all saved projects? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/v1/auth/account', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        logout();
        onNavigate('landing');
      }
    } catch (err) {
      console.error('Account deletion failed:', err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-md text-center border border-[#E1DFDD] shadow-sm">
          <div className="w-12 h-12 rounded-sm bg-[#EBF3FC] text-[#0078D4] flex items-center justify-center mx-auto mb-4 font-bold text-xl border border-[#0078D4]/20">
            భ
          </div>
          <h2 className="text-xl font-bold text-[#242424]">Sign in to Microsoft 365</h2>
          <p className="text-xs text-[#616161] mt-1.5 mb-6">
            Sign in to access your saved algorithms, quota tracking, and personal multilingual learning history.
          </p>
          <button
            onClick={() => openAuthModal('login')}
            className="w-full py-2.5 px-4 rounded-[4px] bg-[#0067B8] hover:bg-[#005A9E] text-white font-semibold text-xs shadow-2xs transition-colors"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  const currentLang = SUPPORTED_NATIVE_LANGUAGES.find((l) => l.key === user.defaultLanguage);
  const quotaUsed = quota?.used ?? user.dailyUsageCount ?? 0;
  const quotaLimit = quota?.limit ?? (user.plan === 'pro' ? 200 : 20);
  const quotaRemaining = quota?.remaining ?? Math.max(0, quotaLimit - quotaUsed);
  const quotaPercent = Math.min(100, Math.round((quotaUsed / quotaLimit) * 100));

  return (
    <div className="min-h-screen bg-[#F5F6F8] py-8 sm:py-12">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Welcome Header */}
        <div className="bg-white rounded-lg p-6 border border-[#E1DFDD] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#0067B8] uppercase tracking-wider mb-1.5">
              <span>{currentLang?.greeting || 'నమస్కారం'}</span>
              <span className="text-stone-300">·</span>
              <span>Student Learning Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#242424] tracking-tight">
              Welcome back, {user.name}
            </h1>
            <p className="text-xs sm:text-sm text-[#616161] mt-1">
              Your default explanation dialect is set to{' '}
              <strong className="text-[#242424] font-semibold">{currentLang?.native} ({currentLang?.english})</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('workspace')}
              className="py-2.5 px-5 rounded-[4px] bg-[#0067B8] hover:bg-[#005A9E] text-white font-semibold text-xs sm:text-sm shadow-2xs transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>New Code Explanation</span>
            </button>
          </div>
        </div>

        {/* Quota and Learning Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Quota Card */}
          <div className="bg-white rounded-lg p-6 border border-[#E1DFDD] shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-[#616161] uppercase tracking-wider">Daily AI Quota</span>
                <span className="px-2.5 py-0.5 rounded-sm bg-[#EBF3FC] text-[#0067B8] border border-[#0078D4]/20 text-[11px] font-semibold">
                  {user.plan.toUpperCase()} TIER
                </span>
              </div>

              <div className="flex items-baseline justify-between mb-2">
                <span className="text-3xl font-bold text-[#242424]">{quotaRemaining}</span>
                <span className="text-xs text-[#616161]">of {quotaLimit} remaining today</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#EDEBE9] h-2 rounded-full overflow-hidden mb-3">
                <div
                  className="bg-[#0067B8] h-full transition-all duration-500 rounded-full"
                  style={{ width: `${quotaPercent}%` }}
                />
              </div>
            </div>

            <p className="text-[11px] text-[#747474]">
              Quota resets at midnight UTC. Need higher capacity?{' '}
              <button onClick={() => onNavigate('pricing')} className="text-[#0067B8] font-semibold hover:underline">
                View Pro Plan
              </button>
            </p>
          </div>

          {/* Saved Projects Counter */}
          <div className="bg-white rounded-lg p-6 border border-[#E1DFDD] shadow-2xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-[#616161] uppercase tracking-wider block mb-4">
                Saved Projects
              </span>
              <div className="text-3xl font-bold text-[#242424] mb-1">
                {projects.length}
              </div>
              <p className="text-xs text-[#616161]">Algorithms and snippets preserved in your personal library.</p>
            </div>

            <button
              onClick={() => onNavigate('workspace')}
              className="mt-4 text-xs font-semibold text-[#0067B8] hover:underline flex items-center gap-1.5"
            >
              <span>Paste New Code Snippet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Learning Guide */}
          <div className="bg-[#EBF3FC] rounded-lg p-6 border border-[#0078D4]/20 shadow-2xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-[#0067B8] uppercase tracking-wider block mb-2">
                Pedagogy Tip
              </span>
              <h3 className="text-sm font-bold text-[#242424] mb-1">
                Active Bilingual Reading
              </h3>
              <p className="text-xs text-[#616161] leading-relaxed">
                When debugging recursive trees or two-pointer logic, read native line summaries aloud before writing the final code.
              </p>
            </div>

            <button
              onClick={() => onNavigate('docs')}
              className="mt-4 text-xs font-semibold text-[#0067B8] hover:underline flex items-center gap-1.5"
            >
              <span>Read Documentation Guides</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Saved Projects Library */}
        <div className="bg-white rounded-lg p-6 sm:p-8 border border-[#E1DFDD] shadow-2xs">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#E1DFDD]">
            <div>
              <h2 className="text-lg font-bold text-[#242424]">Your Saved Projects</h2>
              <p className="text-xs text-[#616161]">Access code, past translations, and notes anytime</p>
            </div>
            <button
              onClick={() => onNavigate('workspace')}
              className="py-1.5 px-3.5 rounded-[4px] bg-[#F5F6F8] hover:bg-stone-200 text-xs font-semibold text-[#242424] transition-colors border border-[#E1DFDD]"
            >
              + New Snippet
            </button>
          </div>

          {loadingProjects ? (
            <div className="py-12 text-center text-xs text-[#747474]">Loading your saved algorithms...</div>
          ) : projects.length === 0 ? (
            <div className="py-12 text-center max-w-sm mx-auto">
              <Code className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-[#242424]">No saved projects yet</h3>
              <p className="text-xs text-[#616161] mt-1 mb-4">
                When you paste code in the workspace and click "Save Project", it will appear here.
              </p>
              <button
                onClick={() => onNavigate('workspace')}
                className="py-2 px-4 rounded-[4px] bg-[#0067B8] hover:bg-[#005A9E] text-white text-xs font-semibold shadow-2xs transition-colors"
              >
                Open Workspace
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="p-4 rounded-md border border-[#E1DFDD] hover:border-[#0067B8] transition-colors bg-[#F5F6F8]/50 hover:bg-white shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono uppercase font-semibold text-[#0067B8] bg-white px-2 py-0.5 rounded-xs border border-[#E1DFDD]">
                        {proj.programmingLanguage}
                      </span>
                      <span className="text-[10px] text-[#747474]">
                        {new Date(proj.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-[#242424] mb-1.5 truncate">{proj.title}</h3>
                    <pre className="text-[11px] font-mono text-stone-700 bg-white p-2.5 rounded-sm border border-[#E1DFDD] line-clamp-3 mb-3">
                      {proj.code}
                    </pre>
                  </div>

                  <div className="pt-2.5 border-t border-[#E1DFDD] flex items-center justify-between">
                    <button
                      onClick={() => onNavigate('workspace', proj)}
                      className="text-xs font-semibold text-[#0067B8] hover:underline flex items-center gap-1"
                    >
                      <span>Open in Workspace</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => handleDeleteProject(proj.id)}
                      className="p-1 text-stone-400 hover:text-rose-600 transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account Settings */}
        <div className="bg-white rounded-lg p-6 sm:p-8 border border-[#E1DFDD] shadow-2xs">
          <div className="flex items-center gap-2 pb-4 mb-6 border-b border-[#E1DFDD]">
            <Settings className="w-4 h-4 text-[#747474]" />
            <h2 className="text-lg font-bold text-[#242424]">Account Settings & Preferences</h2>
          </div>

          {settingsSuccess && (
            <div className="mb-4 p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Your preferences have been updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleUpdateSettings} className="max-w-xl space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#242424] mb-1.5">Your Name</label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-[2px] border border-[#E1DFDD] focus:border-[#0067B8] outline-hidden bg-[#F5F6F8]/50 text-[#242424]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#242424] mb-1.5">Default Explanation Language</label>
              <select
                value={langInput}
                onChange={(e) => setLangInput(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-[2px] border border-[#E1DFDD] focus:border-[#0067B8] outline-hidden bg-[#F5F6F8]/50 text-[#242424]"
              >
                {SUPPORTED_NATIVE_LANGUAGES.map((l) => (
                  <option key={l.key} value={l.key}>
                    {l.native} ({l.english})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="py-2.5 px-5 rounded-[4px] bg-[#0067B8] hover:bg-[#005A9E] text-white font-semibold text-xs shadow-2xs transition-colors"
            >
              Save Preferences
            </button>
          </form>

          {/* Account Deletion */}
          <div className="mt-8 pt-6 border-t border-[#E1DFDD] flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-rose-600">Delete Account</h4>
              <p className="text-[11px] text-[#747474]">
                Permanently remove your profile and all saved code snippets.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDeleteAccount}
              className="py-1.5 px-3 rounded-[2px] border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
