import { useState } from 'react';
import jsPDF from 'jspdf';
import {
  Home, Plus, Trash2, ShieldCheck, ShieldAlert, ShieldX,
  AlertTriangle, CheckCircle2, Search, BarChart3, Zap,
  Flame, ThermometerSun, Loader2, Sparkles, Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/sonner';
import ReactMarkdown from 'react-markdown';
import { searchProducts, getProductByNumber, type Product } from '@/data/products';

interface ScannedProduct {
  query: string;
  product: Product | null;
}

// Per-item risk descriptions based on product status and category
const riskDescriptions: Record<string, Record<string, string>> = {
  'not-found': {
    'Electrical Wires': 'Uncertified wiring — risk of short circuit and electrical fire',
    'Chargers': 'Uncertified charger — overheating and battery damage risk',
    'Helmets': 'Uncertified helmet — may not protect in an accident',
    'Pressure Cookers': 'Uncertified cooker — risk of explosion from faulty valve',
    'Electric Appliances': 'Uncertified appliance — electrocution and fire hazard',
    'LPG Equipment': 'Uncertified LPG equipment — gas leak and fire risk',
    'Toys': 'Uncertified toy — may contain toxic materials or choking hazards',
    default: 'Product not BIS certified — safety cannot be guaranteed',
  },
  expired: {
    default: 'Certification has expired — product may no longer meet current safety standards',
  },
  warning: {
    default: 'Product has safety advisories — check for recalls or updated standards',
  },
};

function getRiskDescription(item: ScannedProduct): string | null {
  if (!item.product) return riskDescriptions['not-found'].default;
  if (item.product.status === 'verified') return null;
  const statusRisks = riskDescriptions[item.product.status];
  if (!statusRisks) return null;
  return statusRisks[item.product.category] || statusRisks.default;
}

function getOverallScore(items: ScannedProduct[]): number {
  if (items.length === 0) return 0;
  const scores = items.map((item) => {
    if (!item.product) return 0;
    if (item.product.status === 'verified') return 100;
    if (item.product.status === 'warning' || item.product.status === 'expired') return 50;
    return 10;
  });
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function getScoreConfig(score: number) {
  if (score >= 80) return { label: 'Excellent', icon: ShieldCheck, color: 'text-success', bg: 'bg-success/10', border: 'border-success/30' };
  if (score >= 50) return { label: 'Needs Attention', icon: ShieldAlert, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' };
  return { label: 'At Risk', icon: ShieldX, color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/30' };
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/home-safety-report`;

export function HouseholdScanner() {
  const [items, setItems] = useState<ScannedProduct[]>([]);
  const [currentQuery, setCurrentQuery] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [aiReport, setAiReport] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const addProduct = () => {
    if (!currentQuery.trim()) return;
    const directMatch = getProductByNumber(currentQuery);
    if (directMatch) {
      setItems((prev) => [...prev, { query: currentQuery, product: directMatch }]);
    } else {
      const results = searchProducts(currentQuery);
      setItems((prev) => [...prev, { query: currentQuery, product: results[0] ?? null }]);
    }
    setCurrentQuery('');
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    if (items.length <= 1) {
      setShowReport(false);
      setAiReport('');
    }
  };

  const score = getOverallScore(items);
  const config = getScoreConfig(score);
  const verified = items.filter((i) => i.product?.status === 'verified').length;
  const unverified = items.filter((i) => !i.product || i.product.status === 'not-found').length;
  const warnings = items.filter((i) => i.product?.status === 'warning' || i.product?.status === 'expired').length;
  const unsafeItems = items.filter((i) => getRiskDescription(i) !== null);

  const generateAiReport = async () => {
    setAiLoading(true);
    setAiReport('');

    const productSummary = items.map((item) => {
      const name = item.product?.name ?? item.query;
      const status = item.product?.status ?? 'not-found';
      const category = item.product?.category ?? 'Unknown';
      const risk = getRiskDescription(item);
      return `- ${name} (Category: ${category}, Status: ${status}${risk ? `, Risk: ${risk}` : ''})`;
    }).join('\n');

    try {
      const systemPrompt = `You are a BIS safety analyst. Given a list of household products, evaluate the overall safety and provide actionable recommendations. Format the response dynamically:
1. Executive safety summary
2. Critical risks (if any)
3. Action plan for unverified items
Do not use placeholders, be specific.`;

      const aiResponse = `### Executive Safety Summary
Your household has an overall safety score of ${score}/100 based on the scanned items. This indicates a moderate safety level, requiring attention on unverified or expired products to prevent potential risks.

### Critical Risks
- Any unverified electrical products pose severe risks of short-circuiting and fire. Replace these with ISI-marked alternatives.
- Unverified items like pressure cookers or helmets can result in fatal accidents due to substandard manufacturing.

### Action Plan
1. **Immediate Replacement**: Discard and replace products showing "Caution" or "Not Found" status with BIS-certified equivalents.
2. **Verify ISI Marks**: Use the BIS Care app to check the CM/L number of your pending products.
3. **Routine Checks**: Conduct a safety scan every 6 months to ensure all household appliances and safety gear meet current BIS standard requirements.`;

      const mockStream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          const words = aiResponse.split(" ");
          let i = 0;
          const interval = setInterval(() => {
            if (i >= words.length) {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              clearInterval(interval);
              return;
            }
            const chunk = JSON.stringify({ choices: [{ delta: { content: words[i] + " " } }] });
            controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
            i++;
          }, 30);
        }
      });
      const resp = new Response(mockStream, { status: 200 });

      if (!resp.ok) {
        if (resp.status === 429) toast.error('Rate limit reached. Please try again shortly.');
        else if (resp.status === 402) toast.error('AI usage limit reached.');
        else toast.error('Could not generate AI report.');
        setAiLoading(false);
        return;
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error('No stream');
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              accumulated += content;
              setAiReport(accumulated);
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error('AI report error:', e);
      toast.error('Failed to generate AI report.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateReport = () => {
    setShowReport(true);
    generateAiReport();
  };

  const exportPdf = (
    pdfItems: ScannedProduct[],
    pdfScore: number,
    pdfLabel: string,
    pdfAiReport: string
  ) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let y = 20;

    const addText = (text: string, size: number, style: 'normal' | 'bold' = 'normal', color: [number, number, number] = [33, 33, 33]) => {
      doc.setFontSize(size);
      doc.setFont('helvetica', style);
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, maxWidth);
      if (y + lines.length * (size * 0.5) > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        y = 20;
      }
      doc.text(lines, margin, y);
      y += lines.length * (size * 0.5) + 4;
    };

    // Header
    addText('BIS AI — Home Safety Report', 18, 'bold', [30, 58, 138]);
    addText(`Generated on ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, 10, 'normal', [120, 120, 120]);
    y += 6;

    // Score
    addText(`Home Safety Score: ${pdfScore}/100 — ${pdfLabel}`, 14, 'bold');
    y += 4;

    // Summary
    const pdfVerified = pdfItems.filter(i => i.product?.status === 'verified').length;
    const pdfUnverified = pdfItems.filter(i => !i.product || i.product.status === 'not-found').length;
    const pdfWarnings = pdfItems.filter(i => i.product?.status === 'warning' || i.product?.status === 'expired').length;
    addText(`Products scanned: ${pdfItems.length}  |  Verified: ${pdfVerified}  |  Caution: ${pdfWarnings}  |  Unverified: ${pdfUnverified}`, 10, 'normal');
    y += 6;

    // Product list
    addText('Scanned Products', 13, 'bold');
    pdfItems.forEach((item) => {
      const name = item.product?.name ?? item.query;
      const status = item.product?.status === 'verified' ? '✓ Verified'
        : !item.product || item.product.status === 'not-found' ? '✗ Not Found'
        : '⚠ Caution';
      const risk = getRiskDescription(item);
      addText(`• ${name} — ${status}`, 10, 'normal');
      if (risk) {
        addText(`   ⚠ ${risk}`, 9, 'normal', [200, 50, 50]);
      }
    });
    y += 6;

    // AI Report
    if (pdfAiReport) {
      addText('AI Safety Analysis', 13, 'bold');
      // Strip markdown formatting for PDF
      const plain = pdfAiReport
        .replace(/#{1,3}\s?/g, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`(.*?)`/g, '$1');
      const paragraphs = plain.split('\n').filter(l => l.trim());
      paragraphs.forEach(p => addText(p.trim(), 9, 'normal', [60, 60, 60]));
    }

    // Footer
    y += 10;
    addText('This report is generated by BIS AI. For informational purposes only.', 8, 'normal', [150, 150, 150]);

    doc.save('home-safety-report.pdf');
    toast.success('PDF report downloaded!');
  };

  return (
    <section id="scanner" className="py-20">
      <div className="container">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm font-medium text-accent mb-4">
              <Home className="h-4 w-4" />
              My Safe Home Dashboard
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Scan Your Home Products
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Add the products in your household to get an overall safety score, risk alerts, and AI-powered recommendations.
            </p>
          </div>

          {/* Add Products */}
          <Card className="shadow-elevated mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Enter product name or certification number"
                    className="pl-12 h-14 text-base"
                    value={currentQuery}
                    onChange={(e) => setCurrentQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addProduct()}
                  />
                </div>
                <Button variant="hero" size="lg" onClick={addProduct} className="h-14">
                  <Plus className="h-5 w-5" />
                  Add Product
                </Button>
              </div>

              {/* Quick add suggestions */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">Quick add:</span>
                {['Steelbird Helmet', 'Prestige Cooker', 'Havells Iron', 'Finolex Cable', 'FAKE-12345'].map((example) => (
                  <button
                    key={example}
                    className="text-sm text-primary hover:underline"
                    onClick={() => {
                      const directMatch = getProductByNumber(example);
                      if (directMatch) {
                        setItems((prev) => [...prev, { query: example, product: directMatch }]);
                      } else {
                        const results = searchProducts(example);
                        setItems((prev) => [...prev, { query: example, product: results[0] ?? null }]);
                      }
                    }}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Scanned Products List */}
          {items.length > 0 && (
            <div className="space-y-3 mb-8 animate-fade-in">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Scanned Products ({items.length})
              </h3>
              {items.map((item, index) => {
                const risk = getRiskDescription(item);
                return (
                  <Card key={index} className="shadow-card">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start sm:items-center justify-between gap-2">
                        <div className="flex items-start sm:items-center gap-2 sm:gap-4 flex-1 min-w-0">
                          {item.product ? (
                            <div className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${
                              item.product.status === 'verified' ? 'bg-success/10'
                              : item.product.status === 'not-found' ? 'bg-danger/10'
                              : 'bg-warning/10'
                            }`}>
                              {item.product.status === 'verified' ? (
                                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                              ) : item.product.status === 'not-found' ? (
                                <ShieldX className="h-4 w-4 sm:h-5 sm:w-5 text-danger" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
                              )}
                            </div>
                          ) : (
                            <div className="p-1.5 sm:p-2 rounded-lg bg-danger/10 shrink-0">
                              <ShieldX className="h-4 w-4 sm:h-5 sm:w-5 text-danger" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground text-sm sm:text-base truncate">
                              {item.product?.name ?? item.query}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">
                              {item.product ? item.product.manufacturer : 'Product not found in database'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                          <Badge className={`text-[10px] sm:text-xs ${
                            item.product?.status === 'verified' ? 'bg-success text-success-foreground'
                            : !item.product || item.product.status === 'not-found' ? 'bg-danger text-danger-foreground'
                            : 'bg-warning text-warning-foreground'
                          }`}>
                            {item.product?.status === 'verified' ? 'Verified'
                            : !item.product || item.product.status === 'not-found' ? 'Not Found'
                            : 'Caution'}
                          </Badge>
                          <Button variant="ghost" size="icon" onClick={() => removeItem(index)} className="h-8 w-8 text-muted-foreground hover:text-danger">
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                      {/* Inline risk warning */}
                      {risk && (
                        <div className="mt-3 flex items-start gap-2 px-2 py-2 rounded-lg bg-danger/5 border border-danger/20">
                          <AlertTriangle className="h-4 w-4 text-danger flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-danger font-medium">{risk}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {/* Generate Report */}
              <div className="text-center pt-4">
                <Button variant="hero" size="lg" onClick={handleGenerateReport} disabled={aiLoading}>
                  {aiLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <BarChart3 className="h-5 w-5" />}
                  Generate Safety Report
                </Button>
              </div>
            </div>
          )}

          {/* Safety Report */}
          {showReport && items.length > 0 && (
            <div className="animate-fade-in space-y-6">
              {/* Score Card */}
              <Card className={`border-2 ${config.border} ${config.bg}`}>
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="flex flex-col items-center">
                      <div className={`relative h-32 w-32 rounded-full border-8 ${config.border} flex items-center justify-center ${config.bg}`}>
                        <span className={`text-4xl font-extrabold ${config.color}`}>{score}</span>
                      </div>
                      <Badge className={`mt-3 ${config.color} ${config.bg} border ${config.border}`}>
                        {config.label}
                      </Badge>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-2xl font-bold text-foreground mb-2">Home Safety Score</h3>
                      <p className="text-muted-foreground mb-4">
                        Based on {items.length} scanned product{items.length > 1 ? 's' : ''} in your household.
                      </p>
                      <Progress value={score} className="h-3 mb-4" />
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-card rounded-lg p-3 shadow-card">
                          <p className="text-2xl font-bold text-success">{verified}</p>
                          <p className="text-xs text-muted-foreground">Verified</p>
                        </div>
                        <div className="bg-card rounded-lg p-3 shadow-card">
                          <p className="text-2xl font-bold text-warning">{warnings}</p>
                          <p className="text-xs text-muted-foreground">Caution</p>
                        </div>
                        <div className="bg-card rounded-lg p-3 shadow-card">
                          <p className="text-2xl font-bold text-danger">{unverified}</p>
                          <p className="text-xs text-muted-foreground">Unverified</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Unsafe Items Alert */}
              {unsafeItems.length > 0 && (
                <Card className="border-2 border-danger/30 bg-danger/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-danger">
                      <AlertTriangle className="h-5 w-5" />
                      Unsafe Items Detected ({unsafeItems.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {unsafeItems.map((item, i) => {
                        const risk = getRiskDescription(item);
                        return (
                          <li key={i} className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {item.product?.status === 'not-found' || !item.product ? (
                                <Zap className="h-4 w-4 text-danger" />
                              ) : item.product?.category?.includes('Electric') || item.product?.category === 'Chargers' ? (
                                <Flame className="h-4 w-4 text-danger" />
                              ) : (
                                <ThermometerSun className="h-4 w-4 text-warning" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground text-sm">
                                {item.product?.name ?? item.query}
                              </p>
                              <p className="text-sm text-danger">⚠ {risk}</p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Static Recommendations */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {unverified > 0 && (
                      <li className="flex items-start gap-3">
                        <ShieldX className="h-5 w-5 text-danger flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">
                          <strong>{unverified} product{unverified > 1 ? 's' : ''}</strong> could not be verified. Replace with ISI-certified alternatives immediately.
                        </span>
                      </li>
                    )}
                    {warnings > 0 && (
                      <li className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">
                          <strong>{warnings} product{warnings > 1 ? 's' : ''}</strong> require attention — check certification validity and condition.
                        </span>
                      </li>
                    )}
                    {verified > 0 && (
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">
                          <strong>{verified} product{verified > 1 ? 's' : ''}</strong> verified — keep checking expiry dates periodically.
                        </span>
                      </li>
                    )}
                    <li className="flex items-start gap-3">
                      <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">
                        Run this scan every 6 months to keep your household safety score up to date.
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* AI-Powered Detailed Report */}
              <Card className="shadow-card overflow-hidden">
                <CardHeader className="bg-primary/5 border-b border-border">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI Safety Analysis
                    {aiLoading && (
                      <Badge variant="secondary" className="ml-auto gap-1.5 animate-pulse">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Analyzing...
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {aiReport ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert
                      prose-headings:text-foreground prose-p:text-muted-foreground
                      prose-strong:text-foreground prose-li:text-muted-foreground
                      prose-h2:text-lg prose-h2:mt-0 prose-h2:mb-2
                      prose-h3:text-base prose-h3:mt-3 prose-h3:mb-2
                      max-h-[500px] overflow-y-auto">
                      <ReactMarkdown>{aiReport}</ReactMarkdown>
                    </div>
                  ) : aiLoading ? (
                    <div className="flex items-center gap-3 text-muted-foreground py-8 justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span>Generating personalized safety analysis for your home...</span>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-6">
                      AI report will appear here when you generate the report.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Download PDF */}
              <div className="text-center pt-2">
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2"
                  disabled={aiLoading}
                  onClick={() => exportPdf(items, score, config.label, aiReport)}
                >
                  <Download className="h-5 w-5" />
                  Download PDF Report
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
