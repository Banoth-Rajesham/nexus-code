import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  ArrowRight,
  Play,
  Search,
  Star,
  CheckCircle2,
  Code2,
  Globe,
  Terminal,
  Layers,
  BookOpen,
  ChevronDown,
  Brain,
  Bug,
  Repeat,
  ShieldCheck,
  Check,
  MessageSquare,
  Mail,
  Calendar,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { SUPPORTED_NATIVE_LANGUAGES, NativeLanguageKey } from '../types';

interface LandingPageProps {
  onNavigate: (view: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { user, openAuthModal } = useAuth();

  // Mini-sandbox interactive demo state
  const [selectedDemoLang, setSelectedDemoLang] = useState<NativeLanguageKey>('telugu');
  const [selectedDemoCodeSnippet, setSelectedDemoCodeSnippet] = useState<'loop' | 'search' | 'array'>('loop');

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Outlook-style Feedback modal state
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'smile' | 'frown' | 'idea'>('smile');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // High-res banner lightbox state
  const [bannerZoomed, setBannerZoomed] = useState(false);

  const demoSnippets = {
    loop: {
      prog: 'Python',
      code: `numbers = [10, 20, 30, 40]
total = 0
for n in numbers:
    total += n
print("Sum:", total)`,
      explanations: {
        telugu: [
          { line: '1', expl: '4 సంఖ్యలు ఉన్న లిస్ట్ (జాబితా) ను డిఫైన్ చేశాము.' },
          { line: '2', expl: 'మొత్తం నిల్వ చేయడానికి `total` ను 0 తో ప్రారంభించాము.' },
          { line: '3', expl: 'ఫర్ లూప్ (for loop) — లిస్ట్‌లోని ప్రతి సంఖ్యను వరుసగా తీసుకుంటుంది.' },
          { line: '4', expl: 'ప్రతి సంఖ్యను `total` కు కూడుతూ నిల్వ చేస్తుంది.' },
          { line: '5', expl: 'అంతిమ ఫలితాన్ని స్క్రీన్ పై ముద్రిస్తుంది.' },
        ],
        hindi: [
          { line: '1', expl: '4 संख्याओं की सूची (List) बनाई गई है।' },
          { line: '2', expl: 'कुल योग के लिए `total` चर को 0 से शुरू किया।' },
          { line: '3', expl: 'फॉर लूप (For loop) — सूची की प्रत्येक संख्या को क्रमिक रूप से लेता है।' },
          { line: '4', expl: 'प्रत्येक संख्या को `total` में जोड़ता है।' },
          { line: '5', expl: 'अंतिम परिणाम स्क्रीन पर प्रिंट करता है।' },
        ],
        tamil: [
          { line: '1', expl: '4 எண்கள் கொண்ட பட்டியல் (List) உருவாக்கப்பட்டுள்ளது.' },
          { line: '2', expl: 'கூட்டுத்தொகைக்கு `total` மாறியை 0 ஆக வைக்கிறோம்.' },
          { line: '3', expl: 'ஃபார் லூப் — ஒவ்வொரு எண்ணையும் வரிசையாக எடுக்கிறது.' },
          { line: '4', expl: 'ஒவ்வொரு எண்ணையும் `total` உடன் கூட்டுகிறது.' },
          { line: '5', expl: 'இறுதி கூட்டுத்தொகையை திரையில் காட்டுகிறது.' },
        ],
        kannada: [
          { line: '1', expl: '4 ಸಂಖ್ಯೆಗಳಿರುವ ಪಟ್ಟಿಯನ್ನು (List) ರಚಿಸಲಾಗಿದೆ.' },
          { line: '2', expl: 'ಒಟ್ಟು ಮೊತ್ತವನ್ನು ಎಣಿಸಲು `total` ವೇರಿಯೇಬಲ್ ಅನ್ನು 0 ಗೆ ನಿಗದಿಪಡಿಸಲಾಗಿದೆ.' },
          { line: '3', expl: 'ಫಾರ್ ಲೂಪ್ — ಪಟ್ಟಿಯಲ್ಲಿನ ಪ್ರತಿ ಸಂಖ್ಯೆಯನ್ನು ಕ್ರಮವಾಗಿ ತೆಗೆದುಕೊಳ್ಳುತ್ತದೆ.' },
          { line: '4', expl: 'ಪ್ರತಿ ಸಂಖ್ಯೆಯನ್ನು `total` ಗೆ ಕೂಡಿಸುತ್ತದೆ.' },
          { line: '5', expl: 'ಅಂತಿಮ ಮೊತ್ತವನ್ನು ಪ್ರದರ್ಶಿಸುತ್ತದೆ.' },
        ],
        english: [
          { line: '1', expl: 'Defines an array list containing four integers.' },
          { line: '2', expl: 'Initializes accumulator variable `total` to zero.' },
          { line: '3', expl: 'Iterates through each element `n` in the `numbers` list.' },
          { line: '4', expl: 'Accumulates each element into `total`.' },
          { line: '5', expl: 'Prints the calculated sum to standard output.' },
        ],
        marathi: [
          { line: '1', expl: '4 संख्यांची यादी (List) तयार केली आहे.' },
          { line: '2', expl: 'एकूण बेरीज मोजण्यासाठी `total` व्हेरिएबल 0 ने सुरू केला.' },
          { line: '3', expl: 'फॉर लूप — यादीतील प्रत्येक संख्या क्रमाने घेतो.' },
          { line: '4', expl: 'प्रत्येक संख्या `total` मध्ये जोडतो.' },
          { line: '5', expl: 'अंतिम बेरीज स्क्रीनवर दाखवतो.' },
        ],
        bengali: [
          { line: '1', expl: '৪টি সংখ্যা সমন্বিত একটি তালিকা (List) তৈরি করা হয়েছে।' },
          { line: '2', expl: 'যোগফল গণনা করার জন্য `total` চলক ০ দিয়ে শুরু করা হয়েছে।' },
          { line: '3', expl: 'ফর লুপ — তালিকার প্রতিটি সংখ্যা একে একে গ্রহণ করে।' },
          { line: '4', expl: 'প্রতিটি সংখ্যা `total` এ যোগ করা হচ্ছে।' },
          { line: '5', expl: 'চূড়ান্ত যোগফল পর্দায় প্রিন্ট করে।' },
        ],
        gujarati: [
          { line: '1', expl: '4 સંખ્યાઓ ધરાવતી એક યાદી (List) બનાવી છે.' },
          { line: '2', expl: 'કુલ સરવાળા માટે `total` વેરિયેબલ 0 થી શરૂ કર્યો.' },
          { line: '3', expl: 'ફોર લૂપ — યાદીની દરેક સંખ્યા ક્રમશઃ લે છે.' },
          { line: '4', expl: 'દરેક સંખ્યાને `total` માં ઉમેરે છે.' },
          { line: '5', expl: 'અંતિમ સરવાળો સ્ક્રીન પર દર્શાવે છે.' },
        ],
      },
    },
    search: {
      prog: 'Python',
      code: `def check_even(n):
    if n % 2 == 0:
        return True
    return False

result = check_even(42)
print("Is even:", result)`,
      explanations: {
        telugu: [
          { line: '1', expl: '`check_even` అనే ఫంక్షన్‌ను డిఫైన్ చేసాము.' },
          { line: '2', expl: 'సంఖ్యను 2 తో భాగించినప్పుడు శేషం 0 అయితే సరిసంఖ్య (Even).' },
          { line: '3', expl: 'సరిసంఖ్య అయితే `True` ను రిటర్న్ చేస్తుంది.' },
          { line: '4', expl: 'లేకపోతే బేసిసంఖ్య కాబట్టి `False` ను రిటర్న్ చేస్తుంది.' },
          { line: '5', expl: 'ఫంక్షన్‌ను 42 తో కాల్ చేసి ఫలితాన్ని ముద్రిస్తుంది.' },
        ],
        hindi: [
          { line: '1', expl: '`check_even` नामक एक फ़ंक्शन परिभाषित किया गया है।' },
          { line: '2', expl: 'यदि संख्या को 2 से भाग देने पर शेषफल 0 बचता है (Even)।' },
          { line: '3', expl: 'सम संख्या होने पर `True` लौटाता है।' },
          { line: '4', expl: 'अन्यथा विषम संख्या होने पर `False` लौटाता है।' },
          { line: '5', expl: '42 के साथ फ़ंक्शन कॉल करके परिणाम प्रिंट करता है।' },
        ],
        tamil: [
          { line: '1', expl: '`check_even` என்ற செயல்பாடு வரையறுக்கப்பட்டுள்ளது.' },
          { line: '2', expl: 'எண்ணை 2 ஆல் வகுக்கும் போது மீதி 0 என்றால் அது இரட்டை எண்.' },
          { line: '3', expl: 'இரட்டை எண்ணாக இருந்தால் `True` என வழங்கும்.' },
          { line: '4', expl: 'இல்லையெனில் `False` என வழங்கும்.' },
          { line: '5', expl: '42 உடன் செயல்பாட்டை இயக்கி முடிவை திரையிடுகிறது.' },
        ],
        kannada: [
          { line: '1', expl: '`check_even` ಹೆಸರಿನ ಫಂಕ್ಷನ್ ರಚಿಸಲಾಗಿದೆ.' },
          { line: '2', expl: 'ಸಂಖ್ಯೆಯನ್ನು 2 ರಿಂದ ಭಾಗಿಸಿದಾಗ ಶೇಷ 0 ಬಂದರೆ ಸಮ ಸಂಖ್ಯೆ.' },
          { line: '3', expl: 'ಸಮ ಸಂಖ್ಯೆಯಾಗಿದ್ದರೆ `True` ಹಿಂತಿರುಗಿಸುತ್ತದೆ.' },
          { line: '4', expl: 'ಇಲ್ಲವಾದರೆ `False` ಹಿಂತಿರುಗಿಸುತ್ತದೆ.' },
          { line: '5', expl: '42 ಸಂಖ್ಯೆಯೊಂದಿಗೆ ಪರಿಶೀಲಿಸಿ ಫಲಿತಾಂಶ ನೀಡುತ್ತದೆ.' },
        ],
        english: [
          { line: '1', expl: 'Declares a helper function `check_even`.' },
          { line: '2', expl: 'Evaluates modulo operator `% 2 == 0` for parity.' },
          { line: '3', expl: 'Returns boolean `True` for even inputs.' },
          { line: '4', expl: 'Returns boolean `False` for odd numbers.' },
          { line: '5', expl: 'Invokes function with 42 and prints result.' },
        ],
        marathi: [
          { line: '1', expl: '`check_even` फंक्शन तयार केले आहे.' },
          { line: '2', expl: 'संख्येला 2 ने भागल्यावर बाकी 0 उरल्यास सम संख्या (Even).' },
          { line: '3', expl: 'सम असल्यास `True` परत करतो.' },
          { line: '4', expl: 'नाहीतर `False` परत करतो.' },
          { line: '5', expl: '42 तपासून निकाल दाखवतो.' },
        ],
        bengali: [
          { line: '1', expl: '`check_even` নামক ফাংশন তৈরি করা হয়েছে।' },
          { line: '2', expl: 'সংখ্যাটিকে ২ দিয়ে ভাগ করলে ভাগশেষ ০ হলে জোড় সংখ্যা।' },
          { line: '3', expl: 'জোড় হলে `True` রিটার্ন করে।' },
          { line: '4', expl: 'নতুবা `False` রিটার্ন করে।' },
          { line: '5', expl: '৪২ দিয়ে ফাংশন চালিয়ে ফলাফল প্রিন্ট করে।' },
        ],
        gujarati: [
          { line: '1', expl: '`check_even` નામનું ફંક્શન વ્યાખ્યાયિત કર્યું છે.' },
          { line: '2', expl: 'સંખ્યાને 2 વડે ભાગતા શેષ 0 વધે તો તે બેકી સંખ્યા (Even) છે.' },
          { line: '3', expl: 'બેકી સંખ્યા હોય તો `True` રિટર્ન કરે છે.' },
          { line: '4', expl: 'નહીંતર `False` રિટર્ન કરે છે.' },
          { line: '5', expl: '42 સાથે ફંક્શન ચલાવી પરિણામ દર્શાવે છે.' },
        ],
      },
    },
    array: {
      prog: 'JavaScript',
      code: `const scores = [88, 92, 79, 95];
const topScores = scores.filter(s => s >= 90);
console.log("Top scores:", topScores);`,
      explanations: {
        telugu: [
          { line: '1', expl: '4 విద్యార్థుల మార్కులతో కూడిన అర్రే (Array) ను సృష్టించాము.' },
          { line: '2', expl: '`.filter()` ద్వారా 90 లేదా అంతకంటే ఎక్కువ మార్కులు ఉన్నవాటిని మాత్రమే వేరు చేసాము.' },
          { line: '3', expl: 'ఫిల్టర్ చేసిన టాప్ మార్కులను కన్సోల్‌లో ముద్రిస్తుంది.' },
        ],
        hindi: [
          { line: '1', expl: '4 छात्रों के अंकों की एक Array बनाई गई है।' },
          { line: '2', expl: '`.filter()` का उपयोग करके केवल 90 या उससे अधिक अंक चुने गए हैं।' },
          { line: '3', expl: 'छाने गए शीर्ष अंकों को कंसोल में प्रदर्शित किया जा रहा है।' },
        ],
        tamil: [
          { line: '1', expl: '4 மாணவர்களின் மதிப்பெண்களைக் கொண்ட அணி (Array) உருவாக்கப்பட்டுள்ளது.' },
          { line: '2', expl: '`.filter()` மூலம் 90 அல்லது அதற்கு மேற்பட்ட மதிப்பெண்கள் மட்டும் தேர்ந்தெடுக்கப்படுகின்றன.' },
          { line: '3', expl: 'தேர்ந்தெடுக்கப்பட்ட மதிப்பெண்களை திரையில் காட்டுகிறது.' },
        ],
        kannada: [
          { line: '1', expl: '4 ವಿದ್ಯಾರ್ಥಿಗಳ ಅಂಕಗಳನ್ನು ಹೊಂದಿರುವ ಅರೇ (Array) ರಚಿಸಲಾಗಿದೆ.' },
          { line: '2', expl: '`.filter()` ಬಳಸಿ 90 ಅಥವಾ ಅದಕ್ಕಿಂತ ಹೆಚ್ಚಿನ ಅಂಕಗಳನ್ನು ಮಾತ್ರ ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ.' },
          { line: '3', expl: 'ಫಿಲ್ಟರ್ ಮಾಡಿದ ಉನ್ನತ ಅಂಕಗಳನ್ನು ಕನ್ಸೋಲ್‌ನಲ್ಲಿ ಪ್ರದರ್ಶಿಸಲಾಗುತ್ತಿದೆ.' },
        ],
        english: [
          { line: '1', expl: 'Defines an array of numeric test scores.' },
          { line: '2', expl: 'Applies higher-order `.filter()` to extract scores ≥ 90.' },
          { line: '3', expl: 'Logs qualifying top scores array to browser console.' },
        ],
        marathi: [
          { line: '1', expl: '4 विद्यार्थ्यांच्या गुणांची Array तयार केली आहे.' },
          { line: '2', expl: '`.filter()` वापरून फक्त 90 किंवा त्यापेक्षा जास्त गुण निवडले आहेत.' },
          { line: '3', expl: 'निवडलेले सर्वोत्तम गुण कन्सोलवर दाखवले जात आहेत.' },
        ],
        bengali: [
          { line: '1', expl: '৪ জন শিক্ষার্থীর নম্বর নিয়ে একটি Array তৈরি করা হয়েছে।' },
          { line: '2', expl: '`.filter()` ব্যবহার করে কেবল ৯০ বা তার বেশি নম্বর বাছাই করা হয়েছে।' },
          { line: '3', expl: 'বাছাই করা শীর্ষ নম্বরগুলি কনসোলে দেখানো হচ্ছে।' },
        ],
        gujarati: [
          { line: '1', expl: '4 વિદ્યાર્થીઓના ગુણ ધરાવતી એક Array બનાવી છે.' },
          { line: '2', expl: '`.filter()` ની મદદથી ફક્ત 90 કે તેથી વધુ ગુણ પસંદ કર્યા છે.' },
          { line: '3', expl: 'પસંદ કરેલા શ્રેષ્ઠ ગુણ કન્સોલ પર દર્શાવવામાં આવી રહ્યા છે.' },
        ],
      },
    },
  };

  const faqs = [
    {
      q: 'How do I get started with BhashaCode?',
      a: 'Sign up for free in seconds. You can immediately paste Python, Java, C++, or JavaScript code into the workspace to receive instant line-by-line explanations in your mother tongue.',
    },
    {
      q: 'Is there a free web version available?',
      a: 'Yes! BhashaCode provides a permanently free web version with 20 AI code explanations every day across all 8 Indian native languages without requiring a credit card.',
    },
    {
      q: 'Which programming and native languages are supported?',
      a: 'We support Python, Java, C++, JavaScript, TypeScript, Go, and Rust. On the native side, we support Telugu, Hindi, Tamil, Kannada, Marathi, Bengali, Gujarati, and English.',
    },
    {
      q: 'How does the line-by-line breakdown work?',
      a: 'When you paste code, our AI engine parses each statement, highlighting variables and execution semantics in your native dialect while keeping technical interview keywords in parentheses.',
    },
    {
      q: 'Can I cancel or upgrade my subscription anytime?',
      a: 'Yes, you can upgrade, downgrade, or cancel your subscription at any time directly from your account settings with zero cancellation fee.',
    },
    {
      q: 'Is my submitted code secure and private?',
      a: 'Yes. Your submitted code snippets and saved algorithms are secured with enterprise-grade row-level protection. We never train public foundation models on your private code.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#242424]">
      
      {/* ============================================================== */}
      {/* 1. HERO SECTION (Exact Microsoft Outlook Gradient & Responsive Layout) */}
      {/* ============================================================== */}
      <section 
        id="overview"
        className="relative min-h-[520px] sm:min-h-[560px] lg:min-h-[600px] xl:min-h-[640px] flex items-center border-b border-[#D9ECFF] overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #F5FAFF 0%, #EAF5FF 48%, #D9ECFF 100%)'
        }}
      >
        {/* ========================================================================= */}
        {/* SOFT BLUE GLASS GRADIENT & AMBIENT RADIANT MESH LAYERS                    */}
        {/* Top: #F5FAFF, Primary: #EAF5FF (48%), Bottom: #D9ECFF (100%)              */}
        {/* ========================================================================= */}
        <div className="absolute inset-0 w-full h-full select-none pointer-events-none z-0 overflow-hidden">
          {/* Subtle soft blue glass ambient bloom complementing #D9ECFF */}
          <div 
            className="absolute -right-20 top-1/2 -translate-y-1/2 w-[720px] h-[720px] rounded-full blur-3xl opacity-60 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, #D9ECFF 0%, #EAF5FF 50%, rgba(245,250,255,0) 70%)'
            }}
          />
          {/* Subtle luminous glass highlight in top-right */}
          <div 
            className="absolute right-1/4 -top-24 w-[460px] h-[460px] rounded-full blur-3xl opacity-50 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, #ffffff 0%, #EAF5FF 50%, rgba(217,236,255,0) 75%)'
            }}
          />
          {/* Soft top sheen */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(245,250,255,0) 35%, rgba(217,236,255,0.25) 100%)'
            }}
          />
        </div>

        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-12 sm:py-16 lg:py-20 xl:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Headline, Description & Microsoft Action Buttons */}
            <div className="lg:col-span-7 xl:col-span-6 flex flex-col items-start text-left">
              
              {/* Category / Eyebrow */}
              <div className="text-[13px] font-semibold text-[#005597] tracking-normal mb-3">
                BhashaCode for Students & Developers
              </div>

              {/* Hero Headline */}
              <h1 
                className="text-3xl sm:text-4xl lg:text-[44px] xl:text-[50px] font-semibold text-[#0e1726] tracking-tight leading-[1.14] mb-4 sm:mb-5"
                style={{ textWrap: 'balance' }}
              >
                Your code, understood.<br />Your future, coded.
              </h1>

              {/* Subheading */}
              <p className="text-sm sm:text-base lg:text-lg text-[#3a4c56] leading-relaxed mb-6 sm:mb-8 max-w-lg font-normal">
                Stay on top of complex algorithms, data structures, and debugging with line-by-line Telugu explanations in one place. Available on desktop, tablet, and mobile.
              </p>

              {/* CTAs matching Microsoft Outlook reference */}
              <div className="flex flex-wrap items-center gap-3.5 mb-5">
                <button
                  onClick={() => {
                    if (user) onNavigate('workspace');
                    else openAuthModal('signup');
                  }}
                  className="px-6 py-2.5 rounded-[4px] bg-[#0e1726] hover:bg-[#1e304f] text-white font-semibold text-[15px] transition-colors shadow-xs"
                >
                  {user ? 'Open Workspace' : 'Sign in'}
                </button>

                <button
                  onClick={() => onNavigate('pricing')}
                  className="px-6 py-2.5 rounded-[4px] bg-white/90 hover:bg-white text-[#0e1726] border border-[#8e989e] hover:border-[#0e1726] font-semibold text-[15px] transition-colors shadow-xs"
                >
                  Buy now
                </button>
              </div>

              {/* Action link with Chevron indicator */}
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => {
                    if (user) onNavigate('workspace');
                    else openAuthModal('signup');
                  }}
                  className="group inline-flex items-center gap-2 text-[14px] font-semibold text-[#0e1726] hover:underline"
                >
                  <span className="w-5 h-5 rounded-[3px] bg-[#0e1726] text-white flex items-center justify-center text-[10px] font-bold group-hover:bg-[#0078d4] transition-colors">
                    &gt;
                  </span>
                  <span>Create free student account</span>
                </button>
              </div>

              {/* Subtle Trust Label */}
              <div className="flex items-center gap-2 text-xs text-[#5a6972]">
                <Check className="w-3.5 h-3.5 text-[#0078d4]" />
                <span>Free web version available · 20 daily AI code explanations</span>
              </div>

            </div>

            {/* Right Column: Clean Interactive Telugu Coding Showcase Card (Ready for user's custom image) */}
            <div className="lg:col-span-5 xl:col-span-6 w-full flex justify-center lg:justify-end">
              <div className="w-full max-w-[540px] bg-white/85 backdrop-blur-md rounded-xl border border-[#cbe6f4] shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
                {/* Window header */}
                <div className="bg-[#f0f6fa] border-b border-[#e1ecf3] px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                    <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                    <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
                    <span className="ml-2 text-xs font-medium text-[#5a6972]">main.py — తెలుగు వివరణ</span>
                  </div>
                  <span className="text-[11px] font-semibold text-[#0078d4] bg-[#e6f2fb] px-2 py-0.5 rounded">
                    Python 3.12
                  </span>
                </div>

                {/* Code display */}
                <div className="p-4 bg-[#0d1522] text-[#e6f2fb] font-mono text-xs sm:text-[13px] leading-relaxed">
                  <div className="flex items-start gap-3">
                    <span className="text-[#55698c] select-none">1</span>
                    <span><span className="text-[#3393dd]">def</span> <span className="text-[#8ac1eb]">binary_search</span>(arr, target):</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[#55698c] select-none">2</span>
                    <span className="pl-4 text-[#8e989e]"># తెలుగులో: క్రమబద్ధమైన లిస్ట్‌లో వెతకండి</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[#55698c] select-none">3</span>
                    <span className="pl-4">left, right = <span className="text-[#3393dd]">0</span>, len(arr) - <span className="text-[#3393dd]">1</span></span>
                  </div>
                  <div className="flex items-start gap-3 bg-[#0078d4]/20 -mx-4 px-4 py-0.5 border-l-2 border-[#0078d4]">
                    <span className="text-[#8ac1eb] select-none">4</span>
                    <span className="pl-4">mid = (left + right) // <span className="text-[#3393dd]">2</span></span>
                  </div>
                </div>

                {/* Telugu explanation card underneath */}
                <div className="p-4 bg-[#f8fbfe] border-t border-[#e1ecf3] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#005597]">
                    <Sparkles className="w-3.5 h-3.5 text-[#0078d4]" />
                    <span>లైన్ 4 వివరణ (Telugu Line Analysis):</span>
                  </div>
                  <p className="text-xs sm:text-[13px] text-[#3a4c56] leading-relaxed">
                    మధ్య ఇండెక్స్ (<code className="bg-[#e6f2fb] text-[#005597] px-1 py-0.5 rounded font-mono text-[11px]">mid</code>) లెక్కించి, వెతకాల్సిన సంఖ్య మధ్యలో ఉందో లేదో సరిచూస్తాం. దీనివల్ల సమయం సగానికి తగ్గుతుంది (Time Complexity: O(log n)).
                  </p>
                  <div className="flex items-center justify-between pt-1 text-[11px] text-[#8e989e]">
                    <span>ఆడియో వివరణ సిద్ధంగా ఉంది 🔊</span>
                    <button 
                      onClick={() => {
                        if (user) onNavigate('workspace');
                        else openAuthModal('signup');
                      }}
                      className="text-[#0078d4] hover:underline font-medium"
                    >
                      Try in Workspace →
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Floating Outlook-style "Feedback" button attached to bottom left */}
        <div className="absolute bottom-0 left-6 z-20">
          <button
            onClick={() => setFeedbackOpen(true)}
            className="bg-[#0e1726] hover:bg-[#1e304f] text-white text-xs font-semibold px-4 py-1.5 rounded-t-[4px] shadow-md transition-colors flex items-center gap-1.5"
            title="Give feedback"
          >
            <span>Feedback</span>
          </button>
        </div>
      </section>

      {/* ============================================================== */}
      {/* SECONDARY STICKY SUB-NAV RIBBON (Exact Outlook Ribbon) */}
      {/* ============================================================== */}
      <div className="sticky top-14 z-40 bg-white/95 backdrop-blur-md border-b border-[#e6e9ea] shadow-2xs">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 overflow-x-auto text-[13px] text-[#3a4c56] py-1 no-scrollbar">
            <a href="#overview" className="font-semibold text-[#0e1726] border-b-2 border-[#0078d4] pb-1 whitespace-nowrap">
              Overview
            </a>
            <a href="#features" className="hover:text-[#0e1726] transition-colors whitespace-nowrap">
              Features
            </a>
            <a href="#interactive-demo" className="hover:text-[#0e1726] transition-colors whitespace-nowrap">
              Live Sandbox
            </a>
            <a href="#plans" className="hover:text-[#0e1726] transition-colors whitespace-nowrap">
              Plans and pricing
            </a>
            <a href="#languages" className="hover:text-[#0e1726] transition-colors whitespace-nowrap">
              Native languages
            </a>
            <a href="#faqs" className="hover:text-[#0e1726] transition-colors whitespace-nowrap">
              FAQs
            </a>
          </div>

          <div className="hidden sm:flex items-center gap-2.5 shrink-0">
            <button 
              onClick={() => onNavigate('workspace')}
              className="px-3.5 py-1 text-xs font-semibold rounded-[4px] bg-[#0e1726] hover:bg-[#1e304f] text-white transition-colors"
            >
              Open Web App
            </button>
            <button 
              onClick={() => onNavigate('pricing')}
              className="px-3.5 py-1 text-xs font-semibold rounded-[4px] border border-[#8e989e] text-[#0e1726] hover:bg-[#f4fafd] transition-colors"
            >
              See plans and pricing
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. FOUR FEATURE CARDS (Exact Microsoft 365 4-Column Block Size) */}
      {/* ============================================================== */}
      <section className="py-16 bg-white border-b border-[#E1DFDD]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-10 text-left">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#242424] tracking-tight">
              Explore BhashaCode features
            </h2>
            <p className="text-sm text-[#616161] mt-1">
              Everything you need to master software engineering in your mother tongue.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1 */}
            <div className="p-6 rounded-lg border border-[#E1DFDD] bg-white hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-sm bg-[#EBF3FC] text-[#0078D4] flex items-center justify-center mb-4">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-[#242424] mb-2">
                  Line-by-line Native Breakdown
                </h3>
                <p className="text-xs text-[#616161] leading-relaxed mb-6">
                  Inspect variables, loop mechanics, and control flow explained in Telugu, Hindi, Tamil, and Kannada without foreign textbook jargon.
                </p>
              </div>
              <button
                onClick={() => onNavigate('workspace')}
                className="text-xs font-semibold text-[#0067B8] hover:underline flex items-center gap-1 text-left"
              >
                <span>Explore code breakdown</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-lg border border-[#E1DFDD] bg-white hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-sm bg-[#EBF3FC] text-[#0078D4] flex items-center justify-center mb-4">
                  <Brain className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-[#242424] mb-2">
                  Everyday Mental Models
                </h3>
                <p className="text-xs text-[#616161] leading-relaxed mb-6">
                  Grasp binary search, two-pointer, DFS, and recursion with intuitive daily life metaphors instead of abstract math notation.
                </p>
              </div>
              <button
                onClick={() => onNavigate('workspace')}
                className="text-xs font-semibold text-[#0067B8] hover:underline flex items-center gap-1 text-left"
              >
                <span>Read simple logic</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-lg border border-[#E1DFDD] bg-white hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-sm bg-[#EBF3FC] text-[#0078D4] flex items-center justify-center mb-4">
                  <Bug className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-[#242424] mb-2">
                  AI Root-Cause Debugger
                </h3>
                <p className="text-xs text-[#616161] leading-relaxed mb-6">
                  Diagnose compiler syntax bugs, infinite loops, and array out-of-bounds with 1-click automatic fix application directly into your editor.
                </p>
              </div>
              <button
                onClick={() => onNavigate('workspace')}
                className="text-xs font-semibold text-[#0067B8] hover:underline flex items-center gap-1 text-left"
              >
                <span>Diagnose code errors</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 4 */}
            <div className="p-6 rounded-lg border border-[#E1DFDD] bg-white hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-sm bg-[#EBF3FC] text-[#0078D4] flex items-center justify-center mb-4">
                  <Repeat className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-[#242424] mb-2">
                  Pseudocode & Sandbox Runner
                </h3>
                <p className="text-xs text-[#616161] leading-relaxed mb-6">
                  Execute algorithms safely in isolated browser sandboxes or export verified vernacular pseudocode for university lab records.
                </p>
              </div>
              <button
                onClick={() => onNavigate('workspace')}
                className="text-xs font-semibold text-[#0067B8] hover:underline flex items-center gap-1 text-left"
              >
                <span>Run sandbox test</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. ALTERNATING 50/50 SHOWCASE BLOCKS (Exact Microsoft 365 Layout) */}
      {/* ============================================================== */}
      
      {/* Split Block 1: Image Left, Text Right (White Background #FFFFFF) */}
      <section className="py-16 lg:py-24 bg-white border-b border-[#E1DFDD]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Visual Block on Left */}
            <div className="lg:col-span-6">
              <div className="bg-[#F5F6F8] rounded-lg p-6 border border-[#E1DFDD] shadow-sm">
                <div className="bg-white rounded-md p-4 border border-[#E1DFDD] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#EDEBE9] text-xs font-semibold text-[#0078D4]">
                    <span>TELUGU COGNITIVE MODEL</span>
                    <span className="text-[#616161] font-mono">Python 3.12</span>
                  </div>
                  <pre className="text-xs font-mono bg-stone-900 text-stone-100 p-3 rounded-sm overflow-x-auto leading-relaxed">
{`for i in range(len(arr)):
    min_idx = i
    for j in range(i+1, len(arr)):
        if arr[j] < arr[min_idx]:
            min_idx = j
    arr[i], arr[min_idx] = arr[min_idx], arr[i]`}
                  </pre>
                  <div className="p-3 bg-[#EBF3FC] rounded-sm border border-[#0078D4]/20 text-xs text-[#242424] leading-relaxed">
                    <strong>తర్కం (Selection Sort Logic):</strong> ప్రతి దశలో మిగిలిన అరే నుండి అతి చిన్న సంఖ్యను కనుగొని, దానిని ప్రస్తుత స్థానంలోకి మార్పిడి (Swap) చేస్తుంది.
                  </div>
                </div>
              </div>
            </div>

            {/* Copy on Right */}
            <div className="lg:col-span-6 flex flex-col items-start">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-[#0067B8] mb-2">
                COGNITIVE CLARITY
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#242424] tracking-tight leading-snug mb-4">
                Stay focused on algorithms, not the language barrier
              </h2>
              <p className="text-sm text-[#616161] leading-relaxed mb-6">
                When learning data structures, your working memory should focus on algorithmic invariants, recursive pointers, and time complexities—not foreign grammar. BhashaCode translates syntax execution while strictly preserving standard English technical keywords.
              </p>

              <ul className="space-y-3 text-xs text-[#242424] mb-8">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#0067B8] shrink-0 mt-0.5" />
                  <span>Standardized technical terminology formulated with university computer science faculty.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#0067B8] shrink-0 mt-0.5" />
                  <span>English keywords kept in parentheses so you remain interview-ready for MNC tech rounds.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#0067B8] shrink-0 mt-0.5" />
                  <span>Interactive line clicking to inspect matched variable mutations step-by-step.</span>
                </li>
              </ul>

              <button
                onClick={() => onNavigate('workspace')}
                className="px-5 py-2.5 rounded-[4px] bg-[#0067B8] hover:bg-[#005A9E] text-white font-semibold text-xs transition-colors shadow-2xs"
              >
                Try the interactive workspace
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Split Block 2: Inverted (Text Left, Image Right) on Light Neutral Banding (#F0F4F8) */}
      <section className="py-16 lg:py-24 bg-[#F0F4F8] border-b border-[#E1DFDD]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Copy on Left */}
            <div className="lg:col-span-6 flex flex-col items-start">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-[#0067B8] mb-2">
                BUILT-IN AI ASSISTANCE
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#242424] tracking-tight leading-snug mb-4">
                Work smarter with next-generation native code intelligence
              </h2>
              <p className="text-sm text-[#616161] leading-relaxed mb-6">
                Have questions about a while-loop condition or off-by-one index error? Ask in your mother tongue directly inside the workspace. Our AI mentor answers in fluent Telugu, Hindi, Tamil, or Kannada with targeted code snippets.
              </p>

              <ul className="space-y-3 text-xs text-[#242424] mb-8">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#0067B8] shrink-0 mt-0.5" />
                  <span>Contextual chat aware of your editor’s current programming language and active logic.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#0067B8] shrink-0 mt-0.5" />
                  <span>Explains why a runtime bug occurred before suggesting the corrected syntax.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#0067B8] shrink-0 mt-0.5" />
                  <span>Instant translation between Python, Java, C++, and vernacular pseudocode.</span>
                </li>
              </ul>

              <button
                onClick={() => onNavigate('workspace')}
                className="px-5 py-2.5 rounded-[4px] bg-[#0067B8] hover:bg-[#005A9E] text-white font-semibold text-xs transition-colors shadow-2xs"
              >
                Experience AI Mentor
              </button>
            </div>

            {/* Visual Block on Right */}
            <div className="lg:col-span-6">
              <div className="bg-white rounded-lg p-6 border border-[#E1DFDD] shadow-sm">
                <div className="space-y-3 text-xs">
                  <div className="flex justify-end">
                    <div className="bg-[#0067B8] text-white p-3 rounded-md max-w-[85%] leading-relaxed font-medium">
                      ఈ కోడ్‌లో `left &lt;= right` బదులు `left &lt; right` పెడితే ఏమవుతుంది?
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-[#F5F6F8] text-[#242424] p-3.5 rounded-md border border-[#E1DFDD] max-w-[90%] leading-relaxed">
                      <p className="font-semibold text-[#0078D4] mb-1">AI గురువు సమాధానం:</p>
                      `left &lt;= right` తీసివేసి `left &lt; right` పెడితే, శోధన జాబితాలో ఒకే ఒక ఎలిమెంట్ మిగిలినప్పుడు (left == right) ఆ సంఖ్యను తనిఖీ చేయకుండానే లూప్ ముగిసిపోతుంది. దీనివల్ల చివరి ఎలిమెంట్ ఉన్నప్పటికీ `-1` వస్తుంది.
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. INTERACTIVE LIVE PLAYGROUND SECTION (With soft blue-tinted background #EDF4FA) */}
      {/* ============================================================== */}
      <section id="interactive-demo" className="py-20 bg-[#EDF4FA] border-b border-[#E1DFDD]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-[#0067B8] mb-2 block">
              LIVE INTERACTIVE PLAYGROUND
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#242424] tracking-tight">
              Test BhashaCode live in your browser
            </h2>
            <p className="text-sm text-[#616161] mt-1.5">
              Select an algorithm and choose any of 8 Indian native languages to preview the explanation.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-[#E1DFDD] p-6 shadow-sm">
            
            {/* Playground Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#EDEBE9]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#616161]">Sample Algorithm:</span>
                <div className="flex items-center gap-1 bg-[#F5F6F8] p-1 rounded-sm border border-[#E1DFDD]">
                  <button
                    onClick={() => setSelectedDemoCodeSnippet('loop')}
                    className={`px-3 py-1 text-xs font-semibold rounded-xs transition-colors ${
                      selectedDemoCodeSnippet === 'loop' ? 'bg-white text-[#0067B8] shadow-2xs' : 'text-[#616161]'
                    }`}
                  >
                    Sum Loop
                  </button>
                  <button
                    onClick={() => setSelectedDemoCodeSnippet('search')}
                    className={`px-3 py-1 text-xs font-semibold rounded-xs transition-colors ${
                      selectedDemoCodeSnippet === 'search' ? 'bg-white text-[#0067B8] shadow-2xs' : 'text-[#616161]'
                    }`}
                  >
                    Parity Check
                  </button>
                  <button
                    onClick={() => setSelectedDemoCodeSnippet('array')}
                    className={`px-3 py-1 text-xs font-semibold rounded-xs transition-colors ${
                      selectedDemoCodeSnippet === 'array' ? 'bg-white text-[#0067B8] shadow-2xs' : 'text-[#616161]'
                    }`}
                  >
                    JS Filter
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#0078D4]" />
                <span className="text-xs font-semibold text-[#616161]">Mother Tongue:</span>
                <select
                  value={selectedDemoLang}
                  onChange={(e) => setSelectedDemoLang(e.target.value as NativeLanguageKey)}
                  className="px-3 py-1 text-xs font-semibold rounded-sm bg-[#F5F6F8] border border-[#E1DFDD] text-[#242424] outline-hidden cursor-pointer"
                >
                  {SUPPORTED_NATIVE_LANGUAGES.map((lang) => (
                    <option key={lang.key} value={lang.key}>
                      {lang.native} ({lang.english})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Split Editor / Explanation View */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              
              {/* Code Pane */}
              <div className="bg-[#1B1B1B] text-slate-100 rounded-sm p-4 font-mono text-xs sm:text-sm">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-700 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-[#00A4EF]" />
                    <span>{demoSnippets[selectedDemoCodeSnippet].prog} Source</span>
                  </span>
                  <span>Pure Syntax</span>
                </div>
                <pre className="overflow-x-auto text-xs leading-relaxed text-slate-200">
                  {demoSnippets[selectedDemoCodeSnippet].code}
                </pre>
              </div>

              {/* Native Explanation Pane */}
              <div className="bg-[#F5F6F8] rounded-sm p-4 border border-[#E1DFDD]">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E1DFDD] text-xs font-bold text-[#242424]">
                  <span className="text-[#0078D4] font-semibold">
                    {SUPPORTED_NATIVE_LANGUAGES.find((l) => l.key === selectedDemoLang)?.native} వివరణ
                  </span>
                  <span className="text-[#616161] font-normal text-[11px]">Line-by-Line Execution</span>
                </div>

                <div className="space-y-2">
                  {demoSnippets[selectedDemoCodeSnippet].explanations[selectedDemoLang].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-2 rounded-sm bg-white border border-[#E1DFDD]"
                    >
                      <span className="w-5 h-5 rounded-xs bg-[#EBF3FC] text-[#0078D4] font-mono text-xs flex items-center justify-center shrink-0 font-bold">
                        {item.line}
                      </span>
                      <p className="text-xs text-[#242424] leading-relaxed">
                        {item.expl}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-[#E1DFDD] flex items-center justify-between">
                  <span className="text-xs text-[#616161]">Ready to test your assignment?</span>
                  <button
                    onClick={() => onNavigate('workspace')}
                    className="text-xs font-semibold text-[#0067B8] hover:underline flex items-center gap-1"
                  >
                    <span>Open Full Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. PRICING & PLAN COMPARISON (Pure BhashaCode Branding) */}
      {/* ============================================================== */}
      <section className="py-20 bg-white border-b border-[#E1DFDD]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-[#0067B8] mb-2 block">
              BHASHACODE PLANS
            </span>
            <h2 className="text-3xl font-bold text-[#242424] tracking-tight">
              Compare plans and pricing
            </h2>
            <p className="text-sm text-[#616161] mt-1.5">
              Get started with our free web version or upgrade for unlimited high-capacity model inference.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
            
            {/* Tier 1: Free Web */}
            <div className="p-8 rounded-lg border border-[#E1DFDD] bg-white flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#242424] mb-1">BhashaCode Free Web</h3>
                <p className="text-xs text-[#616161] mb-6">
                  For students and beginners getting started with programming.
                </p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-bold text-[#242424]">₹0</span>
                  <span className="text-xs text-[#616161]">/ forever</span>
                </div>

                <ul className="space-y-3 text-xs text-[#242424] mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#0067B8] shrink-0" />
                    <span>20 AI explanations every day</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#0067B8] shrink-0" />
                    <span>All 8 supported native languages</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#0067B8] shrink-0" />
                    <span>Python, Java, C++, JavaScript syntax</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#0067B8] shrink-0" />
                    <span>Interactive web browser sandbox</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  if (user) onNavigate('workspace');
                  else openAuthModal('signup');
                }}
                className="w-full py-2.5 rounded-[4px] bg-white hover:bg-[#EBF3FC] text-[#0067B8] border border-[#0067B8] font-semibold text-xs transition-colors"
              >
                Use free web version
              </button>
            </div>

            {/* Tier 2: Pro Scholar (Featured Blue) */}
            <div className="p-8 rounded-lg border-2 border-[#0067B8] bg-white shadow-md flex flex-col justify-between relative">
              <div className="absolute -top-3 left-6 bg-[#0067B8] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-sm">
                Most Popular
              </div>

              <div>
                <h3 className="text-xl font-bold text-[#242424] mb-1">BhashaCode Pro</h3>
                <p className="text-xs text-[#616161] mb-6">
                  For placement preparation and intense algorithmic mastery.
                </p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-bold text-[#242424]">₹399</span>
                  <span className="text-xs text-[#616161]">/ month ($5 USD)</span>
                </div>

                <ul className="space-y-3 text-xs text-[#242424] mb-8 font-medium">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#0067B8] shrink-0" />
                    <span>200 AI explanations / day</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#0067B8] shrink-0" />
                    <span>Deep root-cause AI code debugger</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#0067B8] shrink-0" />
                    <span>Cross-language pseudocode export</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#0067B8] shrink-0" />
                    <span>Priority low-latency server inference</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#0067B8] shrink-0" />
                    <span>Unlimited personal project library</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  if (user) onNavigate('pricing');
                  else openAuthModal('signup');
                }}
                className="w-full py-2.5 rounded-[4px] bg-[#0067B8] hover:bg-[#005A9E] text-white font-semibold text-xs transition-colors shadow-2xs"
              >
                Try free for 1 month
              </button>
            </div>

            {/* Tier 3: College Campus */}
            <div className="p-8 rounded-lg border border-[#E1DFDD] bg-white flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#242424] mb-1">Campus & Enterprise</h3>
                <p className="text-xs text-[#616161] mb-6">
                  For engineering colleges and state educational departments.
                </p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-2xl font-bold text-[#242424]">Custom</span>
                  <span className="text-xs text-[#616161]">/ department</span>
                </div>

                <ul className="space-y-3 text-xs text-[#242424] mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#0067B8] shrink-0" />
                    <span>Custom domain & university SSO</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#0067B8] shrink-0" />
                    <span>Department-wide shared code labs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#0067B8] shrink-0" />
                    <span>Teacher review & assignment analytics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#0067B8] shrink-0" />
                    <span>On-premise sandbox deployment</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => onNavigate('docs')}
                className="w-full py-2.5 rounded-[4px] bg-[#F5F6F8] hover:bg-stone-200 text-[#242424] font-semibold text-xs transition-colors"
              >
                Contact Campus Team
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* 6. FAQ ACCORDION SECTION (Clean Fluent Dividers on #F0F4F8) */}
      {/* ============================================================== */}
      <section className="py-20 bg-[#F0F4F8] border-b border-[#E1DFDD]">
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#242424] tracking-tight">
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-md border border-[#E1DFDD] p-4 shadow-2xs"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full text-left flex items-center justify-between gap-4 font-semibold text-sm text-[#242424] hover:text-[#0067B8] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#747474] transition-transform ${
                      openFaq === idx ? 'rotate-180 text-[#0067B8]' : ''
                    }`}
                  />
                </button>

                {openFaq === idx && (
                  <div className="pt-2 text-xs text-[#616161] leading-relaxed border-t border-[#EDEBE9] mt-2.5">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* 7. STANDARD MULTI-COLUMN FOOTER (Pure BhashaCode) */}
      {/* ============================================================== */}
      <footer className="bg-[#F2F2F2] text-[#616161] py-12 text-xs border-t border-[#E1DFDD]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            
            {/* Col 1 */}
            <div>
              <h4 className="font-semibold text-[#242424] text-xs mb-3">Languages</h4>
              <ul className="space-y-2">
                <li><button onClick={() => onNavigate('workspace')} className="hover:underline hover:text-[#242424]">Telugu (తెలుగు)</button></li>
                <li><button onClick={() => onNavigate('workspace')} className="hover:underline hover:text-[#242424]">Hindi (हिन्दी)</button></li>
                <li><button onClick={() => onNavigate('workspace')} className="hover:underline hover:text-[#242424]">Tamil (தமிழ்)</button></li>
                <li><button onClick={() => onNavigate('workspace')} className="hover:underline hover:text-[#242424]">Kannada (ಕನ್ನಡ)</button></li>
              </ul>
            </div>

            {/* Col 2 */}
            <div>
              <h4 className="font-semibold text-[#242424] text-xs mb-3">Platform</h4>
              <ul className="space-y-2">
                <li><button onClick={() => onNavigate('workspace')} className="hover:underline hover:text-[#242424]">Code Workspace</button></li>
                <li><button onClick={() => onNavigate('workspace')} className="hover:underline hover:text-[#242424]">AI Root Debugger</button></li>
                <li><button onClick={() => onNavigate('workspace')} className="hover:underline hover:text-[#242424]">Pseudocode Converter</button></li>
                <li><button onClick={() => onNavigate('pricing')} className="hover:underline hover:text-[#242424]">Plans and pricing</button></li>
              </ul>
            </div>

            {/* Col 3 */}
            <div>
              <h4 className="font-semibold text-[#242424] text-xs mb-3">Education</h4>
              <ul className="space-y-2">
                <li><button onClick={() => onNavigate('docs')} className="hover:underline hover:text-[#242424]">Cognitive Science</button></li>
                <li><button onClick={() => onNavigate('docs')} className="hover:underline hover:text-[#242424]">Dialect Glossary</button></li>
                <li><button onClick={() => onNavigate('docs')} className="hover:underline hover:text-[#242424]">Educators & Colleges</button></li>
                <li><button onClick={() => onNavigate('docs')} className="hover:underline hover:text-[#242424]">Lab Record Format</button></li>
              </ul>
            </div>

            {/* Col 4 */}
            <div>
              <h4 className="font-semibold text-[#242424] text-xs mb-3">Enterprise</h4>
              <ul className="space-y-2">
                <li><button onClick={() => onNavigate('pricing')} className="hover:underline hover:text-[#242424]">Campus Licensing</button></li>
                <li><button onClick={() => onNavigate('docs')} className="hover:underline hover:text-[#242424]">Departmental SSO</button></li>
                <li><button onClick={() => onNavigate('docs')} className="hover:underline hover:text-[#242424]">Sandbox Security</button></li>
              </ul>
            </div>

            {/* Col 5 */}
            <div>
              <h4 className="font-semibold text-[#242424] text-xs mb-3">Developer & IT</h4>
              <ul className="space-y-2">
                <li><button onClick={() => onNavigate('workspace')} className="hover:underline hover:text-[#242424]">REST API Specs</button></li>
                <li><button onClick={() => onNavigate('workspace')} className="hover:underline hover:text-[#242424]">AI Reasoning Model</button></li>
                <li><button onClick={() => onNavigate('docs')} className="hover:underline hover:text-[#242424]">Documentation</button></li>
              </ul>
            </div>

          </div>

          {/* Footer Bottom Bar */}
          <div className="pt-6 border-t border-[#E1DFDD] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#747474]">
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-[#0078D4]" />
              <span>English (India) · All 8 Mother Tongues Enabled</span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button onClick={() => onNavigate('docs')} className="hover:underline">Contact BhashaCode</button>
              <button onClick={() => onNavigate('docs')} className="hover:underline">Privacy</button>
              <button onClick={() => onNavigate('docs')} className="hover:underline">Terms of use</button>
              <span>© 2026 BhashaCode Education. All rights reserved.</span>
            </div>
          </div>

        </div>
      </footer>

      {/* ============================================================== */}
      {/* 8. OUTLOOK-STYLE FEEDBACK MODAL (Interactive) */}
      {/* ============================================================== */}
      {feedbackOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-lg border border-[#e6e9ea] shadow-2xl max-w-md w-full p-6 text-left relative">
            <button
              onClick={() => {
                setFeedbackOpen(false);
                setFeedbackSuccess(false);
              }}
              className="absolute top-4 right-4 text-[#8e989e] hover:text-[#0e1726] p-1 text-sm font-bold transition-colors"
              aria-label="Close feedback modal"
            >
              ✕
            </button>

            {!feedbackSuccess ? (
              <>
                <h3 className="text-lg font-bold text-[#0e1726] mb-1">Send feedback to BhashaCode</h3>
                <p className="text-xs text-[#3a4c56] mb-4">
                  Help us improve vernacular programming education across Telugu and Indian languages.
                </p>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setFeedbackType('smile')}
                    className={`p-2.5 rounded-[4px] border text-center transition-all ${
                      feedbackType === 'smile'
                        ? 'border-[#0078d4] bg-[#f4fafd] text-[#0078d4] font-semibold'
                        : 'border-[#e6e9ea] text-[#3a4c56] hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xl mb-1">😊</div>
                    <div className="text-[11px]">I like something</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeedbackType('idea')}
                    className={`p-2.5 rounded-[4px] border text-center transition-all ${
                      feedbackType === 'idea'
                        ? 'border-[#0078d4] bg-[#f4fafd] text-[#0078d4] font-semibold'
                        : 'border-[#e6e9ea] text-[#3a4c56] hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xl mb-1">💡</div>
                    <div className="text-[11px]">Suggestion</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeedbackType('frown')}
                    className={`p-2.5 rounded-[4px] border text-center transition-all ${
                      feedbackType === 'frown'
                        ? 'border-[#0078d4] bg-[#f4fafd] text-[#0078d4] font-semibold'
                        : 'border-[#e6e9ea] text-[#3a4c56] hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xl mb-1">🙁</div>
                    <div className="text-[11px]">Issue / bug</div>
                  </button>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-[#0e1726] mb-1.5">
                    What would you like to share?
                  </label>
                  <textarea
                    rows={4}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Tell us what you liked, or suggest a new feature or native dialect..."
                    className="w-full text-xs p-3 rounded-[4px] border border-[#8e989e] focus:border-[#0078d4] focus:outline-hidden text-[#0e1726]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFeedbackOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-[#3a4c56] hover:text-[#0e1726]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (feedbackText.trim()) {
                        setFeedbackSuccess(true);
                      }
                    }}
                    disabled={!feedbackText.trim()}
                    className="px-5 py-2 rounded-[4px] bg-[#0e1726] hover:bg-[#1e304f] disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                  >
                    Submit Feedback
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 text-xl">
                  ✓
                </div>
                <h3 className="text-base font-bold text-[#0e1726] mb-1">Thank you for your feedback!</h3>
                <p className="text-xs text-[#3a4c56] max-w-xs mx-auto mb-5 leading-relaxed">
                  Your insight directly helps us make BhashaCode and Telugu programming tools more powerful.
                </p>
                <button
                  onClick={() => {
                    setFeedbackOpen(false);
                    setFeedbackSuccess(false);
                    setFeedbackText('');
                  }}
                  className="px-5 py-2 rounded-[4px] bg-[#0078d4] text-white text-xs font-semibold hover:bg-[#006dc1] transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 9. HIGH-RES BANNER LIGHTBOX PREVIEW */}
      {/* ============================================================== */}
      {bannerZoomed && (
        <div 
          onClick={() => setBannerZoomed(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-sm animate-in fade-in cursor-zoom-out"
        >
          <div className="relative max-w-6xl w-full bg-white rounded-xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3.5 border-b border-[#e6e9ea] bg-slate-50">
              <span className="text-xs font-semibold text-[#0e1726]">
                BhashaCode Telugu & Multi-Lingual Coding Learning Environment (HD Preview)
              </span>
              <button
                onClick={() => setBannerZoomed(false)}
                className="text-[#8e989e] hover:text-[#0e1726] font-bold text-sm p-1 transition-colors"
                aria-label="Close image preview"
              >
                ✕
              </button>
            </div>
            <div className="p-2 sm:p-4 bg-[#f4fafd] flex justify-center">
              <img
                src="/assets/aistudio/BhashaCode_Telugu_Coding_Showcase_f96b75a9.png"
                alt="BhashaCode Full 3D Telugu Coding Showcase"
                className="w-full h-auto rounded-lg shadow-sm max-h-[80vh] object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
