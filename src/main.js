import Phaser from 'phaser';
import './style.css';
import { MapScene } from './scenes/MapScene';
import { LevelScene } from './scenes/LevelScene';
import { GameState } from './state/GameState';
import { Theme } from './config/Theme';

GameState.init();

document.querySelector('#app').innerHTML = `
  <div id="game-container"></div>
`;

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: Theme.colors.hex.sceneBg,
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [MapScene, LevelScene]
};

new Phaser.Game(config);