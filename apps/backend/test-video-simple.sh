#!/bin/bash

# Simple Video Upload Test - Using existing verified user or create one
# Run: bash test-video-simple.sh

API_URL="${API_URL:-http://localhost:4000}"
INTERNAL_TOKEN="renunganku-internal-dev-token"

# Use existing user credentials or create new one
# For testing, you can manually create a verified user in database
# or use an existing one

echo "🚀 Video Upload Simple Test"
echo "========================================"
echo ""
echo "Please provide credentials for a verified user:"
read -p "Email: " EMAIL
read -sp "Password: " PASSWORD
echo ""

# Login
echo "🔧 Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -H "x-internal-api-token: ${INTERNAL_TOKEN}" \
    -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")

AUTH_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$AUTH_TOKEN" ]; then
    echo "❌ Login failed"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Logged in successfully"
echo ""

# Test 1: Create small test video
echo "📹 Creating test video (5 seconds)..."
ffmpeg -f lavfi -i testsrc=duration=5:size=640x480:rate=30 \
       -f lavfi -i sine=frequency=1000:duration=5 \
       -c:v libx264 -preset ultrafast -c:a aac -y test-video.mp4 2>/dev/null

if [ ! -f "test-video.mp4" ]; then
    echo "❌ Failed to create test video"
    exit 1
fi

FILE_SIZE=$(stat -f%z "test-video.mp4" 2>/dev/null || stat -c%s "test-video.mp4" 2>/dev/null)
echo "✅ Test video created ($(echo "scale=2; $FILE_SIZE/1024/1024" | bc)MB)"
echo ""

# Test 2: Upload video
echo "📤 Uploading video..."
START_TIME=$(date +%s%3N 2>/dev/null || echo "0")

UPLOAD_RESPONSE=$(curl -s -X POST "${API_URL}/videos/upload" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -H "x-internal-api-token: ${INTERNAL_TOKEN}" \
    -F "video=@test-video.mp4" \
    -F "title=Test Video Upload")

END_TIME=$(date +%s%3N 2>/dev/null || echo "0")
DURATION=$((END_TIME - START_TIME))

echo "Response: $UPLOAD_RESPONSE"
echo "Duration: ${DURATION}ms"
echo ""

VIDEO_ID=$(echo $UPLOAD_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
STATUS=$(echo $UPLOAD_RESPONSE | grep -o '"status":"[^"]*' | cut -d'"' -f4)

if [ -n "$VIDEO_ID" ] && [ "$STATUS" = "processing" ]; then
    echo "✅ Upload successful!"
    echo "   Video ID: $VIDEO_ID"
    echo "   Status: $STATUS"
else
    echo "❌ Upload failed"
    rm -f test-video.mp4
    exit 1
fi

rm -f test-video.mp4
echo ""

# Test 3: Poll status
echo "🔄 Polling video status..."
for i in {1..5}; do
    sleep 2
    STATUS_RESPONSE=$(curl -s "${API_URL}/videos/${VIDEO_ID}/status" \
        -H "Authorization: Bearer ${AUTH_TOKEN}" \
        -H "x-internal-api-token: ${INTERNAL_TOKEN}")
    
    STATUS=$(echo $STATUS_RESPONSE | grep -o '"status":"[^"]*' | cut -d'"' -f4)
    PROGRESS=$(echo $STATUS_RESPONSE | grep -o '"progress":[0-9]*' | cut -d':' -f2)
    
    echo "   Poll $i: Status=$STATUS, Progress=$PROGRESS%"
    
    if [ "$STATUS" = "ready" ]; then
        echo "✅ Video is ready!"
        echo ""
        echo "Full response:"
        echo "$STATUS_RESPONSE" | jq . 2>/dev/null || echo "$STATUS_RESPONSE"
        break
    fi
    
    if [ "$STATUS" = "failed" ]; then
        echo "❌ Video processing failed"
        break
    fi
done

echo ""

# Test 4: Queue stats
echo "📊 Queue stats:"
STATS=$(curl -s "${API_URL}/videos/queue/stats" \
    -H "x-internal-api-token: ${INTERNAL_TOKEN}")
echo "$STATS" | jq . 2>/dev/null || echo "$STATS"

echo ""
echo "✅ Test complete!"
echo ""
echo "To continue monitoring, run:"
echo "  watch -n 3 'curl -s ${API_URL}/videos/${VIDEO_ID}/status -H \"Authorization: Bearer ${AUTH_TOKEN}\" -H \"x-internal-api-token: ${INTERNAL_TOKEN}\" | jq .'"
