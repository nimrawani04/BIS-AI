import { BISHeader } from '@/components/BISHeader';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Target, Users, Globe, ChevronRight, Building2, Award, BookOpen, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { type SupportedLanguage } from '@/data/offlineKnowledgeMultilingual';

const aboutTranslations: Record<SupportedLanguage, any> = {
  en: {
    home: 'Home',
    about: 'About BIS',
    title: 'About BIS',
    subtitle: "India's National Standards Body",
    digitalService: 'Digital Knowledge Service · Government of India',
    intro1: 'The Bureau of Indian Standards (BIS) is the national standards body of India established under the BIS Act, 2016. It is responsible for the harmonious development of standardization, marking, and quality certification of goods.',
    intro2: 'BIS develops Indian Standards, operates product certification schemes (ISI Mark), runs the Hallmarking scheme for gold and silver articles, and manages the Compulsory Registration Scheme for electronic and IT goods.',
    keyFunctions: 'Key Functions',
    keyFacts: 'Key Facts',
    standards: 'Standards',
    established: 'Established',
    regionalOffices: 'Regional Offices',
    branchOffices: 'Branch Offices',
    visitWebsite: 'Visit Official Website',
    functions: [
      {
        icon: Shield,
        title: 'Standards Development',
        desc: 'BIS formulates Indian Standards covering products, services, and systems across all sectors of the economy.',
      },
      {
        icon: Target,
        title: 'Product Certification',
        desc: 'Through ISI Mark certification, BIS ensures products meet quality and safety requirements defined by Indian Standards.',
      },
      {
        icon: Users,
        title: 'Consumer Protection',
        desc: 'BIS safeguards consumer interests by ensuring products in the market conform to established quality standards.',
      },
      {
        icon: Globe,
        title: 'International Cooperation',
        desc: 'BIS represents India in ISO, IEC, and other international standards organizations for global harmonization.',
      },
    ],
  },
  hi: {
    home: 'होम',
    about: 'BIS के बारे में',
    title: 'BIS के बारे में',
    subtitle: 'भारत का राष्ट्रीय मानक निकाय',
    digitalService: 'डिजिटल ज्ञान सेवा · भारत सरकार',
    intro1: 'भारतीय मानक ब्यूरो (BIS) BIS अधिनियम, 2016 के तहत स्थापित भारत का राष्ट्रीय मानक निकाय है। यह वस्तुओं के मानकीकरण, अंकन और गुणवत्ता प्रमाणन के सामंजस्यपूर्ण विकास के लिए जिम्मेदार है।',
    intro2: 'BIS भारतीय मानक विकसित करता है, उत्पाद प्रमाणन योजनाएं (ISI मार्क) संचालित करता है, सोने और चांदी के लेखों के लिए हॉलमार्किंग योजना चलाता है, और इलेक्ट्रॉनिक और IT वस्तुओं के लिए अनिवार्य पंजीकरण योजना का प्रबंधन करता है।',
    keyFunctions: 'मुख्य कार्य',
    keyFacts: 'मुख्य तथ्य',
    standards: 'मानक',
    established: 'स्थापित',
    regionalOffices: 'क्षेत्रीय कार्यालय',
    branchOffices: 'शाखा कार्यालय',
    visitWebsite: 'आधिकारिक वेबसाइट पर जाएं',
    functions: [
      {
        icon: Shield,
        title: 'मानक विकास',
        desc: 'BIS अर्थव्यवस्था के सभी क्षेत्रों में उत्पादों, सेवाओं और प्रणालियों को कवर करने वाले भारतीय मानक तैयार करता है।',
      },
      {
        icon: Target,
        title: 'उत्पाद प्रमाणन',
        desc: 'ISI मार्क प्रमाणन के माध्यम से, BIS सुनिश्चित करता है कि उत्पाद भारतीय मानकों द्वारा परिभाषित गुणवत्ता और सुरक्षा आवश्यकताओं को पूरा करते हैं।',
      },
      {
        icon: Users,
        title: 'उपभोक्ता संरक्षण',
        desc: 'BIS यह सुनिश्चित करके उपभोक्ता हितों की रक्षा करता है कि बाजार में उत्पाद स्थापित गुणवत्ता मानकों के अनुरूप हैं।',
      },
      {
        icon: Globe,
        title: 'अंतर्राष्ट्रीय सहयोग',
        desc: 'BIS वैश्विक सामंजस्य के लिए ISO, IEC और अन्य अंतर्राष्ट्रीय मानक संगठनों में भारत का प्रतिनिधित्व करता है।',
      },
    ],
  }
};

export default function AboutBIS() {
  const { language } = useLanguage();
  const t = aboutTranslations[language];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <BISHeader />

      {/* Page title band */}
      <div className="bg-primary/5 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            <Link to="/" className="hover:text-primary transition-colors">{t.home}</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary font-medium">{t.about}</span>
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                {t.digitalService}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Bureau of Indian Standards — भारतीय मानक ब्यूरो
              </p>
            </div>
            <Badge variant="secondary" className="self-start sm:self-auto text-xs px-3 py-1.5 rounded-sm">
              {t.subtitle}
            </Badge>
          </div>
        </div>
      </div>

      <main className="flex-1 py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Introduction */}
          <section className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t.intro1}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t.intro2}
            </p>
          </section>

          {/* Key Functions */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">{t.keyFunctions}</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {t.functions.map((item: any) => (
                <Card key={item.title} className="rounded-sm">
                  <CardContent className="p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Key Facts */}
          <Card className="rounded-sm bg-secondary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">{t.keyFacts}</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                {[
                  { value: '22,000+', label: t.standards },
                  { value: '1947', label: t.established },
                  { value: '5', label: t.regionalOffices },
                  { value: '21', label: t.branchOffices },
                ].map((fact) => (
                  <div key={fact.label}>
                    <p className="text-2xl font-bold text-primary">{fact.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{fact.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Official Website Link */}
          <Card className="rounded-sm bg-white dark:bg-card">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Building2 className="h-6 w-6" />
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-sm font-semibold text-foreground mb-0.5">{t.visitWebsite}</h3>
                  <p className="text-xs text-muted-foreground">www.bis.gov.in</p>
                </div>
              </div>
              <a 
                href="https://www.bis.gov.in" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 h-10 rounded-sm bg-primary hover:bg-primary/90 text-white text-xs font-semibold transition-colors shadow-none"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {t.visitWebsite}
              </a>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
