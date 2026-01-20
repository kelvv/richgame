/**
 * 人生模拟器 - 主入口
 */
import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene.js'
import { MenuScene } from './scenes/MenuScene.js'
import { GameScene } from './scenes/GameScene.js'
import { EndScene } from './scenes/EndScene.js'

// 游戏配置
const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 400,
  height: 700,
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  dom: {
    createContainer: true
  },
  scene: [BootScene, MenuScene, GameScene, EndScene]
}

// 启动游戏
const game = new Phaser.Game(config)
