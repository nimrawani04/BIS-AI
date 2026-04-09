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

export const multilingualKnowledge: MultilingualEntry[] = [
  {
    id: 'bis-overview',
    category: 'overview',
    translations: {
      en: {
        question: 'What is BIS?',
        keywords: ['bis', 'bureau', 'indian standards', 'what is bis'],
        answer: `**Bureau of Indian Standards (BIS)** is the national standards body of India, established under the BIS Act, 2016.\n\n**Key Functions:**\n- Formulation of Indian Standards\n- Product certification through ISI Mark\n- Hallmarking of gold/silver jewellery\n- Laboratory testing and calibration\n\n**Helpline:** 14100 (toll-free)`,
      },
      hi: {
        question: 'BIS क्या है?',
        keywords: ['bis', 'भारतीय मानक ब्यूरो', 'बीआईएस', 'bis kya hai'],
        answer: `**भारतीय मानक ब्यूरो (BIS)** भारत का राष्ट्रीय मानक निकाय है, जो BIS अधिनियम, 2016 के तहत स्थापित है।\n\n**मुख्य कार्य:**\n- भारतीय मानकों का निर्माण\n- ISI मार्क द्वारा उत्पाद प्रमाणन\n- सोने/चांदी की हॉलमार्किंग\n- प्रयोगशाला परीक्षण\n\n**हेल्पलाइन:** 14100 (टोल-फ्री)`,
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
        keywords: ['helmet', 'bike helmet', 'is 4151'],
        answer: `**Helmets must follow IS 4151:2015**\n\n**Safety Checks:**\n- ✅ ISI mark on the helmet\n- ✅ Check IS 4151 standard number\n- ✅ Verify licence number\n- ✅ Check manufacturing date (replace after 3-5 years)\n- ✅ Ensure chin strap strength\n\n**Red Flags:**\n- ❌ No ISI mark\n- ❌ Extremely lightweight\n- ❌ Loose chin strap`,
      },
      hi: {
        question: 'हेलमेट के लिए BIS मानक क्या है?',
        keywords: ['हेलमेट', 'helmet', 'is 4151'],
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
        keywords: ['certification', 'apply', 'how to get', 'bis certificate', 'license'],
        answer: `**Steps to get BIS Certification:**\n\n1. **Apply Online** — Visit manakonline.bis.gov.in\n2. **Submit Documents** — Factory details, test reports\n3. **Factory Inspection** — BIS officer visits\n4. **Sample Testing** — Products tested in BIS labs\n5. **Grant of Licence** — If compliant\n6. **Surveillance** — Periodic checks\n\n**Fees:** ₹1,000 application fee\n**Timeline:** 60-90 days`,
      },
      hi: {
        question: 'BIS प्रमाणन कैसे प्राप्त करें?',
        keywords: ['प्रमाणन', 'certification', 'आवेदन'],
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
        keywords: ['complaint', 'report', 'fake', 'counterfeit', 'shikayat'],
        answer: `**How to Report Fake Products:**\n\n**Online:** bis.gov.in → Public Grievances\n**Helpline:** 14100 (toll-free)\n**Email:** cmd@bis.gov.in\n**BIS CARE App:** Download from Play Store\n\n**Information needed:**\n- Product name and brand\n- ISI mark / licence number\n- Where purchased\n- Photos of the product`,
      },
      hi: {
        question: 'नकली उत्पाद की शिकायत कैसे करें?',
        keywords: ['शिकायत', 'complaint', 'नकली', 'रिपोर्ट'],
        answer: `**नकली उत्पाद की रिपोर्ट कैसे करें:**\n\n**ऑनलाइन:** bis.gov.in → सार्वजनिक शिकायत\n**हेल्पलाइन:** 14100 (टोल-फ्री)\n**ईमेल:** cmd@bis.gov.in\n**BIS CARE ऐप:** प्ले स्टोर से डाउनलोड करें\n\n**आवश्यक जानकारी:**\n- उत्पाद का नाम और ब्रांड\n- ISI मार्क / लाइसेंस नंबर\n- कहां से खरीदा\n- उत्पाद की फोटो`,
      },
    },
  },
  {
    id: 'consumer-rights',
    category: 'safety',
    translations: {
      en: {
        question: 'What are consumer rights related to product safety?',
        keywords: ['consumer', 'rights', 'consumer rights', 'consumer protection'],
        answer: `**Consumer Rights under Consumer Protection Act, 2019:**\n\n1. **Right to Safety** — Protection from hazardous products\n2. **Right to Information** — Full product details\n3. **Right to Choose** — Access to variety\n4. **Right to be Heard** — File complaints\n5. **Right to Redressal** — Compensation for defective products\n\n**Helpline:** 1800-11-4000\n**BIS Helpline:** 14100`,
      },
      hi: {
        question: 'उत्पाद सुरक्षा से संबंधित उपभोक्ता अधिकार क्या हैं?',
        keywords: ['उपभोक्ता', 'अधिकार', 'consumer rights'],
        answer: `**उपभोक्ता संरक्षण अधिनियम, 2019 के तहत अधिकार:**\n\n1. **सुरक्षा का अधिकार**\n2. **सूचना का अधिकार**\n3. **चुनने का अधिकार**\n4. **सुने जाने का अधिकार**\n5. **निवारण का अधिकार**\n\n**हेल्पलाइन:** 1800-11-4000\n**BIS हेल्पलाइन:** 14100`,
      },
    },
  },
  {
    id: 'electrical-safety',
    category: 'safety',
    translations: {
      en: {
        question: 'Electrical safety tips at home?',
        keywords: ['electrical safety', 'electric shock', 'fire safety', 'wiring safety'],
        answer: `**Electrical Safety Tips:**\n\n1. ✅ Use only ISI-marked electrical products\n2. ✅ Check wiring insulation regularly\n3. ✅ Use MCB/RCCB circuit breakers\n4. ✅ Don't overload sockets\n5. ✅ Keep electrical items away from water\n6. ✅ Use proper earthing\n\n**Emergency:** Fire service — **101**`,
      },
      hi: {
        question: 'घर में बिजली सुरक्षा के उपाय?',
        keywords: ['बिजली सुरक्षा', 'electrical safety'],
        answer: `**बिजली सुरक्षा सुझाव:**\n\n1. ✅ केवल ISI मार्क वाले बिजली उत्पाद उपयोग करें\n2. ✅ वायरिंग की नियमित जांच करें\n3. ✅ MCB/RCCB सर्किट ब्रेकर लगाएं\n4. ✅ सॉकेट ओवरलोड न करें\n5. ✅ बिजली के सामान को पानी से दूर रखें\n\n**आपातकाल:** अग्निशमन सेवा — **101**`,
      },
    },
  },
  {
    id: 'pressure-cooker',
    category: 'standards',
    translations: {
      en: {
        question: 'What is the BIS standard for pressure cookers?',
        keywords: ['pressure cooker', 'cooker', 'is 2347'],
        answer: `**Pressure Cookers follow IS 2347:2017**\n\n**Safety Checks:**\n- ✅ ISI mark with licence number\n- ✅ Safety valve and fusible plug\n- ✅ Gasket in good condition\n- ✅ Handle firmly attached\n\n**Red Flags:**\n- ❌ No ISI mark\n- ❌ Missing safety valve\n- ❌ Wobbly handles`,
      },
      hi: {
        question: 'प्रेशर कुकर के लिए BIS मानक क्या है?',
        keywords: ['प्रेशर कुकर', 'कुकर', 'pressure cooker'],
        answer: `**प्रेशर कुकर IS 2347:2017 मानक**\n\n**सुरक्षा जांच:**\n- ✅ ISI मार्क और लाइसेंस नंबर\n- ✅ सेफ्टी वॉल्व और फ्यूजिबल प्लग\n- ✅ गैस्केट अच्छी स्थिति में\n\n**खतरे के संकेत:**\n- ❌ ISI मार्क नहीं\n- ❌ सेफ्टी वॉल्व गायब`,
      },
    },
  },
];

