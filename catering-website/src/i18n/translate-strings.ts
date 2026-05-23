/**
 * English UI string → Hindi / Gujarati. Used when building locale override catalogs.
 * Unknown strings fall back to English.
 */
export type LocaleTranslateTarget = "hi" | "gu";

const PHRASES: Record<string, { hi: string; gu: string }> = {
  "Loading…": { hi: "लोड हो रहा है…", gu: "લોડ થઈ રહ્યું છે…" },
  "Loading categories…": { hi: "श्रेणियाँ लोड हो रही हैं…", gu: "શ્રેણીઓ લોડ થઈ રહી છે…" },
  "No categories available": {
    hi: "कोई श्रेणी उपलब्ध नहीं",
    gu: "કોઈ શ્રેણી ઉપલબ્ધ નથી",
  },
  Home: { hi: "होम", gu: "હોમ" },
  Save: { hi: "सहेजें", gu: "સાચવો" },
  Cancel: { hi: "रद्द करें", gu: "રદ કરો" },
  "Contact us": { hi: "संपर्क करें", gu: "અમારો સંપર્ક કરો" },
  "Need help?": { hi: "मदद चाहिए?", gu: "મદદ જોઈએ?" },
  Online: { hi: "ऑनलाइन", gu: "ઓનલાઇન" },
  Required: { hi: "आवश्यक", gu: "જરૂરી" },
  Optional: { hi: "वैकल्पिक", gu: "વૈકલ્પિક" },
  Retry: { hi: "पुनः प्रयास", gu: "ફરી પ્રયાસ" },
  Prev: { hi: "पिछला", gu: "પાછળ" },
  Next: { hi: "अगला", gu: "આગળ" },
  "All rights reserved.": { hi: "सर्वाधिकार सुरक्षित।", gu: "સર્વાધિકાર સુરક્ષિત." },
  "Browse caterers": { hi: "कैटरर्स देखें", gu: "કેટરર્સ બ્રાઉઝ કરો" },
  "Account menu": { hi: "खाता मेनू", gu: "એકાઉન્ટ મેનુ" },
  Insights: { hi: "Insights", gu: "ઇનસાઇટ્સ" },
  Contact: { hi: "संपर्क", gu: "સંપર્ક" },
  "Sales & Support": { hi: "बिक्री और सहायता", gu: "વેચાણ અને સપોર્ટ" },
  "Sales & support": { hi: "बिक्री और सहायता", gu: "વેચાણ અને સપોર્ટ" },
  "Catering Services": { hi: "कैटरिंग सेवाएँ", gu: "કેટરિંગ સેવાઓ" },
  "Service Categories": { hi: "सेवा श्रेणियाँ", gu: "સેવા શ્રેણીઓ" },
  "For caterers": { hi: "कैटरर्स के लिए", gu: "કેટરર્સ માટે" },
  Packages: { hi: "पैकेज", gu: "પેકેજ" },
  Read: { hi: "पढ़ें", gu: "વાંચો" },
  "Get In Touch": { hi: "संपर्क में रहें", gu: "સંપર્ક કરો" },
  "Contact Us": { hi: "हमसे संपर्क करें", gu: "અમારો સંપર્ક કરો" },
  "Search caterers": { hi: "कैटरर्स खोजें", gu: "કેટરર્સ શોધો" },
  "Log in": { hi: "लॉग इन", gu: "લૉગ ઇન" },
  "Create an account": { hi: "खाता बनाएँ", gu: "એકાઉન્ટ બનાવો" },
  "View All Services →": { hi: "सभी सेवाएँ देखें →", gu: "બધી સેવાઓ જુઓ →" },
  "View all services →": { hi: "सभी सेवाएँ देखें →", gu: "બધી સેવાઓ જુઓ →" },
  Profile: { hi: "प्रोफ़ाइल", gu: "પ્રોફાઇલ" },
  "Log out": { hi: "लॉग आउट", gu: "લૉગ આઉટ" },
  "Open menu": { hi: "मेनू खोलें", gu: "મેનુ ખોલો" },
  "Close menu": { hi: "मेनू बंद करें", gu: "મેનુ બંધ કરો" },
  "Service categories": { hi: "सेवा श्रेणियाँ", gu: "સેવા શ્રેણીઓ" },
  Language: { hi: "भाषा", gu: "ભાષા" },
  "Select language": { hi: "भाषा चुनें", gu: "ભાષા પસંદ કરો" },
  Dashboard: { hi: "डैशबोर्ड", gu: "ડેશબોર્ડ" },
  Menu: { hi: "मेनू", gu: "મેનુ" },
  Orders: { hi: "ऑर्डर", gu: "ઓર્ડર" },
  Analytics: { hi: "विश्लेषण", gu: "એનાલિટિક્સ" },
  Overview: { hi: "अवलोकन", gu: "ઝલક" },
  Business: { hi: "व्यवसाय", gu: "વ્યવસાય" },
  Operations: { hi: "संचालन", gu: "ઓપરેશન" },
  "Sign out": { hi: "साइन आउट", gu: "સાઇન આઉટ" },
  Welcome: { hi: "स्वागत है", gu: "સ્વાગત છે" },
  "Quick actions": { hi: "त्वरित कार्य", gu: "ઝડપી ક્રિયાઓ" },
  "Submit for review": { hi: "समीक्षा के लिए जमा करें", gu: "સમીક્ષા માટે સબમિટ કરો" },
  "Submitting…": { hi: "जमा हो रहा है…", gu: "સબમિટ થઈ રહ્યું છે…" },
  "View public profile": { hi: "सार्वजनिक प्रोफ़ाइल देखें", gu: "જાહેર પ્રોફાઇલ જુઓ" },
  Filters: { hi: "फ़िल्टर", gu: "ફિલ્ટર" },
  "Find Best Caterers": { hi: "सर्वश्रेष्ठ कैटरर्स खोजें", gu: "શ્રેષ્ઠ કેટરર્સ શોધો" },
  About: { hi: "परिचय", gu: "વિશે" },
  Gallery: { hi: "गैलरी", gu: "ગેલરી" },
  Reviews: { hi: "समीक्षाएँ", gu: "સમીક્ષાઓ" },
  "Send message": { hi: "संदेश भेजें", gu: "સંદેશ મોકલો" },
  "Sending…": { hi: "भेजा जा रहा है…", gu: "મોકલાઈ રહ્યું છે…" },
  "Sign in": { hi: "साइन इन", gu: "સાઇન ઇન" },
  "Signing in…": { hi: "साइन इन हो रहा है…", gu: "સાઇન ઇન થઈ રહ્યું છે…" },
  "Privacy Policy": { hi: "गोपनीयता नीति", gu: "ગોપનીયતા નીતિ" },
  "Terms & Conditions": { hi: "नियम और शर्तें", gu: "નિયમો અને શરતો" },
  "Quick Links": { hi: "त्वरित लिंक", gu: "ઝડપી લિંક્સ" },
  "About Us": { hi: "हमारे बारे में", gu: "અમારા વિશે" },
  Blog: { hi: "ब्लॉग", gu: "બ્લોગ" },
  Services: { hi: "सेवाएँ", gu: "સેવાઓ" },
  Facebook: { hi: "Facebook", gu: "Facebook" },
  X: { hi: "X", gu: "X" },
  Instagram: { hi: "Instagram", gu: "Instagram" },
  Premium: { hi: "प्रीमियम", gu: "પ્રીમિયમ" },
  "Coming soon": { hi: "जल्द आ रहा है", gu: "ટૂંક સમયમાં" },
  Back: { hi: "वापस", gu: "પાછા" },
  Continue: { hi: "जारी रखें", gu: "ચાલુ રાખો" },
  Submit: { hi: "जमा करें", gu: "સબમિટ" },
  Caterer: { hi: "कैटरर", gu: "કેટરર" },
};

export function translateUiString(text: string, target: LocaleTranslateTarget): string {
  const exact = PHRASES[text];
  if (exact) return exact[target];

  let out = text;
  const sorted = Object.keys(PHRASES).sort((a, b) => b.length - a.length);
  for (const phrase of sorted) {
    if (out.includes(phrase)) {
      out = out.split(phrase).join(PHRASES[phrase]![target]);
    }
  }
  return out;
}

export function translateFlatMap(
  flat: Record<string, string>,
  target: LocaleTranslateTarget,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(flat)) {
    out[key] = translateUiString(value, target);
  }
  return out;
}
