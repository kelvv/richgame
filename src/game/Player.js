/**
 * 富翁模拟器 - 玩家角色类
 * 支持：一年多事件、学习方向、生活开销、贷款
 */
import { generateInitialStats, getStageByAge, STARTING_WEALTH_OPTIONS, STUDY_FIELDS, LOAN_TYPES } from '../data/stages.js'

export class Player {
  constructor() {
    this.reset()
  }

  reset(startingAge = 25, startingWealth = 100000) {
    const baseStats = generateInitialStats(startingAge, startingWealth)

    this.name = '玩家'
    this.age = startingAge
    this.month = 1  // 当前月份 1-12
    this.startingAge = startingAge
    this.startingWealth = startingWealth

    // 财务属性
    this.stats = {
      wealth: baseStats.wealth,       // 总资产（含房产等）
      cash: baseStats.cash,           // 可用现金
      income: baseStats.income,       // 年收入
      monthlyExpense: baseStats.monthlyExpense,  // 月固定支出
      insight: baseStats.insight,     // 投资眼光
    }

    // 学习方向和等级
    this.skills = {}  // { stock: 10, fund: 5, ... } 各领域等级0-100
    Object.keys(STUDY_FIELDS).forEach(key => {
      this.skills[key.toLowerCase()] = 0
    })

    // 生活状态
    this.life = {
      married: false,
      spouse: null,      // 配偶信息
      children: 0,       // 孩子数量
      cars: [],          // 拥有的车
      houses: [],        // 拥有的房产
    }

    // 贷款
    this.loans = []  // [{ type, principal, remaining, monthlyPayment, monthsLeft }]

    // 投资组合 - 持仓列表
    // 每个持仓: { id, type, name, buyPrice, currentPrice, amount, buyTime, profit }
    this.holdings = []
    this.holdingIdCounter = 0

    // 被动收入（房租等）
    this.passiveIncome = 0

    // 记录
    this.lifeLog = []
    this.isAlive = true
    this.job = '普通上班族'
  }

  /**
   * 获取当月剩余时间（单位：月）
   * 每年12个月，每个事件消耗不同时间
   */
  getRemainingMonths() {
    return 13 - this.month  // 剩余月份
  }

  /**
   * 消耗时间（月）
   */
  spendTime(months) {
    this.month += months
    // 每过一个月扣除固定支出
    for (let i = 0; i < months; i++) {
      this.processMonthlyExpenses()
    }
  }

  /**
   * 处理每月固定支出和收入
   */
  processMonthlyExpenses() {
    // 月薪到账（年收入/12）
    this.stats.cash += this.stats.income / 12

    // 基础生活费
    let totalExpense = this.stats.monthlyExpense

    // 孩子养育费（每个孩子3000/月）
    totalExpense += this.life.children * 3000

    // 车辆费用（每辆2000/月）
    totalExpense += this.life.cars.length * 2000

    // 贷款月供
    this.loans.forEach(loan => {
      if (loan.monthsLeft > 0) {
        totalExpense += loan.monthlyPayment
        loan.monthsLeft--
        loan.remaining -= (loan.monthlyPayment - loan.remaining * (loan.interestRate / 12))
        if (loan.monthsLeft <= 0) {
          loan.remaining = 0
        }
      }
    })

    // 扣除支出
    this.stats.cash -= totalExpense

    // 加上被动收入
    this.stats.cash += this.passiveIncome / 12

    // 每月更新持仓价格（市场波动）
    this.updateMonthlyHoldingPrices()
  }

  /**
   * 每月更新持仓价格（小幅波动）
   */
  updateMonthlyHoldingPrices() {
    this.holdings.forEach(holding => {
      const skill = this.skills[holding.type] || 0
      // 月度波动较小：-5% 到 +5%
      // 技能加成：每10点技能增加0.3%正向偏移
      const baseChange = (Math.random() - 0.5) * 0.1
      const skillBonus = (skill / 10) * 0.003
      const change = baseChange + skillBonus

      holding.currentPrice = Math.max(1, holding.currentPrice * (1 + change))
      holding.profit = (holding.currentPrice - holding.buyPrice) * holding.shares
      holding.profitRate = ((holding.currentPrice - holding.buyPrice) / holding.buyPrice) * 100
    })

    this.recalculateWealth()
  }

