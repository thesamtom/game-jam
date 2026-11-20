import Phaser from 'phaser';

const malayalam = /[\u0D00-\u0D7F]/g;
let hasMalayalam = false;

// Phaser's default text factory does not inherit the document's CSS.
function applyPhaserFont(fontFamily: string) {
  const factory = Phaser.GameObjects.GameObjectFactory.prototype;
  const addText = factory.text;
  factory.text = function (x, y, text, style) {
    return addText.call(this, x, y, text, { fontFamily, ...style });
  };
  const creator = Phaser.GameObjects.GameObjectCreator.prototype;
  const makeText = creator.text;
  creator.text = function (config, addToScene) {
    return makeText.call(this, { ...config, style: { fontFamily, ...config?.style } }, addToScene);
  };
}

export async function loadTypography() {
  const [pixelta, fallback] = await Promise.allSettled([
    document.fonts.load('16px Pixelta', 'Randu Chaaran'),
    document.fonts.load('16px "Randu Malayalam"', 'മലയാളം')
  ]);
  if (pixelta.status !== 'fulfilled' || !pixelta.value.length) {
    console.warn('Pixelta did not load. Check public/assets/fonts/Pixelta.ttf.');
  }
  hasMalayalam = fallback.status === 'fulfilled' && fallback.value.length > 0;
  applyPhaserFont(getComputedStyle(document.documentElement).getPropertyValue('--game-font').trim());
}

export function supportedWorldText(text: string) {
  if (hasMalayalam) return text;
  return text.replace(malayalam, '').replace(/^\s*\/\s*/, '').trim();
}
