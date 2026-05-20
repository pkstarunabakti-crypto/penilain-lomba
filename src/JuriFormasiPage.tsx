import React, { useState, useEffect } from 'react';
import { Share2 } from 'lucide-react';
import { LKBBRecord } from './types';
import LKBBForm from './components/LKBBForm';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';

export default function JuriFormasiPage() {
  const [records, setRecords] = useState<LKBBRecord[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'evaluations'), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as LKBBRecord);
      setRecords(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'evaluations');
    });
    return () => unsubscribe();
  }, []);

  const handleSaveRecord = async (record: LKBBRecord) => {
    try {
      await setDoc(doc(db, 'evaluations', record.id), record);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `evaluations/${record.id}`);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 border-t-4 border-indigo-600 font-sans overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32">
        <div className="max-w-6xl mx-auto mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight uppercase">Panel Juri</h1>
          <p className="text-slate-500 font-medium leading-relaxed">
            Input Nilai Formasi & Variasi
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mb-4 flex justify-end">
        <button 
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert(`Link Juri Formasi berhasil disalin!`);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"
        >
          <Share2 className="h-4 w-4" />
          Bagikan Link Juri Formasi
        </button>
      </div>

        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <LKBBForm 
            onSave={handleSaveRecord} 
            onBack={() => {
              if (confirm('Keluar dari halaman input juri?')) {
                window.location.href = '/';
              }
            }}
            records={records}
            juriType="FORMASI_VARIASI"
          />
        </div>
      </div>
    </div>
  );
}
