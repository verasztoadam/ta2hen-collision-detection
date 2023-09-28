import { GUI } from 'dat.gui'

class Controller {
    guiOptions = {
        start: () => { console.log("Start") },
        stop: () => { console.log("Stop") },
        nextFrame: () => { console.log("Next frame") },
        previousFrame: () => { console.log("Previous frame") },
        frameIndex: 0,
        timestamp: "0.0 s"
    }

    constructor(frameCount) {
        // Add gui
        this.gui = new GUI();
        this.gui.domElement.id = 'controllerGui';
        this.gui.add(this.guiOptions, "start").name("Start");
        this.gui.add(this.guiOptions, "stop").name("Stop");
        this.gui.add(this.guiOptions, "nextFrame").name("Next frame");
        this.gui.add(this.guiOptions, "previousFrame").name("Previous frame");

        this.frameIndexController = this.gui.add(this.guiOptions, "frameIndex", 0, frameCount, 1).name("Frame index").onFinishChange((value) => { console.log(value) });

        this.timestampController = this.gui.add(this.guiOptions, "timestamp").name("Timestamp");
        this.timestampController.domElement.id = "timestampController";
    }

    reset() {
        this.gui.destroy();
    }
}

export default Controller