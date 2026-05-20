import React, { useState, useEffect } from 'react';
import { LKBBRecord } from './types';
import { Trophy, Medal, Download, ArrowLeft, Search, ChevronRight, QrCode } from 'lucide-react';
import { exportCombinedResultsPDF } from './lib/exportUtils';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { JURI_AVATARS } from './constants';
import { collection, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

export default function PublicResults() {
  const [records, setRecords] = useState<LKBBRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'evaluations'), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as LKBBRecord);
      setRecords(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'evaluations');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Compute stats
  const totalEvaluations = records.length;

  // Group records by participant to combine judge scores
  const getCombinedResults = (filteredRecords: LKBBRecord[]) => {
    const grouped: Record<string, { 
      participantNumber: string; 
      category: string; 
      schoolName: string; 
      judgeScores: Record<string, number>; 
      pbbDantonSubtotal: number;
      formasiVariasiSubtotal: number;
      totalCombined: number;
    }> = {};
    
    filteredRecords.forEach(record => {
      const key = `${record.participantNumber}-${record.category}`;
      if (!grouped[key]) {
        grouped[key] = {
          participantNumber: record.participantNumber,
          category: record.category || '-',
          schoolName: record.schoolName,
          judgeScores: {},
          pbbDantonSubtotal: 0,
          formasiVariasiSubtotal: 0,
          totalCombined: 0
        };
      }
      
      grouped[key].judgeScores[record.juriName] = record.totalScore;
      
      const pbbJudges = ["Kang APIP", "Pak IAN"];
      const fvJudges = ["Kang Zulmu", "Kang Rizal"];
      
      let pbbSum = 0;
      let fvSum = 0;
      Object.entries(grouped[key].judgeScores).forEach(([jName, score]) => {
        if (pbbJudges.includes(jName)) {
          pbbSum += score || 0;
        } else if (fvJudges.includes(jName)) {
          fvSum += score || 0;
        }
      });
      
      grouped[key].pbbDantonSubtotal = pbbSum;
      grouped[key].formasiVariasiSubtotal = fvSum;
      grouped[key].totalCombined = pbbSum + fvSum;
    });
    
    return Object.values(grouped).sort((a, b) => b.totalCombined - a.totalCombined);
  };

  const pbbJudgesList = ["Kang APIP", "Pak IAN"];
  const fvJudgesList = ["Kang Zulmu", "Kang Rizal"];

  const filteredRecords = filterCategory 
    ? records.filter(r => (r.category || '-') === filterCategory)
    : records;

  const combinedResults = getCombinedResults(filteredRecords);
  const allJudges = Array.from(new Set(filteredRecords.map(r => r.juriName))).sort() as string[];
  const uniqueCategories = Array.from(new Set(records.map(r => r.category || '-'))).sort() as string[];

  const [isLive, setIsLive] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans overflow-hidden">
      <header className="flex-shrink-0 bg-indigo-600 text-white shadow-md z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-amber-300" />
            <div>
              <h1 className="text-xl font-bold leading-none">Hasil Akhir Penilaian</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-indigo-200 text-sm">Sistem Otomatis Akumulasi LKBB</p>
                <span className="flex items-center gap-1 bg-green-500/20 text-green-100 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-green-500/30">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                  </span>
                  LIVE
                </span>
              </div>
            </div>
          </div>
          <Link to="/" className="flex items-center gap-2 text-indigo-100 hover:text-white transition-colors text-sm font-medium">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Admin
          </Link>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-3 py-4 space-y-6 pb-28">
        <div className="max-w-7xl mx-auto space-y-8">
        {/* Banner Link to Single Participant Search */}
        <div className="bg-white rounded-3xl border-2 border-indigo-100 p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex items-center gap-6">
            <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 shadow-inner">
               <QRCodeSVG 
                value={`${window.location.origin}/cek-nilai`} 
                size={100} 
                level="H" 
                imageSettings={{
                  src: "https://api.dicebear.com/7.x/beta/svg?seed=trophy&backgroundColor=ffffff",
                  height: 25,
                  width: 25,
                  excavate: true,
                }}
               />
            </div>
            <div>
              <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Cek Nilai Satuan</h4>
              <p className="text-slate-500 text-sm font-medium">Scan barcode atau klik tombol untuk melihat rincian nilai per kriteria.</p>
            </div>
          </div>
          <Link 
            to="/cek-nilai" 
            className="w-full md:w-auto bg-indigo-600 hover:bg-slate-900 text-white font-black text-sm px-10 py-4 rounded-2xl transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 uppercase tracking-widest active:scale-95"
          >
            CEK NILAI SAYA
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>

        {/* Dewan Juri Section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="text-center md:text-left mb-6">
            <h3 className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-widest mb-1">Dewan Juri Terhormat LKBB</h3>
            <h2 className="text-xl font-black text-slate-800 uppercase">Apresiasi & Penilai Profesional</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Kang APIP", role: "Juri PBB & Danton", desc: "Penilaian presisi keseragaman aba-aba dan performa Danton.", color: "border-emerald-100 bg-emerald-50/20" },
              { name: "Pak IAN", role: "Juri PBB & Danton", desc: "Pemeriksaan detail ketepatan teknik gerakan baris-berbaris.", color: "border-indigo-100 bg-indigo-50/20" },
              { name: "Kang Zulmu", role: "Juri Formasi & Variasi", desc: "Pemeriksa dinamika struktur, keindahan kreasi, dan estetika barisan.", color: "border-sky-100 bg-sky-50/20" },
              { name: "Kang Rizal", role: "Juri Formasi & Variasi", desc: "Menilai kerumitan variasi dan aplikasi nilai budaya/seni.", color: "border-purple-100 bg-purple-50/20" }
            ].map(j => {
              const avatar = JURI_AVATARS[j.name];
              return (
                <div key={j.name} className={`flex flex-col items-center p-4 rounded-2xl border ${j.color} shadow-xs text-center transition-all hover:shadow-md hover:scale-[1.02] duration-300`}>
                  {avatar ? (
                    <img 
                      src={avatar} 
                      alt={j.name} 
                      className="h-16 w-16 rounded-full object-cover border-2 border-slate-200/80 shadow-md mb-3" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xl font-black mb-3">
                      {j.name.charAt(0)}
                    </div>
                  )}
                  <h4 className="font-extrabold text-slate-850 text-sm leading-tight">{j.name}</h4>
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mt-1">{j.role}</span>
                  <p className="text-[10px] text-slate-400 mt-2 leading-relaxed font-semibold">{j.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
        
        {totalEvaluations === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm max-w-2xl mx-auto mt-12">
            <div className="bg-slate-100 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Visualisasi Hasil Belum Tersedia</h3>
            <p className="text-slate-500 mt-2">Daftar nilai akan muncul secara otomatis segera setelah juri mulai memasukkan data.</p>
          </div>
        ) : (
          <>
            {/* Tampilan Peserta Terbaik */}
            {combinedResults.length > 0 && (
              <div className="bg-gradient-to-br from-amber-100 to-orange-50 p-6 md:p-8 rounded-2xl border border-amber-200 shadow-sm flex flex-col md:flex-row items-center gap-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-md">
                  <Medal className="h-10 w-10 text-amber-500" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-sm font-bold text-amber-800 uppercase tracking-widest mb-1">Sekolah Terbaik Berdasarkan Akumulasi</h3>
                  <p className="text-3xl font-black text-slate-800 mb-2">Peringkat #1: {combinedResults[0].participantNumber}</p>
                  <p className="text-amber-700 font-semibold mb-1">{combinedResults[0].schoolName || '-'}</p>
                </div>
                <div className="text-center md:text-right bg-white p-4 rounded-xl shadow-sm border border-amber-100">
                  <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Total Skor Gabungan</p>
                  <p className="text-4xl font-black text-amber-600">{combinedResults[0].totalCombined}</p>
                </div>
              </div>
            )}

            {(filterCategory ? [filterCategory] : uniqueCategories).map((currentCat) => {
              const catComboResults = combinedResults.filter(r => (r.category || '-') === currentCat);
              
              if (catComboResults.length === 0) return null;
              
              return (
                <div key={currentCat} className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in duration-700 mb-8">
                  <div className="bg-slate-800 px-6 py-5 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <Trophy className="h-6 w-6 text-amber-400" />
                        <h3 className="font-bold text-white uppercase tracking-wider text-lg">
                          PAPAN PERINGKAT TOTAL - {currentCat === '-' ? 'UMUM' : currentCat.toUpperCase()}
                        </h3>
                      </div>
                      
                      {/* Only show select in the first one or outside, but wait it replaces the old div, let's keep select inside for now but only render if it's the first or just always keep it */}
                      <select 
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-lg border border-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                      >
                        <option value="">SEMUA TINGKATAN</option>
                        {uniqueCategories.map(cat => (
                          <option key={cat} value={cat}>{cat === '-' ? 'UMUM / LAINNYA' : cat.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      onClick={() => exportCombinedResultsPDF(catComboResults as any, allJudges)}
                      className="flex items-center gap-2 text-sm font-bold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 transition-colors shadow-sm"
                    >
                      <Download className="h-4 w-4" />
                      UNDUH PDF
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse min-w-[1000px]">
                      <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-bold">
                        {/* Two-tier header for perfect category grouping */}
                        <tr className="bg-slate-100 border-b border-slate-200 text-[10px] tracking-wider text-slate-500">
                          <th colSpan={4} className="px-6 py-3 text-left border-r border-slate-200 font-extrabold text-slate-600">IDENTITAS PESERTA</th>
                          <th colSpan={3} className="px-6 py-3 text-center border-r border-slate-200 bg-emerald-50 text-emerald-800 font-extrabold uppercase">BLOK I: JURI PBB & DANTON</th>
                          <th colSpan={3} className="px-6 py-3 text-center border-r border-slate-200 bg-sky-50 text-sky-850 font-extrabold uppercase">BLOK II: JURI FORMASI & VARIASI</th>
                          <th className="px-6 py-3 text-center bg-indigo-50 text-indigo-900 font-black uppercase">REKAPITULASI</th>
                        </tr>
                        <tr>
                          <th className="px-6 py-4 border-b border-slate-200 text-center w-16">Rank</th>
                          <th className="px-6 py-4 border-b border-slate-200 w-28">Kategori</th>
                          <th className="px-6 py-4 border-b border-slate-200 w-24">No Urut</th>
                          <th className="px-6 py-4 border-b border-slate-200 border-r border-slate-200 w-64">Nama Sekolah</th>
                          
                          {/* PBB Juries */}
                          {pbbJudgesList.map(judge => {
                            const avatar = JURI_AVATARS[judge];
                            return (
                              <th key={judge} className="px-6 py-3 border-b border-slate-200 text-center font-bold bg-emerald-50/10">
                                <div className="flex flex-col items-center justify-center gap-1 min-w-[80px]">
                                  {avatar ? (
                                    <img 
                                      src={avatar} 
                                      alt={judge} 
                                      className="h-7 w-7 rounded-full object-cover border border-emerald-200 shadow-2xs" 
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="h-7 w-7 rounded-full bg-slate-205 text-slate-600 flex items-center justify-center text-[10px] font-black">
                                      {judge.charAt(0)}
                                    </div>
                                  )}
                                  <span className="text-[10px] text-slate-600 uppercase tracking-tight block leading-none mt-1">{judge}</span>
                                </div>
                              </th>
                            );
                          })}
                          <th className="px-6 py-3 border-b border-slate-200 text-center font-black text-[10px] bg-emerald-50 text-emerald-800 tracking-wider uppercase border-r border-slate-200">TOTAL PBB</th>

                          {/* Formasi & Variasi Juries */}
                          {fvJudgesList.map(judge => {
                            const avatar = JURI_AVATARS[judge];
                            return (
                              <th key={judge} className="px-6 py-3 border-b border-slate-200 text-center font-bold bg-sky-50/10">
                                <div className="flex flex-col items-center justify-center gap-1 min-w-[80px]">
                                  {avatar ? (
                                    <img 
                                      src={avatar} 
                                      alt={judge} 
                                      className="h-7 w-7 rounded-full object-cover border border-sky-200 shadow-2xs" 
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="h-7 w-7 rounded-full bg-slate-205 text-slate-600 flex items-center justify-center text-[10px] font-black">
                                      {judge.charAt(0)}
                                    </div>
                                  )}
                                  <span className="text-[10px] text-slate-600 uppercase tracking-tight block leading-none mt-1">{judge}</span>
                                </div>
                              </th>
                            );
                          })}
                          <th className="px-6 py-3 border-b border-slate-200 text-center font-black text-[10px] bg-sky-50 text-sky-850 tracking-wider uppercase border-r border-slate-200">TOTAL FORMASI</th>

                          <th className="px-6 py-4 border-b border-slate-200 text-center bg-indigo-50/80 text-indigo-900 font-extrabold text-sm">TOTAL GABUNGAN</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {catComboResults.map((result, index) => {
                          return (
                            <tr 
                              key={`${result.participantNumber}-${result.category}`} 
                              className={`transition-colors ${index === 0 ? 'bg-amber-50/30' : index === 1 ? 'bg-slate-50/50' : 'hover:bg-slate-50/50'}`}
                            >
                              <td className="px-6 py-4 text-center">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center mx-auto font-bold shadow-sm ${
                                  index === 0 ? 'bg-amber-400 text-amber-900 border-2 border-amber-500 scale-110' :
                                  index === 1 ? 'bg-slate-200 text-slate-700 border-2 border-slate-300 scale-105' :
                                  index === 2 ? 'bg-orange-200 text-orange-850 border-2 border-orange-300 scale-105' :
                                  'bg-slate-100 text-slate-500'
                                }`}>
                                  {index === 0 ? <Trophy className="h-5 w-5" /> : index + 1}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md text-[10px] uppercase">
                                  {result.category || '-'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="font-bold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-md inline-block">
                                  {result.participantNumber}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-bold text-slate-700 text-base border-r border-slate-100">{result.schoolName || '-'}</td>
                              
                              {/* PBB Juries Individual Scores */}
                              {pbbJudgesList.map(judge => (
                                <td key={judge} className="px-6 py-4 text-center bg-emerald-50/5">
                                  <span className="font-mono bg-white border border-slate-200 shadow-inner px-2.5 py-1 rounded text-slate-600 text-xs inline-block min-w-[3rem]">
                                    {result.judgeScores[judge] !== undefined ? result.judgeScores[judge] : '-'}
                                  </span>
                                </td>
                              ))}
                              {/* PBB Total Subtotal */}
                              <td className="px-6 py-4 text-center bg-emerald-50/20 border-r border-slate-200">
                                <span className="font-extrabold text-emerald-700 bg-emerald-100/60 border border-emerald-200 text-xs px-2.5 py-1 rounded-lg">
                                  {result.pbbDantonSubtotal}
                                </span>
                              </td>

                              {/* Formasi & Variasi Individual Scores */}
                              {fvJudgesList.map(judge => (
                                <td key={judge} className="px-6 py-4 text-center bg-sky-50/5">
                                  <span className="font-mono bg-white border border-slate-200 shadow-inner px-2.5 py-1 rounded text-slate-600 text-xs inline-block min-w-[3rem]">
                                    {result.judgeScores[judge] !== undefined ? result.judgeScores[judge] : '-'}
                                  </span>
                                </td>
                              ))}
                              {/* Formasi & Variasi Total Subtotal */}
                              <td className="px-6 py-4 text-center bg-sky-50/20 border-r border-slate-200">
                                <span className="font-extrabold text-sky-850 bg-sky-100/60 border border-sky-200 text-xs px-2.5 py-1 rounded-lg">
                                  {result.formasiVariasiSubtotal}
                                </span>
                              </td>

                              {/* COMBINED GRAND TOTAL */}
                              <td className="px-6 py-4 text-center bg-indigo-50/45">
                                <span className={`text-xl font-black block tracking-tight ${index === 0 ? 'text-amber-600 scale-105' : 'text-indigo-805'}`}>
                                  {result.totalCombined}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}

            {/* Section: Daftar Penilaian Individual */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden animate-in fade-in duration-700">
               <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex items-center gap-3">
                  <div className="bg-indigo-600 p-1.5 rounded-lg">
                    <Medal className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-bold text-slate-800 uppercase tracking-wider text-sm">Log Penilaian Juri (Terbaru)</h3>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                       <tr>
                          <th className="px-6 py-3 border-b border-slate-200">Waktu</th>
                          <th className="px-6 py-3 border-b border-slate-200">Nama Juri</th>
                          <th className="px-6 py-3 border-b border-slate-200">Kategori</th>
                          <th className="px-6 py-3 border-b border-slate-200">No Urut</th>
                          <th className="px-6 py-3 border-b border-slate-200">Nama Sekolah</th>
                          <th className="px-6 py-3 border-b border-slate-200 text-right">Skor Total</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {[...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10).map((record) => (
                          <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                             <td className="px-6 py-3 text-slate-400 font-mono text-xs">
                                {new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </td>
                             <td className="px-6 py-3 font-semibold text-indigo-700">{record.juriName}</td>
                             <td className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">{record.category}</td>
                             <td className="px-6 py-3 font-bold text-slate-800">{record.participantNumber}</td>
                             <td className="px-6 py-3 text-slate-600">{record.schoolName || '-'}</td>
                             <td className="px-6 py-3 text-right">
                                <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-black">
                                   {record.totalScore}
                                </span>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
               </div>
               {records.length > 10 && (
                 <div className="bg-slate-50 p-3 text-center border-t border-slate-200">
                    <p className="text-xs text-slate-400 italic">Menampilkan 10 penilaian terakhir dari total {records.length} data.</p>
                 </div>
               )}
            </div>
          </>
        )}
        </div>
      </main>
    </div>
  );
}
