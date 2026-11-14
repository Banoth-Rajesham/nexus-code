import React, { useState, useMemo } from 'react';
import { translateCodeToNative } from '../utils/codeTranslator';
import { NATIVE_CODE_WORD } from '../utils/codeTransliterator';
import { HighlightedCodeBlock } from '../utils/codeHighlighter';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  ArrowRight,
  Code2,
  Globe,
  BookOpen,
  ChevronDown,
  Brain,
  Bug,
  Repeat,
  Check,
  Play,
  Terminal,
  Layers,
  MessageSquare,
  RotateCcw,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { SUPPORTED_NATIVE_LANGUAGES, NativeLanguageKey } from '../types';
import { BlueprintIcon } from '../components/BlueprintIcon';

interface LandingPageProps {
  onNavigate: (view: string, data?: any) => void;
}

// ─── Demo Snippets for Playground ──────────────────────────────────────────────
interface SnippetItem {
  prog: string;
  label: string;
  code: string;
  output: string;
  explanations: Record<NativeLanguageKey, Array<{ line: string; expl: string }>>;
}

const demoSnippets: Record<'loop' | 'condition' | 'function', SnippetItem> = {
  loop: {
    prog: 'Python',
    label: 'Loops',
    code: `numbers = [10, 20, 30, 40]
total = 0
for n in numbers:
    total += n
print("Sum:", total)`,
    output: `Sum: 100`,
    explanations: {
      telugu: [
        { line: '1', expl: '4 సంఖ్యలు ఉన్న లిస్ట్ (జాబితా) ను డిఫైన్ చేశాము.' },
        { line: '2', expl: 'మొత్తం కూడిక నిల్వ చేయడానికి `total` ను 0 తో ప్రారంభించాము.' },
        { line: '3', expl: 'ఫర్ లూప్ — లిస్ట్‌లోని ప్రతి సంఖ్యను వరుసగా `n` లోకి తీసుకుంటుంది.' },
        { line: '4', expl: 'ప్రతి సంఖ్యను `total` కు కూడుతూ నిల్వ చేస్తుంది.' },
        { line: '5', expl: 'అంతిమ కూడిక ఫలితాన్ని స్క్రీన్ పై ప్రింట్ చేస్తుంది.' },
      ],
      hindi: [
        { line: '1', expl: '4 संख्याओं की एक सूची (List) बनाई गई है।' },
        { line: '2', expl: 'योग संचय के लिए `total` को 0 से शुरू किया।' },
        { line: '3', expl: 'फॉर लूप — सूची की प्रत्येक संख्या क्रमिक रूप से `n` में लेता है।' },
        { line: '4', expl: 'प्रत्येक संख्या को `total` में जोड़ता है।' },
        { line: '5', expl: 'अंतिम परिणाम स्क्रीन पर प्रिंट करता है।' },
      ],
      tamil: [
        { line: '1', expl: '4 எண்கள் கொண்ட பட்டியல் உருவாக்கப்பட்டுள்ளது.' },
        { line: '2', expl: 'கூட்டுத்தொகைக்கு `total` மாறியை 0 ஆக வைக்கிறோம்.' },
        { line: '3', expl: 'ஃபார் லூப் — ஒவ்வொரு எண்ணையும் வரிசையாக `n` மாறியில் எடுக்கிறது.' },
        { line: '4', expl: 'ஒவ்வொரு எண்ணையும் `total` உடன் கூட்டுகிறது.' },
        { line: '5', expl: 'இறுதி கூட்டுத்தொகையை திரையில் காட்டுகிறது.' },
      ],
      kannada: [
        { line: '1', expl: '4 ಸಂಖ್ಯೆಗಳಿರುವ ಪಟ್ಟಿ (List) ರಚಿಸಲಾಗಿದೆ.' },
        { line: '2', expl: 'ಒಟ್ಟು ಮೊತ್ತಕ್ಕೆ `total` ಅನ್ನು 0 ಗೆ ನಿಗದಿಪಡಿಸಲಾಗಿದೆ.' },
        { line: '3', expl: 'ಫಾರ್ ಲೂಪ್ — ಪ್ರತಿ ಸಂಖ್ಯೆಯನ್ನು ಕ್ರಮವಾಗಿ `n` ಗೆ ತೆಗೆದುಕೊಳ್ಳುತ್ತದೆ.' },
        { line: '4', expl: 'ಪ್ರತಿ ಸಂಖ್ಯೆಯನ್ನು `total` ಗೆ ಕೂಡಿಸುತ್ತದೆ.' },
        { line: '5', expl: 'ಅಂತಿಮ ಮೊತ್ತವನ್ನು ಪ್ರದರ್ಶಿಸುತ್ತದೆ.' },
      ],
      english: [
        { line: '1', expl: 'Defines a list containing four integers.' },
        { line: '2', expl: 'Initializes accumulator variable `total` to zero.' },
        { line: '3', expl: 'For loop iterates through each element `n` in the list.' },
        { line: '4', expl: 'Accumulates each element value into `total`.' },
        { line: '5', expl: 'Prints the final computed sum to standard output.' },
      ],
      marathi: [
        { line: '1', expl: '4 संख्यांची यादी तयार केली आहे.' },
        { line: '2', expl: 'बेरजेसाठी `total` व्हेरिएबल 0 ने सुरू केला.' },
        { line: '3', expl: 'फॉर लूप — यादीतील प्रत्येक संख्या `n` मध्ये घेतो.' },
        { line: '4', expl: 'प्रत्येक संख्या `total` मध्ये जोडतो.' },
        { line: '5', expl: 'अंतिम बेरीज स्क्रीनवर दाखवतो.' },
      ],
      bengali: [
        { line: '1', expl: '৪টি সংখ্যা সমন্বিত একটি তালিকা তৈরি করা হয়েছে।' },
        { line: '2', expl: 'যোগফলের জন্য `total` চলক ০ দিয়ে শুরু করা হয়েছে।' },
        { line: '3', expl: 'ফর লুপ — তালিকার প্রতিটি সংখ্যা `n` এ গ্রহণ করে।' },
        { line: '4', expl: 'প্রতিটি সংখ্যা `total` এর সাথে যোগ করে।' },
        { line: '5', expl: 'চূড়ান্ত যোগফল প্রিন্ট করে।' },
      ],
      gujarati: [
        { line: '1', expl: '4 સંખ્યાઓ ધરાવતી એક યાદી બનાવી છે.' },
        { line: '2', expl: 'કુલ સરવાળા માટે `total` ને 0 થી શરૂ કર્યો.' },
        { line: '3', expl: 'ફોર લૂપ — દરેક સંખ્યા ક્રમશઃ `n` માં લે છે.' },
        { line: '4', expl: 'દરેક સંખ્યાને `total` માં ઉમેરે છે.' },
        { line: '5', expl: 'અંતિમ સરવાળો સ્ક્રીન પર છાપે છે.' },
      ],
    },
  },
  condition: {
    prog: 'Python',
    label: 'Conditions',
    code: `def check_even(n):
    if n % 2 == 0:
        return True
    return False

result = check_even(42)
print("Is even:", result)`,
    output: `Is even: True`,
    explanations: {
      telugu: [
        { line: '1', expl: '`check_even` అనే ఫంక్షన్‌ను డిఫైన్ చేసాము.' },
        { line: '2', expl: 'సంఖ్యను 2 తో భాగించినప్పుడు శేషం 0 అయితే సరిసంఖ్య (even number).' },
        { line: '3', expl: 'సరిసంఖ్య అయితే `True` రిటర్న్ చేస్తుంది.' },
        { line: '4', expl: 'శేషం 0 కాకపోతే `False` రిటర్న్ చేస్తుంది.' },
        { line: '6', expl: '42 తో ఫంక్షన్‌ను కాల్ చేసి ఫలితాన్ని `result` లో నిల్వ చేశాము.' },
        { line: '7', expl: 'ఫలితాన్ని స్క్రీన్‌పై ముద్రిస్తుంది.' },
      ],
      hindi: [
        { line: '1', expl: '`check_even` फ़ंक्शन परिभाषित किया गया है।' },
        { line: '2', expl: 'संख्या को 2 से भाग देने पर शेष 0 बचे तो सम संख्या (even)।' },
        { line: '3', expl: 'सम संख्या होने पर `True` वापस लौटाता है।' },
        { line: '4', expl: 'अन्यथा `False` लौटाता है।' },
        { line: '6', expl: '42 के साथ फ़ंक्शन कॉल करके परिणाम `result` में रखा।' },
        { line: '7', expl: 'परिणाम स्क्रीन पर प्रिंट करता है।' },
      ],
      tamil: [
        { line: '1', expl: '`check_even` என்ற செயல்பாடு வரையறுக்கப்பட்டது.' },
        { line: '2', expl: 'எண்ணை 2 ஆல் வகுக்கும் போது மீதி 0 என்றால் இரட்டை எண்.' },
        { line: '3', expl: 'இரட்டை எண் என்றால் `True` திருப்பி அனுப்புகிறது.' },
        { line: '4', expl: 'இல்லையெனில் `False` திருப்பி அனுப்புகிறது.' },
        { line: '6', expl: '42 உடன் அழைத்து முடிவை `result` இல் சேமிக்கிறது.' },
        { line: '7', expl: 'முடிவை திரையில் அச்சிடுகிறது.' },
      ],
      kannada: [
        { line: '1', expl: '`check_even` ಫಂಕ್ಷನ್ ವ್ಯಾಖ್ಯಾನಿಸಲಾಗಿದೆ.' },
        { line: '2', expl: 'ಸಂಖ್ಯೆಯನ್ನು 2 ರಿಂದ ಭಾಗಿಸಿದಾಗ ಉಳಿದಿದ್ದು 0 ಆದರೆ ಸಮ ಸಂಖ್ಯೆ.' },
        { line: '3', expl: 'ಸಮ ಸಂಖ್ಯೆ ಆಗಿದ್ದರೆ `True` ಹಿಂತಿರುಗಿಸುತ್ತದೆ.' },
        { line: '4', expl: 'ಇಲ್ಲವಾದರೆ `False` ಹಿಂತಿರುಗಿಸುತ್ತದೆ.' },
        { line: '6', expl: '42 ರೊಂದಿಗೆ ಫಂಕ್ಷನ್ ಕರೆ ಮಾಡಿ `result` ನಲ್ಲಿ ಶೇಖರಿಸಲಾಗಿದೆ.' },
        { line: '7', expl: 'ಫಲಿತಾಂಶವನ್ನು ಪ್ರದರ್ಶಿಸುತ್ತದೆ.' },
      ],
      english: [
        { line: '1', expl: 'Defines the function `check_even` taking argument `n`.' },
        { line: '2', expl: 'Checks if remainder of `n / 2` equals 0 (modulo operator).' },
        { line: '3', expl: 'Returns boolean True when condition evaluates to true.' },
        { line: '4', expl: 'Otherwise returns boolean False.' },
        { line: '6', expl: 'Invokes `check_even(42)` and stores output in `result`.' },
        { line: '7', expl: 'Prints the formatted test result to the terminal.' },
      ],
      marathi: [
        { line: '1', expl: '`check_even` फंक्शन तयार केले.' },
        { line: '2', expl: 'संख्या 2 ने भागल्यावर बाकी 0 उरल्यास सम संख्या.' },
        { line: '3', expl: 'सम संख्या असल्यास `True` परत.' },
        { line: '4', expl: 'नाहीतर `False` परत.' },
        { line: '6', expl: '42 सह कॉल करून निकाल `result` मध्ये.' },
        { line: '7', expl: 'निकाल स्क्रीनवर दाखवतो.' },
      ],
      bengali: [
        { line: '1', expl: '`check_even` ফাংশন তৈরি করা হলো।' },
        { line: '2', expl: '২ দিয়ে ভাগশেষে ০ আসলে সংখ্যাটি জোড়।' },
        { line: '3', expl: 'জোড় হলে `True` রিটার্ন করে।' },
        { line: '4', expl: 'অন্যথায় `False` রিটার্ন করে।' },
        { line: '6', expl: '৪২ সহ কল করে `result` এ ফলাফল রাখা হলো।' },
        { line: '7', expl: 'ফলাফল প্রিন্ট করে।' },
      ],
      gujarati: [
        { line: '1', expl: '`check_even` ફંક્શન વ્યાખ્યાયિત કર્યું.' },
        { line: '2', expl: 'સંખ્યાને 2 વડે ભાગતાં શેષ 0 આવે તો બેકી સંખ્યા.' },
        { line: '3', expl: 'બેકી હોય તો `True` પરત કરે.' },
        { line: '4', expl: 'નહીં તો `False` પરત કરે.' },
        { line: '6', expl: '42 સાથે કૉલ કરી પરિણામ `result` માં સાચવ્યું.' },
        { line: '7', expl: 'પરિણામ પ્રિન્ટ કરે છે.' },
      ],
    },
  },
  function: {
    prog: 'Python',
    label: 'Functions',
    code: `def greet(name):
    message = "Hello, " + name
    return message

greeting = greet("Priya")
print(greeting)`,
    output: `Hello, Priya`,
    explanations: {
      telugu: [
        { line: '1', expl: '`greet` పేరుతో `name` పారామీటర్‌ను తీసుకునే ఫంక్షన్‌ను రూపొందించాము.' },
        { line: '2', expl: 'పేరును స్వాగత వాక్యంతో కలిపి `message` లో నిల్వ చేశాము.' },
        { line: '3', expl: 'రూపొందించిన `message` ను కాలర్‌కి తిరిగి పంపుతుంది (return).' },
        { line: '5', expl: '"Priya" తో ఫంక్షన్‌ను పిలిచి ఫలితాన్ని `greeting` లో నిల్వ చేశాము.' },
        { line: '6', expl: 'స్వాగత సందేశాన్ని స్క్రీన్‌పై చూపిస్తుంది.' },
      ],
      hindi: [
        { line: '1', expl: '`greet` नाम का फ़ंक्शन बनाया जो `name` पैरामीटर लेता है।' },
        { line: '2', expl: 'नाम को स्वागत संदेश से जोड़कर `message` चर में रखा।' },
        { line: '3', expl: 'तैयार संदेश को वापस लौटाता (return) है।' },
        { line: '5', expl: '"Priya" के साथ फ़ंक्शन को कॉल किया।' },
        { line: '6', expl: 'संदेश स्क्रीन पर प्रिंट करता है।' },
      ],
      tamil: [
        { line: '1', expl: '`greet` என்ற பெயரில் `name` ஏற்கும் செயல்பாடு உருவாக்கப்பட்டது.' },
        { line: '2', expl: 'பெயரை வாழ்த்துடன் இணைத்து `message` இல் சேமிக்கிறது.' },
        { line: '3', expl: 'வாழ்த்துச் செய்தியை திருப்பி அனுப்புகிறது.' },
        { line: '5', expl: '"Priya" உடன் அழைத்து `greeting` இல் சேமிக்கிறது.' },
        { line: '6', expl: 'வாழ்த்து செய்தியை திரையிடுகிறது.' },
      ],
      kannada: [
        { line: '1', expl: '`name` ಪ್ಯಾರಾಮೀಟರ್ ಸ್ವೀಕರಿಸುವ `greet` ಫಂಕ್ಷನ್ ರಚಿಸಲಾಗಿದೆ.' },
        { line: '2', expl: 'ಹೆಸರನ್ನು ಸ್ವಾಗತ ವಾಕ್ಯದೊಂದಿಗೆ ಸೇರಿಸಿ `message` ನಲ್ಲಿ ಶೇಖರಿಸಲಾಗಿದೆ.' },
        { line: '3', expl: 'ಸ್ವಾಗತ ಸಂದೇಶವನ್ನು ಹಿಂತಿರುಗಿಸುತ್ತದೆ.' },
        { line: '5', expl: '"Priya" ಜೊತೆ ಕರೆ ಮಾಡಿ `greeting` ನಲ್ಲಿ ಇರಿಸಲಾಗಿದೆ.' },
        { line: '6', expl: 'ಸ್ವಾಗತ ಸಂದೇಶ ಪ್ರದರ್ಶಿಸುತ್ತದೆ.' },
      ],
      english: [
        { line: '1', expl: 'Defines function `greet` with a single parameter `name`.' },
        { line: '2', expl: 'Concatenates string "Hello, " with `name` into `message`.' },
        { line: '3', expl: 'Returns the greeting message string back to the caller.' },
        { line: '5', expl: 'Calls `greet` with argument "Priya" and stores return value.' },
        { line: '6', expl: 'Prints the greeting output to the terminal standard output.' },
      ],
      marathi: [
        { line: '1', expl: '`greet` नावाचे फंक्शन तयार केले.' },
        { line: '2', expl: 'नाव स्वागत वाक्याशी जोडून `message` मध्ये ठेवले.' },
        { line: '3', expl: 'तयार संदेश परत पाठवतो.' },
        { line: '5', expl: '"Priya" सह कॉल करून निकाल `greeting` मध्ये.' },
        { line: '6', expl: 'स्वागत संदेश स्क्रीनवर दाखवतो.' },
      ],
      bengali: [
        { line: '1', expl: '`greet` ফাংশন তৈরি করা হলো যা `name` গ্রহণ করে।' },
        { line: '2', expl: 'নামকে শুভেচ্ছার সাথে যুক্ত করে `message` এ রাখা হলো।' },
        { line: '3', expl: 'বার্তাটি ফেরত পাঠানো হলো।' },
        { line: '5', expl: '"Priya" দিয়ে কল করে ফলাফল `greeting` এ রাখা হলো।' },
        { line: '6', expl: 'শুভেচ্ছা বার্তা প্রিন্ট করে।' },
      ],
      gujarati: [
        { line: '1', expl: '`greet` ફંક્શન બનાવ્યું જે `name` સ્વીકારે છે.' },
        { line: '2', expl: 'નામ + સ્વાગત જોડીને `message` માં સાચવ્યું.' },
        { line: '3', expl: 'સંદેશો પાછો પરત કરે છે.' },
        { line: '5', expl: '"Priya" સાથે કૉલ કરી `greeting` માં મૂક્યું.' },
        { line: '6', expl: 'સ્વાગત સ્ક્રીન પર દર્શાવે છે.' },
      ],
    },
  },
};

