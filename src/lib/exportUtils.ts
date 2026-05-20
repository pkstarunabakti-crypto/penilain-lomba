import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LKBBRecord } from '../types';
import { LKBB_CATEGORIES } from '../constants';

export function exportToCSV(records: LKBBRecord[], filename: string) {
  const headers = ['Tanggal', 'Juri', 'No Peserta', 'Asal Sekolah', 'Total Nilai'];
  const rows: string[][] = [];

  records.forEach(record => {
    rows.push([
      new Date(record.date).toLocaleDateString('id-ID'),
      record.juriName,
      record.participantNumber,
      record.schoolName || '-',
      record.totalScore.toString()
    ]);
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPDF(records: LKBBRecord[], filename: string, title: string) {
  const doc = new jsPDF();
  
  doc.setFontSize(16);
  doc.text(title, 14, 22);
  doc.setFontSize(10);
  doc.text(`Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID')}`, 14, 30);

  const tableColumn = ['Tanggal', 'Juri', 'No Peserta', 'Asal Sekolah', 'Total Nilai'];
  const tableRows: any[][] = [];

  records.forEach(record => {
    tableRows.push([
      { content: new Date(record.date).toLocaleDateString('id-ID') },
      record.juriName,
      record.participantNumber,
      record.schoolName || '-',
      { content: record.totalScore.toString(), styles: { halign: 'right' } }
    ]);
  });

  autoTable(doc, {
    startY: 35,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] }, // indigo-600
  });

  doc.save(`${filename}.pdf`);
}

export function exportDetailToPDF(record: LKBBRecord) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('FORMAT PENILAIAN LKBB', 105, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`NO URUT : ${record.participantNumber}`, 14, 25);
  doc.text(`NAMA SEKOLAH : ${record.schoolName}`, 110, 25);
  doc.text(`Juri : ${record.juriName}`, 14, 32);
  doc.text(`Tanggal : ${new Date(record.date).toLocaleDateString('id-ID')}`, 110, 32);

  const body: any[][] = [];
  
  const filteredCategories = LKBB_CATEGORIES.filter(cat => {
    // Check if record has any scores in this category
    return cat.items.some(item => record.scores[item.id] !== undefined);
  });

  if (filteredCategories.length === 0) {
     // fallback if no scores
     filteredCategories.push(LKBB_CATEGORIES[0]);
  }
  
  filteredCategories.forEach(category => {
    body.push([
      { content: category.title, colSpan: 13, styles: { fillColor: [255, 240, 0], fontStyle: 'bold', textColor: [0, 0, 0] } }
    ]);
    
    category.items.forEach(item => {
      const selectedScore = record.scores[item.id];
      const flatScores = item.scores.flatMap(s => s.values.map(v => ({ label: s.label, value: v })));
      
      const scoreCells = Array(10).fill('');
      flatScores.forEach((s, idx) => {
        if (idx < 10) {
          if (s.value === selectedScore) {
            scoreCells[idx] = { content: s.value.toString(), styles: { fillColor: [200, 220, 255], fontStyle: 'bold' } };
          } else {
            // Option to show small placeholders? Let's just leave empty or show the value faintly
            scoreCells[idx] = s.value.toString();
          }
        }
      });

      body.push([
        (item as any).no || item.id,
        item.name,
        ...scoreCells,
        { content: selectedScore || '', styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } }
      ]);
    });
    
    const categoryTotal = category.items.reduce((acc, it) => acc + (record.scores[it.id] || 0), 0);
    body.push([
      { content: `JUMLAH ${category.title.split('.')[0]}`, colSpan: 12, styles: { halign: 'right', fontStyle: 'bold', fillColor: [240, 240, 240] } },
      { content: categoryTotal.toString(), styles: { halign: 'center', fontStyle: 'bold', fillColor: [240, 240, 240] } }
    ]);
  });

  autoTable(doc, {
    startY: 40,
    head: [
      ['NO', 'GERAKAN', { content: 'NILAI', colSpan: 10 }, 'JUMLAH'],
    ],
    body: body,
    theme: 'grid',
    headStyles: { fillColor: [255, 220, 0], textColor: [0, 0, 0], halign: 'center', fontSize: 9 },
    styles: { fontSize: 7, cellPadding: 1.5 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 70 },
      2: { cellWidth: 9, halign: 'center' },
      3: { cellWidth: 9, halign: 'center' },
      4: { cellWidth: 9, halign: 'center' },
      5: { cellWidth: 9, halign: 'center' },
      6: { cellWidth: 9, halign: 'center' },
      7: { cellWidth: 9, halign: 'center' },
      8: { cellWidth: 9, halign: 'center' },
      9: { cellWidth: 9, halign: 'center' },
      10: { cellWidth: 9, halign: 'center' },
      11: { cellWidth: 9, halign: 'center' },
      12: { cellWidth: 15, halign: 'center' },
    }
  });
  
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL NILAI KESELURUHAN: ${record.totalScore}`, 14, finalY);

  // Signatures
  doc.setFontSize(10);
  doc.text('Juri Pendamping', 40, finalY + 20, { align: 'center' });
  doc.text('( ......................................... )', 40, finalY + 45, { align: 'center' });
  
  doc.text('Juri PBB & Danton', 150, finalY + 20, { align: 'center' });
  doc.text(`( ${record.juriName} )`, 150, finalY + 45, { align: 'center' });

  doc.save(`penilaian_${record.schoolName}_${record.participantNumber}.pdf`);
}

export function exportCombinedResultsCSV(
  results: { participantNumber: string; category: string; schoolName: string; judgeScores: Record<string, number>; totalCombined: number }[],
  allJudges: string[]
) {
  const headers = ['Rank', 'Kategori', 'No Urut', 'Nama Sekolah', ...allJudges.map(j => `Juri ${j}`)];
  const rows: string[][] = [];

  results.forEach((result, index) => {
    const judgeCells = allJudges.map(judge => (result.judgeScores[judge] || 0).toString());
    rows.push([
      (index + 1).toString(),
      result.category,
      result.participantNumber,
      result.schoolName || '-',
      ...judgeCells
    ]);
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `rekap_panitia_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportCombinedResultsPDF(
  results: { 
    participantNumber: string; 
    category: string; 
    schoolName: string; 
    judgeScores: Record<string, number>; 
    pbbDantonSubtotal?: number;
    formasiVariasiSubtotal?: number;
    totalCombined: number;
  }[],
  allJudges: string[]
) {
  const doc = new jsPDF();
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('REKAPITULASI NILAI AKHIR (GABUNGAN JURI)', 105, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID')}`, 14, 25);

  const tableColumn = [
    'Rank', 
    'Kategori', 
    'No Urut', 
    'Nama Sekolah', 
    'Kang APIP (PBB)', 
    'Pak IAN (PBB)', 
    'TOTAL PBB', 
    'Kang Zulmu (FV)', 
    'Kang Rizal (FV)', 
    'TOTAL FORMASI', 
    'TOTAL AKHIR'
  ];
  const tableRows: any[][] = [];

  results.forEach((result, index) => {
    const pbbSum = result.pbbDantonSubtotal !== undefined ? result.pbbDantonSubtotal : (
      (result.judgeScores['Kang APIP'] || 0) + (result.judgeScores['Pak IAN'] || 0)
    );
    const fvSum = result.formasiVariasiSubtotal !== undefined ? result.formasiVariasiSubtotal : (
      (result.judgeScores['Kang Zulmu'] || 0) + (result.judgeScores['Kang Rizal'] || 0)
    );

    tableRows.push([
      index + 1,
      result.category,
      result.participantNumber,
      result.schoolName || '-',
      result.judgeScores['Kang APIP'] !== undefined ? result.judgeScores['Kang APIP'] : '-',
      result.judgeScores['Pak IAN'] !== undefined ? result.judgeScores['Pak IAN'] : '-',
      pbbSum,
      result.judgeScores['Kang Zulmu'] !== undefined ? result.judgeScores['Kang Zulmu'] : '-',
      result.judgeScores['Kang Rizal'] !== undefined ? result.judgeScores['Kang Rizal'] : '-',
      fvSum,
      result.totalCombined
    ]);
  });

  autoTable(doc, {
    startY: 30,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], halign: 'center' },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { halign: 'center' },
      1: { halign: 'center' },
      2: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'center', fontStyle: 'bold' },
      7: { halign: 'center' },
      8: { halign: 'center' },
      9: { halign: 'center', fontStyle: 'bold' },
      10: { halign: 'center', fontStyle: 'bold', fillColor: [238, 242, 255] }
    }
  });

  doc.save(`rekap_nilai_gabungan_${new Date().toISOString().split('T')[0]}.pdf`);
}
