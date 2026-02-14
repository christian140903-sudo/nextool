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

echo "3. Hacker News — Submit"
open "https://news.ycombinator.com/submit"
sleep 2

echo "4. Reddit r/InternetIsBeautiful — Create post"
open "https://www.reddit.com/r/InternetIsBeautiful/submit?type=LINK"
sleep 2

echo "5. Reddit r/pdf — Create post"
open "https://www.reddit.com/r/pdf/submit?type=TEXT"
sleep 2

echo "6. Reddit r/productivity — Create post"
open "https://www.reddit.com/r/productivity/submit?type=TEXT"
sleep 2

echo "7. dev.to — New article (paste from DEVTO_ARTICLE.md)"
open "https://dev.to/new"
sleep 2

echo "8. Twitter/X — New tweet"
open "https://twitter.com/compose/tweet"
sleep 2

echo "9. Product Hunt — Submit"
open "https://www.producthunt.com/posts/new"
sleep 2

echo ""
echo "================================"
echo "All tabs open!"
echo ""
echo "CONTENT SOURCES:"
echo "  General posts: ~/Desktop/nextool/DISTRIBUTION_POSTS.md"
echo "  dev.to article: ~/Desktop/nextool/DEVTO_ARTICLE.md"
echo "================================"
echo ""
echo "PRIORITY ORDER:"
echo "1. Reddit r/webdev (largest dev audience)"
echo "2. Reddit r/SideProject (supportive community)"
echo "3. Hacker News Show HN (can go viral)"
echo "4. Reddit r/InternetIsBeautiful (broad audience)"
echo "5. Reddit r/pdf (PDF tools = broad appeal)"
echo "6. Reddit r/productivity (non-dev audience)"
echo "7. dev.to article (SEO + community)"
echo "8. Twitter/X thread"
echo "9. Product Hunt (scheduled launch)"
