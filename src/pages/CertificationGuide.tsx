import { BISHeader } from '@/components/BISHeader';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { FileText, Search, Building, Award, MessageSquare, ArrowRight, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { type SupportedLanguage } from '@/data/offlineKnowledgeMultilingual';

const certTranslations: Record<SupportedLanguage, any> = {
  en: {
    home: 'Home',
    certGuide: 'Certification Guide',
    govt: 'Government of India',
    bis: 'Bureau of Indian Standards',
    title: 'BIS Product Certification Process',
    official: 'Official procedure for ISI Mark and CRS certification',
    desc: 'Step-by-step procedure for obtaining BIS certification under applicable Indian Standards. Ensure your products comply with national safety and quality benchmarks.',
    workflow: 'Standard Certification Workflow',
    schemes: 'Available Certification Schemes',
    needAsst: 'Need Direct Assistance?',
    asstDesc: 'Our AI knowledge assistant can provide detailed answers about specific Standards codes and documentation requirements.',
    askBtn: 'Query BIS AI Assistant',
  },
  hi: {
    home: 'होम',
    certGuide: 'प्रमाणन मार्गदर्शिका',
    govt: 'भारत सरकार',
    bis: 'भारतीय मानक ब्यूरो',
    title: 'BIS उत्पाद प्रमाणन प्रक्रिया',
    official: 'ISI मार्क और CRS प्रमाणन के लिए आधिकारिक प्रक्रिया',
    desc: 'लागू भारतीय मानकों के तहत BIS प्रमाणन प्राप्त करने की चरण-दर-चरण प्रक्रिया। सुनिश्चित करें कि आपके उत्पाद राष्ट्रीय सुरक्षा और गुणवत्ता मानकों का अनुपालन करते हैं।',
    workflow: 'मानक प्रमाणन कार्यप्रवाह',
    schemes: 'उपलब्ध प्रमाणन योजनाएं',
    needAsst: 'क्या आपको सीधे सहायता की आवश्यकता है?',
    asstDesc: 'हमारा AI ज्ञान सहायक विशिष्ट मानक कोड और दस्तावेज़ीकरण आवश्यकताओं के बारे में विस्तृत उत्तर प्रदान कर सकता है।',
    askBtn: 'BIS AI सहायक से पूछें',
  }
};

const steps = [
  {
    step: 1,
    title: 'Submit Application',
    description: 'Apply online through the BIS Manak Online portal with:',
    bullets: ['Product details', 'Test reports', 'Factory information'],
    link: 'https://manakonline.bis.gov.in',
    icon: FileText,
  },
  {
    step: 2,
    title: 'Product Testing',
    description: 'Products are tested at BIS-recognised laboratories to verify conformity with the relevant Indian Standard specifications.',
    icon: Search,
  },
  {
    step: 3,
    title: 'Factory Inspection',
    description: 'BIS officers inspect the manufacturing facility to assess quality control systems and production processes.',
    icon: Building,
  },
  {
    step: 4,
    title: 'Certification Approval',
    description: 'Upon successful testing and inspection, BIS grants a licence to use the ISI Mark on the product. The licence is subject to regular surveillance.',
    icon: Award,
  },
];

const schemes = [
  { name: 'ISI Mark (Product Certification)', description: 'For products conforming to Indian Standards', type: 'Voluntary / Mandatory' },
  { name: 'Hallmarking Scheme', description: 'Certifies purity of gold and silver articles', type: 'Mandatory' },
  { name: 'Compulsory Registration (CRS)', description: 'For electronic and IT goods safety', type: 'Mandatory' },
  { name: 'Foreign Manufacturers (FMCS)', description: 'For products manufactured outside India', type: 'Voluntary' },
  { name: 'ECO Mark Scheme', description: 'For environment-friendly products', type: 'Voluntary' },
];

export default function CertificationGuide() {
  const { language } = useLanguage();
  const t = certTranslations[language];
  return (
    <div className="min-h-screen bg-background">
      <BISHeader />
      <main>
        {/* Official Breadcrumbs */}
        <div className="max-w-7xl mx-auto px-4 py-3 text-[11px] text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">{t.home}</Link> &gt; {t.certGuide}
        </div>

        {/* Hero Section matching BISHome */}
        <section className="px-4 py-6 bg-background">
          <div className="max-w-5xl mx-auto space-y-3">
            <div className="text-[11px] text-muted-foreground uppercase tracking-[1px]">
              <div>{t.govt}</div>
              <div>{t.bis}</div>
              <div>{t.certGuide}</div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {t.title}
            </h1>
            <div className="text-[11px] text-muted-foreground">
              {t.official}
            </div>
            <p className="text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
              {t.desc}
            </p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 pb-12">
          {/* Steps */}
          <div className="space-y-4 mb-10">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              {t.workflow}
            </h2>
            {steps.map((s) => (
              <div key={s.step} className="border border-border border-l-4 border-l-primary bg-white dark:bg-card rounded-[2px] p-4 flex gap-4 items-start">
                <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-[13px]">
                  {s.step}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <s.icon className="h-4 w-4 text-primary" />
                    {s.title}
                  </h3>
                  <p className="text-[15px] text-muted-foreground mt-1 leading-relaxed">{s.description}</p>
                  {'bullets' in s && s.bullets && (
                    <ul className="mt-2 list-disc list-inside text-[15px] text-muted-foreground space-y-1">
                      {s.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  )}
                  {'link' in s && s.link && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      BIS Manak Online portal: <code>{s.link}</code>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border border-border border-l-4 border-l-primary bg-[#f9fafb] dark:bg-secondary/30 rounded-[2px] p-4 text-xs text-muted-foreground mb-8">
            <span className="font-semibold text-foreground">Note:</span> Certification requirements may vary depending on the applicable Indian Standard and product category. Applicants should refer to BIS guidelines for detailed requirements.
          </div>

          {/* Schemes */}
          <div className="gov-section-header mb-6">
            <h2 className="text-lg font-bold text-foreground">{t.schemes}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mb-10">
            {schemes.map((s) => (
              <div key={s.name} className="border border-border bg-white dark:bg-card rounded-[2px] p-4">
                <h3 className="text-sm font-semibold text-foreground">{s.name}</h3>
                <p className="text-muted-foreground text-xs mt-1">{s.description}</p>
                <p className="text-[11px] text-muted-foreground mt-2">Scheme Type: {s.type}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mb-10">
            For detailed certification requirements, refer to the official BIS certification guidelines available at <code>www.bis.gov.in</code>.
          </p>

          {/* CTA */}
          <Card className="border border-border rounded-[2px] bg-white dark:bg-card">
            <CardContent className="p-6 text-center flex flex-col items-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{t.needAsst}</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md">{t.asstDesc}</p>
              <Link to="/chat">
                <Button className="h-11 px-8 rounded-[4px] bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-wider text-xs gap-2">
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
