
export enum AlgorithmStatus {
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
  PAUSED = 'PAUSED',
  ERROR = 'ERROR'
}

export interface StrategyConfig {
  riskTolerance: number; // 1-100
  leverage: number;
  stopLoss: number; // percentage
  takeProfit: number; // percentage
  indicators: string[];
  maxDrawdown: number;
}

export interface TradingAlgorithm {
  id: string;
  name: string;
  strategyType: string;
  status: AlgorithmStatus;
  profit: number;
  winRate: number;
  tradesCount: number;
  lastExecution: string;
  config: StrategyConfig;
}

export interface MarketDataPoint {
  time: string;
  price: number;
  volume: number;
}

export interface PortfolioHistory {
  time: string;
  balance: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'API';
  message: string;
  algId?: string;
}

export interface BrokerConnection {
  id: string;
  name: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR';
  apiKey: string;
  apiSecret: string;
  accountNumber: string;
  lastPing: string;
}
