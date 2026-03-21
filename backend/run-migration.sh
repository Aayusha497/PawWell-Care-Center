#!/bin/bash
# Apply Prisma migrations to add payment-related fields to bookings table

set -e

echo "═══════════════════════════════════════════════════════════"
echo "🔄 PRISMA DATABASE MIGRATION"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "This script will:"
echo "1. Generate Prisma types from schema"
echo "2. Create database migration"
echo "3. Apply migration to database"
echo ""

cd "$(dirname "$0")"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ ERROR: .env file not found!"
    echo "Please ensure you're in the backend directory and .env is present"
    exit 1
fi

echo "📋 Step 1: Generating Prisma client..."
npx prisma generate
echo "✅ Prisma client generated"
echo ""

echo "📋 Step 2: Creating database migration..."
npx prisma migrate dev --name add_payment_fields_to_bookings
echo "✅ Migration applied"
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "✅ MIGRATION COMPLETE"
echo ""
echo "Next steps:"
echo "1. Verify database has new columns:"
echo "   SELECT booking_id, booking_status, payment_status, transaction_id, pidx"
echo "   FROM bookings LIMIT 1;"
echo ""
echo "2. Restart the backend server"
echo "3. Test the payment verification flow"
echo "═══════════════════════════════════════════════════════════"
