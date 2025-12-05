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

  const company = card.gradeCompany || '';
  let gradeText = company;
  let isPremiumGrade = false;
  let numericGrade = 0;

  // Check for BGS Black Label
  const isBlackLabel = card.gradeValue?.toLowerCase().includes('black') ||
                       (card.gradeValue === '10' && card.autoGrade?.toLowerCase().includes('black'));

  if (card.gradeValue) {
    // Parse numeric grade for styling decisions
    const gradeNum = parseFloat(card.gradeValue.replace(/[^0-9.]/g, ''));
    if (!isNaN(gradeNum)) {
      numericGrade = gradeNum;
    }

    // Build grade text
    if (isBlackLabel) {
      gradeText += ' Black 10';
      isPremiumGrade = true;
    } else {
      gradeText += ` ${card.gradeValue}`;

      // Add auto grade if it exists (for card+auto grading)
      if (card.autoGrade) {
        gradeText += `/${card.autoGrade}`;
      }

      // Check if premium grade
      if (company === 'PSA' && (card.gradeValue === '10' || gradeText.includes('10/10'))) {
        isPremiumGrade = true;
      } else if (company === 'BGS' && (gradeNum >= 9.5 || gradeText.includes('9.5/10') || gradeText.includes('9.5/'))) {
        isPremiumGrade = true;
      }
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

  // Determine styling based on grading company and grade value
  let badgeStyles = '';

  if (company === 'PSA') {
    if (isPremiumGrade) {
      // PSA 10 or 10/10 - Premium red badge
      badgeStyles = 'bg-white text-black border-2 border-[rgb(238,4,3)] font-extrabold';
    } else {
      // Standard PSA - Red and white
      badgeStyles = 'bg-white text-black border-2 border-[rgb(238,4,3)] font-bold';
    }
  } else if (company === 'BGS') {
    if (isBlackLabel) {
      // BGS Black Label 10 - Black badge with gold text
      badgeStyles = 'bg-black text-amber-400 border-2 border-amber-400 font-extrabold';
    } else if (numericGrade >= 9.5 || isPremiumGrade) {
      // BGS 9.5+ - Gold badge
      badgeStyles = 'bg-gradient-to-br from-amber-300 to-amber-500 text-black border-2 border-amber-600 font-extrabold';
    } else if (numericGrade >= 9) {
      // BGS 9 - 9.5 - Silver badge
      badgeStyles = 'bg-gradient-to-br from-slate-200 to-slate-400 text-black border-2 border-slate-500 font-bold';
    } else {
      // BGS < 9 - Dark silver
      badgeStyles = 'bg-gradient-to-br from-slate-300 to-slate-500 text-slate-900 border border-slate-600 font-semibold';
    }
  } else {
    // Other grading companies - Default emerald styling
    badgeStyles = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 font-semibold';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs ${badgeStyles} ${className}`}>
      {gradeText}
    </span>
  );
};
