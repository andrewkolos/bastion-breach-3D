import $ = require('jquery');
import THREE = require('three');
import 'jquery-ui/ui/widgets/slider'
import {Stage} from "./render";
import {ResourceManager} from "./resources";

let stage;
declare let noUiSlider: any;
declare let TWEEN: any;

document.body.onload = () => {

    let playButton = $('#clickToPlay');
    let resources = new ResourceManager();
    resources.loadResources().then(() => {
        playButton.addClass('whiteBorder');
        playButton.html('Play');
        playButton.css('cursor', 'pointer');


        playButton.on('click', () => {
            let modal = $('#modal');
            stage.playing = true;
            let opacity = {value: 1};
            new TWEEN.Tween(opacity).to({value: 0}, 500)
                .easing(TWEEN.Easing.Cubic.Out)
                .onUpdate(function () {
                    modal.css('opacity', opacity.value);
                })
                .onComplete(function () {
                    modal.css('display', 'none');
                }).start();
        });
        stage = new Stage(resources);
        stage.setVolume(0.5);
        stage.init();
        stage.start();
    });

    $('#resetButton').click(() => {
        stage.resetGame();
        TWEEN.update(10000);
        $('#score').html("Player: 0 &nbsp;Computer: 0");
        $('#message').css('opacity', '0');
    });

    noUiSlider.create($('#volumeSlider')[0], {
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
    $('#volume').html('50');
    (<any>$('#volumeSlider')[0]).noUiSlider.on('update', function (values, handle) {
        if (stage)
            stage.setVolume(values[0] / 100);
        $('#volume').html('' + Math.round(values[0]));
    });

};