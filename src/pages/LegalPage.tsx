import React from 'react';
import { ArrowLeft } from 'lucide-react';

// ============================================================================
// Privacy Policy and Terms of Service.
// Written to match what the code actually does with data. Before launch,
// replace the [bracketed] placeholders and have the text reviewed by a lawyer.
// ============================================================================

const LAST_UPDATED = '19 November 2026';
const COMPANY = '[Company legal name]';
const CONTACT_EMAIL = '[support email address]';
const GRIEVANCE_OFFICER = '[Grievance officer name]';
const JURISDICTION = '[City], India';

interface Section {
  title: string;
  body: React.ReactNode;
}

const PRIVACY: Section[] = [
  {
    title: 'Who we are',
    body: (
      <p>
        NexusCode is operated by {COMPANY} ("we", "us"). This policy explains what information we collect when you use the website and
        workspace, why we collect it, and the choices you have. It is written to follow India's Digital Personal Data Protection Act, 2023.
      </p>
    ),
  },
  {
    title: 'Code you write and run',
    body: (
      <>
        <p>
          Code you type in the workspace and run with <strong>Run</strong> or step-by-step mode is executed <strong>in your own browser</strong>.
          It is not sent to our servers to be run.
        </p>
        <p>
          Some features do send your code to our server so it can be analysed: Explain Code, Simple Logic, Debug &amp; Fix, Convert Code and Ask AI.
          For Debug &amp; Fix, Convert Code and Ask AI, your code and question may be forwarded to Google's Gemini API to generate the answer, and
          are then subject to Google's terms. We do not store this code unless you save a project.
        </p>
      </>
    ),
  },
  {
    title: 'Information we collect',
    body: (
      <ul>
        <li>
          <strong>Account details</strong> (only if you create an account): your name, email address, preferred explanation language and plan.
          Your password is stored only as a salted, one-way hash — we never see or store the password itself.
        </li>
        <li>
          <strong>Saved projects</strong>: the title, code and explanation of projects you choose to save to your account.
        </li>
        <li>
          <strong>Messages you send us</strong>: name, email and message from the feedback, college enquiry and Pro early-access forms, and any
          "report wrong explanation" reports (which include the line of code concerned).
        </li>
        <li>
          <strong>Usage counters</strong>: how many AI Insights requests you used today, to apply the daily limit.
        </li>
        <li>
          <strong>Technical data</strong>: your IP address is used briefly to limit repeated requests and protect against abuse.
        </li>
      </ul>
    ),
  },
  {
    title: 'Stored in your browser',
    body: (
      <p>
        The workspace keeps your preferences (theme, layout, experience level), unsaved code, lesson progress and your sign-in token in your
        browser's local storage, so they survive a page refresh. Clearing your browser data removes them. We do not use advertising or
        tracking cookies.
      </p>
    ),
  },
  {
    title: 'Third-party services',
    body: (
      <ul>
        <li>Google Fonts (loads the fonts used on the site; your browser contacts Google to download them).</li>
        <li>Iconify (loads some interface icons).</li>
        <li>Google Gemini API (only for the AI features described above, when enabled).</li>
      </ul>
    ),
  },
  {
    title: 'How we use your information',
    body: (
      <p>
        To provide the service, keep your account secure, apply usage limits, reply to your messages, notify you when Pro opens if you joined
        the early-access list, and improve the accuracy of explanations. We do not sell your personal data and we do not show ads.
      </p>
    ),
  },
  {
    title: 'How long we keep it',
    body: (
      <p>
        Account details and saved projects are kept until you delete them or your account. Sign-in sessions expire after 7 days. Messages are
        kept as long as needed to respond and improve the product.
      </p>
    ),
  },
  {
    title: 'Your rights and choices',
    body: (
      <p>
        You can update your name and language in your account, delete individual projects, and permanently delete your account and all saved
        projects from the <em>My projects</em> page. You can also ask us to access, correct or erase your data, or withdraw consent, by contacting
        us below.
      </p>
    ),
  },
  {
    title: 'Children',
    body: (
      <p>
        If you are under 18, please use NexusCode with the consent of a parent or guardian. We do not knowingly collect more information from
        children than is needed to provide the service.
      </p>
    ),
  },
  {
    title: 'Contact and grievances',
    body: (
      <p>
        Questions or complaints about your data: {CONTACT_EMAIL}. Grievance officer: {GRIEVANCE_OFFICER}, {COMPANY}. You can also use the
        feedback form on the website.
      </p>
    ),
  },
];

