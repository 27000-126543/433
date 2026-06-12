import React, { useState } from 'react';
import { AlertCircle, X, Check } from 'lucide-react';
import { Alert } from '@/types';
import { getAlertLevelColor, getAlertLevelText, formatTime, getTypeText } from '@/utils/format';
import { useAlert } from '@/context/AlertContext';
import { useAuth } from '@/context/AuthContext';

interface AlertBannerProps {
  alert: Alert;
  onConfirm?: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ alert, onConfirm }) => {
  const [isVisible, setIsVisible] = useState(true);
  const { confirmAlert } = useAlert();
  const { user } = useAuth();

  const colorClass = getAlertLevelColor(alert.level);

  const handleConfirm = async () => {
    if (user) {
      await confirmAlert(alert.id, user.id);
      setIsVisible(false);
      onConfirm?.();
    }
  };

  if (!isVisible || alert.confirmed) return null;

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${colorClass} mb-2 transition-all duration-300`}>
      <div className="flex items-center gap-3 flex-1">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{getAlertLevelText(alert.level)}</span>
            <span className="text-xs opacity-70">·</span>
            <span className="text-xs opacity-70">{getTypeText(alert.type)}</span>
            <span className="text-xs opacity-70">·</span>
            <span className="text-xs opacity-70">{formatTime(alert.timestamp)}</span>
          </div>
          <p className="text-sm mt-0.5 truncate">{alert.message}</p>
          <p className="text-xs opacity-70 mt-0.5">来源: {alert.source}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4">
        {alert.escalated && (
          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">已升级</span>
        )}
        <button
          onClick={handleConfirm}
          className="p-1.5 rounded hover:bg-white/10 transition-colors"
          title="确认告警"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={() => setIsVisible(false)}
          className="p-1.5 rounded hover:bg-white/10 transition-colors"
          title="关闭"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
