import * as $ from "jquery";

export default new class {
    public readonly A = 65;
    public readonly B = 66;
    public readonly C = 67;
    public readonly D = 68;
    public readonly E = 69;
    public readonly F = 70;
    public readonly G = 71;
    public readonly H = 72;
    public readonly I = 73;
    public readonly J = 74;
    public readonly K = 75;
    public readonly L = 76;
    public readonly M = 77;
    public readonly N = 78;
    public readonly O = 79;
    public readonly P = 80;
    public readonly Q = 81;
    public readonly R = 82;
    public readonly S = 83;
    public readonly T = 84;
    public readonly U = 85;
    public readonly V = 86;
    public readonly W = 87;
    public readonly X = 88;
    public readonly Y = 89;
    public readonly Z = 90;

    public readonly LT = 79;
    public readonly GT = 80;

    public readonly SPACE = 32;

    public readonly LEFTARROW = 37;
    public readonly UPARROW = 38;
    public readonly RIGHTARROW = 39;
    public readonly DOWNARROW = 40;

    private _pressed = {};
    private lmbDown = false;
    private rmbDown = false;

    constructor() {
        console.log("initializing keyboard");

        window.addEventListener('keyup', (event) => {
            this.onKeyUp(event.keyCode);
        }, false);
        window.addEventListener('keydown', (event) => {
            this.onKeyDown(event.keyCode);
        }, false);

        $(window).mousedown((event) => {
            switch (event.which) {
                case 1:
                    this.lmbDown = true;
                    break;
                case 2:
                    alert('Middle Mouse button pressed.');
                    break;
                case 3:
                    this.rmbDown = true;
                    break;
                default:
                    alert('You have a strange Mouse!');
            }
        });

        $(window).mouseup((event) => {
            switch (event.which) {
                case 1:
                    this.lmbDown = false;
                    break;
                case 2:
                    alert('Middle Mouse button pressed.');
                    break;
                case 3:
                    this.rmbDown = false;
                    break;
                default:
                    alert('You have a strange Mouse!');
            }
        });

        console.log('keyboard ready');
    }

    private onKeyDown(keyCode: number) {
        this._pressed[keyCode] = true;
    }

    private onKeyUp(keyCode: number) {
        delete this._pressed[keyCode];
    }

    isDown(keyCode: number) {
        return this._pressed[keyCode];
    }

    anyDown(...keyCodes: number[]) {
        for (let i = 0; i < keyCodes.length; i++) {
            if (this._pressed[keyCodes[i]])
                return true;
        }
        return false;
    }

    isLeftMouseDown() {
        return this.lmbDown;
    }

    isRightMouseDown() {
        return this.rmbDown;
    }
};


/*
    window.addEventListener("keydown", function(evt) {
        alert("keydown: " + evt.keyCode);
    }, false);
*/