  /**
   * 进入下一年
   */
  nextYear() {
    this.age++
    this.month = 1

    // 工资已在每月 processMonthlyExpenses 中发放，这里不再重复

    // 更新持仓价格（年度市场波动）
    this.updateAllHoldingPrices()

    // 更新总资产
    this.recalculateWealth()

    // 清理已还清的贷款
    this.loans = this.loans.filter(l => l.monthsLeft > 0)

    // 检查游戏结束
    if (this.age >= 100 || this.stats.cash < -1000000) {
      this.isAlive = false
    }

    return this.isAlive
  }

  /**
   * 重新计算总资产
   */
  recalculateWealth() {
    const holdingsValue = this.holdings.reduce((sum, h) => sum + h.shares * h.currentPrice, 0)
    const housesValue = this.life.houses.reduce((sum, h) => sum + h.currentValue, 0)
    const carsValue = this.life.cars.reduce((sum, c) => sum + c.currentValue, 0)
    const totalDebt = this.loans.reduce((sum, l) => sum + l.remaining, 0)

    this.stats.wealth = this.stats.cash + holdingsValue + housesValue + carsValue - totalDebt
  }

  /**
   * 获取当前人生阶段
   */
  getCurrentStage() {
    return getStageByAge(this.age)
  }

  /**
   * 学习某个领域
   */
  study(fieldId, hours = 100) {
    const field = fieldId.toLowerCase()
    if (this.skills[field] !== undefined) {
      // 学习收益递减
      const currentLevel = this.skills[field]
      const gain = Math.max(1, Math.floor(hours / 20 * (1 - currentLevel / 150)))
      this.skills[field] = Math.min(100, currentLevel + gain)

      // 同时提升整体眼光
      this.stats.insight = Math.min(100, this.stats.insight + Math.floor(gain / 3))

      return gain
    }
    return 0
  }

  /**
   * 获取某领域的技能等级
   */
  getSkillLevel(fieldId) {
    return this.skills[fieldId.toLowerCase()] || 0
  }

  /**
   * 获取最强的领域
   */
  getTopSkill() {
    let top = { field: null, level: 0 }
    for (const [field, level] of Object.entries(this.skills)) {
      if (level > top.level) {
        top = { field, level }
      }
    }
    return top
  }

  /**
   * 结婚
   */
  marry(spouseInfo = {}) {
    if (this.life.married) return false
    this.life.married = true
    this.life.spouse = {
      name: spouseInfo.name || '配偶',
      income: spouseInfo.income || 0,  // 配偶收入
    }
    // 家庭收入增加
    this.stats.income += this.life.spouse.income
    return true
  }

  /**
   * 生孩子
   */
  haveBaby() {
    if (!this.life.married) return false
    this.life.children++
    return true
  }

  /**
   * 买车
   */
  buyCar(carInfo) {
    const car = {
      name: carInfo.name || '汽车',
      purchasePrice: carInfo.price,
      currentValue: carInfo.price,
      purchaseYear: this.age,
    }
    this.life.cars.push(car)
    return car
  }

  /**
   * 买房
   */
  buyHouse(houseInfo) {
    const house = {
      name: houseInfo.name || '房产',
      purchasePrice: houseInfo.price,
      currentValue: houseInfo.price,
      purchaseYear: this.age,
      monthlyRent: houseInfo.rent || 0,  // 如果出租
      isRented: false,
    }
    this.life.houses.push(house)
    return house
  }

  /**
   * 申请贷款
   */
  takeLoan(loanType, amount, years) {
    const type = LOAN_TYPES[loanType.toUpperCase()]
    if (!type) return null

    const monthlyRate = type.interestRate / 12
    const months = years * 12
    // 等额本息月供计算
    const monthlyPayment = amount * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1)

    const loan = {
      type: type.id,
      typeName: type.name,
      principal: amount,
      remaining: amount,
      monthlyPayment: Math.round(monthlyPayment),
      monthsLeft: months,
      interestRate: type.interestRate,
    }

    this.loans.push(loan)
    this.stats.cash += amount  // 贷款到账

