import React from 'react';
import { LKBBRecord } from '../types';
import { Users, FileText, TrendingUp, Trophy, Medal, Download } from 'lucide-react';
import { exportCombinedResultsPDF, exportCombinedResultsCSV } from '../lib/exportUtils';
import { getCombinedResults } from '../lib/dataUtils';

export default function Dashboard({ records }: { records: LKBBRecord[] }) {
  const [filterCategory, setFilterCategory] = React.useState<string>('');
  
  const filteredRecords = filterCategory 
    ? records.filter(r => r.category === filterCategory)
    : records;

  const totalEvaluations = filteredRecords.length;
  
  const uniqueParticipants = new Set(filteredRecords.map(r => r.participantNumber)).size;

  const averageScore = totalEvaluations > 0 
    ? (filteredRecords.reduce((a, b) => a + b.totalScore, 0) / totalEvaluations).toFixed(1)
    : 0;

  const maxScoreRecord = totalEvaluations > 0
    ? filteredRecords.reduce((prev, current) => (prev.totalScore > current.totalScore) ? prev : current)
    : null;

  const { combinedResults, allJudges } = getCombinedResults(filteredRecords);
  
  const uniqueCategories = Array.from(new Set(records.map(r => r.category || '-'))).sort() as string[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard Statistik</h2>
          <p className="text-slate-500 mt-1">Ringkasan hasil penilaian LKBB</p>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Filter Tingkat:</label>
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-white border-2 border-slate-100 px-4 py-2 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-500 text-sm shadow-sm"
          >
            <option value="">Semua Tingkatan</option>
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{cat === '-' ? 'Umum / Lainnya' : cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<FileText className="h-6 w-6 text-blue-600" />}
          label="Total Penilaian"
          value={totalEvaluations.toString()}
          bgColor="bg-blue-50"
        />
        <StatCard 
          icon={<Users className="h-6 w-6 text-purple-600" />}
          label="Peserta Dievaluasi"
          value={uniqueParticipants.toString()}
          bgColor="bg-purple-50"
        />
        <StatCard 
          icon={<TrendingUp className="h-6 w-6 text-emerald-600" />}
          label="Rata-rata Nilai"
          value={averageScore.toString()}
          bgColor="bg-emerald-50"
        />
        <StatCard 
          icon={<Trophy className="h-6 w-6 text-amber-600" />}
          label="Nilai Tertinggi"
          value={maxScoreRecord ? maxScoreRecord.totalScore.toString() : '0'}
          subValue={maxScoreRecord ? `Peserta ${maxScoreRecord.participantNumber}` : undefined}
          bgColor="bg-amber-50"
        />
      </div>

      {/* Tampilan Peserta Terbaik (Jika Ada) */}
      {maxScoreRecord && (
        <div className="mt-8 bg-gradient-to-br from-amber-100 to-orange-50 p-6 md:p-8 rounded-2xl border border-amber-200 shadow-sm flex flex-col md:flex-row items-center gap-6">
          <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-md">
            <Medal className="h-10 w-10 text-amber-500" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-sm font-bold text-amber-800 uppercase tracking-widest mb-1">Peserta Terbaik Saat Ini</h3>
            <p className="text-3xl font-black text-slate-800 mb-2">Peserta {maxScoreRecord.participantNumber}</p>
            <p className="text-amber-700 font-semibold mb-1">{maxScoreRecord.schoolName || '-'}</p>
            <p className="text-amber-700 font-medium text-sm">Dinilai oleh Juri: {maxScoreRecord.juriName}</p>
          </div>
          <div className="text-center md:text-right bg-white p-4 rounded-xl shadow-sm border border-amber-100">
            <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Total Skor</p>
            <p className="text-4xl font-black text-amber-600">{maxScoreRecord.totalScore}</p>
          </div>
        </div>
      )}

      {totalEvaluations > 0 && uniqueCategories.map(cat => {
        const catResults = combinedResults.filter(r => (r.category || '-') === cat);
        return (
          <ResultTable
            key={cat}
            title={`Rekapitulasi Nilai Akhir - ${cat === '-' ? 'Umum' : cat}`}
            results={catResults}
            judges={allJudges}
          />
        );
      })}

      {totalEvaluations === 0 && (
        <div className="mt-12 bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm">
          <div className="bg-slate-100 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Belum ada data penilaian</h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto">
            Silakan beralih ke tab Daftar Penilaian untuk menambahkan format penilaian baru.
          </p>
        </div>
      )}
    </div>
  );
}

export function ResultTable({ title, results, judges }: { title: string, results: any[], judges: string[], key?: any }) {
  if (results.length === 0) return null;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-8">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          <h3 className="font-bold text-slate-800 uppercase tracking-wider">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => exportCombinedResultsCSV(results, judges)}
            className="flex items-center gap-2 text-xs font-bold bg-green-500 text-white border border-green-600 px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            UNDUH REKAP EXCEL
          </button>
          <button 
            onClick={() => exportCombinedResultsPDF(results, judges)}
            className="flex items-center gap-2 text-xs font-bold bg-white text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            DOWNLOAD PDF
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold">
            <tr>
              <th className="px-6 py-4 border-b border-slate-200 text-center w-16">Rank</th>
              <th className="px-6 py-4 border-b border-slate-200">Kategori</th>
              <th className="px-6 py-4 border-b border-slate-200">No Urut</th>
              <th className="px-6 py-4 border-b border-slate-200">Nama Sekolah</th>
              {judges.map(judge => (
                <th key={judge} className="px-6 py-4 border-b border-slate-200 text-center">Juri {judge}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {results.map((result, index) => {
              return (
                <tr key={`${result.participantNumber}-${result.category}`} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-center">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center mx-auto font-bold ${
                      index === 0 ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                      index === 1 ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                      index === 2 ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                      'bg-slate-50 text-slate-400'
                    }`}>
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-600 uppercase">
                      {result.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700">{result.participantNumber}</td>
                  <td className="px-6 py-4 font-medium text-slate-600">{result.schoolName || '-'}</td>
                  {judges.map(judge => (
                    <td key={judge} className="px-6 py-4 text-center">
                      <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                        {result.judgeScores[judge] || '-'}
                      </span>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subValue, bgColor }: { icon: React.ReactNode, label: string, value: string, subValue?: string, bgColor: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
      <div className={`p-4 rounded-xl ${bgColor}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        {subValue && (
          <p className="text-xs font-semibold text-amber-600 mt-1">{subValue}</p>
        )}
      </div>
    </div>
  );
}
