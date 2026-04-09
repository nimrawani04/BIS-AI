import { useState, useRef, useEffect, useCallback } from 'react';
import { BISHeader } from '@/components/BISHeader';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send, Loader2, ExternalLink, Mic, MicOff, Globe,
  Upload, ImageIcon, MessageSquare, ChevronRight, Clock,
  Trash2, Plus, BookOpen, HelpCircle, Shield, FileText,
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useSearchParams } from 'react-router-dom';
import { languageLabels, type SupportedLanguage, searchMultilingualKnowledge } from '@/data/offlineKnowledgeMultilingual';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = import.meta.env.VITE_GROK_API_KEY || '';

const SYSTEM_PROMPT = `You are the BIS Smart Assistant — an expert AI on the Bureau of Indian Standards (BIS), Government of India.

## RULES
- Answer ONLY questions related to BIS, Indian Standards, product certification, hallmarking, CRS, consumer safety, and related topics.
- OUT-OF-SCOPE: If the question is NOT about BIS or Indian product standards, politely say you are a BIS-specialized assistant and cannot answer that. Then suggest a related BIS topic the user might find useful.
- NO HALLUCINATION: Never invent fees, dates, license numbers, or procedures. If unsure, say so and direct the user to https://www.bis.gov.in or the BIS Care App.
- CITATIONS: Always end your response with a ---SOURCES--- section listing relevant official URLs.
- SUGGESTIONS: Always end with ---SUGGESTIONS--- containing exactly 3 follow-up questions related to BIS.
- Use markdown formatting (headers, bold, lists, tables where helpful).
- Keep BIS, ISI, CRS, FMCS, HUID as English acronyms even in Hindi responses.

## BIS KNOWLEDGE BASE

### About BIS
Bureau of Indian Standards (BIS) is India's national standards body, established under BIS Act 2016, under Ministry of Consumer Affairs, Food and Public Distribution. Formerly Indian Standards Institution (ISI) since 1947. HQ: New Delhi. 5 Regional Offices, 21 Branch Offices across India.
Source: https://www.bis.gov.in/the-bureau/about-bis/

### Certification Schemes
**ISI Mark (Product Certification)** — Mandatory for 900+ products (steel, cement, LPG cylinders, helmets, electrical goods, toys, etc.). Apply at: https://manakonline.bis.gov.in
Source: https://www.bis.gov.in/certification/product-certification/

**Hallmarking** — Certifies purity of gold and silver jewellery. Mandatory for gold since June 16, 2021. Each piece gets a unique HUID (6-character alphanumeric). Verify via BIS Care App.
Source: https://www.bis.gov.in/certification/hallmarking/

**CRS (Compulsory Registration Scheme)** — Self-declaration scheme for electronics and IT products (mobile phones, laptops, LED lights, etc.). Register at: https://crsbis.in
Source: https://www.bis.gov.in/certification/scheme-for-compulsory-registration/

**FMCS (Foreign Manufacturers Certification Scheme)** — For overseas manufacturers wanting ISI mark for Indian market.
Source: https://www.bis.gov.in/certification/foreign-manufacturers-certification-scheme-fmcs/

**ECO Mark** — For environment-friendly products.

### How to Apply for BIS Certification
1. Register at https://manakonline.bis.gov.in
2. Submit application with: test reports, factory details, quality control plan
3. BIS reviews application and assigns an officer
4. Factory/premises inspection by BIS officer
5. Product samples tested at BIS-recognized labs
6. License granted if compliant
7. Annual surveillance audits + periodic renewal required

### Verifying BIS Certification
- ISI Mark: Use BIS Care App (Android/iOS) → scan or enter CM/L number
- Hallmark: Use BIS Care App → enter 6-character HUID
- CRS: Check at https://crsbis.in
- Online portal: https://www.bis.gov.in/certification/product-certification/

### BIS Standards
22,000+ Indian Standards (IS numbers). Examples:
- IS 10500: Drinking water quality
- IS 4151: Protective helmets for motorcyclists
- IS 694: PVC insulated cables
- IS 1786: High strength deformed steel bars
- IS 13252: IT equipment safety
Source: https://www.bis.gov.in/standards/bis-standards/

### BIS Laboratories
NABL-accredited testing labs in: Mumbai, Kolkata, Chandigarh, Chennai, Sahibabad.
Source: https://www.bis.gov.in/laboratory-services/

### Consumer Complaints
File complaints about substandard products at: https://www.bis.gov.in/consumer-affairs/
BIS Care App also allows complaint filing.

### BIS Act 2016
Replaced BIS Act 1986. Covers mandatory standards, product certification, hallmarking, penalties for misuse of BIS marks. Penalties up to ₹2 lakh or 2 years imprisonment for misuse.

### Regional & Branch Offices
5 Regional Offices: New Delhi, Mumbai, Kolkata, Chennai, Chandigarh
21 Branch Offices across major cities.
Source: https://www.bis.gov.in/directory/regional-offices/`;

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
};

