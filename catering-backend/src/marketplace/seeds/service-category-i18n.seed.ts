/** Hindi + Gujarati copy for marketplace service categories (codes c1–c8). */

export type ServiceCategoryLocaleCopy = {
  name: string;
  shortDescription: string;
};

export type ServiceCategoryI18nRow = {
  code: string;
  hi: ServiceCategoryLocaleCopy;
  gu: ServiceCategoryLocaleCopy;
};

export const SERVICE_CATEGORY_I18N: readonly ServiceCategoryI18nRow[] = [
  {
    code: 'c1',
    hi: {
      name: 'विवाह एवं शादी की कैटरिंग',
      shortDescription:
        'पूर्ण विवाह मेनू, लाइव काउंटर और बुफे व्यवस्था।',
    },
    gu: {
      name: 'લગ્ન અને વિવાહ કેટરિંગ',
      shortDescription:
        'સંપૂર્ણ લગ્ન મેનૂ, લાઇવ કાઉન્ટર અને બુફે વ્યવસ્થા.',
    },
  },
  {
    code: 'c2',
    hi: {
      name: 'जन्मदिन पार्टी कैटरिंग',
      shortDescription:
        'बच्चों के अनुकूल स्प्रेड, स्नैक्स और सेलिब्रेशन केक।',
    },
    gu: {
      name: 'જન્મદિન પાર્ટી કેટરિંગ',
      shortDescription:
        'બાળકો માટે અનુકૂળ સ્પ્રેડ, સ્નેક્સ અને સેલિબ્રેશન કેક.',
    },
  },
  {
    code: 'c3',
    hi: {
      name: 'कॉर्पोरेट एवं ऑफिस कैटरिंग',
      shortDescription:
        'बॉक्स लंच, वर्किंग लंच और बड़े टीम इवेंट।',
    },
    gu: {
      name: 'કોર્પોરેટ અને ઓફિસ કેટરિંગ',
      shortDescription:
        'બોક્સ લંચ, વર્કિંગ લંચ અને મોટા ટીમ ઇવેન્ટ.',
    },
  },
  {
    code: 'c4',
    hi: {
      name: 'बुफे कैटरिंग',
      shortDescription: 'मल्टी-क्यूज़ीन बुफे सेवा स्टाफ के साथ।',
    },
    gu: {
      name: 'બુફે કેટરિંગ',
      shortDescription: 'મલ્ટી-ક્યુઝિન બુફે સર્વિસ સ્ટાફ સાથે.',
    },
  },
  {
    code: 'c5',
    hi: {
      name: 'आउटडोर कैटरिंग',
      shortDescription: 'टेंट, ग्रिल और ऑन-लोकेशन किचन सपोर्ट।',
    },
    gu: {
      name: 'આઉટડોર કેટરિંગ',
      shortDescription: 'ટેન્ટ, ગ્રિલ અને ઓન-લોકેશન કિચન સપોર્ટ.',
    },
  },
  {
    code: 'c6',
    hi: {
      name: 'होम कैटरिंग',
      shortDescription: 'आपके घर पर अंतरंग समारोह।',
    },
    gu: {
      name: 'હોમ કેટરિંગ',
      shortDescription: 'તમારા ઘરે અંતરંગ સમારોહ.',
    },
  },
  {
    code: 'c7',
    hi: {
      name: 'सगाई की कैटरिंग',
      shortDescription: 'रिंग सेरेमनी और पारिवारिक कार्यक्रम।',
    },
    gu: {
      name: 'સગાઈ કેટરિંગ',
      shortDescription: 'રિંગ સેરેમની અને કુટુંબીય કાર્યક્રમ.',
    },
  },
  {
    code: 'c8',
    hi: {
      name: 'बीबीक्यू एवं लाइव ग्रिल',
      shortDescription: 'लाइव ग्रिल, सीख और आउटडोर डाइनिंग।',
    },
    gu: {
      name: 'બીબીક્યુ અને લાઇવ ગ્રિલ',
      shortDescription: 'લાઇવ ગ્રિલ, સીક અને આઉટડોર ડાઇનિંગ.',
    },
  },
];
