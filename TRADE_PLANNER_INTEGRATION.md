# Trade Planner Integration Guide

## Overview
The Trade Planner feature allows users to create and manage trade bundles before executing them. Users can plan trades by setting a target value or manually selecting cards, view all their trade plans, and execute plans to log actual trades.

## Components Created

### 1. Backend Components
- **`server/src/models/tradePlan.ts`** - MongoDB schema for trade plans
- **`server/src/routes.ts`** - API endpoints (added at end of file):
  - `GET /api/trade-plans` - List all plans
  - `GET /api/trade-plans/:id` - Get single plan
  - `POST /api/trade-plans` - Create new plan
  - `PUT /api/trade-plans/:id` - Update plan
  - `DELETE /api/trade-plans/:id` - Delete plan
  - `POST /api/trade-plans/:id/complete` - Mark as completed

### 2. Frontend Components
- **`types.ts`** - Added BundledCard, TradePlan, BundleSuggestion interfaces
- **`utils/bundleSuggestions.ts`** - Algorithm to generate 3-5 bundle suggestions
- **`services/dataService.ts`** - API client methods for trade plans
- **`components/TradePlanner.tsx`** - Main planner modal (target/manual modes)
- **`components/BundleSuggestionCard.tsx`** - Displays bundle suggestions
- **`components/TradePlansList.tsx`** - Lists all trade plans with filters
- **`components/TradePlanDetail.tsx`** - View and manage single plan
- **`components/TradePlanExecutionModal.tsx`** - Execute trade plan

## Integration Steps

### Step 1: Add Trade Plans View to App.tsx

