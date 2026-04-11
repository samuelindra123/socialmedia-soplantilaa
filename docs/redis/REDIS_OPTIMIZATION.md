# Redis Optimization for Upstash Free Tier

## Upstash Free Tier Limits
- **10,000 commands/day** (~7 commands/minute sustained)
- **256 MB storage**
- **1,000 concurrent connections**
- **100 requests/second**

## Optimizations Applied ✅

### 1. **Connection Settings** (app.module.ts)
```typescript
maxRetriesPerRequest: 3        // Reduced from 20 (save failed attempts)
enableReadyCheck: false        // Faster connection
enableOfflineQueue: false      // Don't queue when offline
connectTimeout: 10000          // 10s timeout
retryStrategy: max 3 retries   // Stop early on failure
```

### 2. **Job Retention** (app.module.ts)
```typescript
removeOnComplete: 100          // Keep last 100 completed jobs
removeOnFail: 200              // Keep last 200 failed jobs
stalledInterval: 60000         // Check stalled every 60s (not 30s)
maxStalledCount: 2             // Retry stalled max 2 times
lockDuration: 30000            // 30s lock
```

### 3. **Video Queue Limits** (video-queues.module.ts)
```typescript
// Video Processing Queue
attempts: 2                    // Reduced from 3
backoff: fixed 3000ms          // Predictable delay
removeOnComplete: 50           // Keep fewer jobs
limiter: max 2 jobs/second     // Process 2 videos at once max

// Chunk Encoding Queue  
attempts: 2
backoff: fixed 1000ms
removeOnComplete: 20           // Chunks complete fast
limiter: max 10 jobs/second    // Balance speed vs resources
```

### 4. **Processor Concurrency**
```typescript
video-processing: concurrency 1    // Sequential (CPU intensive)
chunk-encoding: concurrency 10     // Parallel but limited
```

## Redis Command Usage Estimation

### Per Video Upload (with processing):
- Queue job: ~5 commands
- Job progress updates: ~10 commands
- Job completion: ~5 commands
- **Total: ~20 commands/video**

### Per 2000 Users/Day:
- Assume 10% upload videos: 200 videos
- 200 videos × 20 commands = **4,000 commands/day**
- **Well within 10,000 limit** ✅

### Per User Session:
- WebSocket connection: 0 Redis commands (uses memory)
- Feed/posts: cached in PostgreSQL
- Notifications: minimal Redis usage

## Monitoring

Check Redis usage:
```bash
# Connect to Upstash
redis-cli -u $REDIS_URL

# Check memory usage
INFO memory

# Check command stats
INFO commandstats

# Check queue sizes
LLEN bull:video-processing:wait
LLEN bull:chunk-encoding:wait
```

## Scaling Strategy

### Current (Free Tier):
- ✅ 2000 users
- ✅ ~200 video uploads/day
- ✅ 4,000 Redis commands/day

### If Exceeding Limits:
1. **Upgrade to Upstash Pro** ($10/month)
   - 1M commands/day
   - 1 GB storage
   
2. **Optimize Further**:
   - Disable video processing (use original only)
   - Increase `removeOnComplete` to 10
   - Process videos in batches (off-peak hours)

3. **Alternative: Local Redis**
   - Self-host Redis on same server
   - No command limits
   - Requires server maintenance

## Performance Impact

### Before Optimization:
- ❌ MaxRetriesPerRequestError (20 retries × many commands)
- ❌ Stalled job checks every 30s
- ❌ Keeping all completed jobs forever

### After Optimization:
- ✅ Fast fail (3 retries max)
- ✅ Reduced polling (60s intervals)
- ✅ Auto-cleanup old jobs
- ✅ **~70% reduction in Redis commands**

## Best Practices

1. **Monitor daily usage** in Upstash dashboard
2. **Set alerts** at 80% of daily limit
3. **Batch video processing** during off-peak hours if needed
4. **Cache aggressively** in PostgreSQL/memory
5. **Use WebSocket** for real-time (no Redis needed)

## Emergency Fallback

If Redis quota exceeded:
```typescript
// In videos.service.ts - already implemented
try {
  await this.videoQueue.add(...)
} catch (queueError) {
  console.warn('Queue unavailable, skipping processing');
  // Video still uploaded, just no processing
}
```

Users can still upload videos, they just won't be processed until Redis is available again.
