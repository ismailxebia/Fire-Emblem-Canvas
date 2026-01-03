// js/effects/EffectManager.js
import CloudEffect from './clouds.js';
import RainEffect from './rain.js';

export default class EffectManager {
  constructor(stageWidth, stageHeight, effectsConfig) {
    this.effects = [];
    if (effectsConfig.clouds) {
      this.effects.push(new CloudEffect(stageWidth, stageHeight));
    }
    if (effectsConfig.rain) {
      this.effects.push(new RainEffect(stageWidth, stageHeight, effectsConfig.rainCount || 500));
    }
  }

  update(deltaTime, camera) {
    this.effects.forEach(effect => effect.update(deltaTime, camera));
  }

  render(ctx, camera) {
    this.effects.forEach(effect => effect.render(ctx, camera));
  }

  destroy() {
    this.effects.forEach(effect => {
      if (effect.destroy) effect.destroy();
    });
    this.effects = [];
  }
}
