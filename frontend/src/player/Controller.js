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

        this.frameIndexController = this.gui.add(this.controlOptions, "frameIndex", 0, frameCount, 1)
            .name("Frame index").onFinishChange((this.changeFrame.bind(this)));

        this.timestampController = this.gui.add(this.controlOptions, "timestamp").name("Timestamp");
        this.timestampController.domElement.id = "timestampController";
    }

    setCurrentFrame(frame) {
        this.frameIndexController.setValue(frame);
    }

    startTimer() {
        this.setSliderEnabled(false);
        if (this.timer) clearInterval(this.timer);
        this.timerStart = Date.now();
        this.timestampStart = this.requestTimestamp(this.frameIndexController.getValue());
        this.timer = setInterval(() => {
            if (this.timer)
                this.setCurrentFrame(this.requestFrame(Date.now() - this.timerStart + this.timestampStart));
        }, 10);
    }

    stopTimer() {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
        this.setSliderEnabled(true);
    }

    changeFrame(frame) {
        if (frame < this.frameCount && frame >= 0) {
            if (this.timer) {
                this.stopTimer();
                this.setCurrentFrame(frame);
                this.startTimer();
            }
            else {
                this.setCurrentFrame(frame);
                this.timerStart = Date.now();
                this.timestampStart = this.requestTimestamp(this.frameIndexController.getValue());
            }
        }
    }

    setSliderEnabled(value) {
        if (!value) {
            this.frameIndexController.domElement.style.pointerEvents = "none";
            this.frameIndexController.domElement.style.opacity = 0.75;
        }
        else {
            this.frameIndexController.domElement.style.pointerEvents = "auto";
            this.frameIndexController.domElement.style.opacity = 1;
        }
    }

    reset() {
        this.gui.destroy();
        this.stopTimer();
    }

    get currentFrame() {
        return this.frameIndexController.getValue();
    }

    setTimestamDisplay(timestamp) {
        this.timestampController.setValue(timestamp.toFixed(2) + " (s)");
    }
}

export default Controller