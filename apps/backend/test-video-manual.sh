#!/bin/bash

# Video Upload Test Suite - Manual Testing
# Run: bash test-video-manual.sh

API_URL="${API_URL:-http://localhost:4000}"
INTERNAL_TOKEN="renunganku-internal-dev-token"
AUTH_TOKEN=""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

log_test() {
    local test_num=$1
    local name=$2
    local status=$3
    local reason=$4
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ Test ${test_num}: ${name} — PASS${NC}"
    else
        echo -e "${RED}❌ Test ${test_num}: ${name} — FAIL${NC}"
        if [ -n "$reason" ]; then
            echo -e "${YELLOW}   Reason: ${reason}${NC}"
        fi
    fi
}

# Create test video
create_test_video() {
    local filename=$1
    local duration=${2:-5}
    local width=${3:-640}
    local height=${4:-480}
    
    ffmpeg -f lavfi -i testsrc=duration=${duration}:size=${width}x${height}:rate=30 \
           -f lavfi -i sine=frequency=1000:duration=${duration} \
           -c:v libx264 -preset ultrafast -c:a aac -y ${filename} 2>/dev/null
}

# Setup
echo -e "${BLUE}🚀 Video Upload Test Suite${NC}"
echo "========================================"

echo -e "\n${BLUE}🔧 Setup: Getting auth token...${NC}"

# Create test user
EMAIL="test-video-$(date +%s)@example.com"
PASSWORD="Test123456!"
NAMA="Test User $(date +%s)"

SIGNUP_RESPONSE=$(curl -s -X POST "${API_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -H "x-internal-api-token: ${INTERNAL_TOKEN}" \
    -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\",\"namaLengkap\":\"${NAMA}\"}")

