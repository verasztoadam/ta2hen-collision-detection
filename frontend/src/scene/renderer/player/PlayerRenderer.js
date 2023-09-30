import * as THREE from 'three';
import SceneRenderer from '../../SceneRenderer';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Controller from '../../../player/Controller';
import FloatingDisplay from '../../../utils/FloatingDisplay';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import Arrow from '../../../utils/Arrow';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export default class PlayerSceneRenderer extends SceneRenderer {
    TRAJECTORY_LOOKUP_TIME = 5;
    TRAJECTORY_TH_DIST = 1.5;

    constructor(data) {
        super();
        this.data = data;
    }

    init(canvasRef, width, height) {
        super.init(canvasRef, width, height);

        // Init scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xDDDDDD);

        // Add controller
        this.controller = new Controller(this.data.length - 1,
            (timestamp) => { return this.onFrameRequest(timestamp); },
            (frameId) => { return this.data[frameId].timestamp * 1000; }
        );

        const gridHelper = new THREE.GridHelper(500, 500);
        this.scene.add(gridHelper);

        // Add camera with orbit controls
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
        this.camera.position.y = 15;
        this.camera.position.z = 15;
        this.camera.position.x = -15;
        this.controls = new OrbitControls(this.camera, canvasRef);
        this.controls.maxPolarAngle = Math.PI / 2 - 0.01;
        this.controls.maxDistance = 40;

        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xE0E0E0);
        this.scene.add(ambientLight);

        // Directional ligth
        const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 5);
        directionalLight.position.set(0, 100, 0);
        this.scene.add(directionalLight);

        // Plane
        const geometry = new THREE.PlaneGeometry(500, 500);
        const material = new THREE.MeshBasicMaterial({ color: 0x999999, side: THREE.DoubleSide });
        const plane = new THREE.Mesh(geometry, material);
        plane.rotateX(Math.PI / -2);
        this.scene.add(plane);

        // Sphere
        const geometrySphere = new THREE.SphereGeometry(1);
        const materialSphere = new THREE.MeshPhongMaterial({ color: 0x0000ff });
        this.sphere = new THREE.Mesh(geometrySphere, materialSphere);

        this.spheres = [
            this.sphere,
            this.sphere.clone(),
            this.sphere.clone(),
            this.sphere.clone()
        ]
        this.scene.add(this.spheres[0]);
        this.scene.add(this.spheres[1]);
        this.scene.add(this.spheres[2]);
        this.scene.add(this.spheres[3]);

        this.displays = []

        // Car
        this.loadCar();
        this.carArrow = new Arrow([
            new THREE.Vector3(2, 0.3, 0),
            new THREE.Vector3(4, 0.3, 0.01),
        ], 0, 0x10A000)
        this.scene.add(this.carArrow);

        const loader = new FontLoader();
        loader.load('/fonts/helvetiker_regular.typeface.json', (font) => {
            if (!this.font) {
                // Save font before rendering
                this.font = font;

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
        const currentData = this.data[this.controller.currentFrame];
        const objects = currentData.content.objects;
        this.dangers = [null, null, null, null]

        this.removeDisplays();

        for (var i = 0; i < this.spheres.length; i++) {
            this.spheres[i].position.set(
                objects[i].dx,
                1,
                objects[i].dy,
            );

            var visible = (objects[i].dx !== 0 || objects[i].dy !== 0 || objects[i].vx !== 0 || objects[i].vy !== 0);
            this.spheres[i].visible = visible;
        }

        this.generateSpeed(currentData);

        this.carArrow.visible = currentData.content.v_car > 0;

        // Car display
        const display = new FloatingDisplay(this.font, "v: " + currentData.content.v_car.toFixed(2) + " m/s");
        display.position.set(0, 3, 0);
        display.lookAt(this.camera.position);
        this.displays.push(display);
        this.scene.add(display);

        // Car trajectory
        const radius = currentData.content.v_car / currentData.content.yaw_car;
        if (currentData.content.v_car > 0.01 && Math.abs(radius) < 50) {
            const curve = new THREE.QuadraticBezierCurve3(
                new THREE.Vector3(0, 0.1, 0),
                new THREE.Vector3(Math.abs(radius), 0.1, 0),
                new THREE.Vector3(Math.abs(radius), 0.1, radius)
            );
            const carTrajectoryArrow = new Arrow(curve.getSpacedPoints(100)
                .slice(0, Math.max(2, Math.min(99, this.TRAJECTORY_LOOKUP_TIME * currentData.content.v_car / curve.getLength() * 100)))
                , 0, 0xb00000)
            this.scene.add(carTrajectoryArrow);
            this.displays.push(carTrajectoryArrow);
        }
        else if (currentData.content.v_car > 0.01) {
            const carTrajectoryArrow = new Arrow([
                new THREE.Vector3(0.01, 0.1, 0),
                new THREE.Vector3(this.TRAJECTORY_LOOKUP_TIME * currentData.content.v_car, 0.1, 0.01),
            ], 0, 0xb00000)
            this.scene.add(carTrajectoryArrow);
            this.displays.push(carTrajectoryArrow);
        }

        this.controller.setTimestamDisplay(currentData.timestamp);

        for (var i = 0; i < this.spheres.length; i++) {
            var visible = (objects[i].dx !== 0 || objects[i].dy !== 0 || objects[i].vx !== 0 || objects[i].vy !== 0);
            if (visible) {
                // Object display
                const display = new FloatingDisplay(this.font, (this.dangers[i] ? "Scenario: " + this.dangers[i] + "\n" : "")
                    + "dx: " + objects[i].dx.toFixed(2) + " m\ndy: " + objects[i].dy.toFixed(2) +
                    " m \nv: " + objects[i].speed + " m/s", 1, this.dangers[i]);
                display.position.set(objects[i].dx, 2.5, objects[i].dy);
                display.lookAt(this.camera.position);

                this.displays.push(display);
                this.scene.add(display);
            }
        }

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

    removeDisplays() {
        for (var i = 0; i < this.displays.length; i++) {
            this.displays[i].dispose();
            this.scene.remove(this.displays[i]);
        }
        this.displays = []
    }

    loadCar() {
        const loader = new GLTFLoader();
        loader.load(
            '/model/suzuki_swift/scene.gltf',
            (gltf) => {
                gltf.scene.rotateY(Math.PI / 2);
                gltf.scene.scale.set(0.5, 0.5, 0.5);
                gltf.scene.translateX(-0.9);
                gltf.scene.translateZ(1.8);
                this.scene.add(gltf.scene);
            },
            function (xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function (error) {
                console.log(error);
            }
        );
    }

    generateSpeed(frame) {
        const content = frame.content;
        const objects = frame.content.objects;
        for (var i = 0; i < objects.length; i++) {
            var visible = (objects[i].dx !== 0 || objects[i].dy !== 0 || objects[i].vx !== 0 || objects[i].vy !== 0);
            if (visible) {
                var object_vx = content.v_car + objects[i].vx - content.yaw_car * objects[i].dy;
                var object_vy = objects[i].vy + content.yaw_car * objects[i].dx;
                objects[i].speed = Math.sqrt(object_vx * object_vx + object_vy * object_vy).toFixed(2);

                if (objects[i].speed > 0.03) {
                    const uni = new THREE.Vector3(object_vx / objects[i].speed, 0, object_vy / objects[i].speed);
                    const arrow = new Arrow([
                        new THREE.Vector3().copy(this.spheres[i].position).add(new THREE.Vector3().copy(uni).multiplyScalar(1.05).setY(0.3)),
                        new THREE.Vector3().copy(this.spheres[i].position).add(new THREE.Vector3().copy(uni).multiplyScalar(2.75).setY(0.3)),
                    ], 0, 0x10A000)
                    this.scene.add(arrow);
                    this.displays.push(arrow);

                    const trajectoryArrow = new Arrow([
                        new THREE.Vector3().copy(this.spheres[i].position).setY(0.1),
                        new THREE.Vector3().copy(this.spheres[i].position).add(new THREE.Vector3().copy(uni).multiplyScalar(this.TRAJECTORY_LOOKUP_TIME * objects[i].speed)).setY(0.1),
                    ], 0, 0xb00000)
                    this.scene.add(trajectoryArrow);
                    this.displays.push(trajectoryArrow);

                    // Calculate intersection
                    const radius = content.v_car / content.yaw_car;
                    if (content.v_car > 0.01 && Math.abs(radius) < 50) {
                        for (var step = 0.005; step < this.TRAJECTORY_LOOKUP_TIME; step += 0.005) {
                            var carPos = new THREE.Vector3(
                                Math.abs(radius) * Math.sin(step * Math.abs(content.yaw_car)),
                                this.spheres[i].position.y,
                                radius * (1 - Math.cos(step * content.yaw_car)));

                            var objPos = new THREE.Vector3().copy(this.spheres[i].position).add(new THREE.Vector3().copy(uni).multiplyScalar(step * objects[i].speed));
                            if (carPos.distanceTo(objPos) < this.TRAJECTORY_TH_DIST) {
                                this.dangers[i] = ["CPTA"];
                                break;
                            }
                        }
                    }
                    else if (content.v_car > 0.01) {
                        for (var step = 0.005; step < this.TRAJECTORY_LOOKUP_TIME; step += 0.005) {
                            var carPos = new THREE.Vector3(step * content.v_car, 0, 0).setY(this.spheres[i].position.y);
                            var objPos = new THREE.Vector3().copy(this.spheres[i].position).add(new THREE.Vector3().copy(uni).multiplyScalar(step * objects[i].speed));
                            if (carPos.distanceTo(objPos) < this.TRAJECTORY_TH_DIST) {
                                var angle = Math.abs(uni.angleTo(new THREE.Vector3(1, 0, 0)));
                                if (angle > Math.PI) {
                                    angle = 2 * Math.PI - angle;
                                }
                                if ((angle < Math.PI / 4) && Math.abs(objects[i].dy) < 5) {
                                    this.dangers[i] = "CPLA";
                                }
                                else if ((angle >= Math.PI / 4) && (angle <= Math.PI * 3 / 4)) {
                                    this.dangers[i] = "CPNCO";
                                }
                                break;
                            }
                        }
                    }
                }
            }
        }
    }
}