/**
 * Search multilingual offline knowledge
 */
export function searchMultilingualKnowledge(
  query: string,
  lang: SupportedLanguage = 'en'
): { question: string; answer: string; category: string }[] {
  const normalizedQuery = query.toLowerCase().trim();
  const queryWords = normalizedQuery.split(/\s+/);

  const scored = multilingualKnowledge
    .map((entry) => {
      // Try requested language first, fall back to English
      const t = entry.translations[lang] || entry.translations.en;
      if (!t) return null;

      let score = 0;

      if (t.question.toLowerCase().includes(normalizedQuery)) score += 10;

      for (const keyword of t.keywords) {
        if (normalizedQuery.includes(keyword.toLowerCase())) score += 5;
        for (const word of queryWords) {
          if (word.length > 2 && keyword.toLowerCase().includes(word)) score += 2;
        }
      }

      // Also search English keywords as fallback
      if (lang !== 'en' && entry.translations.en) {
        for (const keyword of entry.translations.en.keywords) {
          if (normalizedQuery.includes(keyword.toLowerCase())) score += 3;
        }
      }

      for (const word of queryWords) {
        if (word.length > 2 && t.answer.toLowerCase().includes(word)) score += 1;
      }

      return { entry, translation: t, category: entry.category, score };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null && s.score > 0);

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => ({
      question: s.translation.question,
      answer: s.translation.answer,
      category: s.category,
    }));
}
