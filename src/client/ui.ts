import { InheritableEventEmitter } from '@akolos/event-emitter';
import { Easings, Tween } from '@akolos/ts-tween';
import noUiSlider from 'nouislider';

interface UiEvents {
  playButtonClicked: [],
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

  private readonly tweenFactory = Tween.factory({ easing: Easings.easeOutCubic, length: 500 });

  private constructor() {
    super();

    this.resetButton.addEventListener('click', () => this.emit('resetButtonClicked'));
    this.showRulesButton.addEventListener('click', () => {
      show(this.rulesDialog);
    });
    this.playButton.addEventListener('click', () => {
      if (this.isPlayButtonActive) {
        hide(this.rulesDialog);
        this.playButton.addEventListener('click', () => this.emit('playButtonClicked'));
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
  private isPlayButtonActive = false;

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
    Tween.get(0).to(1).with({ easing: Easings.easeOutCubic, length: 500 })
      .on('updated', ({ value }) => this.rulesDialog.style.opacity = String(value));
  };

  public showResultsToast(p1Score: number, cpuScore: number) {
    const winnerPart = p1Score > cpuScore ? 'You win!' :
      cpuScore > p1Score ? 'Computer wins.' :
        'Draw.';

    this.resultsToast.textContent = `${winnerPart} ${p1Score} — ${cpuScore}`;
    this.tweenFactory<number>(0, 0.9).on('updated', ({ value }) => this.resultsToast.style.opacity = String(value));
  }

  public updateScore(p1: number, p2: number) {
    this.scoreBoard.innerHTML = `Player1: ${p1} — Computer: ${p2}`;
  }

  public hideResultsToast() {
    this.resultsToast.style.opacity = '0';
  }
  
  public isRulesDialogShowing() {
    return parseFloat(this.rulesDialog.style.opacity) > 0;
  }

}

function show(el: HTMLElement, opacity: number = 1.0) {
  const current = parseFloat(el.style.opacity);
  tweenOpacity(el, current, opacity);
}

function hide(el: HTMLElement) {
  const current = parseFloat(el.style.opacity);
  tweenOpacity(el, current, 0);
} 

function tweenOpacity(el: HTMLElement, from: number, to: number) {
  Tween.get(from).to(to).with({ easing: Easings.easeOutQuad, length: 500 })
    .on('updated', ({ value }) => el.style.opacity = String(value));
}

function el(id: string): HTMLElement | never {
  const el = document.getElementById(id);
  if (el == null) {
    throw Error(`Unable to find element with id: ${id}`);
  }
  return el;
}
