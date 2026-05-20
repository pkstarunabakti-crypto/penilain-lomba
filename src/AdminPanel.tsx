import React, { useState, useEffect } from 'react';
import { LKBBRecord } from './types';
import Dashboard from './components/Dashboard';
import LKBBList from './components/LKBBList';
import LKBBForm from './components/LKBBForm';
import { FileSignature, LayoutDashboard, ScrollText, ExternalLink, QrCode, Trash2, FileText, Download } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { exportCombinedResultsPDF, exportCombinedResultsCSV } from './lib/exportUtils';
import { getCombinedResults } from './lib/dataUtils';
import { ResultTable } from './components/Dashboard';

const QRAccessManager = () => {
  const [refresh, setRefresh] = useState(0);
  
  const getBaseUrl = () => {
    // Force usage of the public ais-pre- URL if we are in an AI Studio ais-dev- environment
    // This allows barcodes to be scanned without an AI Studio account
    return window.location.origin.replace('ais-dev-', 'ais-pre-');
  };

  const getJuriUrl = () => `${getBaseUrl()}/juri`;
  const getJuriFormasiUrl = () => `${getBaseUrl()}/juri-formasi`;
  const getPublicResultsUrl = () => `${getBaseUrl()}/results`;
  
  const getCekNilaiUrl = () => {
    const cat = (document.getElementById('qr-category') as HTMLSelectElement)?.value || '';
    const num = (document.getElementById('qr-number') as HTMLInputElement)?.value || '';
    
    let url = `${getBaseUrl()}/cek-nilai`;
    const params = new URLSearchParams();
    if (cat) params.set('c', cat);
    if (num) params.set('n', num);
    
    const qs = params.toString();
    return qs ? `${url}?${qs}` : url;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Juri QR */}
      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col items-center">
        <h3 className="font-black text-indigo-700 uppercase tracking-widest text-xs mb-4">Input Nilai PBB</h3>
        <div className="p-4 bg-white rounded-2xl shadow-sm mb-4">
          <QRCodeSVG value={getJuriUrl()} size={160} level="H" includeMargin={true} />
        </div>
        <div className="text-[10px] font-mono text-slate-400 bg-slate-100 px-3 py-2 rounded-lg break-all max-w-[200px] text-center mb-4 min-h-[40px]">
          {getJuriUrl()}
        </div>
        <a href={getJuriUrl()} target="_blank" rel="noopener noreferrer" className="mt-auto px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition w-full">Buka Link</a>
      </div>

      {/* Juri Formasi QR */}
      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col items-center">
        <h3 className="font-black text-blue-700 uppercase tracking-widest text-xs mb-4 text-center">Input Nilai<br/>Formasi & Variasi</h3>
        <div className="p-4 bg-white rounded-2xl shadow-sm mb-4 mt-auto">
          <QRCodeSVG value={getJuriFormasiUrl()} size={160} level="H" includeMargin={true} />
        </div>
        <div className="text-[10px] font-mono text-slate-400 bg-slate-100 px-3 py-2 rounded-lg break-all max-w-[200px] text-center mb-4 min-h-[40px]">
          {getJuriFormasiUrl()}
        </div>
        <a href={getJuriFormasiUrl()} target="_blank" rel="noopener noreferrer" className="mt-auto px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition w-full">Buka Link</a>
      </div>

      {/* Public Results QR */}
      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col items-center">
        <h3 className="font-black text-green-700 uppercase tracking-widest text-xs mb-4">Live Score Penonton</h3>
        <div className="p-4 bg-white rounded-2xl shadow-sm mb-4">
          <QRCodeSVG value={getPublicResultsUrl()} size={160} level="H" includeMargin={true} />
        </div>
        <div className="text-[10px] font-mono text-slate-400 bg-slate-100 px-3 py-2 rounded-lg break-all max-w-[200px] text-center mb-4 min-h-[40px]">
          {getPublicResultsUrl()}
        </div>
        <a href={getPublicResultsUrl()} target="_blank" rel="noopener noreferrer" className="mt-auto px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition w-full">Buka Link</a>
      </div>

      {/* Participant QR */}
      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col items-center">
        <h3 className="font-black text-orange-700 uppercase tracking-widest text-xs mb-4">Cek Nilai Peserta</h3>
        
        <div className="w-full space-y-2 mb-4">
          <select 
            id="qr-category"
            className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs font-bold outline-none"
            onChange={() => setRefresh(r => r + 1)}
          >
            <option value="">Semua Kategori</option>
            <option value="SD">SD</option>
            <option value="SMP">SMP</option>
            <option value="SMK/SMA">SMK/SMA</option>
            <option value="PURNA">PURNA</option>
          </select>
          <input 
            type="text" 
            id="qr-number"
            placeholder="No Urut (Contoh: 001)"
            className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs font-bold outline-none"
            onChange={() => setRefresh(r => r + 1)}
          />
        </div>

        <div className="p-4 bg-white rounded-2xl shadow-sm mb-4">
          <QRCodeSVG value={getCekNilaiUrl()} size={160} level="H" includeMargin={true} />
        </div>
        <div className="text-[10px] font-mono text-slate-400 bg-slate-100 px-3 py-2 rounded-lg break-all max-w-[200px] text-center mb-4 min-h-[40px]">
          {getCekNilaiUrl()}
        </div>
        <a href={getCekNilaiUrl()} target="_blank" rel="noopener noreferrer" className="mt-auto px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition w-full">Buka Link</a>
      </div>
    </div>
  );
};

