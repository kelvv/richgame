/**
 * 富翁模拟器 - 投资之路
 * 玩家主动选择动作 + 随机事件穿插
 */
import { Player } from './game/Player.js'
import { ACTIONS, ACTION_CATEGORIES, getAvailableActions, EVENT_TRIGGER_CHANCE } from './data/actions.js'
import { generateAIEvent } from './ai/generator.js'

class Game {
  constructor() {
    this.player = new Player()
    this.currentEvent = null
    this.isLoading = false
    this.bindEvents()
    this.init()
  }

  init() {
    if (Player.hasSave()) {
      document.getElementById('btn-continue').style.display = 'block'
    }
  }

  bindEvents() {
    // 开始新游戏
    document.getElementById('btn-new-game').addEventListener('click', () => {
      const ageInput = document.getElementById('input-age')
      const wealthInput = document.getElementById('input-wealth')

      const startAge = Math.max(18, Math.min(60, parseInt(ageInput.value) || 25))
      const startWealth = Math.max(0, (parseFloat(wealthInput.value) || 10)) * 10000

      Player.clearSave()
      this.player.reset(startAge, startWealth)
      this.startGame()
    })

    // 继续游戏
    document.getElementById('btn-continue').addEventListener('click', () => {
      this.player.load()
      this.startGame(true)
    })

    // 下一年
    document.getElementById('btn-next-year').addEventListener('click', () => {
      this.nextYear()
    })

    // 重新开始
    document.getElementById('btn-restart').addEventListener('click', () => {
      Player.clearSave()
      this.showScene('menu-scene')
      document.getElementById('btn-continue').style.display = 'none'
    })
  }

  showScene(sceneId) {
    document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'))
    document.getElementById(sceneId).classList.add('active')
  }

  startGame(continued = false) {
    this.showScene('game-scene')
    this.updateUI()

    if (!continued) {
      this.showStartInfo()
    } else {
      if (this.player.getRemainingMonths() > 0) {
        this.showActionMenu()
      } else {
        document.getElementById('btn-next-year').style.display = 'block'
      }
    }
  }

  showStartInfo() {
    document.getElementById('event-category').textContent = '投资起点'
    document.getElementById('event-title').textContent = '你的投资之旅开始了'
    document.getElementById('event-desc').textContent =
      `${this.player.age}岁，起始资产 ${this.formatMoney(this.player.stats.wealth)}，年收入 ${this.formatMoney(this.player.stats.income)}。\n\n选择你想做的事情，每个行动都会消耗时间。`

    document.getElementById('choices').innerHTML = ''
    document.getElementById('btn-next-year').style.display = 'block'
  }

  updateUI() {
    // 年龄和阶段
    document.getElementById('player-age').textContent = `${this.player.age} 岁`
    document.getElementById('player-stage').textContent = this.player.getCurrentStage().name

    // 时间进度
    const remainingMonths = this.player.getRemainingMonths()
    const usedMonths = 12 - remainingMonths
    document.getElementById('time-text').textContent = `${this.player.month}月 / 剩余${remainingMonths}个月`
    document.getElementById('time-fill').style.width = `${(usedMonths / 12) * 100}%`

    // 财务数据
    document.getElementById('val-wealth').textContent = this.formatMoney(this.player.stats.wealth)
    document.getElementById('val-cash').textContent = this.formatMoney(this.player.stats.cash)
    document.getElementById('val-income').textContent = this.formatMoney(this.player.stats.income) + '/年'
    document.getElementById('val-expense').textContent = this.formatMoney(this.player.getMonthlyExpense()) + '/月'

    // 负债显示
    const totalDebt = this.player.getTotalDebt()
    const debtItem = document.getElementById('debt-item')
    if (totalDebt > 0) {
      document.getElementById('val-debt').textContent = this.formatMoney(totalDebt)
      debtItem.style.display = 'flex'
    } else {
      debtItem.style.display = 'none'
    }

    // 生活状态标签
    this.updateLifeTags()

    // 技能等级
    this.updateSkillsGrid()

    // 持仓面板
    this.updateHoldingsPanel()

    // 负债状态特殊显示
    if (this.player.stats.wealth < 0) {
      document.getElementById('val-wealth').style.color = '#f85149'
    } else {
      document.getElementById('val-wealth').style.color = '#3fb950'
    }

    // 保存进度
    this.player.save()
  }

