import * as THREE from 'three';

export default class SceneRenderer {
    init(canvasRef, width, height) {
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvasRef,
            antialias: true
        });
        this.renderer.setSize(width, height);
    }

    onWindowResize(width, height) {
        if (this.renderer)
            this.renderer.setSize(width, height);
    }

    reset() { }
}