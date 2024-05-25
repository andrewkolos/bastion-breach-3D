import { EventEmitter } from '@akolos/event-emitter';
import { ResourceLoader } from '../../client/resources/resource-loader';
import { Game } from '../../game';
import { Renderer } from './renderer';
import { SuitAssignments } from './suit-assignments';

export interface RendererLoaderEvents {
  progressed: (progress: number, status: string) => void;
  completed: () => void;
}


export class RendererLoader {

  private static instance: Renderer;

  private static ee = new EventEmitter<RendererLoaderEvents>();
  private static emit = RendererLoader.ee.makeDelegate('emit', RendererLoader);
  public static readonly on = RendererLoader.ee.makeDelegate('on', RendererLoader.ee.asProtected());
  public static readonly off = RendererLoader.ee.makeDelegate('off', RendererLoader.ee.asProtected());

  public static async load(game: Game, suitAssignments: SuitAssignments): Promise<Renderer> {
    if (this.instance) return this.instance;

    ResourceLoader.on('loadingFile', (url, itemsLoaded, totalItems) => {
      const progress = itemsLoaded / totalItems;
      RendererLoader.emit('progressed', progress, `Loading file: ${url}`);
    });
    ResourceLoader.on('completed', () => {
      RendererLoader.emit('progressed', 1, 'Done!');
      RendererLoader.emit('completed');
    });

    const resources = await ResourceLoader.load();
    return new Renderer(resources, game, suitAssignments);
  }

}
