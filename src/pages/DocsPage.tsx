import React, { useState } from 'react';
import { BookOpen, CheckCircle2, Send, Globe, Terminal } from 'lucide-react';
import { SUPPORTED_NATIVE_LANGUAGES } from '../types';

export const DocsPage: React.FC = () => {
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackName || !feedbackEmail || !feedbackMessage) return;

    setSubmittingFeedback(true);
    try {
      const res = await fetch('/api/v1/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: feedbackName,
          email: feedbackEmail,
          message: feedbackMessage,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedbackStatus('Thank you! Your feedback has been received.');
        setFeedbackName('');
        setFeedbackEmail('');
        setFeedbackMessage('');
      } else {
        setFeedbackStatus(data.error || 'Failed to submit feedback.');
      }
    } catch {
      setFeedbackStatus('Network error. Please try again.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-12 sm:py-16 text-[#242424]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-[12px] font-semibold text-[#0067B8] uppercase tracking-wider mb-2 block">
            DOCUMENTATION & PEDAGOGY
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#242424] tracking-tight">
            How to Master Code with BhashaCode
          </h1>
          <p className="text-sm text-[#616161] mt-2.5">
            Step-by-step guides, cognitive learning science, standardized dialect glossaries, and academic resources.
          </p>
        </div>

        {/* Guide 1: Cognitive Science */}
        <div className="bg-white rounded-lg p-6 sm:p-8 border border-[#E1DFDD] shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0078D4] uppercase tracking-wider mb-2.5">
            <BookOpen className="w-4 h-4" />
            <span>LEARNING SCIENCE</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#242424] mb-3">
            Why Learning in Your Mother Tongue Accelerates Concept Mastery
          </h2>
          <div className="prose text-xs sm:text-sm text-[#616161] leading-relaxed space-y-3">
            <p>
              In conventional programming education across India and South Asia, students must navigate two simultaneous cognitive hurdles: comprehending abstract computational logic (loops, state mutations, recursive calls) and deciphering dense English technical syntax.
            </p>
            <p>
              Cognitive load theory shows that working memory is quickly saturated by unfamiliar vocabulary. By mapping the <em>execution semantics</em> directly into your native language (e.g. Telugu, Hindi, Tamil, Kannada), your brain binds algorithmic flow to deep-seated linguistic intuition. Technical terms (such as <code>variable</code>, <code>array</code>, <code>pointer</code>, <code>function</code>) are deliberately preserved in English alongside native transliterations so you remain fully confident in technical interviews.
            </p>
          </div>
        </div>

        {/* Guide 2: Step-by-Step Workflow */}
        <div className="bg-white rounded-lg p-6 sm:p-8 border border-[#E1DFDD] shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0078D4] uppercase tracking-wider mb-2.5">
            <Terminal className="w-4 h-4" />
            <span>HOW TO USE</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#242424] mb-6">
            Step-by-Step: From Pasted Code to Clear Mental Models
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-md bg-[#F5F6F8] border border-[#E1DFDD]">
              <div className="w-7 h-7 rounded-sm bg-[#0067B8] text-white flex items-center justify-center font-bold text-xs mb-3 shadow-2xs">
                1
              </div>
              <h3 className="text-sm font-bold text-[#242424] mb-1.5">Paste or Write Code</h3>
              <p className="text-xs text-[#616161] leading-relaxed">
                Paste any problem snippet from your college lab assignment, LeetCode, or textbook. Choose your programming language (Python, Java, C++, TypeScript, Go, etc.).
              </p>
            </div>

            <div className="p-5 rounded-md bg-[#F5F6F8] border border-[#E1DFDD]">
              <div className="w-7 h-7 rounded-sm bg-[#0078D4] text-white flex items-center justify-center font-bold text-xs mb-3 shadow-2xs">
                2
              </div>
              <h3 className="text-sm font-bold text-[#242424] mb-1.5">Select Your Mother Tongue</h3>
              <p className="text-xs text-[#616161] leading-relaxed">
                Choose Telugu, Hindi, Tamil, Kannada, Marathi, Bengali, Gujarati, or English. Click <strong>"Explain Code"</strong> or <strong>"Debug Code"</strong> to run analysis.
              </p>
            </div>

            <div className="p-5 rounded-md bg-[#F5F6F8] border border-[#E1DFDD]">
              <div className="w-7 h-7 rounded-sm bg-[#242424] text-white flex items-center justify-center font-bold text-xs mb-3 shadow-2xs">
                3
              </div>
              <h3 className="text-sm font-bold text-[#242424] mb-1.5">Inspect & Ask Questions</h3>
              <p className="text-xs text-[#616161] leading-relaxed">
                Click code lines to inspect step-by-step behavior, switch to intuitive Simple Logic metaphors, or run test cases live in the browser sandbox.
              </p>
            </div>
          </div>
        </div>

        {/* Matrix of Supported Dialects */}
        <div className="bg-white rounded-lg p-6 sm:p-8 border border-[#E1DFDD] shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0078D4] uppercase tracking-wider mb-2.5">
            <Globe className="w-4 h-4" />
            <span>LANGUAGE STANDARDS</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#242424] mb-2">
            Language Translation Standards
          </h2>
          <p className="text-xs text-[#616161] mb-6">
            Our translation engine adheres to standardized technical vocabulary guidelines formulated in collaboration with university educators:
          </p>

          <div className="overflow-x-auto rounded-md border border-[#E1DFDD]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F6F8] border-b border-[#E1DFDD] text-[#242424]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Concept</th>
                  <th className="py-3 px-4 font-semibold">Telugu (తెలుగు)</th>
                  <th className="py-3 px-4 font-semibold">Hindi (हिन्दी)</th>
                  <th className="py-3 px-4 font-semibold">Tamil (தமிழ்)</th>
                  <th className="py-3 px-4 font-semibold">Kannada (ಕನ್ನಡ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDEBE9] text-[#616161]">
                <tr className="hover:bg-stone-50/50">
                  <td className="py-3 px-4 font-mono font-medium text-[#242424]">Variable</td>
                  <td className="py-3 px-4">వేరియబుల్ (చరరాశి)</td>
                  <td className="py-3 px-4">चर (Variable)</td>
                  <td className="py-3 px-4">மாறி (Variable)</td>
                  <td className="py-3 px-4">ವೇರಿಯೇಬಲ್ (ಚರ)</td>
                </tr>
                <tr className="hover:bg-stone-50/50">
                  <td className="py-3 px-4 font-mono font-medium text-[#242424]">Loop</td>
                  <td className="py-3 px-4">లూప్ (ఆవర్తనం)</td>
                  <td className="py-3 px-4">लूप (चक्र)</td>
                  <td className="py-3 px-4">மடக்கு (Loop)</td>
                  <td className="py-3 px-4">ಲೂಪ್ (ಆವರ್ತನ)</td>
                </tr>
                <tr className="hover:bg-stone-50/50">
                  <td className="py-3 px-4 font-mono font-medium text-[#242424]">Condition</td>
                  <td className="py-3 px-4">షరతు (నిబంధన)</td>
                  <td className="py-3 px-4">शर्त (Condition)</td>
                  <td className="py-3 px-4">நிபந்தனை</td>
                  <td className="py-3 px-4">ಷರತ್ತು</td>
                </tr>
                <tr className="hover:bg-stone-50/50">
                  <td className="py-3 px-4 font-mono font-medium text-[#242424]">Function</td>
                  <td className="py-3 px-4">ఫంక్షన్ (ప్రమేయం)</td>
                  <td className="py-3 px-4">फंक्शन (कार्य)</td>
                  <td className="py-3 px-4">செயல்பாடு</td>
                  <td className="py-3 px-4">ಫಂಕ್ಷನ್ (ಕಾರ್ಯ)</td>
                </tr>
                <tr className="hover:bg-stone-50/50">
                  <td className="py-3 px-4 font-mono font-medium text-[#242424]">Array</td>
                  <td className="py-3 px-4">అరే (జాబితా / క్రమం)</td>
                  <td className="py-3 px-4">ऐरे (क्रमबद्ध सूची)</td>
                  <td className="py-3 px-4">அணி (Array)</td>
                  <td className="py-3 px-4">ಅರೇ (ಸರಣಿ)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Contact and Feedback Form */}
        <div className="bg-[#F5F6F8] rounded-lg p-6 sm:p-8 border border-[#E1DFDD] shadow-2xs">
          <div className="max-w-xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-[#242424] text-center mb-2">
              Send Feedback or Suggest a Dialect
            </h2>
            <p className="text-xs text-[#616161] text-center mb-6">
              Are you an educator or student? Tell us how BhashaCode can better serve your college or regional community.
            </p>

            {feedbackStatus && (
              <div className="mb-4 p-3 rounded-md bg-white border border-[#E1DFDD] text-xs font-medium text-[#242424] flex items-center gap-2 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{feedbackStatus}</span>
              </div>
            )}

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#242424] mb-1.5">Your Name</label>
                  <input
                    type="text"
                    required
                    value={feedbackName}
                    onChange={(e) => setFeedbackName(e.target.value)}
                    placeholder="e.g. Aditi Sharma"
                    className="w-full px-3.5 py-2 text-xs rounded-[2px] border border-[#E1DFDD] bg-white text-[#242424] outline-hidden focus:border-[#0067B8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#242424] mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={feedbackEmail}
                    onChange={(e) => setFeedbackEmail(e.target.value)}
                    placeholder="you@college.edu"
                    className="w-full px-3.5 py-2 text-xs rounded-[2px] border border-[#E1DFDD] bg-white text-[#242424] outline-hidden focus:border-[#0067B8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#242424] mb-1.5">Your Message or Suggestion</label>
                <textarea
                  required
                  rows={4}
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder="Share feedback on linguistic accuracy, dialect additions, or academic partnerships..."
                  className="w-full px-3.5 py-2 text-xs rounded-[2px] border border-[#E1DFDD] bg-white text-[#242424] outline-hidden focus:border-[#0067B8]"
                />
              </div>

              <button
                type="submit"
                disabled={submittingFeedback}
                className="py-2.5 px-6 rounded-[4px] bg-[#0067B8] hover:bg-[#005A9E] text-white text-xs font-semibold transition-colors shadow-2xs flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submittingFeedback ? 'Submitting...' : 'Submit Message'}</span>
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
