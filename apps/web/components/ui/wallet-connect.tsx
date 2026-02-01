/**
 * WalletConnect Component
 * Wallet connection button with status and balance display
 */

import type { WalletConnectProps } from '@/lib/catalog';

interface WalletConnectComponentProps {
  element: { props: WalletConnectProps };
  onAction?: (action: unknown) => void;
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatBalance(balance: number): string {
  if (balance >= 1000000) {
    return `${(balance / 1000000).toFixed(2)}M`;
  }
  if (balance >= 1000) {
    return `${(balance / 1000).toFixed(2)}K`;
  }
  return balance.toFixed(4);
}

export function WalletConnect({ element, onAction }: WalletConnectComponentProps) {
  const {
    connected,
    address,
    chain,
    balance,
    onConnect,
    onDisconnect,
    onSwitchChain,
    showBalance = true,
    truncateAddress: shouldTruncate = true,
  } = element.props;

  const handleConnect = () => {
    if (onAction && onConnect) {
      onAction(onConnect);
    }
  };

  const handleDisconnect = () => {
    if (onAction && onDisconnect) {
      onAction(onDisconnect);
    }
  };

  const handleSwitchChain = () => {
    if (onAction && onSwitchChain) {
      onAction(onSwitchChain);
    }
  };

  if (!connected) {
    return (
      <button
        onClick={handleConnect}
        className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Chain Selector */}
      {chain && onSwitchChain && (
        <button
          onClick={handleSwitchChain}
          className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors capitalize"
        >
          {chain}
        </button>
      )}

      {/* Wallet Button */}
      <div className="flex items-center bg-zinc-800 rounded-lg overflow-hidden">
        {/* Balance */}
        {showBalance && balance !== undefined && (
          <div className="px-3 py-2 border-r border-zinc-700">
            <span className="text-sm text-white font-medium">
              {formatBalance(balance)}
            </span>
          </div>
        )}

        {/* Address & Disconnect */}
        <button
          onClick={handleDisconnect}
          className="px-3 py-2 hover:bg-zinc-700 text-zinc-300 transition-colors flex items-center gap-2"
        >
          {/* Status Dot */}
          <span className="w-2 h-2 rounded-full bg-green-500" />
          
          {/* Address */}
          <span className="text-sm font-medium">
            {address && (shouldTruncate ? truncateAddress(address) : address)}
          </span>
          
          {/* Disconnect Icon */}
          <svg className="w-4 h-4 text-zinc-500 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default WalletConnect;
