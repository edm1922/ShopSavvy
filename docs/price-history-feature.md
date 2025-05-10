# Price History & Alerts Feature

This document provides an overview of the Price History & Alerts feature in ShopSavvy.

## Overview

The Price History & Alerts feature allows users to:

1. Track price changes for products over time
2. Set price alerts to be notified when prices drop to a target level
3. View price history charts to make informed purchasing decisions
4. Receive notifications when price alerts are triggered

## Database Schema

### Price History Table

The `price_history` table stores historical price data for products:

```sql
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  platform TEXT NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### Price Alerts Table

The `price_alerts` table stores user-defined price alerts:

```sql
CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  target_price DECIMAL(10, 2) NOT NULL,
  current_price DECIMAL(10, 2) NOT NULL,
  product_url TEXT NOT NULL,
  platform TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_triggered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Notifications Table

The `notifications` table stores user notifications:

```sql
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

## Components

### Price History Chart

The `PriceHistoryChart` component displays a chart of price history for a product. It includes:

- Line chart showing price changes over time
- Time range selector (7 days, 30 days, 90 days, all time)
- Price statistics (lowest, average, highest)
- Price trend indicator

### Price Alert Form

The `PriceAlertForm` component allows users to set up price alerts for products. It includes:

- Target price slider
- Current price display
- Discount percentage calculation
- Success confirmation

### Track Price Button

The `TrackPriceButton` component provides a button to track a product's price and set up price alerts.

### Notifications Dropdown

The `NotificationsDropdown` component displays a dropdown menu with user notifications, including price alerts.

## API Endpoints

### Price History API

- `GET /api/price-history`: Retrieves price history for a product
- `POST /api/price-history`: Tracks a product's price

### Price Alerts API

- `GET /api/price-alerts`: Retrieves user's price alerts
- `POST /api/price-alerts`: Creates a new price alert
- `PATCH /api/price-alerts`: Updates a price alert
- `DELETE /api/price-alerts`: Deletes a price alert

### Notifications API

- `GET /api/notifications`: Retrieves user's notifications
- `PATCH /api/notifications`: Marks notifications as read
- `DELETE /api/notifications`: Deletes a notification

## Scheduled Price Tracking

The system includes a scheduled job that runs every 6 hours to:

1. Check prices of products with active price alerts
2. Update price history records
3. Trigger price alerts when prices drop to target levels
4. Create notifications for triggered alerts
5. Send email notifications to users

### Implementation

- Supabase Edge Function: `track-prices`
- GitHub Actions workflow: `.github/workflows/price-tracking.yml`
- Trigger script: `scripts/schedule-price-tracking.js`

## Email Notifications

The system sends email notifications to users for various events:

1. **Price Alert Emails**: Sent when a product's price drops to the user's target price
2. **Weekly Price Digest**: A weekly summary of the user's tracked products and their price changes
3. **Special Offers**: Promotional emails about deals and offers (opt-in)
4. **Account Notifications**: Important account-related information

### Email Preferences

Users can manage their email preferences in the Settings page:

- Enable/disable specific types of emails
- Control the frequency of emails
- Opt out of promotional emails

### Implementation

- Email Service: `src/services/email-service.ts`
- Supabase Edge Function: `send-email`
- Email Preferences Component: `src/components/app/EmailPreferences.tsx`
- Email Preferences API: `src/app/api/user/email-preferences/route.ts`

## User Flow

1. User views a product on ShopSavvy
2. User clicks "Track Price" button
3. System starts tracking the product's price
4. User sets a target price for an alert
5. System checks prices periodically
6. When price drops to target, user receives a notification
7. User can view price history chart to see trends

## Security

- Row Level Security (RLS) policies ensure users can only access their own data
- API endpoints validate user authentication
- Edge Functions use secure tokens for authorization

## Future Enhancements

- Push notifications for mobile devices
- Price prediction using machine learning
- Competitor price comparison
- Deal scoring based on historical prices
- Advanced email templates with more personalization
- SMS notifications for critical price drops
