import { useState, useMemo, useRef } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LabelList,
  ReferenceArea,
  ReferenceLine
} from 'recharts';
import { LayoutDashboard, FileText, BarChart2, Download } from 'lucide-react';
import { parseSchedule } from './utils/parser';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './App.css';

const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2', '#4f46e5'];

function App() {
  const [activeTab, setActiveTab] = useState<'input' | 'charts'>('input');
  const [rawText, setRawText] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const chartsRef = useRef<HTMLDivElement>(null);

  const scheduleData = useMemo(() => {
    try {
      return parseSchedule(rawText);
    } catch (e) {
      console.error("Erro ao processar escala:", e);
      return [];
    }
  }, [rawText]);

  const handleProcess = () => {
    if (scheduleData.length > 0) {
      setActiveTab('charts');
    } else {
      alert('Por favor, insira dados válidos da escala.');
    }
  };

  const exportToPDF = async () => {
    if (!chartsRef.current) return;
    setIsExporting(true);
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const cards = chartsRef.current.querySelectorAll('.chart-card');
    
    // Função auxiliar para adicionar cards a uma página
    const addCardsToPage = async (startIndex: number, count: number, pageNum: number) => {
      if (pageNum > 1) pdf.addPage();
      
      let currentY = 10;
      const margin = 10;
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      for (let i = startIndex; i < Math.min(startIndex + count, cards.length); i++) {
        const canvas = await html2canvas(cards[i] as HTMLElement, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - (2 * margin);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 5;
      }
    };

    try {
      // Página 1: Primeiros 4 gráficos
      await addCardsToPage(0, 4, 1);
      // Página 2: Últimos 3 gráficos
      if (cards.length > 4) {
        await addCardsToPage(4, 3, 2);
      }
      
      pdf.save('escala-semanal.pdf');
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1><BarChart2 size={32} style={{verticalAlign: 'middle', marginRight: '10px'}} /> BreatheRota</h1>
        <p>Visualização de Escala Semanal</p>
      </header>

      <nav className="tabs">
        <button 
          className={`tab-button ${activeTab === 'input' ? 'active' : ''}`}
          onClick={() => setActiveTab('input')}
        >
          <FileText size={20} /> Inserir Dados
        </button>
        <button 
          className={`tab-button ${activeTab === 'charts' ? 'active' : ''}`}
          onClick={() => setActiveTab('charts')}
        >
          <LayoutDashboard size={20} /> Ver Gráficos
        </button>
      </nav>

      <main>
        {activeTab === 'input' ? (
          <div className="card input-area">
            <h3>Cole sua escala abaixo</h3>
            <textarea 
              placeholder="Exemplo:&#10;Mon 27&#10;Will Tranter — 05:45–18:00&#10;..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
            <button className="primary-button" onClick={handleProcess}>
              Gerar Gráficos
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button 
                className="tab-button active" 
                onClick={exportToPDF} 
                disabled={isExporting}
                style={{ background: '#16a34a' }}
              >
                <Download size={20} /> {isExporting ? 'Gerando...' : 'Exportar PDF'}
              </button>
            </div>
            
            <div className="dashboard-grid" ref={chartsRef}>
              {scheduleData.length > 0 ? (
                scheduleData.map((dayData, dayIndex) => (
                  <div key={dayData.day} className="chart-card">
                    <h3>{dayData.day}</h3>
                    <div style={{ height: 250 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={dayData.shifts}
                          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                        >
                          <XAxis 
                            type="number" 
                            domain={[0, 24]} 
                            ticks={[0, 6, 12, 16, 18, 24]}
                            tickFormatter={(t) => `${t}h`}
                          />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={80}
                            tick={{ fontSize: 10 }}
                          />
                          <Tooltip 
                            labelStyle={{ color: 'black', fontWeight: 'bold' }}
                            formatter={(value: any) => {
                              if (Array.isArray(value)) {
                                return [`${value[0]}h - ${value[1]}h`, 'Turno'];
                              }
                              return [value, 'Hora'];
                            }}
                          />
                          {dayIndex === 0 && (
                            <>
                              <ReferenceArea x1={18} x2={19} fill="#fecaca" fillOpacity={0.4} label={{ value: 'HANDOVER (1h)', position: 'top', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} />
                              <ReferenceLine x={18} stroke="#ffffff" strokeWidth={3} />
                              <ReferenceLine x={18} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={3} />
                              <ReferenceLine x={19} stroke="#ffffff" strokeWidth={3} />
                              <ReferenceLine x={19} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={3} />
                            </>
                          )}
                          {dayIndex === 2 && (
                            <>
                              <ReferenceArea x1={17} x2={18} fill="#fecaca" fillOpacity={0.4} label={{ value: 'HANDOVER (1h)', position: 'top', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} />
                              <ReferenceLine x={17} stroke="#ffffff" strokeWidth={3} />
                              <ReferenceLine x={17} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={3} />
                              <ReferenceLine x={18} stroke="#ffffff" strokeWidth={3} />
                              <ReferenceLine x={18} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={3} />
                            </>
                          )}
                          {dayIndex === 5 && (
                            <>
                              <ReferenceArea x1={10} x2={11} fill="#fecaca" fillOpacity={0.4} label={{ value: '10-11', position: 'top', fill: '#ef4444', fontSize: 9, fontWeight: 'bold' }} />
                              <ReferenceLine x={10} stroke="#ffffff" strokeWidth={2} />
                              <ReferenceLine x={10} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={2} />
                              <ReferenceArea x1={11} x2={12} fill="#fecaca" fillOpacity={0.4} label={{ value: '11-12', position: 'top', fill: '#ef4444', fontSize: 9, fontWeight: 'bold' }} />
                              <ReferenceLine x={11} stroke="#ffffff" strokeWidth={2} />
                              <ReferenceLine x={11} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={2} />
                              <ReferenceLine x={12} stroke="#ffffff" strokeWidth={2} />
                              <ReferenceLine x={12} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={2} />
                              <ReferenceArea x1={13} x2={14} fill="#fecaca" fillOpacity={0.4} label={{ value: '13-14', position: 'top', fill: '#ef4444', fontSize: 9, fontWeight: 'bold' }} />
                              <ReferenceLine x={13} stroke="#ffffff" strokeWidth={2} />
                              <ReferenceLine x={13} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={2} />
                              <ReferenceLine x={14} stroke="#ffffff" strokeWidth={2} />
                              <ReferenceLine x={14} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={2} />
                            </>
                          )}
                          <Bar 
                            dataKey={(d: any) => [d.start, d.end]} 
                            fill="#2563eb"
                            radius={[4, 4, 4, 4]}
                          >
                            <LabelList 
                              dataKey="name" 
                              position="insideLeft" 
                              style={{ fill: 'white', fontWeight: 'bold', fontSize: '11px' }} 
                              offset={10}
                            />
                            {dayData.shifts.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>Nenhum dado para mostrar. Por favor, insira a escala na aba "Inserir Dados".</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
