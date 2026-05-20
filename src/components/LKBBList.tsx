import React, { useState, useRef, useEffect } from 'react';
import { LKBBRecord } from '../types';
import { Search, Plus, Trash2, ChevronRight, Download, ScrollText, Users } from 'lucide-react';
import { exportToCSV, exportToPDF } from '../lib/exportUtils';

interface LKBBListProps {
  records: LKBBRecord[];
  onCreateNew: () => void;
  onDeleteRecord: (id: string) => void;
  onDeleteAll?: () => void;
  onSelectRecord: (id: string) => void;
}

export default function LKBBList({ records, onCreateNew, onDeleteRecord, onDeleteAll, onSelectRecord }: LKBBListProps) {
  const [search, setSearch] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredRecords = records.filter(r => 
    r.participantNumber.toLowerCase().includes(search.toLowerCase()) || 
    r.juriName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Daftar Penilaian</h2>
          <p className="text-slate-500 mt-1">Riwayat penilaian LKBB yang telah disimpan</p>
        </div>
        <div className="flex items-center gap-2">
          {records.length > 0 && (
            <div className="relative" ref={exportMenuRef}>
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors shadow-sm"
              >
                <Download className="h-5 w-5" />
                Ekspor
              </button>
              
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-20">
                  <button 
                    onClick={() => { exportToCSV(records, 'rekap_penilaian_lkbb'); setShowExportMenu(false); }}
                    className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                  >
                    Ekspor Excel / CSV
                  </button>
                  <button 
                    onClick={() => { exportToPDF(records, 'rekap_penilaian_lkbb', 'Laporan Rekap Penilaian LKBB'); setShowExportMenu(false); }}
                    className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Ekspor PDF
                  </button>
                </div>
              )}
            </div>
          )}
          
          <button 
            onClick={onCreateNew}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors shadow-sm"
          >
            <Plus className="h-5 w-5" />
            Penilaian Baru
          </button>

          {records.length > 0 && onDeleteAll && (
            <button 
              onClick={onDeleteAll}
              className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 font-black transition-colors shadow-sm text-xs uppercase tracking-widest border border-red-200"
            >
              <Trash2 className="h-4 w-4" />
              Hapus Semua
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center">
        <Search className="h-5 w-5 text-slate-400 ml-2 mr-3" />
        <input 
          type="text" 
          placeholder="Cari berdasarkan No Peserta atau Nama Juri..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredRecords.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredRecords.map(record => (
              <div key={record.id} className="p-4 hover:bg-slate-50 flex items-center justify-between group transition-colors">
                <div className="flex-1 min-w-0" onClick={() => onSelectRecord(record.id)}>
                  <div className="flex items-center gap-4 cursor-pointer">
                    <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-700 font-bold">
                      {record.participantNumber}
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-slate-800 truncate">Peserta No: {record.participantNumber}</h4>
                      <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                        <span className="flex items-center gap-1"><Users className="h-4 w-4" /> Juri: {record.juriName}</span>
                        <span className="text-slate-300">•</span>
                        <span>{record.schoolName || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 ml-4">
                  <div className="hidden sm:block text-right">
                    <p className="text-xs text-slate-500 mb-0.5">Total Nilai</p>
                    <p className="font-bold text-indigo-700 text-lg">{record.totalScore}</p>
                  </div>
                  <div className="hidden sm:block text-right">
                    <p className="text-xs text-slate-500 mb-0.5">Tanggal</p>
                    <p className="font-medium text-slate-800">{new Date(record.date).toLocaleDateString('id-ID')}</p>
                  </div>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteRecord(record.id); }}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus Penilaian"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => onSelectRecord(record.id)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-slate-500 flex flex-col items-center">
            <ScrollText className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-700">
              {search ? 'Penilaian tidak ditemukan.' : 'Belum ada data penilaian LKBB.'}
            </p>
            <p className="mt-1">
              {!search && 'Klik "Penilaian Baru" untuk mulai mengisi format penilaian.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
