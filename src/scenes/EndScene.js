/**
 * 结局场景
 */
import Phaser from 'phaser'
import { Player } from '../game/Player.js'
import { ATTRIBUTES } from '../data/stages.js'

export class EndScene extends Phaser.Scene {
  constructor() {
    super({ key: 'EndScene' })
  }

  init(data) {
    this.player = data.player
  }

  create() {
    const { width, height } = this.cameras.main

    // 背景
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e)

    // 获取评价
    const evaluation = this.player.getLifeEvaluation()
    const score = this.player.calculateLifeScore()

    // 标题
    this.add.text(width / 2, 50, '人生落幕', {
      fontSize: '36px',
      fontFamily: 'PingFang SC',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    // 享年
    this.add.text(width / 2, 100, `享年 ${this.player.age} 岁`, {
      fontSize: '24px',
      fontFamily: 'PingFang SC',
      color: '#aaaaaa'
    }).setOrigin(0.5)

    // 评价卡片
    const cardY = 200
    this.add.rectangle(width / 2, cardY, width - 60, 120, 0x2a2a4a, 1)
      .setStrokeStyle(2, evaluation.color)

    this.add.text(width / 2, cardY - 30, evaluation.title, {
      fontSize: '28px',
      fontFamily: 'PingFang SC',
      color: '#' + evaluation.color.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    }).setOrigin(0.5)

    this.add.text(width / 2, cardY + 15, evaluation.description, {
      fontSize: '16px',
      fontFamily: 'PingFang SC',
      color: '#ffffff'
    }).setOrigin(0.5)

    this.add.text(width / 2, cardY + 45, `人生评分: ${score}`, {
      fontSize: '20px',
      fontFamily: 'PingFang SC',
      color: '#FFD700'
    }).setOrigin(0.5)

    // 最终属性
    const statsY = 310
    this.add.text(width / 2, statsY, '最终属性', {
      fontSize: '20px',
      fontFamily: 'PingFang SC',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    let y = statsY + 40
    for (const [key, attr] of Object.entries(ATTRIBUTES)) {
      const value = this.player.stats[key]
      const displayValue = key === 'wealth' ? this.formatMoney(value) : value

      this.add.text(width / 2, y, `${attr.icon} ${attr.name}: ${displayValue}`, {
        fontSize: '16px',
        fontFamily: 'PingFang SC',
        color: '#' + attr.color.toString(16).padStart(6, '0')
      }).setOrigin(0.5)

      y += 30
    }

    // 家庭背景
    this.add.text(width / 2, y + 20, `出身: ${this.player.family.name}`, {
      fontSize: '14px',
      fontFamily: 'PingFang SC',
      color: '#888888'
    }).setOrigin(0.5)

    // 人生大事记（显示最后几条）
    const logY = y + 70
    this.add.text(width / 2, logY, '人生大事记', {
      fontSize: '18px',
      fontFamily: 'PingFang SC',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const recentLogs = this.player.lifeLog.slice(-5)
    let logStartY = logY + 30
    recentLogs.forEach(log => {
      this.add.text(width / 2, logStartY, `${log.age}岁 - ${log.event}: ${log.choice}`, {
        fontSize: '14px',
        fontFamily: 'PingFang SC',
        color: '#aaaaaa'
      }).setOrigin(0.5)
      logStartY += 25
    })

    // 按钮
    this.createButton(width / 2, height - 60, '重新开始', () => {
      Player.clearSave()
      this.scene.start('MenuScene')
    })
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
