#!/bin/bash

echo "🌱 TextBee Database Seeding Script"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the API directory."
    exit 1
fi

# Check if dist directory exists (compiled TypeScript)
if [ ! -d "dist" ]; then
    echo "📦 Building the application..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Build failed. Please check your code for errors."
        exit 1
    fi
fi

echo "🚀 Starting database seeding..."

# Run the seeding script
node dist/seed.js

if [ $? -eq 0 ]; then
    echo "✅ Database seeding completed successfully!"
    echo ""
    echo "📋 What was created:"
    echo "   • Admin user: ${ADMIN_EMAIL:-admin@example.com}"
    echo "   • Free plan: 10 daily, 100 monthly messages"
    echo "   • Mega plan: Unlimited messages"
    echo "   • Admin user assigned to Mega plan"
else
    echo "❌ Database seeding failed. Check the logs above for details."
    exit 1
fi