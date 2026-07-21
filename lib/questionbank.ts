export type Question = {
  id: string;
  text: string;
  tag: string; // free text, e.g. "Vendor Negotiation", "1:1s", "Board Meetings"
  favorite: boolean;
  createdAt: string;
};

export type QuestionBankData = {
  questions: Question[];
};

export function emptyQuestionBankData(): QuestionBankData {
  return { questions: [] };
}

export function normalizeQuestionBankData(
  partial: Partial<QuestionBankData> | null | undefined
): QuestionBankData {
  return { questions: Array.isArray(partial?.questions) ? partial.questions : [] };
}

export function newQuestion(text: string, tag: string, now: Date = new Date()): Question {
  return {
    id: crypto.randomUUID(),
    text,
    tag,
    favorite: false,
    createdAt: now.toISOString(),
  };
}

export function sortedQuestions(data: QuestionBankData): Question[] {
  return [...data.questions].sort((a, b) => {
    if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function addQuestion(data: QuestionBankData, question: Question): QuestionBankData {
  return { ...data, questions: [question, ...data.questions] };
}

export function toggleFavorite(data: QuestionBankData, id: string): QuestionBankData {
  return {
    ...data,
    questions: data.questions.map((q) => (q.id === id ? { ...q, favorite: !q.favorite } : q)),
  };
}

export function deleteQuestion(data: QuestionBankData, id: string): QuestionBankData {
  return { ...data, questions: data.questions.filter((q) => q.id !== id) };
}
