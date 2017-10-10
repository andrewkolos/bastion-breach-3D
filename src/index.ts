import $ = require('jquery');
import THREE = require('three');
import {Stage} from "./render";


document.body.onload = () => {
    let stage = new Stage();
    setTimeout(() => stage.start(), 1000); // should find a way to not have to do this
};