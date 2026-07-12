#!/bin/bash
# ============================================================================
# IndexNow Bulk URL Submission Script
# Submits ALL URLs from sitemap.xml to Bing, Yandex, and other search engines
# via the IndexNow protocol.
#
# Usage: ./scripts/indexnow-submit.sh
# ============================================================================

set -euo pipefail

SITE_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SITEMAP="$SITE_ROOT/sitemap.xml"
HOST="nextool.app"
KEY="nxt-a7f9b3e2c1d4f8e6"
KEY_FILE="$SITE_ROOT/${KEY}.txt"
KEY_LOCATION="https://${HOST}/${KEY}.txt"

# IndexNow endpoints
INDEXNOW_BING="https://www.bing.com/indexnow"
INDEXNOW_YANDEX="https://yandex.com/indexnow"
INDEXNOW_SEZNAM="https://search.seznam.cz/indexnow"
INDEXNOW_NAVER="https://searchadvisor.naver.com/indexnow"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  IndexNow Bulk URL Submission${NC}"
echo -e "${CYAN}  Host: ${HOST}${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

# Step 1: Ensure key file exists
if [ ! -f "$KEY_FILE" ]; then
    echo "$KEY" > "$KEY_FILE"
    echo -e "${GREEN}[+] Created IndexNow key file: ${KEY_FILE}${NC}"
else
    echo -e "${YELLOW}[=] Key file already exists: ${KEY_FILE}${NC}"
fi

# Step 2: Extract all URLs from sitemap
if [ ! -f "$SITEMAP" ]; then
    echo -e "${RED}[!] Sitemap not found: ${SITEMAP}${NC}"
    exit 1
fi

echo -e "${CYAN}[*] Extracting URLs from sitemap...${NC}"
URLS=$(sed -n 's/.*<loc>\([^<]*\)<\/loc>.*/\1/p' "$SITEMAP")
URL_COUNT=$(echo "$URLS" | wc -l | tr -d ' ')
echo -e "${GREEN}[+] Found ${URL_COUNT} URLs${NC}"
echo ""

# Step 3: Build JSON payload for batch submission
# IndexNow supports batch submission of up to 10,000 URLs
build_json_payload() {
    local url_list="$1"
    local json='{"host":"'"$HOST"'","key":"'"$KEY"'","keyLocation":"'"$KEY_LOCATION"'","urlList":['
    local first=true

    while IFS= read -r url; do
        if [ -z "$url" ]; then continue; fi
        if [ "$first" = true ]; then
            first=false
        else
            json+=','
        fi
        json+='"'"$url"'"'
    done <<< "$url_list"

    json+=']}'
    echo "$json"
}

JSON_PAYLOAD=$(build_json_payload "$URLS")

# Step 4: Submit to each IndexNow endpoint
submit_to_endpoint() {
    local endpoint_name="$1"
    local endpoint_url="$2"

    echo -e "${CYAN}[*] Submitting ${URL_COUNT} URLs to ${endpoint_name}...${NC}"

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST \
        -H "Content-Type: application/json; charset=utf-8" \
        -d "$JSON_PAYLOAD" \
        "${endpoint_url}" \
        --max-time 30 2>/dev/null || echo "000")

    case "$HTTP_CODE" in
        200) echo -e "${GREEN}    [+] ${endpoint_name}: OK (200) — URLs accepted${NC}" ;;
        202) echo -e "${GREEN}    [+] ${endpoint_name}: Accepted (202) — URLs queued${NC}" ;;
        400) echo -e "${RED}    [!] ${endpoint_name}: Bad Request (400) — Check payload${NC}" ;;
        403) echo -e "${RED}    [!] ${endpoint_name}: Forbidden (403) — Key mismatch${NC}" ;;
        422) echo -e "${YELLOW}    [~] ${endpoint_name}: Unprocessable (422) — Some URLs invalid${NC}" ;;
        429) echo -e "${YELLOW}    [~] ${endpoint_name}: Too Many Requests (429) — Rate limited${NC}" ;;
        000) echo -e "${RED}    [!] ${endpoint_name}: Connection failed${NC}" ;;
        *)   echo -e "${YELLOW}    [~] ${endpoint_name}: HTTP ${HTTP_CODE}${NC}" ;;
    esac
}

echo -e "${CYAN}--- Batch Submission (IndexNow Protocol) ---${NC}"
echo ""

submit_to_endpoint "Bing"   "$INDEXNOW_BING"
submit_to_endpoint "Yandex" "$INDEXNOW_YANDEX"
submit_to_endpoint "Seznam" "$INDEXNOW_SEZNAM"
submit_to_endpoint "Naver"  "$INDEXNOW_NAVER"

echo ""

# Step 5: Also ping sitemaps directly (Google + Bing classic)
echo -e "${CYAN}--- Sitemap Ping (Google + Bing) ---${NC}"
echo ""

SITEMAP_URL="https://${HOST}/sitemap.xml"

# Google Sitemap Ping
echo -e "${CYAN}[*] Pinging Google with sitemap...${NC}"
GOOGLE_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    "https://www.google.com/ping?sitemap=${SITEMAP_URL}" \
    --max-time 15 2>/dev/null || echo "000")
if [ "$GOOGLE_CODE" = "200" ]; then
    echo -e "${GREEN}    [+] Google: OK (200)${NC}"
else
    echo -e "${YELLOW}    [~] Google: HTTP ${GOOGLE_CODE}${NC}"
fi

# Bing Sitemap Ping
echo -e "${CYAN}[*] Pinging Bing with sitemap...${NC}"
BING_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    "https://www.bing.com/ping?sitemap=${SITEMAP_URL}" \
    --max-time 15 2>/dev/null || echo "000")
if [ "$BING_CODE" = "200" ]; then
    echo -e "${GREEN}    [+] Bing: OK (200)${NC}"
else
    echo -e "${YELLOW}    [~] Bing: HTTP ${BING_CODE}${NC}"
fi

echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${GREEN}  Done! ${URL_COUNT} URLs submitted.${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""
echo -e "${YELLOW}[i] Key file must be accessible at: ${KEY_LOCATION}${NC}"
echo -e "${YELLOW}[i] Verify: curl -I https://${HOST}/${KEY}.txt${NC}"
