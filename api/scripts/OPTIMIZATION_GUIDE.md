# User Meta Population Optimization Guide

This document explains the performance optimizations implemented in the user meta population script.

## Overview

The original `populateUserMeta()` function had significant performance issues when dealing with large datasets. The new `populateUserMetaOptimized()` function addresses these issues using MongoDB aggregations and bulk operations.

## Performance Issues in Original Implementation

### 1. N+1 Query Problem
- **Issue**: For each user, the original code made separate queries to:
  - AccessLog collection (last activity)
  - Device collection (user's devices)
  - SMS collection (multiple queries for different time periods)
  - Subscription collection (active subscription)
  - PolarWebhookPayload collection (billing info)
- **Impact**: With 10,000 users, this could result in 50,000+ database queries

### 2. Sequential Processing
- **Issue**: Users were processed one by one, even though operations could be parallelized
- **Impact**: Poor CPU utilization and longer execution time

### 3. Redundant Calculations
- **Issue**: Billing period calculations were repeated for each user
- **Impact**: Unnecessary CPU overhead

### 4. Memory Usage
- **Issue**: Loading all users into memory at once
- **Impact**: High memory consumption for large datasets

## Optimizations Implemented

### 1. MongoDB Aggregation Pipeline
```typescript
// Single aggregation that joins all necessary data
const pipeline = [
  { $skip: skip },
  { $limit: limit },
  
  // Join with access logs
  { $lookup: { from: 'accesslogs', ... } },
  
  // Join with devices
  { $lookup: { from: 'devices', ... } },
  
  // Join with subscriptions + plans
  { $lookup: { from: 'subscriptions', ... } },
  
  // Join with webhook payloads
  { $lookup: { from: 'polarwebhookpayloads', ... } },
  
  // Compute derived fields
  { $addFields: { ... } }
];
```

**Benefits**:
- Reduces queries from O(n×m) to O(1) where n=users, m=queries per user
- Database does the heavy lifting with optimized joins
- Only one round trip to database per batch

### 2. Bulk SMS Count Calculation
```typescript
// Single aggregation for all SMS counts across all periods
const pipeline = [
  { $match: { device: { $in: deviceIds } } },
  {
    $group: {
      _id: { device: '$device', type: '$type', period: '$period' },
      count: { $sum: 1 }
    }
  }
];
```

**Benefits**:
- Calculates all SMS counts in one query
- Groups by device, type, and time period simultaneously
- Eliminates multiple separate count queries

### 3. Batch Processing
```typescript
// Process users in configurable batches
for (let skip = 0; skip < totalUsers; skip += batchSize) {
  const batchResult = await this.processBatchOptimized(skip, batchSize, freePlan);
  // ... aggregate results
}
```

**Benefits**:
- Controlled memory usage
- Progress tracking
- Better error isolation

### 4. Bulk Write Operations
```typescript
// Prepare all updates, then execute in bulk
const bulkOps = users.map(userData => ({
  updateOne: {
    filter: { _id: userData._id },
    update: { $set: { meta: meta } }
  }
}));

await this.userModel.bulkWrite(bulkOps);
```

**Benefits**:
- Single database round trip for all updates
- Reduced network overhead
- Better transaction efficiency

## Performance Comparison

| Metric | Original Method | Optimized Method | Improvement |
|--------|----------------|------------------|-------------|
| Database Queries | O(n×m) ~50,000+ | O(batches) ~50 | **99%+ reduction** |
| Memory Usage | O(n) all users | O(batch_size) | **90%+ reduction** |
| Network Round Trips | ~50,000+ | ~50 | **99%+ reduction** |
| Expected Speed | ~5-10 users/sec | ~100+ users/sec | **10-20x faster** |

## Usage

### Run Original Method
```bash
cd api
pnpm run populate-user-meta
```

### Run Optimized Method
```bash
cd api
pnpm run populate-user-meta --optimized

# With custom batch size
pnpm run populate-user-meta --optimized --batch-size=500
```

### Command Line Options
- `--optimized` or `-o`: Use the optimized aggregation-based method
- `--batch-size=N`: Set batch size (default: 1000)

## Monitoring & Debugging

The optimized version provides detailed performance metrics:
- Processing time and speed (users/second)
- Batch-by-batch progress tracking
- Error isolation per batch
- Memory usage optimization

## Database Indexes

For optimal performance, ensure these indexes exist:

```javascript
// AccessLog collection
db.accesslogs.createIndex({ user: 1, createdAt: -1 });

// Device collection
db.devices.createIndex({ user: 1, enabled: 1 });

// SMS collection
db.sms.createIndex({ device: 1, type: 1, createdAt: -1 });

// Subscription collection
db.subscriptions.createIndex({ user: 1, isActive: 1, updatedAt: -1 });

// PolarWebhookPayload collection
db.polarwebhookpayloads.createIndex({ userId: 1, createdAt: -1 });
db.polarwebhookpayloads.createIndex({ "payload.data.email": 1, createdAt: -1 });
```

## Error Handling

The optimized version includes improved error handling:
- Batch-level error isolation
- Graceful degradation on partial failures
- Detailed error reporting
- Automatic retry capabilities (can be added)

## Future Improvements

1. **Incremental Updates**: Only process users with changes since last run
2. **Parallel Batch Processing**: Process multiple batches concurrently
3. **Caching**: Cache frequently accessed data like plans
4. **Real-time Updates**: Use change streams for real-time meta updates
5. **Database Views**: Pre-compute common aggregations

## Conclusion

The optimized version provides significant performance improvements while maintaining data accuracy and consistency. The aggregation-based approach leverages MongoDB's strengths and reduces application-level complexity.

For production environments with large user bases, the optimized method is strongly recommended.
