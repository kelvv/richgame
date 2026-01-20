/**
 * 富翁模拟器 - 玩家动作定义
 * 玩家主动选择动作，每个动作消耗时间
 */

// 动作分类
export const ACTION_CATEGORIES = {
  INVEST: { id: 'invest', name: '💰 投资理财', color: '#f0b429' },
  STUDY: { id: 'study', name: '📚 学习提升', color: '#3b82f6' },
  CAREER: { id: 'career', name: '💼 职业发展', color: '#8b5cf6' },
  LIFE: { id: 'life', name: '🏠 生活决策', color: '#ec4899' },
  REST: { id: 'rest', name: '🎮 休息娱乐', color: '#10b981' },
}

// 所有可执行动作
export const ACTIONS = {
  // ========== 投资理财 ==========
  buy_stock: {
    id: 'buy_stock',
    category: 'invest',
    name: '买股票',
    description: '研究并买入股票',
    timeMonths: 1,
    minCash: 10000,
    execute: (player, params) => {
      const amount = params.amount || Math.min(50000, player.stats.cash * 0.2)
      return player.buyInvestment('stock', params.name || '股票投资', amount)
    }
  },
  buy_fund: {
    id: 'buy_fund',
    category: 'invest',
    name: '买基金',
    description: '购买基金定投',
    timeMonths: 1,
    minCash: 5000,
    execute: (player, params) => {
      const amount = params.amount || Math.min(30000, player.stats.cash * 0.15)
      return player.buyInvestment('fund', params.name || '指数基金', amount)
    }
  },
  buy_crypto: {
    id: 'buy_crypto',
    category: 'invest',
    name: '买加密货币',
    description: '投资比特币等加密货币',
    timeMonths: 1,
    minCash: 5000,
    execute: (player, params) => {
      const amount = params.amount || Math.min(30000, player.stats.cash * 0.1)
      return player.buyInvestment('crypto', params.name || '加密货币', amount)
    }
  },
  manage_holdings: {
    id: 'manage_holdings',
    category: 'invest',
    name: '管理持仓',
    description: '查看和调整投资组合',
    timeMonths: 0, // 不消耗时间
    minCash: 0,
    isPanel: true, // 打开面板而非执行动作
  },

  // ========== 学习提升 ==========
  study_stock: {
    id: 'study_stock',
    category: 'study',
    name: '学习股票',
    description: '学习股票分析技术',
    timeMonths: 2,
    cost: 5000,
    execute: (player) => {
      player.stats.cash -= 5000
      const gain = player.study('stock', 100)
      return { skill: 'stock', gain }
    }
  },
  study_fund: {
    id: 'study_fund',
    category: 'study',
    name: '学习基金',
    description: '学习基金投资策略',
    timeMonths: 2,
    cost: 3000,
    execute: (player) => {
      player.stats.cash -= 3000
      const gain = player.study('fund', 100)
      return { skill: 'fund', gain }
    }
  },
  study_crypto: {
    id: 'study_crypto',
    category: 'study',
    name: '学习加密货币',
    description: '研究区块链和加密货币',
    timeMonths: 2,
    cost: 3000,
    execute: (player) => {
      player.stats.cash -= 3000
      const gain = player.study('crypto', 100)
      return { skill: 'crypto', gain }
    }
  },
  study_real_estate: {
    id: 'study_real_estate',
    category: 'study',
    name: '学习房产投资',
    description: '研究房地产市场',
    timeMonths: 2,
    cost: 5000,
    execute: (player) => {
      player.stats.cash -= 5000
      const gain = player.study('real_estate', 100)
      return { skill: 'real_estate', gain }
    }
  },
  study_business: {
    id: 'study_business',
    category: 'study',
    name: '学习创业管理',
    description: '学习商业运营知识',
    timeMonths: 3,
    cost: 8000,
    execute: (player) => {
      player.stats.cash -= 8000
      const gain = player.study('business', 150)
      return { skill: 'business', gain }
    }
  },
  study_career: {
    id: 'study_career',
    category: 'study',
    name: '考职业证书',
    description: '考取专业资格证书',
    timeMonths: 3,
    cost: 10000,
    execute: (player) => {
      player.stats.cash -= 10000
      const gain = player.study('career', 150)
      // 证书可能带来收入提升
      if (Math.random() < 0.6) {
        player.stats.income += 12000
        return { skill: 'career', gain, incomeBonus: 12000 }
      }
      return { skill: 'career', gain }
    }
  },

  // ========== 职业发展 ==========
  work_hard: {
    id: 'work_hard',
    category: 'career',
    name: '努力工作',
    description: '加班争取升职加薪',
    timeMonths: 2,
    execute: (player) => {
      const careerSkill = player.skills.career || 0
      const chance = 0.3 + careerSkill * 0.005 // 30%-80%
      if (Math.random() < chance) {
        const raise = Math.floor(player.stats.income * 0.1)
        player.stats.income += raise
        return { success: true, raise }
      }
      return { success: false }
    }
  },
  find_job: {
    id: 'find_job',
    category: 'career',
    name: '找新工作',
    description: '投简历面试跳槽',
    timeMonths: 2,
    execute: (player) => {
      const careerSkill = player.skills.career || 0
      const chance = 0.4 + careerSkill * 0.006
      if (Math.random() < chance) {
        const newIncome = Math.floor(player.stats.income * (1.2 + Math.random() * 0.3))
        const increase = newIncome - player.stats.income
        player.stats.income = newIncome
        return { success: true, increase }
      }
      return { success: false }
    }
  },
  side_business: {
    id: 'side_business',
    category: 'career',
    name: '搞副业',
    description: '利用业余时间赚外快',
    timeMonths: 1,
    execute: (player) => {
      const businessSkill = player.skills.business || 0
      const baseEarn = 2000 + Math.random() * 8000
      const earn = Math.floor(baseEarn * (1 + businessSkill * 0.02))
      player.stats.cash += earn
      // 有小概率提升创业技能
      if (Math.random() < 0.3) {
        player.study('business', 30)
      }
      return { earn }
    }
  },
  start_business: {
    id: 'start_business',
    category: 'career',
    name: '创业',
    description: '辞职创业（高风险高回报）',
    timeMonths: 6,
    minCash: 100000,
    execute: (player, params) => {
      const investment = params.amount || 100000
      if (player.stats.cash < investment) return { success: false, reason: '资金不足' }

      player.stats.cash -= investment
      const businessSkill = player.skills.business || 0
      const chance = 0.2 + businessSkill * 0.008 // 20%-100%

      if (Math.random() < chance) {
        // 成功：创建一个生意持仓
        player.buyInvestment('business', params.name || '创业项目', investment * 2)
        player.stats.income = 0 // 辞职了
        return { success: true, investment }
      } else {
        // 失败
        player.study('business', 50) // 失败也是学习
        return { success: false, lost: investment }
      }
    }
  },

  // ========== 生活决策 ==========
  dating: {
    id: 'dating',
    category: 'life',
    name: '相亲约会',
    description: '寻找人生伴侣',
    timeMonths: 1,
    cost: 3000,
    condition: (player) => !player.life.married,
    execute: (player) => {
      player.stats.cash -= 3000
      const chance = 0.3 + (player.stats.insight * 0.003)
      if (Math.random() < chance) {
        return { success: true, message: '遇到了心仪的对象' }
      }
      return { success: false }
    }
  },
  marry: {
    id: 'marry',
    category: 'life',
    name: '结婚',
    description: '举办婚礼，开始新生活',
    timeMonths: 3,
    cost: 200000,
    minCash: 150000,
    condition: (player) => !player.life.married,
    execute: (player, params) => {
      const cost = params.cost || 200000
      player.stats.cash -= cost
      player.marry({ income: params.spouseIncome || 60000 })
      return { success: true, cost }
    }
  },
  have_baby: {
    id: 'have_baby',
    category: 'life',
    name: '生孩子',
    description: '迎接新生命',
    timeMonths: 6,
    cost: 50000,
    condition: (player) => player.life.married && player.life.children < 3,
    execute: (player) => {
      player.stats.cash -= 50000
      player.haveBaby()
      return { success: true }
    }
  },
  buy_car: {
    id: 'buy_car',
    category: 'life',
    name: '买车',
    description: '购买代步工具',
    timeMonths: 1,
    minCash: 100000,
    execute: (player, params) => {
      const price = params.price || 150000
      player.stats.cash -= price
      player.buyCar({ name: params.name || '汽车', price })
      return { success: true, price }
    }
  },
  buy_house: {
    id: 'buy_house',
    category: 'life',
    name: '买房',
    description: '购买房产（可贷款）',
    timeMonths: 2,
    minCash: 300000,
    execute: (player, params) => {
      const price = params.price || 2000000
      const downPayment = params.downPayment || price * 0.3

      player.stats.cash -= downPayment
      player.buyHouse({ name: params.name || '住宅', price })

      // 申请房贷
      const loanAmount = price - downPayment
      if (loanAmount > 0) {
        player.takeLoan('MORTGAGE', loanAmount, params.years || 30)
      }

      return { success: true, price, downPayment, loan: loanAmount }
    }
  },

  // ========== 休息娱乐 ==========
  rest: {
    id: 'rest',
    category: 'rest',
    name: '休息放松',
    description: '给自己放个假',
    timeMonths: 1,
    cost: 2000,
    execute: (player) => {
      player.stats.cash -= 2000
      player.stats.insight = Math.min(100, player.stats.insight + 2)
      return { insight: 2 }
    }
  },
  travel: {
    id: 'travel',
    category: 'rest',
    name: '旅游度假',
    description: '出去走走看看世界',
    timeMonths: 1,
    cost: 10000,
    execute: (player) => {
      player.stats.cash -= 10000
      player.stats.insight = Math.min(100, player.stats.insight + 5)
      return { insight: 5 }
    }
  },
  skip_month: {
    id: 'skip_month',
    category: 'rest',
    name: '平淡度过',
    description: '这个月没什么特别的',
    timeMonths: 1,
    execute: () => {
      return {}
    }
  },
}

// 获取某分类下的所有动作
export function getActionsByCategory(categoryId) {
  return Object.values(ACTIONS).filter(a => a.category === categoryId)
}

// 获取玩家当前可执行的动作
export function getAvailableActions(player) {
  const remainingMonths = player.getRemainingMonths()

  return Object.values(ACTIONS).filter(action => {
    // 时间不够
    if (action.timeMonths > remainingMonths) return false
    // 条件不满足
    if (action.condition && !action.condition(player)) return false
    // 现金不足
    if (action.minCash && player.stats.cash < action.minCash) return false
    if (action.cost && player.stats.cash < action.cost) return false
    return true
  })
}

// 随机事件触发概率（每次执行动作后）
export const EVENT_TRIGGER_CHANCE = 0.35 // 35% 概率触发随机事件
