/**
 * Multilingual Offline Knowledge Base
 * Translations for English and Hindi
 */

export type SupportedLanguage = 'en' | 'hi';

export const languageLabels: Record<SupportedLanguage, string> = {
  en: 'English',
  hi: 'हिन्दी',
};

export interface MultilingualEntry {
  id: string;
  category: string;
  translations: Partial<Record<SupportedLanguage, { question: string; answer: string; keywords: string[] }>>;
}

export const chatTranslations: Record<SupportedLanguage, any> = {
  en: {
    topics: {
      productCert: 'Product Certification',
      bisStandards: 'BIS Standards',
      hallmarking: 'Hallmarking',
      crs: 'Compulsory Registration Scheme (CRS)',
      safety: 'Consumer Safety',
    },
    examples: [
      'What BIS standards apply to electric heaters?',
      'How can I verify a BIS certification number?',
      'What is the process for ISI mark certification?',
      'Which products require compulsory BIS registration?',
    ],
    quickStart: [
      {
        title: 'Verify Certification',
        desc: 'Learn how to use the BIS Care App and verify R-numbers or CM/L numbers.',
        query: 'How can I verify an ISI mark on a product?',
      },
      {
        title: 'Mandatory Products',
        desc: 'Check the list of electronics, steel, and toys under compulsory certification.',
        query: 'What are the mandatory products under BIS certification?',
      },
      {
        title: 'Gold Hallmarking',
        desc: 'Understand the symbols on your gold jewellery (HUID, BIS logo, Purity).',
        query: 'Tell me about the Gold Hallmarking process in India.',
      },
      {
        title: 'New Application',
        desc: 'Step-by-step guide for manufacturers to register on ManakOnline.',
        query: 'What is the process to apply for a new BIS license?',
      },
    ],
    youMightAsk: 'You might also ask:',
  },
  hi: {
    topics: {
      productCert: 'उत्पाद प्रमाणन',
      bisStandards: 'BIS मानक',
      hallmarking: 'हॉलमार्किंग',
      crs: 'अनिवार्य पंजीकरण योजना (CRS)',
      safety: 'उपभोक्ता सुरक्षा',
    },
    examples: [
      'इलेक्ट्रिक हीटर पर कौन से BIS मानक लागू होते हैं?',
      'मैं BIS प्रमाणन संख्या को कैसे सत्यापित कर सकता हूं?',
      'ISI मार्क प्रमाणन की प्रक्रिया क्या है?',
      'किन उत्पादों के लिए अनिवार्य BIS पंजीकरण आवश्यक है?',
    ],
    quickStart: [
      {
        title: 'प्रमाणन सत्यापित करें',
        desc: 'BIS केयर ऐप का उपयोग करना और R-नंबर या CM/L नंबर सत्यापित करना सीखें।',
        query: 'मैं किसी उत्पाद पर ISI मार्क कैसे सत्यापित कर सकता हूं?',
      },
      {
        title: 'अनिवार्य उत्पाद',
        desc: 'अनिवार्य प्रमाणन के तहत इलेक्ट्रॉनिक्स, स्टील और खिलौनों की सूची जांचें।',
        query: 'BIS प्रमाणन के तहत अनिवार्य उत्पाद क्या हैं?',
      },
      {
        title: 'स्वर्ण हॉलमार्किंग',
        desc: 'अपने सोने के गहनों पर प्रतीकों को समझें (HUID, BIS लोगो, शुद्धता)।',
        query: 'भारत में स्वर्ण हॉलमार्किंग प्रक्रिया के बारे में बताएं।',
      },
      {
        title: 'नया आवेदन',
        desc: 'निर्माताओं के लिए ManakOnline पर पंजीकरण करने के लिए चरण-दर-चरण मार्गदर्शिका।',
        query: 'नए BIS लाइसेंस के लिए आवेदन करने की प्रक्रिया क्या है?',
      },
    ],
    youMightAsk: 'आप यह भी पूछ सकते हैं:',
  }
};

