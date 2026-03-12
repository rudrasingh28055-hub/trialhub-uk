#!/bin/bash

echo "🐳 TrialHub Container Debug Script"
echo "=================================="

# Build and run development container
echo "📦 Building development container..."
docker-compose -f docker-compose.yml build

echo "🚀 Starting development container..."
docker-compose -f docker-compose.yml up -d

echo "📋 Container Info:"
echo "Container ID: $(docker ps -q --filter 'name=trialhub-uk_app_1')"
echo "App URL: http://localhost:3000"
echo ""

echo "🔧 Debug Commands:"
echo "1. Get shell inside container:"
echo "   docker exec -it \$(docker ps -q --filter 'name=trialhub-uk_app_1') sh"
echo ""
echo "2. View logs:"
echo "   docker-compose -f docker-compose.yml logs -f app"
echo ""
echo "3. Stop container:"
echo "   docker-compose -f docker-compose.yml down"
echo ""
echo "4. Rebuild and restart:"
echo "   docker-compose -f docker-compose.yml up --build -d"
echo ""

echo "✅ Development container is running!"
echo "🌐 Open http://localhost:3000 to view your app"
