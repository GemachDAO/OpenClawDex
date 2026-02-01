/**
 * OpenClawDex Component Catalog
 * 
 * This catalog defines all UI components available for AI generation
 * using @json-render/core with Zod schemas for type safety.
 * 
 * Components are designed for:
 * - Portfolio dashboards
 * - Trading interfaces
 * - Copy trading UI
 * - Activity feeds
 */

import { createCatalog } from '@json-render/core';
import { z } from 'zod';

// ============================================================================
// Shared Schemas
// ============================================================================

/**
 * Action schema for interactive elements
 */
const ActionSchema = z.object({
  name: z.string().describe('Action handler name'),
  params: z.record(z.string(), z.any()).optional().describe('Parameters to pass to handler'),
  confirm: z.object({
    title: z.string(),
    message: z.string(),
    variant: z.enum(['default', 'danger', 'warning']).optional(),
  }).optional().describe('Confirmation dialog config'),
  onSuccess: z.object({
    navigate: z.string().optional(),
    set: z.record(z.string(), z.string()).optional(),
    toast: z.string().optional(),
  }).optional(),
  onError: z.object({
    set: z.record(z.string(), z.string()).optional(),
    toast: z.string().optional(),
  }).optional(),
});

/**
 * Chart data point schema
 */
const ChartDataPointSchema = z.object({
  label: z.string().describe('X-axis label (time, date, etc.)'),
  value: z.number().describe('Y-axis value'),
  secondaryValue: z.number().optional().describe('Secondary Y-axis value'),
});

/**
 * Table column definition
 */
const TableColumnSchema = z.object({
  key: z.string().describe('Data key to display'),
  label: z.string().describe('Column header label'),
  type: z.enum(['text', 'number', 'currency', 'percent', 'date', 'badge', 'action']).optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  sortable: z.boolean().optional(),
  width: z.string().optional().describe('Column width (e.g., "100px", "20%")'),
});

// ============================================================================
// Component Schemas
// ============================================================================

/**
 * Card Component
 * Container component for grouping related content
 */
const CardSchema = z.object({
  title: z.string().optional().describe('Card title'),
  description: z.string().optional().describe('Card description/subtitle'),
  variant: z.enum(['default', 'outlined', 'elevated', 'gradient']).optional(),
  padding: z.enum(['none', 'sm', 'md', 'lg']).optional(),
  className: z.string().optional(),
});

/**
 * Metric Component
 * Display a single metric with label, value, and optional change indicator
 */
const MetricSchema = z.object({
  label: z.string().describe('Metric label'),
  value: z.union([z.string(), z.number()]).describe('Main value to display'),
  format: z.enum(['number', 'currency', 'percent', 'compact']).optional(),
  currency: z.string().optional().describe('Currency code (e.g., USD, SOL)'),
  decimals: z.number().optional().describe('Decimal places'),
  change: z.number().optional().describe('Change amount'),
  changePercent: z.number().optional().describe('Change percentage'),
  changeDirection: z.enum(['up', 'down', 'neutral']).optional(),
  size: z.enum(['sm', 'md', 'lg', 'xl']).optional(),
  icon: z.string().optional().describe('Icon name'),
  trend: z.array(z.number()).optional().describe('Sparkline data'),
});

/**
 * Chart Component
 * Line, area, or bar chart for time series data
 */
const ChartSchema = z.object({
  title: z.string().optional(),
  type: z.enum(['line', 'area', 'bar', 'candlestick', 'pie', 'donut']).describe('Chart type'),
  data: z.array(ChartDataPointSchema).describe('Chart data points'),
  height: z.number().optional().describe('Chart height in pixels'),
  showGrid: z.boolean().optional(),
  showLegend: z.boolean().optional(),
  showTooltip: z.boolean().optional(),
  colors: z.array(z.string()).optional().describe('Color palette'),
  xAxisLabel: z.string().optional(),
  yAxisLabel: z.string().optional(),
  yAxisFormat: z.enum(['number', 'currency', 'percent', 'compact']).optional(),
});

/**
 * Table Component
 * Data table with sorting, filtering, and pagination
 */