  updateLifeTags() {
    const tagsEl = document.getElementById('life-tags')
    tagsEl.innerHTML = ''

    const marriageTag = document.createElement('span')
    marriageTag.className = `life-tag ${this.player.life.married ? 'active' : ''}`
    marriageTag.textContent = this.player.life.married ? '💒 已婚' : '💔 未婚'
    tagsEl.appendChild(marriageTag)

    if (this.player.life.children > 0) {
      const childTag = document.createElement('span')
      childTag.className = 'life-tag active'
      childTag.textContent = `👶 ${this.player.life.children}个孩子`
      tagsEl.appendChild(childTag)
    }

    if (this.player.life.houses.length > 0) {
      const houseTag = document.createElement('span')
      houseTag.className = 'life-tag active'
      houseTag.textContent = `🏠 ${this.player.life.houses.length}套房`
      tagsEl.appendChild(houseTag)
    }

    if (this.player.life.cars.length > 0) {
      const carTag = document.createElement('span')
      carTag.className = 'life-tag active'
      carTag.textContent = `🚗 ${this.player.life.cars.length}辆车`
      tagsEl.appendChild(carTag)
    }
  }

  updateSkillsGrid() {
    const gridEl = document.getElementById('skills-grid')
    gridEl.innerHTML = ''

    // 投资眼光
    const insightItem = document.createElement('div')
    insightItem.className = 'skill-item'
    insightItem.style.background = 'rgba(240, 136, 62, 0.15)'
    insightItem.style.color = '#f0883e'
    insightItem.innerHTML = `
      <span class="skill-icon">👁️</span>
      <span class="skill-name">眼光</span>
      <span class="skill-level">${this.player.stats.insight}</span>
    `
    gridEl.appendChild(insightItem)

    const fieldNames = {
      stock: { name: '股票', icon: '📊' },
      fund: { name: '基金', icon: '📈' },
      real_estate: { name: '房产', icon: '🏠' },
      crypto: { name: '加密', icon: '₿' },
      business: { name: '创业', icon: '🏢' },
      career: { name: '职场', icon: '💼' },
    }

    for (const [field, level] of Object.entries(this.player.skills)) {
      const info = fieldNames[field]
      if (!info) continue

      const item = document.createElement('div')
      item.className = 'skill-item'
      if (level > 0) {
        item.style.background = 'rgba(88, 166, 255, 0.15)'
        item.style.color = '#58a6ff'
      }
      item.innerHTML = `
        <span class="skill-icon">${info.icon}</span>
        <span class="skill-name">${info.name}</span>
        <span class="skill-level">${level}</span>
      `
      gridEl.appendChild(item)
    }
  }