// ─── Line-by-Line Section Interactive Data ──────────────────────────────────────
const lineByLineSnippet = `numbers = [10, 20, 30]

for number in numbers:
    print(number)`;

const lineByLineExplanations: Record<
  NativeLanguageKey,
  Array<{ n: number; code: string; expl: string; note: string }>
> = {
  telugu: [
    { n: 1, code: 'numbers = [10, 20, 30]', expl: 'మూడు సంఖ్యలు ఉన్న లిస్ట్‌ను "numbers" అనే వేరియబుల్‌లో నిల్వ చేశాము.', note: 'లిస్ట్ (List) డేటా స్ట్రక్చర్' },
    { n: 2, code: 'for number in numbers:', expl: 'ఫర్ లూప్ — లిస్ట్‌లోని ప్రతి సంఖ్యను ఒకదాని తర్వాత ఒకటి "number" లోకి తీసుకుంటుంది.', note: 'పునరావృతం (Iteration) ప్రారంభం' },
    { n: 3, code: '    print(number)', expl: 'ప్రస్తుత సంఖ్యను స్క్రీన్‌పై ముద్రిస్తుంది.', note: 'అవుట్‌పుట్ ఫంక్షన్' },
  ],
  hindi: [
    { n: 1, code: 'numbers = [10, 20, 30]', expl: 'तीन संख्याओं वाली एक सूची (List) को "numbers" चर में संग्रहीत किया।', note: 'सूची (List) संरचना' },
    { n: 2, code: 'for number in numbers:', expl: 'फॉर लूप — सूची की प्रत्येक संख्या को एक-एक करके "number" में लेता है।', note: 'पुनरावृत्ति (Loop) शुरुआत' },
    { n: 3, code: '    print(number)', expl: 'वर्तमान संख्या को स्क्रीन पर प्रिंट करता है।', note: 'आउटपुट निर्देश' },
  ],
  tamil: [
    { n: 1, code: 'numbers = [10, 20, 30]', expl: 'மூன்று எண்கள் கொண்ட பட்டியலை "numbers" என்ற மாறியில் சேமித்துள்ளோம்.', note: 'பட்டியல் (List)' },
    { n: 2, code: 'for number in numbers:', expl: 'ஃபார் லூப் — பட்டியலிலுள்ள ஒவ்வொரு எண்ணையும் வரிசையாக "number" மாறிக்குள் எடுக்கிறது.', note: 'மறுசுழற்சி துவக்கம்' },
    { n: 3, code: '    print(number)', expl: 'தற்போதைய எண்ணை திரையில் காட்டுகிறது.', note: 'வெளியீடு கட்டளை' },
  ],
  kannada: [
    { n: 1, code: 'numbers = [10, 20, 30]', expl: 'ಮೂರು ಸಂಖ್ಯೆಗಳಿರುವ ಪಟ್ಟಿಯನ್ನು "numbers" ವೇರಿಯೇಬಲ್‌ನಲ್ಲಿ ಸಂಗ್ರಹಿಸಲಾಗಿದೆ.', note: 'ಪಟ್ಟಿ (List)' },
    { n: 2, code: 'for number in numbers:', expl: 'ಫಾರ್ ಲೂಪ್ — ಪಟ್ಟಿಯ ಪ್ರತಿಯೊಂದು ಸಂಖ್ಯೆಯನ್ನು ಒಂದೊಂದಾಗಿ "number" ಗೆ ತೆಗೆದುಕೊಳ್ಳುತ್ತದೆ.', note: 'ಪುನರಾವರ್ತನೆ ಆರಂಭ' },
    { n: 3, code: '    print(number)', expl: 'ಪ್ರಸ್ತುತ ಸಂಖ್ಯೆಯನ್ನು ಸ್ಕ್ರೀನ್ ಮೇಲೆ ಮುದ್ರಿಸುತ್ತದೆ.', note: 'ಔಟ್‌ಪುಟ್' },
  ],
  english: [
    { n: 1, code: 'numbers = [10, 20, 30]', expl: 'Defines a list containing three integers in the variable "numbers".', note: 'List definition' },
    { n: 2, code: 'for number in numbers:', expl: 'For loop iterates through each element, assigning it sequentially to "number".', note: 'Loop iteration' },
    { n: 3, code: '    print(number)', expl: 'Outputs the value of "number" for each pass to the terminal console.', note: 'Standard output' },
  ],
  marathi: [
    { n: 1, code: 'numbers = [10, 20, 30]', expl: 'तीन संख्यांची यादी "numbers" व्हेरिएबलमध्ये साठवली.', note: 'यादी (List)' },
    { n: 2, code: 'for number in numbers:', expl: 'फॉर लूप — यादीतील प्रत्येक संख्या "number" मध्ये क्रमाने घेतो.', note: 'लूप आरंभ' },
    { n: 3, code: '    print(number)', expl: 'सध्याची संख्या स्क्रीनवर दाखवतो.', note: 'आउटपुट' },
  ],
  bengali: [
    { n: 1, code: 'numbers = [10, 20, 30]', expl: 'তিনটি সংখ্যা সমন্বিত তালিকা "numbers" চলকে সংরক্ষণ করা হয়েছে।', note: 'তালিকা তৈরি' },
    { n: 2, code: 'for number in numbers:', expl: 'ফর লুপ — তালিকার প্রতিটি সংখ্যা ক্রমানুসারে "number" এ গ্রহণ করে।', note: 'লুপ শুরু' },
    { n: 3, code: '    print(number)', expl: 'বর্তমান সংখ্যাটি স্ক্রিনে প্রিন্ট করে।', note: 'আউটপুট' },
  ],
  gujarati: [
    { n: 1, code: 'numbers = [10, 20, 30]', expl: 'ત્રણ સંખ્યાઓની યાદી "numbers" વેરિયેબલમાં સાચવી.', note: 'યાદી (List)' },
    { n: 2, code: 'for number in numbers:', expl: 'ફોર લૂપ — યાદીની દરેક સંખ્યા વારાફરતી "number" માં લે છે.', note: 'લૂપ શરૂ' },
    { n: 3, code: '    print(number)', expl: 'હાલની સંખ્યા સ્ક્રીન પર પ્રિન્ટ કરે છે.', note: 'આઉટપુટ' },
  ],
};

