import axios, { AxiosError } from 'axios';

interface CacheEntry {
  response: any;
  timestamp: number;
  retryCount?: number;
}

interface StreamCallback {
  onData: (chunk: string) => void;
  onError: (error: Error) => void;
  onComplete: () => void;
  onRetry?: (attempt: number) => void;
}

interface StreamOptions {
  chunkSize?: number;
  chunkDelay?: number;
  maxRetries?: number;
  retryDelay?: number;
}

class AIService {
  private static instance: AIService;
  private cache: Map<string, CacheEntry>;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly DEBOUNCE_DELAY = 300; // 300ms
  private readonly DEFAULT_CHUNK_SIZE = 15; // Characters per chunk
  private readonly DEFAULT_CHUNK_DELAY = 30; // ms between chunks
  private readonly DEFAULT_MAX_RETRIES = 3;
  private readonly DEFAULT_RETRY_DELAY = 1000; // ms
  private debounceTimer: NodeJS.Timeout | null = null;
  private abortController: AbortController | null = null;
  private streamInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.cache = new Map();
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private getCacheKey(prompt: string): string {
    return prompt.trim().toLowerCase();
  }

  private isCacheValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < this.CACHE_DURATION;
  }

  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    maxRetries: number,
    retryDelay: number,
    onRetry?: (attempt: number) => void
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (error instanceof AxiosError) {
          if (error.response?.status === 404) {
            throw new Error('AI service endpoint not found. Please check the API configuration.');
          }
          if (error.response?.status === 500) {
            const message = error.response.data?.message || 'AI service error';
            throw new Error(message);
          }
        }

        if (attempt < maxRetries) {
          onRetry?.(attempt);
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }

  public async getAIResponse(prompt: string): Promise<any> {
    const cacheKey = this.getCacheKey(prompt);
    const cachedResponse = this.cache.get(cacheKey);

    if (cachedResponse && this.isCacheValid(cachedResponse)) {
      return cachedResponse.response;
    }

    try {
      const response = await this.retryRequest(
        () => axios.post('/api/ai/ask', { prompt }),
        this.DEFAULT_MAX_RETRIES,
        this.DEFAULT_RETRY_DELAY
      );

      this.cache.set(cacheKey, {
        response: response.data,
        timestamp: Date.now(),
        retryCount: 0
      });
      return response.data;
    } catch (error) {
      console.error('AI request failed:', error);
      throw error;
    }
  }

  public async streamAIResponse(
    prompt: string,
    callbacks: StreamCallback,
    options: StreamOptions = {}
  ): Promise<void> {
    const {
      chunkSize = this.DEFAULT_CHUNK_SIZE,
      chunkDelay = this.DEFAULT_CHUNK_DELAY,
      maxRetries = this.DEFAULT_MAX_RETRIES,
      retryDelay = this.DEFAULT_RETRY_DELAY
    } = options;

    // Cancel any ongoing request
    this.cancelStream();

    this.abortController = new AbortController();

    try {
      const response = await this.retryRequest(
        () => axios.post('/api/ai/ask', { prompt }, {
          signal: this.abortController?.signal
        }),
        maxRetries,
        retryDelay,
        callbacks.onRetry
      );

      if (!response.data || !response.data.response) {
        throw new Error('Invalid response format');
      }

      const message = response.data.response;
      let currentIndex = 0;

      this.streamInterval = setInterval(() => {
        if (currentIndex >= message.length) {
          this.cleanupStream();
          callbacks.onComplete();
          return;
        }

        const chunk = message.slice(currentIndex, currentIndex + chunkSize);
        currentIndex += chunkSize;
        callbacks.onData(chunk);
      }, chunkDelay);

      // Cache the complete response
      const cacheKey = this.getCacheKey(prompt);
      this.cache.set(cacheKey, {
        response: { message },
        timestamp: Date.now(),
        retryCount: 0
      });

    } catch (error) {
      this.cleanupStream();
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request was aborted');
      } else {
        callbacks.onError(error instanceof Error ? error : new Error('Unknown error occurred'));
      }
    }
  }

  private cleanupStream(): void {
    if (this.streamInterval) {
      clearInterval(this.streamInterval);
      this.streamInterval = null;
    }
    this.abortController = null;
  }

  public debouncedGetAIResponse(prompt: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      this.debounceTimer = setTimeout(async () => {
        try {
          const response = await this.getAIResponse(prompt);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      }, this.DEBOUNCE_DELAY);
    });
  }

  public cancelStream(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.cleanupStream();
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public getCacheStats(): { size: number; hitCount: number } {
    return {
      size: this.cache.size,
      hitCount: Array.from(this.cache.values()).filter(entry => entry.retryCount === 0).length
    };
  }
}

export const aiService = AIService.getInstance(); 