    return loan
  }

  /**
   * 获取每月总支出
   */
  getMonthlyExpense() {
    let total = this.stats.monthlyExpense
    total += this.life.children * 3000
    total += this.life.cars.length * 2000
    total += this.loans.reduce((sum, l) => sum + (l.monthsLeft > 0 ? l.monthlyPayment : 0), 0)
    return total
  }

  /**
   * 获取总负债
   */
  getTotalDebt() {
    return this.loans.reduce((sum, l) => sum + l.remaining, 0)
  }

  /**
   * 买入投资品
   * @param {string} type - 类型: stock/fund/crypto/business
   * @param {string} name - 名称
   * @param {number} amount - 投资金额
   * @param {number} price - 买入价格（可选，默认100）
   * @returns {object} 持仓记录
   */
  buyInvestment(type, name, amount, price = 100) {
    if (this.stats.cash < amount) {
      return null  // 现金不足
    }

    this.stats.cash -= amount
    const shares = amount / price

    const holding = {
      id: ++this.holdingIdCounter,
      type,
      name,
      buyPrice: price,
      currentPrice: price,
      shares,
      amount,  // 投入本金
      buyTime: { age: this.age, month: this.month },
      profit: 0,
      profitRate: 0,
    }

    this.holdings.push(holding)
    this.recalculateWealth()
    return holding
  }

  /**
   * 卖出投资品
   * @param {number} holdingId - 持仓ID
   * @param {number} sellRatio - 卖出比例 0-1，默认全部卖出
   * @returns {object} 卖出结果 { cash, profit, profitRate }
   */
  sellInvestment(holdingId, sellRatio = 1) {
    const index = this.holdings.findIndex(h => h.id === holdingId)
    if (index === -1) return null

    const holding = this.holdings[index]
    const sellShares = holding.shares * sellRatio
    const sellValue = sellShares * holding.currentPrice
    const costBasis = sellShares * holding.buyPrice
    const profit = sellValue - costBasis
    const profitRate = (profit / costBasis) * 100

    this.stats.cash += sellValue

    if (sellRatio >= 1) {
      // 全部卖出，移除持仓
      this.holdings.splice(index, 1)
    } else {
      // 部分卖出，更新持仓
      holding.shares -= sellShares
      holding.amount = holding.shares * holding.buyPrice
    }

    this.recalculateWealth()
    return { cash: sellValue, profit, profitRate }
  }

  /**
   * 加仓
   * @param {number} holdingId - 持仓ID
   * @param {number} addAmount - 加仓金额
   * @returns {boolean} 是否成功
   */
  addToPosition(holdingId, addAmount) {
    if (this.stats.cash < addAmount) return false

    const holding = this.holdings.find(h => h.id === holdingId)
    if (!holding) return false

    const addShares = addAmount / holding.currentPrice
    const oldCost = holding.shares * holding.buyPrice
    const newCost = oldCost + addAmount
    const newShares = holding.shares + addShares

    // 更新持仓（平均成本法）
    holding.shares = newShares
    holding.buyPrice = newCost / newShares
    holding.amount = newCost

    this.stats.cash -= addAmount
    this.recalculateWealth()
    return true
  }

  /**
   * 更新持仓价格（市场波动）
   * @param {number} holdingId - 持仓ID，不传则更新所有
   * @param {number} changeRate - 涨跌幅 -1到1
   */
  updateHoldingPrice(holdingId, changeRate) {
    const holdings = holdingId
      ? this.holdings.filter(h => h.id === holdingId)
      : this.holdings

    holdings.forEach(holding => {
      holding.currentPrice *= (1 + changeRate)
      holding.profit = (holding.currentPrice - holding.buyPrice) * holding.shares
      holding.profitRate = ((holding.currentPrice - holding.buyPrice) / holding.buyPrice) * 100
    })

    this.recalculateWealth()
  }

  /**
   * 根据技能水平随机更新所有持仓价格
   * 技能越高，收益越倾向正面
   */
  updateAllHoldingPrices() {
    this.holdings.forEach(holding => {
      const skill = this.skills[holding.type] || 0
      // 基础波动 -15% 到 +15%
      // 技能加成：每10点技能增加1%正向偏移
      const baseChange = (Math.random() - 0.5) * 0.3
      const skillBonus = (skill / 10) * 0.01
      const change = baseChange + skillBonus

      holding.currentPrice = Math.max(1, holding.currentPrice * (1 + change))
      holding.profit = (holding.currentPrice - holding.buyPrice) * holding.shares
      holding.profitRate = ((holding.currentPrice - holding.buyPrice) / holding.buyPrice) * 100
    })

    this.recalculateWealth()
  }

  /**
   * 获取持仓总市值
   */
  getHoldingsValue() {
    return this.holdings.reduce((sum, h) => sum + h.shares * h.currentPrice, 0)
  }

  /**
   * 获取持仓总盈亏
   */
  getHoldingsProfit() {
    return this.holdings.reduce((sum, h) => sum + h.profit, 0)
  }

  /**
   * 按类型获取持仓汇总
   */
  getHoldingsByType() {
    const summary = {}
    this.holdings.forEach(h => {
      if (!summary[h.type]) {
        summary[h.type] = { count: 0, value: 0, profit: 0 }
      }
      summary[h.type].count++
      summary[h.type].value += h.shares * h.currentPrice
      summary[h.type].profit += h.profit
    })
    return summary
  }

  /**
   * 应用事件效果
   */
  applyEffect(effect) {
    if (!effect) return

    for (const [key, value] of Object.entries(effect)) {
      if (typeof value === 'number') {
        if (key === 'cash') {
          this.stats.cash += value
        } else if (key === 'income') {
          this.stats.income += value
        } else if (key === 'insight') {
          this.stats.insight = Math.min(100, Math.max(0, this.stats.insight + value))
        } else if (key === 'monthlyExpense') {
          this.stats.monthlyExpense += value
        } else if (key.startsWith('skill_')) {
          // skill_stock, skill_fund 等
          const field = key.replace('skill_', '')
          this.study(field, value * 20)  // value 是等级增加量
        }
      }
    }

    this.recalculateWealth()
  }

  /**
   * 记录事件
   */
  logEvent(event, choice) {
    this.lifeLog.push({
      age: this.age,
      month: this.month,
      event: event.title,
      choice: choice?.text || '自动',
      timestamp: Date.now()
    })
  }

  /**
   * 计算财富评分
   */
  calculateLifeScore() {
    const { wealth, income, insight } = this.stats

    let score = 0

    // 财富分数
    if (wealth >= 100000000) score += 100
    else if (wealth >= 10000000) score += 80
    else if (wealth >= 1000000) score += 60
    else if (wealth >= 100000) score += 40
    else if (wealth >= 0) score += 20

    // 收入分数
    score += Math.min(30, Math.floor(income / 100000) * 3)

    // 眼光分数
    score += Math.floor(insight / 2)

    // 技能分数
    const topSkill = this.getTopSkill()
    score += Math.floor(topSkill.level / 3)

    // 生活成就
    if (this.life.married) score += 5
    score += this.life.children * 3
    score += this.life.houses.length * 10
    score += this.life.cars.length * 2

    return Math.round(score)
  }

  /**
   * 获取人生评价
   */
  getLifeEvaluation() {
    const { wealth } = this.stats

    if (wealth >= 100000000) {
      return { title: '亿万富翁', description: '你实现了财务自由，成为顶级富豪！', color: 0xFFD700 }
    }
    if (wealth >= 10000000) {
      return { title: '千万身家', description: '你积累了可观的财富，生活无忧', color: 0xFFA500 }
    }
    if (wealth >= 1000000) {
      return { title: '百万富翁', description: '你有了不错的财务基础', color: 0x98FB98 }
    }
    if (wealth >= 100000) {
      return { title: '小有积蓄', description: '你存下了一些钱，继续努力', color: 0x87CEEB }
    }
    if (wealth >= 0) {
      return { title: '收支平衡', description: '没有负债，但也没有积蓄', color: 0xC0C0C0 }
    }
    return { title: '负债累累', description: '投资失败，欠下债务', color: 0xFF6B6B }
  }

  /**
   * 保存
   */
  save() {
    const data = {
      name: this.name,
      age: this.age,
      month: this.month,
      startingAge: this.startingAge,
      startingWealth: this.startingWealth,
      stats: this.stats,
      skills: this.skills,
      life: this.life,
      loans: this.loans,
      holdings: this.holdings,
      holdingIdCounter: this.holdingIdCounter,
      passiveIncome: this.passiveIncome,
      lifeLog: this.lifeLog,
      isAlive: this.isAlive,
      job: this.job,
    }
    localStorage.setItem('richgame_save', JSON.stringify(data))
  }

  /**
   * 加载
   */
  load() {
    const data = localStorage.getItem('richgame_save')
    if (!data) return false

    try {
      const parsed = JSON.parse(data)
      Object.assign(this, parsed)
      return true
    } catch (e) {
      return false
    }
  }

  static clearSave() {
    localStorage.removeItem('richgame_save')
  }

  static hasSave() {
    return !!localStorage.getItem('richgame_save')
  }
}
