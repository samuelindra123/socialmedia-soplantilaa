#!/bin/bash

# Video Upload Test Suite - Using existing user
# Run: bash test-video-complete.sh

API_URL="${API_URL:-http://localhost:4000}"
INTERNAL_TOKEN="renunganku-internal-dev-token"

# Test user credentials
EMAIL="mesakzitumpul@gmail.com"
PASSWORD="Samuelindra123"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

PASS_COUNT=0
FAIL_COUNT=0

log_test() {
    local test_num=$1
    local name=$2
    local status=$3
    local duration=$4
    local reason=$5
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ Test ${test_num}: ${name} — PASS${NC}"
        if [ -n "$duration" ]; then
            echo -e "   Duration: ${duration}ms"
        fi
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${RED}❌ Test ${test_num}: ${name} — FAIL${NC}"
        if [ -n "$reason" ]; then
            echo -e "${YELLOW}   Reason: ${reason}${NC}"
        fi
        FAIL_COUNT=$((FAIL_COUNT + 1))
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

echo -e "\n${BLUE}🔧 Setup: Logging in...${NC}"

LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -H "x-internal-api-token: ${INTERNAL_TOKEN}" \
    -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")

AUTH_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$AUTH_TOKEN" ]; then
    echo -e "${RED}❌ Failed to login${NC}"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Logged in successfully${NC}"

# 🟢 EASY Tests
echo -e "\n${GREEN}🟢 EASY — Validasi Dasar${NC}"

# Test 1: Upload video valid
echo "Creating test video..."
create_test_video "test-video-1.mp4" 5

START_TIME=$(date +%s%3N 2>/dev/null || python3 -c "import time; print(int(time.time()*1000))")
UPLOAD_RESPONSE=$(curl -s -X POST "${API_URL}/videos/upload" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -H "x-internal-api-token: ${INTERNAL_TOKEN}" \
    -F "video=@test-video-1.mp4" \
    -F "title=Test Video 1")
END_TIME=$(date +%s%3N 2>/dev/null || python3 -c "import time; print(int(time.time()*1000))")
DURATION=$((END_TIME - START_TIME))

VIDEO_ID=$(echo $UPLOAD_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
STATUS=$(echo $UPLOAD_RESPONSE | grep -o '"status":"[^"]*' | cut -d'"' -f4)

if [ -n "$VIDEO_ID" ] && [ "$STATUS" = "processing" ] && [ $DURATION -lt 2000 ]; then
    log_test 1 "Upload video valid" "PASS" "$DURATION"
else
    log_test 1 "Upload video valid" "FAIL" "" "Duration: ${DURATION}ms, Status: ${STATUS}, Response: ${UPLOAD_RESPONSE}"
fi

rm -f test-video-1.mp4

# Test 2: Polling status
if [ -n "$VIDEO_ID" ]; then
    sleep 1
    STATUS_RESPONSE=$(curl -s "${API_URL}/videos/${VIDEO_ID}/status" \
        -H "Authorization: Bearer ${AUTH_TOKEN}" \
        -H "x-internal-api-token: ${INTERNAL_TOKEN}")
    
    STATUS=$(echo $STATUS_RESPONSE | grep -o '"status":"[^"]*' | cut -d'"' -f4)
    PROGRESS=$(echo $STATUS_RESPONSE | grep -o '"progress":[0-9]*' | cut -d':' -f2)
    
    if [ "$STATUS" = "processing" ] && [ -n "$PROGRESS" ]; then
        log_test 2 "Polling status processing" "PASS"
    else
        log_test 2 "Polling status processing" "FAIL" "" "Status: ${STATUS}, Progress: ${PROGRESS}"
    fi
else
    log_test 2 "Polling status processing" "FAIL" "" "No video ID from Test 1"
fi

# Test 3: List videos
LIST_RESPONSE=$(curl -s "${API_URL}/videos" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -H "x-internal-api-token: ${INTERNAL_TOKEN}")

if echo "$LIST_RESPONSE" | grep -q '\['; then
    log_test 3 "List videos" "PASS"
else
    log_test 3 "List videos" "FAIL" "" "Invalid response: ${LIST_RESPONSE}"
fi

# Test 4: Queue stats
STATS_RESPONSE=$(curl -s "${API_URL}/videos/queue/stats" \
    -H "x-internal-api-token: ${INTERNAL_TOKEN}")

if echo "$STATS_RESPONSE" | grep -q '"waiting"' && echo "$STATS_RESPONSE" | grep -q '"active"'; then
    log_test 4 "Queue stats berjalan" "PASS"
else
    log_test 4 "Queue stats berjalan" "FAIL" "" "Invalid response: ${STATS_RESPONSE}"
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

if echo "$LARGE_RESPONSE" | grep -q "100MB"; then
    # Check temp files
    TEMP_COUNT=$(ls /tmp/upload-* /tmp/compressed-* /tmp/thumb-* 2>/dev/null | wc -l)
    if [ $TEMP_COUNT -eq 0 ]; then
        log_test 5 "Upload file > 100MB" "PASS"
    else
        log_test 5 "Upload file > 100MB" "FAIL" "" "Temp files not cleaned: ${TEMP_COUNT} files"
    fi
else
    log_test 5 "Upload file > 100MB" "FAIL" "" "Wrong error message: ${LARGE_RESPONSE}"
fi

rm -f test-large.mp4

# Test 6: Upload format tidak valid
echo "test" > test-video.avi

AVI_RESPONSE=$(curl -s -X POST "${API_URL}/videos/upload" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -H "x-internal-api-token: ${INTERNAL_TOKEN}" \
    -F "video=@test-video.avi")

if echo "$AVI_RESPONSE" | grep -q "Invalid format"; then
    log_test 6 "Upload format tidak valid" "PASS"
else
    log_test 6 "Upload format tidak valid" "FAIL" "" "Wrong error: ${AVI_RESPONSE}"
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
    log_test 7 "Upload file bukan video" "FAIL" "" "Should reject non-video"
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
    log_test 8 "Get status video tidak ada" "FAIL" "" "Expected 404, got ${HTTP_CODE}"
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
    log_test 9 "Upload tanpa file" "FAIL" "" "Expected 400, got ${HTTP_CODE}"
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
    log_test 10 "Upload tanpa auth token" "FAIL" "" "Expected 401, got ${HTTP_CODE}"
fi

rm -f test-noauth.mp4

# 🟠 HARD Tests
echo -e "\n${BLUE}🟠 HARD — Fungsionalitas Inti${NC}"

# Test 11: Video berhasil diproses penuh
echo "Creating test video for full processing..."
create_test_video "test-video-full.mp4" 10 1920 1080

UPLOAD_RESPONSE=$(curl -s -X POST "${API_URL}/videos/upload" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -H "x-internal-api-token: ${INTERNAL_TOKEN}" \
    -F "video=@test-video-full.mp4" \
    -F "title=Full Processing Test")

FULL_VIDEO_ID=$(echo $UPLOAD_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -n "$FULL_VIDEO_ID" ]; then
    echo "Video uploaded: ${FULL_VIDEO_ID}"
    echo "Waiting for processing (polling every 5 seconds)..."
    
    MAX_WAIT=900 # 15 minutes
    ELAPSED=0
    VIDEO_READY=false
    
    while [ $ELAPSED -lt $MAX_WAIT ]; do
        sleep 5
        ELAPSED=$((ELAPSED + 5))
        
        STATUS_RESPONSE=$(curl -s "${API_URL}/videos/${FULL_VIDEO_ID}/status" \
            -H "Authorization: Bearer ${AUTH_TOKEN}" \
            -H "x-internal-api-token: ${INTERNAL_TOKEN}")
        
        STATUS=$(echo $STATUS_RESPONSE | grep -o '"status":"[^"]*' | cut -d'"' -f4)
        PROGRESS=$(echo $STATUS_RESPONSE | grep -o '"progress":[0-9]*' | cut -d':' -f2)
        
        echo "   ${ELAPSED}s: Status=${STATUS}, Progress=${PROGRESS}%"
        
        if [ "$STATUS" = "ready" ]; then
            VIDEO_READY=true
            
            # Check all required fields
            VIDEO_URL=$(echo $STATUS_RESPONSE | grep -o '"videoUrl":"[^"]*' | cut -d'"' -f4)
            THUMB_URL=$(echo $STATUS_RESPONSE | grep -o '"thumbnailUrl":"[^"]*' | cut -d'"' -f4)
            DURATION=$(echo $STATUS_RESPONSE | grep -o '"duration":[0-9]*' | cut -d':' -f2)
            WIDTH=$(echo $STATUS_RESPONSE | grep -o '"width":[0-9]*' | cut -d':' -f2)
            HEIGHT=$(echo $STATUS_RESPONSE | grep -o '"height":[0-9]*' | cut -d':' -f2)
            ORIG_SIZE=$(echo $STATUS_RESPONSE | grep -o '"originalSize":[0-9]*' | cut -d':' -f2)
            COMP_SIZE=$(echo $STATUS_RESPONSE | grep -o '"compressedSize":[0-9]*' | cut -d':' -f2)
            
            if [ -n "$VIDEO_URL" ] && [ -n "$THUMB_URL" ] && [ "$PROGRESS" = "100" ] && \
               [ -n "$DURATION" ] && [ -n "$WIDTH" ] && [ -n "$HEIGHT" ] && \
               [ -n "$ORIG_SIZE" ] && [ -n "$COMP_SIZE" ] && [ $COMP_SIZE -lt $ORIG_SIZE ]; then
                log_test 11 "Video berhasil diproses penuh" "PASS"
                
                # Test 12: Verifikasi kompresi
                COMPRESSION_RATIO=$(echo "scale=2; (1 - $COMP_SIZE / $ORIG_SIZE) * 100" | bc)
                echo "   Compression ratio: ${COMPRESSION_RATIO}%"
                
                if [ $(echo "$COMPRESSION_RATIO >= 20" | bc) -eq 1 ]; then
                    log_test 12 "Verifikasi kompresi terjadi" "PASS"
                else
                    log_test 12 "Verifikasi kompresi terjadi" "FAIL" "" "Compression only ${COMPRESSION_RATIO}%"
                fi
                
                # Test 13: Verifikasi faststart
                echo "Downloading video to check faststart..."
                curl -s -o downloaded-video.mp4 "${VIDEO_URL}"
                
                if [ -f "downloaded-video.mp4" ]; then
                    # Cek moov atom posisi menggunakan ffprobe trace
                    MOOV_LINE=$(ffprobe -v trace -i downloaded-video.mp4 2>&1 | grep -n "type:'moov'" | head -1 | cut -d: -f1)
                    MDAT_LINE=$(ffprobe -v trace -i downloaded-video.mp4 2>&1 | grep -n "type:'mdat'" | head -1 | cut -d: -f1)
                    
                    if [ -n "$MOOV_LINE" ] && [ -n "$MDAT_LINE" ] && [ $MOOV_LINE -lt $MDAT_LINE ]; then
                        log_test 13 "Verifikasi faststart (moov atom)" "PASS"
                    else
                        log_test 13 "Verifikasi faststart (moov atom)" "FAIL" "" "moov atom not before mdat"
                    fi
                    
                    rm -f downloaded-video.mp4
                else
                    log_test 13 "Verifikasi faststart (moov atom)" "FAIL" "" "Could not download video"
                fi
                
                # Test 14: Verifikasi thumbnail
                echo "Downloading thumbnail..."
                curl -s -o downloaded-thumb.jpg "${THUMB_URL}"
                
                if [ -f "downloaded-thumb.jpg" ] && [ -s "downloaded-thumb.jpg" ]; then
                    # Ganti ke JSON parsing
                    DIMENSIONS=$(ffprobe -v error -select_streams v:0 \
                      -show_entries stream=width,height \
                      -of json downloaded-thumb.jpg 2>/dev/null)
                    THUMB_WIDTH=$(echo "$DIMENSIONS" | grep '"width"' | grep -o '[0-9]*')
                    THUMB_HEIGHT=$(echo "$DIMENSIONS" | grep '"height"' | grep -o '[0-9]*')
                    
                    if [ "$THUMB_WIDTH" = "640" ] && [ "$THUMB_HEIGHT" = "360" ]; then
                        log_test 14 "Verifikasi thumbnail" "PASS"
                    else
                        log_test 14 "Verifikasi thumbnail" "FAIL" "" "Wrong dimensions: ${THUMB_WIDTH}x${THUMB_HEIGHT}"
                    fi
                    
                    rm -f downloaded-thumb.jpg
                else
                    log_test 14 "Verifikasi thumbnail" "FAIL" "" "Could not download thumbnail"
                fi
                
                # Test 15: Video muncul di list
                LIST_RESPONSE=$(curl -s "${API_URL}/videos" \
                    -H "Authorization: Bearer ${AUTH_TOKEN}" \
                    -H "x-internal-api-token: ${INTERNAL_TOKEN}")
                
                if echo "$LIST_RESPONSE" | grep -q "$FULL_VIDEO_ID"; then
                    log_test 15 "Video muncul di list setelah ready" "PASS"
                else
                    log_test 15 "Video muncul di list setelah ready" "FAIL" "" "Video not in list"
                fi
            else
                log_test 11 "Video berhasil diproses penuh" "FAIL" "" "Missing fields in response"
            fi
            
            break
        fi
        
        if [ "$STATUS" = "failed" ]; then
            log_test 11 "Video berhasil diproses penuh" "FAIL" "" "Video processing failed"
            break
        fi
    done
    
    if [ "$VIDEO_READY" = false ]; then
        log_test 11 "Video berhasil diproses penuh" "FAIL" "" "Timeout after ${MAX_WAIT}s"
    fi
else
    log_test 11 "Video berhasil diproses penuh" "FAIL" "" "Upload failed"
fi

rm -f test-video-full.mp4

# Test 16: Temp files terhapus
TEMP_COUNT=$(ls /tmp/upload-* /tmp/compressed-* /tmp/thumb-* 2>/dev/null | wc -l)
if [ $TEMP_COUNT -eq 0 ]; then
    log_test 16 "Temp files terhapus" "PASS"
else
    log_test 16 "Temp files terhapus" "FAIL" "" "${TEMP_COUNT} temp files remaining"
fi

# Final Report
echo -e "\n${BLUE}📊 Test Report${NC}"
echo "========================================"
TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo -e "Total: ${TOTAL} tests"
echo -e "${GREEN}Passed: ${PASS_COUNT} tests${NC}"
echo -e "${RED}Failed: ${FAIL_COUNT} tests${NC}"

if [ $TOTAL -gt 0 ]; then
    SUCCESS_RATE=$(echo "scale=2; $PASS_COUNT * 100 / $TOTAL" | bc)
    echo -e "Success Rate: ${SUCCESS_RATE}%"
fi

echo ""
if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
else
    echo -e "${YELLOW}⚠️  Some tests failed. Review the output above.${NC}"
fi
