
import React from 'react';
import { AlgorithmStatus } from '../types';

const StatusBadge: React.FC<{ status: AlgorithmStatus }> = ({ status }) => {
  const config = {
    [AlgorithmStatus.RUNNING]: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    [AlgorithmStatus.STOPPED]: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    [AlgorithmStatus.PAUSED]: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    [AlgorithmStatus.ERROR]: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${config[status]}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
