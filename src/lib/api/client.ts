/**
 * API Client
 *
 * Lightweight API client with request deduplication, caching, and retry logic.
 * Integrates with React Query for query-level caching.
 */

import type { ApiError, AsyncJob } from "@/types";

interface RequestConfig {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_CACHE_TTL = 60000; // 1 minute
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 1000;

class ApiClient {
  private baseUrl: string;
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private inflightRequests: Map<string, Promise<unknown>> = new Map();

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? process.env["NEXT_PUBLIC_DELVE_API_URL"] ?? "";
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: { cache?: boolean; ttl?: number }): Promise<T> {
    const { cache = true, ttl = DEFAULT_CACHE_TTL } = options ?? {};
    const cacheKey = `GET:${endpoint}`;

    // Check cache
    if (cache) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    // Deduplicate inflight requests
    const inflight = this.inflightRequests.get(cacheKey);
    if (inflight) {
      return inflight as Promise<T>;
    }

    const request = this.request<T>(endpoint, { method: "GET" }).then((data) => {
      if (cache) {
        this.setCache(cacheKey, data, ttl);
      }
      return data;
    });

    this.inflightRequests.set(cacheKey, request);
    try {
      return await request;
    } finally {
      this.inflightRequests.delete(cacheKey);
    }
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: "POST", body: data });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: "PUT", body: data });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  /**
   * Initiate an async job for long-running operations
   */
  async initiateJob(endpoint: string, data: unknown): Promise<{ jobId: string }> {
    return this.post<{ jobId: string }>(endpoint, data);
  }

  /**
   * Poll for async job status until completion or failure
   */
  async pollJobStatus<T>(
    jobId: string,
    options?: {
      interval?: number;
      timeout?: number;
      onProgress?: (progress: number) => void;
    }
  ): Promise<T> {
    const { interval = 1000, timeout = 5 * 60 * 1000, onProgress } = options ?? {};
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const job = await this.get<AsyncJob<T>>(`/api/jobs/${jobId}`, { cache: false });

      if (job.progress !== undefined && onProgress) {
        onProgress(job.progress);
      }

      if (job.status === "complete" && job.result !== undefined) {
        return job.result;
      }

      if (job.status === "failed") {
        throw new Error(job.error ?? "Job failed");
      }

      await this.sleep(interval);
    }

    throw new Error("Job polling timeout exceeded");
  }

  /**
   * Core request method with retry logic
   */
  private async request<T>(
    endpoint: string,
    config: RequestConfig,
    retryCount = 0
  ): Promise<T> {
    const url = endpoint.startsWith("/api/")
      ? endpoint
      : `${this.baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      config.timeout ?? DEFAULT_TIMEOUT
    );

    try {
      const response = await fetch(url, {
        method: config.method,
        headers: {
          "Content-Type": "application/json",
          ...config.headers,
        },
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as Partial<ApiError>;
        const error = {
          code: errorData.code ?? "UNKNOWN_ERROR",
          message: errorData.message ?? `HTTP ${response.status}`,
          details: errorData.details,
        };

        // Retry on 5xx errors
        if (response.status >= 500 && retryCount < MAX_RETRIES) {
          const delay = RETRY_BASE_DELAY * Math.pow(2, retryCount);
          await this.sleep(delay);
          return this.request<T>(endpoint, config, retryCount + 1);
        }

        throw error;
      }

      return response.json() as Promise<T>;
    } catch (error) {
      clearTimeout(timeoutId);

      // Retry on network errors
      if (
        error instanceof Error &&
        error.name === "AbortError" &&
        retryCount < MAX_RETRIES
      ) {
        const delay = RETRY_BASE_DELAY * Math.pow(2, retryCount);
        await this.sleep(delay);
        return this.request<T>(endpoint, config, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Get from cache if not expired
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache entry
   */
  private setCache<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear specific cache key
   */
  invalidateCache(endpoint: string): void {
    this.cache.delete(`GET:${endpoint}`);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const apiClient = new ApiClient();

// Export class for testing
export { ApiClient };