export const multilingualKnowledge: MultilingualEntry[] = [
  {
    id: 'bis-overview',
    category: 'overview',
    translations: {
      en: {
        question: 'What is BIS?',
        keywords: ['bis', 'bureau', 'indian standards', 'what is bis', 'about bis'],
        answer: `**Bureau of Indian Standards (BIS)** is the national standards body of India, established under the BIS Act, 2016.\n\n**Key Functions:**\n- Formulation of Indian Standards (IS)\n- Product certification through ISI Mark\n- Hallmarking of gold/silver jewellery\n- Compulsory Registration Scheme (CRS) for electronics\n\n**Helpline:** 14100 (toll-free)`,
      },
      hi: {
        question: 'BIS क्या है?',
        keywords: ['bis', 'भारतीय मानक ब्यूरो', 'बीआईएस', 'bis kya hai', 'जानकारी'],
        answer: `**भारतीय मानक ब्यूरो (BIS)** भारत का राष्ट्रीय मानक निकाय है, जो BIS अधिनियम, 2016 के तहत स्थापित है।\n\n**मुख्य कार्य:**\n- भारतीय मानकों का निर्माण\n- ISI मार्क द्वारा उत्पाद प्रमाणन\n- सोने/चांदी की हॉलमार्किंग\n- इलेक्ट्रॉनिक्स के लिए अनिवार्य पंजीकरण (CRS)\n\n**हेल्पलाइन:** 14100 (टोल-फ्री)`,
      },
    },
  },
  {
    id: 'gold-hallmarking',
    category: 'overview',
    translations: {
      en: {
        question: 'What is Gold Hallmarking?',
        keywords: ['gold', 'purity', 'hallmark', 'huid', 'jewellery', 'jewelry'],
        answer: `**BIS Hallmarking** certifies the purity of gold and silver jewellery in India.\n\n**Components of Hallmark:**\n1. **BIS Logo**\n2. **Purity/Fineness** (e.g. 22K916, 18K750)\n3. **HUID** (6-digit unique alphanumeric code)\n\n**Mandatory:** Gold hallmarking is mandatory for jewellery sales in India. Always verify the HUID using the **BIS Care App**.`,
      },
      hi: {
        question: 'स्वर्ण हॉलमार्किंग क्या है?',
        keywords: ['सोना', 'शुद्धता', 'हॉलमार्क', 'huid', 'गहने', 'आभूषण'],
        answer: `**BIS हॉलमार्किंग** भारत में सोने और चांदी के गहनों की शुद्धता का प्रमाण है।\n\n**हॉलमार्क के घटक:**\n1. **BIS लोगो**\n2. **शुद्धता/फाइननेस** (जैसे 22K916, 18K750)\n3. **HUID** (6-अंकों का विशिष्ट कोड)\n\n**अनिवार्य:** भारत में गहनों की बिक्री के लिए स्वर्ण हॉलमार्किंग अनिवार्य है। हमेशा **BIS केयर ऐप** का उपयोग करके HUID सत्यापित करें।`,
      },
    },
  },
  {
    id: 'isi-mark',
    category: 'overview',
    translations: {
      en: {
        question: 'What is the ISI Mark?',
        keywords: ['isi', 'isi mark', 'isi logo', 'isi certification'],
        answer: `**ISI Mark** is a certification mark issued by BIS for industrial products.\n\n**How to identify:**\n- Look for the ISI logo (triangle with ISI)\n- Check licence number below the mark\n- Verify at bis.gov.in\n\n**Mandatory for:** Cement, LPG cylinders, electrical goods, packaged water, helmets.`,
      },
      hi: {
        question: 'ISI मार्क क्या है?',
        keywords: ['isi', 'आईएसआई', 'isi mark', 'isi kya hai'],
        answer: `**ISI मार्क** BIS द्वारा औद्योगिक उत्पादों के लिए दिया जाने वाला प्रमाणन चिह्न है।\n\n**कैसे पहचानें:**\n- ISI लोगो देखें (त्रिकोण में ISI)\n- लाइसेंस नंबर जांचें\n- bis.gov.in पर सत्यापित करें\n\n**अनिवार्य:** सीमेंट, LPG सिलेंडर, बिजली के सामान, पैकेज्ड पानी, हेलमेट`,
      },
    },
  },
  {
    id: 'helmet-standard',
    category: 'standards',
    translations: {
      en: {
        question: 'What is the BIS standard for helmets?',
        keywords: ['helmet', 'bike helmet', 'is 4151', 'head safety'],
        answer: `**Helmets must follow IS 4151:2015**\n\n**Safety Checks:**\n- ✅ ISI mark on the helmet\n- ✅ Check IS 4151 standard number\n- ✅ Verify licence number\n- ✅ Check manufacturing date (replace after 3-5 years)\n- ✅ Ensure chin strap strength\n\n**Red Flags:**\n- ❌ No ISI mark\n- ❌ Extremely lightweight\n- ❌ Loose chin strap`,
      },
      hi: {
        question: 'हेलमेट के लिए BIS मानक क्या है?',
        keywords: ['हेलमेट', 'helmet', 'is 4151', 'सिर की सुरक्षा'],
        answer: `**हेलमेट के लिए IS 4151:2015 मानक**\n\n**सुरक्षा जांच:**\n- ✅ हेलमेट पर ISI मार्क देखें\n- ✅ IS 4151 नंबर जांचें\n- ✅ लाइसेंस नंबर सत्यापित करें\n- ✅ निर्माण तिथि जांचें (3-5 साल बाद बदलें)\n\n**खतरे के संकेत:**\n- ❌ ISI मार्क नहीं\n- ❌ बहुत हल्का\n- ❌ ढीला चिन स्ट्रैप`,
      },
    },
  },
  {
    id: 'certification-process',
    category: 'certification',
    translations: {
      en: {
        question: 'How to get BIS Certification?',
        keywords: ['certification', 'apply', 'how to get', 'bis certificate', 'license', 'steps', 'process'],
        answer: `**Steps to get BIS Certification:**\n\n1. **Apply Online** — Visit manakonline.bis.gov.in\n2. **Submit Documents** — Factory details, test reports\n3. **Factory Inspection** — BIS officer visits\n4. **Sample Testing** — Products tested in BIS labs\n5. **Grant of Licence** — If compliant\n6. **Surveillance** — Periodic checks\n\n**Fees:** ₹1,000 application fee\n**Timeline:** 60-90 days`,
      },
      hi: {
        question: 'BIS प्रमाणन कैसे प्राप्त करें?',
        keywords: ['प्रमाणन', 'certification', 'आवेदन', 'प्रक्रिया', 'लाइसेंस', 'चरण'],
        answer: `**BIS प्रमाणन प्राप्त करने के चरण:**\n\n1. **ऑनलाइन आवेदन** — manakonline.bis.gov.in पर जाएं\n2. **दस्तावेज जमा करें** — फैक्ट्री विवरण, परीक्षण रिपोर्ट\n3. **फैक्ट्री निरीक्षण** — BIS अधिकारी का दौरा\n4. **नमूना परीक्षण** — BIS लैब में\n5. **लाइसेंस मंजूरी**\n\n**शुल्क:** ₹1,000 आवेदन शुल्क\n**समय:** 60-90 दिन`,
      },
    },
  },
  {
    id: 'complaint-process',
    category: 'complaints',
    translations: {
      en: {
        question: 'How to file a complaint about a fake product?',
        keywords: ['complaint', 'report', 'fake', 'counterfeit', 'shikayat', 'fraud', 'illegal'],
        answer: `**How to Report Fake Products:**\n\n**Online:** bis.gov.in → Public Grievances\n**Helpline:** 14100 (toll-free)\n**Email:** cmd@bis.gov.in\n**BIS CARE App:** Download from Play Store\n\n**Information needed:**\n- Product name and brand\n- ISI mark / licence number\n- Where purchased\n- Photos of the product`,
      },
      hi: {
        question: 'नकली उत्पाद की शिकायत कैसे करें?',
        keywords: ['शिकायत', 'complaint', 'नकली', 'रिपोर्ट', 'धोखाधड़ी', 'अवैध'],
        answer: `**नकली उत्पाद की रिपोर्ट कैसे करें:**\n\n**ऑनलाइन:** bis.gov.in → सार्वजनिक शिकायत\n**हेल्पलाइन:** 14100 (टोल-फ्री)\n**ईमेल:** cmd@bis.gov.in\n**BIS CARE ऐप:** प्ले स्टोर से डाउनलोड करें\n\n**आवश्यक जानकारी:**\n- उत्पाद का नाम और ब्रांड\n- ISI मार्क / लाइसेंस नंबर\n- कहां से खरीदा\n- उत्पाद की फोटो`,
      },
    },
  },
  {
    id: 'bis-care-app',
    category: 'overview',
    translations: {
      en: {
        question: 'What is the BIS CARE App?',
        keywords: ['app', 'bis care', 'mobile app', 'verify app', 'download app'],
        answer: `The **BIS Care App** is the official mobile application for consumers to verify standards and file complaints.\n\n**Key Features:**\n- **Verify ISI Mark:** Enter CM/L number\n- **Verify Hallmarking:** Enter HUID code\n- **Verify CRS:** Enter R-Number\n- **File Complaints:** Report substandard products\n- **Explore Standards:** Search for IS numbers`,
      },
      hi: {
        question: 'BIS CARE ऐप क्या है?',
        keywords: ['ऐप', 'app', 'मोबाइल ऐप', 'bis care', 'सत्यापन ऐप'],
        answer: `**BIS Care ऐप** उपभोक्ताओं के लिए मानकों को सत्यापित करने और शिकायत दर्ज करने का आधिकारिक मोबाइल एप्लिकेशन है।\n\n**मुख्य विशेषताएं:**\n- **ISI मार्क सत्यापित करें:** CM/L नंबर दर्ज करें\n- **हॉलमार्किंग सत्यापित करें:** HUID कोड दर्ज करें\n- **शिकायत दर्ज करें:** घटिया उत्पादों की रिपोर्ट करें\n- **मानक खोजें:** IS नंबर खोजें`,
      },
    },
  },
  {
    id: 'mandatory-products',
    category: 'certification',
    translations: {
      en: {
        question: 'Which products require mandatory BIS certification?',
        keywords: ['mandatory', 'compulsory', 'list', 'required', 'anivarya'],
        answer: `Over 900 products are under mandatory BIS certification in India. Key categories include:\n\n- **Construction:** Cement, Steel, Wires\n- **Electronics:** Mobile phones, Laptops, LED lights (CRS)\n- **Kitchen:** Pressure cookers, Gas cylinders\n- **Safety:** Helmets, Fire extinguishers\n- **Children:** All toys (since 2021)\n- **Automotive:** Tyres, Glass`,
      },
      hi: {
        question: 'किन उत्पादों के लिए अनिवार्य BIS प्रमाणन आवश्यक है?',
        keywords: ['अनिवार्य', 'mandatory', 'सूची', 'आवश्यक', 'जरूरी'],
        answer: `भारत में 900 से अधिक उत्पाद अनिवार्य BIS प्रमाणन के अंतर्गत हैं। मुख्य श्रेणियां:\n\n- **निर्माण:** सीमेंट, स्टील, तार\n- **इलेक्ट्रॉनिक्स:** मोबाइल फोन, लैपटॉप (CRS)\n- **रसोई:** प्रेशर कुकर, गैस सिलेंडर\n- **सुरक्षा:** हेलमेट, अग्निशामक\n- **बच्चे:** सभी खिलौने (2021 से)\n- **ऑटोमोटिव:** टायर, कांच`,
      },
    },
  },
  {
    id: 'bis-offices',
    category: 'overview',
    translations: {
      en: {
        question: 'Where are BIS offices located?',
        keywords: ['office', 'location', 'address', 'branch', 'regional', 'where is'],
        answer: `**BIS Network across India:**\n\n- **Headquarters:** New Delhi\n- **Regional Offices (5):** New Delhi, Mumbai, Kolkata, Chennai, Chandigarh\n- **Branch Offices (21):** Located in major state capitals and industrial hubs like Ahmedabad, Bangalore, Hyderabad, Jaipur, Lucknow, etc.`,
      },
      hi: {
        question: 'BIS कार्यालय कहां स्थित हैं?',
        keywords: ['कार्यालय', 'office', 'पता', 'पत्ता', 'शाखा', 'क्षेत्रीय'],
        answer: `**भारत भर में BIS नेटवर्क:**\n\n- **मुख्यालय:** नई दिल्ली\n- **क्षेत्रीय कार्यालय (5):** नई दिल्ली, मुंबई, कोलकाता, चेन्नई, चंडीगढ़\n- **शाखा कार्यालय (21):** अहमदाबाद, बैंगलोर, हैदराबाद, जयपुर, लखनऊ जैसे प्रमुख शहरों में स्थित।`,
      },
    },
  },
  {
    id: 'bis-overview',
    category: 'overview',
    translations: {
      en: {
        question: 'What is BIS?',
        keywords: ['bis', 'bureau', 'indian standards', 'what is bis', 'about bis'],
        answer: `**Bureau of Indian Standards (BIS)** is the national standards body of India, established under the BIS Act, 2016.\n\n**Key Functions:**\n- Formulation of Indian Standards (IS)\n- Product certification through ISI Mark\n- Hallmarking of gold/silver jewellery\n- Compulsory Registration Scheme (CRS) for electronics\n\n**Helpline:** 14100 (toll-free)`,
      },
      hi: {
        question: 'BIS क्या है?',
        keywords: ['bis', 'भारतीय मानक ब्यूरो', 'बीआईएस', 'bis kya hai', 'जानकारी'],
        answer: `**भारतीय मानक ब्यूरो (BIS)** भारत का राष्ट्रीय मानक निकाय है, जो BIS अधिनियम, 2016 के तहत स्थापित है।\n\n**मुख्य कार्य:**\n- भारतीय मानकों का निर्माण\n- ISI मार्क द्वारा उत्पाद प्रमाणन\n- सोने/चांदी की हॉलमार्किंग\n- इलेक्ट्रॉनिक्स के लिए अनिवार्य पंजीकरण (CRS)\n\n**हेल्पलाइन:** 14100 (टोल-फ्री)`,
      },
    },
  },
];

