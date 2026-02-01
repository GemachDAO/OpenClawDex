/**
 * Component Registry
 * 
 * Maps component type names to their React implementations.
 * This registry is used by @json-render/react Renderer.
 */

import { Card } from './ui/card';
import { Metric } from './ui/metric';
import { Chart } from './ui/chart';
import { Table } from './ui/table';
import { TradeForm } from './ui/trade-form';
import { CopyTraderCard } from './ui/copy-trader-card';
import { ActivityItem } from './ui/activity-item';
import { Badge } from './ui/badge';
import { Alert } from './ui/alert';
import { Grid } from './ui/grid';
import { Stack } from './ui/stack';
import { PositionCard } from './ui/position-card';
import { TokenCard } from './ui/token-card';
import { WalletConnect } from './ui/wallet-connect';

import type { ReactNode } from 'react';

/**
 * Base props that all registered components receive
 */
export interface RegistryComponentProps<T = Record<string, unknown>> {
  /** The UI element with type, props, key, etc. */
  element: {
    key: string;
    type: string;
    props: T;
    children?: string[];
  };
  /** Rendered children (for container components) */
  children?: ReactNode;
  /** Action handler callback */
  onAction?: (action: unknown) => void;
}

/**
 * Component registry type
 */
export type ComponentRegistry = Record<
  string,
  React.ComponentType<RegistryComponentProps<unknown>>
>;

/**
 * The main component registry for OpenClawDex
 * 
 * Each component receives:
 * - element: The full UIElement with props, key, type
 * - children: Rendered child elements (for container components)
 * - onAction: Callback to execute actions
 */
export const registry: ComponentRegistry = {
  // Layout Components
  Card: Card as React.ComponentType<RegistryComponentProps<unknown>>,
  Grid: Grid as React.ComponentType<RegistryComponentProps<unknown>>,
  Stack: Stack as React.ComponentType<RegistryComponentProps<unknown>>,

  // Data Display Components
  Metric: Metric as React.ComponentType<RegistryComponentProps<unknown>>,
  Chart: Chart as React.ComponentType<RegistryComponentProps<unknown>>,
  Table: Table as React.ComponentType<RegistryComponentProps<unknown>>,
  Badge: Badge as React.ComponentType<RegistryComponentProps<unknown>>,
  Alert: Alert as React.ComponentType<RegistryComponentProps<unknown>>,

  // Trading Components
  TradeForm: TradeForm as React.ComponentType<RegistryComponentProps<unknown>>,
  PositionCard: PositionCard as React.ComponentType<RegistryComponentProps<unknown>>,
  TokenCard: TokenCard as React.ComponentType<RegistryComponentProps<unknown>>,

  // Copy Trading Components
  CopyTraderCard: CopyTraderCard as React.ComponentType<RegistryComponentProps<unknown>>,

  // Activity Components
  ActivityItem: ActivityItem as React.ComponentType<RegistryComponentProps<unknown>>,

  // Wallet Components
  WalletConnect: WalletConnect as React.ComponentType<RegistryComponentProps<unknown>>,
};

/**
 * Get all registered component names
 */
export function getRegisteredComponents(): string[] {
  return Object.keys(registry);
}

/**
 * Check if a component is registered
 */
export function isRegistered(type: string): boolean {
  return type in registry;
}

/**
 * Get a component by type name
 */
export function getComponent(type: string): React.ComponentType<RegistryComponentProps<unknown>> | undefined {
  return registry[type];
}

export default registry;