AUTH_TOKEN=$(echo $SIGNUP_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$AUTH_TOKEN" ]; then
    AUTH_TOKEN=$(echo $SIGNUP_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$AUTH_TOKEN" ]; then
    echo -e "${RED}❌ Failed to get auth token${NC}"
    echo "Response: $SIGNUP_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Auth token obtained${NC}"

# 🟢 EASY Tests
echo -e "\n${GREEN}🟢 EASY — Validasi Dasar${NC}"

# Test 1: Upload video valid
echo "Creating test video..."
create_test_video "test-video-1.mp4" 5

START_TIME=$(date +%s%3N)
UPLOAD_RESPONSE=$(curl -s -X POST "${API_URL}/videos/upload" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -H "x-internal-api-token: ${INTERNAL_TOKEN}" \
    -F "video=@test-video-1.mp4" \
    -F "title=Test Video 1")
END_TIME=$(date +%s%3N)
DURATION=$((END_TIME - START_TIME))

VIDEO_ID=$(echo $UPLOAD_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
STATUS=$(echo $UPLOAD_RESPONSE | grep -o '"status":"[^"]*' | cut -d'"' -f4)

if [ -n "$VIDEO_ID" ] && [ "$STATUS" = "processing" ] && [ $DURATION -lt 2000 ]; then
    log_test 1 "Upload video valid" "PASS"
else
    log_test 1 "Upload video valid" "FAIL" "Duration: ${DURATION}ms, Status: ${STATUS}"
fi

rm -f test-video-1.mp4

# Test 2: Polling status
if [ -n "$VIDEO_ID" ]; then
    STATUS_RESPONSE=$(curl -s "${API_URL}/videos/${VIDEO_ID}/status" \
        -H "Authorization: Bearer ${AUTH_TOKEN}" \
        -H "x-internal-api-token: ${INTERNAL_TOKEN}")
    
    STATUS=$(echo $STATUS_RESPONSE | grep -o '"status":"[^"]*' | cut -d'"' -f4)
    PROGRESS=$(echo $STATUS_RESPONSE | grep -o '"progress":[0-9]*' | cut -d':' -f2)
    
    if [ "$STATUS" = "processing" ] && [ -n "$PROGRESS" ]; then
        log_test 2 "Polling status processing" "PASS"
    else
        log_test 2 "Polling status processing" "FAIL" "Status: ${STATUS}, Progress: ${PROGRESS}"
    fi
else
    log_test 2 "Polling status processing" "FAIL" "No video ID from Test 1"
fi

# Test 3: List video kosong (create new user)
NEW_EMAIL="test-empty-$(date +%s)@example.com"
NEW_SIGNUP=$(curl -s -X POST "${API_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -H "x-internal-api-token: ${INTERNAL_TOKEN}" \
    -d "{\"email\":\"${NEW_EMAIL}\",\"password\":\"${PASSWORD}\",\"namaLengkap\":\"Test Empty User\"}")

NEW_TOKEN=$(echo $NEW_SIGNUP | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
if [ -z "$NEW_TOKEN" ]; then
    NEW_TOKEN=$(echo $NEW_SIGNUP | grep -o '"token":"[^"]*' | cut -d'"' -f4)
fi

LIST_RESPONSE=$(curl -s "${API_URL}/videos" \
    -H "Authorization: Bearer ${NEW_TOKEN}" \
    -H "x-internal-api-token: ${INTERNAL_TOKEN}")

if [ "$LIST_RESPONSE" = "[]" ]; then
    log_test 3 "List video kosong" "PASS"
else
    log_test 3 "List video kosong" "FAIL" "Expected [], got: ${LIST_RESPONSE}"
fi

# Test 4: Queue stats
STATS_RESPONSE=$(curl -s "${API_URL}/videos/queue/stats" \
    -H "x-internal-api-token: ${INTERNAL_TOKEN}")

if echo "$STATS_RESPONSE" | grep -q '"waiting"' && echo "$STATS_RESPONSE" | grep -q '"active"'; then
    log_test 4 "Queue stats berjalan" "PASS"
else
    log_test 4 "Queue stats berjalan" "FAIL" "Invalid response: ${STATS_RESPONSE}"
fi

# 🟡 MEDIUM Tests
echo -e "\n${YELLOW}🟡 MEDIUM — Validasi Error & Edge Case${NC}"

# Test 5: Upload file > 100MB
echo "Creating large file (101MB)..."
dd if=/dev/zero of=test-large.mp4 bs=1M count=101 2>/dev/null

LARGE_RESPONSE=$(curl -s -X POST "${API_URL}/videos/upload" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -H "x-internal-api-token: ${INTERNAL_TOKEN}" \
    -F "video=@test-large.mp4")

if echo "$LARGE_RESPONSE" | grep -q "100MB" && echo "$LARGE_RESPONSE" | grep -q "101"; then
    # Check temp files
    TEMP_COUNT=$(ls /tmp/upload-* /tmp/compressed-* /tmp/thumb-* 2>/dev/null | wc -l)
    if [ $TEMP_COUNT -eq 0 ]; then
        log_test 5 "Upload file > 100MB" "PASS"
    else
        log_test 5 "Upload file > 100MB" "FAIL" "Temp files not cleaned: ${TEMP_COUNT} files"
    fi
else
    log_test 5 "Upload file > 100MB" "FAIL" "Wrong error message: ${LARGE_RESPONSE}"
fi

rm -f test-large.mp4

# Test 6: Upload format tidak valid
echo "test" > test-video.avi

AVI_RESPONSE=$(curl -s -X POST "${API_URL}/videos/upload" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -H "x-internal-api-token: ${INTERNAL_TOKEN}" \
    -F "video=@test-video.avi")

if echo "$AVI_RESPONSE" | grep -q "mp4" && echo "$AVI_RESPONSE" | grep -q "Invalid format"; then
    log_test 6 "Upload format tidak valid" "PASS"
else
    log_test 6 "Upload format tidak valid" "FAIL" "Wrong error: ${AVI_RESPONSE}"
fi

rm -f test-video.avi

# Test 7: Upload file bukan video
echo "test" > test-image.jpg

JPG_RESPONSE=$(curl -s -X POST "${API_URL}/videos/upload" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -H "x-internal-api-token: ${INTERNAL_TOKEN}" \
    -F "video=@test-image.jpg")

if echo "$JPG_RESPONSE" | grep -q "Invalid format"; then
    log_test 7 "Upload file bukan video" "PASS"
else
    log_test 7 "Upload file bukan video" "FAIL" "Should reject non-video"
fi

rm -f test-image.jpg

# Test 8: Get status video tidak ada
FAKE_ID="00000000-0000-0000-0000-000000000000"
NOT_FOUND_RESPONSE=$(curl -s -w "\n%{http_code}" "${API_URL}/videos/${FAKE_ID}/status" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -H "x-internal-api-token: ${INTERNAL_TOKEN}")

HTTP_CODE=$(echo "$NOT_FOUND_RESPONSE" | tail -1)

if [ "$HTTP_CODE" = "404" ]; then
    log_test 8 "Get status video tidak ada" "PASS"
else
    log_test 8 "Get status video tidak ada" "FAIL" "Expected 404, got ${HTTP_CODE}"
fi

# Test 9: Upload tanpa file
NO_FILE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/videos/upload" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -H "x-internal-api-token: ${INTERNAL_TOKEN}" \
    -F "title=No video")

HTTP_CODE=$(echo "$NO_FILE_RESPONSE" | tail -1)

if [ "$HTTP_CODE" = "400" ]; then
    log_test 9 "Upload tanpa file" "PASS"
else
    log_test 9 "Upload tanpa file" "FAIL" "Expected 400, got ${HTTP_CODE}"
fi

# Test 10: Upload tanpa auth token
create_test_video "test-noauth.mp4" 3

NO_AUTH_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/videos/upload" \
    -H "x-internal-api-token: ${INTERNAL_TOKEN}" \
    -F "video=@test-noauth.mp4")

HTTP_CODE=$(echo "$NO_AUTH_RESPONSE" | tail -1)

if [ "$HTTP_CODE" = "401" ]; then
    log_test 10 "Upload tanpa auth token" "PASS"
else
    log_test 10 "Upload tanpa auth token" "FAIL" "Expected 401, got ${HTTP_CODE}"
fi

rm -f test-noauth.mp4

echo -e "\n${BLUE}📊 Basic Tests Complete${NC}"
echo "Run HARD and EXTREME tests manually for full processing verification"