export default function AdminPanel() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [records, setRecords] = useState<LKBBRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'records' | 'qrcode' | 'rekap'>('dashboard');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Rekap filters
  const [rekapCategory, setRekapCategory] = useState<string>('');
  const [rekapSearch, setRekapSearch] = useState<string>('');

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetFinished, setResetFinished] = useState(false);

  useEffect(() => {
    // Basic session persistence for the session
    const auth = sessionStorage.getItem('adminAuth');
    if (auth === 'true') setIsAdmin(true);

    const unsubscribe = onSnapshot(collection(db, 'evaluations'), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as LKBBRecord);
      // Sort by date descending
      setRecords(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'evaluations');
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') { // Simple default password
      setIsAdmin(true);
      sessionStorage.setItem('adminAuth', 'true');
    } else {
      alert('Password Salah!');
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
           <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
              <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg shadow-indigo-500/20">
                 <FileSignature className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-black text-white text-center uppercase tracking-tight mb-2">Admin Mode</h1>
              <p className="text-slate-400 text-center text-sm mb-8">Masukkan password untuk akses panel kontrol</p>
              
              <form onSubmit={handleLogin} className="space-y-4">
                 <div>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-all font-bold text-center"
                      autoFocus
                    />
                 </div>
                 <button 
                   type="submit"
                   className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-xl shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] uppercase tracking-widest text-xs"
                 >
                   MASUK PANEL ADMIN
                 </button>
              </form>

              <div className="mt-8 pt-8 border-t border-slate-800">
                 <Link to="/results" className="text-slate-500 hover:text-indigo-400 transition-colors text-xs font-bold uppercase tracking-widest block text-center">
                    Lihat Hasil Publik Tanpa Admin
                 </Link>
              </div>
           </div>
        </div>
      </div>
    );
  }

  const selectedRecord = selectedRecordId 
    ? records.find(r => r.id === selectedRecordId) || null 
    : null;

  const handleSaveRecord = async (record: LKBBRecord, closeForm = false) => {
    try {
      await setDoc(doc(db, 'evaluations', record.id), record);
      if (selectedRecordId || closeForm) {
        setIsCreating(false);
        setSelectedRecordId(null);
        setActiveTab('records');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `evaluations/${record.id}`);
    }
  };

  const handleResetAllData = () => {
    if (records.length === 0) {
      alert('Tidak ada data untuk dihapus.');
      return;
    }
    setIsResetModalOpen(true);
    setResetFinished(false);
  };

  const executeResetAllData = async () => {
    try {
      const batchSize = 500;
      const totalRecords = records.length;
      
      for (let i = 0; i < totalRecords; i += batchSize) {
        const batch = writeBatch(db);
        const currentBatch = records.slice(i, i + batchSize);
        
        currentBatch.forEach((record) => {
          batch.delete(doc(db, 'evaluations', record.id));
        });
        
        await batch.commit();
      }
      
      setResetFinished(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'evaluations/all');
    }
  };

  const showForm = isCreating || selectedRecordId;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 font-sans overflow-y-auto md:overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 shadow-xl z-20 flex flex-col md:h-full md:overflow-y-auto">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-indigo-500 p-2 rounded-lg">
            <FileSignature className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight leading-tight">Penilaian<br/>LKBB</h1>
        </div>
        <nav className="p-4 space-y-2 flex-1">
          <button
            onClick={() => { setActiveTab('dashboard'); setIsCreating(false); setSelectedRecordId(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="font-medium">Dashboard</span>
          </button>
          <button
            onClick={() => { setActiveTab('records'); setIsCreating(false); setSelectedRecordId(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'records' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ScrollText className="h-5 w-5" />
            <span className="font-medium">Daftar Penilaian</span>
          </button>
          <button
            onClick={() => { setActiveTab('qrcode'); setIsCreating(false); setSelectedRecordId(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'qrcode' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <QrCode className="h-5 w-5" />
            <span className="font-medium">Barcode Nilai</span>
          </button>
          <button
            onClick={() => { setActiveTab('rekap'); setIsCreating(false); setSelectedRecordId(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'rekap' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="h-5 w-5" />
            <span className="font-medium">Rekap Panitia</span>
          </button>
        </nav>
        
        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            to="/results"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
          >
            <ExternalLink className="h-5 w-5" />
            <span className="font-medium">Lihat Hasil Publik</span>
          </Link>
          <div className="pt-2">
            <p className="text-[10px] font-black text-slate-500 uppercase px-4 mb-2 tracking-widest">Akses Juri</p>
            <Link
              to="/juri"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors bg-indigo-900/40 text-indigo-300 border border-indigo-500/20 hover:text-white hover:bg-indigo-600 mb-2"
            >
              <FileSignature className="h-5 w-5" />
              <span className="font-medium text-xs">Juri PBB & Danton</span>
            </Link>
            <Link
              to="/juri-formasi"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors bg-blue-900/40 text-blue-300 border border-blue-500/20 hover:text-white hover:bg-blue-600 mb-2"
            >
              <FileSignature className="h-5 w-5" />
              <span className="font-medium text-xs flex-1">Juri Formasi & Variasi</span>
            </Link>
          </div>
          
          <div className="pt-4 mt-4 border-t border-slate-800 space-y-2">
             <button
              onClick={() => {
                if (confirm('Tambahkan data simulasi untuk database?')) {
                  const generateSeed = async () => {
                     try {
                        const categories = ['SD', 'SMP', 'SMK/SMA'];
                        const schools = ['SMPN 1', 'SMPN 2', 'SMAN 1', 'SMAN 3', 'SDN 10', 'SDN 5'];
                        const jurisPBB = ["Kang APIP", "Pak IAN"];
                        const jurisFormasi = ["Kang Zulmu", "Kang Rizal"];
                        
                        // Seed 5 participants
                        const batch = writeBatch(db);
                        for (let p=1; p<=5; p++) {
                           const cat = categories[Math.floor(Math.random() * categories.length)];
                           const school = schools[Math.floor(Math.random() * schools.length)];
                           const pNum = p.toString().padStart(3, '0');
                           
                           // Juri PBB
                           jurisPBB.forEach((juri, i) => {
                             const recId = `seed-pbb-${p}-${i}`;
                             const scores = { 1: 58, 2: 25, 3: 30, 4: 28, 5: 33, 6: 30, 7: 40, 8: 25, 9: 33, 10: 35, 11: 35, 12: 27, 13: 29, 14: 23, 15: 20, 16: 20, 17: 28, 18: 20, 19: 20, 20: 20, 21: 28, 22: 30, 23: 20, 24: 20, 25: 58, 101: 10, 102: 12, 103: 10, 104: 10, 105: 10 };
                             
                             batch.set(doc(db, 'evaluations', recId), {
                               id: recId,
                               juriName: juri,
                               participantNumber: pNum,
                               schoolName: school,
                               category: cat,
                               date: new Date().toISOString(),
                               scores,
                               totalScore: Object.values(scores).reduce((a, b) => a + b, 0)
                             });
                           });

                           // Juri Formasi
                           jurisFormasi.forEach((juri, i) => {
                             const recId = `seed-formasi-${p}-${i}`;
                             const scores = { 
                               201: 6, 202: 4, 203: 5, 204: 3, 205: 6, 206: 5, 207: 6, 208: 3, 209: 3, 210: 4, 211: 3, 212: 4, 213: 5, 214: 7,
                               301: 8, 302: 5, 303: 6, 304: 5, 305: 7, 306: 8, 307: 8, 308: 5, 309: 6, 310: 5, 311: 6, 312: 5, 313: 5, 314: 6, 315: 6, 316: 8
                             };
                             
                             batch.set(doc(db, 'evaluations', recId), {
                               id: recId,
                               juriName: juri,
                               participantNumber: pNum,
                               schoolName: school,
                               category: cat,
                               date: new Date().toISOString(),
                               scores,
                               totalScore: Object.values(scores).reduce((a, b) => a + b, 0)
                             });
                           });
                        }
                        await batch.commit();
                        alert('Data simulasi berhasil ditambahkan!');
                     } catch (err) {
                        alert('Gagal menambahkan data');
                     }
                  };
                  generateSeed();
                }
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-emerald-400 hover:text-white hover:bg-emerald-600/20"
            >
              <FileText className="h-5 w-5" />
              <span className="font-medium">Generate Seed Data</span>
            </button>
             <button
              onClick={handleResetAllData}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-red-400 hover:text-white hover:bg-red-600/20"
            >
              <Trash2 className="h-5 w-5" />
              <span className="font-medium">Reset All History</span>
            </button>
          </div>

          <button
            onClick={() => {
              sessionStorage.removeItem('adminAuth');
              window.location.reload();
            }}
            className="w-full flex items-center justify-center gap-2 mt-4 px-4 py-2 text-[10px] font-black text-red-400 hover:text-white hover:bg-red-600/20 border border-red-500/20 rounded-lg transition-all uppercase tracking-widest"
          >
            Keluar Admin
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 md:overflow-y-auto overflow-visible min-h-screen md:min-h-0">
        <div className="max-w-6xl mx-auto">
          {showForm ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">
                  {selectedRecordId ? 'Edit Penilaian' : 'Penilaian Baru'}
                </h2>
                <button 
                  onClick={() => { setIsCreating(false); setSelectedRecordId(null); }}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Batal
                </button>
              </div>
              <LKBBForm 
                initialRecord={selectedRecord} 
                onSave={handleSaveRecord} 
                onDelete={async (id) => {
                  try {
                    await deleteDoc(doc(db, 'evaluations', id));
                    setSelectedRecordId(null);
                    setIsCreating(false);
                    setActiveTab('records');
                  } catch (error) {
                    handleFirestoreError(error, OperationType.DELETE, `evaluations/${id}`);
                  }
                }}
                onBack={() => { setIsCreating(false); setSelectedRecordId(null); }}
                records={records}
              />
            </div>
          ) : activeTab === 'dashboard' ? (
            <Dashboard 
              records={records} 
            />
          ) : activeTab === 'qrcode' ? (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-12 text-center max-w-5xl mx-auto">
               <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <QrCode className="h-10 w-10 text-indigo-600" />
               </div>
               <h2 className="text-3xl font-black text-slate-900 uppercase mb-2">Barcode Akses Aplikasi</h2>
               <p className="text-slate-500 mb-8 max-w-2xl mx-auto">
                 Scan barcode ini untuk memberikan akses ke masing-masing pengguna. Barcode ini bisa diakses di perangkat mana pun tanpa perlu login AI Studio.
               </p>
               
               <div className="mb-10">
                  <QRAccessManager />
               </div>
               
               <button 
                  onClick={() => window.print()}
                  className="px-8 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 mx-auto w-full md:w-auto min-w-[250px] mb-8"
               >
                  CETAK BARCODE
               </button>
            </div>
           ) : activeTab === 'rekap' ? (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-12 text-center max-w-4xl mx-auto">
               <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="h-10 w-10 text-green-600" />
               </div>
               <h2 className="text-3xl font-black text-slate-900 uppercase mb-2">Rekapitulasi Panitia</h2>
               <p className="text-slate-500 mb-8 font-medium leading-relaxed">
                  Unduh atau lihat data rekapitulasi nilai untuk seluruh peserta.
               </p>

                 {(() => {
                 const uniqueCategories = Array.from(new Set(records.map(r => r.category || '-'))).sort() as string[];
                 const filteredRekapRecords = records.filter(r => {
                   const matchCat = rekapCategory ? (r.category || '-') === rekapCategory : true;
                   const matchNum = rekapSearch ? r.participantNumber.toLowerCase().includes(rekapSearch.toLowerCase()) : true;
                   return matchCat && matchNum;
                 });
                 const { combinedResults, allJudges } = getCombinedResults(filteredRekapRecords);

                 return (
                   <>
                     <div className="flex flex-col sm:flex-row gap-4 mb-8">
                       <input 
                         type="text" 
                         placeholder="Cari No Peserta..." 
                         value={rekapSearch}
                         onChange={e => setRekapSearch(e.target.value)}
                         className="flex-1 px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-medium text-slate-700"
                       />
                       <select 
                         value={rekapCategory}
                         onChange={e => setRekapCategory(e.target.value)}
                         className="flex-1 px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-medium text-slate-700 bg-white"
                       >
                         <option value="">Semua Tingkatan</option>
                         {uniqueCategories.map(cat => (
                           <option key={cat} value={cat}>{cat === '-' ? 'Umum / Lainnya' : cat}</option>
                         ))}
                       </select>
                     </div>
                     
                     <div className="grid grid-cols-1 gap-4 mb-12 max-w-lg mx-auto">
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-left">
                           <h3 className="font-black text-slate-800 uppercase text-sm mb-4">REKAP PENILAIAN LENGKAP</h3>
                           <div className="space-y-3">
                              <button 
                                 onClick={() => {
                                    exportCombinedResultsCSV(combinedResults, allJudges);
                                 }}
                                 className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all text-sm shadow-sm"
                              >
                                 <Download className="h-4 w-4" />
                                 EXCEL / CSV
                              </button>
                              <button 
                                 onClick={() => {
                                    exportCombinedResultsPDF(combinedResults, allJudges);
                                 }}
                                 className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all text-sm shadow-sm"
                              >
                                 <Download className="h-4 w-4" />
                                 DOKUMEN PDF
                              </button>
                           </div>
                        </div>
                     </div>

                     <div className="text-left w-full max-w-full overflow-hidden">
                       <ResultTable 
                         title="Hasil Penilaian Keseluruhan" 
                         results={combinedResults} 
                         judges={allJudges} 
                       />
                     </div>
                   </>
                 );
               })()}
            </div>
          ) : (
            <LKBBList 
              records={records} 
              onCreateNew={() => setIsCreating(true)}
              onDeleteAll={handleResetAllData}
              onDeleteRecord={async (id) => {
                if (confirm('Konfirmasi hapus data penilaian ini?')) {
                  try {
                    await deleteDoc(doc(db, 'evaluations', id));
                  } catch (error) {
                    handleFirestoreError(error, OperationType.DELETE, `evaluations/${id}`);
                  }
                }
              }}
              onSelectRecord={(id) => setSelectedRecordId(id)}
            />
          )}
        </div>
      </main>
      
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100">
            {resetFinished ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">Selesai!</h3>
                <p className="text-slate-500 mb-8">Semua riwayat penilaian telah berhasil dihapus.</p>
                <button
                  onClick={() => setIsResetModalOpen(false)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-colors"
                >
                  Tutup
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trash2 className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tight">Hapus Semua?</h3>
                <p className="text-slate-500 mb-8 text-sm">
                  PERINGATAN KRITIKAL: Anda akan menghapus <strong className="text-slate-800">SELURUH</strong> history penilaian. Tindakan ini tidak dapat dibatalkan dan seluruh data akan hilang selamanya.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsResetModalOpen(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={executeResetAllData}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
                  >
                    Ya, Hapus!
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
