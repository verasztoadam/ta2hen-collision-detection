import React from 'react';

export default class Scene extends React.Component {
    constructor(props) {
        super(props);
        this.containerRef = React.createRef();
        this.canvasRef = React.createRef();
        this.dimensionRef = React.createRef();
    }

    componentDidMount() {
        this.dimensionRef.current = this.containerRef.current.getBoundingClientRect();
        this.props.renderer.init(
            this.canvasRef.current,
            this.dimensionRef.current.width,
            this.dimensionRef.current.height
        );

        window.addEventListener('resize', this.onWindowResize);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.onWindowResize);
    }

    onWindowResize = () => {
        var dimension = this.containerRef.current.getBoundingClientRect();
        if (this.dimensionRef.current.height != dimension.height ||
            this.dimensionRef.current.width != dimension.width) {
            this.dimensionRef.current = dimension;
            this.props.renderer.onWindowResize(dimension.width, dimension.height);
        }
    };

    render() {
        return (
            <div  {...this.props} ref={this.containerRef}>
                <canvas ref={this.canvasRef} />
            </div>
        );
    }
}