import { BISHeader } from '@/components/BISHeader';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { FileText, Search, Building, Award, MessageSquare, ArrowRight } from 'lucide-react';

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
  return (
    <div className="min-h-screen bg-background">
      <BISHeader />
      <main className="py-8 px-4">
        <div className="max-w-[960px] mx-auto">
          <div className="text-sm text-muted-foreground mb-4">Home &gt; Certification Guide &gt; Product Certification Process</div>
          <div className="mb-6">
            <div className="text-[13px] text-muted-foreground uppercase tracking-[1px] mb-2">Certification Guide</div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              BIS Product Certification Process
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-3xl">
              Step-by-step procedure for obtaining BIS certification under applicable Indian Standards.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4 mb-8">
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
          <div className="section-divider" />
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">BIS Certification Schemes</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {schemes.map((s) => (
                <div key={s.name} className="border border-border bg-white dark:bg-card rounded-[2px] p-4">
                  <h3 className="text-sm font-semibold text-foreground">{s.name}</h3>
                  <p className="text-muted-foreground text-xs mt-1">{s.description}</p>
                  <p className="text-[11px] text-muted-foreground mt-2">Scheme Type: {s.type}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground mb-10">
            For detailed certification requirements, refer to the official BIS certification guidelines available at <code>www.bis.gov.in</code>.
          </p>

          {/* CTA */}
          <Card className="border border-border rounded-[2px] bg-white dark:bg-card">
            <CardContent className="p-6 text-left">
              <MessageSquare className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="text-xl font-bold text-foreground mb-2">Have questions about certification?</h3>
              <p className="text-muted-foreground mb-4">Ask our AI assistant for instant answers</p>
              <Link to="/chat">
                <Button className="gap-2">
                  Ask the AI about certification <ArrowRight className="h-4 w-4" />
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
