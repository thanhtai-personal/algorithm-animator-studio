# AI Assistant Modal Integration Guide - Next.js Web App

## Overview
The `AIAssistantModal` component provides a localized purchase interface for AI-powered transaction features in the Next.js web application. It displays pricing in USD or VND based on the user's language settings.

## Features
- 250 AI requests for $1 (or ~25,000₫)
- Automatic currency conversion based on locale
- Optional trial system with remaining count display
- Fully localized (English, Vietnamese, Korean, Chinese, Japanese, Hindi)
- Responsive design using Tailwind CSS and shadcn/ui
- Three action buttons: Cancel, Try (if trials available), and Purchase

## Import

```tsx
import { AIAssistantModal } from "@/components/AIAssistantModal";
```

## Usage Example

```tsx
"use client";

import React, { useState } from "react";
import { AIAssistantModal } from "@/components/AIAssistantModal";
import { Button } from "@/components/ui/button";

export function YourComponent() {
  const [showAIModal, setShowAIModal] = useState(false);
  const [remainingTrials, setRemainingTrials] = useState(50); // Or 0 for no trials

  const handleTryAI = () => {
    console.log("User clicked try button");
    setShowAIModal(false);
    // Implement trial logic here
    // Decrease remainingTrials count
    setRemainingTrials((prev) => Math.max(0, prev - 1));
  };

  const handlePurchaseAI = () => {
    console.log("User clicked purchase button");
    setShowAIModal(false);
    // Implement purchase flow here
    // Redirect to payment page or trigger purchase API
  };

  return (
    <>
      <Button onClick={() => setShowAIModal(true)}>
        Open AI Modal
      </Button>

      <AIAssistantModal
        open={showAIModal}
        onClose={() => setShowAIModal(false)}
        onTry={handleTryAI}
        onPurchase={handlePurchaseAI}
        remainingTrials={remainingTrials}
      />
    </>
  );
}
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `open` | `boolean` | Yes | - | Controls modal visibility |
| `onClose` | `() => void` | Yes | - | Callback when modal is dismissed |
| `onTry` | `() => void` | Yes | - | Callback when "Try" button is pressed |
| `onPurchase` | `() => void` | Yes | - | Callback when "Purchase" button is pressed |
| `remainingTrials` | `number` | No | `0` | Number of free trials remaining (set to 0 to hide trial button) |

## Pricing Display

The modal automatically formats prices based on the user's currency setting:

### Supported Currencies
- **English (USD)**: `$1.00` for 250 requests
- **Vietnamese (VND)**: `25.000₫` for 250 requests
- **Korean (KRW)**: `₩1,250` for 250 requests (approximate)
- **Chinese (CNY)**: `¥7.20` for 250 requests (approximate)
- **Japanese (JPY)**: `¥150` for 250 requests (approximate)
- **Hindi (INR)**: `₹83` for 250 requests (approximate)

The conversion rates are approximate and can be updated using the `formatPrice` function.

## Translation Keys Used

The following translation keys are used (added to all language files):

- `aiModal.title` - Modal title ("AI Assistant")
- `aiModal.description` - Feature description
- `aiModal.trialRemaining` - Trial count message with {{count}} parameter
- `aiModal.packageTitle` - Package name with {{count}} parameter
- `aiModal.pricePerRequest` - Price per request detail with {{price}} parameter
- `aiModal.feature1` - Voice-to-transaction conversion
- `aiModal.feature2` - Intelligent category suggestions
- `aiModal.feature3` - Automatic amount detection
- `aiModal.tryButton` - Try button text with {{count}} parameter
- `aiModal.purchaseButton` - Purchase button text

## Integration Points

### 1. Dashboard Quick Actions

Show AI Assistant as a quick input method:

```tsx
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

<Button
  variant="outline"
  onClick={() => setShowAIModal(true)}
  className="gap-2"
>
  <Bot className="h-4 w-4" />
  AI Assistant
</Button>
```

### 2. Transaction Input Screen

Trigger modal when user attempts to use AI features:

```tsx
const [showAIModal, setShowAIModal] = useState(false);
const [aiRequestsRemaining, setAiRequestsRemaining] = useState(0);

const handleAIInput = () => {
  if (aiRequestsRemaining <= 0) {
    setShowAIModal(true);
    return;
  }
  // Proceed with AI input...
};
```

### 3. Settings/Profile Page

Add a section for AI Assistant management:

```tsx
<div className="space-y-2">
  <h3 className="font-semibold">AI Assistant</h3>
  <p className="text-sm text-muted-foreground">
    {aiRequestsRemaining} requests remaining
  </p>
  <Button onClick={() => setShowAIModal(true)}>
    Manage AI Package
  </Button>
