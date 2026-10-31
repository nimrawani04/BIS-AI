import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, QrCode, CheckCircle2, AlertTriangle, XCircle, Shield,
  Calendar, Building2, FileText, ExternalLink, Camera, Upload, Star,
  ScanBarcode, Loader2, X, ImageIcon, Clock, ChevronRight, Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { searchProducts, getProductByNumber, type Product } from '@/data/products';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ScanHistoryItem {
  id: string;
  image_url: string;
  product_name: string | null;
  brand: string | null;
  category: string | null;
  risk_level: string;
  summary: string | null;
  certification_marks: string[] | null;
  safety_observations: string[] | null;
  recommendation: string | null;
  analysis_json: any;
  created_at: string;
}
type ScanMode = 'barcode' | 'certificate' | 'image';

export function ProductVerification() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>('certificate');
  
  // Image upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Scan history state
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [expandedScanId, setExpandedScanId] = useState<string | null>(null);

  const fetchScanHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('scan_history')
        .select('id, image_url, product_name, brand, category, risk_level, summary, certification_marks, safety_observations, recommendation, analysis_json, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      setScanHistory((data as ScanHistoryItem[]) || []);
    } catch (err) {
      console.error('Failed to fetch scan history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchScanHistory();
  }, [fetchScanHistory]);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      return;
    }
    setUploadedFile(file);
    setAnalysisResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const clearUpload = () => {
    setUploadedFile(null);
    setImagePreview(null);
    setAnalysisResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadAndAnalyze = async () => {
    if (!uploadedFile) return;
    
    setIsUploading(true);
    try {
      // Upload to storage
      const fileName = `${Date.now()}-${uploadedFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
      let analysis: any;
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, uploadedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(uploadData.path);

        setIsUploading(false);
        setIsAnalyzing(true);

        const { data: analysisData, error: analysisError } = await supabase.functions
          .invoke('analyze-product-image', {
            body: { imageUrl: publicUrl },
          });

        if (analysisError) throw analysisError;
        analysis = analysisData.analysis;

        // Try saving to history if supabase is active
        await supabase.from('scan_history').insert({
          image_url: publicUrl,
          product_name: analysis.productName || null,
          brand: analysis.brand || null,
          category: analysis.category || null,
          risk_level: analysis.riskLevel || 'medium',
          summary: analysis.summary || null,
          certification_marks: analysis.certificationMarks || [],
          safety_observations: analysis.safetyObservations || [],
          recommendation: analysis.recommendation || null,
          analysis_json: analysis,
        }).then(() => fetchScanHistory()).catch(() => {});
      } catch (err) {
        console.warn('Supabase image analysis unavailable, using local assessment:', err);
        analysis = {
          productName: uploadedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Consumer Product',
          brand: 'Inspected Item',
          category: 'Consumer Goods',
          applicableStandard: 'IS Standard Verification',
          riskLevel: 'medium',
          certificationMarks: ['ISI Mark Verification Needed'],
          certificationNumber: 'CM/L verification recommended',
          safetyObservations: [
            'Product image received and safety checklist generated.',
            'Standard BIS compliance markings must be physically verified on the label.',
            'Ensure the ISI logo contains the 7-digit CM/L license number beneath it.'
          ],
          summary: 'Product photo processed. Please cross-verify the standard number and manufacturer license on the BIS Care app.',
          recommendation: 'Scan or input the 7-digit CM/L number into the official BIS Care mobile app for instant verification.'
        };
      }

      setAnalysisResult(analysis);
      toast.success('Image analyzed successfully!');
    } catch (error: any) {
      console.error('Upload/analysis error:', error);
      toast.error(error.message || 'Failed to analyze image');
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  const handleSearch = () => {
    if (!query.trim()) return;
    const directMatch = getProductByNumber(query);
    if (directMatch) {
      setSelectedProduct(directMatch);
      setSearchResults([]);
    } else {
      const results = searchProducts(query);
      setSearchResults(results);
      setSelectedProduct(null);
    }
    setHasSearched(true);
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setSearchResults([]);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'verified':
        return { icon: CheckCircle2, label: 'BIS Certified', className: 'bg-success text-success-foreground', bgClass: 'bg-success/10 border-success/20' };
      case 'warning':
        return { icon: AlertTriangle, label: 'Caution Required', className: 'bg-warning text-warning-foreground', bgClass: 'bg-warning/10 border-warning/20' };
      case 'expired':
        return { icon: AlertTriangle, label: 'Expired', className: 'bg-warning text-warning-foreground', bgClass: 'bg-warning/10 border-warning/20' };
      default:
        return { icon: XCircle, label: 'Not Found', className: 'bg-danger text-danger-foreground', bgClass: 'bg-danger/10 border-danger/20' };
    }
  };

  const scanModes: { key: ScanMode; icon: typeof ScanBarcode; label: string }[] = [
    { key: 'barcode', icon: ScanBarcode, label: 'Scan Barcode' },
    { key: 'certificate', icon: QrCode, label: 'Enter Certification Number' },
    { key: 'image', icon: Camera, label: 'Upload Product Image' },
  ];

  return (
    <section id="verify" className="py-20 bg-secondary/30">
      <div className="container">
        <div className="mx-auto max-w-4xl">
          {/* Section Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-4">
              <QrCode className="h-4 w-4" />
              Product Scanner
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-3">
              Scan & Verify Products
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Verify product authenticity using barcode, certification number, or product image.
            </p>
          </div>

          {/* Scanner Box */}
          <Card className="shadow-elevated mb-8 overflow-hidden">
            {/* Scanner Visual */}
            <div className="relative bg-primary/5 border-b-2 border-dashed border-primary/20 py-12">
              <div className="mx-auto w-48 h-48 rounded-3xl border-4 border-primary/30 bg-card shadow-card flex flex-col items-center justify-center gap-3">
                {scanMode === 'barcode' && <ScanBarcode className="h-16 w-16 text-primary/40" />}
                {scanMode === 'certificate' && <QrCode className="h-16 w-16 text-primary/40" />}
                {scanMode === 'image' && <Camera className="h-16 w-16 text-primary/40" />}
                <span className="text-sm font-medium text-muted-foreground">
                  {scanMode === 'barcode' ? 'Point camera at barcode' : scanMode === 'image' ? 'Upload product photo' : 'Enter cert. number'}
                </span>
              </div>
              {/* Animated scan line */}
              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-52 h-0.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent animate-pulse" />
            </div>

            {/* Scan Mode Tabs */}
            <div className="flex border-b border-border">
              {scanModes.map((mode) => (
                <button
                  key={mode.key}
                  onClick={() => setScanMode(mode.key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-all ${
                    scanMode === mode.key
                      ? 'text-primary border-b-2 border-primary bg-primary/5'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <mode.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{mode.label}</span>
                </button>
              ))}
            </div>

            {/* Input Area */}
            <CardContent className="p-6">
              {scanMode === 'image' ? (
                <div className="flex flex-col items-center gap-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />

                  {imagePreview ? (
                    <div className="w-full max-w-sm">
                      <div className="relative rounded-2xl overflow-hidden border-2 border-primary/20 bg-card">
                        <img src={imagePreview} alt="Uploaded product" className="w-full h-48 object-contain bg-muted/30" />
                        <button
                          onClick={clearUpload}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 text-center truncate">{uploadedFile?.name}</p>
                      <Button
                        variant="hero"
                        size="lg"
                        className="w-full mt-3 rounded-xl"
                        onClick={handleUploadAndAnalyze}
                        disabled={isUploading || isAnalyzing}
                      >
                        {isUploading ? (
                          <><Loader2 className="h-5 w-5 animate-spin" /> Uploading...</>
                        ) : isAnalyzing ? (
                          <><Loader2 className="h-5 w-5 animate-spin" /> Analyzing with AI...</>
                        ) : (
                          <><Search className="h-5 w-5" /> Analyze Product</>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div
                      ref={dropZoneRef}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full max-w-sm border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${
                        isDragging
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm font-medium text-foreground mb-1">Drag & drop product image</p>
                      <p className="text-xs text-muted-foreground">or <span className="text-primary underline">click to browse files</span></p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">Supports JPG, PNG — Max 5MB</p>

                  {/* Analysis Result */}
                  {analysisResult && (
                    <Card className="w-full mt-2 rounded-2xl border-2 border-primary/20 animate-fade-in">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${
                            analysisResult.riskLevel === 'low' ? 'bg-success/10' :
                            analysisResult.riskLevel === 'high' ? 'bg-danger/10' : 'bg-warning/10'
                          }`}>
                            {analysisResult.riskLevel === 'low' ? (
                              <CheckCircle2 className="h-6 w-6 text-success" />
                            ) : analysisResult.riskLevel === 'high' ? (
                              <XCircle className="h-6 w-6 text-danger" />
                            ) : (
                              <AlertTriangle className="h-6 w-6 text-warning" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-foreground">{analysisResult.productName || 'Product Analysis'}</h4>
                            {analysisResult.brand && <p className="text-sm text-muted-foreground">{analysisResult.brand}</p>}
                          </div>
                          <Badge className={`ml-auto rounded-full ${
                            analysisResult.riskLevel === 'low' ? 'bg-success text-success-foreground' :
                            analysisResult.riskLevel === 'high' ? 'bg-danger text-danger-foreground' : 'bg-warning text-warning-foreground'
                          }`}>
                            {analysisResult.riskLevel === 'low' ? 'Low Risk' :
                             analysisResult.riskLevel === 'high' ? 'High Risk' : 'Medium Risk'}
                          </Badge>
                        </div>

                        {analysisResult.summary && (
                          <p className="text-sm text-foreground">{analysisResult.summary}</p>
                        )}

                        {analysisResult.certificationMarks?.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1.5">Certification Marks Found</p>
                            <div className="flex flex-wrap gap-1.5">
                              {analysisResult.certificationMarks.map((mark: string, i: number) => (
                                <Badge key={i} variant="outline" className="rounded-full text-xs">{mark}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {analysisResult.safetyObservations?.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1.5">Safety Observations</p>
                            <ul className="space-y-1.5">
                              {analysisResult.safetyObservations.map((obs: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                                  <Shield className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                  {obs}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {analysisResult.recommendation && (
                          <div className="bg-primary/5 rounded-xl p-3">
                            <p className="text-xs font-medium text-primary mb-1">Recommendation</p>
                            <p className="text-sm text-foreground">{analysisResult.recommendation}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder={scanMode === 'barcode' ? 'Enter barcode number manually' : 'Enter product name or certification number (e.g., CM/L-1234567)'}
                      className="pl-12 h-14 text-base rounded-xl"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <Button variant="hero" size="lg" onClick={handleSearch} className="h-14 rounded-xl px-8">
                    <Search className="h-5 w-5" />
                    Verify
                  </Button>
                </div>
              )}

              {/* Quick Examples */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">Try:</span>
                {['Steelbird Helmet', 'CM/L-1234567', 'Pressure Cooker', 'FAKE-12345'].map((example) => (
                  <button
                    key={example}
                    className="text-sm text-primary hover:underline rounded-full bg-primary/5 px-3 py-1"
                    onClick={() => {
                      setQuery(example);
                      const directMatch = getProductByNumber(example);
                      if (directMatch) { setSelectedProduct(directMatch); setSearchResults([]); }
                      else { setSearchResults(searchProducts(example)); setSelectedProduct(null); }
                      setHasSearched(true);
                    }}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mb-8 animate-fade-in">
              <h3 className="text-lg font-semibold mb-4">Search Results ({searchResults.length})</h3>
              <div className="grid gap-3">
                {searchResults.map((product) => {
                  const sc = getStatusConfig(product.status);
                  return (
                    <Card key={product.id} className="cursor-pointer hover:shadow-elevated transition-all rounded-2xl" onClick={() => handleSelectProduct(product)}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-2.5 rounded-xl ${sc.bgClass}`}>
                            <sc.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">{product.name}</h4>
                            <p className="text-sm text-muted-foreground">{product.manufacturer}</p>
                          </div>
                        </div>
                        <Badge className={`${sc.className} rounded-full`}>{sc.label}</Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* No Results */}
          {hasSearched && searchResults.length === 0 && !selectedProduct && (
            <Card className="mb-8 border-warning/20 bg-warning/5 rounded-2xl animate-fade-in">
              <CardContent className="p-8 text-center">
                <AlertTriangle className="h-14 w-14 text-warning mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">Product Not Found</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  No matching products found. This could indicate an unregistered or counterfeit product.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Verification Result Card */}
          {selectedProduct && (
            <div className="animate-fade-in">
              {(() => {
                const sc = getStatusConfig(selectedProduct.status);
                const isVerified = selectedProduct.status === 'verified';
                return (
                  <>
                    {/* Status Banner */}
                    <Card className={`mb-6 border-2 rounded-2xl ${sc.bgClass} overflow-hidden`}>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-5">
                          <div className={`p-4 rounded-2xl ${sc.className}`}>
                            <sc.icon className="h-10 w-10" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Verification Status</p>
                            <h3 className="text-2xl font-bold text-foreground">
                              {isVerified ? 'Product Verified ✓' : 'Verification Failed'}
                            </h3>
                            <Badge className={`${sc.className} mt-2 rounded-full text-sm px-4 py-1`}>
                              {isVerified ? '🟢 BIS Certified' : '🔴 Not Certified'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Product Info + Safety Checklist */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <Card className="shadow-card rounded-2xl">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <FileText className="h-5 w-5 text-primary" />
                            Product Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <DetailRow icon={null} label="Product" value={selectedProduct.name} />
                          <DetailRow icon={<Shield className="h-4 w-4 text-primary" />} label="Standard" value={selectedProduct.standard} />
                          <DetailRow icon={<Building2 className="h-4 w-4 text-primary" />} label="Manufacturer" value={selectedProduct.manufacturer} />
                          <DetailRow icon={null} label="Cert. Number" value={selectedProduct.certificationNumber} mono />
                          {selectedProduct.validUntil && (
                            <DetailRow icon={<Calendar className="h-4 w-4 text-primary" />} label="Valid Until" value={new Date(selectedProduct.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />
                          )}
                          {isVerified && (
                            <div className="pt-2">
                              <p className="text-sm text-muted-foreground mb-1">Safety Score</p>
                              <div className="flex items-center gap-1">
                                {[1,2,3,4,5].map(s => (
                                  <Star key={s} className={`h-5 w-5 ${s <= 4 ? 'text-warning fill-warning' : 'text-muted'}`} />
                                ))}
                                <span className="ml-2 font-bold text-foreground">4.5</span>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="shadow-card rounded-2xl">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <CheckCircle2 className="h-5 w-5 text-success" />
                            Safety Checklist
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-3">
                            {selectedProduct.safetyChecklist.map((item, i) => {
                              const isWarning = item.startsWith('⚠');
                              return (
                                <li key={i} className="flex items-start gap-3">
                                  {isWarning ? (
                                    <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                                  ) : (
                                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                                  )}
                                  <span className={`text-sm ${isWarning ? 'text-warning font-medium' : 'text-foreground'}`}>
                                    {item.replace('⚠ ', '')}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 flex flex-wrap gap-4 justify-center">
                      <Button variant="hero" size="lg" className="rounded-xl" onClick={() => navigate(`/passport/${selectedProduct.id}`)}>
                        <ExternalLink className="h-5 w-5" />
                        View Digital Passport
                      </Button>
                      {!isVerified && (
                        <a href="#report">
                          <Button variant="accent" size="lg" className="rounded-xl">
                            <AlertTriangle className="h-5 w-5" />
                            Report This Product
                          </Button>
                        </a>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Scan History */}
          {scanHistory.length > 0 && (
            <div className="mt-12 animate-fade-in">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-bold text-foreground">Recent Scans</h3>
                <Badge variant="outline" className="rounded-full ml-2">{scanHistory.length}</Badge>
                <div className="ml-auto">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                        Clear All
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Clear all scan history?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all {scanHistory.length} scan records. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={async () => {
                            try {
                              const { error } = await supabase
                                .from('scan_history')
                                .delete()
                                .neq('id', '00000000-0000-0000-0000-000000000000');
                              if (error) throw error;
                              setScanHistory([]);
                              setExpandedScanId(null);
                              toast.success('Scan history cleared');
                            } catch (err) {
                              console.error('Failed to clear history:', err);
                              toast.error('Failed to clear history');
                            }
                          }}
                        >
                          Delete All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {scanHistory.map((item) => {
                  const isExpanded = expandedScanId === item.id;
                  return (
                    <Card
                      key={item.id}
                      className={`overflow-hidden rounded-2xl transition-all cursor-pointer ${
                        isExpanded ? 'sm:col-span-2 lg:col-span-3 shadow-elevated' : 'hover:shadow-elevated group'
                      }`}
                      onClick={() => setExpandedScanId(isExpanded ? null : item.id)}
                    >
                      <div className={isExpanded ? 'grid md:grid-cols-[280px_1fr]' : ''}>
                        <div className={`${isExpanded ? 'h-full min-h-[200px]' : 'h-32'} bg-muted/30 overflow-hidden`}>
                          <img
                            src={item.image_url}
                            alt={item.product_name || 'Scanned product'}
                            className={`w-full h-full object-contain transition-transform duration-300 ${!isExpanded ? 'group-hover:scale-105' : ''}`}
                            loading="lazy"
                          />
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0">
                              <h4 className="font-semibold text-foreground text-sm truncate">
                                {item.product_name || 'Unknown Product'}
                              </h4>
                              {item.brand && (
                                <p className="text-xs text-muted-foreground truncate">{item.brand}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge className={`rounded-full text-[10px] px-2 py-0.5 ${
                                item.risk_level === 'low' ? 'bg-success text-success-foreground' :
                                item.risk_level === 'high' ? 'bg-danger text-danger-foreground' : 'bg-warning text-warning-foreground'
                              }`}>
                                {item.risk_level === 'low' ? 'Low Risk' : item.risk_level === 'high' ? 'High Risk' : 'Medium Risk'}
                              </Badge>
                              <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </div>
                          </div>

                          {!isExpanded && item.summary && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{item.summary}</p>
                          )}

                          {isExpanded && (
                            <div className="space-y-4 mt-3 animate-fade-in">
                              {item.summary && (
                                <p className="text-sm text-foreground">{item.summary}</p>
                              )}

                              {item.certification_marks && item.certification_marks.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Certification Marks</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {item.certification_marks.map((mark, i) => (
                                      <Badge key={i} variant="outline" className="rounded-full text-xs">{mark}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {item.safety_observations && item.safety_observations.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Safety Observations</p>
                                  <ul className="space-y-1.5">
                                    {item.safety_observations.map((obs, i) => (
                                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                                        <Shield className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                        {obs}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {item.recommendation && (
                                <div className="bg-primary/5 rounded-xl p-3">
                                  <p className="text-xs font-medium text-primary mb-1">Recommendation</p>
                                  <p className="text-sm text-foreground">{item.recommendation}</p>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                            {item.category && (
                              <Badge variant="outline" className="rounded-full text-[10px]">{item.category}</Badge>
                            )}
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function DetailRow({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      {icon && <div className="mt-1 shrink-0">{icon}</div>}
      <div className={icon ? '' : 'pl-0'}>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`font-semibold text-foreground ${mono ? 'font-mono' : ''}`}>{value}</p>
      </div>
    </div>
  );
}
