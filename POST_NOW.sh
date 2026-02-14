#!/bin/bash
# ============================================
# NexTool Quick Distribution — Run this script
# It opens all posting URLs in your browser
# Just paste the content from DISTRIBUTION_POSTS.md
# ============================================

echo "Opening distribution channels..."
echo ""
echo "1. Reddit r/webdev — Create post"
open "https://www.reddit.com/r/webdev/submit?type=TEXT"
sleep 2

echo "2. Reddit r/SideProject — Create post"
open "https://www.reddit.com/r/SideProject/submit?type=TEXT"
sleep 2

echo "3. Reddit r/InternetIsBeautiful — Create post"
open "https://www.reddit.com/r/InternetIsBeautiful/submit?type=LINK"
sleep 2

echo "4. Hacker News — Submit"
open "https://news.ycombinator.com/submit"
sleep 2

echo "5. dev.to — New article"
open "https://dev.to/new"
sleep 2

echo "6. Product Hunt — Submit"
open "https://www.producthunt.com/posts/new"
sleep 2

echo ""
echo "================================"
echo "All tabs open!"
echo "Copy content from: ~/Desktop/nextool/DISTRIBUTION_POSTS.md"
echo "================================"
echo ""
echo "PRIORITY ORDER:"
echo "1. Reddit r/webdev (largest dev audience)"
echo "2. Reddit r/SideProject (supportive community)"
echo "3. Hacker News Show HN (can go viral)"
echo "4. dev.to article (SEO + community)"
echo "5. Reddit r/InternetIsBeautiful"
echo "6. Product Hunt"
