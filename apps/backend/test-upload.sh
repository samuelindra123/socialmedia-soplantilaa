#!/bin/bash

echo "🔑 Getting auth token..."
TOKEN=$(curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "mesakzitumpul@gmail.com", "password": "Samuelindra123"}' | jq -r '.accessToken')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "❌ Failed to get token"
  exit 1
fi

echo "✅ Token received: ${TOKEN:0:50}..."
echo ""
echo "📤 Uploading video..."

RESPONSE=$(curl -s -X POST http://localhost:4000/videos/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "videos=@/tmp/test-video.mp4" \
  -F "title=Test Video BullMQ" \
  -F "description=Testing FFmpeg compression")

echo "Response:"
echo "$RESPONSE" | jq .

echo ""
echo "⏳ Waiting 3 seconds for processing..."
sleep 3

echo ""
echo "📊 Checking queue status..."
node test-video-upload.js