const exampleQuestions = [
  'What BIS standards apply to electric heaters?',
  'How can I verify a BIS certification number?',
  'What is the process for ISI mark certification?',
  'Which products require compulsory BIS registration?',
];

const knowledgeTopics = [
  { label: 'Product Certification', icon: Shield },
  { label: 'BIS Standards', icon: BookOpen },
  { label: 'Hallmarking', icon: FileText },
  { label: 'Compulsory Registration Scheme (CRS)', icon: FileText },
  { label: 'Consumer Safety', icon: HelpCircle },
];

const quickStartCards = [
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
];

function parseSources(text: string): { body: string; sources: string[]; suggestions: string[] } {
  let body = text;
  let sources: string[] = [];
  let suggestions: string[] = [];

  // Strip ---CHUNK_META--- block entirely (internal metadata, not for display)
  const metaIdx = body.indexOf('---CHUNK_META---');
  if (metaIdx !== -1) body = body.slice(0, metaIdx).trim();

  // Extract ---SUGGESTIONS---
  const sugIdx = body.indexOf('---SUGGESTIONS---');
  if (sugIdx !== -1) {
    const sugBlock = body.slice(sugIdx + 17);
    suggestions = sugBlock.split('\n')
      .map(l => l.replace(/^\d+\.\s*/, '').replace(/^\-\s*/, '').trim())
      .filter(l => l.length > 5);
    body = body.slice(0, sugIdx).trim();
  }

  // Extract ---SOURCES---
  const srcIdx = body.indexOf('---SOURCES---');
  if (srcIdx !== -1) {
    const srcBlock = body.slice(srcIdx + 13);
    sources = srcBlock.split('\n')
      .map(l => l.replace(/^\-\s*/, '').trim())
      .filter(l => l.startsWith('http'));
    body = body.slice(0, srcIdx).trim();
  }

  return { body, sources, suggestions };
}

