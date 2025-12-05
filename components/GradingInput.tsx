import React from 'react';

interface GradingInputProps {
  graded: boolean;
  gradeCompany: string;
  gradeType: string;
  gradeValue: string;
  autoGrade: string;
  certNumber?: string;
  onGradedChange: (graded: boolean) => void;
  onGradeCompanyChange: (company: string) => void;
  onGradeTypeChange: (type: string) => void;
  onGradeValueChange: (value: string) => void;
  onAutoGradeChange: (value: string) => void;
  onCertNumberChange?: (value: string) => void;
  showToggle?: boolean;
  showCertNumber?: boolean;
  compact?: boolean;
}

export const GradingInput: React.FC<GradingInputProps> = ({
  graded,
  gradeCompany,
  gradeType,
  gradeValue,
  autoGrade,
  certNumber = '',
  onGradedChange,
  onGradeCompanyChange,
  onGradeTypeChange,
  onGradeValueChange,
  onAutoGradeChange,
  onCertNumberChange,
  showToggle = true,
  showCertNumber = false,
  compact = false
}) => {
  return (
    <div>
      {showToggle && (
        <div className="flex items-center justify-between mb-3">
          <label className={`block text-xs font-semibold text-slate-400 uppercase tracking-wide ${compact ? '' : 'mb-0'}`}>
            Grading
          </label>
          <button
            type="button"
            onClick={() => onGradedChange(!graded)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-crypto-lime focus:ring-offset-2 focus:ring-offset-slate-900 ${
              graded ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
            role="switch"
            aria-checked={graded}
            aria-label="Toggle graded card"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                graded ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      )}

      {graded && (
        <div className={`${compact ? 'mt-3' : ''} space-y-3 p-3 bg-slate-950 rounded-xl border border-slate-700`}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Company</label>
              <select
                value={gradeCompany}
                onChange={(e) => {
                  onGradeCompanyChange(e.target.value);
                  // Only reset gradeType if switching from PSA to non-PSA and currently on dna-auth
                  if (e.target.value !== 'PSA' && gradeType === 'dna-auth') {
                    onGradeTypeChange('card-only');
                  }
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-sm text-white focus:ring-0 focus:border-slate-500 outline-none"
              >
                <option value="PSA">PSA</option>
                <option value="BGS">BGS</option>
                <option value="SGC">SGC</option>
                <option value="CGC">CGC</option>
                <option value="CSA">CSA</option>
                <option value="TAG">TAG</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Grade Type</label>
              <select
                value={gradeType}
                onChange={(e) => onGradeTypeChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-sm text-white focus:ring-0 focus:border-slate-500 outline-none"
              >
                {gradeCompany === 'PSA' && (
                  <>
                    <option value="card-auto">Graded (card + auto)</option>
                    <option value="card-only">Graded (card only)</option>
                    <option value="auto-only">Graded (auto only)</option>
                    <option value="authentic">Authentic (no numerical grade)</option>
                    <option value="dna-auth">DNA Auth only (sticker)</option>
                  </>
                )}
                {gradeCompany !== 'PSA' && (
                  <>
                    <option value="card-auto">Graded (card + auto)</option>
                    <option value="card-only">Graded (card only)</option>
                    <option value="auto-only">Graded (auto only)</option>
                    <option value="authentic">Authentic</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {gradeType !== 'authentic' && gradeType !== 'dna-auth' && (
              <>
                {gradeType === 'card-auto' ? (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Card Grade</label>
                      <input
                        type="text"
                        value={gradeValue}
                        onChange={(e) => onGradeValueChange(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-sm text-white focus:ring-0 focus:border-slate-500 outline-none"
                        placeholder="10"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Auto Grade</label>
                      <input
                        type="text"
                        value={autoGrade}
                        onChange={(e) => onAutoGradeChange(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-sm text-white focus:ring-0 focus:border-slate-500 outline-none"
                        placeholder="10"
                      />
                    </div>
                  </>
                ) : gradeType === 'auto-only' ? (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Auto Grade</label>
                    <input
                      type="text"
                      value={autoGrade}
                      onChange={(e) => onAutoGradeChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-sm text-white focus:ring-0 focus:border-slate-500 outline-none"
                      placeholder="10"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Grade</label>
                    <input
                      type="text"
                      value={gradeValue}
                      onChange={(e) => onGradeValueChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-sm text-white focus:ring-0 focus:border-slate-500 outline-none"
                      placeholder="10"
                    />
                  </div>
                )}
              </>
            )}
            {showCertNumber && onCertNumberChange && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Cert #</label>
                <input
                  type="text"
                  value={certNumber}
                  onChange={(e) => onCertNumberChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-sm text-white focus:ring-0 focus:border-slate-500 outline-none"
                  placeholder="Optional"
                />
              </div>
            )}
          </div>

          {/* BGS Black Label Option */}
          {gradeCompany === 'BGS' && gradeValue === '10' && gradeType !== 'authentic' && gradeType !== 'dna-auth' && (
            <div className="mt-3 p-3 bg-gradient-to-r from-amber-500/10 to-black/30 border border-amber-500/30 rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gradeValue?.toLowerCase().includes('black')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onGradeValueChange('Black Label 10');
                    } else {
                      onGradeValueChange('10');
                    }
                  }}
                  className="w-4 h-4 bg-slate-900 border-2 border-amber-500 rounded text-amber-500 focus:ring-2 focus:ring-amber-500 focus:ring-offset-0"
                />
                <span className="text-sm font-semibold text-amber-400">
                  BGS Black Label (Pristine 10)
                </span>
              </label>
              <p className="text-xs text-slate-400 mt-1 ml-6">
                The highest grade achievable - all four subgrades must be 10
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