const TableSchema = z.object({
  columns: z.array(TableColumnSchema).describe('Column definitions'),
  data: z.array(z.record(z.string(), z.any())).describe('Table row data'),
  emptyMessage: z.string().optional().describe('Message when no data'),
  sortable: z.boolean().optional(),
  selectable: z.boolean().optional(),
  pagination: z.object({
    pageSize: z.number(),
    currentPage: z.number().optional(),
    totalItems: z.number().optional(),
  }).optional(),
  onRowClick: ActionSchema.optional(),
  compact: z.boolean().optional(),
  striped: z.boolean().optional(),
});

/**
 * TradeForm Component
 * Form for executing swaps, buys, and sells
 */
const TradeFormSchema = z.object({
  type: z.enum(['swap', 'buy', 'sell', 'limit']).describe('Trade type'),
  fromToken: z.object({
    symbol: z.string(),
    address: z.string().optional(),
    balance: z.number().optional(),
    price: z.number().optional(),
    icon: z.string().optional(),
  }).optional(),
  toToken: z.object({
    symbol: z.string(),
    address: z.string().optional(),
    balance: z.number().optional(),
    price: z.number().optional(),
    icon: z.string().optional(),
  }).optional(),
  defaultAmount: z.number().optional(),
  slippage: z.number().optional().describe('Default slippage percentage'),
  showSlippageControl: z.boolean().optional(),
  showPriceImpact: z.boolean().optional(),
  submitLabel: z.string().optional(),
  onSubmit: ActionSchema.describe('Trade execution action'),
  disabled: z.boolean().optional(),
  chain: z.enum(['solana', 'ethereum', 'bsc', 'polygon', 'arbitrum', 'base', 'hyperliquid']).optional(),
});

/**
 * LeverageForm Component
 * Form for leverage trading on Hyperliquid
 */
const LeverageFormSchema = z.object({
  market: z.string().describe('Trading pair (e.g., BTC-PERP)'),
  side: z.enum(['long', 'short']).optional(),
  maxLeverage: z.number().optional().describe('Maximum allowed leverage'),
  defaultLeverage: z.number().optional(),
  balance: z.number().optional().describe('Available margin'),
  showTpSl: z.boolean().optional().describe('Show take profit / stop loss'),
  onSubmit: ActionSchema.describe('Open position action'),
});

/**
 * CopyTraderCard Component
 * Display a trader's profile for copy trading
 */
const CopyTraderCardSchema = z.object({
  traderId: z.string().describe('Unique trader identifier'),
  displayName: z.string().optional(),
  walletAddress: z.string().describe('Trader wallet address'),
  avatar: z.string().optional().describe('Avatar URL'),
  verified: z.boolean().optional(),
  totalPnl: z.number().describe('Total profit/loss'),
  winRate: z.number().describe('Win rate percentage (0-100)'),
  followers: z.number().describe('Number of followers'),
  performance: z.object({
    day7: z.number().describe('7-day PnL percentage'),
    day30: z.number().describe('30-day PnL percentage'),
    day90: z.number().optional().describe('90-day PnL percentage'),
    allTime: z.number().optional().describe('All-time PnL percentage'),
  }),
  riskLevel: z.enum(['low', 'medium', 'high']).optional(),
  tradingStyle: z.string().optional().describe('E.g., "Scalper", "Swing Trader"'),
  isFollowing: z.boolean().optional(),
  onFollow: ActionSchema.optional(),
  onUnfollow: ActionSchema.optional(),
  onViewProfile: ActionSchema.optional(),
});

/**
 * ActivityItem Component
 * Display a single activity/transaction item
 */
const ActivityItemSchema = z.object({
  type: z.enum(['swap', 'buy', 'sell', 'deposit', 'withdraw', 'copy', 'liquidation', 'funding']),
  timestamp: z.string().describe('ISO timestamp'),
  status: z.enum(['pending', 'success', 'failed']).optional(),
  fromToken: z.object({
    symbol: z.string(),
    amount: z.number(),
    icon: z.string().optional(),
  }).optional(),
  toToken: z.object({
    symbol: z.string(),
    amount: z.number(),
    icon: z.string().optional(),
  }).optional(),
  token: z.object({
    symbol: z.string(),
    amount: z.number(),
    icon: z.string().optional(),
  }).optional(),
  pnl: z.number().optional().describe('Profit/loss amount'),
  pnlPercent: z.number().optional(),
  txHash: z.string().optional().describe('Transaction hash'),
  chain: z.string().optional(),
  copiedFrom: z.string().optional().describe('Trader ID if copied'),
  onViewTx: ActionSchema.optional(),
});

