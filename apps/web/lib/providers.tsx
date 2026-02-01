/**
 * OpenClawDex Providers
 * 
 * Sets up DataProvider, ActionProvider, and other context providers
 * for use with @json-render/react components.
 */

'use client';

import { 
  JSONUIProvider,
  useData,
  useActions,
  useVisibility,
} from '@json-render/react';
import { registry } from '@/components/registry';
import { type ReactNode, useState, useCallback, useMemo } from 'react';

// ============================================================================
// Types
// ============================================================================

type ActionParams = Record<string, unknown>;
type ActionHandler = (params: ActionParams) => Promise<unknown> | unknown;

// ============================================================================
// Types
// ============================================================================

export interface Portfolio {
  totalValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  availableBalance: number;
  positions: Position[];
}

export interface Position {
  id: string;
  token: string;
  symbol: string;
  amount: number;
  value: number;
  pnl: number;
  pnlPercent: number;
  chain: string;
}

export interface WalletState {
  connected: boolean;
  address?: string;
  chain?: string;
  balance?: number;
}

export interface TradeHistory {
  id: string;
  type: 'swap' | 'buy' | 'sell' | 'deposit' | 'withdraw' | 'copy' | 'liquidation' | 'funding';
  timestamp: string;
  status: 'pending' | 'success' | 'failed';
  fromToken?: { symbol: string; amount: number };
  toToken?: { symbol: string; amount: number };
  pnl?: number;
  txHash?: string;
  chain?: string;
}

export interface CopyTrading {
  enabled: boolean;
  followedTraders: FollowedTrader[];
}

export interface FollowedTrader {
  traderId: string;
  displayName?: string;
  walletAddress: string;
  copyRatio: number;
  maxLeverage: number;
  copyLongs: boolean;
  copyShorts: boolean;
  totalCopied: number;
  totalPnl: number;
}

export interface AppData {
  wallet: WalletState;
  portfolio: Portfolio;
  trades: TradeHistory[];
  copyTrading: CopyTrading;
  ui: {
    loading: boolean;
    error: string | null;
    toast: { message: string; variant: string } | null;
  };
}

// ============================================================================
// Initial Data
// ============================================================================

const initialData: AppData = {
  wallet: {
    connected: false,
  },
  portfolio: {
    totalValue: 0,
    totalPnl: 0,
    totalPnlPercent: 0,
    availableBalance: 0,
    positions: [],
  },
  trades: [],
  copyTrading: {
    enabled: false,
    followedTraders: [],
  },
  ui: {
    loading: false,
    error: null,
    toast: null,
  },
};

// ============================================================================
// API Configuration
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
  
  return response.json();
}

// ============================================================================
// Action Handlers
// ============================================================================