  updateHoldingsPanel() {
    const panel = document.getElementById('holdings-panel')
    const list = document.getElementById('holdings-list')
    const summary = document.getElementById('holdings-summary')

    if (this.player.holdings.length === 0) {
      panel.style.display = 'none'
      return
    }

    panel.style.display = 'block'

    const totalValue = this.player.getHoldingsValue()
    const totalProfit = this.player.getHoldingsProfit()
    const profitClass = totalProfit >= 0 ? 'profit' : 'loss'
    const profitSign = totalProfit >= 0 ? '+' : ''
    summary.innerHTML = `市值 ${this.formatMoney(totalValue)} <span class="${profitClass}">${profitSign}${this.formatMoney(totalProfit)}</span>`

    list.innerHTML = ''

    const typeIcons = {
      stock: '📊',
      fund: '📈',
      crypto: '₿',
      business: '🏢',
    }

    this.player.holdings.forEach(holding => {
      const value = holding.shares * holding.currentPrice
      const profitRate = holding.profitRate.toFixed(1)
      const profitClass = holding.profit >= 0 ? 'positive' : 'negative'
      const profitSign = holding.profit >= 0 ? '+' : ''

      const item = document.createElement('div')
      item.className = 'holding-item'
      item.innerHTML = `
        <div class="holding-info">
          <div class="holding-name">${typeIcons[holding.type] || '📦'} ${holding.name}</div>
          <div class="holding-detail">成本 ${this.formatMoney(holding.amount)} · ${holding.buyTime.age}岁${holding.buyTime.month}月买入</div>
          <div class="holding-actions">
            <button class="holding-btn sell" data-id="${holding.id}">卖出</button>
            <button class="holding-btn add" data-id="${holding.id}">加仓</button>
          </div>
        </div>
        <div class="holding-value">
          <div class="holding-amount">${this.formatMoney(value)}</div>
          <div class="holding-profit ${profitClass}">${profitSign}${profitRate}%</div>
        </div>
      `
      list.appendChild(item)
    })

    // 绑定按钮事件
    list.querySelectorAll('.holding-btn.sell').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const holdingId = parseInt(e.target.dataset.id)
        this.showSellDialog(holdingId)
      })
    })

    list.querySelectorAll('.holding-btn.add').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const holdingId = parseInt(e.target.dataset.id)
        this.showAddPositionDialog(holdingId)
      })
    })
  }

  showSellDialog(holdingId) {
    const holding = this.player.holdings.find(h => h.id === holdingId)
    if (!holding) return

    const value = holding.shares * holding.currentPrice
    const profit = holding.profit
    const profitText = profit >= 0 ? `盈利 ${this.formatMoney(profit)}` : `亏损 ${this.formatMoney(Math.abs(profit))}`

    if (confirm(`确定卖出「${holding.name}」？\n当前市值: ${this.formatMoney(value)}\n${profitText}`)) {
      const result = this.player.sellInvestment(holdingId)
      if (result) {
        const msg = result.profit >= 0
          ? `卖出成功！获得 ${this.formatMoney(result.cash)}，盈利 ${result.profitRate.toFixed(1)}%`
          : `卖出成功！获得 ${this.formatMoney(result.cash)}，亏损 ${Math.abs(result.profitRate).toFixed(1)}%`
        alert(msg)
        this.updateUI()
      }
    }
  }

  showAddPositionDialog(holdingId) {
    const holding = this.player.holdings.find(h => h.id === holdingId)
    if (!holding) return

    const addAmount = prompt(`加仓「${holding.name}」\n当前可用现金: ${this.formatMoney(this.player.stats.cash)}\n请输入加仓金额（万）:`)
    if (addAmount) {
      const amount = parseFloat(addAmount) * 10000
      if (amount > 0 && amount <= this.player.stats.cash) {
        this.player.addToPosition(holdingId, amount)
        alert(`加仓成功！已投入 ${this.formatMoney(amount)}`)
        this.updateUI()
      } else {
        alert('金额无效或现金不足')
      }
    }
  }

  formatMoney(value) {
    if (value >= 100000000) {
      return `¥${(value / 100000000).toFixed(2)}亿`
    } else if (value >= 10000) {
      return `¥${(value / 10000).toFixed(1)}万`
    } else if (value < 0) {
      if (value <= -10000) {
        return `-¥${Math.abs(value / 10000).toFixed(1)}万`
      }
      return `-¥${Math.abs(value).toLocaleString()}`
    } else {
      return `¥${value.toLocaleString()}`
    }
  }

  // ========== 新的核心：动作菜单 ==========

  showActionMenu() {
    if (this.player.getRemainingMonths() <= 0) {
      this.showYearEnd()
      return
    }

    document.getElementById('btn-next-year').style.display = 'none'
    document.getElementById('effects').innerHTML = ''

    document.getElementById('event-category').textContent = '选择行动'
    document.getElementById('event-title').textContent = '你想做什么？'
    document.getElementById('event-desc').textContent = `当前${this.player.month}月，今年还剩${this.player.getRemainingMonths()}个月。选择一个行动来推进你的人生。`

    this.renderActionButtons()
  }

  renderActionButtons() {
    const choicesEl = document.getElementById('choices')
    choicesEl.innerHTML = ''

    // 按分类渲染动作（手风琴样式）
    let firstCategory = true
    for (const [catId, cat] of Object.entries(ACTION_CATEGORIES)) {
      const categoryActions = Object.values(ACTIONS).filter(a => a.category === catId.toLowerCase())
      if (categoryActions.length === 0) continue

      // 分类容器
      const categoryDiv = document.createElement('div')
      categoryDiv.className = `action-category ${firstCategory ? 'expanded' : ''}`

      // 分类标题（可点击展开/收起）
      const catHeader = document.createElement('div')
      catHeader.className = 'action-category-header'
      catHeader.innerHTML = `
        <span class="action-category-title" style="color: ${cat.color}">${cat.name}</span>
        <span class="action-category-arrow">▼</span>
      `
      catHeader.addEventListener('click', () => {
        categoryDiv.classList.toggle('expanded')
      })
      categoryDiv.appendChild(catHeader)

      // 该分类下的动作按钮
      const actionsGrid = document.createElement('div')
      actionsGrid.className = 'actions-grid'

      categoryActions.forEach(action => {
        const available = this.isActionAvailable(action)
        const btn = document.createElement('button')
        btn.className = `action-btn ${available ? '' : 'disabled'}`

        // 时间消耗标签
        const timeLabel = action.timeMonths > 0 ? `${action.timeMonths}月` : '即时'

        // 费用标签
        let costLabel = ''
        if (action.cost) {
          costLabel = this.formatMoney(action.cost)
        } else if (action.minCash) {
          costLabel = `需${this.formatMoney(action.minCash)}+`
        }

        btn.innerHTML = `
          <div class="action-name">${action.name}</div>
          <div class="action-meta">
            <span class="action-time">${timeLabel}</span>
            ${costLabel ? `<span class="action-cost">${costLabel}</span>` : ''}
          </div>
        `

        if (available) {
          btn.addEventListener('click', (e) => {
            e.stopPropagation()
            this.executeAction(action)
          })
        } else {
          btn.title = this.getUnavailableReason(action)
        }

        actionsGrid.appendChild(btn)
      })

      categoryDiv.appendChild(actionsGrid)
      choicesEl.appendChild(categoryDiv)
      firstCategory = false
    }
  }

  isActionAvailable(action) {
    const remainingMonths = this.player.getRemainingMonths()
    if (action.timeMonths > remainingMonths) return false
    if (action.condition && !action.condition(this.player)) return false
    if (action.minCash && this.player.stats.cash < action.minCash) return false
    if (action.cost && this.player.stats.cash < action.cost) return false
    return true
  }

  getUnavailableReason(action) {
    const remainingMonths = this.player.getRemainingMonths()
    if (action.timeMonths > remainingMonths) return `时间不足（需要${action.timeMonths}个月）`
    if (action.condition && !action.condition(this.player)) return '条件不满足'
    if (action.minCash && this.player.stats.cash < action.minCash) return `现金不足（需要${this.formatMoney(action.minCash)}）`
    if (action.cost && this.player.stats.cash < action.cost) return `现金不足（需要${this.formatMoney(action.cost)}）`
    return '无法执行'
  }

  async executeAction(action) {
    // 特殊面板动作（不消耗时间）
    if (action.isPanel) {
      if (action.id === 'manage_holdings') {
        this.showHoldingsManagement()
      }
      return
    }

    // 需要参数的动作
    if (action.id === 'buy_stock' || action.id === 'buy_fund' || action.id === 'buy_crypto') {
      const result = await this.showInvestDialog(action)
      if (!result) return
    }

    if (action.id === 'buy_car') {
      const result = await this.showBuyCarDialog()
      if (!result) return
    }

    if (action.id === 'buy_house') {
      const result = await this.showBuyHouseDialog()
      if (!result) return
    }

    if (action.id === 'marry') {
      const result = await this.showMarryDialog()
      if (!result) return
    }

    if (action.id === 'start_business') {
      const result = await this.showStartBusinessDialog()
      if (!result) return
    }

    // 消耗时间
    if (action.timeMonths > 0) {
      this.player.spendTime(action.timeMonths)
    }

    // 执行动作
    let result = {}
    if (action.execute && !action.isPanel) {
      result = action.execute(this.player, this.actionParams || {})
    }
    this.actionParams = null

    // 显示结果
    this.showActionResult(action, result)
    this.updateUI()

    // 随机事件触发
    if (Math.random() < EVENT_TRIGGER_CHANCE && action.timeMonths > 0) {
      setTimeout(() => {
        this.triggerRandomEvent()
      }, 1500)
    } else {
      // 继续显示动作菜单
      setTimeout(() => {
        this.showActionMenu()
      }, 1500)
    }
  }

  showActionResult(action, result) {
    document.getElementById('choices').innerHTML = ''
    document.getElementById('event-category').textContent = '行动结果'
    document.getElementById('event-title').textContent = action.name

    let resultText = ''
    const effectsEl = document.getElementById('effects')
    effectsEl.innerHTML = ''

    // 根据动作类型生成结果描述
    switch (action.id) {
      case 'buy_stock':
      case 'buy_fund':
      case 'buy_crypto':
        resultText = `你投入了资金进行${action.name}，建仓完成。接下来就看市场表现了。`
        break

      case 'study_stock':
      case 'study_fund':
      case 'study_crypto':
      case 'study_real_estate':
      case 'study_business':
      case 'study_career':
        resultText = `经过${action.timeMonths}个月的学习，你的${action.name.replace('学习', '')}技能提升了${result.gain || 0}点。`
        if (result.incomeBonus) {
          resultText += `\n考证成功！年收入增加 ${this.formatMoney(result.incomeBonus)}！`
          this.addEffectItem(effectsEl, '年收入', `+${this.formatMoney(result.incomeBonus)}`, true)
        }
        this.addEffectItem(effectsEl, '技能', `+${result.gain || 0}`, true)
        break

      case 'work_hard':
        if (result.success) {
          resultText = `你的努力得到了认可，成功获得加薪 ${this.formatMoney(result.raise)}/年！`
          this.addEffectItem(effectsEl, '年收入', `+${this.formatMoney(result.raise)}`, true)
        } else {
          resultText = '虽然你很努力，但这次没有获得加薪机会。继续加油！'
        }
        break

      case 'find_job':
        if (result.success) {
          resultText = `面试成功！你跳槽到了新公司，年收入增加 ${this.formatMoney(result.increase)}！`
          this.addEffectItem(effectsEl, '年收入', `+${this.formatMoney(result.increase)}`, true)
        } else {
          resultText = '这次求职不太顺利，没有找到满意的offer。下次再试试。'
        }
        break

      case 'side_business':
        resultText = `这个月的副业收入 ${this.formatMoney(result.earn)}，不错的额外收入！`
        this.addEffectItem(effectsEl, '现金', `+${this.formatMoney(result.earn)}`, true)
        break

      case 'start_business':
        if (result.success) {
          resultText = `创业成功！你的项目开始盈利，价值翻倍！不过你已经辞职，没有工资收入了。`
          this.addEffectItem(effectsEl, '创业', '成功', true)
        } else {
          resultText = `创业失败，损失了 ${this.formatMoney(result.lost)}。但这次经历让你学到了很多。`
          this.addEffectItem(effectsEl, '现金', `-${this.formatMoney(result.lost)}`, false)
        }
        break

      case 'dating':
        if (result.success) {
          resultText = result.message + '，继续发展看看！'
        } else {
          resultText = '这次没有遇到合适的人，缘分还没到。'
        }
        break

      case 'marry':
        resultText = '恭喜你步入婚姻殿堂！从此有人与你共担风雨。'
        this.addEffectItem(effectsEl, '💒', '已婚', true)
        break

      case 'have_baby':
        resultText = '恭喜喜得贵子！虽然养育成本增加，但生活更加充实了。'
        this.addEffectItem(effectsEl, '👶', '+1', true)
        break

      case 'buy_car':
        resultText = '提车成功！以后出行更方便了。'
        this.addEffectItem(effectsEl, '🚗', '+1', true)
        break

      case 'buy_house':
        resultText = '购房成功！虽然背上了房贷，但终于有了自己的家。'
        this.addEffectItem(effectsEl, '🏠', '+1', true)
        break

      case 'rest':
        resultText = '休息了一个月，感觉精神状态好多了。'
        this.addEffectItem(effectsEl, '眼光', '+2', true)
        break

      case 'travel':
        resultText = '旅游让你开阔了眼界，对世界有了新的认识。'
        this.addEffectItem(effectsEl, '眼光', '+5', true)
        break

      case 'skip_month':
        resultText = '平淡的一个月过去了。'
        break

      default:
        resultText = '行动完成。'
    }

    document.getElementById('event-desc').textContent = resultText
  }

  addEffectItem(container, label, value, isPositive) {
    const el = document.createElement('div')
    el.className = `effect-item ${isPositive ? 'effect-positive' : 'effect-negative'}`
    el.textContent = `${label} ${value}`
    container.appendChild(el)
  }

  // ========== 对话框 ==========

  async showInvestDialog(action) {
    const typeNames = {
      buy_stock: '股票',
      buy_fund: '基金',
      buy_crypto: '加密货币',
    }
    const typeName = typeNames[action.id] || '投资'

    const name = prompt(`给这笔${typeName}投资起个名字：\n（如：科技龙头股、沪深300基金、比特币等）`)
    if (!name) return false

    const amountStr = prompt(`投资金额（万）：\n当前可用现金: ${this.formatMoney(this.player.stats.cash)}`)
    if (!amountStr) return false

    const amount = parseFloat(amountStr) * 10000
    if (amount <= 0 || amount > this.player.stats.cash) {
      alert('金额无效或现金不足')
      return false
    }

    this.actionParams = { name, amount }
    return true
  }

  async showBuyCarDialog() {
    const priceStr = prompt(`买车预算（万）：\n当前可用现金: ${this.formatMoney(this.player.stats.cash)}\n建议：10-50万`)
    if (!priceStr) return false

    const price = parseFloat(priceStr) * 10000
    if (price <= 0 || price > this.player.stats.cash) {
      alert('金额无效或现金不足')
      return false
    }

    const name = prompt('给爱车起个名字：') || '汽车'
    this.actionParams = { name, price }

    // 手动扣款和添加车
    this.player.stats.cash -= price
    this.player.buyCar({ name, price })
    return true
  }

  async showBuyHouseDialog() {
    const priceStr = prompt(`房屋总价（万）：\n当前可用现金: ${this.formatMoney(this.player.stats.cash)}\n首付通常为30%`)
    if (!priceStr) return false

    const price = parseFloat(priceStr) * 10000
    const downPayment = price * 0.3

    if (downPayment > this.player.stats.cash) {
      alert(`首付 ${this.formatMoney(downPayment)} 超过可用现金`)
      return false
    }

    const name = prompt('给房子起个名字：') || '住宅'
    this.actionParams = { name, price, downPayment, years: 30 }

    // 手动处理购房
    this.player.stats.cash -= downPayment
    this.player.buyHouse({ name, price })
    const loanAmount = price - downPayment
    if (loanAmount > 0) {
      this.player.takeLoan('MORTGAGE', loanAmount, 30)
    }
    return true
  }

  async showMarryDialog() {
    const costStr = prompt(`婚礼预算（万）：\n当前可用现金: ${this.formatMoney(this.player.stats.cash)}\n建议：15-50万`)
    if (!costStr) return false

    const cost = parseFloat(costStr) * 10000
    if (cost <= 0 || cost > this.player.stats.cash) {
      alert('金额无效或现金不足')
      return false
    }

    const spouseIncomeStr = prompt('配偶年收入（万）：\n（会增加家庭收入）') || '6'
    const spouseIncome = parseFloat(spouseIncomeStr) * 10000

    this.actionParams = { cost, spouseIncome }

    // 手动处理结婚
    this.player.stats.cash -= cost
    this.player.marry({ income: spouseIncome })
    return true
  }

  async showStartBusinessDialog() {
    const amountStr = prompt(`创业投资金额（万）：\n当前可用现金: ${this.formatMoney(this.player.stats.cash)}\n注意：创业风险高，可能血本无归！`)
    if (!amountStr) return false

    const amount = parseFloat(amountStr) * 10000
    if (amount < 100000) {
      alert('创业至少需要10万启动资金')
      return false
    }
    if (amount > this.player.stats.cash) {
      alert('现金不足')
      return false
    }

    const name = prompt('给创业项目起个名字：') || '创业项目'
    this.actionParams = { name, amount }
    return true
  }

  showHoldingsManagement() {
    // 已经在 updateHoldingsPanel 中实现，这里可以滚动到持仓面板
    const panel = document.getElementById('holdings-panel')
    if (panel) {
      panel.scrollIntoView({ behavior: 'smooth' })
    }
    if (this.player.holdings.length === 0) {
      alert('你目前没有任何持仓')
    }
  }

  // ========== 随机事件 ==========

  async triggerRandomEvent() {
    this.isLoading = true
    document.getElementById('choices').innerHTML = ''
    document.getElementById('event-category').textContent = '突发事件'
    document.getElementById('event-title').textContent = ''
    document.getElementById('event-desc').innerHTML = `
      <div class="loading">
        <div class="loading-spinner"></div>
        <span>发生了一些事情...</span>
      </div>
    `

    try {
      const event = await generateAIEvent(this.player)
      this.currentEvent = event
      this.displayRandomEvent(event)
    } catch (error) {
      console.error('Random event error:', error)
      this.showActionMenu()
    } finally {
      this.isLoading = false
    }
  }

  displayRandomEvent(event) {
    const timeText = event.timeMonths > 1 ? `（需${event.timeMonths}个月处理）` : ''
    document.getElementById('event-category').textContent = '🎲 ' + (event.category || '随机事件') + timeText
    document.getElementById('event-title').textContent = event.title
    document.getElementById('event-desc').textContent = event.description

    if (event.choices && event.choices.length > 0) {
      this.showEventChoices(event)
    } else {
      setTimeout(() => this.showActionMenu(), 1500)
    }
  }

  showEventChoices(event) {
    const choicesEl = document.getElementById('choices')
    choicesEl.innerHTML = ''

    event.choices.forEach((choice) => {
      const btn = document.createElement('button')
      btn.className = 'choice-btn'
      btn.innerHTML = `<div>${choice.text}</div>`
      btn.addEventListener('click', () => this.selectEventChoice(choice))
      choicesEl.appendChild(btn)
    })
  }

  selectEventChoice(choice) {
    // 消耗时间
    const timeMonths = this.currentEvent.timeMonths || 1
    this.player.spendTime(timeMonths)

    // 处理特殊动作
    this.processEventAction(choice)

    // 应用效果
    this.player.applyEffect(choice.effect)
    this.player.logEvent(this.currentEvent, choice)

    // 清除选项
    document.getElementById('choices').innerHTML = ''

    // 显示结果
    this.showEventResult(choice)
    this.updateUI()

    // 继续
    setTimeout(() => {
      this.showActionMenu()
    }, 2000)
  }

  processEventAction(choice) {
    if (!choice.action) return

    switch (choice.action) {
      case 'marry':
        this.player.marry({
          name: '配偶',
          income: Math.floor(this.player.stats.income * 0.3 + Math.random() * 50000)
        })
        break

      case 'baby':
        this.player.haveBaby()
        break

      case 'buy_house':
        const housePrice = choice.loan ? choice.loan.amount / 0.7 : 1000000
        this.player.buyHouse({ name: '房产', price: housePrice })
        if (choice.loan) {
          this.player.takeLoan(choice.loan.type, choice.loan.amount, choice.loan.years)
        }
        break

      case 'buy_car':
        const carPrice = Math.abs(choice.effect?.cash || 200000)
        this.player.buyCar({ name: '汽车', price: carPrice })
        break

      case 'buy_investment':
        if (choice.investment) {
          const inv = choice.investment
          if (choice.effect && choice.effect.cash < 0) {
            choice.effect.cash = 0
          }
          this.player.buyInvestment(inv.type, inv.name, inv.amount)
        }
        break
    }
  }

  showEventResult(choice) {
    document.getElementById('event-category').textContent = '事件结果'

    if (choice.resultText) {
      document.getElementById('event-desc').innerHTML = `<div class="result-text">${choice.resultText}</div>`
    }

    // 显示效果
    const effectsEl = document.getElementById('effects')
    effectsEl.innerHTML = ''

    if (choice.action) {
      const actionMessages = {
        marry: '💒 结婚了！',
        baby: '👶 喜得贵子！',
        buy_house: '🏠 买房了！',
        buy_car: '🚗 买车了！',
        buy_investment: '📊 建仓成功！',
      }
      if (actionMessages[choice.action]) {
        this.addEffectItem(effectsEl, '', actionMessages[choice.action], true)
      }
    }

    if (choice.effect) {
      for (const [key, value] of Object.entries(choice.effect)) {
        if (value === 0) continue
        const isPositive = value > 0
        let label = key
        let displayValue = value

        if (key === 'cash' || key === 'income') {
          displayValue = this.formatMoney(Math.abs(value))
          displayValue = (value > 0 ? '+' : '-') + displayValue
        } else {
          displayValue = (value > 0 ? '+' : '') + value
        }

        const labelMap = {
          cash: '💵 现金',
          income: '📈 年收入',
          insight: '👁️ 眼光',
        }
        label = labelMap[key] || key

        this.addEffectItem(effectsEl, label, displayValue, isPositive)
      }
    }
  }

  // ========== 年终和游戏结束 ==========

  showYearEnd() {
    document.getElementById('event-category').textContent = '年终'
    document.getElementById('event-title').textContent = `${this.player.age}岁这一年结束了`
    document.getElementById('event-desc').textContent = `今年的工资已按月发放完毕。\n点击进入下一年继续你的投资之旅。`
    document.getElementById('choices').innerHTML = ''
    document.getElementById('btn-next-year').style.display = 'block'
    this.updateUI()
  }

  nextYear() {
    document.getElementById('btn-next-year').style.display = 'none'
    document.getElementById('effects').innerHTML = ''

    const alive = this.player.nextYear()
    if (!alive) {
      this.gameOver()
      return
    }

    this.updateUI()
    this.showActionMenu()
  }

  gameOver() {
    this.showScene('end-scene')

    const evaluation = this.player.getLifeEvaluation()
    const score = this.player.calculateLifeScore()

    document.getElementById('end-subtitle').textContent =
      `从 ${this.player.startingAge} 岁到 ${this.player.age} 岁，共 ${this.player.age - this.player.startingAge} 年`

    const evalCard = document.getElementById('evaluation-card')
    evalCard.style.borderColor = '#' + evaluation.color.toString(16).padStart(6, '0')

    document.getElementById('eval-title').textContent = evaluation.title
    document.getElementById('eval-title').style.color = '#' + evaluation.color.toString(16).padStart(6, '0')
    document.getElementById('eval-desc').textContent = evaluation.description
    document.getElementById('eval-score').textContent = `财富评分: ${score}`

    const statsList = document.getElementById('final-stats-list')
    statsList.innerHTML = ''

    const finalStats = [
      { label: '💰 总资产', value: this.formatMoney(this.player.stats.wealth), color: '#3fb950' },
      { label: '💵 可用现金', value: this.formatMoney(this.player.stats.cash), color: '#58a6ff' },
      { label: '📈 最终年收入', value: this.formatMoney(this.player.stats.income), color: '#a371f7' },
      { label: '👁️ 投资眼光', value: `${this.player.stats.insight}/100`, color: '#f0883e' },
    ]

    if (this.player.life.married) {
      finalStats.push({ label: '💒 婚姻', value: '已婚', color: '#f778ba' })
    }
    if (this.player.life.children > 0) {
      finalStats.push({ label: '👶 子女', value: `${this.player.life.children}个`, color: '#f778ba' })
    }
    if (this.player.life.houses.length > 0) {
      const housesValue = this.player.life.houses.reduce((sum, h) => sum + h.currentValue, 0)
      finalStats.push({ label: '🏠 房产', value: `${this.player.life.houses.length}套 (${this.formatMoney(housesValue)})`, color: '#7ee787' })
    }
    if (this.player.life.cars.length > 0) {
      finalStats.push({ label: '🚗 车辆', value: `${this.player.life.cars.length}辆`, color: '#79c0ff' })
    }

    const topSkill = this.player.getTopSkill()
    if (topSkill.level > 0) {
      const fieldNames = {
        stock: '股票', fund: '基金', real_estate: '房产',
        crypto: '加密货币', business: '创业', career: '职场'
      }
      finalStats.push({
        label: '🎯 最强领域',
        value: `${fieldNames[topSkill.field]} Lv.${topSkill.level}`,
        color: '#ffd700'
      })
    }

    finalStats.forEach(stat => {
      const el = document.createElement('div')
      el.className = 'final-stat'
      el.style.color = stat.color
      el.textContent = `${stat.label}: ${stat.value}`
      statsList.appendChild(el)
    })

    const growthEl = document.createElement('div')
    growthEl.className = 'final-stat'
    growthEl.style.color = '#8b949e'
    const growth = this.player.stats.wealth - this.player.startingWealth
    const growthText = growth >= 0 ? `+${this.formatMoney(growth)}` : this.formatMoney(growth)
    growthEl.textContent = `📊 财富增长: ${growthText}（起点: ${this.formatMoney(this.player.startingWealth)}）`
    statsList.appendChild(growthEl)

    const logList = document.getElementById('life-log-list')
    logList.innerHTML = ''
    const recentLogs = this.player.lifeLog.slice(-10)
    recentLogs.forEach(log => {
      const el = document.createElement('div')
      el.className = 'log-item'
      el.textContent = `${log.age}岁${log.month}月 - ${log.event}: ${log.choice}`
      logList.appendChild(el)
    })
  }
}

// 启动游戏
new Game()