/**
 * Badge Component
 * Status indicator or label
 */
const BadgeSchema = z.object({
  label: z.string().describe('Badge text'),
  variant: z.enum(['default', 'success', 'warning', 'error', 'info', 'outline']).optional(),
  size: z.enum(['sm', 'md', 'lg']).optional(),
  dot: z.boolean().optional().describe('Show status dot'),
  icon: z.string().optional(),
});

/**
 * PositionCard Component
 * Display an open leverage position
 */
const PositionCardSchema = z.object({
  positionId: z.string(),
  market: z.string().describe('Trading pair'),
  side: z.enum(['long', 'short']),
  size: z.number().describe('Position size'),
  entryPrice: z.number(),
  markPrice: z.number(),
  liquidationPrice: z.number().optional(),
  leverage: z.number(),
  margin: z.number(),
  unrealizedPnl: z.number(),
  unrealizedPnlPercent: z.number(),
  takeProfit: z.number().optional(),
  stopLoss: z.number().optional(),
  onClose: ActionSchema.optional(),
  onModify: ActionSchema.optional(),
});

/**
 * TokenCard Component
 * Display a token/meme coin with price info
 */
const TokenCardSchema = z.object({
  name: z.string(),
  symbol: z.string(),
  address: z.string(),
  icon: z.string().optional(),
  price: z.number(),
  priceChange24h: z.number().optional(),
  marketCap: z.number().optional(),
  volume24h: z.number().optional(),
  holders: z.number().optional(),
  bondingProgress: z.number().optional().describe('Pump.fun bonding curve progress (0-100)'),
  isGraduated: z.boolean().optional().describe('Has token graduated from bonding curve'),
  onBuy: ActionSchema.optional(),
  onSell: ActionSchema.optional(),
  onViewChart: ActionSchema.optional(),
});

/**
 * Alert Component
 * Display an alert or notification message
 */
const AlertSchema = z.object({
  title: z.string().optional(),
  message: z.string().describe('Alert message'),
  variant: z.enum(['info', 'success', 'warning', 'error']).optional(),
  dismissible: z.boolean().optional(),
  onDismiss: ActionSchema.optional(),
  action: z.object({
    label: z.string(),
    action: ActionSchema,
  }).optional(),
});

/**
 * WalletConnect Component
 * Wallet connection button with status
 */
const WalletConnectSchema = z.object({
  connected: z.boolean().describe('Is wallet connected'),
  address: z.string().optional().describe('Connected wallet address'),
  chain: z.string().optional().describe('Connected chain'),
  balance: z.number().optional().describe('Native token balance'),
  onConnect: ActionSchema.optional(),
  onDisconnect: ActionSchema.optional(),
  onSwitchChain: ActionSchema.optional(),
  showBalance: z.boolean().optional(),
  truncateAddress: z.boolean().optional(),
});

/**
 * TabsContainer Component
 * Tab navigation container
 */
const TabsContainerSchema = z.object({
  defaultTab: z.string().optional().describe('Default active tab key'),
  tabs: z.array(z.object({
    key: z.string(),
    label: z.string(),
    icon: z.string().optional(),
    badge: z.string().optional(),
    disabled: z.boolean().optional(),
  })).describe('Tab definitions'),
  variant: z.enum(['default', 'pills', 'underline']).optional(),
});

/**
 * Grid Component
 * Responsive grid layout
 */
const GridSchema = z.object({
  columns: z.union([z.number(), z.object({
    sm: z.number().optional(),
    md: z.number().optional(),
    lg: z.number().optional(),
    xl: z.number().optional(),
  })]).describe('Number of columns'),
  gap: z.enum(['none', 'sm', 'md', 'lg']).optional(),
});

/**
 * Stack Component
 * Vertical or horizontal stack layout
 */
