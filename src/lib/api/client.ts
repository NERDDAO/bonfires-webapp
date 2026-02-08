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

interface CacheStats {
  /** Total number of cached entries */
  size: number;
  /** Number of inflight requests */
  inflight: number;
  /** Cache hits since creation */
  hits: number;
  /** Cache misses since creation */
  misses: number;
  /** Hit rate (0-1) */
  hitRate: number;
  /** Average TTL remaining in ms */
  avgTtlMs: number | undefined;
  /** When cache was created/reset */
  createdAt: number;
  /** Sample of cache keys (for debugging) */
  sampleKeys: string[];
}

const DEFAULT_TIMEOUT = 60000; // 60 seconds
const DEFAULT_CACHE_TTL = 60000; // 1 minute
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 1000;
const RATE_LIMIT_RETRY_DELAY = 2000; // 2 seconds for 429 responses

/**
 * Check if an error status code should be retried
 */
function shouldRetryStatus(status: number): boolean {
  // Retry on 5xx server errors
  if (status >= 500 && status < 600) return true;
  // Retry on 429 rate limit
  if (status === 429) return true;
  return false;
}

/**
 * Get retry delay based on status and retry count
 */
function getRetryDelay(
  status: number,
  retryCount: number,
  retryAfterHeader?: string | null
): number {
  // If we have a Retry-After header, use it
  if (retryAfterHeader) {
    const seconds = parseInt(retryAfterHeader, 10);
    if (!isNaN(seconds)) {
      return seconds * 1000;
    }
  }

  // For 429 rate limits, use a longer base delay
  if (status === 429) {
    return RATE_LIMIT_RETRY_DELAY * Math.pow(2, retryCount);
  }

  // Standard exponential backoff for server errors
  return RETRY_BASE_DELAY * Math.pow(2, retryCount);
}

class ApiClient {
  private baseUrl: string;
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private inflightRequests: Map<string, Promise<unknown>> = new Map();
  private cacheHits = 0;
  private cacheMisses = 0;
  private inflightShares = 0;
  private createdAt = Date.now();

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? process.env["NEXT_PUBLIC_DELVE_API_URL"] ?? "";
  }

  /**
   * GET request with caching and deduplication
   */
  async get<T>(
    endpoint: string,
    options?: { cache?: boolean; ttl?: number }
  ): Promise<T> {
    const { cache = true, ttl = DEFAULT_CACHE_TTL } = options ?? {};
    const cacheKey = `GET:${endpoint}`;

    // Check cache
    if (cache) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached !== null) {
        this.cacheHits++;
        return cached;
      }
      this.cacheMisses++;
    }

    // Deduplicate inflight requests
    const inflight = this.inflightRequests.get(cacheKey);
    if (inflight) {
      this.inflightShares++;
      return inflight as Promise<T>;
    }

    const request = this.request<T>(endpoint, { method: "GET" }).then(
      (data) => {
        if (cache) {
          this.setCache(cacheKey, data, ttl);
        }
        return data;
      }
    );

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
   * PATCH request
   */
  async patch<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: "PATCH", body: data });
  }

  /**
   * Initiate an async job for long-running operations
   */
  async initiateJob(
    endpoint: string,
    data: unknown
  ): Promise<{ jobId: string }> {
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
    const {
      interval = 1000,
      timeout = 5 * 60 * 1000,
      onProgress,
    } = options ?? {};
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const job = await this.get<AsyncJob<T>>(`/api/jobs/${jobId}`, {
        cache: false,
      });

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
   * Core request method with retry logic for server errors and rate limits
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
        const errorData = (await response
          .json()
          .catch(() => ({}))) as Partial<ApiError>;
        const error = {
          code: errorData.code ?? "UNKNOWN_ERROR",
          message: errorData.message ?? `HTTP ${response.status}`,
          details: errorData.details,
          status: response.status,
        };

        // Retry on transient errors (5xx and 429)
        if (shouldRetryStatus(response.status) && retryCount < MAX_RETRIES) {
          const retryAfter = response.headers.get("Retry-After");
          const delay = getRetryDelay(response.status, retryCount, retryAfter);

          // Cap delay at 30 seconds
          const cappedDelay = Math.min(delay, 30000);

          await this.sleep(cappedDelay);
          return this.request<T>(endpoint, config, retryCount + 1);
        }

        throw error;
      }

      return response.json() as Promise<T>;
    } catch (error) {
      clearTimeout(timeoutId);

      console.log("error api", error);

      // Retry on network/timeout errors
      if (error instanceof Error && retryCount < MAX_RETRIES) {
        const isNetworkError =
          error.name === "AbortError" ||
          error.name === "TypeError" ||
          error.message.includes("network") ||
          error.message.includes("fetch");

        if (isNetworkError) {
          const delay = RETRY_BASE_DELAY * Math.pow(2, retryCount);
          await this.sleep(delay);
          return this.request<T>(endpoint, config, retryCount + 1);
        }
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
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.inflightShares = 0;
    this.createdAt = Date.now();
  }

  /**
   * Clear specific cache key
   */
  invalidateCache(endpoint: string): void {
    this.cache.delete(`GET:${endpoint}`);
  }

  /**
   * Invalidate all cache entries matching a prefix
   * Useful for bonfire-scoped invalidation
   */
  invalidateCacheByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Invalidate cache for a specific bonfire
   */
  invalidateBonfireCache(bonfireId: string): void {
    this.invalidateCacheByPrefix(`bonfire_id=${bonfireId}`);
    this.invalidateCacheByPrefix(`bonfires/${bonfireId}`);
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): CacheStats {
    const total = this.cacheHits + this.cacheMisses;
    const hitRate = total > 0 ? this.cacheHits / total : 0;

    // Calculate average TTL remaining
    const ttlSamples: number[] = [];
    const now = Date.now();
    for (const entry of this.cache.values()) {
      const remaining = entry.ttl - (now - entry.timestamp);
      if (remaining > 0) {
        ttlSamples.push(remaining);
      }
    }
    const avgTtlMs =
      ttlSamples.length > 0
        ? Math.round(ttlSamples.reduce((a, b) => a + b, 0) / ttlSamples.length)
        : undefined;

    // Get sample of keys (up to 5)
    const sampleKeys = Array.from(this.cache.keys()).slice(0, 5);

    return {
      size: this.cache.size,
      inflight: this.inflightRequests.size,
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate,
      avgTtlMs,
      createdAt: this.createdAt,
      sampleKeys,
    };
  }

  /**
   * Log cache statistics to console (for debugging)
   */
  logCacheStats(): void {
    const stats = this.getCacheStats();
    console.debug("[ApiClient] Cache Statistics:", {
      ...stats,
      hitRatePercent: `${(stats.hitRate * 100).toFixed(1)}%`,
      avgTtlSec: stats.avgTtlMs
        ? `${(stats.avgTtlMs / 1000).toFixed(1)}s`
        : "N/A",
      ageMs: Date.now() - stats.createdAt,
    });
  }

  /**
   * Prefetch data into cache
   */
  async prefetch<T>(endpoint: string, ttl = DEFAULT_CACHE_TTL): Promise<void> {
    try {
      await this.get<T>(endpoint, { cache: true, ttl });
    } catch {
      // Silently fail prefetch
    }
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

// Export types
export type { CacheStats, RequestConfig };
