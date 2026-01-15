import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation keys
type TranslationKeys = {
  [key: string]: string;
};

type Translations = {
  [K in Language]: TranslationKeys;
};

const translations: Translations = {
  en: {
    // Navigation
    'nav.portfolio': 'Portfolio',
    'nav.transactions': 'Transactions',
    'nav.trade': 'Trade Plan',
    'nav.profile': 'Profile',

    // Portfolio/Holdings
    'portfolio.title': 'Portfolio',
    'portfolio.holdings': 'Holdings',
    'portfolio.sold': 'Sold',
    'portfolio.totalValue': 'Total Value',
    'portfolio.totalCost': 'Total Cost',
    'portfolio.unrealizedPL': 'Unrealized P/L',
    'portfolio.realizedPL': 'Realized P/L',
    'portfolio.totalPL': 'Total P/L',
    'portfolio.roi': 'ROI',
    'portfolio.cards': 'cards',
    'portfolio.card': 'card',
    'portfolio.addCard': 'Add Card',
    'portfolio.noCards': 'No cards in your portfolio yet',
    'portfolio.getStarted': 'Get started by adding your first card',
    'portfolio.filter': 'Filter',
    'portfolio.sort': 'Sort',
    'portfolio.viewList': 'List View',
    'portfolio.viewGallery': 'Gallery View',

    // Sort Options
    'sort.dateNewest': 'Date: Newest First',
    'sort.dateOldest': 'Date: Oldest First',
    'sort.priceHigh': 'Current Value: High → Low',
    'sort.priceLow': 'Current Value: Low → High',
    'sort.costHigh': 'Cost Basis: High → Low',
    'sort.costLow': 'Cost Basis: Low → High',
    'sort.profitHigh': 'Unrealized P/L: High → Low',
    'sort.profitLow': 'Unrealized P/L: Low → High',
    'sort.yearNewest': 'Year: Newest → Oldest',
    'sort.yearOldest': 'Year: Oldest → Newest',
    'sort.playerAZ': 'Player Name: A → Z',
    'sort.playerZA': 'Player Name: Z → A',
    'sort.groupDate': 'Date',
    'sort.groupValue': 'Value',
    'sort.groupPerformance': 'Performance',
    'sort.groupCost': 'Cost',
    'sort.groupPlayer': 'Player',
    'sort.groupYear': 'Year',

    // Filter Panel
    'filter.title': 'Filter & Sort',
    'filter.sortBy': 'Sort By',
    'filter.player': 'Player',
    'filter.set': 'Set / Product Line',
    'filter.parallel': 'Parallel',
    'filter.grade': 'Grade',
    'filter.yearRange': 'Year Range',
    'filter.valueRange': 'Value Range',
    'filter.searchPlayers': 'Search players...',
    'filter.noPlayers': 'No players found',
    'filter.min': 'Min',
    'filter.max': 'Max',
    'filter.from': 'From',
    'filter.to': 'To',
    'filter.clearAll': 'Clear All Filters',
    'filter.close': 'Close',

    // Transactions
    'transactions.title': 'Transactions',
    'transactions.transaction': 'transaction',
    'transactions.transactions': 'transactions',
    'transactions.noTransactions': 'No transactions yet',
    'transactions.sellTrade': 'Sell or trade cards to see transactions here',
    'transactions.buy': 'BUY',
    'transactions.sale': 'SALE',
    'transactions.trade': 'TRADE',
    'transactions.in': 'IN',
    'transactions.out': 'OUT',
    'transactions.item': 'Item',
    'transactions.bookedAs': 'Booked As',
    'transactions.amount': 'Amount (FMV)',
    'transactions.costBasis': 'Cost Basis',
    'transactions.realizedGL': 'Realized G/L',
    'transactions.direction': 'Direction',

    // Transaction Filters
    'transFilter.type': 'Type',
    'transFilter.allTransactions': 'All Transactions',
    'transFilter.buyOnly': 'Buy Only',
    'transFilter.sellOnly': 'Sell Only',
    'transFilter.tradeOnly': 'Trade Only',
    'transFilter.realizedPL': 'Realized P/L',
    'transFilter.all': 'All',
    'transFilter.profitOnly': 'Profit Only',
    'transFilter.lossOnly': 'Loss Only',
    'transFilter.breakeven': 'Breakeven',
    'transFilter.dateRange': 'Date Range',
    'transFilter.search': 'Card / Player Search',
    'transFilter.searchPlaceholder': 'Search by card or player...',
    'transFilter.clearFilters': 'Clear All Filters',

    // Transaction Sort
    'transSort.dateNewest': 'Date: Newest First',
    'transSort.dateOldest': 'Date: Oldest First',
    'transSort.amountHigh': 'Amount: High → Low',
    'transSort.amountLow': 'Amount: Low → High',
    'transSort.plBest': 'Realized P/L: Best → Worst',
    'transSort.plWorst': 'Realized P/L: Worst → Best',

    // Card Details
    'card.year': 'Year',
    'card.brand': 'Brand',
    'card.series': 'Series',
    'card.insert': 'Insert',
    'card.player': 'Player',
    'card.parallel': 'Parallel',
    'card.serialNumber': 'Serial #',
    'card.graded': 'Graded',
    'card.grade': 'Grade',
    'card.currentValue': 'Current Value',
    'card.costBasis': 'Cost Basis',
    'card.unrealizedPL': 'Unrealized P/L',
    'card.purchaseDate': 'Purchase Date',
    'card.acquisitionSource': 'Source',
    'card.soldDate': 'Sold Date',
    'card.soldPrice': 'Sold Price',
    'card.soldVia': 'Sold Via',
    'card.edit': 'Edit',
    'card.delete': 'Delete',
    'card.markSold': 'Mark as Sold',
    'card.unmarkSold': 'Unmark Sold',

    // Profile
    'profile.title': 'Profile Settings',
    'profile.subtitle': 'Manage your account and preferences',
    'profile.back': 'Back',
    'profile.settings': 'Settings',
    'profile.language': 'Language',
    'profile.languageDesc': 'Choose your preferred language',
    'profile.english': 'English',
    'profile.chinese': '简体中文 (Simplified Chinese)',
    'profile.currency': 'Display Currency',
    'profile.currencyDesc': 'Choose your preferred currency for displaying values',
    'profile.usd': 'USD ($)',
    'profile.cny': 'CNY (¥)',
    'profile.account': 'Account',
    'profile.accountInfo': 'Account Information',
    'profile.accountActions': 'Account Actions',
    'profile.signedIn': 'Signed in as',
    'profile.signOut': 'Sign Out',
    'profile.signIn': 'Sign In',
    'profile.guestMode': 'Guest Mode',
    'profile.guestLimited': 'Limited to 8 cards',
    'profile.guest': 'GUEST',
    'profile.guestUser': 'Guest User',
    'profile.guestDesc': 'You\'re using a guest account. Sign in with Google or email to unlock unlimited cards and save your data permanently.',
    'profile.proMember': 'Pro Member',
    'profile.freeTier': 'Free Tier',
    'profile.cardLimit': 'card limit',
    'profile.upgrade': 'Upgrade',
    'profile.whitelisted': 'Whitelisted Access',
    'profile.unlockKey': 'Unlock Key Access',
    'profile.subscriptionActive': 'Subscription Active',
    'profile.displayName': 'Display Name',
    'profile.email': 'Email',
    'profile.notSet': 'Not set',
    'profile.dataMigration': 'Data Migration',
    'profile.migrationDesc': 'If you have existing trade plans created before the currency update, click below to migrate them to use the default CNY currency.',
    'profile.migratePlans': 'Migrate Trade Plans Currency',
    'profile.migrating': 'Migrating Trade Plans...',

    // Dashboard
    'dashboard.portfolioValue': 'PORTFOLIO VALUE',
    'dashboard.allTime': 'All Time',
    'dashboard.cashInGame': 'Cash in the Game',
    'dashboard.cashTooltip': 'How much of your own money is currently in cards (negative) or ready to spend (positive).',
    'dashboard.readyToHunt': 'ready to hunt',
    'dashboard.salesRevenue': 'Sales Revenue',
    'dashboard.unrealizedPL': 'Unrealized P/L',
    'dashboard.realizedPL': 'Realized P/L',

    // Card List
    'cardList.card': 'Card',
    'cardList.details': 'Details',
    'cardList.costBasis': 'Cost Basis',
    'cardList.currentValue': 'Current Value',
    'cardList.pl': 'P/L',
    'cardList.change': 'Change',
    'cardList.purchase': 'Purchase',
    'cardList.sold': 'Sold',
    'cardList.return': 'Return',
    'cardList.traded': 'TRADED',
    'cardList.soldLabel': 'SOLD',
    'cardList.break': 'BREAK',
    'cardList.selfRip': 'SELF RIP',
    'cardList.unknown': 'Unknown',
    'cardList.unrealizedPL': 'Unrealized P/L',
    'cardList.allCards': 'All Cards',
    'cardList.winnersOnly': 'Winners Only',
    'cardList.losersOnly': 'Losers Only',
    'cardList.breakeven': 'Breakeven',
    'cardList.tradeStatus': 'Trade Status',
    'cardList.availableForTrade': 'Available for Trade',
    'cardList.neverTrade': 'Never Trade',
    'cardList.hasImage': 'Has Image',
    'cardList.withImage': 'With Image',
    'cardList.withoutImage': 'Without Image',

    // Bottom Navigation
    'bottomNav.portfolio': 'Portfolio',
    'bottomNav.analytics': 'Analytics',
    'bottomNav.plans': 'Plans',
    'bottomNav.history': 'History',

    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
  },
  zh: {
    // Navigation
    'nav.portfolio': '投资组合',
    'nav.transactions': '交易记录',
    'nav.trade': '交易计划',
    'nav.profile': '个人资料',

    // Portfolio/Holdings
    'portfolio.title': '投资组合',
    'portfolio.holdings': '持有',
    'portfolio.sold': '已售出',
    'portfolio.totalValue': '总价值',
    'portfolio.totalCost': '总成本',
    'portfolio.unrealizedPL': '未实现盈亏',
    'portfolio.realizedPL': '已实现盈亏',
    'portfolio.totalPL': '总盈亏',
    'portfolio.roi': '投资回报率',
    'portfolio.cards': '张卡',
    'portfolio.card': '张卡',
    'portfolio.addCard': '添加卡片',
    'portfolio.noCards': '您的投资组合中还没有卡片',
    'portfolio.getStarted': '添加您的第一张卡片开始',
    'portfolio.filter': '筛选',
    'portfolio.sort': '排序',
    'portfolio.viewList': '列表视图',
    'portfolio.viewGallery': '画廊视图',

    // Sort Options
    'sort.dateNewest': '日期：最新优先',
    'sort.dateOldest': '日期：最旧优先',
    'sort.priceHigh': '当前价值：高到低',
    'sort.priceLow': '当前价值：低到高',
    'sort.costHigh': '成本基础：高到低',
    'sort.costLow': '成本基础：低到高',
    'sort.profitHigh': '未实现盈亏：高到低',
    'sort.profitLow': '未实现盈亏：低到高',
    'sort.yearNewest': '年份：最新到最旧',
    'sort.yearOldest': '年份：最旧到最新',
    'sort.playerAZ': '球员名字：A → Z',
    'sort.playerZA': '球员名字：Z → A',
    'sort.groupDate': '日期',
    'sort.groupValue': '价值',
    'sort.groupPerformance': '表现',
    'sort.groupCost': '成本',
    'sort.groupPlayer': '球员',
    'sort.groupYear': '年份',

    // Filter Panel
    'filter.title': '筛选和排序',
    'filter.sortBy': '排序方式',
    'filter.player': '球员',
    'filter.set': '系列 / 产品线',
    'filter.parallel': '平行版',
    'filter.grade': '评级',
    'filter.yearRange': '年份范围',
    'filter.valueRange': '价值范围',
    'filter.searchPlayers': '搜索球员...',
    'filter.noPlayers': '未找到球员',
    'filter.min': '最小',
    'filter.max': '最大',
    'filter.from': '从',
    'filter.to': '到',
    'filter.clearAll': '清除所有筛选',
    'filter.close': '关闭',

    // Transactions
    'transactions.title': '交易记录',
    'transactions.transaction': '笔交易',
    'transactions.transactions': '笔交易',
    'transactions.noTransactions': '还没有交易记录',
    'transactions.sellTrade': '出售或交换卡片后在此查看交易记录',
    'transactions.buy': '买入',
    'transactions.sale': '售出',
    'transactions.trade': '交换',
    'transactions.in': '入',
    'transactions.out': '出',
    'transactions.item': '项目',
    'transactions.bookedAs': '记录为',
    'transactions.amount': '金额 (市值)',
    'transactions.costBasis': '成本基础',
    'transactions.realizedGL': '已实现盈亏',
    'transactions.direction': '方向',

    // Transaction Filters
    'transFilter.type': '类型',
    'transFilter.allTransactions': '所有交易',
    'transFilter.buyOnly': '仅买入',
    'transFilter.sellOnly': '仅售出',
    'transFilter.tradeOnly': '仅交换',
    'transFilter.realizedPL': '已实现盈亏',
    'transFilter.all': '全部',
    'transFilter.profitOnly': '仅盈利',
    'transFilter.lossOnly': '仅亏损',
    'transFilter.breakeven': '持平',
    'transFilter.dateRange': '日期范围',
    'transFilter.search': '卡片 / 球员搜索',
    'transFilter.searchPlaceholder': '按卡片或球员搜索...',
    'transFilter.clearFilters': '清除所有筛选',

    // Transaction Sort
    'transSort.dateNewest': '日期：最新优先',
    'transSort.dateOldest': '日期：最旧优先',
    'transSort.amountHigh': '金额：高到低',
    'transSort.amountLow': '金额：低到高',
    'transSort.plBest': '已实现盈亏：最佳到最差',
    'transSort.plWorst': '已实现盈亏：最差到最佳',

    // Card Details
    'card.year': '年份',
    'card.brand': '品牌',
    'card.series': '系列',
    'card.insert': '插卡',
    'card.player': '球员',
    'card.parallel': '平行版',
    'card.serialNumber': '序列号',
    'card.graded': '已评级',
    'card.grade': '评级',
    'card.currentValue': '当前价值',
    'card.costBasis': '成本基础',
    'card.unrealizedPL': '未实现盈亏',
    'card.purchaseDate': '购买日期',
    'card.acquisitionSource': '来源',
    'card.soldDate': '售出日期',
    'card.soldPrice': '售出价格',
    'card.soldVia': '售出方式',
    'card.edit': '编辑',
    'card.delete': '删除',
    'card.markSold': '标记为已售出',
    'card.unmarkSold': '取消售出标记',

    // Profile
    'profile.title': '个人设置',
    'profile.subtitle': '管理您的账户和偏好设置',
    'profile.back': '返回',
    'profile.settings': '设置',
    'profile.language': '语言',
    'profile.languageDesc': '选择您的首选语言',
    'profile.english': 'English (英语)',
    'profile.chinese': '简体中文',
    'profile.currency': '显示货币',
    'profile.currencyDesc': '选择显示价值的首选货币',
    'profile.usd': '美元 ($)',
    'profile.cny': '人民币 (¥)',
    'profile.account': '账户',
    'profile.accountInfo': '账户信息',
    'profile.accountActions': '账户操作',
    'profile.signedIn': '已登录为',
    'profile.signOut': '退出登录',
    'profile.signIn': '登录',
    'profile.guestMode': '访客模式',
    'profile.guestLimited': '限制为8张卡片',
    'profile.guest': '访客',
    'profile.guestUser': '访客用户',
    'profile.guestDesc': '您正在使用访客账户。使用 Google 或电子邮件登录以解锁无限卡片并永久保存您的数据。',
    'profile.proMember': '专业会员',
    'profile.freeTier': '免费版',
    'profile.cardLimit': '张卡片限制',
    'profile.upgrade': '升级',
    'profile.whitelisted': '白名单访问',
    'profile.unlockKey': '解锁密钥访问',
    'profile.subscriptionActive': '订阅已激活',
    'profile.displayName': '显示名称',
    'profile.email': '电子邮件',
    'profile.notSet': '未设置',
    'profile.dataMigration': '数据迁移',
    'profile.migrationDesc': '如果您在货币更新前创建了交易计划，请点击下方将其迁移为默认的人民币货币。',
    'profile.migratePlans': '迁移交易计划货币',
    'profile.migrating': '正在迁移交易计划...',

    // Dashboard
    'dashboard.portfolioValue': '投资组合价值',
    'dashboard.allTime': '全部时间',
    'dashboard.cashInGame': '投入资金',
    'dashboard.cashTooltip': '您目前投入卡片的资金（负数）或可用于消费的资金（正数）。',
    'dashboard.readyToHunt': '准备猎卡',
    'dashboard.salesRevenue': '销售收入',
    'dashboard.unrealizedPL': '未实现盈亏',
    'dashboard.realizedPL': '已实现盈亏',

    // Card List
    'cardList.card': '卡片',
    'cardList.details': '详情',
    'cardList.costBasis': '成本基础',
    'cardList.currentValue': '当前价值',
    'cardList.pl': '盈亏',
    'cardList.change': '变化',
    'cardList.purchase': '购买',
    'cardList.sold': '已售出',
    'cardList.return': '回报',
    'cardList.traded': '已交换',
    'cardList.soldLabel': '已售出',
    'cardList.break': '拆盒',
    'cardList.selfRip': '自拆',
    'cardList.unknown': '未知',
    'cardList.unrealizedPL': '未实现盈亏',
    'cardList.allCards': '所有卡片',
    'cardList.winnersOnly': '仅盈利',
    'cardList.losersOnly': '仅亏损',
    'cardList.breakeven': '持平',
    'cardList.tradeStatus': '交易状态',
    'cardList.availableForTrade': '可交易',
    'cardList.neverTrade': '不交易',
    'cardList.hasImage': '有图片',
    'cardList.withImage': '有图片',
    'cardList.withoutImage': '无图片',

    // Bottom Navigation
    'bottomNav.portfolio': '组合',
    'bottomNav.analytics': '分析',
    'bottomNav.plans': '计划',
    'bottomNav.history': '历史',

    // Common
    'common.save': '保存',
    'common.cancel': '取消',
    'common.delete': '删除',
    'common.edit': '编辑',
    'common.close': '关闭',
    'common.loading': '加载中...',
    'common.error': '错误',
    'common.success': '成功',
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('preferredLanguage');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    console.log('[LanguageContext] Language changed to:', language);
    localStorage.setItem('preferredLanguage', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    console.log('[LanguageContext] setLanguage called with:', lang);
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