export function createActionHandlers(
  setData: React.Dispatch<React.SetStateAction<AppData>>
): Record<string, ActionHandler> {
  
  const showToast = (message: string, variant: string = 'info') => {
    setData(prev => ({
      ...prev,
      ui: { ...prev.ui, toast: { message, variant } },
    }));
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setData(prev => ({
        ...prev,
        ui: { ...prev.ui, toast: null },
      }));
    }, 3000);
  };

  const setLoading = (loading: boolean) => {
    setData(prev => ({
      ...prev,
      ui: { ...prev.ui, loading },
    }));
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const setError = (error: string | null) => {
    setData(prev => ({
      ...prev,
      ui: { ...prev.ui, error },
    }));
  };

  return {
    // ========================================================================
    // Wallet Actions
    // ========================================================================
    
    connectWallet: async (params: ActionParams) => {
      try {
        setLoading(true);
        // In a real app, this would connect to a wallet provider
        // For now, simulate connection
        const mockAddress = '0x' + Array(40).fill(0).map(() => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('');
        
        setData(prev => ({
          ...prev,
          wallet: {
            connected: true,
            address: mockAddress,
            chain: (params?.chain as string) || 'ethereum',
            balance: 1.5,
          },
        }));
        showToast('Wallet connected successfully', 'success');
      } catch (error) {
        showToast('Failed to connect wallet', 'error');
      } finally {
        setLoading(false);
      }
    },

    disconnectWallet: async () => {
      setData(prev => ({
        ...prev,
        wallet: { connected: false },
        portfolio: initialData.portfolio,
      }));
      showToast('Wallet disconnected', 'info');
    },

    switchChain: async (params: ActionParams) => {
      setData(prev => ({
        ...prev,
        wallet: { ...prev.wallet, chain: params?.chainId as string },
      }));
      showToast(`Switched to ${params?.chainId}`, 'success');
    },

    // ========================================================================
    // Trading Actions
    // ========================================================================

    executeSwap: async (params: ActionParams) => {
      try {
        setLoading(true);
        const result = await apiCall<{ success: boolean; txHash: string }>('/swap/execute', {
          method: 'POST',
          body: JSON.stringify(params),
        });
        
        // Add to trade history
        setData(prev => ({
          ...prev,
          trades: [
            {
              id: Date.now().toString(),
              type: 'swap',
              timestamp: new Date().toISOString(),
              status: 'success',
              fromToken: { symbol: params?.fromToken as string, amount: params?.amount as number },
              toToken: { symbol: params?.toToken as string, amount: (params?.amount as number) * 0.99 },
              txHash: result.txHash,
              chain: (params?.chain as string) || 'ethereum',
            },
            ...prev.trades,
          ],
        }));
        
        showToast('Swap executed successfully', 'success');
        return result;
      } catch (error) {
        showToast(`Swap failed: ${(error as Error).message}`, 'error');
        throw error;
      } finally {
        setLoading(false);
      }
    },

    buyToken: async (params: ActionParams) => {
      try {
        setLoading(true);
        const result = await apiCall<{ success: boolean; txHash: string }>('/memecoins/buy', {
          method: 'POST',
          body: JSON.stringify(params),
        });
        
        setData(prev => ({
          ...prev,
          trades: [
            {
              id: Date.now().toString(),
              type: 'buy',
              timestamp: new Date().toISOString(),
              status: 'success',
              toToken: { symbol: (params?.tokenAddress as string)?.slice(0, 8), amount: params?.amount as number },
              txHash: result.txHash,
              chain: (params?.chain as string) || 'solana',
            },
            ...prev.trades,
          ],
        }));
        
        showToast('Token purchased successfully', 'success');
        return result;
      } catch (error) {
        showToast(`Buy failed: ${(error as Error).message}`, 'error');
        throw error;
      } finally {
        setLoading(false);
      }
    },

    sellToken: async (params: ActionParams) => {
      try {
        setLoading(true);
        const result = await apiCall<{ success: boolean; txHash: string }>('/memecoins/sell', {
          method: 'POST',
          body: JSON.stringify(params),
        });
        
        setData(prev => ({
          ...prev,
          trades: [
            {
              id: Date.now().toString(),
              type: 'sell',
              timestamp: new Date().toISOString(),
              status: 'success',
              fromToken: { symbol: (params?.tokenAddress as string)?.slice(0, 8), amount: params?.amount as number },
              txHash: result.txHash,
              chain: (params?.chain as string) || 'solana',
            },
            ...prev.trades,
          ],
        }));
        
        showToast('Token sold successfully', 'success');
        return result;
      } catch (error) {
        showToast(`Sell failed: ${(error as Error).message}`, 'error');
        throw error;
      } finally {
        setLoading(false);
      }
    },

    // ========================================================================
    // Leverage Trading Actions
    // ========================================================================

    openPosition: async (params: ActionParams) => {
      try {
        setLoading(true);
        const result = await apiCall<{ success: boolean; positionId: string }>('/leverage/positions', {
          method: 'POST',
          body: JSON.stringify(params),
        });
        
        showToast(`${params?.side} position opened on ${params?.market}`, 'success');
        return result;
      } catch (error) {
        showToast(`Failed to open position: ${(error as Error).message}`, 'error');
        throw error;
      } finally {
        setLoading(false);
      }
    },

    closePosition: async (params: ActionParams) => {
      try {
        setLoading(true);
        const result = await apiCall<{ success: boolean }>(`/leverage/positions/${params?.positionId}/close`, {
          method: 'POST',
          body: JSON.stringify({ percentage: params?.percentage || 100 }),
        });
        
        showToast('Position closed successfully', 'success');
        return result;
      } catch (error) {
        showToast(`Failed to close position: ${(error as Error).message}`, 'error');
        throw error;
      } finally {
        setLoading(false);
      }
    },

    modifyPosition: async (params: ActionParams) => {
      try {
        setLoading(true);
        const result = await apiCall<{ success: boolean }>(`/leverage/positions/${params?.positionId}`, {
          method: 'PUT',
          body: JSON.stringify({
            takeProfit: params?.takeProfit,
            stopLoss: params?.stopLoss,
          }),
        });
        
        showToast('Position modified successfully', 'success');
        return result;
      } catch (error) {
        showToast(`Failed to modify position: ${(error as Error).message}`, 'error');
        throw error;
      } finally {
        setLoading(false);
      }
    },

    // ========================================================================
    // Copy Trading Actions
    // ========================================================================

    followTrader: async (params: ActionParams) => {
      try {
        setLoading(true);
        const result = await apiCall<{ success: boolean }>('/copy/follow', {
          method: 'POST',
          body: JSON.stringify(params),
        });
        
        setData(prev => ({
          ...prev,
          copyTrading: {
            ...prev.copyTrading,
            enabled: true,
            followedTraders: [
              ...prev.copyTrading.followedTraders,
              {
                traderId: params?.traderId as string,
                walletAddress: params?.traderId as string, // Would come from API
                copyRatio: (params?.copyRatio as number) || 1,
                maxLeverage: (params?.maxLeverage as number) || 10,
                copyLongs: true,
                copyShorts: true,
                totalCopied: 0,
                totalPnl: 0,
              },
            ],
          },
        }));
        
        showToast('Now following trader', 'success');
        return result;
      } catch (error) {
        showToast(`Failed to follow trader: ${(error as Error).message}`, 'error');
        throw error;
      } finally {
        setLoading(false);
      }
    },

    unfollowTrader: async (params: ActionParams) => {
      try {
        setLoading(true);
        await apiCall<{ success: boolean }>('/copy/unfollow', {
          method: 'POST',
          body: JSON.stringify({ traderId: params?.traderId }),
        });
        
        setData(prev => ({
          ...prev,
          copyTrading: {
            ...prev.copyTrading,
            followedTraders: prev.copyTrading.followedTraders.filter(
              t => t.traderId !== params?.traderId
            ),
          },
        }));
        
        showToast('Unfollowed trader', 'info');
      } catch (error) {
        showToast(`Failed to unfollow trader: ${(error as Error).message}`, 'error');
        throw error;
      } finally {
        setLoading(false);
      }
    },

    updateCopySettings: async (params: ActionParams) => {
      try {
        setLoading(true);
        await apiCall<{ success: boolean }>('/copy/settings', {
          method: 'PUT',
          body: JSON.stringify(params),
        });
        
        setData(prev => ({
          ...prev,
          copyTrading: {
            ...prev.copyTrading,
            followedTraders: prev.copyTrading.followedTraders.map(t =>
              t.traderId === params?.traderId
                ? { ...t, ...(params as Partial<FollowedTrader>) }
                : t
            ),
          },
        }));
        
        showToast('Copy settings updated', 'success');
      } catch (error) {
        showToast(`Failed to update settings: ${(error as Error).message}`, 'error');
        throw error;
      } finally {
        setLoading(false);
      }
    },

    // ========================================================================
    // Navigation Actions
    // ========================================================================

    navigate: async (params: ActionParams) => {
      if (typeof window !== 'undefined' && params?.path) {
        window.location.href = params.path as string;
      }
    },

    viewTraderProfile: async (params: ActionParams) => {
      if (typeof window !== 'undefined' && params?.traderId) {
        window.location.href = `/copy/${params.traderId}`;
      }
    },

    viewTransaction: async (params: ActionParams) => {
      if (typeof window !== 'undefined' && params?.txHash) {
        // Open in block explorer
        const explorers: Record<string, string> = {
          ethereum: 'https://etherscan.io/tx/',
          solana: 'https://solscan.io/tx/',
          bsc: 'https://bscscan.com/tx/',
          polygon: 'https://polygonscan.com/tx/',
          arbitrum: 'https://arbiscan.io/tx/',
          base: 'https://basescan.org/tx/',
        };
        const chain = (params?.chain as string) || 'ethereum';
        const explorer = explorers[chain] || explorers.ethereum;
        window.open(`${explorer}${params.txHash}`, '_blank');
      }
    },

    // ========================================================================
    // UI Actions
    // ========================================================================

    refreshData: async (params: ActionParams) => {
      try {
        setLoading(true);
        // Refresh specific data path or all data
        if (params?.dataPath === '/portfolio' || !params?.dataPath) {
          // Fetch portfolio data
          // const portfolio = await apiCall<Portfolio>('/wallet/balance');
          // setData(prev => ({ ...prev, portfolio }));
        }
        showToast('Data refreshed', 'success');
      } catch {
        showToast('Failed to refresh data', 'error');
      } finally {
        setLoading(false);
      }
    },

    showToast: async (params: ActionParams) => {
      showToast((params?.message as string) || '', (params?.variant as string) || 'info');
    },

    setFilter: async (params: ActionParams) => {
      // Handle filter updates - would update a filters state
      console.log('Setting filter:', params);
    },
  };
}

// ============================================================================
// Provider Component
// ============================================================================

interface OpenClawDexProviderProps {
  children: ReactNode;
}

export function OpenClawDexProvider({ children }: OpenClawDexProviderProps) {
  const [data, setData] = useState<AppData>(initialData);
  
  const actionHandlers = useMemo(() => createActionHandlers(setData), []);

  // Convert AppData to Record<string, unknown> for JSONUIProvider
  const dataModel = useMemo(() => data as unknown as Record<string, unknown>, [data]);

  return (
    <JSONUIProvider
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      registry={registry as any}
      initialData={dataModel}
      authState={{ isSignedIn: data.wallet.connected }}
      actionHandlers={actionHandlers}
    >
      {/* Toast Notification */}
      {data.ui.toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
          <div className={`
            px-4 py-3 rounded-lg shadow-lg flex items-center gap-2
            ${data.ui.toast.variant === 'success' ? 'bg-green-500/90 text-white' : ''}
            ${data.ui.toast.variant === 'error' ? 'bg-red-500/90 text-white' : ''}
            ${data.ui.toast.variant === 'warning' ? 'bg-yellow-500/90 text-black' : ''}
            ${data.ui.toast.variant === 'info' ? 'bg-blue-500/90 text-white' : ''}
          `}>
            {data.ui.toast.message}
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {data.ui.loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-500 border-t-transparent" />
        </div>
      )}

      {children}
    </JSONUIProvider>
  );
}

// ============================================================================
// Typed Hooks
// ============================================================================

/**
 * Typed hook to access the application data state.
 * This wraps the generic useData hook with proper AppData typing.
 */
export function useAppData(): AppData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = useData();
  return data as unknown as AppData;
}

/**
 * Action type for OpenClawDex actions
 */
export interface OpenClawAction {
  type: string;
  [key: string]: unknown;
}

/**
 * Typed hook to execute actions with proper type inference.
 * This wraps the generic useActions hook.
 */
export function useAppActions() {
  const actions = useActions();
  
  const execute = (action: OpenClawAction) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (actions as any).execute(action);
  };
  
  return { execute };
}

// Re-export base hooks for advanced use cases
export { useData, useActions, useVisibility };

export default OpenClawDexProvider;
