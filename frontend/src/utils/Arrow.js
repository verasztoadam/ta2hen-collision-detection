import * as THREE from 'three';

export default class Arrow extends THREE.Group {
    STEPS = 100;
    WIDTH = 0.25;
    HEIGHT = 0.025;

    constructor(points, level, color) {
        super();

        this.points = points;
        this.material = new THREE.MeshLambertMaterial({ color: color, wireframe: false, side: THREE.DoubleSide });
        this.level = level;

        this.createLine();
        this.createTriangle();
    }

    createLine() {
        const shape = new THREE.Shape([
            new THREE.Vector2(this.HEIGHT / 2, -this.WIDTH / 2),
            new THREE.Vector2(this.HEIGHT / 2, this.WIDTH / 2),
            new THREE.Vector2(-this.HEIGHT / 2, this.WIDTH / 2),
            new THREE.Vector2(-this.HEIGHT / 2, -this.WIDTH / 2)
        ]);

        const geometry = new THREE.ExtrudeGeometry(shape, {
            steps: this.STEPS,
            extrudePath: new THREE.CatmullRomCurve3(this.points)
        });

        this.lineMesh = new THREE.Mesh(geometry, this.material);
        this.lineMesh.translateY(0.01 * this.level)
        this.add(this.lineMesh);
    }

    createTriangle() {
        // Calculate the direction vector between the one before the last and the last points
        const directionVector = new THREE.Vector3().subVectors(this.points[this.points.length - 1], this.points[this.points.length - 2]);

        // Create a triangle shape as a half 2x2 square
        const triangleShape = new THREE.Shape()
            .moveTo(-this.WIDTH, -this.WIDTH)
            .lineTo(-this.WIDTH, this.WIDTH)
            .lineTo(this.WIDTH, 0)
            .lineTo(-this.WIDTH, -this.WIDTH); // Close path

        const geometry = new THREE.ExtrudeGeometry(triangleShape, {
            steps: this.STEPS,
            bevelEnabled: false,
            depth: this.HEIGHT
        });

        // Calculate the rotation angle to align the triangle with the direction vector
        const rotationAngle = Math.atan2(directionVector.z, directionVector.x);
        geometry.rotateX(Math.PI / 2);
        geometry.rotateY(-rotationAngle);

        this.triangleMesh = new THREE.Mesh(geometry, this.material);

        // Position the triangle based on the last arrow point
        this.triangleMesh.position.copy(this.points[this.points.length - 1]);
        this.triangleMesh.translateY(0.01 * this.level + this.HEIGHT / 2);
        this.add(this.triangleMesh);
    }

    dispose() {
        this.lineMesh.geometry.dispose();
        this.lineMesh.material.dispose();
        this.triangleMesh.geometry.dispose();
        this.triangleMesh.material.dispose();
    }
}