/**
 * Offline BIS Knowledge Pack
 * Lightweight cached knowledge for rural/offline access (~5KB)
 */

export interface KnowledgeEntry {
  id: string;
  keywords: string[];
  question: string;
  answer: string;
  category: 'overview' | 'certification' | 'standards' | 'complaints' | 'safety';
}

export const offlineKnowledgeBase: KnowledgeEntry[] = [
  // === BIS Overview ===
  {
    id: 'bis-overview',
    keywords: ['bis', 'bureau', 'indian standards', 'what is bis', 'bis kya hai'],
    question: 'What is BIS?',
    answer: `**Bureau of Indian Standards (BIS)** is the national standards body of India, established under the Bureau of Indian Standards Act, 2016.

**Key Functions:**
- Formulation of Indian Standards
- Product certification through ISI Mark
- Hallmarking of gold/silver jewellery
- Laboratory testing and calibration
- Promoting standardization and quality

**Website:** bis.gov.in
**Helpline:** 14100 (toll-free)`,
    category: 'overview',
  },
  {
    id: 'isi-mark',
    keywords: ['isi', 'isi mark', 'isi logo', 'isi certification', 'isi kya hai'],
    question: 'What is the ISI Mark?',
    answer: `**ISI Mark** is a certification mark issued by the Bureau of Indian Standards (BIS) for industrial products in India.

**How to identify genuine ISI Mark:**
- Look for the ISI logo (a triangle with ISI written)
- Check for a licence number below the mark (e.g., CM/L-1234567)
- The Indian Standard number should be mentioned (e.g., IS 4151)
- Verify at bis.gov.in using the licence number

**Mandatory ISI products include:** Cement, LPG cylinders, electrical goods, packaged water, helmets, and more.`,
    category: 'overview',
  },
  {
    id: 'hallmark',
    keywords: ['hallmark', 'gold', 'silver', 'jewellery', 'jewelry', 'hallmarking', 'huid'],
    question: 'What is BIS Hallmarking?',
    answer: `**BIS Hallmarking** is a purity certification for gold and silver jewellery.

**How to check:**
- Look for the BIS logo, purity/fineness grade (e.g., 22K916), and HUID (6-digit alphanumeric code)
- Verify HUID at bis.gov.in or BIS CARE app

**Purity grades:**
- 24K (999 fineness)
- 22K (916 fineness)  
- 18K (750 fineness)
- 14K (585 fineness)

**Hallmarking is mandatory** for gold jewellery sold in India since June 2021.`,
    category: 'overview',
  },

  // === Certification Process ===
  {
    id: 'certification-process',
    keywords: ['certification', 'apply', 'how to get', 'process', 'bis certificate', 'license', 'licence'],
    question: 'How to get BIS Certification?',
    answer: `**Steps to get BIS Certification (ISI Mark):**

1. **Apply Online** — Visit manakonline.bis.gov.in
2. **Submit Documents** — Factory details, test reports, quality control plan
3. **Factory Inspection** — BIS officer visits your manufacturing unit
4. **Sample Testing** — Products tested in BIS-recognized labs
5. **Grant of Licence** — If compliant, licence is granted
6. **Surveillance** — BIS conducts periodic checks

**Fees:** Application fee ₹1,000 + Annual marking fee based on turnover
**Timeline:** Typically 60-90 days
**Validity:** Licence valid for 1-2 years, renewable`,
    category: 'certification',
  },
  {
    id: 'fmcs',
    keywords: ['fmcs', 'foreign', 'import', 'foreign manufacturer', 'imported products'],
    question: 'What is FMCS (Foreign Manufacturer Certification)?',
    answer: `**FMCS (Foreign Manufacturers Certification Scheme)** allows manufacturers outside India to obtain BIS certification.

**Key Points:**
- Mandatory for importing certain products into India
- Foreign manufacturer must apply through an Authorized Indian Representative (AIR)
- BIS conducts factory inspection abroad
- Products must comply with relevant Indian Standards

**Required Documents:** Factory licence, test reports, quality management documents
**Fee:** Higher than domestic certification due to travel costs`,
    category: 'certification',
  },

  // === Common Product Standards ===
  {
    id: 'helmet-standard',
    keywords: ['helmet', 'bike helmet', 'motorcycle helmet', 'is 4151', 'helmet standard', 'helmet bis'],
    question: 'What is the BIS standard for helmets?',
    answer: `**Helmets must follow BIS standard IS 4151:2015**

**Safety Checks:**
- ✅ Look for ISI mark on the helmet
- ✅ Check the IS 4151 standard number
- ✅ Verify the licence number on bis.gov.in
- ✅ Check manufacturing date (replace after 3-5 years)
- ✅ Ensure chin strap strength and retention system
- ✅ Check for proper ventilation holes

**Red Flags:**
- ❌ No ISI mark
- ❌ Extremely lightweight (may lack proper padding)
- ❌ Loose or weak chin strap
- ❌ Faded or peeling ISI label

**BIS helmet certification is mandatory** for sale in India.`,
    category: 'standards',
  },
  {
    id: 'pressure-cooker',
    keywords: ['pressure cooker', 'cooker', 'is 2347', 'pressure cooker standard'],
    question: 'What is the BIS standard for pressure cookers?',
    answer: `**Pressure Cookers follow BIS standard IS 2347:2017**

**Safety Checks:**
- ✅ ISI mark with licence number
- ✅ Safety valve and fusible plug present
- ✅ Gasket in good condition
- ✅ Handle firmly attached
- ✅ Capacity marked on the cooker

**Red Flags:**
- ❌ No ISI mark
- ❌ Missing or damaged safety valve
- ❌ Wobbly handles
- ❌ Dented or deformed body

**Mandatory ISI certification** required for pressure cookers.`,
    category: 'standards',
  },
  {
    id: 'electrical-wires',
    keywords: ['wire', 'cable', 'electrical', 'wiring', 'is 694', 'electric wire'],
    question: 'What is the BIS standard for electrical wires?',
    answer: `**Electrical Wires follow BIS standard IS 694:2010**

**Safety Checks:**
- ✅ ISI mark on the wire
- ✅ Proper insulation (PVC rated)
- ✅ Conductor material (copper preferred)
- ✅ Correct gauge for intended load
- ✅ Fire retardant certification

**Red Flags:**
- ❌ Thin or poor quality insulation
- ❌ Aluminium sold as copper
- ❌ No ISI mark
- ❌ Undersized conductor

**BIS certification is mandatory** for electrical wires.`,
    category: 'standards',
  },
  {
    id: 'packaged-water',
    keywords: ['water', 'packaged water', 'bottled water', 'drinking water', 'is 14543', 'mineral water'],
    question: 'What is the BIS standard for packaged drinking water?',
    answer: `**Packaged Drinking Water follows IS 14543:2016**

**Safety Checks:**
- ✅ ISI mark on the bottle/package
- ✅ Manufacturing and expiry date printed
- ✅ Source of water mentioned
- ✅ Proper sealed cap
- ✅ Batch/lot number

**Red Flags:**
- ❌ No ISI mark
- ❌ Broken or tampered seal
- ❌ No date or source info
- ❌ Unusual taste or smell

**BIS certification is mandatory** for all packaged drinking water sold in India.`,
    category: 'standards',
  },
  {
    id: 'electric-heater',
    keywords: ['heater', 'electric heater', 'room heater', 'water heater', 'geyser', 'is 302'],
    question: 'What is the BIS standard for electric heaters?',
    answer: `**Electric Heaters follow BIS standard IS 302 (Part 2)**

**Safety Checks:**
- ✅ ISI mark present
- ✅ Proper earthing terminal
- ✅ Thermostat/temperature control
- ✅ Auto cut-off feature
- ✅ Sturdy and heat-resistant body

**Red Flags:**
- ❌ No ISI mark
- ❌ Exposed heating elements
- ❌ Plastic body near heat source
- ❌ No auto shut-off

Always buy ISI-marked heaters to prevent fire hazards.`,
    category: 'standards',
  },
  {
    id: 'toys',
    keywords: ['toy', 'toys', 'children', 'kids', 'is 9873', 'toy safety', 'baby toys'],
    question: 'What is the BIS standard for toys?',
    answer: `**Toys follow BIS standard IS 9873 (Part 1-9)**

**Safety Checks:**
- ✅ ISI mark on packaging
- ✅ Age-appropriate labelling
- ✅ No small detachable parts (choking hazard)
- ✅ Non-toxic paint and materials
- ✅ Smooth edges, no sharp points

**Red Flags:**
- ❌ No ISI mark
- ❌ Strong chemical smell
- ❌ Sharp edges or points
- ❌ Small parts for children under 3
- ❌ Missing age recommendations

**BIS certification is mandatory** for toys sold in India since 2021.`,
    category: 'standards',
  },
  {
    id: 'extension-board',
    keywords: ['extension', 'extension board', 'power strip', 'plug', 'socket', 'is 1293'],
    question: 'What is the BIS standard for extension boards?',
    answer: `**Extension Boards follow IS 1293:2019**

**Safety Checks:**
- ✅ ISI mark present
- ✅ Proper wire gauge (min 1.0 sq mm)
- ✅ Surge protection feature
- ✅ Individual switches per socket
- ✅ Proper earthing pin in sockets

**Red Flags:**
- ❌ No ISI mark
- ❌ Thin/flimsy wires
- ❌ Loose socket connections
- ❌ Overheating during use
- ❌ No surge protector

**Tip:** Never overload extension boards beyond rated capacity.`,
    category: 'standards',
  },
  {
    id: 'cement',
    keywords: ['cement', 'is 269', 'is 8112', 'opc', 'ppc', 'cement standard'],
    question: 'What is the BIS standard for cement?',
    answer: `**Cement Standards:**
- **OPC 33 Grade:** IS 269
- **OPC 43 Grade:** IS 8112
- **OPC 53 Grade:** IS 12269
- **PPC:** IS 1489 (Part 1)

**Safety Checks:**
- ✅ ISI mark on every bag
- ✅ Manufacturing date (use within 90 days)
- ✅ Grade mentioned clearly
- ✅ Net weight: 50 kg standard

**Red Flags:**
- ❌ No ISI mark
- ❌ Lumpy or hardened cement
- ❌ Underweight bags
- ❌ Missing manufacturing date

**BIS certification is mandatory** for all cement sold in India.`,
    category: 'standards',
  },

  // === Complaints ===
  {
    id: 'complaint-process',
    keywords: ['complaint', 'report', 'fake', 'counterfeit', 'duplicate', 'fraud', 'shikayat'],
    question: 'How to file a complaint about a fake/substandard product?',
    answer: `**How to Report Fake/Substandard Products to BIS:**

**Online:**
1. Visit bis.gov.in → Public Grievances
2. Fill complaint form with product details
3. Upload photos of product and ISI mark
4. Submit and note complaint number

**Helpline:**
- Call **14100** (toll-free BIS helpline)
- Call **1800-11-4100**

**Email:** cmd@bis.gov.in

**BIS CARE App:**
- Download from Play Store/App Store
- Report directly with photos

**Information to provide:**
- Product name and brand
- ISI mark / licence number
- Where purchased
- Photos of the product
- Description of issue`,
    category: 'complaints',
  },

  // === Safety Guides ===
  {
    id: 'safety-tips-electrical',
    keywords: ['electrical safety', 'electric shock', 'fire safety', 'wiring safety'],
    question: 'Electrical safety tips at home?',
    answer: `**Electrical Safety Tips:**

1. ✅ Use only ISI-marked electrical products
2. ✅ Check wiring insulation regularly
3. ✅ Use MCB/RCCB circuit breakers
4. ✅ Don't overload sockets
5. ✅ Keep electrical items away from water
6. ✅ Use proper earthing
7. ✅ Replace damaged wires immediately
8. ✅ Use correct fuse ratings

**Emergency:**
- In case of electrical fire, use CO₂ extinguisher
- Don't use water on electrical fires
- Call fire service: **101**`,
    category: 'safety',
  },
  {
    id: 'safety-tips-kitchen',
    keywords: ['kitchen safety', 'gas safety', 'lpg', 'cooking safety', 'gas cylinder'],
    question: 'Kitchen and gas safety tips?',
    answer: `**Kitchen & Gas Safety Tips:**

1. ✅ Use ISI-marked LPG equipment (IS 4246)
2. ✅ Check gas tube expiry (replace every 2 years)
3. ✅ Keep ventilation in kitchen
4. ✅ Turn off gas when not in use
5. ✅ Check pressure cooker safety valve regularly
6. ✅ Keep fire extinguisher accessible

**LPG Cylinder:**
- Must have BIS hallmark
- Check seal before accepting delivery
- Standard: IS 3196

**Emergency:**
- Gas leak? Open windows, don't use switches
- Call gas emergency: **1906**`,
    category: 'safety',
  },
  {
    id: 'consumer-rights',
    keywords: ['consumer', 'rights', 'consumer rights', 'consumer protection', 'upbhokta'],
    question: 'What are consumer rights related to product safety?',
    answer: `**Consumer Rights under Consumer Protection Act, 2019:**

1. **Right to Safety** — Protection from hazardous products
2. **Right to Information** — Full product details and standards
3. **Right to Choose** — Access to variety of products
4. **Right to be Heard** — File complaints and be heard
5. **Right to Redressal** — Compensation for defective products
6. **Right to Consumer Education** — Awareness about rights

**Where to complain:**
- **National Consumer Helpline:** 1800-11-4000
- **Online:** consumerhelpline.gov.in
- **BIS Helpline:** 14100
- **Consumer Court** — For compensation claims`,
    category: 'safety',
  },
];