// ─── AI Mentor Interactive Questions ────────────────────────────────────────────
interface AiQAPair {
  q: string;
  a: string;
  snippet?: string;
}

const aiQuestionsData: Record<NativeLanguageKey, Record<string, AiQAPair>> = {
  telugu: {
    loop: {
      q: 'ఈ loop 5 సార్లు ఎందుకు నడుస్తుంది?',
      a: '`range(5)` ఫంక్షన్ 0 నుండి 4 వరకు (0, 1, 2, 3, 4) మొత్తం 5 సంఖ్యలను వరుసగా అందిస్తుంది. లూప్ ఒక్కో సంఖ్యను ఒక్కో సారి తీసుకుని అమలు చేస్తుంది కాబట్టి మొత్తం 5 సార్లు నడుస్తుంది.',
      snippet: 'for i in range(5):\n    print(i) # 0, 1, 2, 3, 4',
    },
    func: {
      q: 'ఈ ఫంక్షన్‌ను తెలుగులో వివరించండి.',
      a: '`def greet(name):` అనేది ఒక ఫంక్షన్ డిక్లరేషన్. `name` అనేది ఇన్‌పుట్ (parameter). ఇది "Hello, " కి మీ పేరును కలిపి పూర్తి వాక్యాన్ని `return` చేస్తుంది. అవసరమైన చోటల్లా దీనిని మళ్లీ మళ్లీ ఉపయోగించవచ్చు.',
      snippet: 'def greet(name):\n    return "Hello, " + name',
    },
    error: {
      q: 'నా కోడ్‌లో ఈ error ఎందుకు వస్తోంది?',
      a: "NameError: name 'x' is not defined వచ్చింది. అంటే కంప్యూటర్‌కు x విలువ ఏమిటో ఇంకా తెలియదు. ఉపయోగించే ముందే వేరియబుల్‌కు విలువ ఇవ్వాలి. ఉదాహరణకు పైన x = 10 అని రాస్తే పరిష్కారం అవుతుంది.",
      snippet: 'x = 10  # assign first\nprint(x)',
    },
    execute: {
      q: 'ఈ కోడ్ ఎలా execute అవుతుందో చూపించండి.',
      a: 'స్టెప్ 1: కంప్యూటర్ numbers మెమరీని సిద్ధం చేస్తుంది. స్టెప్ 2: మొదటి సంఖ్య 10 తీసుకుని ప్రింట్ చేస్తుంది. స్టెప్ 3: 20 ప్రింట్. స్టెప్ 4: 30 ప్రింట్. లిస్ట్ ముగిసిన వెంటనే ప్రోగ్రామ్ ఆగుతుంది.',
    },
  },
  hindi: {
    loop: {
      q: 'यह loop 5 बार क्यों चलता है?',
      a: '`range(5)` फ़ंक्शन 0 से 4 तक (0, 1, 2, 3, 4) कुल 5 मान उत्पन्न करता है। लूप प्रत्येक मान के लिए एक बार चलता है, इसलिए यह ठीक 5 बार पूरा होता है।',
      snippet: 'for i in range(5):\n    print(i) # 0, 1, 2, 3, 4',
    },
    func: {
      q: 'इस फ़ंक्शन को हिंदी में समझाइए।',
      a: '`def greet(name):` एक पुनः प्रयोज्य फ़ंक्शन है। यह `name` पैरामीटर लेता है, "Hello, " जोड़ता है और परिणाम `return` करता है।',
      snippet: 'def greet(name):\n    return "Hello, " + name',
    },
    error: {
      q: 'मुझे यह error क्यों मिल रहा है?',
      a: "NameError: name 'x' is not defined का अर्थ है कि आपने x का उपयोग करने से पहले उसे परिभाषित नहीं किया। पहले x = 10 लिखें।",
      snippet: 'x = 10  # assign first\nprint(x)',
    },
    execute: {
      q: 'यह कोड कैसे execute होता है?',
      a: 'चरण 1: मेमोरी में सूची बनती है। चरण 2: पहला अंक 10 लेकर प्रिंट होता है। चरण 3: 20 प्रिंट। चरण 4: 30 प्रिंट। कोड सफलतापूर्वक समाप्त।',
    },
  },
  tamil: {
    loop: {
      q: 'இந்த loop ஏன் 5 முறை இயங்குகிறது?',
      a: '`range(5)` செயல்பாடு 0 முதல் 4 வரை (0, 1, 2, 3, 4) மொத்தம் 5 எண்களை வரிசையாக உருவாக்குகிறது. எனவே லூப் 5 முறை இயங்குகிறது.',
      snippet: 'for i in range(5):\n    print(i)',
    },
    func: {
      q: 'இந்த செயல்பாட்டை தமிழில் விளக்கவும்.',
      a: '`greet(name)` செயல்பாடு `name` உள்ளீட்டை ஏற்றுக்கொண்டு, "Hello, " சேர்த்து விடையை `return` செய்கிறது.',
      snippet: 'def greet(name):\n    return "Hello, " + name',
    },
    error: {
      q: 'எனக்கு ஏன் இந்த பிழை வருகிறது?',
      a: 'NameError என்பது மாறியை பயன்படுத்தும் முன் வரையறுக்கவில்லை என்பதாகும். மேலே x = 10 என வரையறுக்கவும்.',
      snippet: 'x = 10\nprint(x)',
    },
    execute: {
      q: 'இந்த குறியீடு எவ்வாறு இயங்குகிறது?',
      a: 'படி 1: பட்டியல் தயாராகிறது. படி 2: 10 அச்சிடப்படுகிறது. படி 3: 20 அச்சிடப்படுகிறது. படி 4: 30 அச்சிடப்படுகிறது.',
    },
  },
  kannada: {
    loop: {
      q: 'ಈ loop ಏಕೆ 5 ಬಾರಿ ಚಲಿಸುತ್ತದೆ?',
      a: '`range(5)` ಫಂಕ್ಷನ್ 0 ರಿಂದ 4 ರವರೆಗೆ (0, 1, 2, 3, 4) ಒಟ್ಟು 5 ಸಂಖ್ಯೆಗಳನ್ನು ನೀಡುತ್ತದೆ. ಆದ್ದರಿಂದ ಲೂಪ್ 5 ಬಾರಿ ಚಲಿಸುತ್ತದೆ.',
      snippet: 'for i in range(5):\n    print(i)',
    },
    func: {
      q: 'ಈ ಫಂಕ್ಷನ್ ಅನ್ನು ಕನ್ನಡದಲ್ಲಿ ವಿವರಿಸಿ.',
      a: '`greet(name)` ಫಂಕ್ಷನ್ `name` ಇನ್‌ಪುಟ್ ತೆಗೆದುಕೊಂಡು, "Hello, " ಸೇರಿಸಿ ಫಲಿತಾಂಶವನ್ನು `return` ಮಾಡುತ್ತದೆ.',
      snippet: 'def greet(name):\n    return "Hello, " + name',
    },
    error: {
      q: 'ನನಗೆ ಈ error ಏಕೆ ಬರುತ್ತಿದೆ?',
      a: 'NameError ಎಂದರೆ ವೇರಿಯೇಬಲ್ ಅನ್ನು ಬಳಸುವ ಮೊದಲು ವ್ಯಾಖ್ಯಾನಿಸಿಲ್ಲ. ಮೊದಲು x = 10 ಎಂದು ಬರೆಯಿರಿ.',
      snippet: 'x = 10\nprint(x)',
    },
    execute: {
      q: 'ಈ ಕೋಡ್ ಹೇಗೆ execute ಆಗುತ್ತದೆ?',
      a: 'ಹಂತ 1: ಪಟ್ಟಿ ತಯಾರಾಗುತ್ತದೆ. ಹಂತ 2: 10 ಪ್ರಿಂಟ್ ಆಗುತ್ತದೆ. ಹಂತ 3: 20 ಪ್ರಿಂಟ್. ಹಂತ 4: 30 ಪ್ರಿಂಟ್.',
    },
  },
  english: {
    loop: {
      q: 'Why does this loop run five times?',
      a: '`range(5)` generates 5 integer values: 0, 1, 2, 3, and 4. The `for` loop iterates once per value, executing its indented block exactly 5 times.',
      snippet: 'for i in range(5):\n    print(i) # 0, 1, 2, 3, 4',
    },
    func: {
      q: 'Explain how this function works.',
      a: '`def greet(name):` defines a reusable function. It takes parameter `name`, concatenates it with "Hello, ", and returns the resulting greeting string.',
      snippet: 'def greet(name):\n    return "Hello, " + name',
    },
    error: {
      q: 'Why am I getting this error?',
      a: "NameError: name 'x' is not defined happens when Python evaluates x before any value has been assigned to it. Assign x = 10 prior to reading it.",
      snippet: 'x = 10  # assign first\nprint(x)',
    },
    execute: {
      q: 'Show me how this code executes.',
      a: 'Step 1: The list [10, 20, 30] is allocated in memory. Step 2: In iteration 1, number is 10 and prints 10. Step 3: Prints 20. Step 4: Prints 30. Step 5: Loop completes cleanly.',
    },
  },
  marathi: {
    loop: {
      q: 'हा loop 5 वेळा का चालतो?',
      a: '`range(5)` 0 ते 4 (0, 1, 2, 3, 4) अशा 5 संख्या निर्माण करतो. त्यामुळे हा लूप 5 वेळा चालतो.',
    },
    func: {
      q: 'हे फंक्शन मराठीत समजावून सांगा.',
      a: '`greet(name)` फंक्शन नाव इनपुट घेऊन "Hello, " जोडून निकाल `return` करतो.',
    },
    error: {
      q: 'ही error का येत आहे?',
      a: 'NameError म्हणजे व्हेरिएबल वापरण्यापूर्वी तयार केला नाही. आधी x = 10 लिहा.',
    },
    execute: {
      q: 'हा कोड कसा चालतो?',
      a: 'पायरी 1: यादी तयार होते. पायरी 2: 10 प्रिंट. पायरी 3: 20 प्रिंट. पायरी 4: 30 प्रिंट.',
    },
  },
  bengali: {
    loop: {
      q: 'এই loop ৫ বার কেন চলে?',
      a: '`range(5)` ০ থেকে ৪ (০, ১, ২, ৩, ৪) মোট ৫টি মান প্রদান করে। তাই এই লুপটি ঠিক ৫ বার চলে।',
    },
    func: {
      q: 'এই ফাংশনটি বাংলায় ব্যাখ্যা করুন।',
      a: '`greet(name)` ফাংশন নাম গ্রহণ করে "Hello, " যুক্ত করে উত্তর `return` করে।',
    },
    error: {
      q: 'আমার কোডে error কেন আসছে?',
      a: 'NameError মানে ব্যবহারের পূর্বে ভেরিয়েবল ডিফাইন করা হয়নি। আগে x = 10 লিখুন।',
    },
    execute: {
      q: 'এই কোড কীভাবে execute হয়?',
      a: 'ধাপ ১: তালিকা প্রস্তুত। ধাপ ২: ১০ প্রিন্ট। ধাপ ৩: ২০ প্রিন্ট। ধাপ ৪: ৩০ প্রিন্ট।',
    },
  },
  gujarati: {
    loop: {
      q: 'આ loop 5 વાર કેમ ચાલે છે?',
      a: '`range(5)` 0 થી 4 સુધી કુલ 5 મૂલ્યો આપે છે. આથી લૂપ 5 વાર ફરે છે.',
    },
    func: {
      q: 'આ ફંક્શન ગુજરાતીમાં સમજાવો.',
      a: '`greet(name)` ફંક્શન નામ સ્વીકારીને "Hello, " જોડીને સંદેશ પરત કરે છે.',
    },
    error: {
      q: 'આ error કેમ આવી રહ્યો છે?',
      a: 'NameError નો અર્થ છે કે વેરિયેબલ વ્યાખ્યાયિત કર્યો નથી. પહેલાં x = 10 લખો.',
    },
    execute: {
      q: 'આ કોડ કેવી રીતે ચાલે છે?',
      a: 'પગલું 1: યાદી તૈયાર. પગલું 2: 10 પ્રિન્ટ. પગલું 3: 20 પ્રિન્ટ. પગલું 4: 30 પ્રિન્ટ.',
    },
  },
};

