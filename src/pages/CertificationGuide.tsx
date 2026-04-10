import { BISHeader } from '@/components/BISHeader';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { FileText, Search, Building, Award, MessageSquare, ArrowRight, ShieldCheck, ChevronRight, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { type SupportedLanguage } from '@/data/offlineKnowledgeMultilingual';

const certTranslations: Record<SupportedLanguage, any> = {
  en: {
    home: 'Home',
    certGuide: 'Certification Guide',
    govt: 'Government of India',
    bis: 'Bureau of Indian Standards',
    title: 'BIS Product Certification Process',
    subtitle: 'Official Certification & Compliance Guide',
    official: 'Official procedure for ISI Mark and CRS certification',
    desc: 'Step-by-step procedure for obtaining BIS certification under applicable Indian Standards. Ensure your products comply with national safety and quality benchmarks.',
    workflow: 'Standard Certification Workflow',
    schemes: 'Available Certification Schemes',
    needAsst: 'Need Direct Assistance?',
    asstDesc: 'Our AI knowledge assistant can provide detailed answers about specific Standards codes and documentation requirements.',
    askBtn: 'Query BIS AI Assistant',
    note: 'Note',
    noteText: 'Certification requirements may vary depending on the applicable Indian Standard and product category. Applicants should refer to BIS guidelines for detailed requirements.',
    schemeType: 'Scheme Type',
    detailsText: 'For detailed certification requirements, refer to the official BIS certification guidelines available at',
    digitalService: 'Digital Knowledge Service · Government of India',
  },
  hi: {
    home: 'होम',
    certGuide: 'प्रमाणन मार्गदर्शिका',
    govt: 'भारत सरकार',
    bis: 'भारतीय मानक ब्यूरो',
    title: 'BIS उत्पाद प्रमाणन प्रक्रिया',
    subtitle: 'आधिकारिक प्रमाणन और अनुपालन मार्गदर्शिका',
    official: 'ISI मार्क और CRS प्रमाणन के लिए आधिकारिक प्रक्रिया',
    desc: 'लागू भारतीय मानकों के तहत BIS प्रमाणन प्राप्त करने की चरण-दर-चरण प्रक्रिया। सुनिश्चित करें कि आपके उत्पाद राष्ट्रीय सुरक्षा और गुणवत्ता मानकों का अनुपालन करते हैं।',
    workflow: 'मानक प्रमाणन कार्यप्रवाह',
    schemes: 'उपलब्ध प्रमाणन योजनाएं',
    needAsst: 'क्या आपको सीधे सहायता की आवश्यकता है?',
    asstDesc: 'हमारा AI ज्ञान सहायक विशिष्ट मानक कोड और दस्तावेज़ीकरण आवश्यकताओं के बारे में विस्तृत उत्तर प्रदान कर सकता है।',
    askBtn: 'BIS AI सहायक से पूछें',
    note: 'नोट',
    noteText: 'प्रमाणन आवश्यकताएं लागू भारतीय मानक और उत्पाद श्रेणी के आधार पर भिन्न हो सकती हैं। आवेदकों को विस्तृत आवश्यकताओं के लिए BIS दिशानिर्देशों का संदर्भ लेना चाहिए।',
    schemeType: 'योजना प्रकार',
    detailsText: 'विस्तृत प्रमाणन आवश्यकताओं के लिए, आधिकारिक BIS प्रमाणन दिशानिर्देशों को देखें:',
    digitalService: 'डिजिटल ज्ञान सेवा · भारत सरकार',
  }
};

const steps = [
  {
    step: 1,
    title: { en: 'Submit Application', hi: 'आवेदन जमा करें' },
    description: { en: 'Apply online through the BIS Manak Online portal with:', hi: 'BIS मानक ऑनलाइन पोर्टल के माध्यम से ऑनलाइन आवेदन करें:' },
    bullets: { en: ['Product details', 'Test reports', 'Factory information'], hi: ['उत्पाद विवरण', 'परीक्षण रिपोर्ट', 'कारखाना जानकारी'] },
    link: 'https://manakonline.bis.gov.in',
    icon: FileText,
  },
  {
    step: 2,
    title: { en: 'Product Testing', hi: 'उत्पाद परीक्षण' },
    description: { en: 'Products are tested at BIS-recognised laboratories to verify conformity with the relevant Indian Standard specifications.', hi: 'उत्पादों का BIS-मान्यता प्राप्त प्रयोगशालाओं में परीक्षण किया जाता है ताकि संबंधित भारतीय मानक विनिर्देशों के अनुरूपता की पुष्टि की जा सके।' },
    icon: Search,
  },
  {
    step: 3,
    title: { en: 'Factory Inspection', hi: 'कारखाना निरीक्षण' },
    description: { en: 'BIS officers inspect the manufacturing facility to assess quality control systems and production processes.', hi: 'BIS अधिकारी गुणवत्ता नियंत्रण प्रणालियों और उत्पादन प्रक्रियाओं का आकलन करने के लिए विनिर्माण सुविधा का निरीक्षण करते हैं।' },
    icon: Building,
  },
  {
    step: 4,
    title: { en: 'Certification Approval', hi: 'प्रमाणन अनुमोदन' },
    description: { en: 'Upon successful testing and inspection, BIS grants a licence to use the ISI Mark on the product. The licence is subject to regular surveillance.', hi: 'सफल परीक्षण और निरीक्षण के बाद, BIS उत्पाद पर ISI मार्क उपयोग करने के लिए लाइसेंस प्रदान करता है। लाइसेंस नियमित निगरानी के अधीन है।' },
    icon: Award,
  },
];

const schemes = [
  { name: { en: 'ISI Mark (Product Certification)', hi: 'ISI मार्क (उत्पाद प्रमाणन)' }, description: { en: 'For products conforming to Indian Standards', hi: 'भारतीय मानकों के अनुरूप उत्पादों के लिए' }, type: { en: 'Voluntary / Mandatory', hi: 'स्वैच्छिक / अनिवार्य' } },
  { name: { en: 'Hallmarking Scheme', hi: 'हॉलमार्किंग योजना' }, description: { en: 'Certifies purity of gold and silver articles', hi: 'सोने और चांदी के लेखों की शुद्धता प्रमाणित करता है' }, type: { en: 'Mandatory', hi: 'अनिवार्य' } },
  { name: { en: 'Compulsory Registration (CRS)', hi: 'अनिवार्य पंजीकरण (CRS)' }, description: { en: 'For electronic and IT goods safety', hi: 'इलेक्ट्रॉनिक और IT वस्तुओं की सुरक्षा के लिए' }, type: { en: 'Mandatory', hi: 'अनिवार्य' } },
  { name: { en: 'Foreign Manufacturers (FMCS)', hi: 'विदेशी निर्माता (FMCS)' }, description: { en: 'For products manufactured outside India', hi: 'भारत के बाहर निर्मित उत्पादों के लिए' }, type: { en: 'Voluntary', hi: 'स्वैच्छिक' } },
  { name: { en: 'ECO Mark Scheme', hi: 'ECO मार्क योजना' }, description: { en: 'For environment-friendly products', hi: 'पर्यावरण के अनुकूल उत्पादों के लिए' }, type: { en: 'Voluntary', hi: 'स्वैच्छिक' } },
];

export default function CertificationGuide() {
  const { language } = useLanguage();
  const t = certTranslations[language];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <BISHeader />

      {/* Page title band — matches BISChat and other pages */}
      <div className="bg-primary/5 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            <Link to="/" className="hover:text-primary transition-colors">{t.home}</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary font-medium">{t.certGuide}</span>
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                {t.digitalService}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t.title}</h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                {t.desc}
              </p>
            </div>
            <Badge variant="secondary" className="self-start sm:self-auto text-xs px-3 py-1.5 rounded-sm">
              {t.subtitle}
            </Badge>
          </div>
        </div>
      </div>

      <main className="flex-1 py-8 px-4">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* Workflow Steps */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">{t.workflow}</h2>
            </div>
            <div className="space-y-3">
              {steps.map((s) => (
                <Card key={s.step} className="rounded-sm border-l-4 border-l-primary">
                  <CardContent className="p-4 flex gap-4 items-start">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                      {s.step}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
                        <s.icon className="h-4 w-4 text-primary" />
                        {s.title[language]}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{s.description[language]}</p>
                      {'bullets' in s && s.bullets && (
                        <ul className="mt-2 list-disc list-inside text-sm text-muted-foreground space-y-0.5">
                          {s.bullets[language].map((b: string) => (
                            <li key={b}>{b}</li>
                          ))}
                        </ul>
                      )}
                      {'link' in s && s.link && (
                        <a href={s.link} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                          <ExternalLink className="h-3 w-3" />
                          {s.link}
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Note */}
          <div className="border border-border bg-secondary/20 rounded-sm p-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{t.note}:</span> {t.noteText}
          </div>

          {/* Certification Schemes */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-4">{t.schemes}</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {schemes.map((s) => (
                <Card key={s.name.en} className="rounded-sm">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-1">{s.name[language]}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{s.description[language]}</p>
                    <Badge variant="outline" className="text-[10px] rounded-sm">
                      {t.schemeType}: {s.type[language]}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Reference */}
          <p className="text-xs text-muted-foreground">
            {t.detailsText}{' '}
            <a href="https://www.bis.gov.in" target="_blank" rel="noreferrer" className="text-primary hover:underline">
              www.bis.gov.in
            </a>
          </p>

          {/* CTA */}
          <Card className="rounded-sm bg-white dark:bg-card">
            <CardContent className="p-6 text-center flex flex-col items-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{t.needAsst}</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md">{t.asstDesc}</p>
              <Link to="/chat">
                <Button className="h-11 px-8 rounded-sm bg-primary hover:bg-primary/90 text-white font-semibold text-xs gap-2 shadow-none">
                  {t.askBtn} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
