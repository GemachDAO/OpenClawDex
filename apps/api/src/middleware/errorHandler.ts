/**
 * Error Handler Middleware
 * 
 * Centralized error handling for Express routes.
 * Provides consistent error responses and logging.
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Global error handler middleware
 * Should be added after all routes
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the error
  logger.error('Request error', err, {
    method: req.method,
    path: req.path,
    query: req.query,
  });

  // Return appropriate error response
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { details: err.message }),
  });
}

/**
 * 404 handler for routes not found
 */
export function notFoundHandler(req: Request, res: Response): void {
  logger.warn('Route not found', { method: req.method, path: req.path });
  
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
  });
}

export default {
  asyncHandler,
  errorHandler,
  notFoundHandler,
};
