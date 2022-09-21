class Renderer {
    constructor(){
        this.context = null;
        this.vertexShaderSource = '';
        this.fragmentShaderSource = '';
        this.program = null;
        this.buffers = {};
        this.renderOption = {};
        this.pause = false;
        this.prevTime = 0;
        this.updateFunction = () => {};
    }

    init(){
        const canvas = document.querySelector('#c');
        if(!canvas){
            console.log("No canvas element");
            return;
        }

        this.context = canvas.getContext("webgl2");
        if(!this.getRenderingContext()){
            console.log("WebGL2 not supported");
            return;
        }
    }

    getRenderingContext(){
        return this.context;
    }

    setVertexShader(source){
        this.vertexShaderSource = source;
    } 

    setFragmentShader(source){
        this.fragmentShaderSource = source;
    }

    createShader(type, source){
        const context = this.getRenderingContext();
        const shader = context.createShader(type);
        context.shaderSource(shader, source);
        context.compileShader(shader);
        const success = context.getShaderParameter(shader, context.COMPILE_STATUS);
        if (success) {
          return shader;
        }
        console.log(context.getShaderInfoLog(shader));
        context.deleteShader(shader);
    }

    createProgram(vertexShader, fragmentShader) {
        const context = this.getRenderingContext();
        const program = context.createProgram();
        context.attachShader(program, vertexShader);
        context.attachShader(program, fragmentShader);
        context.linkProgram(program);
        const success = context.getProgramParameter(program, context.LINK_STATUS);
        if (success) {
          return program;
        }
       
        console.log(context.getProgramInfoLog(program));
        context.deleteProgram(program);
      }
      
    compile(){
        const context = this.getRenderingContext();
        const vertexShader = this.createShader(context.VERTEX_SHADER, this.vertexShaderSource);
        const fragmentShader = this.createShader(context.FRAGMENT_SHADER, this.fragmentShaderSource);
        this.program = this.createProgram(vertexShader, fragmentShader);
    }

    getProgram(){
        return this.program;
    }

    setAttribute(name, bufferArray, vertexArrayObject){
        const context = this.getRenderingContext();
        const attributeLocation = context.getAttribLocation(this.getProgram(), name);
        const buffer = context.createBuffer();
        context.bindBuffer(context.ARRAY_BUFFER, buffer);

        context.bufferData(context.ARRAY_BUFFER, new Float32Array(bufferArray), context.STATIC_DRAW);

        const vao = context.createVertexArray();
        context.bindVertexArray(vao)
        context.enableVertexAttribArray(attributeLocation);
        {
            const size = vertexArrayObject.size || 1;
            const type = vertexArrayObject.type || context.FLOAT;
            const normalize = vertexArrayObject.normalize || false;
            const stride = vertexArrayObject.stride || 0;
            const offset = vertexArrayObject.offset || 0;
            context.vertexAttribPointer(
                attributeLocation, size, type, normalize, stride, offset
            );
        }
    }

    setUniform = (name, uniformArray) => {
        const context = this.getRenderingContext();

        context.useProgram(this.program);

        const uniformLocation = context.getUniformLocation(this.getProgram(), name);
        
        const length = uniformArray.length;

        context[`uniform${length}fv`](uniformLocation, uniformArray);
    }


    setRenderOption(optionObject){
        this.renderOption = optionObject;
    }

    getRenderOption(){
        return this.renderOption;
    }

    resizeCanvasToDisplaySize = () => {
        const context = this.getRenderingContext();
        const canvas = context.canvas;

        const displayWidth  = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;
       
        const needResize = canvas.width  !== displayWidth ||
                           canvas.height !== displayHeight;
       
        if (needResize) {
          canvas.width  = displayWidth;
          canvas.height = displayHeight;

          context.viewport(0, 0, displayWidth, displayHeight);
          this.setUniform("u_aspect", [displayWidth / displayHeight]);
        }
       
        return needResize;
      }
      

    render = () => {
        const context = this.getRenderingContext();
        const renderOption = this.getRenderOption();

        this.resizeCanvasToDisplaySize();

        context.clearColor(0, 0, 0, 0);
        context.clear(context.COLOR_BUFFER_BIT);
        context.useProgram(this.program);

        const primitiveType = context.TRIANGLE_FAN;
        const offset = renderOption.offset || 0;
        const count = renderOption.count || 1;
        context.drawArrays(primitiveType, offset, count);
    }
    update = (deltatime) => {
        this.updateFunction(deltatime);
    }
    setUpdateFunction = (func) => {
        this.updateFunction = func;
    } 
    tick = (ms) => {
        const second = ms / 1000.0;
        const deltatime = second - this.prevTime;
        this.prevTime = second;
        
        this.update(deltatime);
        this.render();
        if (!this.pause) {
            window.requestAnimationFrame(this.tick);
        }
    }

    start(){
        this.pause = false;
        window.requestAnimationFrame(this.tick);
    }

    stop(){
        this.pause = true;
    }
}

const {vec3} = glMatrix;

class Sphere {
    constructor(center = vec3.create(), radius = 0.5, color = vec3.create()){
        this.center = center;
        this.radius = radius;
        this.color = color;
    }

    setCenter = (center) => {
        this.center = center;
    }

    getCenter = () => {
        return this.center;
    } 

    setRadius = (radius) => {
        this.radius = radius;
    }
    
    getRadius = () => {
        return this.radius;
    }

    setColor = (color) => {
        this.color = color;
    }
    
    getColor = () => {
        return this.color;
    }
}

class Light {
    constructor(center = vec3.create(), color = vec3.create()){
        this.center = center;
        this.color = color;
    }

    setCenter = (center) => {
        this.center = center;
    }

    getCenter = () => {
        return this.center;
    } 

    setColor = (color) => {
        this.color = color;
    }
    
    getColor = () => {
        return this.color;
    }
}

