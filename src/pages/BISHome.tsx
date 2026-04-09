import { useState } from 'react';
import { BISHeader } from '@/components/BISHeader';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ChevronRight, MessageSquare, BookOpen, FileText, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { type SupportedLanguage } from '@/data/offlineKnowledgeMultilingual';

const homeTranslations: Record<SupportedLanguage, any> = {
  en: {
    breadcrumb: 'Home > BIS AI',
    govt: 'Government of India',
    bis: 'Bureau of Indian Standards',
    digital: 'Digital Knowledge Services',
    title: 'BIS AI — Official Knowledge Assistant',
    updated: 'Last updated: 15 March 2026',
    desc: 'Official AI-powered knowledge service for BIS standards, certification requirements, and regulatory policies.',
    placeholder: 'Search BIS standards or ask about certification requirements',
    searchBtn: 'Search BIS Knowledge Base',
    verified: 'Verified BIS Knowledge Repository • Source citations from BIS publications',
    disclaimer: 'This service provides AI-assisted responses based on BIS publications. Always verify certification information through official BIS documentation.',
    popular: 'Popular Searches:',
    popularQueries: [
      'Helmet certification requirements',
      'BIS mark verification',
      'Electric heater safety standards',
      'Pressure cooker certification',
    ],
    servicesTitle: 'BIS Digital Services',
    servicesDesc: 'Official digital services for BIS standards, certification and consumer safety.',
    services: [
      { title: 'Ask BIS AI', desc: 'Get AI-powered answers from BIS standards and policies.', link: '/chat', icon: <MessageSquare className="h-4 w-4" /> },
      { title: 'Standards Explorer', desc: 'Search and browse BIS standards by product category.', link: '/standards', icon: <BookOpen className="h-4 w-4" /> },
      { title: 'Certification Guide', desc: 'Understand product certification procedures and requirements.', link: '/certification', icon: <FileText className="h-4 w-4" /> },
      { title: 'Consumer Safety', desc: 'Check counterfeit risk and safety alerts across regions.', link: '/risk-map', icon: <ShieldCheck className="h-4 w-4" /> },
    ],
    alertsTitle: '⚠ Consumer Safety Alerts',
    alertsSub: 'Recent market surveillance updates',
    alertsUpdate: 'Updated: 15 March 2026',
    alerts: [
      'Fake electrical products reported in Delhi markets.',
      'Counterfeit pressure cookers detected in Lucknow.',
      'Non-certified heaters flagged in Mumbai.',
    ]
  },
  hi: {
    breadcrumb: 'होम > BIS एआई',
    govt: 'भारत सरकार',
    bis: 'भारतीय मानक ब्यूरो',
    digital: 'डिजिटल ज्ञान सेवा',
    title: 'BIS AI — आधिकारिक ज्ञान सहायक',
    updated: 'अंतिम अपडेट: 15 मार्च 2026',
    desc: 'BIS मानकों, प्रमाणन आवश्यकताओं और नियामक नीतियों के लिए आधिकारिक AI-संचालित ज्ञान सेवा।',
    placeholder: 'BIS मानकों को खोजें या प्रमाणन आवश्यकताओं के बारे में पूछें',
    searchBtn: 'BIS ज्ञान भंडार खोजें',
    verified: 'सत्यापित BIS ज्ञान भंडार • BIS प्रकाशनों से स्रोत उद्धरण',
    disclaimer: 'यह सेवा BIS प्रकाशनों पर आधारित AI-सहायता प्राप्त प्रतिक्रियाएं प्रदान करती है। हमेशा आधिकारिक BIS दस्तावेजों के माध्यम से प्रमाणन जानकारी सत्यापित करें।',
    popular: 'लोकप्रिय खोजें:',
    popularQueries: [
      'हेलमेट प्रमाणन आवश्यकताएं',
      'BIS मार्क सत्यापन',
      'इलेक्ट्रिक हीटर सुरक्षा मानक',
      'प्रेशर कुकर प्रमाणन',
    ],
    servicesTitle: 'BIS डिजिटल सेवाएं',
    servicesDesc: 'BIS मानकों, प्रमाणन और उपभोक्ता सुरक्षा के लिए आधिकारिक डिजिटल सेवाएं।',
    services: [
      { title: 'BIS AI से पूछें', desc: 'BIS मानकों और नीतियों से AI-संचालित उत्तर प्राप्त करें।', link: '/chat', icon: <MessageSquare className="h-4 w-4" /> },
      { title: 'मानक एक्सप्लोरर', desc: 'उत्पाद श्रेणी के अनुसार BIS मानकों को खोजें और ब्राउज़ करें।', link: '/standards', icon: <BookOpen className="h-4 w-4" /> },
      { title: 'प्रमाणन मार्गदर्शिका', desc: 'उत्पाद प्रमाणन प्रक्रियाओं और आवश्यकताओं को समझें।', link: '/certification', icon: <FileText className="h-4 w-4" /> },
      { title: 'उपभोक्ता सुरक्षा', desc: 'विभिन्न क्षेत्रों में नकली उत्पाद जोखिम और सुरक्षा अलर्ट की जांच करें।', link: '/risk-map', icon: <ShieldCheck className="h-4 w-4" /> },
    ],
    alertsTitle: '⚠ उपभोक्ता सुरक्षा अलर्ट',
    alertsSub: 'हालिया बाजार निगरानी अपडेट',
    alertsUpdate: 'अपडेट किया गया: 15 मार्च 2026',
    alerts: [
      'दिल्ली के बाजारों में नकली बिजली उत्पादों की सूचना मिली।',
      'लखनऊ में नकली प्रेशर कुकर पकड़े गए।',
      'मुंबई में गैर-प्रमाणित हीटरों को चिन्हित किया गया।',
    ]
  }
};

