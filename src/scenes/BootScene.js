/**
 * 启动场景 - 加载资源
 */
import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload() {
    // 显示加载进度
    const width = this.cameras.main.width
    const height = this.cameras.main.height

    const progressBar = this.add.graphics()
    const progressBox = this.add.graphics()
    progressBox.fillStyle(0x222222, 0.8)
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50)

    const loadingText = this.add.text(width / 2, height / 2 - 50, '加载中...', {
      font: '20px PingFang SC',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5)

    this.load.on('progress', (value) => {
      progressBar.clear()
      progressBar.fillStyle(0x4ECDC4, 1)
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30)
    })

    this.load.on('complete', () => {
      progressBar.destroy()
      progressBox.destroy()
      loadingText.destroy()
    })

    // 这里可以加载图片资源
    // this.load.image('background', 'assets/bg.png')
  }

  create() {
    // 进入主菜单
    this.scene.start('MenuScene')
  }
}
