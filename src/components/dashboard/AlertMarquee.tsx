import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Alert } from '@/types';
import { getAlertLevelColor, formatTime } from '@/utils/format';

interface AlertMarqueeProps {
  alerts: Alert[];
}

export const AlertMarquee: React.FC<AlertMarqueeProps> = ({ alerts }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const unconfirmedAlerts = alerts.filter((a) => !a.confirmed);

  useEffect(() => {
    if (isPaused || unconfirmedAlerts.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % unconfirmedAlerts.length);
    }, 4000);
    
    return () => clearInterval(timer);
  }, [isPaused, unconfirmedAlerts.length]);

  if (unconfirmedAlerts.length === 0) {
    return (
      <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-400">系统运行正常</p>
            <p className="text-xs text-slate-400 mt-0.5">当前无待处理告警</p>
          </div>
        </div>
      </div>
    );
  }

  const currentAlert = unconfirmedAlerts[currentIndex];
  const colorClass = getAlertLevelColor(currentAlert.level);

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + unconfirmedAlerts.length) % unconfirmedAlerts.length);
  };

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % unconfirmedAlerts.length);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-4 transition-all ${colorClass}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={prev}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 flex items-center gap-3 overflow-hidden">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            currentAlert.level === 'critical' ? 'bg-red-500/30 animate-pulse' : 'bg-amber-500/30'
          }`}>
            <AlertTriangle className={`w-5 h-5 ${currentAlert.level === 'critical' ? 'text-red-400' : 'text-amber-400'}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded ${currentAlert.level === 'critical' ? 'bg-red-500/20' : 'bg-amber-500/20'}`}>
                {currentAlert.level === 'critical' ? '严重' : '警告'}
              </span>
              <span className="text-xs text-slate-400">{formatTime(currentAlert.timestamp)}</span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-400">{currentAlert.source}</span>
            </div>
            <p className="text-sm font-medium mt-1 truncate">{currentAlert.message}</p>
          </div>
        </div>

        <button
          onClick={next}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1">
          {unconfirmedAlerts.map((_, idx) => (
            <div
              key={idx}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                idx === currentIndex ? 'bg-current w-4' : 'bg-current/30'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