/**
 * Search multilingual offline knowledge with improved relevance scoring
 */
export function searchMultilingualKnowledge(
  query: string,
  lang: SupportedLanguage = 'en'
): { question: string; answer: string; category: string }[] {
  const normalizedQuery = query.toLowerCase().trim();
  
  // Words to ignore as primary keywords
  const stopWords = new Set(['what', 'where', 'how', 'when', 'who', 'tell', 'about', 'basically', 'please', 'the', 'is', 'are', 'was', 'were', 'kya', 'kaise', 'kab', 'hai', 'bataiye', 'kahan', 'kis', 'ki', 'ka', 'me', 'in', 'on', 'at', 'for']);
  
  const queryWords = normalizedQuery.split(/[\s,?\-!]+/).filter(w => w.length > 1);
  const coreWords = queryWords.filter(w => !stopWords.has(w));

  if (queryWords.length === 0) return [];

  const scored = multilingualKnowledge
    .map((entry) => {
      // Try requested language first, fall back to English
      const t = entry.translations[lang] || entry.translations.en;
      if (!t) return null;

      let score = 0;

      // 1. Exact phrase match in question (Highest weight)
      if (t.question.toLowerCase().includes(normalizedQuery)) score += 20;

      // 2. Exact keyword matches
      for (const keyword of t.keywords) {
        const k = keyword.toLowerCase();
        
        // Exact keyword match
        if (normalizedQuery === k) score += 15;
        else if (normalizedQuery.includes(k)) score += 8;
        
        // Match core words in keywords
        for (const word of coreWords) {
          if (k.includes(word) && word.length > 2) score += 5;
          else if (k === word) score += 6;
        }
      }

      // 3. Category matching
      if (coreWords.some(w => entry.category.includes(w))) {
        score += 3;
      }

      // 4. Content matching (Lower weight)
      for (const word of coreWords) {
        if (word.length > 3 && t.answer.toLowerCase().includes(word)) score += 2;
      }

      // 5. Penalize ultra-short queries for generic broad matches (e.g. "bis")
      // If only "bis" is matched in a tiny entry, reduce score unless it's a specific "about bis" query
      if (coreWords.length === 1 && coreWords[0] === 'bis' && entry.id === 'bis-overview') {
        if (!normalizedQuery.includes('what') && !normalizedQuery.includes('who')) {
          score = Math.min(score, 5); // Low priority for generic "bis" mentions
        }
      }

      return { entry, translation: t, category: entry.category, score };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null && s.score >= 6);

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => ({
      question: s.translation.question,
      answer: s.translation.answer,
      category: s.category,
    }));
}