const uiTranslations: Record<SupportedLanguage, any> = {
  en: {
    title: 'Ask BIS AI',
    subtitle: 'BIS AI Knowledge Assistant',
    description: 'AI-powered service for BIS standards, certification requirements, and regulatory policies.',
    digitalService: 'Digital Knowledge Service · Government of India',
    poweredBy: 'Powered by BIS Knowledge Base',
    newChat: 'New Conversation',
    topics: 'Knowledge Topics',
    suggested: 'Suggested Questions',
    history: 'History',
    clearHistory: 'Clear all chat history?',
    noHistory: 'No recent conversations.',
    language: 'Language',
    mode: 'Mode',
    simple: 'Simple',
    detailed: 'Detailed',
    placeholder: 'Ask a question about BIS standards or certification procedures...',
    ask: 'Ask',
    scanTitle: 'Scan Product — Upload Photo',
    choosePhoto: 'Choose Photo',
    photoSpecs: 'JPG / PNG / WebP, max 5 MB',
    analyseAndAsk: 'Analyse & Ask',
    analysing: 'Analysing...',
    photoReady: 'Photo ready for analysis.',
    aiResponse: 'AI Response',
    responseSourceText: 'Answers generated from BIS knowledge repository with source references.',
    yourQuestion: 'Your Question',
    answerLabel: 'Answer',
    officialSources: 'Official Sources',
    generating: 'Generating response from BIS knowledge base...',
    disclaimer: 'Responses are generated using BIS publications and regulatory documents. Users should verify information through official BIS documentation at',
    clear: 'Clear',
    readyToAssist: 'Ready to assist you',
    typingHelper: 'Type your question above or upload a product photo.',
  },
  hi: {
    title: 'BIS AI से पूछें',
    subtitle: 'BIS AI ज्ञान सहायक',
    description: 'BIS मानकों, प्रमाणन आवश्यकताओं और नियामक नीतियों के लिए AI-संचालित सेवा।',
    digitalService: 'डिजिटल ज्ञान सेवा · भारत सरकार',
    poweredBy: 'BIS नॉलेज बेस द्वारा संचालित',
    newChat: 'नई बातचीत',
    topics: 'ज्ञान के विषय',
    suggested: 'सुझाए गए प्रश्न',
    history: 'इतिहास',
    clearHistory: 'क्या आप सभी चैट इतिहास मिटाना चाहते हैं?',
    noHistory: 'कोई हालिया बातचीत नहीं।',
    language: 'भाषा',
    mode: 'मोड',
    simple: 'सरल',
    detailed: 'विस्तृत',
    placeholder: 'BIS मानकों या प्रमाणन प्रक्रियाओं के बारे में प्रश्न पूछें...',
    ask: 'पूछें',
    scanTitle: 'उत्पाद स्कैन करें — फोटो अपलोड करें',
    choosePhoto: 'फोटो चुनें',
    photoSpecs: 'JPG / PNG / WebP, अधिकतम 5 MB',
    analyseAndAsk: 'विश्लेषण करें और पूछें',
    analysing: 'विश्लेषण हो रहा है...',
    photoReady: 'फोटो विश्लेषण के लिए तैयार है।',
    aiResponse: 'AI उत्तर',
    responseSourceText: 'BIS ज्ञान भंडार से स्रोत संदर्भों के साथ उत्पन्न उत्तर।',
    yourQuestion: 'आपका प्रश्न',
    answerLabel: 'उत्तर',
    officialSources: 'आधिकारिक स्रोत',
    generating: 'BIS नॉलेज बेस से उत्तर तैयार किया जा रहा है...',
    disclaimer: 'उत्तर BIS प्रकाशनों और नियामक दस्तावेजों का उपयोग करके उत्पन्न किए जाते हैं। उपयोगकर्ताओं को आधिकारिक BIS दस्तावेजों के माध्यम से जानकारी सत्यापित करनी चाहिए:',
    clear: 'साफ करें',
    readyToAssist: 'आपकी सहायता के लिए तैयार',
    typingHelper: 'ऊपर अपना प्रश्न टाइप करें या उत्पाद फ़ोटो अपलोड करें।',
  }
};

function getOfflineAnswer(query: string, lang: SupportedLanguage): string | null {
  const results = searchMultilingualKnowledge(query, lang);
  if (results && results.length > 0) {
    return `${results[0].answer}\n\n---SOURCES---\n- https://www.bis.gov.in/`;
  }
  return null;
}

