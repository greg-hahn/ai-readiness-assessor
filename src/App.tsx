import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardCheck, 
  ChevronRight, 
  ChevronLeft, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  BarChart3,
  ShieldCheck,
  Zap,
  Download,
  Loader2,
  Coffee
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { SectionId, AssessmentState } from './types';
import { SECTIONS } from './constants';

export default function App() {
  const [state, setState] = useState<AssessmentState>({
    problemDescription: '',
    answers: {},
    currentSection: 'intro',
  });

  const [showInfo, setShowInfo] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const sectionHeaderRef = useRef<HTMLHeadingElement>(null);
  const pdfTemplateRef = useRef<HTMLDivElement>(null);

  // Focus management: move focus to the section header when section changes
  useEffect(() => {
    if (sectionHeaderRef.current) {
      sectionHeaderRef.current.focus();
    }
  }, [state.currentSection]);

  const handleAnswer = (questionId: number, value: number | boolean) => {
    setState(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: value }
    }));
  };

  const currentSectionData = SECTIONS.find(s => s.id === state.currentSection);
  const isSectionComplete = useMemo(() => {
    if (state.currentSection === 'intro') return state.problemDescription.length > 5;
    if (!currentSectionData) return true;
    return currentSectionData.questions.every(q => state.answers[q.id] !== undefined);
  }, [state.currentSection, state.answers, state.problemDescription, currentSectionData]);

  const nextSection = () => {
    const order: SectionId[] = ['intro', 'A', 'B', 'C', 'D', 'E', 'results'];
    const currentIndex = order.indexOf(state.currentSection);
    if (currentIndex < order.length - 1) {
      setState(prev => ({ ...prev, currentSection: order[currentIndex + 1] }));
      window.scrollTo(0, 0);
    }
  };

  const prevSection = () => {
    const order: SectionId[] = ['intro', 'A', 'B', 'C', 'D', 'E', 'results'];
    const currentIndex = order.indexOf(state.currentSection);
    if (currentIndex > 0) {
      setState(prev => ({ ...prev, currentSection: order[currentIndex - 1] }));
      window.scrollTo(0, 0);
    }
  };

  const calculateScores = () => {
    const subA = SECTIONS[0].questions.reduce((acc, q) => acc + (Number(state.answers[q.id]) || 0), 0);
    const subB = SECTIONS[1].questions.reduce((acc, q) => acc + (Number(state.answers[q.id]) || 0), 0);
    const subC = SECTIONS[2].questions.reduce((acc, q) => acc + (Number(state.answers[q.id]) || 0), 0);
    const subD = SECTIONS[3].questions.reduce((acc, q) => acc + (Number(state.answers[q.id]) || 0), 0);
    const subCD = subC + subD;

    const complianceFlags = {
      pia: state.answers[16] === true,
      aia: state.answers[17] === true,
      ethical: state.answers[18] === true,
    };

    return { subA, subB, subCD, complianceFlags };
  };

  const getRecommendation = () => {
    const { subA, subB, subCD, complianceFlags } = calculateScores();
    const hasCompliance = complianceFlags.pia || complianceFlags.aia || complianceFlags.ethical;

    const highA = subA >= 4;
    const modA = subA >= 2;
    const highB = subB >= 14;
    const modB = subB >= 8;
    const highCD = subCD >= 5;
    const medCD = subCD >= 3;

    if (highA && highB && highCD && !hasCompliance) {
      return {
        title: "Prime candidate: Proceed subject to required processes.",
        color: "bg-green-50 border-green-200 text-green-800",
        pdfStyles: "background-color: #F0FDF4; border-color: #BBF7D0; color: #166534;",
        icon: <CheckCircle2 className="w-6 h-6 text-green-600" aria-hidden="true" />,
        desc: "This is an excellent project to proceed with. Review the GC AI register and consult with colleagues to determine if there are other similar AI projects you could re-use or adapt."
      };
    }

    if (highA && highB && (!highCD || hasCompliance)) {
      return {
        title: "High potential, but action required: Pause and resolve foundational work/compliance.",
        color: "bg-amber-50 border-amber-200 text-amber-800",
        pdfStyles: "background-color: #FFFBEB; border-color: #FDE68A; color: #92400E;",
        icon: <AlertTriangle className="w-6 h-6 text-amber-600" aria-hidden="true" />,
        desc: "This is a great idea, but foundational work such as identifying and correcting data inaccuracies or addressing compliance requirements is required before proceeding."
      };
    }

    if (highA && !highB && medCD) {
      return {
        title: "High potential but lower priority: Flag as a developmental opportunity.",
        color: "bg-blue-50 border-blue-200 text-blue-800",
        pdfStyles: "background-color: #EFF6FF; border-color: #BFDBFE; color: #1E40AF;",
        icon: <Zap className="w-6 h-6 text-blue-600" aria-hidden="true" />,
        desc: "The project has potential but will not solve a high-priority problem. Use this as a low-risk way to build capacity if funding allows."
      };
    }

    if (modA || modB) {
      return {
        title: "Moderate candidate: Pause. Consider a small-scale pilot.",
        color: "bg-orange-50 border-orange-200 text-orange-800",
        pdfStyles: "background-color: #FFF7ED; border-color: #FED7AA; color: #9A3412;",
        icon: <BarChart3 className="w-6 h-6 text-orange-600" aria-hidden="true" />,
        desc: "This project has potential but requires a stronger business case. Consider a small-scale pilot to better evaluate the benefits."
      };
    }

    return {
      title: "Low priority; re-evaluate: Pivot to simpler, non-AI process improvements.",
      color: "bg-slate-50 border-slate-200 text-slate-800",
      pdfStyles: "background-color: #F8FAFC; border-color: #E2E8F0; color: #1E293B;",
      icon: <XCircle className="w-6 h-6 text-slate-600" aria-hidden="true" />,
      desc: "The task may not be right for AI, or the problem may not be big enough to solve. Pivot and consider simpler process improvements first."
    };
  };

  const exportToPDF = async () => {
    console.log('Exporting to PDF...');
    if (!pdfTemplateRef.current) {
      console.error('PDF Template ref not found');
      alert('Error: PDF template not found.');
      return;
    }
    setIsExporting(true);

    try {
      console.log('Capturing canvas...');
      // Small delay to ensure any dynamic content is rendered
      await new Promise(resolve => setTimeout(resolve, 500));

      const template = pdfTemplateRef.current;
      const width = template.offsetWidth || 794;
      const height = template.offsetHeight;
      console.log('Template dimensions:', width, 'x', height);

      if (height === 0) {
        console.warn('Template height is 0, this might result in a blank PDF.');
      }

      const canvas = await html2canvas(template, {
        scale: 2,
        useCORS: true,
        logging: true,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
        onclone: (clonedDoc) => {
          const container = clonedDoc.getElementById('pdf-export-container');
          if (container) {
            container.style.opacity = '1';
            container.style.position = 'absolute';
            container.style.left = '0';
            container.style.top = '0';
            container.style.visibility = 'visible';
            container.style.display = 'block';
            container.style.zIndex = '9999';
          }
        }
      });
      
      console.log('Canvas captured:', canvas.width, 'x', canvas.height);
      console.log('Generating PDF...');
      const imgData = canvas.toDataURL('image/png');
      console.log('Image data length:', imgData.length);
      
      if (imgData.length < 1000) {
        console.error('Image data is suspiciously short, PDF might be blank.');
      }
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;
      
      pdf.addImage(imgData, 'PNG', 0, 0, finalWidth, finalHeight);
      console.log('Saving PDF...');
      pdf.save(`AI-Readiness-Assessment-${new Date().toISOString().split('T')[0]}.pdf`);
      console.log('PDF saved successfully!');
    } catch (error) {
      console.error('PDF Export failed:', error);
      alert('Failed to generate PDF. Error: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10" role="banner">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg" aria-hidden="true">
              <ClipboardCheck className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">AI Readiness Assessor</h1>
          </div>
          {state.currentSection !== 'intro' && state.currentSection !== 'results' && (
            <div 
              className="text-xs font-medium text-slate-400 uppercase tracking-widest"
              aria-label={`Progress: Section ${state.currentSection} of E`}
            >
              Section {state.currentSection} of E
            </div>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12" role="main">
        <AnimatePresence mode="wait">
          {state.currentSection === 'intro' && (
            <motion.div 
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <h2 
                  ref={sectionHeaderRef}
                  tabIndex={-1}
                  className="text-4xl font-extrabold tracking-tight text-slate-900 focus:outline-none"
                >
                  Let's evaluate your <span className="text-blue-600">AI Opportunity</span>.
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                  This scorecard helps you determine if a specific friction point is a strong candidate for an AI-based solution.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                <div className="block space-y-2">
                  <label htmlFor="problem-description" className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                    Problem Description
                  </label>
                  <textarea 
                    id="problem-description"
                    value={state.problemDescription}
                    onChange={(e) => setState(prev => ({ ...prev, problemDescription: e.target.value }))}
                    placeholder="Briefly describe the single, specific problem or friction point you want to solve..."
                    className="w-full h-32 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-lg"
                    aria-required="true"
                  />
                </div>
                <div className="flex justify-end">
                  <button 
                    disabled={!isSectionComplete}
                    onClick={nextSection}
                    aria-label="Start the assessment"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-200"
                  >
                    Start Assessment <ChevronRight className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {currentSectionData && (
            <motion.div 
              key={state.currentSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h2 
                  ref={sectionHeaderRef}
                  tabIndex={-1}
                  className="text-3xl font-bold text-slate-900 focus:outline-none"
                >
                  {currentSectionData.title}
                </h2>
                {currentSectionData.subtitle && (
                  <p className="text-blue-600 font-medium italic">{currentSectionData.subtitle}</p>
                )}
              </div>

              <div className="space-y-4" role="group" aria-labelledby="section-title">
                {currentSectionData.questions.map((q) => (
                  <div 
                    key={q.id} 
                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
                    role="region"
                    aria-labelledby={`q-${q.id}-text`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <h3 id={`q-${q.id}-text`} className="text-lg font-semibold text-slate-800 leading-tight">
                        {q.text}
                      </h3>
                      {q.description && (
                        <button 
                          onClick={() => setShowInfo(showInfo === q.id ? null : q.id)}
                          className="text-slate-400 hover:text-blue-500 transition-colors"
                          aria-label={`More information about: ${q.text}`}
                          aria-expanded={showInfo === q.id}
                          aria-controls={`info-${q.id}`}
                        >
                          <Info className="w-5 h-5" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                    
                    {showInfo === q.id && q.description && (
                      <motion.div 
                        id={`info-${q.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="bg-blue-50 p-4 rounded-xl text-sm text-blue-700 leading-relaxed border border-blue-100"
                        role="note"
                      >
                        {q.description}
                      </motion.div>
                    )}

                    <div className="flex flex-wrap gap-3" role="radiogroup" aria-labelledby={`q-${q.id}-text`}>
                      {q.type === 'binary' || q.type === 'compliance' ? (
                        <>
                          <button 
                            onClick={() => handleAnswer(q.id, q.type === 'binary' ? 1 : true)}
                            aria-pressed={state.answers[q.id] === (q.type === 'binary' ? 1 : true)}
                            className={`px-6 py-3 rounded-xl font-bold border-2 transition-all ${
                              state.answers[q.id] === (q.type === 'binary' ? 1 : true)
                              ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                              : 'border-slate-100 hover:border-blue-200 text-slate-600'
                            }`}
                          >
                            Yes
                          </button>
                          <button 
                            onClick={() => handleAnswer(q.id, q.type === 'binary' ? 0 : false)}
                            aria-pressed={state.answers[q.id] === (q.type === 'binary' ? 0 : false)}
                            className={`px-6 py-3 rounded-xl font-bold border-2 transition-all ${
                              state.answers[q.id] === (q.type === 'binary' ? 0 : false)
                              ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                              : 'border-slate-100 hover:border-blue-200 text-slate-600'
                            }`}
                          >
                            No
                          </button>
                        </>
                      ) : (
                        <div className="flex gap-2 w-full">
                          {[1, 2, 3, 4, 5].map((val) => (
                            <button 
                              key={val}
                              onClick={() => handleAnswer(q.id, val)}
                              aria-label={`Rate ${val} out of 5`}
                              aria-pressed={state.answers[q.id] === val}
                              className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${
                                state.answers[q.id] === val
                                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                : 'border-slate-100 hover:border-blue-200 text-slate-600'
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-8 border-t border-slate-200">
                <button 
                  onClick={prevSection}
                  aria-label="Go back to previous section"
                  className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold px-6 py-3 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" aria-hidden="true" /> Back
                </button>
                <button 
                  disabled={!isSectionComplete}
                  onClick={nextSection}
                  aria-label={state.currentSection === 'E' ? 'View assessment results' : 'Go to next section'}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-200"
                >
                  {state.currentSection === 'E' ? 'View Results' : 'Next Section'} <ChevronRight className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </motion.div>
          )}

          {state.currentSection === 'results' && (
            <motion.div 
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                <h2 
                  ref={sectionHeaderRef}
                  tabIndex={-1}
                  className="text-4xl font-extrabold text-slate-900 focus:outline-none"
                >
                  Assessment Complete
                </h2>
                <p className="text-slate-500 max-w-xl mx-auto">
                  Based on your responses for: <span className="font-bold text-slate-800 italic">"{state.problemDescription}"</span>
                </p>
              </div>

              {/* Score Summary Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse" aria-label="Score Summary">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th scope="col" className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Scorecard Section</th>
                      <th scope="col" className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Your Score</th>
                      <th scope="col" className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { label: 'Section A: AI Fit', score: calculateScores().subA, max: 5 },
                      { label: 'Section B: Pain Point', score: calculateScores().subB, max: 20 },
                      { label: 'Sections C+D: Quality', score: calculateScores().subCD, max: 6 },
                    ].map((row, i) => {
                      let level = 'Low';
                      if (i === 0) level = row.score >= 4 ? 'High' : row.score >= 2 ? 'Moderate' : 'Low';
                      if (i === 1) level = row.score >= 14 ? 'High' : row.score >= 8 ? 'Moderate' : 'Low';
                      if (i === 2) level = row.score >= 5 ? 'High' : row.score >= 3 ? 'Moderate' : 'Low';
                      
                      return (
                        <tr key={i}>
                          <td className="px-6 py-4 font-medium text-slate-700">{row.label}</td>
                          <td className="px-6 py-4 text-slate-600">{row.score} / {row.max}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                              level === 'High' ? 'bg-green-100 text-green-700' : 
                              level === 'Moderate' ? 'bg-amber-100 text-amber-700' : 
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {level}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Compliance Flags */}
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6" role="complementary" aria-labelledby="compliance-title">
                <div className="flex items-center gap-2 text-slate-900">
                  <ShieldCheck className="w-6 h-6 text-blue-600" aria-hidden="true" />
                  <h3 id="compliance-title" className="text-xl font-bold">Compliance & Ethics Flags</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    {state.answers[16] ? <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" aria-hidden="true" /> : <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" aria-hidden="true" />}
                    <div>
                      <p className="font-bold text-slate-800">Privacy Impact Assessment (PIA)</p>
                      <p className="text-sm text-slate-500">
                        {state.answers[16] ? "Mandatory: Personal information is processed." : "Not triggered: No personal information processed."}
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    {state.answers[17] ? <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" aria-hidden="true" /> : <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" aria-hidden="true" />}
                    <div>
                      <p className="font-bold text-slate-800">Algorithmic Impact Assessment (AIA)</p>
                      <p className="text-sm text-slate-500">
                        {state.answers[17] ? "Mandatory: AI assists in administrative decisions." : "Not triggered: No administrative decisions impacted."}
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    {state.answers[18] ? <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" aria-hidden="true" /> : <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" aria-hidden="true" />}
                    <div>
                      <p className="font-bold text-slate-800">Ethical Risk Mitigation</p>
                      <p className="text-sm text-slate-500">
                        {state.answers[18] ? "Action Required: Significant ethical or legal implications detected." : "No significant ethical risks identified."}
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Strategic Recommendation */}
              <div 
                className={`p-8 rounded-2xl border-2 shadow-lg ${getRecommendation().color}`}
                role="alert"
                aria-live="polite"
              >
                <div className="flex items-center gap-3 mb-4">
                  {getRecommendation().icon}
                  <h3 className="text-2xl font-black tracking-tight">{getRecommendation().title}</h3>
                </div>
                <p className="text-lg leading-relaxed opacity-90">
                  {getRecommendation().desc}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                <button 
                  onClick={exportToPDF}
                  disabled={isExporting}
                  className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg"
                >
                  {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  Export PDF Report
                </button>
                <button 
                  onClick={() => setState({ problemDescription: '', answers: {}, currentSection: 'intro' })}
                  className="text-blue-600 font-bold hover:underline"
                  aria-label="Restart the assessment from the beginning"
                >
                  Restart Assessment
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Hidden PDF Template */}
      <div 
        id="pdf-export-container"
        style={{ 
          position: 'absolute', 
          left: '-9999px', 
          top: '0', 
          width: '794px', 
          opacity: '1',
          visibility: 'visible',
          pointerEvents: 'none',
          zIndex: -1,
          backgroundColor: '#ffffff'
        }}
      >
        <div 
          ref={pdfTemplateRef} 
          className="w-[794px] bg-white p-12 space-y-8 text-[#1A1A1A]"
          style={{ fontFamily: 'Inter, sans-serif', color: '#1A1A1A' }}
        >
          <div className="flex justify-between items-start border-b-2 border-[#2563EB] pb-6">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-[#0F172A]">AI Readiness Assessment</h1>
              <p className="text-[#2563EB] font-bold">Government of Canada Scorecard Report</p>
            </div>
            <div className="text-right text-sm text-[#94A3B8]">
              <p>Date: {new Date().toLocaleDateString()}</p>
              <p>ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Problem Description</h2>
            <p className="text-xl font-semibold text-[#1E293B] italic">"{state.problemDescription}"</p>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {[
              { label: 'AI Fit Score', score: calculateScores().subA, max: 5 },
              { label: 'Pain Point Score', score: calculateScores().subB, max: 20 },
              { label: 'Process & Data Quality', score: calculateScores().subCD, max: 6 },
            ].map((stat, i) => (
              <div key={i} className="bg-[#F8FAFC] p-6 rounded-2xl border border-[#F1F5F9]">
                <p className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1">{stat.label}</p>
                <p className="text-3xl font-black text-[#0F172A]">{stat.score}<span className="text-[#CBD5E1] text-xl">/{stat.max}</span></p>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Compliance & Ethics Check</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'PIA Required', val: state.answers[16], colors: { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E' } },
                { label: 'AIA Required', val: state.answers[17], colors: { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E' } },
                { label: 'Ethical Risk', val: state.answers[18], colors: { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E' } },
              ].map((flag, i) => (
                <div 
                  key={i} 
                  className="p-4 rounded-xl border flex items-center gap-3"
                  style={{ 
                    backgroundColor: flag.val ? flag.colors.bg : '#F0FDF4',
                    borderColor: flag.val ? flag.colors.border : '#BBF7D0',
                    color: flag.val ? flag.colors.text : '#166534'
                  }}
                >
                  {flag.val ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span className="text-sm font-bold">{flag.label}: {flag.val ? 'YES' : 'NO'}</span>
                </div>
              ))}
            </div>
          </div>

          <div 
            className="p-8 rounded-2xl border-2"
            style={{ 
              backgroundColor: getRecommendation().pdfStyles.split(';')[0].split(':')[1].trim(),
              borderColor: getRecommendation().pdfStyles.split(';')[1].split(':')[1].trim(),
              color: getRecommendation().pdfStyles.split(';')[2].split(':')[1].trim()
            }}
          >
            <h2 className="text-xs font-bold uppercase tracking-wider mb-4 opacity-70">Strategic Recommendation</h2>
            <h3 className="text-xl font-black mb-2">{getRecommendation().title}</h3>
            <p className="leading-relaxed opacity-90">{getRecommendation().desc}</p>
          </div>

          <div className="pt-12 border-t border-[#F1F5F9] flex justify-between items-center text-[10px] text-[#94A3B8] uppercase tracking-widest">
            <p>Information provided by the Government of Canada AI Readiness Scorecard</p>
            <p>Generated via Interactive Assessor Tool</p>
          </div>
        </div>
      </div>

      <footer className="max-w-3xl mx-auto px-6 py-12 text-center text-slate-400 text-sm border-t border-slate-100" role="contentinfo">
        <p>
          Information provided by the{' '}
          <a 
            href="https://www.csps-efpc.gc.ca/tools/jobaids/ai-scorecard-eng.aspx" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Government of Canada AI Readiness Scorecard
          </a>
        </p>
        <p className="mt-1 italic">Designed for teams in the early stages of exploring AI-based solutions.</p>
        
        <div className="mt-8 flex flex-col items-center gap-4">
          <p className="text-slate-500 font-medium">Enjoying this tool?</p>
          <a 
            href={import.meta.env.VITE_DONATION_URL || "#"} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex items-center gap-2 bg-[#FFDD00] hover:bg-[#FFCC00] text-slate-900 px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <Coffee className="w-5 h-5 transition-transform group-hover:rotate-12" />
            Buy me a coffee
          </a>
          {!import.meta.env.VITE_DONATION_URL && (
            <p className="text-[10px] text-slate-300 italic">
              (Configure VITE_DONATION_URL in your environment to activate this button)
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}
