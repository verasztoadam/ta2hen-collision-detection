import { GUI } from 'dat.gui'

class Controller {
    controlOptions = {
        start: () => { this.startTimer() },
        stop: () => { this.stopTimer() },
        nextFrame: () => { this.changeFrame(this.frameIndexController.getValue() + 1) },
        previousFrame: () => { this.changeFrame(this.frameIndexController.getValue() - 1) },
        frameIndex: 0,
        timestamp: "0.0 (s)"
    }

    constructor(frameCount, onFrameRequest, onTimestampRequest) {
        this.requestFrame = onFrameRequest;
        this.requestTimestamp = onTimestampRequest;
        this.timer = null;
        this.frameCount = frameCount;
        this.timerStart = 0;
        this.timestampStart = 0;

        // Add gui
        this.gui = new GUI();
        this.gui.domElement.id = 'controllerGui';
        this.gui.add(this.controlOptions, "start").name("Start");
        this.gui.add(this.controlOptions, "stop").name("Stop");
        this.gui.add(this.controlOptions, "nextFrame").name("Next frame");
        this.gui.add(this.controlOptions, "previousFrame").name("Previous frame");

        this.frameIndexController = this.gui.add(this.controlOptions, "frameIndex", 0, frameCount - 1, 1)
            .name("Frame index").onFinishChange(this.changeFrame.bind(this));

        this.timestampController = this.gui.add(this.controlOptions, "timestamp").name("Timestamp");
        this.timestampController.domElement.id = "timestampController";
    }

    setCurrentFrame(frame) {
        this.frameIndexController.setValue(frame);
    }

    startTimer() {
        if (this.timer) clearInterval(this.timer);
        this.timerStart = Date.now();
        this.timestampStart = this.requestTimestamp(this.frameIndexController.getValue());
        this.timer = setInterval(() => { this.setCurrentFrame(this.requestFrame(Date.now() - this.timerStart + this.timestampStart)) }, 10);
    }

    stopTimer() {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
    }

    changeFrame(frame) {
        if (frame < this.frameCount && frame >= 0 && this.frameIndexController.getValue() != frame) {
            if (this.timer) {
                this.stopTimer();
                this.setCurrentFrame(frame);
                this.startTimer();
            }
            else {
                this.setCurrentFrame(frame);
            }
        }
    }

    reset() {
        this.gui.destroy();
        this.stopTimer();
    }
}

export default Controller