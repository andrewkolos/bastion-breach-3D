import $ = require('jquery');
import THREE = require('three');
import {Stage} from "./render";


document.body.onload = () => {
    let stage = new Stage();
    stage.init().then(()=>stage.start());
};