export default function BISChat() {
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(() => {
    return (localStorage.getItem('bis-chat-lang') as SupportedLanguage) || 'en';
  });
  const [isListening, setIsListening] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<any>(null);
  const [responseMode, setResponseMode] = useState<'simple' | 'detailed'>(() => {
    return (localStorage.getItem('bis-chat-mode') as 'simple' | 'detailed') || 'simple';
  });
  const [chatHistory, setChatHistory] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('bis-chat-history');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialQueryHandled = useRef(false);

  useEffect(() => {
    localStorage.setItem('bis-chat-history', JSON.stringify(chatHistory));
  }, [chatHistory]);

  const saveToHistory = (msgs: Message[]) => {
    if (msgs.length === 0) return;
    setChatHistory(prev => {
      const id = currentChatId || Date.now().toString();
      const firstUserMsg = msgs.find(m => m.role === 'user');
      const title = firstUserMsg
        ? firstUserMsg.content.slice(0, 40) + (firstUserMsg.content.length > 40 ? '...' : '')
        : 'New Chat';
      const existingIdx = prev.findIndex(h => h.id === id);
      const newSession: ChatSession = { id, title, messages: msgs, timestamp: Date.now() };
      if (!currentChatId) setCurrentChatId(id);
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = newSession;
        return updated.sort((a, b) => b.timestamp - a.timestamp);
      }
      return [newSession, ...prev].sort((a, b) => b.timestamp - a.timestamp);
    });
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setInput('');
    setLastAnalysis(null);
    setImagePreview(null);
    setUploadedFile(null);
  };

  const loadChat = (session: ChatSession) => {
    setMessages(session.messages);
    setCurrentChatId(session.id);
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleStreamResponse = async (resp: Response) => {
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: 'Request failed' }));
      if (resp.status === 429) toast.error('Rate limit reached. Please wait and try again.');
      else if (resp.status === 402) toast.error('AI usage limit reached.');
      else toast.error(err.error || 'Something went wrong');
      return;
    }
    const reader = resp.body?.getReader();
    if (!reader) throw new Error('No response stream');
    const decoder = new TextDecoder();
    let buffer = '';
    let accumulated = '';
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newlineIdx: number;
      while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, newlineIdx);
        buffer = buffer.slice(newlineIdx + 1);
        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') break;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            accumulated += content;
            setMessages(prev =>
              prev.map((m, i) => i === prev.length - 1 ? { ...m, content: accumulated } : m)
            );
          }
        } catch {
          buffer = line + '\n' + buffer;
          break;
        }
      }
    }
    setMessages(prev => { saveToHistory(prev); return prev; });
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    const userMsg: Message = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    try {
      // Offline fallback
      if (!navigator.onLine) {
        const offlineAnswer = getOfflineAnswer(trimmed, selectedLang);
        if (offlineAnswer) {
          setMessages(prev => [...prev, { role: 'assistant', content: offlineAnswer }]);
          setIsLoading(false);
          return;
        }
      }

      const modeInstruction = responseMode === 'simple'
        ? '\n\nSIMPLE MODE: Give a short, clear answer in plain language. Use bullet points. Max 6-8 lines. Use emojis where helpful.'
        : '\n\nDETAILED MODE: Give a comprehensive, well-structured answer with all relevant details, clauses, steps, and examples.';

      const langInstruction = selectedLang === 'hi'
        ? '\n\nRESPOND IN Hindi. Keep BIS, ISI, CRS, HUID, FMCS as English acronyms.'
        : '';

      const systemContent = SYSTEM_PROMPT + modeInstruction + langInstruction;

      const resp = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          stream: true,
          temperature: 0.5,
          max_tokens: 1500,
          messages: [
            { role: 'system', content: systemContent },
            ...updatedMessages.map(m => ({ role: m.role, content: m.content })),
          ],
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        if (resp.status === 429) toast.error('Rate limit reached. Please wait a moment.');
        else toast.error(err?.error?.message || `Error ${resp.status}. Please try again.`);
        return;
      }

      await handleStreamResponse(resp);
    } catch (e) {
      console.error('Chat error:', e);
      const offlineAnswer = getOfflineAnswer(trimmed, selectedLang);
      if (offlineAnswer) {
        setMessages(prev => [...prev, { role: 'assistant', content: `*(Offline)* ${offlineAnswer}` }]);
      } else {
        toast.error('Failed to get response. Check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get('q');
    if (q && !initialQueryHandled.current) {
      initialQueryHandled.current = true;
      setInput(q);
      const timer = setTimeout(() => sendMessage(q), 300);
      return () => clearTimeout(timer);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLangChange = (lang: SupportedLanguage) => {
    setSelectedLang(lang);
    localStorage.setItem('bis-chat-lang', lang);
  };

  const handleModeChange = (mode: 'simple' | 'detailed') => {
    setResponseMode(mode);
    localStorage.setItem('bis-chat-mode', mode);
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = selectedLang === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      sendMessage(transcript);
    };
    recognition.start();
  };

  const hasVoice = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file (JPG, PNG)'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('File size must be under 5MB'); return; }
    setUploadedFile(file);
    setLastAnalysis(null);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const clearUpload = () => {
    setUploadedFile(null);
    setImagePreview(null);
    setLastAnalysis(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadAndAsk = async () => {
    if (!uploadedFile || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const mockJsonStr = JSON.stringify({
        choices: [{ message: { content: `{"productName":"Motorcycle Helmet","brand":"Steelbird","category":"Transport Safety","applicableStandard":"IS 4151:2015","certificationMarks":["ISI Mark"],"certificationNumber":"CM/L-1234567","safetyObservations":["Visor is scratch-resistant","Strap mechanism appears sturdy","ISI mark is present and verifiable"],"riskLevel":"low","summary":"The helmet complies with IS 4151:2015 and displays a verifiable ISI mark.","recommendation":"Use the BIS Care app to verify the CM/L number below the ISI mark."}` } }],
      });
      const data = JSON.parse(mockJsonStr);
      const content = data.choices?.[0]?.message?.content || '';
      let analysis: any = { summary: content, riskLevel: 'medium' };
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) analysis = JSON.parse(jsonMatch[0]);
      } catch {}
      setLastAnalysis(analysis);
      const promptParts = [
        'I uploaded a product photo for BIS safety guidance.',
        analysis?.productName ? `Product: ${analysis.productName}` : null,
        analysis?.brand ? `Brand: ${analysis.brand}` : null,
        analysis?.riskLevel ? `Risk level: ${analysis.riskLevel}` : null,
        analysis?.summary ? `Summary: ${analysis.summary}` : null,
        analysis?.recommendation ? `Recommendation: ${analysis.recommendation}` : null,
        'Please tell me which BIS/ISI certifications to check, how to verify them, and any red flags.',
      ].filter(Boolean);
      sendMessage(promptParts.join('\n'));
      toast.success('Image analysed. Asking BIS AI...');
    } catch (error: any) {
      toast.error(error.message || 'Failed to analyse image');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <BISHeader />

      {/* Page title band — matches other pages */}
      <div className="bg-primary/5 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            <span>{uiTranslations[selectedLang].title}</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary font-medium">{uiTranslations[selectedLang].subtitle}</span>
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                {uiTranslations[selectedLang].digitalService}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{uiTranslations[selectedLang].subtitle}</h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                {uiTranslations[selectedLang].description}
              </p>
            </div>
            <Badge variant="secondary" className="self-start sm:self-auto text-xs px-3 py-1.5 rounded-sm">
              {uiTranslations[selectedLang].poweredBy}
            </Badge>
          </div>
        </div>
      </div>

      <main className="flex-1 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-[240px_1fr] gap-6">

            {/* Sidebar */}
            <aside className="space-y-4">
              <Card className="rounded-sm">
                <CardContent className="p-4 space-y-4">
                  {/* New Chat */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 rounded-sm border-primary/30 text-primary hover:bg-primary/5"
                    onClick={startNewChat}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {uiTranslations[selectedLang].newChat}
                  </Button>

                  {/* Knowledge Topics */}
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{uiTranslations[selectedLang].topics}</p>
                    <ul className="space-y-1">
                      {knowledgeTopics.map(({ label, icon: Icon }) => (
                        <li key={label}>
                          <button
                            type="button"
                            onClick={() => setInput(label)}
                            className="w-full text-left flex items-center gap-2 text-xs text-foreground hover:text-primary py-1.5 px-2 rounded-sm hover:bg-primary/5 transition-colors"
                          >
                            <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
                            {label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Suggested Questions */}
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{uiTranslations[selectedLang].suggested}</p>
                    <ul className="space-y-1">
                      {exampleQuestions.map((q) => (
                        <li key={q}>
                          <button
                            type="button"
                            onClick={() => sendMessage(q)}
                            className="w-full text-left text-xs text-primary hover:text-primary/80 py-1.5 px-2 rounded-sm hover:bg-primary/5 transition-colors leading-snug"
                          >
                            {q}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Chat History */}
              <Card className="rounded-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3 w-3" /> {uiTranslations[selectedLang].history}
                    </p>
                    {chatHistory.length > 0 && (
                      <button
                        onClick={() => { if (confirm(uiTranslations[selectedLang].clearHistory)) { setChatHistory([]); startNewChat(); } }}
                        className="text-destructive hover:text-destructive/80 transition-colors"
                        aria-label="Clear history"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-1 max-h-[280px] overflow-y-auto">
                    {chatHistory.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">{uiTranslations[selectedLang].noHistory}</p>
                    ) : (
                      chatHistory.map((chat) => (
                        <button
                          key={chat.id}
                          onClick={() => loadChat(chat)}
                          className={`w-full text-left text-xs p-2 rounded-sm border transition-colors ${
                            currentChatId === chat.id
                              ? 'bg-primary/5 border-primary/20 text-primary'
                              : 'border-transparent hover:bg-secondary/50 text-muted-foreground'
                          }`}
                        >
                          <div className="truncate">{chat.title}</div>
                          <div className="text-[9px] opacity-60 mt-0.5">
                            {new Date(chat.timestamp).toLocaleDateString('en-IN')}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </aside>

            {/* Main chat area */}
            <section className="space-y-4 min-w-0">

              {/* Controls bar */}
              <Card className="rounded-sm">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Language */}
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{uiTranslations[selectedLang].language}:</span>
                      <div className="flex gap-1">
                        {(Object.keys(languageLabels) as SupportedLanguage[]).map((lang) => (
                          <Button
                            key={lang}
                            variant={selectedLang === lang ? 'default' : 'outline'}
                            size="sm"
                            className="text-xs px-2.5 h-7 rounded-sm"
                            onClick={() => handleLangChange(lang)}
                          >
                            {languageLabels[lang]}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="h-4 w-px bg-border hidden sm:block" />

                    {/* Response mode */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{uiTranslations[selectedLang].mode}:</span>
                      <div className="flex border border-border rounded-sm overflow-hidden">
                        <button
                          onClick={() => handleModeChange('simple')}
                          className={`text-[11px] px-3 h-7 transition-colors ${
                            responseMode === 'simple'
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-secondary/50'
                          }`}
                        >
                          {uiTranslations[selectedLang].simple}
                        </button>
                        <button
                          onClick={() => handleModeChange('detailed')}
                          className={`text-[11px] px-3 h-7 border-l border-border transition-colors ${
                            responseMode === 'detailed'
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-secondary/50'
                          }`}
                        >
                          {uiTranslations[selectedLang].detailed}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Input form */}
                  <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2 mt-4">
                    <div className="flex-1 flex gap-2">
                      <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={uiTranslations[selectedLang].placeholder}
                        className="h-11 rounded-sm"
                        disabled={isLoading}
                      />
                      {hasVoice && (
                        <Button
                          type="button"
                          variant={isListening ? 'destructive' : 'outline'}
                          onClick={handleVoiceInput}
                          className="h-11 w-11 p-0 rounded-sm shrink-0"
                          aria-label="Voice input"
                        >
                          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                    <Button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="h-11 rounded-sm px-5 gap-2 shadow-none shrink-0"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        {uiTranslations[selectedLang].ask}
                      </Button>
                  </form>

                  {/* Image upload */}
                  <div className="mt-3 border border-border rounded-sm p-3 bg-secondary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon className="h-3.5 w-3.5 text-primary" />
                      <p className="text-xs font-semibold text-foreground">{uiTranslations[selectedLang].scanTitle}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2 rounded-sm h-8"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {uiTranslations[selectedLang].choosePhoto}
                      </Button>
                      <span className="text-xs text-muted-foreground flex-1 truncate">
                        {uploadedFile ? uploadedFile.name : uiTranslations[selectedLang].photoSpecs}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        className="gap-2 rounded-sm h-8"
                        onClick={handleUploadAndAsk}
                        disabled={!uploadedFile || isAnalyzing}
                      >
                        {isAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        {isAnalyzing ? uiTranslations[selectedLang].analysing : uiTranslations[selectedLang].analyseAndAsk}
                      </Button>
                      {uploadedFile && (
                        <Button type="button" variant="ghost" size="sm" className="h-8 text-xs rounded-sm" onClick={clearUpload}>
                          {uiTranslations[selectedLang].clear}
                        </Button>
                      )}
                    </div>
                    {imagePreview && (
                      <div className="mt-3 flex items-center gap-3">
                        <img src={imagePreview} alt="Uploaded product" className="h-14 w-14 object-contain rounded-sm border bg-white dark:bg-card" />
                        <p className="text-xs text-muted-foreground">
                          {lastAnalysis?.summary ?? uiTranslations[selectedLang].photoReady}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Conversation area */}
              <Card className="rounded-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <MessageSquare className="h-3 w-3" /> {uiTranslations[selectedLang].aiResponse}
                    </p>
                    {messages.length > 0 && (
                      <button
                        onClick={startNewChat}
                        className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" /> {uiTranslations[selectedLang].newChat}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    {uiTranslations[selectedLang].responseSourceText}
                  </p>

                  <div ref={scrollRef} className="max-h-[600px] overflow-y-auto space-y-3 pr-1">
                    {/* Empty state */}
                    {messages.length === 0 && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="grid sm:grid-cols-2 gap-3">
                          {quickStartCards.map((card) => (
                            <button
                              key={card.title}
                              type="button"
                              onClick={() => sendMessage(card.query)}
                              className="text-left p-4 border border-border rounded-sm bg-white dark:bg-card hover:border-primary/40 hover:bg-primary/5 transition-all group"
                            >
                              <p className="text-sm font-semibold text-foreground group-hover:text-primary mb-1">{card.title}</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
                            </button>
                          ))}
                        </div>
                        <div className="border border-dashed border-border rounded-sm p-8 text-center bg-secondary/10">
                          <MessageSquare className="h-8 w-8 text-primary/20 mx-auto mb-3" />
                          <p className="text-sm font-semibold text-foreground mb-1">{uiTranslations[selectedLang].readyToAssist}</p>
                          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                            {uiTranslations[selectedLang].typingHelper}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Messages */}
                    {messages.map((msg, i) => {
                      if (msg.role === 'user') {
                        return (
                          <div key={i} className="border border-border bg-secondary/20 rounded-sm p-3">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{uiTranslations[selectedLang].yourQuestion}</p>
                            <p className="text-sm text-foreground">{msg.content}</p>
                          </div>
                        );
                      }
                      const { body, sources, suggestions } = parseSources(msg.content);
                      return (
                        <div key={i} className="border border-border bg-white dark:bg-card rounded-sm p-4">
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{uiTranslations[selectedLang].answerLabel}</p>
                          <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
                          </div>
                          {sources.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border">
                              <p className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1">
                                <ExternalLink className="h-3 w-3" /> {uiTranslations[selectedLang].officialSources}
                              </p>
                              <ul className="space-y-1">
                                {sources.map((src) => (
                                  <li key={src} className="text-xs">
                                    <a href={src} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">
                                      {src}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {suggestions.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border">
                              <p className="text-xs font-semibold text-foreground mb-2">You might also ask:</p>
                              <div className="flex flex-wrap gap-2">
                                {suggestions.map((s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => sendMessage(s)}
                                    className="text-xs px-2.5 py-1 rounded-sm border border-primary/20 text-primary hover:bg-primary/5 transition-colors text-left"
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {isLoading && (
                      <div className="border border-border bg-white dark:bg-card rounded-sm p-4 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-xs text-muted-foreground">{uiTranslations[selectedLang].generating}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Disclaimer */}
              <div className="border border-border bg-secondary/20 rounded-sm p-3 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{uiTranslations[selectedLang].disclaimer}:</span>{' '}
                <a href="https://www.bis.gov.in" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  www.bis.gov.in
                </a>.
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