const StackSchema = z.object({
  direction: z.enum(['horizontal', 'vertical']).optional(),
  gap: z.enum(['none', 'xs', 'sm', 'md', 'lg', 'xl']).optional(),
  align: z.enum(['start', 'center', 'end', 'stretch']).optional(),
  justify: z.enum(['start', 'center', 'end', 'between', 'around']).optional(),
  wrap: z.boolean().optional(),
});

// ============================================================================
// Catalog Definition
// ============================================================================

export const openClawDexCatalog = createCatalog({
  name: 'OpenClawDex',
  
  components: {
    // Layout Components
    Card: {
      props: CardSchema,
      hasChildren: true,
      description: 'Container for grouping related content with optional title and description',
    },
    Grid: {
      props: GridSchema,
      hasChildren: true,
      description: 'Responsive grid layout for arranging components',
    },
    Stack: {
      props: StackSchema,
      hasChildren: true,
      description: 'Flexible stack layout for vertical or horizontal arrangement',
    },
    TabsContainer: {
      props: TabsContainerSchema,
      hasChildren: true,
      description: 'Tab navigation with multiple content panels',
    },

    // Data Display Components
    Metric: {
      props: MetricSchema,
      description: 'Display a single metric with value, change indicator, and optional sparkline',
    },
    Chart: {
      props: ChartSchema,
      description: 'Line, area, bar, or candlestick chart for time series data',
    },
    Table: {
      props: TableSchema,
      description: 'Data table with columns, sorting, and pagination',
    },
    Badge: {
      props: BadgeSchema,
      description: 'Status indicator or label badge',
    },
    Alert: {
      props: AlertSchema,
      description: 'Alert message with variant styling and optional actions',
    },

    // Trading Components
    TradeForm: {
      props: TradeFormSchema,
      description: 'Form for executing swaps, buys, and sells with token selection and amount input',
    },
    LeverageForm: {
      props: LeverageFormSchema,
      description: 'Form for opening leverage positions on Hyperliquid',
    },
    PositionCard: {
      props: PositionCardSchema,
      description: 'Display an open leverage position with PnL and controls',
    },
    TokenCard: {
      props: TokenCardSchema,
      description: 'Display a token or meme coin with price info and trading actions',
    },

    // Copy Trading Components
    CopyTraderCard: {
      props: CopyTraderCardSchema,
      description: 'Display a trader profile with performance stats and follow/unfollow actions',
    },

    // Activity Components
    ActivityItem: {
      props: ActivityItemSchema,
      description: 'Display a single transaction or activity with type, tokens, and status',
    },

    // Wallet Components
    WalletConnect: {
      props: WalletConnectSchema,
      description: 'Wallet connection button with status and balance display',
    },
  },

  actions: {
    // Wallet Actions
    connectWallet: {
      description: 'Connect user wallet',
      params: z.object({
        chain: z.string().optional(),
      }),
    },
    disconnectWallet: {
      description: 'Disconnect user wallet',
    },
    switchChain: {
      description: 'Switch to a different blockchain',
      params: z.object({
        chainId: z.string(),
      }),
    },

    // Trading Actions
    executeSwap: {
      description: 'Execute a token swap',
      params: z.object({
        fromToken: z.string(),
        toToken: z.string(),
        amount: z.number(),
        slippage: z.number().optional(),
      }),
    },
    buyToken: {
      description: 'Buy a token (meme coin)',
      params: z.object({
        tokenAddress: z.string(),
        amount: z.number(),
        chain: z.string().optional(),
      }),
    },
    sellToken: {
      description: 'Sell a token (meme coin)',
      params: z.object({
        tokenAddress: z.string(),
        amount: z.number(),
        chain: z.string().optional(),
      }),
    },

    // Leverage Actions
    openPosition: {
      description: 'Open a leverage position on Hyperliquid',
      params: z.object({
        market: z.string(),
        side: z.enum(['long', 'short']),
        size: z.number(),
        leverage: z.number(),
        takeProfit: z.number().optional(),
        stopLoss: z.number().optional(),
      }),
    },
    closePosition: {
      description: 'Close a leverage position',
      params: z.object({
        positionId: z.string(),
        percentage: z.number().optional(),
      }),
    },
    modifyPosition: {
      description: 'Modify position take profit / stop loss',
      params: z.object({
        positionId: z.string(),
        takeProfit: z.number().optional(),
        stopLoss: z.number().optional(),
      }),
    },

    // Copy Trading Actions
    followTrader: {
      description: 'Start following a trader',
      params: z.object({
        traderId: z.string(),
        copyRatio: z.number(),
        maxLeverage: z.number().optional(),
      }),
    },
    unfollowTrader: {
      description: 'Stop following a trader',
      params: z.object({
        traderId: z.string(),
      }),
    },
    updateCopySettings: {
      description: 'Update copy trading settings',
      params: z.object({
        traderId: z.string(),
        copyRatio: z.number().optional(),
        maxLeverage: z.number().optional(),
        copyLongs: z.boolean().optional(),
        copyShorts: z.boolean().optional(),
      }),
    },

    // Navigation Actions
    navigate: {
      description: 'Navigate to a page',
      params: z.object({
        path: z.string(),
      }),
    },
    viewTraderProfile: {
      description: 'View trader profile page',
      params: z.object({
        traderId: z.string(),
      }),
    },
    viewTransaction: {
      description: 'View transaction details',
      params: z.object({
        txHash: z.string(),
        chain: z.string().optional(),
      }),
    },

    // UI Actions
    refreshData: {
      description: 'Refresh data from API',
      params: z.object({
        dataPath: z.string().optional(),
      }),
    },
    showToast: {
      description: 'Show a toast notification',
      params: z.object({
        message: z.string(),
        variant: z.enum(['info', 'success', 'warning', 'error']).optional(),
      }),
    },
    setFilter: {
      description: 'Set a filter value',
      params: z.object({
        path: z.string(),
        value: z.any(),
      }),
    },
  },

  functions: {
    // Validation functions
    isPositive: (value: unknown) => typeof value === 'number' && value > 0,
    isValidAddress: (value: unknown) => typeof value === 'string' && value.length >= 32,
    isValidSlippage: (value: unknown) => typeof value === 'number' && value >= 0 && value <= 50,
    isValidLeverage: (value: unknown) => typeof value === 'number' && value >= 1 && value <= 100,
    hasBalance: (value: unknown) => typeof value === 'number' && value > 0,
  },
});

