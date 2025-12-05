
import React, { useMemo, useState } from 'react';
import { Card as CardType } from '../types';
import {
  Card,
  Metric,
  Text,
  Flex,
  BarList,
  DonutChart,
  Grid,
  Col,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  AreaChart,
  Badge,
  ProgressBar,
  LineChart,
  CategoryBar,
  Tracker,
  Legend
} from '@tremor/react';
import {
  TrendingUp,
  TrendingDown,
  Layers,
  Award,
  Wallet,
  Eye,
  Activity,
  AlertTriangle,
  Target,
  DollarSign,
  Clock,
  Zap,
  Shield,
  TrendingDown as AlertDown,
  Hash,
  BarChart3
} from 'lucide-react';

interface AnalyticsViewProps {
  cards: CardType[];
}

const COLORS = ['emerald', 'blue', 'amber', 'red', 'purple', 'pink', 'slate'];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ cards }) => {
  const [selectedTab, setSelectedTab] = useState(0);

  // Separate portfolio and watchlist
  const portfolio = useMemo(() => cards.filter(c => !c.watchlist && !c.sold), [cards]);
  const watchlist = useMemo(() => cards.filter(c => c.watchlist), [cards]);
  const soldCards = useMemo(() => cards.filter(c => c.sold), [cards]);

  // Portfolio Stats
  const portfolioStats = useMemo(() => {
    let totalValue = 0;
    let totalCost = 0;
    let highestValueCard = portfolio[0];
    let gradedCount = 0;

    const sportDistribution: Record<string, number> = {};
    const brandDistribution: Record<string, number> = {};

    portfolio.forEach(card => {
      const val = card.currentValue === -1 ? 0 : card.currentValue;
      totalValue += val;
      totalCost += card.purchasePrice;

      if (val > (highestValueCard?.currentValue || 0)) {
        highestValueCard = card;
      }

      // Sport Distribution
      if (!sportDistribution[card.sport]) sportDistribution[card.sport] = 0;
      sportDistribution[card.sport] += val;

      // Brand Distribution
      if (!brandDistribution[card.brand]) brandDistribution[card.brand] = 0;
      brandDistribution[card.brand] += 1;

      if (card.graded) gradedCount++;
    });

    // Format for charts
    const sportData = Object.keys(sportDistribution).map(key => ({
      name: key,
      value: sportDistribution[key]
    })).sort((a, b) => b.value - a.value);

    const brandData = Object.keys(brandDistribution)
      .map(key => ({
        name: key,
        value: brandDistribution[key]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Top performers
    const performers = [...portfolio].map(c => {
      const current = c.currentValue === -1 ? 0 : c.currentValue;
      const profit = current - c.purchasePrice;
      const percent = c.purchasePrice > 0 ? (profit / c.purchasePrice) * 100 : 0;
      return { ...c, percent, profit, current };
    }).sort((a, b) => b.percent - a.percent);

    const winners = performers.filter(m => m.percent > 0).slice(0, 5);
    const losers = performers.filter(m => m.percent < 0).reverse().slice(0, 5);

    const totalProfit = totalValue - totalCost;
    const profitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    return {
      totalValue,
      totalCost,
      totalProfit,
      profitPercent,
      highestValueCard,
      sportData,
      brandData,
      gradedCount,
      gradedPercent: portfolio.length > 0 ? (gradedCount / portfolio.length) * 100 : 0,
      winners,
      losers
    };
  }, [portfolio]);

  // Advanced Holdings Analysis
  const holdingsAnalysis = useMemo(() => {
    if (portfolio.length === 0) return null;

    // Price Trend Analysis (30-day momentum)
    const priceTrends = portfolio.map(card => {
      const history = card.priceHistory.slice(-30); // Last 30 entries
      if (history.length < 2) return { ...card, trend: 0, momentum: 'flat' };

      const oldest = history[0].value;
      const newest = card.currentValue === -1 ? history[history.length - 1].value : card.currentValue;
      const change = ((newest - oldest) / oldest) * 100;

      let momentum: 'pumping' | 'stable' | 'dumping' | 'flat' = 'flat';
      if (change > 15) momentum = 'pumping';
      else if (change > 5) momentum = 'stable';
      else if (change < -15) momentum = 'dumping';

      return { ...card, trend: change, momentum, currentPrice: newest };
    }).sort((a, b) => b.trend - a.trend);

    // Offer Analytics
    const offerAnalytics = portfolio
      .filter(c => c.offers && c.offers.length > 0)
      .map(card => {
        const offers = card.offers || [];
        const avgOffer = offers.reduce((sum, o) => sum + o.offerPrice, 0) / offers.length;
        const highestOffer = Math.max(...offers.map(o => o.offerPrice));
        const currentValue = card.currentValue === -1 ? 0 : card.currentValue;
        const offerToValue = currentValue > 0 ? (highestOffer / currentValue) * 100 : 0;

        // Offer velocity (offers in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentOffers = offers.filter(o => new Date(o.date) >= thirtyDaysAgo).length;

        return {
          ...card,
          avgOffer,
          highestOffer,
          offerToValue,
          offerVelocity: recentOffers,
          totalOffers: offers.length
        };
      })
      .sort((a, b) => b.offerVelocity - a.offerVelocity);

    // Price History Depth Analysis
    const historyDepth = portfolio.map(card => ({
      player: card.player,
      year: card.year,
      brand: card.brand,
      historyCount: card.priceHistory.length,
      oldestDate: card.priceHistory.length > 0 ? new Date(card.priceHistory[0].date) : null,
      platforms: [...new Set(card.priceHistory.map(p => p.platform).filter(Boolean))].length
    })).sort((a, b) => b.historyCount - a.historyCount);

    // Grading Premium Analysis
    const gradedCards = portfolio.filter(c => c.graded);
    const rawCards = portfolio.filter(c => !c.graded);
    const avgGradedValue = gradedCards.length > 0
      ? gradedCards.reduce((sum, c) => sum + (c.currentValue === -1 ? 0 : c.currentValue), 0) / gradedCards.length
      : 0;
    const avgRawValue = rawCards.length > 0
      ? rawCards.reduce((sum, c) => sum + (c.currentValue === -1 ? 0 : c.currentValue), 0) / rawCards.length
      : 0;
    const gradingPremium = avgRawValue > 0 ? ((avgGradedValue - avgRawValue) / avgRawValue) * 100 : 0;

    // Risk Analysis
    const highRisk = portfolio.filter(c => {
      const value = c.currentValue === -1 ? 0 : c.currentValue;
      const cost = c.purchasePrice;
      const loss = value - cost;
      const lossPercent = cost > 0 ? (loss / cost) * 100 : 0;
      return lossPercent < -20; // Down more than 20%
    });

    return {
      priceTrends: priceTrends.slice(0, 10),
      pumping: priceTrends.filter(c => c.momentum === 'pumping'),
      dumping: priceTrends.filter(c => c.momentum === 'dumping'),
      offerAnalytics: offerAnalytics.slice(0, 5),
      historyDepth: historyDepth.slice(0, 5),
      gradingPremium,
      avgGradedValue,
      avgRawValue,
      highRisk
    };
  }, [portfolio]);

  // Watchlist Stats
  const watchlistStats = useMemo(() => {
    let totalTarget = 0;
    let totalMarket = 0;

    const sportDistribution: Record<string, number> = {};

    watchlist.forEach(card => {
      totalTarget += card.purchasePrice; // Target price
      const marketVal = card.currentValue === -1 ? 0 : card.currentValue;
      totalMarket += marketVal;

      if (!sportDistribution[card.sport]) sportDistribution[card.sport] = 0;
      sportDistribution[card.sport] += 1;
    });

    const sportData = Object.keys(sportDistribution).map(key => ({
      name: key,
      value: sportDistribution[key]
    })).sort((a, b) => b.value - a.value);

    // Cards sorted by opportunity (market price below target)
    const opportunities = [...watchlist]
      .map(c => {
        const market = c.currentValue === -1 ? Infinity : c.currentValue;
        const target = c.purchasePrice;
        const discount = target > market ? ((target - market) / target) * 100 : 0;
        return { ...c, market, target, discount };
      })
      .filter(c => c.discount > 0)
      .sort((a, b) => b.discount - a.discount)
      .slice(0, 5);

    return {
      totalTarget,
      totalMarket,
      sportData,
      opportunities,
      avgTarget: watchlist.length > 0 ? totalTarget / watchlist.length : 0
    };
  }, [watchlist]);

  // Advanced Watchlist Analysis
  const watchlistAnalysis = useMemo(() => {
    if (watchlist.length === 0) return null;

    // Buy Zone Indicator - Traffic light system
    const buyZones = watchlist.map(card => {
      const market = card.currentValue === -1 ? null : card.currentValue;
      const target = card.purchasePrice;

      if (!market) {
        return { ...card, zone: 'unknown', discount: null, recommendation: 'Set market price' };
      }

      const diff = ((target - market) / target) * 100;

      let zone: 'green' | 'yellow' | 'red' | 'unknown' = 'unknown';
      let recommendation = '';

      if (diff > 30) {
        zone = 'green';
        recommendation = 'Strong Buy - Deep discount';
      } else if (diff > 10) {
        zone = 'green';
        recommendation = 'Buy - Below target';
      } else if (diff >= -10) {
        zone = 'yellow';
        recommendation = 'Watch - Near target';
      } else {
        zone = 'red';
        recommendation = 'Avoid - Above target';
      }

      return { ...card, zone, discount: diff, recommendation, market, target };
    }).sort((a, b) => (b.discount || -999) - (a.discount || -999));

    // Liquidity Score (0-100)
    const liquidityScores = watchlist.map(card => {
      const history = card.priceHistory;
      let score = 50; // Base score

      // Factor 1: Days since last comp
      if (history.length > 0) {
        const lastSale = new Date(history[history.length - 1].date);
        const daysSince = Math.floor((Date.now() - lastSale.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince < 7) score += 25;
        else if (daysSince < 30) score += 15;
        else if (daysSince < 90) score += 5;
        else score -= 10;
      } else {
        score -= 20;
      }

      // Factor 2: Sales frequency (last 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const recentSales = history.filter(p => new Date(p.date) >= ninetyDaysAgo).length;
      score += Math.min(recentSales * 5, 25);

      // Clamp score
      score = Math.max(0, Math.min(100, score));

      let liquidityRating = 'Low';
      if (score >= 75) liquidityRating = 'High';
      else if (score >= 50) liquidityRating = 'Medium';

      return {
        ...card,
        liquidityScore: score,
        liquidityRating,
        recentSales
      };
    }).sort((a, b) => b.liquidityScore - a.liquidityScore);

    // Serial Number Tracking
    const serialTracking = watchlist.map(card => {
      const serials = card.priceHistory
        .map(p => p.serialNumber)
        .filter((s): s is string => !!s);

      const uniqueSerials = [...new Set(serials)];

      // Try to extract total print run from card details (e.g., "/99", "/25")
      let totalPrintRun = null;
      const serialMatch = card.serialNumber?.match(/\/(\d+)/);
      if (serialMatch) {
        totalPrintRun = parseInt(serialMatch[1], 10);
      }

      const surfacedCount = uniqueSerials.length;
      const surfacedPercent = totalPrintRun ? (surfacedCount / totalPrintRun) * 100 : null;

      return {
        ...card,
        uniqueSerials,
        surfacedCount,
        totalPrintRun,
        surfacedPercent,
        scarcityScore: surfacedPercent ? 100 - surfacedPercent : null
      };
    }).filter(c => c.totalPrintRun).sort((a, b) => (b.scarcityScore || 0) - (a.scarcityScore || 0));

    // Market Timing - Price velocity
    const marketTiming = watchlist.map(card => {
      const history = card.priceHistory.slice(-5); // Last 5 comps
      if (history.length < 2) return { ...card, velocity: 0, trend: 'flat' };

      const prices = history.map(p => p.value);
      const avgChange = prices.slice(1).reduce((sum, price, i) => {
        return sum + ((price - prices[i]) / prices[i]) * 100;
      }, 0) / (prices.length - 1);

      let trend: 'rising' | 'falling' | 'flat' = 'flat';
      if (avgChange > 5) trend = 'rising';
      else if (avgChange < -5) trend = 'falling';

      return {
        ...card,
        velocity: avgChange,
        trend,
        signal: trend === 'falling' ? 'Buy window opening' : trend === 'rising' ? 'Act fast - price climbing' : 'Stable - monitor'
      };
    }).sort((a, b) => a.velocity - b.velocity); // Falling prices first

    return {
      buyZones,
      greenZone: buyZones.filter(c => c.zone === 'green'),
      yellowZone: buyZones.filter(c => c.zone === 'yellow'),
      redZone: buyZones.filter(c => c.zone === 'red'),
      liquidityScores: liquidityScores.slice(0, 5),
      serialTracking: serialTracking.slice(0, 5),
      marketTiming: marketTiming.slice(0, 5)
    };
  }, [watchlist]);

  if (portfolio.length === 0 && watchlist.length === 0) {
    return (
      <div className="p-4 lg:p-6 flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="glass-card backdrop-blur-sm border border-white/10 p-4 rounded-full mb-4">
           <Layers className="text-slate-600" size={32} />
        </div>
        <h3 className="text-white font-bold text-xl lg:text-2xl">No Data to Analyze</h3>
        <p className="text-slate-400 mt-2 text-sm">Add assets to your portfolio or watchlist to unlock detailed analytics.</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fadeIn max-w-[1920px] mx-auto">

      {/* Page Header */}
      <div className="mb-2">
        <h2 className="text-2xl lg:text-3xl font-bold text-white">Analytics</h2>
        <p className="text-sm text-slate-400 mt-1">Detailed insights and performance metrics</p>
      </div>

      {/* Tab Selector */}
      <div>
        <TabGroup index={selectedTab} onIndexChange={setSelectedTab}>
          <TabList variant="solid" className="glass-card backdrop-blur-sm border border-white/10 rounded-xl">
            <Tab className="text-white data-[selected]:bg-crypto-lime data-[selected]:text-black font-semibold" icon={Wallet}>
              Portfolio ({portfolio.length})
            </Tab>
            <Tab className="text-white data-[selected]:bg-purple-500 data-[selected]:text-white font-semibold" icon={Eye}>
              Watchlist ({watchlist.length})
            </Tab>
          </TabList>

          <TabPanels>
            {/* Portfolio Tab */}
            <TabPanel>
              {portfolio.length === 0 ? (
                <Card className="mt-6 glass-card backdrop-blur-sm border border-white/10">
                  <Text className="text-center text-slate-500">No portfolio assets yet.</Text>
                </Card>
              ) : (
                <div className="space-y-6 mt-6">
                  {/* Overview Metrics */}
                  <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-4">
                    <Card className="glass-card backdrop-blur-sm border border-white/10" decoration="top" decorationColor="lime">
                      <Text className="text-slate-400 text-xs font-bold uppercase tracking-wide">Portfolio Value</Text>
                      <Metric className="text-white font-extrabold">${portfolioStats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Metric>
                    </Card>
                    <Card className="glass-card backdrop-blur-sm border border-white/10" decoration="top" decorationColor="blue">
                      <Text className="text-slate-400 text-xs font-bold uppercase tracking-wide">Total Invested</Text>
                      <Metric className="text-white font-extrabold">${portfolioStats.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Metric>
                    </Card>
                    <Card className="glass-card backdrop-blur-sm border border-white/10" decoration="top" decorationColor={portfolioStats.totalProfit >= 0 ? "lime" : "red"}>
                      <Text className="text-slate-400 text-xs font-bold uppercase tracking-wide">Total P/L</Text>
                      <Metric className={portfolioStats.totalProfit >= 0 ? "text-crypto-lime font-extrabold" : "text-rose-400 font-extrabold"}>
                        {portfolioStats.totalProfit >= 0 ? '+' : ''}${portfolioStats.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Metric>
                      <Text className={portfolioStats.totalProfit >= 0 ? "text-crypto-lime/80 font-semibold" : "text-rose-400 font-semibold"}>
                        {portfolioStats.profitPercent >= 0 ? '+' : ''}{portfolioStats.profitPercent.toFixed(1)}%
                      </Text>
                    </Card>
                    <Card className="glass-card backdrop-blur-sm border border-white/10" decoration="top" decorationColor="purple">
                      <Text className="text-slate-400 text-xs font-bold uppercase tracking-wide">Highest Asset</Text>
                      <Metric className="text-white font-extrabold">
                        ${portfolioStats.highestValueCard?.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 0}
                      </Metric>
                      <Text className="text-slate-500 text-xs truncate font-medium">
                        {portfolioStats.highestValueCard?.player || '-'}
                      </Text>
                    </Card>
                  </Grid>

                  {/* Grading Composition */}
                  <Card className="glass-card backdrop-blur-sm border border-white/10">
                    <Flex className="mb-2">
                      <div className="flex items-center gap-2">
                        <Award size={16} className="text-indigo-400" />
                        <Text className="text-slate-300 font-bold">Grading Composition</Text>
                      </div>
                      <Text className="text-slate-400">
                        {portfolioStats.gradedCount} / {portfolio.length} Graded
                      </Text>
                    </Flex>
                    <Flex className="mt-4">
                      <Text className="text-indigo-400 font-semibold">
                        <Badge color="indigo" size="xs">Graded</Badge>
                      </Text>
                      <Text className="text-slate-400 font-semibold">{portfolioStats.gradedPercent.toFixed(0)}%</Text>
                    </Flex>
                    <ProgressBar value={portfolioStats.gradedPercent} color="indigo" className="mt-2" />
                  </Card>

                  {/* Sport & Brand Distribution */}
                  <Grid numItems={1} numItemsMd={2} className="gap-4">
                    <Card className="glass-card backdrop-blur-sm border border-white/10">
                      <Text className="text-slate-300 font-bold mb-4">Value by Sport</Text>
                      <DonutChart
                        data={portfolioStats.sportData}
                        category="value"
                        index="name"
                        colors={COLORS}
                        valueFormatter={(value) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        className="h-52"
                      />
                    </Card>
                    <Card className="glass-card backdrop-blur-sm border border-white/10">
                      <Text className="text-slate-300 font-bold mb-4">Top Brands (by count)</Text>
                      <BarList
                        data={portfolioStats.brandData}
                        className="mt-4"
                        color="lime"
                      />
                    </Card>
                  </Grid>

                  {/* Top Performers */}
                  {portfolioStats.winners.length > 0 && (
                    <Card className="glass-card backdrop-blur-sm border border-white/10">
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp size={16} className="text-crypto-lime" />
                        <Text className="text-crypto-lime font-bold">Top Performers</Text>
                      </div>
                      <div className="space-y-3">
                        {portfolioStats.winners.map((card, idx) => (
                          <Flex key={card.id} className="border-b border-slate-800/50 pb-3 last:border-0 last:pb-0">
                            <div>
                              <Text className="text-slate-200 font-semibold">{card.player}</Text>
                              <Text className="text-slate-500 text-xs">{card.year} {card.brand}</Text>
                            </div>
                            <div className="text-right">
                              <Text className="text-crypto-lime font-bold">+{card.percent.toFixed(1)}%</Text>
                              <Text className="text-emerald-500/60 text-xs">+${card.profit.toFixed(0)}</Text>
                            </div>
                          </Flex>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Underperformers */}
                  {portfolioStats.losers.length > 0 && (
                    <Card className="glass-card backdrop-blur-sm border border-white/10">
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingDown size={16} className="text-rose-400" />
                        <Text className="text-rose-400 font-bold">Needs Improvement</Text>
                      </div>
                      <div className="space-y-3">
                        {portfolioStats.losers.map((card) => (
                          <Flex key={card.id} className="border-b border-slate-800/50 pb-3 last:border-0 last:pb-0">
                            <div>
                              <Text className="text-slate-200 font-semibold">{card.player}</Text>
                              <Text className="text-slate-500 text-xs">{card.year} {card.brand}</Text>
                            </div>
                            <div className="text-right">
                              <Text className="text-rose-400 font-bold">{card.percent.toFixed(1)}%</Text>
                              <Text className="text-rose-500/60 text-xs">-${Math.abs(card.profit).toFixed(0)}</Text>
                            </div>
                          </Flex>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Advanced Holdings Analysis */}
                  {holdingsAnalysis && (
                    <>
                      {/* Section Header */}
                      <div className="mt-8 mb-4 flex items-center gap-2">
                        <Activity size={20} className="text-crypto-lime" />
                        <h3 className="text-lg font-bold text-white">Advanced Holdings Analysis</h3>
                        <Text className="text-slate-500 text-xs">Protect and grow your money on the table</Text>
                      </div>

                      {/* Price Momentum Dashboard */}
                      {holdingsAnalysis.priceTrends.length > 0 && (
                        <Card className="glass-card backdrop-blur-sm border border-white/10">
                          <div className="flex items-center gap-2 mb-4">
                            <BarChart3 size={16} className="text-indigo-400" />
                            <Text className="text-slate-300 font-bold">Price Momentum Dashboard</Text>
                          </div>
                          <Text className="text-slate-500 text-xs mb-4">
                            Track which cards are pumping or dumping based on recent price history
                          </Text>

                          <div className="space-y-2">
                            {holdingsAnalysis.priceTrends.slice(0, 8).map((card: any) => (
                              <div key={card.id} className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                                <Flex>
                                  <div className="flex-1">
                                    <Text className="text-slate-200 font-semibold">{card.player}</Text>
                                    <Text className="text-slate-500 text-xs">{card.year} {card.brand}</Text>
                                  </div>
                                  <div className="text-right">
                                    <div className="flex items-center gap-2 justify-end">
                                      {card.momentum === 'pumping' && <Badge color="lime" size="xs">Pumping</Badge>}
                                      {card.momentum === 'dumping' && <Badge color="rose" size="xs">Dumping</Badge>}
                                      {card.momentum === 'stable' && <Badge color="blue" size="xs">Stable</Badge>}
                                      {card.momentum === 'flat' && <Badge color="slate" size="xs">Flat</Badge>}
                                    </div>
                                    <Text className={`font-bold ${card.trend >= 0 ? 'text-crypto-lime' : 'text-rose-400'}`}>
                                      {card.trend >= 0 ? '+' : ''}{card.trend.toFixed(1)}%
                                    </Text>
                                  </div>
                                </Flex>
                                <CategoryBar
                                  values={[
                                    Math.max(0, card.trend),
                                    0,
                                    Math.max(0, -card.trend)
                                  ]}
                                  colors={['emerald', 'slate', 'rose']}
                                  className="mt-2"
                                />
                              </div>
                            ))}
                          </div>
                        </Card>
                      )}

                      {/* Offer Analytics */}
                      {holdingsAnalysis.offerAnalytics.length > 0 && (
                        <Card className="glass-card backdrop-blur-sm border border-white/10">
                          <div className="flex items-center gap-2 mb-4">
                            <DollarSign size={16} className="text-amber-400" />
                            <Text className="text-slate-300 font-bold">Offer Activity & Velocity</Text>
                          </div>
                          <Text className="text-slate-500 text-xs mb-4">
                            Cards with active offer interest - track velocity to optimize pricing
                          </Text>

                          <div className="space-y-3">
                            {holdingsAnalysis.offerAnalytics.map((card: any) => (
                              <Flex key={card.id} className="border-b border-slate-800/50 pb-3 last:border-0 last:pb-0">
                                <div className="flex-1">
                                  <Text className="text-slate-200 font-semibold">{card.player}</Text>
                                  <Text className="text-slate-500 text-xs">{card.year} {card.brand}</Text>
                                  <div className="flex items-center gap-3 mt-1">
                                    <Text className="text-slate-600 text-xs">
                                      Highest: ${card.highestOffer.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Text>
                                    <Text className="text-slate-600 text-xs">
                                      Avg: ${card.avgOffer.toFixed(0)}
                                    </Text>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <Badge color={card.offerVelocity >= 3 ? "emerald" : card.offerVelocity >= 1 ? "amber" : "slate"} size="sm">
                                    {card.offerVelocity} offers/30d
                                  </Badge>
                                  <Text className={`text-xs mt-1 ${card.offerToValue >= 90 ? 'text-crypto-lime' : 'text-slate-500'}`}>
                                    {card.offerToValue.toFixed(0)}% of market
                                  </Text>
                                </div>
                              </Flex>
                            ))}
                          </div>
                        </Card>
                      )}

                      {/* Grading Premium Analysis */}
                      {holdingsAnalysis.avgGradedValue > 0 && holdingsAnalysis.avgRawValue > 0 && (
                        <Card className="glass-card backdrop-blur-sm border border-white/10">
                          <div className="flex items-center gap-2 mb-4">
                            <Award size={16} className="text-purple-400" />
                            <Text className="text-slate-300 font-bold">Grading Premium Analysis</Text>
                          </div>
                          <Text className="text-slate-500 text-xs mb-4">
                            Compare average values of graded vs raw cards in your portfolio
                          </Text>

                          <Grid numItems={1} numItemsSm={3} className="gap-4">
                            <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800/50">
                              <Text className="text-slate-400 text-xs">Avg Graded Value</Text>
                              <Metric className="text-crypto-lime">${holdingsAnalysis.avgGradedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Metric>
                            </div>
                            <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800/50">
                              <Text className="text-slate-400 text-xs">Avg Raw Value</Text>
                              <Metric className="text-slate-400">${holdingsAnalysis.avgRawValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Metric>
                            </div>
                            <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800/50">
                              <Text className="text-slate-400 text-xs">Grading Premium</Text>
                              <Metric className={holdingsAnalysis.gradingPremium > 0 ? "text-crypto-lime" : "text-slate-400"}>
                                +{holdingsAnalysis.gradingPremium.toFixed(1)}%
                              </Metric>
                            </div>
                          </Grid>
                        </Card>
                      )}

                      {/* Risk Analysis */}
                      {holdingsAnalysis.highRisk.length > 0 && (
                        <Card className="glass-card backdrop-blur-sm border border-white/10">
                          <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle size={16} className="text-amber-400" />
                            <Text className="text-amber-400 font-bold">High Risk Assets</Text>
                          </div>
                          <Text className="text-slate-500 text-xs mb-4">
                            Cards down more than 20% from cost basis - consider exit strategy
                          </Text>

                          <div className="space-y-3">
                            {holdingsAnalysis.highRisk.map((card) => {
                              const value = card.currentValue === -1 ? 0 : card.currentValue;
                              const loss = value - card.purchasePrice;
                              const lossPercent = card.purchasePrice > 0 ? (loss / card.purchasePrice) * 100 : 0;

                              return (
                                <Flex key={card.id} className="border-b border-slate-800/50 pb-3 last:border-0 last:pb-0">
                                  <div>
                                    <Text className="text-slate-200 font-semibold">{card.player}</Text>
                                    <Text className="text-slate-500 text-xs">{card.year} {card.brand}</Text>
                                    <Text className="text-slate-600 text-xs mt-1">
                                      Cost: ${card.purchasePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} → Now: ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Text>
                                  </div>
                                  <div className="text-right">
                                    <Badge color="rose" size="sm">
                                      {lossPercent.toFixed(1)}%
                                    </Badge>
                                    <Text className="text-rose-400 text-xs mt-1">
                                      -${Math.abs(loss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Text>
                                  </div>
                                </Flex>
                              );
                            })}
                          </div>
                        </Card>
                      )}
                    </>
                  )}
                </div>
              )}
            </TabPanel>

            {/* Watchlist Tab */}
            <TabPanel>
              {watchlist.length === 0 ? (
                <Card className="mt-6 glass-card backdrop-blur-sm border border-white/10">
                  <Text className="text-center text-slate-500">No watchlist items yet.</Text>
                </Card>
              ) : (
                <div className="space-y-4 mt-4">
                  {/* Watchlist Overview */}
                  <Grid numItems={1} numItemsSm={2} numItemsLg={3} className="gap-4">
                    <Card className="glass-card backdrop-blur-sm border border-white/10" decoration="top" decorationColor="indigo">
                      <Text className="text-slate-400">Total Items</Text>
                      <Metric className="text-white">{watchlist.length}</Metric>
                    </Card>
                    <Card className="glass-card backdrop-blur-sm border border-white/10" decoration="top" decorationColor="blue">
                      <Text className="text-slate-400">Avg Target Price</Text>
                      <Metric className="text-white">${watchlistStats.avgTarget.toFixed(0)}</Metric>
                    </Card>
                    <Card className="glass-card backdrop-blur-sm border border-white/10" decoration="top" decorationColor="purple">
                      <Text className="text-slate-400">Total Target Budget</Text>
                      <Metric className="text-white">${watchlistStats.totalTarget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Metric>
                    </Card>
                  </Grid>

                  {/* Sport Distribution */}
                  <Card className="glass-card backdrop-blur-sm border border-white/10">
                    <Text className="text-slate-300 font-bold mb-4">Watchlist by Sport</Text>
                    <DonutChart
                      data={watchlistStats.sportData}
                      category="value"
                      index="name"
                      colors={COLORS}
                      className="h-52"
                    />
                  </Card>

                  {/* Best Opportunities */}
                  {watchlistStats.opportunities.length > 0 && (
                    <Card className="glass-card backdrop-blur-sm border border-white/10">
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingDown size={16} className="text-crypto-lime" />
                        <Text className="text-crypto-lime font-bold">Best Buying Opportunities</Text>
                      </div>
                      <Text className="text-slate-500 text-xs mb-4">
                        Cards currently below your target price
                      </Text>
                      <div className="space-y-3">
                        {watchlistStats.opportunities.map((card) => (
                          <Flex key={card.id} className="border-b border-slate-800/50 pb-3 last:border-0 last:pb-0">
                            <div>
                              <Text className="text-slate-200 font-semibold">{card.player}</Text>
                              <Text className="text-slate-500 text-xs">{card.year} {card.brand}</Text>
                              <Text className="text-slate-600 text-xs mt-1">
                                Target: ${card.target} • Market: ${card.market === Infinity ? '?' : card.market}
                              </Text>
                            </div>
                            <div className="text-right">
                              <Badge color="lime" size="sm">
                                {card.discount.toFixed(0)}% below
                              </Badge>
                            </div>
                          </Flex>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Advanced Watchlist Analysis */}
                  {watchlistAnalysis && (
                    <>
                      {/* Section Header */}
                      <div className="mt-8 mb-4 flex items-center gap-2">
                        <Target size={20} className="text-indigo-400" />
                        <h3 className="text-lg font-bold text-white">Advanced Watchlist Analysis</h3>
                        <Text className="text-slate-500 text-xs">Decide when and at what price to strike</Text>
                      </div>

                      {/* Buy Zone Indicator - Traffic Light System */}
                      <Card className="glass-card backdrop-blur-sm border border-white/10">
                        <div className="flex items-center gap-2 mb-4">
                          <Target size={16} className="text-crypto-lime" />
                          <Text className="text-slate-300 font-bold">Buy Zone Indicator</Text>
                        </div>
                        <Text className="text-slate-500 text-xs mb-4">
                          Traffic light system to eliminate FOMO - only buy green/yellow zones
                        </Text>

                        {/* Summary Badges */}
                        <div className="flex gap-3 mb-4">
                          <Badge color="lime" size="lg">
                            {watchlistAnalysis.greenZone.length} Green (Buy Now)
                          </Badge>
                          <Badge color="amber" size="lg">
                            {watchlistAnalysis.yellowZone.length} Yellow (Watch)
                          </Badge>
                          <Badge color="rose" size="lg">
                            {watchlistAnalysis.redZone.length} Red (Avoid)
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          {watchlistAnalysis.buyZones.slice(0, 8).map((card: any) => (
                            <div key={card.id} className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                              <Flex>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    {card.zone === 'green' && <div className="w-3 h-3 rounded-full bg-emerald-500" />}
                                    {card.zone === 'yellow' && <div className="w-3 h-3 rounded-full bg-amber-500" />}
                                    {card.zone === 'red' && <div className="w-3 h-3 rounded-full bg-rose-500" />}
                                    {card.zone === 'unknown' && <div className="w-3 h-3 rounded-full bg-slate-600" />}
                                    <Text className="text-slate-200 font-semibold">{card.player}</Text>
                                  </div>
                                  <Text className="text-slate-500 text-xs">{card.year} {card.brand}</Text>
                                  <Text className="text-slate-600 text-xs mt-1">{card.recommendation}</Text>
                                </div>
                                <div className="text-right">
                                  {card.discount !== null && (
                                    <Badge
                                      color={card.discount > 10 ? "emerald" : card.discount >= -10 ? "amber" : "rose"}
                                      size="sm"
                                    >
                                      {card.discount > 0 ? '' : '+'}{Math.abs(card.discount).toFixed(0)}% {card.discount > 0 ? 'below' : 'above'}
                                    </Badge>
                                  )}
                                  <Text className="text-slate-500 text-xs mt-1">
                                    ${card.market?.toLocaleString() || '?'} / ${card.target.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </Text>
                                </div>
                              </Flex>
                            </div>
                          ))}
                        </div>
                      </Card>

                      {/* Liquidity & Market Activity */}
                      {watchlistAnalysis.liquidityScores.length > 0 && (
                        <Card className="glass-card backdrop-blur-sm border border-white/10">
                          <div className="flex items-center gap-2 mb-4">
                            <Activity size={16} className="text-blue-400" />
                            <Text className="text-slate-300 font-bold">Liquidity & Market Activity</Text>
                          </div>
                          <Text className="text-slate-500 text-xs mb-4">
                            Track how frequently cards trade - low liquidity + low surfaced count = high upside potential
                          </Text>

                          <div className="space-y-3">
                            {watchlistAnalysis.liquidityScores.map((card: any) => (
                              <Flex key={card.id} className="border-b border-slate-800/50 pb-3 last:border-0 last:pb-0">
                                <div className="flex-1">
                                  <Text className="text-slate-200 font-semibold">{card.player}</Text>
                                  <Text className="text-slate-500 text-xs">{card.year} {card.brand}</Text>
                                  <Text className="text-slate-600 text-xs mt-1">
                                    {card.recentSales} sales in last 90 days
                                  </Text>
                                </div>
                                <div className="text-right">
                                  <div className="flex items-center gap-2 justify-end mb-1">
                                    <Text className="text-slate-400 text-xs">Score:</Text>
                                    <Badge
                                      color={card.liquidityScore >= 75 ? "emerald" : card.liquidityScore >= 50 ? "amber" : "rose"}
                                      size="sm"
                                    >
                                      {card.liquidityScore}/100
                                    </Badge>
                                  </div>
                                  <Text className="text-slate-500 text-xs">{card.liquidityRating} Liquidity</Text>
                                </div>
                              </Flex>
                            ))}
                          </div>
                        </Card>
                      )}

                      {/* Serial Number Tracking & Scarcity */}
                      {watchlistAnalysis.serialTracking.length > 0 && (
                        <Card className="glass-card backdrop-blur-sm border border-white/10">
                          <div className="flex items-center gap-2 mb-4">
                            <Hash size={16} className="text-purple-400" />
                            <Text className="text-slate-300 font-bold">Serial Tracking & Scarcity Analysis</Text>
                          </div>
                          <Text className="text-slate-500 text-xs mb-4">
                            See exactly how many cards are "in the wild" - fewer surfaced = higher upside if player moons
                          </Text>

                          <div className="space-y-3">
                            {watchlistAnalysis.serialTracking.map((card: any) => (
                              <div key={card.id} className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                                <Flex className="mb-2">
                                  <div className="flex-1">
                                    <Text className="text-slate-200 font-semibold">{card.player}</Text>
                                    <Text className="text-slate-500 text-xs">{card.year} {card.brand}</Text>
                                  </div>
                                  <div className="text-right">
                                    <Badge color="purple" size="sm">
                                      {card.surfacedCount} / {card.totalPrintRun} surfaced
                                    </Badge>
                                    {card.surfacedPercent && (
                                      <Text className="text-slate-500 text-xs mt-1">
                                        {card.surfacedPercent.toFixed(0)}% known
                                      </Text>
                                    )}
                                  </div>
                                </Flex>
                                <CategoryBar
                                  values={[
                                    card.surfacedPercent || 0,
                                    100 - (card.surfacedPercent || 0)
                                  ]}
                                  colors={['purple', 'slate']}
                                  className="mt-2"
                                />
                                {card.scarcityScore && card.scarcityScore > 70 && (
                                  <Text className="text-crypto-lime text-xs mt-2 flex items-center gap-1">
                                    <Zap size={12} /> High scarcity - {(100 - (card.surfacedPercent || 0)).toFixed(0)}% still buried
                                  </Text>
                                )}
                              </div>
                            ))}
                          </div>
                        </Card>
                      )}

                      {/* Market Timing - Price Velocity */}
                      {watchlistAnalysis.marketTiming.length > 0 && (
                        <Card className="glass-card backdrop-blur-sm border border-white/10">
                          <div className="flex items-center gap-2 mb-4">
                            <Clock size={16} className="text-amber-400" />
                            <Text className="text-slate-300 font-bold">Market Timing & Price Velocity</Text>
                          </div>
                          <Text className="text-slate-500 text-xs mb-4">
                            Track price trends to identify optimal buy windows
                          </Text>

                          <div className="space-y-3">
                            {watchlistAnalysis.marketTiming.map((card: any) => (
                              <Flex key={card.id} className="border-b border-slate-800/50 pb-3 last:border-0 last:pb-0">
                                <div className="flex-1">
                                  <Text className="text-slate-200 font-semibold">{card.player}</Text>
                                  <Text className="text-slate-500 text-xs">{card.year} {card.brand}</Text>
                                  <Text className="text-slate-600 text-xs mt-1 flex items-center gap-1">
                                    {card.trend === 'falling' && <AlertDown size={12} className="text-crypto-lime" />}
                                    {card.trend === 'rising' && <TrendingUp size={12} className="text-rose-400" />}
                                    {card.signal}
                                  </Text>
                                </div>
                                <div className="text-right">
                                  <Badge
                                    color={card.trend === 'falling' ? "emerald" : card.trend === 'rising' ? "rose" : "slate"}
                                    size="sm"
                                  >
                                    {card.trend === 'falling' ? '↓' : card.trend === 'rising' ? '↑' : '→'} {Math.abs(card.velocity).toFixed(1)}%
                                  </Badge>
                                  <Text className="text-slate-500 text-xs mt-1">
                                    {card.trend === 'falling' ? 'Falling' : card.trend === 'rising' ? 'Rising' : 'Stable'}
                                  </Text>
                                </div>
                              </Flex>
                            ))}
                          </div>
                        </Card>
                      )}
                    </>
                  )}
                </div>
              )}
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>

    </div>
  );
};
