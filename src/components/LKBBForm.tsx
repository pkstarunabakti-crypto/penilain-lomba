import React, { useState } from 'react';
import { LKBB_CATEGORIES, JURI_AVATARS } from '../constants';
import { LKBBRecord } from '../types';
import { Save, ArrowLeft, Download, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { exportDetailToPDF } from '../lib/exportUtils';

interface LKBBFormProps {
  initialRecord?: LKBBRecord;
  onSave: (record: LKBBRecord, closeForm?: boolean) => void;
  onDelete?: (id: string) => void;
  onBack: () => void;
  records?: LKBBRecord[];
  juriType?: 'ALL' | 'PBB_DANTON' | 'FORMASI_VARIASI';
}

const JURI_LIST = {
  PBB_DANTON: ["Kang APIP", "Pak IAN"],
  FORMASI_VARIASI: ["Kang Zulmu", "Kang Rizal"],
  ALL: ["Kang APIP", "Pak IAN", "Kang Zulmu", "Kang Rizal"]
};

export default function LKBBForm({ initialRecord, onSave, onDelete, onBack, records = [], juriType = 'ALL' }: LKBBFormProps) {
  const currentJuriList = JURI_LIST[juriType] || JURI_LIST.ALL;
  const [juriName, setJuriName] = useState(initialRecord?.juriName || '');
  const [participantNumber, setParticipantNumber] = useState(initialRecord?.participantNumber || '');
  const [category, setCategory] = useState(initialRecord?.category || '');
  const [schoolName, setSchoolName] = useState(initialRecord?.schoolName || '');
  const [scores, setScores] = useState<Record<number, number>>(initialRecord?.scores || {});
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeLayer, setActiveLayer] = useState<'PBB' | 'REKAP'>('PBB');
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [lastSavedNumber, setLastSavedNumber] = useState("");

  // Reset state when mode is switched
  React.useEffect(() => {
    if (!initialRecord) {
      setScores({});
      setParticipantNumber('');
      setCategory('');
      setSchoolName('');
      setActiveLayer('PBB');
      setCurrentItemIndex(0);
    }
  }, [juriType, initialRecord]);

  const filteredCategories = React.useMemo(() => {
    if (juriType === 'FORMASI_VARIASI') {
      return LKBB_CATEGORIES.filter(cat => cat.id.startsWith('V') || cat.id.startsWith('F'));
    } else if (juriType === 'PBB_DANTON') {
      return LKBB_CATEGORIES.filter(cat => !cat.id.startsWith('V') && !cat.id.startsWith('F'));
    }
    return LKBB_CATEGORIES;
  }, [juriType]);

  const allItems = React.useMemo(() => {
    const list: any[] = [];
    filteredCategories.forEach(cat => {
      cat.items.forEach(item => {
        list.push({ ...item, categoryId: cat.id, categoryTitle: cat.title });
      });
    });
    return list;
  }, [filteredCategories]);

  const currentItem = allItems[currentItemIndex];

  const isAlreadyEvaluated = React.useMemo(() => {
    if (initialRecord) return false; // editing existing
    if (!juriName || !participantNumber) return false;
    return records.some(r => r.juriName.toLowerCase() === juriName.toLowerCase() 
                          && r.participantNumber.toLowerCase() === participantNumber.toLowerCase());
  }, [juriName, participantNumber, records, initialRecord]);

  const handleScoreChange = (itemId: number, score: number) => {
    // Find the item to get its possible scores
    const item = filteredCategories.flatMap(c => c.items).find(i => i.id === itemId);
    if (!item) return;

    const allValues = item.scores.flatMap(s => s.values);
    const minScore = Math.min(...allValues);
    const maxScore = Math.max(...allValues);

    // Enforce minimum score validation, but ALLOW 0
    if (score !== 0 && score < minScore) {
      // Provide visual feedback (alert or similar) as "prevent it"
      alert(`Nilai ${score} di bawah batas minimum (${minScore}) untuk gerakan ini.`);
      return;
    }

    setScores(prev => {
      if (prev[itemId] === score) return prev;
      return { ...prev, [itemId]: score };
    });

    // Auto-advance to next item after small delay
    if (currentItemIndex < allItems.length - 1) {
      setTimeout(() => {
        setCurrentItemIndex(prev => prev + 1);
      }, 500);
    }
  };

  const renderStepByStepView = () => {
    if (!currentItem) return null;
    
    return (
      <div className="flex flex-row bg-slate-100 rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-200 min-h-[600px] w-full">
        {/* Left Sidebar - REVIEW JAWABAN */}
        <div className="w-1/3 max-w-[300px] bg-slate-800 text-white flex flex-col border-r-4 border-slate-900">
          <div className="p-4 bg-slate-900 font-black text-center tracking-widest text-sm border-b border-slate-700">
            REVIEW JAWABAN
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {allItems.map((item, idx) => {
              const val = scores[item.id];
              if (val === undefined) return null; // Only show answered items
              
              const isCurrent = idx === currentItemIndex;
              
              return (
                <div key={item.id} className={`flex flex-col items-center p-2 rounded-xl border-2 ${isCurrent ? 'border-yellow-400 bg-slate-700' : 'border-slate-600 bg-slate-800/50'}`}>
                  <span className="text-[11px] font-bold text-center uppercase mb-2 break-words w-full px-1">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="bg-red-500 text-white font-bold py-1 px-3 rounded-lg text-sm">{val}</span>
                    <button 
                      onClick={() => setCurrentItemIndex(idx)}
                      className="bg-red-500/20 text-red-100 hover:bg-red-500 hover:text-white transition-colors border border-red-500/50 text-[10px] font-bold py-1 px-3 rounded-lg uppercase"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-4 bg-slate-900 border-t border-slate-700">
            <button 
              onClick={() => setActiveLayer('REKAP')} 
              className="w-full bg-slate-700 hover:bg-slate-600 font-bold py-3 rounded-xl transition-colors text-sm uppercase"
            >
              Lihat Mode Tabel
            </button>
          </div>
        </div>

        {/* Right Content - Scoring Area */}
        <div className="flex-1 flex flex-col bg-white overflow-y-auto relative">
          <div className="p-4 flex justify-between items-center bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
            <select 
              value={juriName}
              onChange={(e) => setJuriName(e.target.value)}
              className="bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-sm outline-none cursor-pointer border border-slate-300"
            >
              <option value="">Pilih Juri...</option>
              {currentJuriList.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Peserta</div>
                <div className="font-black text-slate-800 leading-none">{participantNumber || 'Belum Diisi'}</div>
              </div>
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center font-black text-indigo-700 border-2 border-indigo-200">
                 {participantNumber || '?'}
              </div>
            </div>
          </div>

          <div className="flex-1 p-6 md:p-10 flex flex-col items-center">
            {/* Judge Avatar / Illustration */}
            <div className="mb-6 rounded-3xl overflow-hidden border-4 border-slate-100 shadow-sm w-32 h-32 bg-slate-100 flex items-center justify-center">
              {juriName ? (
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${juriName}&backgroundColor=e2e8f0`} alt={juriName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-slate-300 font-black text-xs uppercase text-center p-2">Pilih Juri First</span>
              )}
            </div>

            <div className="text-center mb-8 w-full">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">
                MATERI {currentItem.categoryId} :
              </h3>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight px-4 break-words">
                {currentItem.name}
              </h2>
            </div>
            
            {/* Score Buttons by Group */}
            <div className="w-full max-w-2xl px-2">
              <div className="mb-6 flex justify-center">
                 <button 
                  onClick={() => handleScoreChange(currentItem.id, 0)}
                  className={`w-full max-w-[200px] py-4 rounded-2xl font-black text-xl transition-all border-4 shadow-sm flex flex-col items-center justify-center
                    ${scores[currentItem.id] === 0 
                      ? 'bg-slate-900 text-white border-indigo-500 scale-105 shadow-xl' 
                      : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 hover:text-slate-600 border-dashed'}
                  `}
                >
                  <span className="text-[10px] uppercase tracking-widest mb-1 opacity-60 font-bold">Z / Gagal</span>
                  0
                </button>
              </div>

              <div className="flex justify-center gap-[2%] sm:gap-4 mb-2">
                {currentItem.scores.map((scoreGroup: any, gIdx: number) => (
                  <div key={gIdx} className="flex-1 text-center font-bold text-[10px] sm:text-xs text-slate-500 mb-1">
                    {scoreGroup.label}
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center gap-[2%] sm:gap-4 w-full">
                {currentItem.scores.map((scoreGroup: any, gIdx: number) => (
                  <div key={gIdx} className="flex-1 flex gap-1 sm:gap-2 bg-slate-50 p-2 rounded-xl flex-wrap justify-center content-start">
                    {scoreGroup.values.map((val: number) => {
                      const isActive = scores[currentItem.id] === val;
                      return (
                        <button
                          key={val}
                          onClick={() => handleScoreChange(currentItem.id, val)}
                          className={`
                            relative w-full sm:w-auto flex-1 min-w-[36px] items-center justify-center aspect-square rounded-lg font-black text-lg sm:text-xl transition-all duration-200 shadow-sm
                            ${isActive 
                              ? 'bg-red-500 text-white scale-110 shadow-lg border-2 border-red-600 z-10' 
                              : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-red-300 hover:text-red-500'
                            }
                          `}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Bottom Actions */}
          <div className="p-6 border-t border-slate-100 flex justify-between bg-white mt-auto">
             <button 
              onClick={() => setCurrentItemIndex(prev => Math.max(0, prev - 1))}
              disabled={currentItemIndex === 0}
              className="text-slate-400 hover:text-slate-800 font-bold uppercase text-xs px-4 py-2 disabled:opacity-30 flex items-center gap-2"
             >
               <ChevronLeft className="w-4 h-4" /> Kembali
             </button>

             {currentItemIndex === allItems.length - 1 ? (
                <button 
                  onClick={() => performSave(false)}
                  className="bg-red-500 hover:bg-red-600 text-white font-black uppercase text-sm px-8 py-3 rounded-xl shadow-lg shadow-red-500/30 transition-all flex items-center gap-2"
                >
                  Submit Nilai
                </button>
             ) : (
                <button 
                  onClick={() => setCurrentItemIndex(prev => Math.min(allItems.length - 1, prev + 1))}
                  className="text-red-600 hover:bg-red-50 font-bold uppercase text-xs px-6 py-2 rounded-xl transition-colors flex items-center gap-2 border border-red-100"
                >
                  Lanjut <ChevronRight className="w-4 h-4" />
                </button>
             )}
          </div>
        </div>
      </div>
    );
  };

  const renderTable = (categoriesToRender: typeof filteredCategories, sectionTitle: string, themeColor: string) => (
    <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className={`${themeColor} p-4 rounded-t-xl flex flex-col sm:flex-row justify-between items-center gap-2 border-b-2 border-white/20 shadow-md`}>
        <h2 className="font-black text-white uppercase tracking-widest text-sm sm:text-base drop-shadow-sm flex items-center gap-3">
          <div className="bg-white/20 p-1 rounded">
             {sectionTitle === 'FORMAT PENILAIAN REKAP' ? <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div> : <div className="w-2 h-2 rounded-full bg-blue-400"></div>}
          </div>
          {sectionTitle}
        </h2>
        <div className="flex flex-wrap justify-center gap-3 text-[10px] sm:text-xs font-bold bg-black/20 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-sm">
           <div className="flex items-center gap-2 text-white/90">
             <span className="opacity-60 uppercase">Juri:</span>
             <span className="text-white">{juriName || '—'}</span>
           </div>
           <div className="w-px h-3 bg-white/20 hidden sm:block"></div>
           <div className="flex items-center gap-2 text-white/90">
             <span className="opacity-60 uppercase">No:</span>
             <span className="text-white font-black">{participantNumber || '—'}</span>
           </div>
           {category && (
             <>
               <div className="w-px h-3 bg-white/20 hidden sm:block"></div>
               <div className="flex items-center gap-2 text-white/90">
                <span className="opacity-60 uppercase">Kat:</span>
                <span className="text-white">{category}</span>
               </div>
             </>
           )}
        </div>
      </div>
      <div className="overflow-x-auto border-x border-b border-slate-200 rounded-b-xl shadow-lg bg-white overflow-hidden">
        <table className="w-full text-[11px] md:text-xs text-left border-collapse">
          <thead className="bg-slate-100/80 text-slate-700 border-b-2 border-slate-200 sticky top-0 z-5">
            <tr>
              <th rowSpan={2} className="px-2 py-3 border-r border-slate-200 w-8 text-center uppercase font-black">No</th>
              <th rowSpan={2} className="px-2 py-3 border-r border-slate-200 min-w-[200px] uppercase font-black">Gerakan / Kriteria</th>
              <th rowSpan={2} className="px-1 py-3 border-r border-slate-100 w-10 text-center uppercase font-black bg-slate-200/50 text-[9px]">Gagal</th>
              <th colSpan={10} className="px-2 py-2 border-b border-r border-slate-200 text-center uppercase font-black bg-slate-200/30">Nilai</th>
              <th rowSpan={2} className="px-2 py-3 text-center w-20 uppercase font-black bg-slate-200/50">Jumlah</th>
            </tr>
            <tr className="bg-slate-50">
              <th colSpan={10} className="px-2 py-1 text-center font-bold text-[9px] text-slate-400">Pilih salah satu angka di bawah ini</th>
            </tr>
          </thead>
          <tbody>
            {categoriesToRender.map(cat => (
              <React.Fragment key={cat.id}>
                <tr className="bg-slate-800 text-white border-y border-slate-700">
                  <td className="px-2 py-2 font-black border-r border-slate-700 text-center">{cat.id}</td>
                  <td colSpan={12} className="px-3 py-2 font-black uppercase tracking-wider text-[10px]">
                    {cat.title.includes('.') ? cat.title.split('.').slice(1).join('.').trim() : (cat.title.replace('FORMAT ', '').replace('PENILAIAN ', ''))}
                  </td>
                </tr>
                
                {cat.items.map((item) => {
                  const allValues = item.scores.flatMap(s => s.values);
                  const minScore = Math.min(...allValues);
                  const maxScore = Math.max(...allValues);
                  const rowScores = item.scores.flatMap(s => s.values.map(v => ({ label: s.label, value: v })));
                  const isSelected = scores[item.id] !== undefined;

                  return (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-2 py-2 border-r border-slate-100 text-center text-slate-400 font-mono text-[10px]">
                        {(item as any).no || item.id}
                      </td>
                      <td className="px-3 py-2 border-r border-slate-100 font-medium text-slate-800 italic group relative">
                        {item.id === 33 || item.id === 34 ? (
                           <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 not-italic">{item.name}</span>
                        ) : item.name}
                        
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:block z-50">
                          <div className="bg-slate-900 border border-slate-700 text-white text-[10px] px-2 py-1.5 rounded shadow-2xl whitespace-nowrap">
                            Rentang: {minScore} - {maxScore}
                          </div>
                        </div>
                      </td>

                      <td 
                        className={`px-1 py-2 border-r border-slate-100 text-center transition-all duration-150 cursor-pointer
                          ${scores[item.id] === 0 ? 'bg-slate-900 text-white font-black shadow-lg scale-110 z-10' : 'hover:bg-slate-200 text-slate-300'}
                        `}
                        onClick={() => handleScoreChange(item.id, 0)}
                      >
                        0
                      </td>
                      
                      {Array.from({ length: 10 }).map((_, colIdx) => {
                        const scoreObj = rowScores[colIdx];
                        if (!scoreObj) return <td key={colIdx} className="border-r border-slate-50 bg-slate-50/10"></td>;
                        
                        const isActive = scores[item.id] === scoreObj.value;
                        
                        return (
                          <td 
                            key={colIdx} 
                            className={`px-1 py-2 border-r border-slate-100 text-center transition-all duration-150 relative group
                              ${isActive ? 'bg-indigo-600 text-white font-bold scale-[1.03] z-1 shadow-lg ring-2 ring-indigo-300' : 'hover:bg-indigo-50 cursor-pointer'}
                            `}
                            onClick={() => handleScoreChange(item.id, scoreObj.value)}
                          >
                            <div className="flex flex-col items-center justify-center h-full min-h-[30px]">
                              <span className={`text-[8px] mb-0.5 font-bold uppercase ${isActive ? 'text-indigo-100' : 'text-slate-300 group-hover:text-indigo-400'}`}>
                                {scoreObj.label}
                              </span>
                              <span className="text-[13px]">{scoreObj.value}</span>
                            </div>
                          </td>
                        );
                      })}
                      
                      <td className={`px-2 py-2 text-center font-black text-sm border-l border-slate-200
                        ${isSelected ? 'text-indigo-700 bg-indigo-50/50' : 'text-slate-200'}
                      `}>
                        {scores[item.id] || '—'}
                      </td>
                    </tr>
                  );
                })}
                
                <tr className="bg-slate-100 font-bold border-t border-slate-300">
                  <td colSpan={2} className="px-4 py-2.5 text-right text-slate-500 border-r border-slate-200 uppercase tracking-tighter text-[10px]">
                    Subtotal {cat.id}
                  </td>
                  <td colSpan={11} className="border-r border-slate-200 bg-slate-50/30"></td>
                  <td className="px-2 py-2.5 text-center text-slate-900 bg-slate-200/50">
                    {getCategoryTotal(cat.id)}
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const calculateTotal = () => {
    return (Object.values(scores) as number[]).reduce((a, b) => a + b, 0);
  };

  const getCategoryTotal = (categoryId: string) => {
    const category = filteredCategories.find(c => c.id === categoryId);
    if (!category) return 0;
    
    return category.items.reduce((total, item) => {
      return total + (scores[item.id] || 0);
    }, 0);
  };

  const performSave = (continueNext: boolean) => {
    if (!juriName || !participantNumber || !schoolName) {
      alert('Nama juri, nomor peserta, dan asal sekolah harus diisi!');
      return;
    }

    if (isAlreadyEvaluated) {
      alert(`Peringatan: Juri ${juriName} sudah menilai nomor urut ${participantNumber}. Nilai akan diperbarui jika dilanjutkan.`);
    }

    const record: LKBBRecord = {
      id: initialRecord?.id || crypto.randomUUID(),
      juriName,
      participantNumber,
      schoolName,
      category,
      scores,
      date: initialRecord?.date || new Date().toISOString(),
      totalScore: calculateTotal()
    };

    onSave(record, !continueNext);
    
    if (continueNext) {
      // Show success mark!
      setLastSavedNumber(participantNumber);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      // If we're not editing an existing record, clear the scores for the next participant
      if (!initialRecord) {
        setScores({});
        setParticipantNumber('');
        setCategory('');
        setSchoolName('');
        // Leave juriName filled in!
      }
    }
  };

  const handleExport = () => {
    const record: LKBBRecord = {
      id: initialRecord?.id || 'temp-id',
      juriName: juriName || 'Juri',
      participantNumber: participantNumber || '00',
      schoolName: schoolName || '-',
      category: category || '-',
      scores,
      date: initialRecord?.date || new Date().toISOString(),
      totalScore: calculateTotal()
    };
    exportDetailToPDF(record);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200 sticky top-0 z-10 transition-all duration-300">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium text-sm"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="hidden sm:inline">Kembali</span>
        </button>
        <div className="flex gap-2">
           <button 
            onClick={handleExport}
            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors text-sm"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Ekspor PDF</span>
          </button>
          
          <button 
            onClick={() => performSave(false)}
            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors shadow-sm text-sm"
          >
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">Simpan & Tutup</span>
          </button>
          
          {!initialRecord && (
            <button 
              onClick={() => performSave(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors shadow-sm text-sm"
            >
              Simpan & Lanjut
            </button>
          )}

          {initialRecord && (
            <button 
              onClick={() => {
                if (confirm('Apakah Anda yakin ingin menghapus penilaian ini?')) {
                  onDelete?.(initialRecord.id);
                }
              }}
              className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-lg flex items-center justify-center gap-2 font-black transition-colors text-[10px] uppercase tracking-widest border border-red-200"
              title="Hapus Penilaian"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden lg:inline">Hapus</span>
            </button>
          )}

          {initialRecord && (
            <button 
              onClick={() => performSave(false)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors shadow-sm text-sm"
            >
              Simpan Perubahan
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
        
        {/* Visual indicators for "Tanda ganti nomor urut" */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="bg-green-500 rounded-full p-1 border-2 border-green-100 flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-800 font-medium">Berhasil menyimpan nilai untuk Peserta No Urut <span className="font-bold">{lastSavedNumber}</span>. Silakan lanjut ke peserta berikutnya!</p>
          </div>
        )}

        {isAlreadyEvaluated && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
             <div className="text-amber-500 flex-shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
             </div>
             <div>
               <p className="text-amber-800 font-bold">Peringatan!</p>
               <p className="text-amber-700 text-sm">Anda (<span className="font-semibold">{juriName}</span>) sudah memberi nilai untuk peserta <span className="font-semibold">{participantNumber}</span>.</p>
             </div>
          </div>
        )}

          <div className="flex items-start justify-between mb-8 border-b border-slate-100 pb-6">
           <div className="space-y-4 w-full md:w-3/4">
               <div className="flex gap-4 items-center">
                <span className="font-bold text-slate-700 w-32">KATEGORI :</span>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-4 py-1.5 border-b-2 border-slate-200 focus:border-indigo-500 outline-none flex-1 font-bold bg-white cursor-pointer"
                >
                  <option value="">Pilih Kategori...</option>
                  <option value="SD">SD</option>
                  <option value="SMP">SMP</option>
                  <option value="SMK/SMA">SMK/SMA</option>
                  <option value="Purna">Purna</option>
                </select>
              </div>
              <div className="flex gap-4 items-center">
                <span className="font-bold text-slate-700 w-32">NO URUT :</span>
                <input 
                  type="text" 
                  value={participantNumber}
                  onChange={(e) => setParticipantNumber(e.target.value)}
                  className="px-4 py-1.5 border-b-2 border-slate-200 focus:border-indigo-500 outline-none w-32 font-bold text-lg"
                  placeholder="..."
                />
              </div>
              <div className="flex gap-4 items-center">
                <span className="font-bold text-slate-700 w-32">NAMA SEKOLAH :</span>
                <input 
                  type="text" 
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="px-4 py-1.5 border-b-2 border-slate-200 focus:border-indigo-500 outline-none flex-1 font-bold"
                  placeholder="..."
                />
              </div>
              <div className="flex gap-4 items-center text-sm">
                <span className="font-bold text-slate-500 w-32">NAMA JURI :</span>
                <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <select 
                    value={juriName}
                    onChange={(e) => setJuriName(e.target.value)}
                    className="px-4 py-1.5 border-b border-slate-200 focus:border-indigo-400 outline-none flex-1 bg-white cursor-pointer"
                  >
                    <option value="">Pilih Juri...</option>
                    {currentJuriList.map(name => <option key={name} value={name}>{name}</option>)}
                  </select>
                  {juriName && JURI_AVATARS[juriName] && (
                    <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-100 flex-shrink-0 self-start sm:self-auto animate-in fade-in zoom-in-95 duration-200">
                      <img 
                        src={JURI_AVATARS[juriName]} 
                        alt={juriName} 
                        className="h-7 w-7 rounded-full object-cover border border-slate-200/80 shadow-xs" 
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest leading-none">Petugas Juri Aktif</span>
                    </div>
                  )}
                </div>
              </div>
           </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
           <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
              <button
                onClick={() => setActiveLayer('PBB')}
                className={`px-6 py-3 rounded-xl font-black text-xs transition-all duration-200 flex items-center gap-2 ${
                  activeLayer === 'PBB' 
                    ? 'bg-white text-indigo-700 shadow-xl' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                }`}
              >
                MODE STEP-BY-STEP
              </button>
              <button
                onClick={() => setActiveLayer('REKAP')}
                className={`px-6 py-3 rounded-xl font-black text-xs transition-all duration-200 flex items-center gap-2 ${
                  activeLayer === 'REKAP' 
                    ? 'bg-white text-amber-700 shadow-xl' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                }`}
              >
                MODE REKAP TABEL
              </button>
           </div>
        </div>

         <div className="space-y-12 min-h-[500px]">
           {activeLayer === 'PBB' ? (
             renderStepByStepView()
           ) : (
             <>
               {filteredCategories.length > 0 && renderTable(filteredCategories, juriType === 'FORMASI_VARIASI' ? 'PENILAIAN FORMASI & VARIASI' : 'PENILAIAN PBB & DANTON', 'bg-gradient-to-r from-indigo-600 to-slate-800')}
             </>
           )}
        </div>

        <div className="mt-8 bg-slate-900 text-white rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-800">
             <div className="flex items-center gap-4">
                <div className="bg-indigo-500/20 p-3 rounded-2xl border border-indigo-500/30">
                   <Save className="h-8 w-8 text-indigo-400" />
                </div>
                <div>
                   <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Skor Akhir</h4>
                   <p className="text-slate-500 text-[10px]">Akumulasi seluruh kriteria penilaian</p>
                </div>
             </div>
             <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500">
                  {calculateTotal()}
                </span>
                <span className="text-slate-500 font-bold">POIN</span>
             </div>
          </div>
          
          <div className="px-8 py-4 bg-black/40 flex flex-wrap justify-center gap-8 text-xs font-bold text-slate-400">
             <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                <span>{juriType === 'FORMASI_VARIASI' ? 'FORMASI & VARIASI' : 'PBB & DANTON'}: {calculateTotal()}</span>
             </div>
          </div>
        </div>
        
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-12 pt-10 border-t border-slate-100">
           <div className="text-center space-y-20">
              <p className="font-bold text-slate-700 underline underline-offset-4">Juri Pendamping</p>
              <div className="w-48 h-0.5 bg-slate-300 mx-auto"></div>
              <p className="text-sm text-slate-500">( ............................................................ )</p>
           </div>
           <div className="text-center space-y-20">
              <p className="font-bold text-slate-700 underline underline-offset-4">
                {juriType === 'FORMASI_VARIASI' ? 'Juri Formasi & Variasi' : 'Juri PBB & Danton'}
              </p>
              <div className="w-48 h-0.5 bg-slate-300 mx-auto"></div>
              <p className="text-sm text-slate-800 font-bold">{juriName || '( ............................................................ )'}</p>
           </div>
        </div>
      </div>
    </div>
  );
}
