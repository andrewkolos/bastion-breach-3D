// Used to help separate update logic from render time.
// e.g. If the update function is meant to be called 60 times a second, but may not due to varying framerate etc,
// use update = createTickWrapper(60, update) and then call update() every tick as before
export function createTickWrapper(ticksPerSecond: number, update: () => void): () => void {
    let lastTime: number = null;
    const ticksPerMS = ticksPerSecond / 1000;

    return () => {
        let time = performance.now();
        if(lastTime != null) {
            let elapsed = time - lastTime;
            if(elapsed > 500) {
                elapsed = 500;
                lastTime = time;
            }
            let ticks = Math.floor(elapsed * ticksPerMS);

            for(let t = 0; t < ticks; t++) {
                update();
            }
            lastTime = lastTime + Math.ceil(ticks/ticksPerMS);
        } else
            lastTime = time;
    };
}