// ============================================================================
// Type Exports
// ============================================================================

export type OpenClawDexCatalog = typeof openClawDexCatalog;

// Component prop types for use in component registry
export type CardProps = z.infer<typeof CardSchema>;
export type MetricProps = z.infer<typeof MetricSchema>;
export type ChartProps = z.infer<typeof ChartSchema>;
export type TableProps = z.infer<typeof TableSchema>;
export type TradeFormProps = z.infer<typeof TradeFormSchema>;
export type LeverageFormProps = z.infer<typeof LeverageFormSchema>;
export type CopyTraderCardProps = z.infer<typeof CopyTraderCardSchema>;
export type ActivityItemProps = z.infer<typeof ActivityItemSchema>;
export type BadgeProps = z.infer<typeof BadgeSchema>;
export type PositionCardProps = z.infer<typeof PositionCardSchema>;
export type TokenCardProps = z.infer<typeof TokenCardSchema>;
export type AlertProps = z.infer<typeof AlertSchema>;
export type WalletConnectProps = z.infer<typeof WalletConnectSchema>;
export type TabsContainerProps = z.infer<typeof TabsContainerSchema>;
export type GridProps = z.infer<typeof GridSchema>;
export type StackProps = z.infer<typeof StackSchema>;

// Schema exports for validation
export {
  CardSchema,
  MetricSchema,
  ChartSchema,
  TableSchema,
  TradeFormSchema,
  LeverageFormSchema,
  CopyTraderCardSchema,
  ActivityItemSchema,
  BadgeSchema,
  PositionCardSchema,
  TokenCardSchema,
  AlertSchema,
  WalletConnectSchema,
  TabsContainerSchema,
  GridSchema,
  StackSchema,
  ActionSchema,
  ChartDataPointSchema,
  TableColumnSchema,
};
