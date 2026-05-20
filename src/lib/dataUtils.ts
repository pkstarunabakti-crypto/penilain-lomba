import { LKBBRecord } from '../types';

export interface GroupedParticipant {
  participantNumber: string;
  category: string;
  schoolName: string;
  judgeScores: Record<string, number>;
  totalCombined: number;
}

export const getGroupedData = (records: LKBBRecord[]) => {
  const grouped: Record<string, GroupedParticipant> = {};
  
  records.forEach(record => {
    const key = `${record.participantNumber}-${record.category}`;
    if (!grouped[key]) {
      grouped[key] = {
        participantNumber: record.participantNumber,
        category: record.category || '-',
        schoolName: record.schoolName,
        judgeScores: {},
        totalCombined: 0
      };
    }
    grouped[key].judgeScores[record.juriName] = record.totalScore;
  });
  return grouped;
};

export const getCombinedResults = (records: LKBBRecord[]) => {
  const groupedObj = getGroupedData(records);

  const combinedResults = Object.values(groupedObj).map(g => {
    const scores = {} as Record<string, number>;
    Object.keys(g.judgeScores).forEach(jName => {
        scores[jName] = g.judgeScores[jName];
    });
    return { ...g, judgeScores: scores, totalCombined: 0 };
  }).filter(g => Object.keys(g.judgeScores).length > 0)
    .sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.participantNumber.localeCompare(b.participantNumber, undefined, { numeric: true });
    });

  const allJudges = Array.from(new Set(records.map(r => r.juriName))).sort() as string[];

  return {
    combinedResults,
    allJudges
  };
};
