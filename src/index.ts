import { Stage } from './render';
import { Resources } from './resources';
import noUiSlider from 'nouislider';
import TWEEN from '@tweenjs/tween.js';
import 'nouislider/distribute/nouislider.css';

let stage: Stage;

document.body.onload = () => {
  const modal = getElementByIdOrThrow('modal');
  const playButton = getElementByIdOrThrow('clickToPlay');

  let playButtonActive = true;

  Resources.load().then((resources) => {
    playButton.classList.add('whiteBorder');
    playButton.innerHTML = 'Play';
    playButton.style.cursor = 'pointer';

    stage = new Stage(resources);
    stage.setVolume(0.5);
    stage.init();
    stage.start();

    playButton.addEventListener('click', () => {
      if (playButtonActive) {
        stage.playing = true;
        const opacity = { value: 1 };
        new TWEEN.Tween(opacity)
          .to({ value: 0 }, 500)
          .easing(TWEEN.Easing.Cubic.Out)
          .onUpdate(function () {
            modal.style.opacity = String(opacity.value);
          })
          .onComplete(function () {
            modal.style.display = 'none';
          })
          .start();
        playButtonActive = false;
      }
    });
  });

  getElementByIdOrThrow('resetButton').addEventListener('click', () => {
    stage.resetGame();
    getElementByIdOrThrow('score').innerHTML = 'Player: 0 &nbsp; Computer: 0';
    getElementByIdOrThrow('message').style.opacity = '0';
  });

  getElementByIdOrThrow('showRules').addEventListener('click', () => {
    stage.playing = false;
    const opacity = { value: 0 };
    modal.style.display = 'block';
    new TWEEN.Tween(opacity)
      .to({ value: 1 }, 500)
      .easing(TWEEN.Easing.Cubic.Out)
      .onUpdate(function () {
        modal.style.opacity = String(opacity.value);
      })
      .start();
    playButtonActive = true;
  });

  const volumeSliderElement = getElementByIdOrThrow('volumeSlider');
  const volumeNumberElement = getElementByIdOrThrow('volume');
  noUiSlider.create(volumeSliderElement, {
    start: [50],
    connect: [true, false],
    orientation: 'horizontal',
    behaviour: 'tap-drag',
    step: 5,
    tooltips: false,
    range: {
      min: 0,
      max: 100,
    },
  });
  volumeNumberElement.textContent = '50';
  (volumeSliderElement as any).noUiSlider.on('update', function (values: [number]) {
    stage.setVolume(values[0] / 100);
    volumeNumberElement.textContent = '' + Math.round(values[0]);
  });
};

function getElementByIdOrThrow(id: string): HTMLElement | never {
  const el = document.getElementById(id);
  if (el == null) {
    throw Error(`Unable to find element with id: ${id}`);
  }
  return el;
}
