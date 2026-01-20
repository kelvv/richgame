/**
 * 富翁模拟器 - AI 事件生成器
 * 一年多事件、时间消耗机制、生活大事
 */

// API Key 从 localStorage 或环境变量读取
const getApiKey = () => {
  return localStorage.getItem('OPENAI_API_KEY') || ''
}

// 设置 API Key（在控制台调用）
window.setOpenAIKey = (key) => {
  localStorage.setItem('OPENAI_API_KEY', key)
  console.log('API Key 已保存')
}

const SYSTEM_PROMPT = `你是富翁模拟器的事件生成器。根据玩家状态生成投资理财或生活大事事件。

## 事件类型和时间消耗
每个事件消耗不同月数，玩家每年有12个月可用：
- 投资理财（1-2月）：股票、基金、加密货币、理财产品
- 学习提升（2-3月）：课程学习、考证、研究某领域
- 职业发展（1-2月）：跳槽、升职、副业、创业
- 生活大事（2-6月）：结婚、生孩子、买房、买车
- 日常决策（1月）：小额消费、日常投资调整

## 必须包含的内容类型（轮流生成，保持多样性）
1. 投资机会：股票、基金、房产、加密货币、创业投资
2. 学习机会：专业技能学习（股票分析、房产投资、创业管理等）
3. 职业事件：涨薪、跳槽、被裁、升职、副业
4. 生活大事：相亲/结婚（未婚时）、生孩子（已婚时）、买房、买车
5. 贷款相关：房贷、车贷、消费贷
6. 意外事件：市场波动、政策变化、经济周期

## 根据玩家状态调整
- 未婚且>25岁：增加相亲/结婚事件概率
- 已婚无子女：增加生孩子事件
- 无房且现金>50万：增加买房机会
- 无车且现金>15万：增加买车机会
- 某技能等级高：该领域更好的机会
- 负债高：增加还贷压力事件

## 金额规则
- 小额投资：1-10万
- 中额投资：10-100万
- 大额投资：100万+
- 结婚费用：15-50万
- 生孩子：3-10万（一次性）+ 每月3000养育费
- 买车：10-50万
- 买房首付：50-200万
- 学习费用：0.5-5万

## effect字段说明
- cash: 现金变化（正=收入，负=支出）
- income: 年收入变化
- monthlyExpense: 月固定支出变化
- insight: 投资眼光变化
- skill_stock/skill_fund/skill_real_estate/skill_crypto/skill_business/skill_career: 技能等级变化

## 特殊动作（通过action字段触发）
- action: "marry" - 结婚
- action: "baby" - 生孩子
- action: "buy_house" - 买房（需配合loan字段）
- action: "buy_car" - 买车
- action: "loan" - 贷款，需要loan: { type: "mortgage/car_loan/consumer", amount: 数字, years: 年数 }
- action: "buy_investment" - 买入投资品，需要investment: { type: "stock/fund/crypto/business", name: "投资品名称", amount: 投资金额 }

## 投资事件重要说明
当生成投资理财类事件时，优先使用 buy_investment 动作让玩家建立持仓：
- stock: 股票投资，如"科技龙头股"、"新能源概念股"、"消费白马股"
- fund: 基金投资，如"沪深300指数基金"、"科技主题基金"、"债券基金"
- crypto: 加密货币，如"比特币"、"以太坊"
- business: 创业投资，如"朋友的奶茶店"、"小型电商项目"

投资金额应根据玩家现金合理设置，通常建议投入现金的10%-30%。

返回JSON格式：
{
  "category": "投资理财/学习提升/职业发展/生活大事/日常决策",
  "timeMonths": 1-6,
  "title": "标题4-8字",
  "description": "描述40-100字，包含具体金额和背景",
  "choices": [
    {
      "text": "选项描述",
      "resultText": "选择后的结果描述（30-80字，描述这个选择带来的具体后果，要生动真实）",
      "effect": { "cash": 0, "income": 0, "insight": 0, ... },
      "action": "可选的特殊动作",
      "investment": { "type": "stock", "name": "科技龙头股", "amount": 50000 },
      "loan": { "type": "mortgage", "amount": 1000000, "years": 30 }
    }
  ]
}

## 重要：选项数量要求
每个事件必须有 2-3 个选项，让玩家有选择的余地：
- 积极选项：投入资源（金钱/时间）获得潜在收益
- 保守选项：不投入或少投入，风险小但收益也小
- 可选的中间选项：折中方案
绝对不要只给1个选项！

## resultText 示例
- 投资成功："你买入的股票在三个月内涨了30%，成功获利出场。这次经验让你对技术分析更有信心。"
- 投资失败："市场突然暴跌，你的本金亏损了40%。虽然痛苦，但这让你学会了止损的重要性。"
- 学习："经过两个月的系统学习，你掌握了基金定投的核心策略，对市场周期有了更深的理解。"
- 结婚："你们举办了温馨的婚礼，虽然花费不少，但收获了满满的祝福。从此有人与你共担风雨。"
- 买房："签完合同的那一刻，你终于有了属于自己的家。虽然背上了房贷，但心里踏实了。"

只返回JSON，不要其他内容。`