export default function BISHome() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const { language } = useLanguage();

  const t = homeTranslations[language];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`/chat?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <BISHeader />
      <main>
        <div className="max-w-7xl mx-auto px-4 py-3 text-xs text-muted-foreground">
          {t.breadcrumb}
        </div>

        <section className="px-4 py-6 bg-background">
          <div className="max-w-5xl mx-auto space-y-3">
            <div className="text-[11px] text-muted-foreground uppercase tracking-[1px]">
              <div>{t.govt}</div>
              <div>{t.bis}</div>
              <div>{t.digital}</div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {t.title}
            </h1>
            <div className="text-[11px] text-muted-foreground">
              {t.updated}
            </div>
            <p className="text-sm sm:text-base text-muted-foreground max-w-3xl">
              {t.desc}
            </p>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.placeholder}
                  className="h-10 rounded-[4px]"
                />
              </div>
              <Button type="submit" className="h-10 rounded-[4px] px-5 gap-2 shadow-none">
                <Search className="h-4 w-4" />
                {t.searchBtn}
              </Button>
            </form>
            <div className="text-xs text-muted-foreground">
              {t.verified}
            </div>
            <div className="text-xs text-muted-foreground">
              {t.disclaimer}
            </div>
            <div className="text-xs text-muted-foreground">
              {t.popular}
            </div>
            <div className="flex flex-wrap gap-2">
              {t.popularQueries.map((label: string) => (
                <button
                  key={label}
                  onClick={() => setQuery(label)}
                  className="text-xs text-foreground border border-border bg-white dark:bg-card rounded-[4px] px-2.5 py-1 hover:border-primary/40 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-6">
          <div className="max-w-5xl mx-auto">
            <div className="section-divider" />
            <h2 className="text-lg font-semibold text-foreground mb-2">{t.servicesTitle}</h2>
            <p className="text-xs text-muted-foreground mb-4">
              {t.servicesDesc}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {t.services.map((item: any) => (
                <Link key={item.title} to={item.link} className="block">
                  <div className="border border-border bg-white dark:bg-card rounded-[4px] p-4 h-full hover:border-primary/40 transition-colors">
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <span className="text-primary">{item.icon}</span>
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-6 bg-background">
          <div className="max-w-5xl mx-auto">
            <div className="border border-border border-l-4 border-l-primary bg-white dark:bg-card rounded-[4px] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{t.alertsTitle}</h3>
                  <p className="text-[11px] text-muted-foreground">{t.alertsSub}</p>
                </div>
                <span className="text-[11px] text-muted-foreground">{t.alertsUpdate}</span>
              </div>
              <ul className="mt-3 space-y-2 text-xs text-muted-foreground list-disc list-inside">
                {t.alerts.map((alert: string) => (
                  <li key={alert}>{alert}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
