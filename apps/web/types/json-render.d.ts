/**
 * Type declarations for @json-render/react
 * 
 * These are placeholder types for the json-render library
 * which will be properly typed once the package is published.
 */

declare module '@json-render/react' {
  import { ReactNode, ComponentType } from 'react';

  /**
   * Context value for data access - returns record that can be cast to app-specific type
   */
  export type DataContextValue = Record<string, unknown>;

  /**
   * Action type - any object is accepted to allow flexibility in action definitions
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type Action = any;

  /**
   * Actions context value
   */
  export interface ActionsContextValue {
    execute: (action: Action) => Promise<unknown> | unknown;
  }

  /**
   * Visibility context value
   */
  export type VisibilityContextValue = Record<string, boolean>;

  /**
   * Auth state for the provider
   */
  export interface AuthState {
    isSignedIn: boolean;
    [key: string]: unknown;
  }

  /**
   * Component registry type
   */
  export type ComponentRegistry = Record<string, ComponentType<unknown>>;

  /**
   * Action handler function type
   */
  export type ActionHandler = (params: Record<string, unknown>) => Promise<unknown> | unknown;

  /**
   * Props for JSONUIProvider
   */
  export interface JSONUIProviderProps {
    children: ReactNode;
    registry: ComponentRegistry;
    initialData?: Record<string, unknown>;
    authState?: AuthState;
    actionHandlers?: Record<string, ActionHandler>;
  }

  /**
   * Main provider component
   */
  export function JSONUIProvider(props: JSONUIProviderProps): JSX.Element;

  /**
   * Hook to access data from the provider
   */
  export function useData(): DataContextValue;

  /**
   * Hook to access actions from the provider
   */
  export function useActions(): ActionsContextValue;

  /**
   * Hook to access visibility state
   */
  export function useVisibility(): VisibilityContextValue;

  /**
   * Renderer component for UI elements
   */
  export interface RendererProps {
    ui: unknown;
    components?: ComponentRegistry;
  }
  export function Renderer(props: RendererProps): JSX.Element;
}

declare module '@json-render/core' {
  /**
   * UI Element type
   */
  export interface UIElement {
    key: string;
    type: string;
    props: Record<string, unknown>;
    children?: string[];
  }

  /**
   * Create a UI element
   */
  export function createElement(
    type: string,
    props?: Record<string, unknown>,
    ...children: Array<UIElement | string>
  ): UIElement;

  /**
   * Validate a UI structure
   */
  export function validateUI(ui: unknown): boolean;
}
