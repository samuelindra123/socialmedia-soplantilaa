#!/bin/bash

# Quick Video Upload Test - No ffmpeg, use existing video
API_URL="http://localhost:4000"
INTERNAL_TOKEN="renunganku-internal-dev-token"
EMAIL="mesakzitumpul@gmail.com"
PASSWORD="Samuelindra123"

echo "🚀 Quick Video Upload Test"
echo "================================"

# Login
echo "🔧 Logging in..."
TOKEN=$(curl -s -X POST "${API_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -H "x-internal-api-token: ${INTERNAL_TOKEN}" \
    -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed"
    exit 1
fi
echo "✅ Logged in"

# Create minimal valid MP4 (hex dump of minimal MP4)
echo "📹 Creating minimal test MP4..."
echo -n -e '\x00\x00\x00\x20\x66\x74\x79\x70\x69\x73\x6f\x6d\x00\x00\x02\x00\x69\x73\x6f\x6d\x69\x73\x6f\x32\x6d\x70\x34\x31\x00\x00\x00\x08\x66\x72\x65\x65' > test.mp4

# Test 1: Upload
echo "📤 Test 1: Upload video..."
RESPONSE=$(curl -s -X POST "${API_URL}/videos/upload" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "x-internal-api-token: ${INTERNAL_TOKEN}" \
    -F "video=@test.mp4" \
    -F "title=Quick Test")

echo "Response: $RESPONSE"

VIDEO_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
STATUS=$(echo $RESPONSE | grep -o '"status":"[^"]*' | cut -d'"' -f4)

if [ -n "$VIDEO_ID" ] && [ "$STATUS" = "processing" ]; then
    echo "✅ Test 1: PASS - Upload successful (ID: $VIDEO_ID)"
else
    echo "❌ Test 1: FAIL - Response: $RESPONSE"
    rm -f test.mp4
    exit 1
fi

# Test 2: Status
echo "📊 Test 2: Check status..."
STATUS_RESPONSE=$(curl -s "${API_URL}/videos/${VIDEO_ID}/status" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "x-internal-api-token: ${INTERNAL_TOKEN}")

echo "Status: $STATUS_RESPONSE"

if echo "$STATUS_RESPONSE" | grep -q '"status"'; then
    echo "✅ Test 2: PASS - Status endpoint works"
else
    echo "❌ Test 2: FAIL"
fi

# Test 3: Queue stats
echo "📊 Test 3: Queue stats..."
STATS=$(curl -s "${API_URL}/videos/queue/stats" \
    -H "x-internal-api-token: ${INTERNAL_TOKEN}")

echo "Stats: $STATS"

if echo "$STATS" | grep -q '"waiting"'; then
    echo "✅ Test 3: PASS - Queue stats works"
else
    echo "❌ Test 3: FAIL"
fi

# Test 4: Invalid format
echo "🚫 Test 4: Upload invalid file..."
echo "not a video" > test.txt
INVALID_RESPONSE=$(curl -s -X POST "${API_URL}/videos/upload" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "x-internal-api-token: ${INTERNAL_TOKEN}" \
    -F "video=@test.txt")

if echo "$INVALID_RESPONSE" | grep -q "Invalid format"; then
    echo "✅ Test 4: PASS - Invalid format rejected"
else
    echo "❌ Test 4: FAIL - Should reject invalid format"
fi

# Test 5: Video not found
echo "🔍 Test 5: Get non-existent video..."
NOT_FOUND=$(curl -s -w "\n%{http_code}" "${API_URL}/videos/00000000-0000-0000-0000-000000000000/status" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "x-internal-api-token: ${INTERNAL_TOKEN}")

HTTP_CODE=$(echo "$NOT_FOUND" | tail -1)

if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "404" ]; then
    echo "✅ Test 5: PASS - Returns error for non-existent video"
else
    echo "❌ Test 5: FAIL - Expected 400/404, got $HTTP_CODE"
fi

# Cleanup
rm -f test.mp4 test.txt

echo ""
echo "✅ Quick tests complete!"
echo "Note: Full processing test requires waiting 5-10 minutes for video to be ready"
