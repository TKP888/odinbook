#!/bin/bash

echo "🚀 Starting OdinBook (Reorganized Version)"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "src/app.js" ]; then
    echo "❌ Error: src/app.js not found. Please run this script from the project root."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found. Please create one with your database credentials."
fi

echo "✅ Starting application from src/app.js..."
echo "🌐 Server will be available at http://localhost:3000"
echo "🛑 Press Ctrl+C to stop the server"
echo ""

# Start the application
node src/app.js