/**
 * Search the offline knowledge base using keyword matching
 */
export function searchOfflineKnowledge(query: string): KnowledgeEntry[] {
  const normalizedQuery = query.toLowerCase().trim();
  const stopWords = new Set(['what', 'where', 'how', 'when', 'who', 'tell', 'about', 'basically', 'please', 'the', 'is', 'are', 'was', 'were', 'for', 'in', 'on', 'at']);
  
  const queryWords = normalizedQuery.split(/[\s,?\-!]+/).filter(w => w.length > 1);
  const coreWords = queryWords.filter(w => !stopWords.has(w));

  if (queryWords.length === 0) return [];

  const scored = offlineKnowledgeBase.map((entry) => {
    let score = 0;

    // 1. Exact phrase match in question
    if (entry.question.toLowerCase().includes(normalizedQuery)) {
      score += 15;
    }

    // 2. Exact keyword matches
    for (const keyword of entry.keywords) {
      const k = keyword.toLowerCase();
      if (normalizedQuery === k) {
        score += 10;
      } else if (normalizedQuery.includes(k)) {
        score += 6;
      }
      
      for (const word of coreWords) {
        if (k.includes(word) && word.length > 2) {
          score += 4;
        } else if (k === word) {
          score += 5;
        }
      }
    }

    // 3. Category match
    if (coreWords.some(w => entry.category.includes(w))) {
      score += 2;
    }

    // 4. Answer content matching
    for (const word of coreWords) {
      if (word.length > 3 && entry.answer.toLowerCase().includes(word)) {
        score += 1;
      }
    }

    // Generic match penalty for "bis"
    if (coreWords.length === 1 && coreWords[0] === 'bis' && entry.id === 'bis-overview') {
      if (!normalizedQuery.includes('what')) score = Math.min(score, 3);
    }

    return { entry, score };
  });

  return scored
    .filter((s) => s.score >= 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.entry);
}