// ─── Learning Path Data ────────────────────────────────────────────────────────
const learningPath = [
  {
    step: 1,
    title: 'Your First Python Program',
    desc: 'Write and run your first code. Learn what print() does and how programs talk to you.',
    difficulty: 'Beginner',
    example: 'print("Hello, World!")\nprint("Welcome to BhashaCode")',
  },
  {
    step: 2,
    title: 'Variables and Data Types',
    desc: 'Store numbers, text, and True/False values. See how data lives in computer memory.',
    difficulty: 'Beginner',
    example: 'student_name = "Ravi"\nage = 19\nis_enrolled = True',
  },
  {
    step: 3,
    title: 'Conditions and Comparisons',
    desc: 'Make programs make smart decisions: if this is true, do action A; otherwise do action B.',
    difficulty: 'Beginner',
    example: 'marks = 85\nif marks >= 50:\n    print("Passed!")\nelse:\n    print("Try again")',
  },
  {
    step: 4,
    title: 'Loops and Iteration',
    desc: 'Repeat tasks effortlessly. Learn for loops, while loops, and range() step by step.',
    difficulty: 'Intermediate',
    example: 'for count in range(1, 6):\n    print("Step:", count)',
  },
  {
    step: 5,
    title: 'Functions and Reusable Code',
    desc: 'Package logic into reusable functions with inputs and return outputs.',
    difficulty: 'Intermediate',
    example: 'def calculate_square(x):\n    return x * x\n\nprint(calculate_square(7))',
  },
  {
    step: 6,
    title: 'Lists and Dictionaries',
    desc: 'Store collections of items, look up phonebook records, and manipulate collections.',
    difficulty: 'Intermediate',
    example: 'scores = [78, 92, 85, 96]\nscores.append(100)\nprint("Top score:", max(scores))',
  },
  {
    step: 7,
    title: 'Debugging and Problem Solving',
    desc: 'Understand error messages in your mother tongue and fix bugs methodically.',
    difficulty: 'Intermediate',
    example: '# Common error fixed:\nmessage = "Score: " + str(95)\nprint(message)',
  },
  {
    step: 8,
    title: 'Practical Mini Projects',
    desc: 'Build a calculator, student grade calculator, and number guessing game.',
    difficulty: 'Advanced',
    example: 'def grade(score):\n    if score >= 90: return "A"\n    if score >= 75: return "B"\n    return "C"',
  },
];

// ─── FAQs Data ─────────────────────────────────────────────────────────────────
const faqs = [
  {
    q: 'How do I get started with NexusCode?',
    a: 'Getting started is completely free and takes seconds. You can try the live interactive playground right on this page without an account, or open the full Workspace to type your own code and get instant line-by-line visual blueprint explanations.',
  },
  {
    q: 'Is there a free version?',
    a: 'Yes, NexusCode is genuinely free. The free plan gives you 20 AI visual code blueprints every day, access to the interactive browser sandbox, and the ability to save up to 15 projects in your personal library.',
  },
  {
    q: 'Which programming languages are supported?',
    a: 'The workspace supports Python, JavaScript, TypeScript, Java, C++, Go, and Rust. The visual blueprint engine is specially tuned for Python algorithms and modern agent architectures while fully handling syntax from all major languages.',
  },
  {
    q: 'How does line-by-line visual blueprint work?',
    a: 'Our engine parses each non-empty line of your code and draws interactive right-pointing connector arrows directly to visual cards with icons and plain-English explanations. You can see system toolkits, AI agent connections, MCP tools, and control flow side-by-side.',
  },
  {
    q: 'Can I run code in my browser?',
    a: 'Yes. The workspace includes a secure sandbox for code execution. You can run Python and JavaScript examples, provide inputs, and view standard output directly in the browser with execution timeouts and safety limits.',
  },
  {
    q: 'Does the AI assistant explain errors?',
    a: 'Yes. The AI Debugger analyzes syntax errors, runtime exceptions, and logic bugs, explaining why the error occurred and presenting a side-by-side corrected code diff with preventive coding tips.',
  },
  {
    q: 'Is my submitted code stored?',
    a: 'When you create a named project while signed in, your code is saved securely in your private account library. Your submitted code is never shared publicly or used to train public machine learning models.',
  },
  {
    q: 'Is an account required?',
    a: 'An account is not required to explore the interactive playground on this homepage. Creating a free account is recommended to save projects, track your daily quota of 20 blueprints, and maintain your personal learning history.',
  },
  {
    q: 'How do I upgrade or cancel my subscription?',
    a: 'You can review plans on the Plans & Pricing page. Upgrades to Pro (₹399/month for 200 daily blueprints and priority reasoning) can be managed directly in your account settings. Subscriptions can be canceled at any time with no penalty.',
  },
];

