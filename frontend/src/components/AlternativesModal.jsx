import React from 'react';
import Modal from './Modal.jsx';
import { formatCategory, formatDate } from '../utils/formatters.js';
import { Sparkles, Clock, Calendar, CheckCircle, ArrowRight } from 'lucide-react';

export default function AlternativesModal({
  isOpen,
  onClose,
  alternatives = [],
  conflictMessage,
  onSelectAlternative,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Smart Alternative Recommendations"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {conflictMessage && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <p className="font-semibold">{conflictMessage}</p>
            <p className="text-amber-700 mt-0.5">
              CampusSlot analyzed campus availability and found the following top-ranked alternatives:
            </p>
          </div>
        )}

        {alternatives.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">
            No suitable nearby alternatives found for this exact request. Try choosing another date or adjusting duration.
          </p>
        ) : (
          <div className="space-y-3">
            {alternatives.map((alt, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-campus-400 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-campus-50 text-campus-800 border border-campus-200">
                      Score: {Math.round(alt.suitabilityScore * 0.5 + alt.timeProximityScore * 0.5)}/100
                    </span>
                    <span className="text-xs font-semibold text-slate-900">
                      {alt.resource.name}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 text-xs text-slate-600">
                    <span className="flex items-center space-x-1 font-semibold text-slate-800">
                      <Clock className="w-3.5 h-3.5 text-campus-600" />
                      <span>{alt.startTime} - {alt.endTime}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDate(alt.date)}</span>
                    </span>
                    <span>• {alt.resource.building} (Cap: {alt.resource.capacity})</span>
                  </div>

                  <div className="flex flex-wrap gap-1 text-[11px] text-slate-500 pt-0.5">
                    {alt.matchReasons?.map((reason, rIdx) => (
                      <span key={rIdx} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        ✓ {reason}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => onSelectAlternative(alt)}
                  className="px-4 py-2 rounded-lg bg-campus-800 hover:bg-campus-900 text-white font-semibold text-xs shadow-xs transition-colors shrink-0 flex items-center justify-center space-x-1.5"
                >
                  <span>Book This</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
