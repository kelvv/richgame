/**
 * 主游戏场景
 */
import Phaser from 'phaser'
import { Player } from '../game/Player.js'
import { ATTRIBUTES } from '../data/stages.js'
import { getEventsForStage, getRandomEvent, checkRequirement } from '../data/events.js'

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' })
  }

  init(data) {
    this.loadSave = data?.loadSave || false
  }

  create() {
    const { width, height } = this.cameras.main

    // 初始化玩家
    this.player = new Player()
    if (this.loadSave) {
      this.player.load()
    }

    // 背景
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e)

    // 创建UI
    this.createStatusBar()
    this.createMainArea()
    this.createActionButtons()

    // 如果是新游戏，显示出生信息
    if (!this.loadSave) {
      this.showBirthInfo()
    } else {
      this.updateUI()
      this.showNextEvent()
    }
  }

  createStatusBar() {
    const { width } = this.cameras.main
    const barY = 30

    // 年龄显示
    this.ageText = this.add.text(20, barY, '', {
      fontSize: '24px',
      fontFamily: 'PingFang SC',
      color: '#FFD700',
      fontStyle: 'bold'
    })

    // 阶段显示
    this.stageText = this.add.text(20, barY + 35, '', {
      fontSize: '16px',
      fontFamily: 'PingFang SC',
      color: '#aaaaaa'
    })

    // 属性条
    this.statBars = {}
    const startX = width - 180
    let y = 20

    for (const [key, attr] of Object.entries(ATTRIBUTES)) {
      // 图标和名称
      this.add.text(startX, y, `${attr.icon} ${attr.name}`, {
        fontSize: '14px',
        fontFamily: 'PingFang SC',
        color: '#ffffff'
      })

      // 数值
      this.statBars[key] = {
        text: this.add.text(startX + 100, y, '', {
          fontSize: '14px',
          fontFamily: 'PingFang SC',
          color: '#' + attr.color.toString(16).padStart(6, '0')
        }),
        bar: key !== 'wealth' ? this.add.rectangle(startX + 50, y + 20, 100, 8, attr.color, 1).setOrigin(0, 0.5) : null,
        barBg: key !== 'wealth' ? this.add.rectangle(startX + 50, y + 20, 100, 8, 0x333333, 1).setOrigin(0, 0.5) : null
      }

      if (this.statBars[key].barBg) {
        this.statBars[key].barBg.setDepth(0)
        this.statBars[key].bar.setDepth(1)
      }

      y += key === 'wealth' ? 30 : 40
    }
  }

  createMainArea() {
    const { width, height } = this.cameras.main

    // 事件卡片区域
    this.eventCard = this.add.container(width / 2, height * 0.4)

    // 卡片背景
    this.cardBg = this.add.rectangle(0, 0, width - 60, 200, 0x2a2a4a, 1)
      .setStrokeStyle(2, 0x4ECDC4)
    this.eventCard.add(this.cardBg)

    // 事件标题
    this.eventTitle = this.add.text(0, -70, '', {
      fontSize: '24px',
      fontFamily: 'PingFang SC',
      color: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    this.eventCard.add(this.eventTitle)

    // 事件描述
    this.eventDesc = this.add.text(0, -20, '', {
      fontSize: '16px',
      fontFamily: 'PingFang SC',
      color: '#ffffff',
      wordWrap: { width: width - 100 },
      align: 'center'
    }).setOrigin(0.5)
    this.eventCard.add(this.eventDesc)

    // 选项容器
    this.choicesContainer = this.add.container(width / 2, height * 0.68)
  }

  createActionButtons() {
    const { width, height } = this.cameras.main

    // 下一年按钮（隐藏，事件选择后显示）
    this.nextYearBtn = this.createButton(width / 2, height * 0.9, '下一年 →', () => {
      this.nextYear()
    })
    this.nextYearBtn.setVisible(false)
  }

  showBirthInfo() {
    const family = this.player.family

    this.eventTitle.setText('呱呱坠地')
    this.eventDesc.setText(`你出生在一个${family.name}\n初始财产: ¥${family.wealthBonus.toLocaleString()}`)

    this.updateUI()

    // 显示下一年按钮
    this.nextYearBtn.setVisible(true)
  }

  updateUI() {
    // 更新年龄
    this.ageText.setText(`${this.player.age} 岁`)

    // 更新阶段
    const stage = this.player.getCurrentStage()
    this.stageText.setText(stage.name)

    // 更新属性
    for (const [key, data] of Object.entries(this.statBars)) {
      const value = this.player.stats[key]
      const attr = ATTRIBUTES[key]

      if (key === 'wealth') {
        data.text.setText(this.formatMoney(value))
      } else {
        data.text.setText(`${value}`)
        // 更新进度条
        const percent = value / attr.max
        data.bar.setScale(percent, 1)
      }
    }

    // 自动保存
    this.player.save()
  }

  formatMoney(value) {
    if (value >= 100000000) {
      return `¥${(value / 100000000).toFixed(1)}亿`
    } else if (value >= 10000) {
      return `¥${(value / 10000).toFixed(1)}万`
    } else {
      return `¥${value.toLocaleString()}`
    }
  }

  nextYear() {
    // 隐藏按钮
    this.nextYearBtn.setVisible(false)

    // 增加年龄
    const alive = this.player.ageUp()

    if (!alive) {
      this.gameOver()
      return
    }

    this.updateUI()
    this.showNextEvent()
  }

  showNextEvent() {
    // 清除之前的选项
    this.choicesContainer.removeAll(true)

    // 先检查随机事件
    let event = getRandomEvent()

    // 如果没有随机事件，从当前阶段获取
    if (!event) {
      const stage = this.player.getCurrentStage()
      const events = getEventsForStage(stage.id)

      // 过滤掉已触发的一次性事件
      const availableEvents = events.filter(e => {
        if (e.once && this.player.hasTriggeredEvent(e.id)) {
          return false
        }
        return true
      })

      if (availableEvents.length > 0) {
        event = availableEvents[Math.floor(Math.random() * availableEvents.length)]
      }
    }

    if (!event) {
      // 没有事件，直接跳到下一年
      this.eventTitle.setText('平静的一年')
      this.eventDesc.setText('这一年没什么特别的事发生...')
      this.nextYearBtn.setVisible(true)
      return
    }

    // 标记一次性事件
    if (event.once) {
      this.player.markEventTriggered(event.id)
    }

    // 显示事件
    this.eventTitle.setText(event.title)
    this.eventDesc.setText(event.description)

    // 如果有选项，显示选项
    if (event.choices && event.choices.length > 0) {
      this.showChoices(event)
    } else {
      // 无选项事件，直接应用效果
      if (event.effect) {
        this.player.applyEffect(event.effect)
        this.player.logEvent(event, null)
        this.updateUI()
        this.showEffectAnimation(event.effect)
      }
      this.nextYearBtn.setVisible(true)
    }
  }

  showChoices(event) {
    const { width } = this.cameras.main
    const btnWidth = width - 80
    const btnHeight = 45
    const spacing = 55

    const startY = -(event.choices.length - 1) * spacing / 2

    event.choices.forEach((choice, index) => {
      const y = startY + index * spacing

      // 检查是否满足条件
      const available = checkRequirement(choice, this.player.stats)

      const btn = this.add.container(0, y)

      // 按钮背景
      const bg = this.add.rectangle(0, 0, btnWidth, btnHeight, available ? 0x3a3a5a : 0x2a2a3a, 1)
        .setStrokeStyle(1, available ? 0x4ECDC4 : 0x444444)

      if (available) {
        bg.setInteractive({ useHandCursor: true })
      }

      // 按钮文字
      let displayText = choice.text
      if (!available && choice.requirement) {
        const req = Object.entries(choice.requirement)[0]
        displayText += ` (需要${ATTRIBUTES[req[0]]?.name || req[0]} ${req[1]})`
      }

      const text = this.add.text(0, 0, displayText, {
        fontSize: '16px',
        fontFamily: 'PingFang SC',
        color: available ? '#ffffff' : '#666666'
      }).setOrigin(0.5)

      btn.add([bg, text])
      this.choicesContainer.add(btn)

      if (available) {
        bg.on('pointerover', () => bg.setFillStyle(0x4a4a6a))
        bg.on('pointerout', () => bg.setFillStyle(0x3a3a5a))
        bg.on('pointerdown', () => this.selectChoice(event, choice))
      }
    })
  }

  selectChoice(event, choice) {
    // 应用效果
    this.player.applyEffect(choice.effect)
    this.player.logEvent(event, choice)

    // 清除选项
    this.choicesContainer.removeAll(true)

    // 显示效果动画
    this.showEffectAnimation(choice.effect)

    // 更新UI
    this.updateUI()

    // 显示下一年按钮
    this.nextYearBtn.setVisible(true)
  }

  showEffectAnimation(effect) {
    if (!effect) return

    const { width, height } = this.cameras.main
    let y = height * 0.55

    for (const [stat, value] of Object.entries(effect)) {
      if (value === 0) continue

      const attr = ATTRIBUTES[stat]
      const color = value > 0 ? '#4ECDC4' : '#FF6B6B'
      const sign = value > 0 ? '+' : ''
      const displayValue = stat === 'wealth' ? this.formatMoney(Math.abs(value)) : value

      const text = this.add.text(width / 2, y, `${attr.icon} ${attr.name} ${sign}${stat === 'wealth' ? (value > 0 ? '+' : '-') + displayValue.replace('¥', '') : displayValue}`, {
        fontSize: '18px',
        fontFamily: 'PingFang SC',
        color: color,
        fontStyle: 'bold'
      }).setOrigin(0.5)

      // 动画效果
      this.tweens.add({
        targets: text,
        y: y - 30,
        alpha: 0,
        duration: 1500,
        ease: 'Power2',
        onComplete: () => text.destroy()
      })

      y += 25
    }
  }

  gameOver() {
    // 显示结局
    this.scene.start('EndScene', { player: this.player })
  }

  createButton(x, y, text, callback) {
    const btn = this.add.container(x, y)

    const bg = this.add.rectangle(0, 0, 150, 45, 0x4ECDC4, 1)
      .setInteractive({ useHandCursor: true })

    const label = this.add.text(0, 0, text, {
      fontSize: '18px',
      fontFamily: 'PingFang SC',
      color: '#ffffff'
    }).setOrigin(0.5)

    btn.add([bg, label])

    bg.on('pointerover', () => bg.setFillStyle(0x45B7AA))
    bg.on('pointerout', () => bg.setFillStyle(0x4ECDC4))
    bg.on('pointerdown', callback)

    return btn
  }
}