// ─── Main Landing Page Component ───────────────────────────────────────────────
export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { user, openAuthModal } = useAuth();

  // Language state (persisted across all sections)
  const [selectedLang, setSelectedLang] = useState<NativeLanguageKey>('english');

  // Playground state
  const [playgroundSnippet, setPlaygroundSnippet] = useState<'loop' | 'condition' | 'function'>('loop');
  const [playgroundCode, setPlaygroundCode] = useState<string>(demoSnippets.loop.code);
  const [playgroundOutput, setPlaygroundOutput] = useState<string>('');
  const [playgroundTab, setPlaygroundTab] = useState<'explanation' | 'nativeCode' | 'output'>('explanation');

  const transliteratedPlaygroundCode = useMemo(() => {
    return translateCodeToNative(playgroundCode, selectedLang, 'guide').translatedCode;
  }, [playgroundCode, selectedLang]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [runStats, setRunStats] = useState<{ durationMs: number; success: boolean; exitCode: number } | null>(null);

  // Line-by-line demo active line state
  const [activeLine, setActiveLine] = useState<number>(1);

  // AI Assistant active question state
  const [activeQuestionKey, setActiveQuestionKey] = useState<'loop' | 'func' | 'error' | 'execute'>('loop');

  // FAQ open index state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Feedback modal state
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'smile' | 'frown' | 'idea'>('smile');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Switch playground snippet
  const handleSelectSnippet = (key: 'loop' | 'condition' | 'function') => {
    setPlaygroundSnippet(key);
    setPlaygroundCode(demoSnippets[key].code);
    setPlaygroundOutput('');
    setRunStats(null);
  };

  // Reset playground
  const handleResetPlayground = () => {
    setPlaygroundCode(demoSnippets[playgroundSnippet].code);
    setPlaygroundOutput('');
    setRunStats(null);
  };

  // Run code in playground
  const handleRunPlayground = async () => {
    setIsRunning(true);
    setPlaygroundTab('output');
    const startTime = Date.now();

    try {
      const res = await fetch('/api/v1/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: playgroundCode,
          programmingLanguage: 'python',
        }),
      });

      const data = await res.json();
      if (res.ok && data) {
        setPlaygroundOutput(data.output || '(Execution finished with no output)');
        setRunStats({
          durationMs: data.executionTimeMs || Date.now() - startTime,
          success: !!data.success,
          exitCode: data.exitCode ?? (data.success ? 0 : 1),
        });
      } else {
        setPlaygroundOutput(data?.output || data?.error || 'Execution failed on server.');
        setRunStats({
          durationMs: Date.now() - startTime,
          success: false,
          exitCode: 1,
        });
      }
    } catch (err: any) {
      setPlaygroundOutput(`Connection error: ${err.message || 'Failed to reach execution server'}`);
      setRunStats({
        durationMs: Date.now() - startTime,
        success: false,
        exitCode: 1,
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Open Workspace with code
  const handleOpenInWorkspace = (snippetCode?: string, title?: string) => {
    onNavigate('workspace', {
      code: snippetCode || playgroundCode,
      programmingLanguage: 'python',
      nativeLanguage: selectedLang,
      title: title || `${demoSnippets[playgroundSnippet].label} Example`,
    });
  };

  // Primary action for hero
  const handleTryPlayground = () => {
    const el = document.getElementById('playground');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      onNavigate('workspace');
    }
  };

  const currentSnippet = demoSnippets[playgroundSnippet];
  const playgroundExplanations =
    currentSnippet.explanations[selectedLang] ?? currentSnippet.explanations['english'];

  const currentAiPair =
    aiQuestionsData[selectedLang]?.[activeQuestionKey] ??
    aiQuestionsData['english'][activeQuestionKey];

  const currentLineByLineData =
    lineByLineExplanations[selectedLang] ?? lineByLineExplanations['english'];

  const difficultyColor = (d: string) => {
    if (d === 'Beginner') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (d === 'Intermediate') return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-purple-50 text-purple-700 border-purple-200';
  };

  return (
    <div className="min-h-screen bg-white text-[#242424] antialiased">

      {/* ─── SECTION 1: HERO ──────────────────────────────────────────────────── */}
      <section
        id="overview"
        className="relative min-h-[580px] sm:min-h-[620px] lg:min-h-[660px] flex items-center border-b border-[#D9ECFF] overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #F5FAFF 0%, #EAF5FF 48%, #D9ECFF 100%)' }}
      >
        <div className="absolute inset-0 pointer-events-none z-0">
          <div
            className="absolute -right-16 top-1/2 -translate-y-1/2 w-[680px] h-[680px] rounded-full blur-3xl opacity-50"
            style={{ background: 'radial-gradient(circle, #D9ECFF 0%, #EAF5FF 55%, transparent 75%)' }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 40%)' }}
          />
        </div>

        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full pt-12 sm:pt-16 lg:pt-20 pb-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

            {/* Left Column: Value Proposition & CTAs */}
            <div className="lg:col-span-6 flex flex-col items-start text-left pb-12 sm:pb-16 lg:pb-20">
              <div className="text-[12px] font-semibold uppercase tracking-widest text-[#0067B8] mb-4">
                VISUAL CODE BLUEPRINT & ARCHITECTURE
              </div>
              <h1
                className="text-3xl sm:text-4xl lg:text-[46px] xl:text-[52px] font-bold text-[#0e1726] tracking-tight leading-[1.14] mb-5"
                style={{ textWrap: 'balance' } as React.CSSProperties}
              >
                Understand Every Line.<br />Visual Code Blueprints & Architecture.
              </h1>
              <p className="text-sm sm:text-base lg:text-[17px] text-[#3a4c56] leading-relaxed mb-7 max-w-[520px]">
                Master algorithms and software systems step-by-step with interactive line-by-line connector arrows, semantic toolkit mapping, and visual architecture diagrams.
              </p>

              {/* Primary & Secondary CTAs */}
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <button
                  id="hero-try-playground"
                  onClick={handleTryPlayground}
                  className="px-6 py-2.5 rounded-[4px] bg-[#0067B8] hover:bg-[#005A9E] text-white font-semibold text-[15px] transition-colors shadow-sm flex items-center gap-2 cursor-pointer focus:ring-2 focus:ring-[#0067B8] focus:ring-offset-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Try Live Playground
                </button>
                <button
                  id="hero-explore-features"
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-6 py-2.5 rounded-[4px] bg-white/90 hover:bg-white text-[#0e1726] border border-[#8e989e] hover:border-[#0e1726] font-semibold text-[15px] transition-colors shadow-xs cursor-pointer"
                >
                  Explore Features
                </button>
              </div>

              {/* Free account link */}
              <button
                id="hero-free-account"
                onClick={() => {
                  if (user) onNavigate('workspace');
                  else openAuthModal('signup');
                }}
                className="group inline-flex items-center gap-2 text-[13px] font-semibold text-[#0e1726] hover:underline mb-6 cursor-pointer"
              >
                <span className="w-5 h-5 rounded-[3px] bg-[#0e1726] text-white flex items-center justify-center text-[10px] font-bold group-hover:bg-[#0067B8] transition-colors">&gt;</span>
                <span>{user ? 'Go to my workspace' : 'Create free account'}</span>
              </button>

              {/* Supporting proof points */}
              <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#5a6972]">
                {['Interactive Line Arrows', 'Visual Architecture Blueprints', 'Live Execution Sandbox'].map((t, i) => (
                  <React.Fragment key={t}>
                    {i > 0 && <span className="text-[#ccc]">·</span>}
                    <span className="flex items-center gap-1.5 font-medium text-[#242424]">
                      <Check className="w-3.5 h-3.5 text-[#0067B8] stroke-[2.5]" />
                      {t}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Right Column: High Quality Product Showcase Screenshot */}
            <div className="lg:col-span-6 w-full flex justify-center items-center">
              <div className="w-full max-w-[780px] lg:max-w-none flex justify-center items-center">
                <img
                  src="/assets/aistudio/Telugu Coding Learning Workspace.png"
                  alt="NexusCode workspace demonstrating line-by-line visual code blueprints"
                  className="w-full max-w-[840px] lg:max-w-none lg:w-[130%] xl:w-[135%] h-auto block object-contain select-none transition-transform hover:scale-[1.01] duration-300"
                  loading="eager"
                  draggable={false}
                />
              </div>
            </div>

          </div>
        </div>

        {/* Feedback sticky tab */}
        <div className="absolute bottom-0 left-6 z-20">
          <button
            id="feedback-tab"
            onClick={() => setFeedbackOpen(true)}
            className="bg-[#0e1726] hover:bg-[#1e304f] text-white text-xs font-semibold px-4 py-1.5 rounded-t-[4px] shadow-md transition-colors cursor-pointer"
          >
            Feedback
          </button>
        </div>
      </section>

      {/* ─── STICKY SUB-NAV BAR ──────────────────────────────────────────────── */}
      <div className="sticky top-14 z-40 bg-white/95 backdrop-blur-md border-b border-[#e6e9ea] shadow-xs">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-4">
          <nav className="flex items-center gap-5 sm:gap-6 overflow-x-auto text-[13px] text-[#3a4c56] py-1 no-scrollbar">
            {[
              ['#overview', 'Overview'],
              ['#languages', 'Languages'],
              ['#features', 'Features'],
              ['#line-by-line', 'Breakdown'],
              ['#assistant', 'AI Mentor'],
              ['#playground', 'Playground'],
              ['#learning-path', 'Learning Path'],
              ['#pricing', 'Pricing'],
              ['#faqs', 'FAQs'],
            ].map(([href, label], i) => (
              <a
                key={href}
                href={href}
                className={`hover:text-[#0e1726] transition-colors whitespace-nowrap ${
                  i === 0 ? 'font-semibold text-[#0067B8] border-b-2 border-[#0067B8] pb-1' : ''
                }`}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="hidden sm:flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigate('workspace')}
              className="px-3.5 py-1 text-xs font-semibold rounded-[4px] bg-[#0e1726] hover:bg-[#1e304f] text-white transition-colors cursor-pointer"
            >
              Open Workspace
            </button>
            <button
              onClick={() => onNavigate('pricing')}
              className="px-3.5 py-1 text-xs font-semibold rounded-[4px] border border-[#8e989e] text-[#0e1726] hover:bg-[#f4fafd] transition-colors cursor-pointer"
            >
              See plans
            </button>
          </div>
        </div>
      </div>

      {/* ─── SECTION 2: VISUAL BLUEPRINT ARCHITECTURE ──────────────────────── */}
      <section id="languages" className="py-16 bg-white border-b border-[#E1DFDD]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-[12px] font-semibold uppercase tracking-widest text-[#0067B8] mb-2 block">
              VISUAL BLUEPRINT ARCHITECTURE
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0e1726] tracking-tight mb-3">
              From Raw Code to Clear Mental Models
            </h2>
            <p className="text-sm text-[#616161]">
              Every line of code connects with right-pointing connector arrows directly to visual semantic cards. Understand toolkits, AI connections, and execution flow at a glance.
            </p>
          </div>

          {/* Architecture Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {[
              {
                icon: 'terminal',
                title: 'Essential Toolkits',
                badge: 'System & OS',
                code: 'import os\nimport sys\nfrom pathlib import Path',
                desc: 'Accesses environment variables, interpreter paths, and filesystem servers.',
                color: 'border-sky-500/40 bg-sky-500/5 text-sky-400',
              },
              {
                icon: 'bot',
                title: 'Google AI & Models',
                badge: 'Autonomous Agents',
                code: 'from google.adk.agents import Agent\nfrom models import LiteLlm',
                desc: 'Constructs agent reasoning engines connected to Ollama and cloud LLMs.',
                color: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400',
              },
              {
                icon: 'wrench',
                title: 'Model Context Protocol',
                badge: 'MCP Toolset',
                code: 'tools = [crm_mcp]\nmcp = McpToolset(...)',
                desc: 'Integrates secure inter-process stdio pipes and external capabilities.',
                color: 'border-amber-500/40 bg-amber-500/5 text-amber-400',
              },
              {
                icon: 'workflow',
                title: 'Core Functions & Rules',
                badge: 'Execution Logic',
                code: 'def agent_react(values):\n    return { "status": 200 }',
                desc: 'Orchestrates parameter handling, guardrails, and structured return payloads.',
                color: 'border-blue-500/40 bg-blue-500/5 text-blue-400',
              },
            ].map((pillar, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl border border-[#E1DFDD] bg-white hover:border-[#0067B8] hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <BlueprintIcon name={pillar.icon} withContainer className="w-4 h-4" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border border-slate-300 text-slate-600 bg-slate-50">
                      {pillar.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#0e1726] mb-2">
                    {pillar.title}
                  </h3>
                  <pre className="font-mono text-[11px] bg-[#161b22] text-slate-200 p-2.5 rounded-md border border-[#30363d] overflow-x-auto mb-3 whitespace-pre">
                    {pillar.code}
                  </pre>
                  <p className="text-xs text-[#616161] leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#f0f0f0] flex items-center gap-1 text-[11px] font-semibold text-[#0067B8]">
                  <span>Visual Blueprint Active</span>
                  <span>──&gt;</span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-[#8e989e] mt-6">
            Aligned line-by-line in the workspace · Real-time synchronized scrolling with zero input latency
          </p>
        </div>
      </section>

      {/* ─── SECTION 3: FEATURE CARDS ────────────────────────────────────────── */}
      <section id="features" className="py-16 bg-[#F3F7FB] border-b border-[#E1DFDD]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center sm:text-left">
            <span className="text-[12px] font-semibold uppercase tracking-widest text-[#0067B8] mb-2 block">
              Core Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0e1726] tracking-tight mb-2">
              Everything You Need to Understand Code
            </h2>
            <p className="text-sm text-[#616161] max-w-xl">
              Learn programming concepts through examples, clear explanations, and hands-on practice.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: <BookOpen className="w-5 h-5" />,
                title: 'Line-by-Line Code Breakdown',
                desc: 'Understand variables, loops, conditions, and functions with simple explanations in your preferred language.',
                cta: 'Explore Code Examples',
                id: 'feature-breakdown',
                action: () => document.getElementById('line-by-line')?.scrollIntoView({ behavior: 'smooth' }),
              },
              {
                icon: <Globe className="w-5 h-5" />,
                title: 'Learn in Your Language',
                desc: 'Switch between supported native-language explanations while keeping programming syntax intact.',
                cta: 'Choose Your Language',
                id: 'feature-language',
                action: () => document.getElementById('languages')?.scrollIntoView({ behavior: 'smooth' }),
              },
              {
                icon: <Bug className="w-5 h-5" />,
                title: 'Understand and Fix Errors',
                desc: 'Understand what went wrong, why an error occurred, and how to approach a fix step by step.',
                cta: 'Explore Debugging',
                id: 'feature-debug',
                action: () =>
                  onNavigate('workspace', {
                    code: `# Code with an error:\ndef calculate_average(nums):\n    total = sum(nums)\n    return total / len(nums)\n\nprint(calculate_average([]))  # ZeroDivisionError`,
                    programmingLanguage: 'python',
                    nativeLanguage: selectedLang,
                    title: 'Debugging Demo',
                  }),
              },
              {
                icon: <Terminal className="w-5 h-5" />,
                title: 'Write, Run, and Practice',
                desc: 'Test examples in the browser, inspect the output, and practise programming concepts.',
                cta: 'Open Playground',
                id: 'feature-playground',
                action: () => document.getElementById('playground')?.scrollIntoView({ behavior: 'smooth' }),
              },
            ].map((card) => (
              <div
                key={card.id}
                className="p-6 rounded-xl border border-[#E1DFDD] bg-white hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-[#EBF3FC] text-[#0067B8] flex items-center justify-center mb-4 group-hover:bg-[#0067B8] group-hover:text-white transition-colors">
                    {card.icon}
                  </div>
                  <h3 className="font-bold text-[15px] text-[#0e1726] mb-2">{card.title}</h3>
                  <p className="text-xs text-[#616161] leading-relaxed mb-5">{card.desc}</p>
                </div>
                <button
                  id={card.id}
                  onClick={card.action}
                  className="text-xs font-semibold text-[#0067B8] hover:underline flex items-center gap-1.5 text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0067B8]"
                >
                  <span>{card.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 4: LINE-BY-LINE BREAKDOWN ───────────────────────────────── */}
      <section id="line-by-line" className="py-16 lg:py-24 bg-white border-b border-[#E1DFDD]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

            {/* Left: Interactive Line Inspector */}
            <div className="lg:col-span-6">
              <div className="bg-[#F5F6F8] rounded-xl p-5 border border-[#E1DFDD] shadow-sm">
                <div className="bg-white rounded-lg p-4 border border-[#E1DFDD] space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#EDEBE9] text-xs font-semibold">
                    <span className="text-[#0067B8] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      CODE EXPLAINED — {SUPPORTED_NATIVE_LANGUAGES.find((l) => l.key === selectedLang)?.native}
                    </span>
                    <span className="text-[#616161] font-mono text-[11px]">Python 3.12</span>
                  </div>

                  {/* Code Block with line number indicator */}
                  <div className="bg-[#1B1B1B] text-slate-100 rounded-lg p-3 font-mono text-xs overflow-x-auto leading-relaxed">
                    <div
                      onClick={() => setActiveLine(1)}
                      className={`cursor-pointer px-2 py-1 rounded transition-colors flex items-center gap-3 ${
                        activeLine === 1 ? 'bg-[#0078d4]/30 border-l-2 border-[#0078d4] text-white' : 'hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-slate-500 w-3 text-right">1</span>
                      <span>numbers = [10, 20, 30]</span>
                    </div>
                    <div className="px-2 py-0.5 text-slate-600">
                      <span className="text-slate-500 w-3 text-right inline-block mr-3">2</span>
                    </div>
                    <div
                      onClick={() => setActiveLine(2)}
                      className={`cursor-pointer px-2 py-1 rounded transition-colors flex items-center gap-3 ${
                        activeLine === 2 ? 'bg-[#0078d4]/30 border-l-2 border-[#0078d4] text-white' : 'hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-slate-500 w-3 text-right">3</span>
                      <span>for number in numbers:</span>
                    </div>
                    <div
                      onClick={() => setActiveLine(3)}
                      className={`cursor-pointer px-2 py-1 rounded transition-colors flex items-center gap-3 ${
                        activeLine === 3 ? 'bg-[#0078d4]/30 border-l-2 border-[#0078d4] text-white' : 'hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-slate-500 w-3 text-right">4</span>
                      <span className="pl-4">print(number)</span>
                    </div>
                  </div>

                  {/* Line Explanation Cards */}
                  <div className="space-y-2">
                    {currentLineByLineData.map((row) => {
                      const isActive = activeLine === row.n;
                      return (
                        <div
                          key={row.n}
                          onClick={() => setActiveLine(row.n)}
                          className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[#F4FAFF] border-[#0067B8] shadow-2xs'
                              : 'bg-white border-[#EDEBE9] hover:bg-[#FAFBFD]'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded font-mono text-xs flex items-center justify-center shrink-0 font-bold mt-0.5 ${
                              isActive ? 'bg-[#0067B8] text-white' : 'bg-[#EBF3FC] text-[#0067B8]'
                            }`}
                          >
                            {row.n}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <code className="text-[11px] font-mono text-[#3a4c56] font-semibold">
                                {row.code}
                              </code>
                              <span className="text-[10px] text-[#0067B8] bg-[#EBF3FC] px-1.5 py-0.5 rounded">
                                {row.note}
                              </span>
                            </div>
                            <p className="text-xs text-[#0e1726] leading-relaxed">
                              {row.expl}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Copy & Value Proposition */}
            <div className="lg:col-span-6 flex flex-col items-start">
              <span className="text-[12px] font-semibold uppercase tracking-widest text-[#0067B8] mb-3">
                CODE EXPLAINED SIMPLY
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0e1726] tracking-tight leading-snug mb-4">
                Understand the Logic Behind Every Line
              </h2>
              <p className="text-sm text-[#616161] leading-relaxed mb-6">
                Learn what your code does, why each step matters, and how the program reaches its result. Get clear, step-by-step explanations in the language you understand best.
              </p>

              <ul className="space-y-3 text-xs sm:text-sm text-[#0e1726] mb-8">
                {[
                  'Understand variables, loops, conditions, and functions',
                  'Follow program execution one line at a time',
                  'See how variable values change at each step',
                  'Learn the logic instead of memorizing code',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#0067B8] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <button
                id="breakdown-cta"
                onClick={() => handleOpenInWorkspace(lineByLineSnippet, 'For Loop Demonstration')}
                className="px-6 py-2.5 rounded-[4px] bg-[#0067B8] hover:bg-[#005A9E] text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
              >
                Explore a Code Example
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ─── SECTION 5: AI CODING ASSISTANT ──────────────────────────────────── */}
      <section id="assistant" className="py-16 lg:py-24 bg-[#F3F7FB] border-b border-[#E1DFDD]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

            {/* Left: Copy & Suggested Questions */}
            <div className="lg:col-span-6 flex flex-col items-start">
              <span className="text-[12px] font-semibold uppercase tracking-widest text-[#0067B8] mb-3">
                YOUR PERSONAL CODING GUIDE
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0e1726] tracking-tight leading-snug mb-4">
                Stuck on a Line? Understand It in Your Language.
              </h2>
              <p className="text-sm text-[#616161] leading-relaxed mb-6">
                Ask a question about your code. Get a simple explanation, understand the error, and learn how to approach the problem step by step.
              </p>

              {/* Clickable Question Chips */}
              <div className="w-full mb-6">
                <span className="text-xs font-semibold text-[#0e1726] mb-2.5 block">
                  Select an example student question:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'loop', label: 'Why does this loop run five times?' },
                    { key: 'func', label: `Explain this function in ${SUPPORTED_NATIVE_LANGUAGES.find((l) => l.key === selectedLang)?.english || 'my language'}` },
                    { key: 'error', label: 'Why am I getting this error?' },
                    { key: 'execute', label: 'Show me how this code executes' },
                  ].map((chip) => (
                    <button
                      key={chip.key}
                      onClick={() => setActiveQuestionKey(chip.key as any)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                        activeQuestionKey === chip.key
                          ? 'bg-[#0067B8] text-white border-[#0067B8] font-semibold shadow-2xs'
                          : 'bg-white text-[#3a4c56] border-[#E1DFDD] hover:border-[#0067B8]'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                id="ai-assistant-cta"
                onClick={() => onNavigate('workspace')}
                className="px-6 py-2.5 rounded-[4px] bg-[#0067B8] hover:bg-[#005A9E] text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
              >
                Try the AI Code Assistant
              </button>
            </div>

            {/* Right: Realistic Conversational Demonstration */}
            <div className="lg:col-span-6">
              <div className="bg-white rounded-xl p-5 border border-[#E1DFDD] shadow-sm">
                <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#EDEBE9]">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-[#0e1726]">BhashaCode AI Mentor</span>
                  <span className="ml-auto text-[11px] bg-[#EBF3FC] text-[#0067B8] px-2.5 py-0.5 rounded font-semibold">
                    {SUPPORTED_NATIVE_LANGUAGES.find((l) => l.key === selectedLang)?.native}
                  </span>
                </div>

                {/* Chat Stream */}
                <div className="space-y-3.5 text-xs">
                  {/* Student Question */}
                  <div className="flex justify-end">
                    <div className="bg-[#0067B8] text-white p-3.5 rounded-2xl rounded-tr-xs max-w-[85%] leading-relaxed shadow-2xs">
                      {currentAiPair.q}
                    </div>
                  </div>

                  {/* AI Mentor Answer */}
                  <div className="flex justify-start">
                    <div className="bg-[#F5F6F8] text-[#242424] p-4 rounded-2xl rounded-tl-xs border border-[#E1DFDD] max-w-[94%] leading-relaxed shadow-2xs">
                      <p className="font-bold text-[#0067B8] mb-1.5 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#0067B8]" />
                        <span>AI గురువు (Mentor):</span>
                      </p>
                      {currentAiPair.snippet && (
                        <pre className="bg-[#1B1B1B] text-slate-100 p-2.5 rounded-md mb-2 text-[11px] font-mono overflow-x-auto">
                          {currentAiPair.snippet}
                        </pre>
                      )}
                      <p className="text-xs text-[#0e1726]">{currentAiPair.a}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#EDEBE9] flex items-center justify-between text-[11px] text-[#8e989e]">
                  <span>Interactive demonstration</span>
                  <button
                    onClick={() => onNavigate('workspace')}
                    className="text-[#0067B8] font-semibold hover:underline cursor-pointer"
                  >
                    Open Full Chat →
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── SECTION 6: INTERACTIVE PLAYGROUND ──────────────────────────────── */}
      <section id="playground" className="py-20 bg-white border-b border-[#E1DFDD]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-[12px] font-semibold uppercase tracking-widest text-[#0067B8] mb-2 block">
              LIVE INTERACTIVE PLAYGROUND
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0e1726] tracking-tight mb-2">
              Write Code. See What Happens. Understand Why.
            </h2>
            <p className="text-sm text-[#616161]">
              Experiment with code, inspect the output, and learn how each step works.
            </p>
          </div>

          <div className="bg-[#F3F7FB] rounded-xl border border-[#E1DFDD] p-5 shadow-sm">
            
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-5 border-b border-[#EDEBE9]">
              {/* Example Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#616161]">Example:</span>
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#E1DFDD]">
                  {(['loop', 'condition', 'function'] as const).map((key) => (
                    <button
                      key={key}
                      id={`playground-tab-${key}`}
                      onClick={() => handleSelectSnippet(key)}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                        playgroundSnippet === key
                          ? 'bg-[#0067B8] text-white shadow-2xs'
                          : 'text-[#616161] hover:text-[#0e1726]'
                      }`}
                    >
                      {demoSnippets[key].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Selector + Run & Reset Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-[#0067B8]" />
                  <span className="text-xs font-semibold text-[#616161]">Language:</span>
                  <select
                    id="playground-lang-selector"
                    value={selectedLang}
                    onChange={(e) => setSelectedLang(e.target.value as NativeLanguageKey)}
                    className="px-3 py-1 text-xs font-semibold rounded-md bg-white border border-[#E1DFDD] text-[#242424] outline-none cursor-pointer focus:ring-2 focus:ring-[#0067B8]"
                    aria-label="Select explanation language"
                  >
                    {SUPPORTED_NATIVE_LANGUAGES.map((lang) => (
                      <option key={lang.key} value={lang.key}>
                        {lang.native} ({lang.english})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  id="playground-reset-btn"
                  onClick={handleResetPlayground}
                  title="Reset to original code"
                  className="px-3 py-1 text-xs font-semibold rounded-md bg-white border border-[#E1DFDD] hover:bg-slate-50 text-[#616161] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>

                <button
                  id="playground-run-btn"
                  onClick={handleRunPlayground}
                  disabled={isRunning}
                  className="px-4 py-1 text-xs font-semibold rounded-md bg-[#0067B8] hover:bg-[#005A9E] text-white flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Running...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Run Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Editor on Left + Split Tabs on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              
              {/* Code Editor Panel */}
              <div className="bg-[#1B1B1B] text-slate-100 rounded-xl p-4 font-mono text-xs sm:text-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-700 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 text-white font-semibold">
                      <Code2 className="w-3.5 h-3.5 text-[#4EC9B0]" />
                      {currentSnippet.prog} · {currentSnippet.label}
                    </span>
                    <span className="text-slate-400 text-[11px]">Interactive Python</span>
                  </div>
                  <textarea
                    value={playgroundCode}
                    onChange={(e) => setPlaygroundCode(e.target.value)}
                    rows={8}
                    className="w-full bg-transparent text-slate-100 font-mono text-xs sm:text-sm leading-relaxed outline-none resize-none"
                    spellCheck={false}
                  />
                </div>
                <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-800 flex items-center justify-between">
                  <span>Type or edit any line above</span>
                  <span className="text-[#4EC9B0]">Sandbox Ready</span>
                </div>
              </div>

              {/* Tabs: Explanation / Output */}
              <div className="bg-white rounded-xl p-4 border border-[#E1DFDD] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#EDEBE9]">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPlaygroundTab('explanation')}
                        className={`text-xs font-bold pb-1 transition-colors cursor-pointer ${
                          playgroundTab === 'explanation'
                            ? 'text-[#0067B8] border-b-2 border-[#0067B8]'
                            : 'text-[#616161] hover:text-[#0e1726]'
                        }`}
                      >
                        Line-by-Line Explanation
                      </button>
                      <button
                        id="playground-tab-nativecode"
                        onClick={() => setPlaygroundTab('nativeCode')}
                        className={`text-xs font-bold pb-1 transition-colors cursor-pointer ${
                          playgroundTab === 'nativeCode'
                            ? 'text-[#0067B8] border-b-2 border-[#0067B8]'
                            : 'text-[#616161] hover:text-[#0e1726]'
                        }`}
                      >
                        {SUPPORTED_NATIVE_LANGUAGES.find((l) => l.key === selectedLang)?.native || 'తెలుగు'} {NATIVE_CODE_WORD[selectedLang] || 'కోడ్'}
                      </button>
                      <button
                        onClick={() => setPlaygroundTab('output')}
                        className={`text-xs font-bold pb-1 transition-colors cursor-pointer flex items-center gap-1.5 ${
                          playgroundTab === 'output'
                            ? 'text-[#0067B8] border-b-2 border-[#0067B8]'
                            : 'text-[#616161] hover:text-[#0e1726]'
                        }`}
                      >
                        <span>Terminal Output</span>
                        {playgroundOutput && (
                          <span
                            className={`w-2 h-2 rounded-full ${
                              runStats?.success ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'
                            }`}
                          />
                        )}
                      </button>
                    </div>

                    <span className="text-[10px] text-[#0067B8] bg-[#EBF3FC] px-2 py-0.5 rounded font-semibold">
                      {SUPPORTED_NATIVE_LANGUAGES.find((l) => l.key === selectedLang)?.native}
                    </span>
                  </div>

                  {/* Tab 1: Line Explanation */}
                  {playgroundTab === 'explanation' && (
                    <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                      {playgroundExplanations.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 p-2 rounded-lg bg-[#F4FAFF] border border-[#dceef8]"
                        >
                          <span className="w-5 h-5 rounded bg-[#EBF3FC] text-[#0067B8] font-mono text-[10px] flex items-center justify-center shrink-0 font-bold mt-0.5">
                            {item.line}
                          </span>
                          <p className="text-xs text-[#242424] leading-relaxed">{item.expl}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tab 2: Native Code Transliteration */}
                  {playgroundTab === 'nativeCode' && (
                    <div className="bg-[#1e1e1e] p-3 rounded-lg font-mono text-xs max-h-[260px] overflow-auto leading-6 text-[#d4d4d4]">
                      <HighlightedCodeBlock code={transliteratedPlaygroundCode} />
                    </div>
                  )}

                  {/* Tab 3: Terminal Output */}
                  {playgroundTab === 'output' && (
                    <div className="bg-[#121820] p-3 rounded-lg font-mono text-xs min-h-[180px] max-h-[260px] overflow-y-auto flex flex-col justify-between">
                      <div>
                        <div className="text-[11px] text-slate-400 pb-1.5 mb-2 border-b border-slate-700 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span>Python 3.11 Runtime</span>
                            {runStats && (
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  runStats.success
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                {runStats.success ? '● Success (Exit 0)' : `● Error (Exit ${runStats.exitCode})`}
                              </span>
                            )}
                          </div>
                          {runStats && <span>{runStats.durationMs}ms</span>}
                        </div>
                        {isRunning ? (
                          <div className="text-slate-400 flex items-center gap-2 py-4">
                            <Loader2 className="w-4 h-4 animate-spin text-[#0078D4]" />
                            <span>Executing code in Python 3.11 engine...</span>
                          </div>
                        ) : (
                          <pre
                            className={`whitespace-pre-wrap leading-relaxed ${
                              runStats && !runStats.success ? 'text-rose-400 font-mono' : 'text-emerald-400 font-mono'
                            }`}
                          >
                            {playgroundOutput ||
                              `Click "Run Code" above to execute this Python code live in the sandbox.`}
                          </pre>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-3 border-t border-[#EDEBE9] flex items-center justify-between">
                  <span className="text-[11px] text-[#8e989e]">
                    Paste your own code in the full workspace
                  </span>
                  <button
                    id="playground-open-workspace"
                    onClick={() => handleOpenInWorkspace()}
                    className="text-xs font-semibold text-[#0067B8] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Open in Full Workspace <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ─── SECTION 7: GUIDED LEARNING PATH ─────────────────────────────────── */}
      <section id="learning-path" className="py-20 bg-[#F3F7FB] border-b border-[#E1DFDD]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[12px] font-semibold uppercase tracking-widest text-[#0067B8] mb-2 block">
              GUIDED LEARNING PATH
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0e1726] tracking-tight mb-2">
              Start Small. Understand More. Build Real Skills.
            </h2>
            <p className="text-sm text-[#616161]">
              A beginner-friendly sequence from your first program to practical mini projects.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {learningPath.map((item) => (
              <div
                key={item.step}
                className="bg-white rounded-xl border border-[#E1DFDD] p-5 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <span className="w-7 h-7 rounded-full bg-[#EBF3FC] text-[#0067B8] font-bold text-xs flex items-center justify-center shrink-0">
                      {item.step}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${difficultyColor(
                        item.difficulty
                      )}`}
                    >
                      {item.difficulty}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-[#0e1726] mb-1.5">{item.title}</h3>
                  <p className="text-xs text-[#616161] leading-relaxed mb-3">{item.desc}</p>
                </div>

                <div>
                  <pre className="text-[11px] font-mono bg-[#1B1B1B] text-slate-300 p-2.5 rounded-lg overflow-x-auto mb-3 leading-relaxed">
                    {item.example}
                  </pre>
                  <button
                    id={`learning-step-${item.step}`}
                    onClick={() => handleOpenInWorkspace(item.example, item.title)}
                    className="text-xs font-semibold text-[#0067B8] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Start this topic <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 8: PRICING ───────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 bg-white border-b border-[#E1DFDD]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-[12px] font-semibold uppercase tracking-widest text-[#0067B8] mb-2 block">
              BHASHACODE PLANS
            </span>
            <h2 className="text-3xl font-bold text-[#0e1726] tracking-tight mb-2">
              Choose the Right Way to Learn
            </h2>
            <p className="text-sm text-[#616161]">
              Start with the free experience and upgrade when you need more practice or advanced assistance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
            {/* Free Plan */}
            <div className="p-8 rounded-xl border border-[#E1DFDD] bg-white flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#0e1726] mb-1">BhashaCode Free</h3>
                <p className="text-xs text-[#616161] mb-6">
                  For students and beginners getting started with programming.
                </p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-bold text-[#0e1726]">₹0</span>
                  <span className="text-xs text-[#616161]">/ forever</span>
                </div>
                <ul className="space-y-3 text-xs text-[#0e1726] mb-8">
                  {[
                    '20 AI code explanations per day',
                    'All 8 native languages supported',
                    'Python, JavaScript, TypeScript, Java, C++, Go, Rust',
                    'Save up to 15 personal code projects',
                    'Interactive browser sandbox execution',
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#0067B8] shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                id="pricing-free-cta"
                onClick={() => {
                  if (user) onNavigate('workspace');
                  else openAuthModal('signup');
                }}
                className="w-full py-2.5 rounded-[4px] bg-white hover:bg-[#EBF3FC] text-[#0067B8] border border-[#0067B8] font-semibold text-xs transition-colors cursor-pointer"
              >
                {user ? 'Open Workspace' : 'Get started for free'}
              </button>
            </div>

            {/* Pro Plan */}
            <div className="p-8 rounded-xl border-2 border-[#0067B8] bg-white shadow-md flex flex-col justify-between relative">
              <div className="absolute -top-3 left-6 bg-[#0067B8] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-sm">
                Most Popular
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0e1726] mb-1">BhashaCode Pro</h3>
                <p className="text-xs text-[#616161] mb-6">
                  For placement preparation and intense study sessions.
                </p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-bold text-[#0e1726]">₹399</span>
                  <span className="text-xs text-[#616161]">/ month</span>
                </div>
                <ul className="space-y-3 text-xs text-[#0e1726] mb-8 font-medium">
                  {[
                    '200 AI explanations per day',
                    'Advanced algorithmic code debugger',
                    'Priority low-latency server inference',
                    'Unlimited saved code projects',
                    'All Free plan features included',
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#0067B8] shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                id="pricing-pro-cta"
                onClick={() => onNavigate('pricing')}
                className="w-full py-2.5 rounded-[4px] bg-[#0067B8] hover:bg-[#005A9E] text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
              >
                View Pro plan details
              </button>
            </div>

            {/* Campus & Enterprise */}
            <div className="p-8 rounded-xl border border-[#E1DFDD] bg-white flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#0e1726] mb-1">Campus &amp; Enterprise</h3>
                <p className="text-xs text-[#616161] mb-6">
                  For engineering colleges and educational institutions.
                </p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-2xl font-bold text-[#0e1726]">Custom</span>
                  <span className="text-xs text-[#616161]">/ department</span>
                </div>
                <ul className="space-y-3 text-xs text-[#0e1726] mb-8">
                  {[
                    'Bulk student accounts',
                    'Department-wide shared code labs',
                    'Teacher review console and progress',
                    'Custom domain and college SSO',
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#0067B8] shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                id="pricing-campus-cta"
                onClick={() => onNavigate('docs')}
                className="w-full py-2.5 rounded-[4px] bg-[#F3F7FB] hover:bg-slate-200 text-[#0e1726] font-semibold text-xs transition-colors cursor-pointer"
              >
                Contact Campus Team
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 9: FAQ ───────────────────────────────────────────────────── */}
      <section id="faqs" className="py-20 bg-[#F3F7FB] border-b border-[#E1DFDD]">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-[12px] font-semibold uppercase tracking-widest text-[#0067B8] mb-2 block">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0e1726] tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-2.5">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-[#E1DFDD] shadow-2xs overflow-hidden"
              >
                <button
                  id={`faq-${idx}`}
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full text-left flex items-center justify-between gap-4 p-4 font-semibold text-sm text-[#0e1726] hover:text-[#0067B8] transition-colors cursor-pointer"
                  aria-expanded={openFaq === idx}
                  aria-controls={`faq-answer-${idx}`}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#8e989e] transition-transform shrink-0 ${
                      openFaq === idx ? 'rotate-180 text-[#0067B8]' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div
                    id={`faq-answer-${idx}`}
                    className="px-4 pb-4 text-xs text-[#616161] leading-relaxed border-t border-[#EDEBE9] pt-3"
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 10: FINAL CTA ────────────────────────────────────────────── */}
      <section className="py-20 bg-[#0e1726]">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight mb-4">
            Your First Clear Coding Explanation Starts Here.
          </h2>
          <p className="text-sm sm:text-base text-[#9ab0c8] mb-8 max-w-xl mx-auto leading-relaxed">
            Choose a language, open an example, and start understanding code one line at a time.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              id="final-cta-playground"
              onClick={handleTryPlayground}
              className="px-7 py-3 rounded-[4px] bg-[#0067B8] hover:bg-[#005A9E] text-white font-semibold text-sm transition-colors shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              Try Live Playground
            </button>
            <button
              id="final-cta-topics"
              onClick={() =>
                document.getElementById('learning-path')?.scrollIntoView({ behavior: 'smooth' })
              }
              className="px-7 py-3 rounded-[4px] border border-white/30 hover:border-white/60 text-white/90 hover:text-white font-semibold text-sm transition-colors cursor-pointer"
            >
              Explore Learning Topics
            </button>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="bg-[#F2F2F2] text-[#616161] py-12 text-xs border-t border-[#E1DFDD]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <h4 className="font-semibold text-[#0e1726] text-xs mb-3">Learn</h4>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => handleOpenInWorkspace('print("Hello, World!")', 'Python Basics')}
                    className="hover:underline hover:text-[#0e1726] cursor-pointer"
                  >
                    Python Basics
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      document.getElementById('playground')?.scrollIntoView({ behavior: 'smooth' })
                    }
                    className="hover:underline hover:text-[#0e1726] cursor-pointer"
                  >
                    Code Examples
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      document.getElementById('learning-path')?.scrollIntoView({ behavior: 'smooth' })
                    }
                    className="hover:underline hover:text-[#0e1726] cursor-pointer"
                  >
                    Learning Paths
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      document.getElementById('playground')?.scrollIntoView({ behavior: 'smooth' })
                    }
                    className="hover:underline hover:text-[#0e1726] cursor-pointer"
                  >
                    Interactive Playground
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-[#0e1726] text-xs mb-3">Visual Blueprints</h4>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() =>
                      document.getElementById('languages')?.scrollIntoView({ behavior: 'smooth' })
                    }
                    className="hover:underline hover:text-[#0e1726] cursor-pointer"
                  >
                    Essential Toolkits
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      document.getElementById('languages')?.scrollIntoView({ behavior: 'smooth' })
                    }
                    className="hover:underline hover:text-[#0e1726] cursor-pointer"
                  >
                    AI Agent Connections
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      document.getElementById('languages')?.scrollIntoView({ behavior: 'smooth' })
                    }
                    className="hover:underline hover:text-[#0e1726] cursor-pointer"
                  >
                    MCP Protocol Setup
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      document.getElementById('languages')?.scrollIntoView({ behavior: 'smooth' })
                    }
                    className="hover:underline hover:text-[#0e1726] cursor-pointer"
                  >
                    Execution Logic & Flow
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-[#0e1726] text-xs mb-3">Platform</h4>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() =>
                      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
                    }
                    className="hover:underline hover:text-[#0e1726] cursor-pointer"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      document.getElementById('assistant')?.scrollIntoView({ behavior: 'smooth' })
                    }
                    className="hover:underline hover:text-[#0e1726] cursor-pointer"
                  >
                    AI Code Assistant
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('pricing')}
                    className="hover:underline hover:text-[#0e1726] cursor-pointer"
                  >
                    Pricing
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      document.getElementById('languages')?.scrollIntoView({ behavior: 'smooth' })
                    }
                    className="hover:underline hover:text-[#0e1726] cursor-pointer"
                  >
                    Supported Languages
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-[#0e1726] text-xs mb-3">Company &amp; Support</h4>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => onNavigate('docs')}
                    className="hover:underline hover:text-[#0e1726] cursor-pointer"
                  >
                    About
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('docs')}
                    className="hover:underline hover:text-[#0e1726] cursor-pointer"
                  >
                    Contact
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      document.getElementById('faqs')?.scrollIntoView({ behavior: 'smooth' })
                    }
                    className="hover:underline hover:text-[#0e1726] cursor-pointer"
                  >
                    FAQ
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('docs')}
                    className="hover:underline hover:text-[#0e1726] cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('docs')}
                    className="hover:underline hover:text-[#0e1726] cursor-pointer"
                  >
                    Terms of Service
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-[#E1DFDD] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#8e989e]">
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-[#0067B8]" />
              <span>8 native languages supported · Built for Indian learners</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <button onClick={() => onNavigate('docs')} className="hover:underline cursor-pointer">
                Privacy
              </button>
              <button onClick={() => onNavigate('docs')} className="hover:underline cursor-pointer">
                Terms
              </button>
              <button onClick={() => onNavigate('docs')} className="hover:underline cursor-pointer">
                Contact
              </button>
              <span>© 2026 BhashaCode Education. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── FEEDBACK MODAL ───────────────────────────────────────────────────── */}
      {feedbackOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-[#e6e9ea] shadow-2xl max-w-md w-full p-6 text-left relative">
            <button
              onClick={() => {
                setFeedbackOpen(false);
                setFeedbackSuccess(false);
              }}
              className="absolute top-4 right-4 text-[#8e989e] hover:text-[#0e1726] p-1 transition-colors cursor-pointer"
              aria-label="Close feedback modal"
            >
              ✕
            </button>
            {!feedbackSuccess ? (
              <>
                <h3 className="text-base font-bold text-[#0e1726] mb-1">
                  Send feedback to BhashaCode
                </h3>
                <p className="text-xs text-[#3a4c56] mb-4">
                  Help us improve vernacular programming education across India.
                </p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    ['smile', '😊', 'I like something'],
                    ['idea', '💡', 'Suggestion'],
                    ['frown', '🙁', 'Issue / bug'],
                  ].map(([type, emoji, label]) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFeedbackType(type as any)}
                      className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                        feedbackType === type
                          ? 'border-[#0067B8] bg-[#F4FAFF] text-[#0067B8] font-semibold'
                          : 'border-[#e6e9ea] text-[#3a4c56] hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xl mb-1">{emoji}</div>
                      <div className="text-[11px]">{label}</div>
                    </button>
                  ))}
                </div>
                <div className="mb-4">
                  <label
                    htmlFor="feedback-text"
                    className="block text-xs font-semibold text-[#0e1726] mb-1.5"
                  >
                    What would you like to share?
                  </label>
                  <textarea
                    id="feedback-text"
                    rows={4}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Tell us what you liked or suggest a feature..."
                    className="w-full text-xs p-3 rounded-lg border border-[#8e989e] focus:border-[#0067B8] focus:outline-none text-[#0e1726]"
                  />
                </div>
                <div className="flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFeedbackOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-[#3a4c56] hover:text-[#0e1726] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (feedbackText.trim()) setFeedbackSuccess(true);
                    }}
                    disabled={!feedbackText.trim()}
                    className="px-5 py-2 rounded-[4px] bg-[#0e1726] hover:bg-[#1e304f] disabled:opacity-50 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Submit
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                  ✓
                </div>
                <h3 className="text-base font-bold text-[#0e1726] mb-1">Thank you!</h3>
                <p className="text-xs text-[#3a4c56] mb-5">
                  Your feedback helps improve BhashaCode for learners everywhere.
                </p>
                <button
                  onClick={() => {
                    setFeedbackOpen(false);
                    setFeedbackSuccess(false);
                    setFeedbackText('');
                  }}
                  className="px-5 py-2 rounded-[4px] bg-[#0067B8] text-white text-xs font-semibold hover:bg-[#005A9E] transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
