import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from './lib/firebase';
import { LKBBRecord } from './types';
import { LKBB_CATEGORIES, JURI_AVATARS } from './constants';
import { Search, Trophy, School, User, Hash, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ParticipantPersonalResult() {
  const [participantNumber, setParticipantNumber] = useState('');
  const [results, setResults] = useState<LKBBRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const catParam = params.get('c');
    const numParam = params.get('n');
    
    if (numParam) {
      setParticipantNumber(numParam);
      handleSearch(numParam, catParam || undefined);
    }
  }, []);

  const handleSearch = (customNum?: string, customCat?: string) => {
    let num = participantNumber.trim();
    if (typeof customNum === 'string') {
      num = customNum;
    }
    if (!num) return;
    
    setLoading(true);
    setSearched(true);
    
    // Query records for this participant number
    let q = query(
      collection(db, 'evaluations'),
      where('participantNumber', '==', num)
    );

    // Filter by category if provided
    if (customCat) {
      q = query(q, where('category', '==', customCat));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LKBBRecord[];
      
      setResults(records);
      setLoading(false);
    });

    return () => unsubscribe();
  };

  const getJudges = () => Array.from(new Set(results.map(r => r.juriName)));
  
  const calculateTotalPoints = () => {
    if (results.length === 0) return 0;
    return results.reduce((sum: number, r: LKBBRecord) => {
      const scoresArr = Object.values(r.scores) as number[];
      return sum + scoresArr.reduce((a: number, b: number) => a + (Number(b) || 0), 0);
    }, 0);
  };

  const getCategoryScores = (catId: string) => {
    if (results.length === 0) return 0;
    const cat = LKBB_CATEGORIES.find(c => c.id === catId);
    if (!cat) return 0;
    
    return results.reduce((acc: number, r: LKBBRecord) => {
      const catSum = cat.items.reduce((s: number, item: any) => s + (Number(r.scores[item.id]) || 0), 0);
      return acc + catSum;
    }, 0);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-28">
        <div className="max-w-4xl mx-auto pb-16">
        <header className="text-center mb-12">
          <div className="inline-block p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-200 mb-4">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Cek Nilai Peserta</h1>
          <p className="text-slate-500 font-medium">Masukkan nomor urut Anda untuk melihat hasil penilaian</p>
        </header>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-10 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Hash className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Contoh: 001"
                value={participantNumber}
                onChange={(e) => setParticipantNumber(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-0 outline-none transition-all font-bold text-lg"
              />
            </div>
            <button
              onClick={() => handleSearch()}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
            >
              <Search className="h-5 w-5" />
              CARI NILAI
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {searched && !loading && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12" // Increased spacing between category blocks
            >
              {[...new Set(results.map(r => r.category || '-'))].sort().map(catName => {
                const catResults = results.filter(r => (r.category || '-') === catName);
                
                const calculateLocalTotalPoints = () => {
                  if (catResults.length === 0) return 0;
                  return catResults.reduce((sum: number, r: LKBBRecord) => {
                    const scoresArr = Object.values(r.scores) as number[];
                    return sum + scoresArr.reduce((a: number, b: number) => a + (Number(b) || 0), 0);
                  }, 0);
                };

                const getLocalCategoryScores = (catId: string) => {
                  if (catResults.length === 0) return 0;
                  const cat = LKBB_CATEGORIES.find(c => c.id === catId);
                  if (!cat) return 0;
                  
                  return catResults.reduce((acc: number, r: LKBBRecord) => {
                    const catSum = cat.items.reduce((s: number, item: any) => s + (Number(r.scores[item.id]) || 0), 0);
                    return acc + catSum;
                  }, 0);
                };

                return (
                  <div key={catName} className="space-y-6">
                    {/* Header Info */}
                    <div className="bg-gradient-to-br from-indigo-600 to-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 flex opacity-10 pointer-events-none">
                         <Trophy className="w-48 h-48 -mr-10 -mt-10" />
                      </div>
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">{catResults[0].category || 'UMUM'}</span>
                            <span className="text-white/60 text-xs font-bold">NO URUT: {catResults[0].participantNumber}</span>
                          </div>
                          <h2 className="text-3xl md:text-4xl font-black uppercase">{catResults[0].schoolName}</h2>
                        </div>
                        <div className="bg-yellow-400 p-4 rounded-2xl text-center min-w-[160px] shadow-lg transform hover:scale-105 transition-transform">
                          <div className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-1">Total Poin Gabungan</div>
                          <div className="text-5xl font-black text-indigo-900 leading-none">{calculateLocalTotalPoints()}</div>
                        </div>
                      </div>
                      
                      <div className="mt-8 flex flex-wrap gap-4 border-t border-white/10 pt-6 relative z-10">
                         <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-xl text-xs font-bold border border-white/5">
                            <User className="h-4 w-4 text-white/40" />
                            <span>{catResults.length} Juri telah digabungkan</span>
                         </div>
                         {catResults.map(r => {
                            const rTotal = Object.values(r.scores).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
                            const avatar = JURI_AVATARS[r.juriName];
                            return (
                               <div key={r.id} className="flex items-center gap-2.5 bg-white/10 px-3.5 py-2 rounded-xl text-xs font-bold border border-white/5 shadow-sm transform hover:scale-[1.02] transition-all">
                                  {avatar ? (
                                     <img 
                                        src={avatar} 
                                        alt={r.juriName} 
                                        className="h-6 w-6 rounded-full border border-white/20 object-cover shadow-sm" 
                                        referrerPolicy="no-referrer" 
                                     />
                                  ) : (
                                     <div className="h-6 w-6 rounded-full bg-indigo-500/80 flex items-center justify-center text-[10px] text-white font-bold">
                                        {r.juriName.charAt(0)}
                                     </div>
                                  )}
                                  <span className="text-white uppercase tracking-wider">{r.juriName}:</span>
                                  <span className="text-emerald-300 font-extrabold ml-1">{rTotal} Pts</span>
                               </div>
                            );
                         })}
                      </div>
                    </div>

                    {/* Category Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {LKBB_CATEGORIES.filter(cat => catResults.some(r => cat.items.some(item => r.scores[item.id] !== undefined))).map(cat => (
                        <div key={cat.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <h3 className="font-black text-slate-800 uppercase text-sm tracking-tight">{cat.title.replace('FORMAT PENILAIAN ', '')}</h3>
                            </div>
                            <span className="bg-indigo-50 text-indigo-700 font-black px-3 py-1 rounded-lg text-lg">
                              {getLocalCategoryScores(cat.id)}
                            </span>
                          </div>
                          <div className="space-y-3">
                            {cat.items.map(item => {
                              const itemSum = catResults.reduce((acc, r) => acc + (Number(r.scores[item.id]) || 0), 0);
                              return (
                                <div key={item.id} className="flex flex-col xl:flex-row xl:justify-between xl:items-center py-2.5 border-b border-slate-50 last:border-0 gap-2">
                                  <span className="text-xs text-slate-500 font-medium">{item.name}</span>
                                  <div className="flex flex-wrap items-center gap-1.5 w-full xl:w-auto xl:justify-end">
                                     {catResults.map(r => (
                                        <span key={`${r.id}-${item.id}`} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200" title={r.juriName}>
                                           {r.juriName.split(' ')[0]}: <span className="font-bold text-slate-700">{r.scores[item.id] || 0}</span>
                                        </span>
                                     ))}
                                     <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md ml-1 inline-block min-w-[3rem] text-center shadow-sm">{itemSum}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {searched && !loading && results.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="bg-white inline-block p-8 rounded-full mb-4 shadow-sm border border-slate-100">
                <Search className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Nilai Belum Ditemukan</h3>
              <p className="text-slate-500">Pastikan nomor urut yang Anda masukkan benar atau juri belum selesai melakukan input.</p>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
