import { Stage } from "./render";
import { ResourceManager } from "./resources";
import noUiSlider from 'nouislider';
import TWEEN from '@tweenjs/tween.js';
import 'nouislider/distribute/nouislider.css';

let stage;

const el = document.getElementById.bind(document);

document.body.onload = () => {

    let modal = el('modal');
    let playButton = el('clickToPlay');
    let resources = new ResourceManager();
    let playButtonActive = true;

    resources.loadResources().then(() => {
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
                let opacity = { value: 1 };
                new TWEEN.Tween(opacity).to({ value: 0 }, 500)
                    .easing(TWEEN.Easing.Cubic.Out)
                    .onUpdate(function () {
                        modal.style.opacity = String(opacity.value);
                    })
                    .onComplete(function () {
                        modal.style.display = 'none';
                    }).start();
                playButtonActive = false;
            }
        });
    });

    el('resetButton').addEventListener('click', () => {
        stage.resetGame();
        $('#score').html("Player: 0 &nbsp; Computer: 0");
        $('#message').css('opacity', '0');
    });

    el('showRules').addEventListener('click', () => {
        stage.playing = false;
        let opacity = { value: 0 };
        modal.style.display = 'block';
        new TWEEN.Tween(opacity).to({ value: 1 }, 500)
            .easing(TWEEN.Easing.Cubic.Out)
            .onUpdate(function () {
                modal.style.opacity = String(opacity.value);
            }).start();
        playButtonActive = true;
    });

    const volumeSliderElement = el('volumeSlider');
    const volumeNumberElement = el('volume');
    noUiSlider.create(volumeSliderElement, {
        start: [50],
        connect: [true, false],
        orientation: 'horizontal',
        behavior: 'tap-drag',
        step: 5,
        tooltips: false,
        range: {
            'min': 0,
            'max': 100
        }
    });
    volumeNumberElement.textContent = '50';
    (volumeSliderElement as any).noUiSlider.on('update', function (values, _handle) {
        if (stage)
            stage.setVolume(values[0] / 100);
        volumeNumberElement.textContent = '' + Math.round(values[0]);
    });

};