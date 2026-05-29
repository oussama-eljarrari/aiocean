export interface SubmissionData {
  submission_id: string;
  name: string;
  url?: string;
  short_description: string;
  description?: string;
  pricing_model?: string;
}

export interface TodoItem {
  content: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}