</div>
```

## State Management

### Recommended Database Schema

Store AI request quota in Supabase:

```sql
CREATE TABLE ai_quotas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_requests INTEGER NOT NULL DEFAULT 0,
  used_requests INTEGER NOT NULL DEFAULT 0,
  trial_requests INTEGER NOT NULL DEFAULT 50,
  trial_used INTEGER NOT NULL DEFAULT 0,
  last_purchase_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Calculate remaining requests
CREATE OR REPLACE FUNCTION get_remaining_requests(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  quota RECORD;
  trial_remaining INTEGER;
  purchased_remaining INTEGER;
BEGIN
  SELECT * INTO quota FROM ai_quotas WHERE user_id = p_user_id;
  
  IF quota IS NULL THEN
    RETURN 50; -- Default trial for new users
  END IF;
  
  trial_remaining := quota.trial_requests - quota.trial_used;
  purchased_remaining := quota.total_requests - quota.used_requests;
  
  RETURN GREATEST(0, trial_remaining) + GREATEST(0, purchased_remaining);
END;
$$ LANGUAGE plpgsql;
```

### React Query Hook Example

```tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useAIQuota() {
  const queryClient = useQueryClient();

  const { data: quota } = useQuery({
    queryKey: ["ai-quota"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("ai_quotas")
        .select("*")
        .eq("user_id", user.id)
        .single();

      return data;
    },
  });

  const useRequest = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Try to use trial first, then purchased
      const { data, error } = await supabase.rpc("use_ai_request", {
        p_user_id: user.id,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-quota"] });
    },
  });

  const getRemainingRequests = () => {
    if (!quota) return 50; // Default trial
    const trialRemaining = Math.max(0, quota.trial_requests - quota.trial_used);
    const purchasedRemaining = Math.max(0, quota.total_requests - quota.used_requests);
    return trialRemaining + purchasedRemaining;
  };

  return {
    quota,
    remainingRequests: getRemainingRequests(),
    useRequest,
  };
}
```

### Usage in Component

```tsx
"use client";

import { useAIQuota } from "@/hooks/useAIQuota";
import { AIAssistantModal } from "@/components/AIAssistantModal";

export function AIFeature() {
  const [showModal, setShowModal] = useState(false);
  const { remainingRequests, useRequest } = useAIQuota();

  const handleTry = async () => {
    setShowModal(false);
    // Use one request from trial
    await useRequest.mutateAsync();
  };

  const handlePurchase = () => {
    setShowModal(false);
    // Redirect to payment or open payment modal
    window.location.href = "/pricing";
  };

  return (
    <AIAssistantModal
      open={showModal}
      onClose={() => setShowModal(false)}
      onTry={handleTry}
      onPurchase={handlePurchase}
      remainingTrials={remainingRequests}
    />
  );
}
```

## Payment Integration

### Stripe Example

```tsx
const handlePurchase = async () => {
  const stripe = await stripePromise;
  
  const response = await fetch("/api/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      product: "ai-requests-250",
      price: 100, // $1.00 in cents
    }),
  });

  const session = await response.json();
  await stripe?.redirectToCheckout({ sessionId: session.id });
};
```

## Styling

The component uses Tailwind CSS and shadcn/ui components. To customize:

```tsx
// Customize dialog size
<DialogContent className="sm:max-w-lg"> // Change from sm:max-w-md

// Customize button colors
<Button className="bg-gradient-to-r from-purple-600 to-blue-600">

// Dark mode support is automatic via shadcn/ui theming
```

## Accessibility

The component includes:
- ARIA labels for screen readers
- Keyboard navigation support (ESC to close, Tab to navigate)
- Focus management (auto-focus on first interactive element)
- Semantic HTML structure

## Testing

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { AIAssistantModal } from "@/components/AIAssistantModal";

test("shows trial button when trials remaining", () => {
  const onTry = jest.fn();
  
  render(
    <AIAssistantModal
      open={true}
      onClose={() => {}}
      onTry={onTry}
      onPurchase={() => {}}
      remainingTrials={50}
    />
  );

  const tryButton = screen.getByText(/Try 50 requests/i);
  expect(tryButton).toBeInTheDocument();
  
  fireEvent.click(tryButton);
  expect(onTry).toHaveBeenCalled();
});

test("hides trial button when no trials", () => {
  render(
    <AIAssistantModal
      open={true}
      onClose={() => {}}
      onTry={() => {}}
      onPurchase={() => {}}
      remainingTrials={0}
    />
  );

  const tryButton = screen.queryByText(/Try/i);
  expect(tryButton).not.toBeInTheDocument();
});
```

## Future Enhancements

- Real-time exchange rate API integration (using EXCHANGE_RATE_API_KEY from .env.local)
- Package tiers (250, 1000, 5000 requests)
- Subscription model option
- Usage analytics dashboard
- Referral program for free requests
