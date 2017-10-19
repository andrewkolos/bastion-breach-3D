import $ = require('jquery');
import THREE = require('three');
import 'jquery-ui/ui/widgets/slider'
import {Stage} from "./render";
import {ResourceManager} from "./resources";

let stage;

declare let noUiSlider: any;

document.body.onload = () => {

    let resources = new ResourceManager();
    resources.loadResources().then(() => {
        stage = new Stage(resources);
        stage.setVolume(0.5);
        stage.init();
        stage.start();
    });

    $('#resetButton').click(() => {
        stage.resetGame();
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
    (<any>$('#volumeSlider')[0]).noUiSlider.on('update', function(values, handle) {
        if (stage)
            stage.setVolume(values[0] / 100);
        $('#volume').html('' + Math.round(values[0]));
    });

};