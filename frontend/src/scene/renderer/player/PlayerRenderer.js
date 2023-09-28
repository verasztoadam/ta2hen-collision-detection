import * as THREE from 'three';
import SceneRenderer from '../../SceneRenderer';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Controller from '../../../player/Controller';

export default class PlayerSceneRenderer extends SceneRenderer {
    constructor(data) {
        super();
        this.data = data;
    }

    init(canvasRef, width, height) {
        super.init(canvasRef, width, height);

        // Init scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xCCCCCC);

        // Add controller
        this.controller = new Controller(this.data.length - 1,
            (timestamp) => { return this.onFrameRequest(timestamp) },
            (frameId) => { return 0 }
        );

        // Add camera with orbit controls
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.z = 5;
        this.controls = new OrbitControls(this.camera, canvasRef);

        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xE0E0E0);
        this.scene.add(ambientLight);

        // Directional ligth
        const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 5);
        directionalLight.position.set(0, 100, 0);
        this.scene.add(directionalLight);

        // Plane
        const geometry = new THREE.PlaneGeometry(100, 100);
        const material = new THREE.MeshBasicMaterial({ color: 0x999999, side: THREE.DoubleSide });
        const plane = new THREE.Mesh(geometry, material);
        plane.rotateX(Math.PI / -2);
        this.scene.add(plane);

        // Grid helper
        const gridHelper = new THREE.GridHelper();
        this.scene.add(gridHelper);

        // Sphere
        const geometrySphere = new THREE.SphereGeometry(0.5);
        const materialSphere = new THREE.MeshBasicMaterial({ color: 0x0000ff });
        this.sphere = new THREE.Mesh(geometrySphere, materialSphere);
        this.scene.add(this.sphere);

        // Start rendering
        this.update();
    }

    onWindowResize(width, height) {
        super.onWindowResize(width, height);

        // Refresh camera aspect ratio
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    update() {
        this.sphere.position.set(this.data[this.controller.currentFrame].content.objects[0].x, 0, this.data[this.controller.currentFrame].content.objects[0].y);
        this.renderer.render(this.scene, this.camera);
        this.controls.update();
        requestAnimationFrame(this.update.bind(this));
    }

    reset() {
        this.controller.reset();
    }

    onFrameRequest(timestamp) {
        var current = this.controller.currentFrame;
        for (; current < this.data.length; ++current) {
            if (this.data[current].timestamp * 1000 > timestamp) {
                return Math.max(0, current - 1);
            }
        }
        return current - 1;
    }
}