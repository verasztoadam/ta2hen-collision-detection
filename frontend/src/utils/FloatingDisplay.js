import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

export default class FloatingDisplay extends THREE.Group {
    BORDER_RADIUS = 0.3;
    FONT_HEIGHT = 0.01;
    PADDING = 0.5;
    constructor(font, message, size = 1) {
        super();
        this.fontsize = size;

        // Text
        const textGeometry = new TextGeometry(message, {
            size: this.fontsize,
            height: this.FONT_HEIGHT,
            font: font
        });

        textGeometry.computeBoundingBox();
        var width = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x + this.PADDING * 2;
        var height = textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y + this.PADDING * 2;

        this.text = new THREE.Mesh(textGeometry, new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide }));
        this.text.position.copy(new THREE.Vector3(this.PADDING - width / 2, height - this.PADDING - this.fontsize, this.FONT_HEIGHT / 2));
        this.add(this.text);

        // Background
        const bgShape = new THREE.Shape()
            .moveTo(0, this.BORDER_RADIUS)
            .lineTo(0, height - this.BORDER_RADIUS)
            .quadraticCurveTo(0, height, this.BORDER_RADIUS, height)
            .lineTo(width - this.BORDER_RADIUS, height)
            .quadraticCurveTo(width, height, width, height - this.BORDER_RADIUS)
            .lineTo(width, this.BORDER_RADIUS)
            .quadraticCurveTo(width, 0, width - this.BORDER_RADIUS, 0)
            .lineTo(this.BORDER_RADIUS, 0)
            .quadraticCurveTo(0, 0, 0, this.BORDER_RADIUS)

        const bgGeometry = new THREE.ShapeGeometry(bgShape);
        this.bg = new THREE.Mesh(bgGeometry, new THREE.MeshBasicMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide }));
        this.bg.position.copy(new THREE.Vector3(- width / 2, 0, 0));
        this.add(this.bg);

        const bgEdgesGeometry = new THREE.EdgesGeometry(bgGeometry);
        this.bgBorder = new THREE.LineSegments(bgEdgesGeometry, new THREE.LineBasicMaterial({ color: 0x000000 }));
        this.bgBorder.position.copy(new THREE.Vector3(- width / 2, 0, 0));
        this.add(this.bgBorder);
    }
}