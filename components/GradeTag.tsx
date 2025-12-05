import React from 'react';
import { Card } from '../types';

interface GradeTagProps {
  card: Card;
  className?: string;
}

export const GradeTag: React.FC<GradeTagProps> = ({ card, className = '' }) => {
  if (!card.graded) {
    return <span className={`text-slate-400 ${className}`}>Raw</span>;
  }

  // Build the grade display text
  let gradeText = card.gradeCompany || '';

  if (card.gradeValue) {
    // Has a numerical card grade value
    gradeText += ` ${card.gradeValue}`;

    // Add auto grade if it exists (for card+auto grading)
    if (card.autoGrade) {
      gradeText += `/${card.autoGrade}`;
    }
  } else if (card.autoGrade) {
    // Auto grade only (no card grade)
    gradeText += ` Auto ${card.autoGrade}`;
  } else {
    // No numerical grades - check price history for special grades (Authentic, DNA Auth)
    if (card.priceHistory && card.priceHistory.length > 0) {
      const lastGrade = card.priceHistory[card.priceHistory.length - 1].grade;
      if (lastGrade) {
        // Extract the grade type from the formatted string
        if (lastGrade.includes('DNA Auth')) {
          gradeText += ' DNA Auth';
        } else if (lastGrade.includes('Authentic') && !lastGrade.includes('DNA')) {
          gradeText += ' Authentic';
        } else if (lastGrade.includes('Auto') && !lastGrade.includes('/')) {
          // Auto-only grade from price history
          const autoMatch = lastGrade.match(/Auto\s+(\S+)/);
          if (autoMatch) {
            gradeText += ` Auto ${autoMatch[1]}`;
          }
        }
      }
    }
  }

  return (
    <span className={`text-emerald-400 font-semibold ${className}`}>
      {gradeText}
    </span>
  );
};
