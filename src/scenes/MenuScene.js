/**
 * 主菜单场景
 */
import Phaser from 'phaser'
import { Player } from '../game/Player.js'

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' })
  }

  create() {
    const { width, height } = this.cameras.main

    // 背景
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e)

    // 标题
    this.add.text(width / 2, height * 0.25, '人生模拟器', {
      fontSize: '48px',
      fontFamily: 'PingFang SC, Microsoft YaHei',
      color: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.35, '从出生到老年的人生旅程', {
      fontSize: '18px',
      fontFamily: 'PingFang SC, Microsoft YaHei',
      color: '#aaaaaa'
    }).setOrigin(0.5)

    // 开始新游戏按钮
    this.createButton(width / 2, height * 0.5, '开始新人生', () => {
      Player.clearSave()
      this.scene.start('GameScene')
    })

    // 继续游戏按钮（如果有存档）
    if (Player.hasSave()) {
      this.createButton(width / 2, height * 0.6, '继续人生', () => {
        this.scene.start('GameScene', { loadSave: true })
      })
    }

    // 版本信息
    this.add.text(width / 2, height * 0.9, 'v1.0.0 by kelvv', {
      fontSize: '14px',
      fontFamily: 'PingFang SC',
      color: '#666666'
    }).setOrigin(0.5)
  }

  createButton(x, y, text, callback) {
    const btn = this.add.container(x, y)

    const bg = this.add.rectangle(0, 0, 200, 50, 0x4ECDC4, 1)
      .setInteractive({ useHandCursor: true })

    const label = this.add.text(0, 0, text, {
      fontSize: '20px',
      fontFamily: 'PingFang SC, Microsoft YaHei',
      color: '#ffffff'
    }).setOrigin(0.5)

    btn.add([bg, label])

    bg.on('pointerover', () => {
      bg.setFillStyle(0x45B7AA)
    })

    bg.on('pointerout', () => {
      bg.setFillStyle(0x4ECDC4)
    })

    bg.on('pointerdown', callback)

    return btn
  }
}
