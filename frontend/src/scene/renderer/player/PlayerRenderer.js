import * as THREE from 'three';
import SceneRenderer from '../../SceneRenderer';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Controller from '../../../player/Controller';
import FloatingDisplay from '../../../utils/FloatingDisplay';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import Arrow from '../../../utils/Arrow';

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
            (timestamp) => { return this.onFrameRequest(timestamp); },
            (frameId) => { return this.data[frameId].timestamp * 1000; }
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

        const loader = new FontLoader();
        loader.load('/fonts/helvetiker_regular.typeface.json', (font) => {
            if (!this.font) {
                // Save font before rendering
                this.font = font;

                // Display
                this.fd = new FloatingDisplay(this.font, "Test message");
                this.scene.add(this.fd);

                // Start rendering
                this.update();
            }
        });
    }

    onWindowResize(width, height) {
        super.onWindowResize(width, height);

        // Refresh camera aspect ratio
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    update() {
        this.fd.lookAt(this.camera.position)

        this.sphere.position.set(this.data[this.controller.currentFrame].content.objects[0].x, 0, this.data[this.controller.currentFrame].content.objects[0].y);
        this.fd.position.set(this.data[this.controller.currentFrame].content.objects[0].x, 1, this.data[this.controller.currentFrame].content.objects[0].y);
        this.controller.setTimestamDisplay(this.data[this.controller.currentFrame].timestamp);

        // Arrow
        if (this.arrow) {
            this.scene.remove(this.arrow);
        }
        this.arrow = new Arrow([
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(this.data[this.controller.currentFrame].content.objects[0].x, 1, this.data[this.controller.currentFrame].content.objects[0].y),
        ], 15, 0x000000);
        this.scene.add(this.arrow);

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