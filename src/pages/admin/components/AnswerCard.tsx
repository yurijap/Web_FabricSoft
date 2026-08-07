import type { LucideIcon } from 'lucide-react';
import React from 'react';

export interface AnswerCardProps {
  answer: {
    questionId: number;
    question: string;
    answer: string;
    score: number;
  };
  icon?: LucideIcon;
}

export const AnswerCard: React.FC<AnswerCardProps> = ({ answer }) => {
  return (
    <div className="grid gap-3 py-3 md:grid-cols-[minmax(0,1fr)_240px_58px] md:items-center rounded-xl border border-zinc-800 bg-[#17181B]/30 backdrop-filter backdrop-blur-sm p-2">
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">
          Pregunta {answer.questionId}
        </div>
        <div className="mt-1 text-sm leading-5 text-zinc-300">{answer.question}</div>
      </div>
      <div className="break-words text-sm font-medium text-zinc-100">{answer.answer}</div>
      <div className="font-mono text-xs text-amber-200 md:text-right">+{answer.score}</div>
    </div>
  );
};
