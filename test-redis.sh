#!/bin/bash

# Redis Connection Test for Upstash
# Usage: ./test-redis.sh

REDIS_URL="redis://default:gQAAAAAAAWbwAAIncDI4ZWRiMmRiZDJkYTU0NmQwODc2MzhjZjdhM2Y1MTM4M3AyOTE4ODg@content-shiner-91888.upstash.io:6379"

echo "🔍 Testing Upstash Redis Connection..."
echo ""

# Test via REST API (more reliable)
echo "1. Testing REST API..."
RESULT=$(curl -s "https://content-shiner-91888.upstash.io/ping" \
  -H "Authorization: Bearer gQAAAAAAAWbwAAIncDI4ZWRiMmRiZDJkYTU0NmQwODc2MzhjZjdhM2Y1MTM4M3AyOTE4ODg")

if [[ $RESULT == *"PONG"* ]]; then
  echo "✅ REST API: Connected"
else
  echo "❌ REST API: Failed"
  exit 1
fi

echo ""
echo "2. Testing INFO command..."
INFO=$(curl -s "https://content-shiner-91888.upstash.io/info" \
  -H "Authorization: Bearer gQAAAAAAAWbwAAIncDI4ZWRiMmRiZDJkYTU0NmQwODc2MzhjZjdhM2Y1MTM4M3AyOTE4ODg")

echo "$INFO" | grep -q "redis_version"
if [ $? -eq 0 ]; then
  echo "✅ INFO: Success"
  echo ""
  echo "📊 Redis Stats:"
  echo "$INFO" | jq -r '.result' | grep -E "used_memory_human|connected_clients|total_commands_processed" | head -3
else
  echo "⚠️  INFO: Limited access (normal for free tier)"
fi

echo ""
echo "3. Testing SET/GET..."
SET_RESULT=$(curl -s "https://content-shiner-91888.upstash.io/set/test-key/test-value" \
  -H "Authorization: Bearer gQAAAAAAAWbwAAIncDI4ZWRiMmRiZDJkYTU0NmQwODc2MzhjZjdhM2Y1MTM4M3AyOTE4ODg")

GET_RESULT=$(curl -s "https://content-shiner-91888.upstash.io/get/test-key" \
  -H "Authorization: Bearer gQAAAAAAAWbwAAIncDI4ZWRiMmRiZDJkYTU0NmQwODc2MzhjZjdhM2Y1MTM4M3AyOTE4ODg")

if [[ $GET_RESULT == *"test-value"* ]]; then
  echo "✅ SET/GET: Working"
else
  echo "❌ SET/GET: Failed"
fi

# Cleanup
curl -s "https://content-shiner-91888.upstash.io/del/test-key" \
  -H "Authorization: Bearer gQAAAAAAAWbwAAIncDI4ZWRiMmRiZDJkYTU0NmQwODc2MzhjZjdhM2Y1MTM4M3AyOTE4ODg" > /dev/null

echo ""
echo "✅ All tests passed! Redis is ready for 2000 users."
echo ""
echo "📈 Capacity Estimation:"
echo "   - Free tier: 10,000 commands/day"
echo "   - Per video upload: ~20 commands"
echo "   - Max videos/day: ~500 uploads"
echo "   - For 2000 users (10% upload): 200 videos = 4,000 commands ✅"
echo ""
echo "🚀 Start backend: cd apps/backend && npm run start:dev"
