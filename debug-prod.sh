#!/bin/bash

echo "🐳 TrialHub Production Debug Script"
echo "===================================="

# Build and run production container
echo "📦 Building production container..."
docker-compose -f docker-compose.prod.yml build

echo "🚀 Starting production container..."
docker-compose -f docker-compose.prod.yml up -d

echo "⏳ Waiting for app to start..."
sleep 10

echo "📋 Container Info:"
echo "Container ID: $(docker ps -q --filter 'name=trialhub-uk_app_1')"
echo "App URL: http://localhost:3000"
echo ""

echo "🔍 Health Check:"
docker ps --filter 'name=trialhub-uk_app_1' --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🔧 Debug Commands:"
echo "1. Get shell inside container:"
echo "   docker exec -it \$(docker ps -q --filter 'name=trialhub-uk_app_1') sh"
echo ""
echo "2. View logs:"
echo "   docker-compose -f docker-compose.prod.yml logs -f app"
echo ""
echo "3. Check health:"
echo "   curl -f http://localhost:3000/api/health || echo 'Health check failed'"
echo ""
echo "4. Stop container:"
echo "   docker-compose -f docker-compose.prod.yml down"
echo ""

echo "✅ Production container is running!"
echo "🌐 Open http://localhost:3000 to view your app"