Add these imports:
\`\`\`typescript
import { TradePlanner } from './components/TradePlanner';
import { TradePlansList } from './components/TradePlansList';
import { TradePlanDetail } from './components/TradePlanDetail';
import { TradePlanExecutionModal } from './components/TradePlanExecutionModal';
import { TradePlan } from './types';
\`\`\`

Add state variables:
\`\`\`typescript
const [tradePlansView, setTradePlansView] = useState<'list' | 'detail' | null>(null);
const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
const [showTradePlanner, setShowTradePlanner] = useState(false);
const [showExecutionModal, setShowExecutionModal] = useState(false);
const [executingPlan, setExecutingPlan] = useState<TradePlan | null>(null);
\`\`\`

Add tab for Trade Plans:
\`\`\`typescript
const [activeTab, setActiveTab] = useState<'portfolio' | 'analytics' | 'transactions' | 'trade-plans'>('portfolio');
\`\`\`

Add navigation button (in your existing navigation):
\`\`\`typescript
<button
  onClick={() => setActiveTab('trade-plans')}
  className={/* your button styles */}
>
  <Package size={20} />
  Trade Plans
</button>
\`\`\`

Add view logic in your main render:
\`\`\`typescript
{activeTab === 'trade-plans' && (
  <div className="p-4 lg:p-6">
    {!tradePlansView ? (
      <>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Trade Plans</h2>
          <button
            onClick={() => setShowTradePlanner(true)}
            className="bg-gradient-to-r from-crypto-lime to-green-500 text-black font-bold py-2 px-4 rounded-lg"
          >
            Create New Plan
          </button>
        </div>
        <TradePlansList
          displayCurrency={displayCurrency}
          convertPrice={convertPrice}
          getIdToken={getIdToken}
          onViewPlan={(id) => {
            setSelectedPlanId(id);
            setTradePlansView('detail');
          }}
        />
      </>
    ) : tradePlansView === 'detail' && selectedPlanId ? (
      <TradePlanDetail
        planId={selectedPlanId}
        displayCurrency={displayCurrency}
        convertPrice={convertPrice}
        getIdToken={getIdToken}
        onBack={() => {
          setTradePlansView(null);
          setSelectedPlanId(null);
        }}
        onExecuteTrade={(plan) => {
          setExecutingPlan(plan);
          setShowExecutionModal(true);
        }}
      />
    ) : null}
  </div>
)}
\`\`\`

Add modals at the end of your render (before closing divs):
\`\`\`typescript
{showTradePlanner && (
  <TradePlanner
    cards={cards}
    displayCurrency={displayCurrency}
    convertPrice={convertPrice}
    getIdToken={getIdToken}
    onClose={() => setShowTradePlanner(false)}
    onPlanCreated={() => {
      setShowTradePlanner(false);
      // Optionally refresh plans list
    }}
  />
)}

{showExecutionModal && executingPlan && (
  <TradePlanExecutionModal
    plan={executingPlan}
    displayCurrency={displayCurrency}
    convertPrice={convertPrice}
    onExecute={async (data) => {
      // Implementation: Mark cards as sold and create transaction
      // This needs to integrate with your existing trade logging logic

      // 1. Mark all bundled cards as sold
      for (const bundledCard of executingPlan.bundleCards) {
        const card = cards.find(c => c.id === bundledCard.cardId);
        if (card) {
          await dataService.saveCard({
            ...card,
            sold: true,
            soldDate: data.tradeDate,
            soldPrice: bundledCard.currentValueAtPlanTime,
            soldVia: 'trade'
          }, getIdToken);
        }
      }

      // 2. Create transaction record (adapt to your transaction system)
      // This is pseudo-code - adapt to your actual implementation
      const transactionId = await createTradeTransaction({
        date: data.tradeDate,
        cardsGiven: executingPlan.bundleCards,
        receivedValue: data.receivedValue,
        cashBoot: data.cashBoot
      });

      // 3. Mark plan as completed
      await dataService.completeTradePlan(executingPlan._id, transactionId, getIdToken);

      // 4. Refresh and close
      await loadCards();
      setShowExecutionModal(false);
      setExecutingPlan(null);
      setTradePlansView(null);
    }}
    onCancel={() => {
      setShowExecutionModal(false);
      setExecutingPlan(null);
    }}
  />
)}
\`\`\`

### Step 2: Add to Bottom Navigation (if using mobile nav)

\`\`\`typescript
import { Package } from 'lucide-react';

// In your BottomNav items array:
{
  id: 'trade-plans',
  label: 'Trade Plans',
  icon: Package
}
\`\`\`

### Step 3: Transaction Integration

You'll need to integrate the trade plan execution with your existing transaction logging system. The key points:

1. **Mark cards as sold**: Loop through `plan.bundleCards` and mark each card as `sold: true, soldVia: 'trade'`
2. **Calculate realized P/L**: For each card, calculate `soldPrice - costBasis`
3. **Create transaction record**: Log the trade in your transactions collection
4. **Link transaction to plan**: Call `completeTradePlan(planId, transactionId)` to link them

Example transaction structure:
\`\`\`typescript
{
  type: 'trade',
  date: tradeDate,
  cardsGiven: executingPlan.bundleCards.map(c => ({
    cardId: c.cardId,
    player: c.cardSnapshot.player,
    fmv: c.currentValueAtPlanTime,
    costBasis: getCardCostBasis(c.cardId), // You need to implement this
    realizedPL: c.currentValueAtPlanTime - getCardCostBasis(c.cardId)
  })),
  receivedValue: data.receivedValue,
  cashBoot: data.cashBoot,
  tradePlanId: executingPlan._id
}
\`\`\`

## Features Implemented

### Planning Phase
- ✅ Target value input with AI bundle suggestions
- ✅ Manual card selection mode
- ✅ Real-time value calculation
- ✅ 10-20% over target for negotiation room
- ✅ Multiple suggestion strategies (high-value, mid-value, low-value, optimized, random)
- ✅ Save plan with name and notes

### Management Phase
- ✅ View all plans filtered by status (pending/completed/cancelled)
- ✅ View plan details with all bundled cards
- ✅ Edit plan notes
- ✅ Delete pending plans
- ✅ Cancel pending plans

### Execution Phase
- ✅ Pre-filled execution form from plan
- ✅ Editable received value and cash boot
- ✅ Trade summary calculation
- ✅ Mark cards as sold
- ✅ Link to transaction record
- ✅ Mark plan as completed

## API Endpoints Summary

All endpoints require authentication (Bearer token in Authorization header).

### Trade Plans
- **GET** `/api/trade-plans?status=pending` - List plans (optional status filter)
- **GET** `/api/trade-plans/:id` - Get single plan
- **POST** `/api/trade-plans` - Create new plan
  ```json
  {
    "planName": "Trade Plan - 12/15/2025",
    "targetValue": 5000,
    "bundleCards": [
      {
        "cardId": "card123",
        "currentValueAtPlanTime": 1200,
        "cardSnapshot": {
          "player": "Player Name",
          "year": "2023",
          "set": "Prizm",
          "parallel": "Silver",
          "grade": "PSA 10",
          "imageUrl": "..."
        }
      }
    ],
    "totalBundleValue": 5500,
    "notes": "Optional notes"
  }
  ```
- **PUT** `/api/trade-plans/:id` - Update plan (notes, status, etc.)
- **DELETE** `/api/trade-plans/:id` - Delete plan
- **POST** `/api/trade-plans/:id/complete` - Mark as completed
  ```json
  {
    "transactionId": "trans123"
  }
  ```

## Testing Checklist

- [ ] Create a trade plan using target value mode
- [ ] Create a trade plan using manual selection mode
- [ ] View trade plans list
- [ ] Filter by status (pending/completed/cancelled)
- [ ] View trade plan details
- [ ] Edit trade plan notes
- [ ] Execute a trade plan
- [ ] Verify cards marked as sold
- [ ] Verify transaction created
- [ ] Verify plan marked as completed
- [ ] Cancel a pending plan
- [ ] Delete a pending plan

## Notes

- Trade plans are user-specific (filtered by userId)
- Only pending plans can be executed or deleted
- Completed plans are linked to their transaction via `completedTransactionId`
- Card snapshots preserve the card state at planning time
- Bundle suggestions use a smart algorithm with multiple strategies
- All monetary values respect the user's display currency setting
