/**
 * ApiClient Unit Tests
 *
 * Tests for the API client's caching, retry, and deduplication logic.
 */
import { ApiClient } from "@/lib/api/client";

describe("ApiClient", () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient("https://api.example.com");
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe("GET requests", () => {
    it("should make a GET request and return data", async () => {
      const mockData = { id: 1, name: "Test" };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await client.get("/api/test");

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/test",
        expect.objectContaining({
          method: "GET",
        })
      );
    });

    it("should cache GET requests by default", async () => {
      const mockData = { id: 1, name: "Test" };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      // First request
      const result1 = await client.get("/api/test");
      // Second request (should use cache)
      const result2 = await client.get("/api/test");

      expect(result1).toEqual(mockData);
      expect(result2).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("should skip cache when cache option is false", async () => {
      const mockData = { id: 1, name: "Test" };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      await client.get("/api/test", { cache: false });
      await client.get("/api/test", { cache: false });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should deduplicate inflight requests", async () => {
      const mockData = { id: 1, name: "Test" };

      let resolveRequest: (value: unknown) => void;
      const requestPromise = new Promise((resolve) => {
        resolveRequest = resolve;
      });

      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        requestPromise.then(() => ({
          ok: true,
          json: () => Promise.resolve(mockData),
        }))
      );

      // Start two requests simultaneously
      const promise1 = client.get("/api/test");
      const promise2 = client.get("/api/test");

      // Resolve the request
      resolveRequest!(undefined);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1).toEqual(mockData);
      expect(result2).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("POST requests", () => {
    it("should make a POST request with body", async () => {
      const requestBody = { name: "Test" };
      const mockResponse = { id: 1, name: "Test" };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.post("/api/test", requestBody);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/api/test",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(requestBody),
        })
      );
    });
  });

  describe("Retry logic", () => {
    it("should retry on 500 errors", async () => {
      const mockData = { id: 1 };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ message: "Server error" }),
          headers: new Headers(),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockData),
        });

      const resultPromise = client.post("/api/test", {});

      // Fast-forward through retry delay
      await jest.advanceTimersByTimeAsync(1000);

      const result = await resultPromise;

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should retry on 429 rate limit errors", async () => {
      const mockData = { id: 1 };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: () => Promise.resolve({ message: "Rate limited" }),
          headers: new Headers(),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockData),
        });

      const resultPromise = client.post("/api/test", {});

      // Fast-forward through rate limit retry delay (2000ms base)
      await jest.advanceTimersByTimeAsync(2000);

      const result = await resultPromise;

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should respect Retry-After header", async () => {
      const mockData = { id: 1 };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: () => Promise.resolve({ message: "Rate limited" }),
          headers: new Headers({ "Retry-After": "5" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockData),
        });

      const resultPromise = client.post("/api/test", {});

      // Fast-forward through Retry-After delay (5 seconds)
      await jest.advanceTimersByTimeAsync(5000);

      const result = await resultPromise;

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should not retry on 4xx errors (except 429)", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: "Bad request" }),
        headers: new Headers(),
      });

      await expect(client.post("/api/test", {})).rejects.toEqual(
        expect.objectContaining({
          message: "Bad request",
        })
      );

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("Cache statistics", () => {
    it("should track cache hits and misses", async () => {
      const mockData = { id: 1 };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      // First request - cache miss
      await client.get("/api/test");
      // Second request - cache hit
      await client.get("/api/test");

      const stats = client.getCacheStats();

      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
      expect(stats.size).toBe(1);
    });

    it("should clear cache statistics on clearCache", async () => {
      const mockData = { id: 1 };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      await client.get("/api/test");
      await client.get("/api/test");

      client.clearCache();

      const stats = client.getCacheStats();

      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.size).toBe(0);
    });
  });

  describe("Cache invalidation", () => {
    it("should invalidate specific cache entry", async () => {
      const mockData = { id: 1 };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      await client.get("/api/test");
      client.invalidateCache("/api/test");
      await client.get("/api/test");

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should invalidate cache by prefix", async () => {
      const mockData = { id: 1 };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      await client.get("/api/bonfires/123/agents");
      await client.get("/api/bonfires/123/documents");

      client.invalidateCacheByPrefix("bonfires/123");

      await client.get("/api/bonfires/123/agents");
      await client.get("/api/bonfires/123/documents");

      expect(global.fetch).toHaveBeenCalledTimes(4);
    });
  });

  describe("Job polling", () => {
    it("should poll until job completes", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              id: "job-1",
              status: "processing",
              progress: 50,
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              id: "job-1",
              status: "complete",
              progress: 100,
              result: { data: "success" },
            }),
        });

      const onProgress = jest.fn();
      const resultPromise = client.pollJobStatus("job-1", {
        interval: 1000,
        onProgress,
      });

      // First poll
      await jest.advanceTimersByTimeAsync(0);
      // Wait for interval
      await jest.advanceTimersByTimeAsync(1000);

      const result = await resultPromise;

      expect(result).toEqual({ data: "success" });
      expect(onProgress).toHaveBeenCalledWith(50);
      expect(onProgress).toHaveBeenCalledWith(100);
    });

    it("should throw on job failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "job-1",
            status: "failed",
            error: "Job processing failed",
          }),
      });

      await expect(client.pollJobStatus("job-1")).rejects.toThrow(
        "Job processing failed"
      );
    });

    it("should timeout after specified duration", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "job-1",
            status: "processing",
            progress: 50,
          }),
      });

      const resultPromise = client.pollJobStatus("job-1", {
        interval: 1000,
        timeout: 3000,
      });

      // Advance past timeout
      await jest.advanceTimersByTimeAsync(3500);

      await expect(resultPromise).rejects.toThrow(
        "Job polling timeout exceeded"
      );
    });
  });
});