// 事件类型池
const EVENT_CATEGORIES = [
  { type: '投资理财', weight: 30 },
  { type: '学习提升', weight: 15 },
  { type: '职业发展', weight: 20 },
  { type: '生活大事', weight: 25 },
  { type: '日常决策', weight: 10 },
]

/**
 * 生成 AI 事件
 */
export async function generateAIEvent(player, onStream) {
  // 根据玩家状态调整事件类型权重
  const adjustedCategories = adjustEventWeights(player)
  const selectedCategory = weightedRandom(adjustedCategories)

  // 构建提示
  const hints = buildPlayerHints(player)

  const userPrompt = `玩家状态：
- 年龄：${player.age}岁
- 当前月份：${player.month}月（今年剩余${player.getRemainingMonths()}个月）
- 人生阶段：${player.getCurrentStage().name}
- 总资产：¥${player.stats.wealth.toLocaleString()}
- 可用现金：¥${player.stats.cash.toLocaleString()}
- 年收入：¥${player.stats.income.toLocaleString()}
- 月支出：¥${player.getMonthlyExpense().toLocaleString()}
- 投资眼光：${player.stats.insight}/100
- 婚姻状态：${player.life.married ? '已婚' : '未婚'}
- 子女数量：${player.life.children}
- 房产数量：${player.life.houses.length}
- 车辆数量：${player.life.cars.length}
- 总负债：¥${player.getTotalDebt().toLocaleString()}
- 技能等级：股票${player.skills.stock} 基金${player.skills.fund} 房产${player.skills.real_estate} 加密${player.skills.crypto} 创业${player.skills.business} 职场${player.skills.career}

请生成一个【${selectedCategory}】类型的事件。${hints}

注意：事件消耗的时间不能超过剩余月份(${player.getRemainingMonths()}个月)。`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getApiKey()}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.9,
        max_tokens: 800,
        stream: true
      })
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(line => line.trim() !== '')

      for (const line of lines) {
        if (line === 'data: [DONE]') continue
        if (!line.startsWith('data: ')) continue

        try {
          const json = JSON.parse(line.slice(6))
          const content = json.choices?.[0]?.delta?.content
          if (content) {
            fullContent += content
            if (onStream) onStream(fullContent)
          }
        } catch (e) {}
      }
    }

    return parseEventJSON(fullContent, player)

  } catch (error) {
    console.error('AI generation error:', error)
    return getDefaultEvent(player)
  }
}

/**
 * 根据玩家状态调整事件权重
 */
function adjustEventWeights(player) {
  const weights = EVENT_CATEGORIES.map(c => ({ ...c }))

  // 未婚且年龄>25，增加生活大事权重
  if (!player.life.married && player.age > 25) {
    const lifeEvent = weights.find(w => w.type === '生活大事')
    if (lifeEvent) lifeEvent.weight += 15
  }

  // 已婚无子女，增加生活大事
  if (player.life.married && player.life.children === 0 && player.age < 40) {
    const lifeEvent = weights.find(w => w.type === '生活大事')
    if (lifeEvent) lifeEvent.weight += 10
  }

  // 有钱无房，增加买房机会
  if (player.life.houses.length === 0 && player.stats.cash > 500000) {
    const lifeEvent = weights.find(w => w.type === '生活大事')
    if (lifeEvent) lifeEvent.weight += 10
  }

  // 技能等级高，增加投资机会
  const topSkill = player.getTopSkill()
  if (topSkill.level > 30) {
    const invest = weights.find(w => w.type === '投资理财')
    if (invest) invest.weight += 10
  }

  return weights
}

