import { InheritableEventEmitter } from '@akolos/event-emitter';
import { Easings, Tween } from '@akolos/ts-tween';
import noUiSlider from 'nouislider';

interface UiEvents {
  playButtonClicked: [],
  rulesButtonClicked: [],
  resetButtonClicked: [],
  volumeChanged: [value: number],
}

export class Ui extends InheritableEventEmitter<UiEvents> {
  private readonly rulesDialog = el('modal');
  private readonly playButton = el('clickToPlay');
  private readonly resetButton = el('resetButton');
  private readonly showRulesButton = el('showRules');
  private readonly scoreBoard = el('score');
  private readonly resultsToast = el('message');
  private readonly volumeSlider = el('volumeSlider');
  private readonly volumeValueDisplay = el('volume');

  private isPlayButtonActive = false;

  private constructor() {
    super();

    this.resetButton.addEventListener('click', () => this.emit('resetButtonClicked'));
    this.showRulesButton.addEventListener('click', () => {
      show(this.rulesDialog);
      this.emit('rulesButtonClicked');
    });
    this.playButton.addEventListener('click', () => {
      if (this.isPlayButtonActive) {
        hide(this.rulesDialog);
        this.emit('playButtonClicked');
      }
    });

    const slider = noUiSlider.create(this.volumeSlider, {
      start: [100],
      connect: [true, false],
      orientation: 'horizontal',
      behaviour: 'tap-drag',
      step: 1,
      tooltips: false,
      range: {
        min: 0,
        max: 100,
      },
    });
    this.volumeValueDisplay.textContent = '100';
    slider.on('update', (values: number[]) => {
      this.emit('volumeChanged', values[0] / 100);
      this.volumeValueDisplay.textContent = String(Math.round(values[0]));
    });
  }

  public static init(): Ui {
    return new Ui();
  }

  public enablePlaybutton() {
    this.playButton.classList.add('whiteBorder');
    this.playButton.innerHTML = 'Play';
    this.playButton.style.cursor = 'pointer';
    this.isPlayButtonActive = true;
  }

  public showRulesDialog() {
    show(this.rulesDialog);
  };

  public showResultsToast(p1Score: number, cpuScore: number) {
    const winnerPart = p1Score > cpuScore ? 'You win!' :
      cpuScore > p1Score ? 'Computer wins.' :
        'Draw.';

    this.resultsToast.textContent = `${winnerPart} ${p1Score} — ${cpuScore}`;
    show(this.resultsToast, 0.9);
  }

  public updateScore(p1: number, p2: number) {
    this.scoreBoard.innerHTML = `Player1: ${p1} — Computer: ${p2}`;
  }

  public hideResultsToast() {
    hide(this.resultsToast);
  }
  
  public isRulesDialogShowing() {
    return parseFloat(this.rulesDialog.style.opacity) > 0;
  }

}

function show(el: HTMLElement, opacity: number = 1.0) {
  const current = getOpacity(el);
  el.style.display = '';
  tweenOpacity(el, current, opacity);
}

function hide(el: HTMLElement) {
  const current = getOpacity(el);
  tweenOpacity(el, current, 0).on('completed', () => el.style.display = 'none');

} 

function getOpacity(el: HTMLElement) {
  const v = el.style.opacity;
  return v === '' ? 1.0 : parseFloat(v);
}

function tweenOpacity(el: HTMLElement, from: number, to: number) {
  return Tween.start(from, to, { easing: Easings.outQuad, length: 500})
    .on('updated', ({ value }, source) => {
      el.style.opacity = String(value);
      console.log(source);
    });
}

function el(id: string): HTMLElement | never {
  const el = document.getElementById(id);
  if (el == null) {
    throw Error(`Unable to find element with id: ${id}`);
  }
  return el;
}
