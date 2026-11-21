export type Band = 'red' | 'yellow' | 'green';

export type AdminAnalysisRow = {
  id: string;
  fileName: string;
  targetPosition: string | null;
  overallScore: number;
  band: Band;
  datasetConsent: boolean;
  createdAt: string;
  searchText: string;
};