/**
 * 构建玩家状态提示
 */
function buildPlayerHints(player) {
  const hints = []

  if (!player.life.married && player.age > 26) {
    hints.push('玩家单身较久，可考虑相亲/恋爱事件')
  }
  if (player.life.married && player.life.children === 0 && player.age > 28) {
    hints.push('玩家已婚但无子女，可考虑生育相关事件')
  }
  if (player.life.houses.length === 0 && player.stats.cash > 300000) {
    hints.push('玩家有积蓄但无房，可考虑买房事件')
  }
  if (player.life.cars.length === 0 && player.stats.cash > 150000) {
    hints.push('玩家无车，可考虑买车事件')
  }
  if (player.getTotalDebt() > player.stats.income * 2) {
    hints.push('玩家负债较高，增加还贷压力')
  }

  const topSkill = player.getTopSkill()
  if (topSkill.level > 40) {
    const fieldNames = {
      stock: '股票', fund: '基金', real_estate: '房产',
      crypto: '加密货币', business: '创业', career: '职场'
    }
    hints.push(`玩家${fieldNames[topSkill.field]}技能较高(${topSkill.level})，可提供该领域更好机会`)
  }

  return hints.length > 0 ? '\n\n特别提示：' + hints.join('；') : ''
}

/**
 * 权重随机选择
 */
function weightedRandom(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0)
  let random = Math.random() * total
  for (const item of items) {
    random -= item.weight
    if (random <= 0) return item.type
  }
  return items[0].type
}

/**
 * 解析事件JSON
 */
function parseEventJSON(content, player) {
  let jsonStr = content.trim()
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '')
  }

  try {
    const event = JSON.parse(jsonStr)

    // 验证格式
    if (!event.title || !event.choices) {
      throw new Error('Invalid format')
    }

    // 确保时间不超过剩余月份
    event.timeMonths = Math.min(event.timeMonths || 1, player.getRemainingMonths())
    event.category = event.category || '日常决策'

    // 确保每个选项都有effect和resultText
    event.choices = event.choices.map(choice => ({
      text: choice.text || '继续',
      resultText: choice.resultText || '',
      effect: choice.effect || {},
      action: choice.action,
      investment: choice.investment,
      loan: choice.loan,
    }))

    return event

  } catch (e) {
    console.error('JSON parse error:', e)
    return getDefaultEvent(player)
  }
}

/**
 * 默认事件
 */
function getDefaultEvent(player) {
  const remainingMonths = player.getRemainingMonths()

  if (remainingMonths <= 1) {
    return {
      category: '日常决策',
      timeMonths: 1,
      title: '年末总结',
      description: '今年即将结束，回顾一下这一年的收获，为明年做好规划。',
      choices: [
        {
          text: '总结经验，迎接新年',
          resultText: '你静下心来回顾这一年的得失，总结了投资中的教训和经验。新的一年，你将更加成熟。',
          effect: { insight: 1 }
        }
      ]
    }
  }

  return {
    category: '学习提升',
    timeMonths: Math.min(2, remainingMonths),
    title: '投资学习',
    description: '市场上有很多投资课程，你可以选择一个方向深入学习。',
    choices: [
      {
        text: '学习股票投资',
        resultText: '你花了两个月时间系统学习股票投资，从K线图到财务报表分析，收获颇丰。虽然花了些学费，但感觉自己的投资眼光明显提升了。',
        effect: { cash: -5000, skill_stock: 5, insight: 2 }
      },
      {
        text: '学习基金定投',
        resultText: '通过学习，你了解了指数基金、定投策略等知识。原来投资不一定要频繁操作，长期持有优质基金也是一种智慧。',
        effect: { cash: -3000, skill_fund: 5, insight: 2 }
      },
      {
        text: '暂时不学习',
        resultText: '你决定先观望，把时间花在其他事情上。',
        effect: {}
      }
    ]
  }
}
