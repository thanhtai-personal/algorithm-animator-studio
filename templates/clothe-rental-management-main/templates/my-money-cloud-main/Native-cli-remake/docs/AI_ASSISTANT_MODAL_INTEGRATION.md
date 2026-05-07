# AI Assistant Modal Integration Guide

## Overview
The `AIAssistantModal` component provides a localized purchase interface for AI-powered transaction features. It displays pricing in USD or VND based on the user's language settings.

## Features
- 250 AI requests for $1 (or ~25,000₫)
- Automatic currency conversion based on locale
- Optional trial system with remaining count display
- Fully localized (English & Vietnamese)
- Three action buttons: Cancel, Try (if trials available), and Purchase

## Import

```tsx
import { AIAssistantModal } from "../../components/AIAssistantModal";
```

## Usage Example

```tsx
import React, { useState } from "react";
import { AIAssistantModal } from "../../components/AIAssistantModal";

export function YourComponent() {
  const [showAIModal, setShowAIModal] = useState(false);
  const [remainingTrials, setRemainingTrials] = useState(50); // Or 0 for no trials

  const handleTryAI = () => {
    console.log("User clicked try button");
    setShowAIModal(false);
    // Implement trial logic here
    // Decrease remainingTrials count
  };

  const handlePurchaseAI = () => {
    console.log("User clicked purchase button");
    setShowAIModal(false);
    // Implement purchase flow here
    // Navigate to Store screen or trigger in-app purchase
  };

  return (
    <>
      {/* Your component content */}
      <Button onPress={() => setShowAIModal(true)}>
        Show AI Modal
      </Button>

      {/* AI Assistant Modal */}
      <AIAssistantModal
        visible={showAIModal}
        onClose={() => setShowAIModal(false)}
        onTry={handleTryAI}
        onPurchase={handlePurchaseAI}
        remainingTrials={remainingTrials} // Optional: omit or set to 0 to hide trial button
      />
    </>
  );
}
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `visible` | `boolean` | Yes | - | Controls modal visibility |
| `onClose` | `() => void` | Yes | - | Callback when modal is dismissed |
| `onTry` | `() => void` | Yes | - | Callback when "Try" button is pressed |
| `onPurchase` | `() => void` | Yes | - | Callback when "Purchase" button is pressed |
| `remainingTrials` | `number` | No | `0` | Number of free trials remaining (set to 0 to hide trial button) |

## Pricing Display

The modal automatically formats prices based on the user's currency setting:

- **English (USD)**: `$1.00` for 250 requests
- **Vietnamese (VND)**: `25.000₫` for 250 requests

The conversion rate is approximate (1 USD = 25,000 VND).

## Translation Keys Used

The following translation keys are used (already added to `en.ts` and `vi.ts`):

- `aiModal.title` - Modal title
- `aiModal.description` - Feature description
- `aiModal.trialRemaining` - Trial count message
- `aiModal.packageTitle` - Package name with request count
- `aiModal.pricePerRequest` - Price per request detail
- `aiModal.feature1` - Feature list item 1
- `aiModal.feature2` - Feature list item 2
- `aiModal.feature3` - Feature list item 3
- `aiModal.tryButton` - Try button text
- `aiModal.purchaseButton` - Purchase button text

## Integration Points

### 1. Voice Transaction Screen

Show the modal when user attempts to use AI features:

```tsx
// In VoiceTransactionScreen.tsx
const [showAIModal, setShowAIModal] = useState(false);
const [aiRequestsRemaining, setAiRequestsRemaining] = useState(0);

// Before starting voice recognition
const handleVoicePress = () => {
  if (aiRequestsRemaining <= 0) {
    setShowAIModal(true);
    return;
  }
  // Start voice recognition...
};
```

### 2. Dashboard Quick Actions

Add AI Assistant as a quick action:

```tsx
// In QuickInputSection.tsx
<Pressable onPress={() => setShowAIModal(true)}>
  <MaterialCommunityIcons name="robot-outline" size={24} />
  <Text>AI Assistant</Text>
</Pressable>
```

### 3. Store Screen

Link from Store screen to directly purchase AI packages:

```tsx
// User can also purchase from Store screen
// When they tap on AI package, show this modal or go directly to purchase
```

## State Management

Consider storing AI request count in:
- Local AsyncStorage for offline tracking
- Supabase database for synced quota across devices
- In-app purchase verification for purchased packages

Example structure:

```typescript
interface AIQuota {
  userId: string;
  totalRequests: number;
  usedRequests: number;
  remainingRequests: number;
  lastPurchaseDate?: string;
}
```

## Screenshots

The modal matches the design from the user's screenshot with:
- Robot icon in header
- Feature description
- Trial status (if applicable)
- Package card with price and features
- Three action buttons at bottom