const TERMS: Section[] = [
  {
    title: 'Agreement',
    body: (
      <p>
        By using NexusCode, operated by {COMPANY}, you agree to these terms. If you do not agree, please do not use the service.
      </p>
    ),
  },
  {
    title: 'The service',
    body: (
      <p>
        NexusCode is a learning tool that runs, visualises and explains code. Explanations are generated automatically and are meant to help
        you learn; they may occasionally be incomplete or wrong. Always review important code yourself.
      </p>
    ),
  },
  {
    title: 'Accounts',
    body: (
      <p>
        You can use the workspace without an account. If you create one, keep your password safe and give accurate information. You are
        responsible for activity under your account.
      </p>
    ),
  },
  {
    title: 'Acceptable use',
    body: (
      <ul>
        <li>Do not use the service to write, test or distribute malware, or to attack other systems.</li>
        <li>Do not try to break, overload or bypass the limits and security of the service.</li>
        <li>Do not submit content that is illegal or that you do not have the right to share.</li>
      </ul>
    ),
  },
  {
    title: 'Your content',
    body: (
      <p>
        You keep all rights to the code you write. You allow us to store and process it only as needed to provide the features you use, as
        described in the Privacy Policy.
      </p>
    ),
  },
  {
    title: 'Free plan and Pro early access',
    body: (
      <p>
        The Free plan is provided at no cost. Pro is currently in early access: joining the list does not charge you or commit you to buy.
        Prices and features shown for Pro may change before launch. Paid plans, when available, will have their own billing terms that you
        accept at checkout.
      </p>
    ),
  },
  {
    title: 'Availability and changes',
    body: (
      <p>
        We work to keep the service available but cannot promise it will be uninterrupted or error-free. We may change or discontinue
        features, and we will update these terms when needed.
      </p>
    ),
  },
  {
    title: 'Disclaimer and liability',
    body: (
      <p>
        The service is provided "as is". To the extent permitted by law, {COMPANY} is not liable for indirect or consequential losses arising
        from use of the service.
      </p>
    ),
  },
  {
    title: 'Ending use',
    body: (
      <p>
        You can stop using the service and delete your account at any time. We may suspend accounts that break these terms.
      </p>
    ),
  },
  {
    title: 'Governing law',
    body: <p>These terms are governed by the laws of India. Courts in {JURISDICTION} have jurisdiction.</p>,
  },
  {
    title: 'Contact',
    body: <p>Questions about these terms: {CONTACT_EMAIL}.</p>,
  },
];

interface LegalPageProps {
  page: 'privacy' | 'terms';
  onNavigate: (view: string) => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ page, onNavigate }) => {
  const isPrivacy = page === 'privacy';
  const sections = isPrivacy ? PRIVACY : TERMS;
  return (
    <div className="bg-white">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <button onClick={() => onNavigate('landing')} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </button>
        <h1 className="mt-6 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">{isPrivacy ? 'Privacy Policy' : 'Terms of Service'}</h1>
        <p className="mt-2 text-sm text-slate-600">Last updated: {LAST_UPDATED}</p>

        <nav aria-label="Contents" className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">On this page</p>
          <ol className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            {sections.map((s, i) => (
              <li key={s.title}>
                <a href={`#section-${i}`} className="text-blue-700 hover:underline">
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-10">
          {sections.map((s, i) => (
            <section key={s.title} id={`section-${i}`} className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-slate-900">
                {i + 1}. {s.title}
              </h2>
              <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-slate-700 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_strong]:text-slate-900">
                {s.body}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-14 pt-6 border-t border-slate-200 text-sm text-slate-600">
          See also the{' '}
          <button onClick={() => onNavigate(isPrivacy ? 'terms' : 'privacy')} className="font-medium text-blue-700 hover:underline">
            {isPrivacy ? 'Terms of Service' : 'Privacy Policy'}
          </button>
          .
        </p>
      </article>
    </div>
  );
};
