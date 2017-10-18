import $ = require('jquery');
import THREE = require('three');
import {Stage} from "./render";
import {ResourceManager} from "./resources";

let stage;

document.body.onload = () => {

    let resources = new ResourceManager();
    resources.loadResources().then(() => {
        stage = new Stage(resources);
        stage.init();
        stage.start();
    });

    $('#resetButton').click(() => {
        stage.resetGame();
    });
};