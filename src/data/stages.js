/**
 * 富翁模拟器 - 数据定义
 */

// 人生阶段
export const LIFE_STAGES = {
  STARTER: { id: 'starter', name: '起步期', ageRange: [18, 25], color: 0x87CEEB },
  GROWTH: { id: 'growth', name: '成长期', ageRange: [26, 35], color: 0x98FB98 },
  PRIME: { id: 'prime', name: '黄金期', ageRange: [36, 50], color: 0xFFD700 },
  MATURE: { id: 'mature', name: '成熟期', ageRange: [51, 65], color: 0xFFA500 },
  RETIRE: { id: 'retire', name: '退休期', ageRange: [66, 100], color: 0xC0C0C0 },
}

export function getStageByAge(age) {
  for (const stage of Object.values(LIFE_STAGES)) {
    if (age >= stage.ageRange[0] && age <= stage.ageRange[1]) {
      return stage
    }
  }
  return LIFE_STAGES.RETIRE
}

// 学习方向（专精领域）
export const STUDY_FIELDS = {
  STOCK: {
    id: 'stock',
    name: '股票投资',
    icon: '📊',
    desc: '学习技术分析、基本面分析、价值投资',
    relatedEvents: ['股票', '证券', 'A股', '港股', '美股']
  },
  FUND: {
    id: 'fund',
    name: '基金理财',
    icon: '📈',
    desc: '学习基金选择、定投策略、资产配置',
    relatedEvents: ['基金', '定投', 'ETF', '指数']
  },
  REAL_ESTATE: {
    id: 'real_estate',
    name: '房产投资',
    icon: '🏠',
    desc: '学习房产分析、租售比、城市选择',
    relatedEvents: ['房产', '买房', '租金', '楼市']
  },
  CRYPTO: {
    id: 'crypto',
    name: '加密货币',
    icon: '₿',
    desc: '学习区块链、DeFi、交易策略',
    relatedEvents: ['加密', 'BTC', 'ETH', '币圈', 'Web3']
  },
  BUSINESS: {
    id: 'business',
    name: '创业经商',
    icon: '🏢',
    desc: '学习商业模式、管理、市场营销',
    relatedEvents: ['创业', '生意', '公司', '合伙']
  },
  CAREER: {
    id: 'career',
    name: '职业发展',
    icon: '💼',
    desc: '学习职场技能、跳槽谈薪、副业',
    relatedEvents: ['职场', '跳槽', '升职', '副业', '工资']
  },
}

// 事件类型（消耗时间不同）
export const EVENT_TYPES = {
  // 投资理财类（1-2个月）
  INVESTMENT: { timeUnit: 1, category: '投资理财' },
  // 学习提升类（2-3个月）
  STUDY: { timeUnit: 2, category: '学习提升' },
  // 职业发展类（1-3个月）
  CAREER: { timeUnit: 2, category: '职业发展' },
  // 生活大事类（1-6个月）
  LIFE_EVENT: { timeUnit: 3, category: '生活大事' },
  // 日常消费类（即时）
  DAILY: { timeUnit: 0.5, category: '日常决策' },
}

// 生活大事（需要金钱的里程碑）
export const LIFE_MILESTONES = {
  MARRIAGE: {
    id: 'marriage',
    name: '结婚',
    icon: '💒',
    baseCost: 200000,  // 基础花费20万
    monthlyExtra: 0,   // 每月额外支出
    requirements: { age: 22 },
    oneTime: true,
  },
  BABY: {
    id: 'baby',
    name: '生孩子',
    icon: '👶',
    baseCost: 50000,   // 生育费用5万
    monthlyExtra: 3000, // 每月养育费3000
    requirements: { age: 23, married: true },
    canRepeat: true,   // 可以多次
  },
  CAR: {
    id: 'car',
    name: '买车',
    icon: '🚗',
    baseCost: 150000,  // 15万起
    monthlyExtra: 2000, // 每月养车费
    requirements: { age: 22 },
    canRepeat: true,
  },
  HOUSE: {
    id: 'house',
    name: '买房',
    icon: '🏠',
    baseCost: 1000000, // 首付100万起（可贷款）
    monthlyExtra: 0,   // 月供由贷款计算
    requirements: { age: 25 },
    canRepeat: true,
  },
}

// 贷款类型
export const LOAN_TYPES = {
  MORTGAGE: {
    id: 'mortgage',
    name: '房贷',
    icon: '🏠',
    maxYears: 30,
    interestRate: 0.04,  // 年化4%
    maxRatio: 0.7,       // 最高贷70%
  },
  CAR_LOAN: {
    id: 'car_loan',
    name: '车贷',
    icon: '🚗',
    maxYears: 5,
    interestRate: 0.05,
    maxRatio: 0.8,
  },
  CONSUMER: {
    id: 'consumer',
    name: '消费贷',
    icon: '💳',
    maxYears: 3,
    interestRate: 0.08,
    maxRatio: 1.0,
  },
}

// 初始属性生成
export function generateInitialStats(startingAge, startingWealth) {
  // 根据起始年龄估算基础收入
  const baseIncome = Math.max(60000, (startingAge - 18) * 8000 + 60000)

  return {
    wealth: startingWealth,
    cash: startingWealth,
    income: baseIncome,           // 年收入
    monthlyExpense: 5000,         // 月固定支出（房租/生活费）
    insight: 20 + Math.floor(Math.random() * 15),  // 投资眼光 20-35
  }
}

// 起始资产选项
export const STARTING_WEALTH_OPTIONS = [
  { id: 'zero', name: '白手起家', wealth: 0, desc: '从零开始' },
  { id: 'small', name: '小有积蓄', wealth: 100000, desc: '10万' },
  { id: 'medium', name: '中产起点', wealth: 500000, desc: '50万' },
  { id: 'rich', name: '小康之家', wealth: 1000000, desc: '100万' },
  { id: 'wealthy', name: '富裕起点', wealth: 5000000, desc: '500万' },
]
