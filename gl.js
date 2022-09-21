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
        }
       
        return needResize;
    }
    
    getAspectRatio = () => {
        const context = this.getRenderingContext();
        const canvas = context.canvas;

        const displayWidth  = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;
       
        return displayWidth / displayHeight;
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


const renderer = new Renderer();
renderer.init();
renderer.setVertexShader(`#version 300 es

in vec4 a_position;

out vec2 uv;

void main() {
    gl_Position = a_position;
    uv = a_position.xy;
}
`);
renderer.setFragmentShader(`#version 300 es

precision highp float;

out vec4 outColor;

in vec2 uv;

uniform float u_aspect;

struct Sphere {
    vec3 center;
    vec3 color;
    float radius;
};
uniform Sphere u_sphere;

struct Light {
    vec3 center;
    vec3 color;
};
uniform Light u_light;

struct Ray {
    vec3 start;
    vec3 dir;
};

struct Hit {
    vec3 point;
    vec3 normal;
    float d;
};

float getDeter(Ray ray) {
    vec3 centerToStart = ray.start - u_sphere.center;
    float deter = dot(ray.dir, centerToStart);
    deter *= deter;
    deter -= (dot(centerToStart, centerToStart) - u_sphere.radius * u_sphere.radius);

    return(deter);
}

void main() {
    vec2 screenLoc = vec2(uv.x * u_aspect, uv.y);

    Ray ray;
    ray.start = vec3(screenLoc, 0);
    ray.dir = vec3(0, 0, -1);

    float deter = getDeter(ray);
    float d = -dot(ray.dir, ray.start - u_sphere.center) - sqrt(deter);

    if (deter >= 0.0 && d >= 0.0) {
        Hit hit;
        hit.d = d;
        hit.point = ray.start + d * ray.dir;
        hit.normal = normalize(hit.point - u_sphere.center);

        outColor = vec4(-hit.point.z, -hit.point.z, -hit.point.z, 1);
    }
    else {
        outColor = vec4(0, 0, 0, 1);
    }
}
`);
renderer.compile();

renderer.setAttribute(
    "a_position",
    [
        -1, 1,
        1, 1,
        1, -1,
        -1, -1,
    ],
    {
        size: 2,
    }
);
renderer.setRenderOption({
    offset: 0,
    count: 4,
})


const sphere = new Sphere();

vec3.set(sphere.getCenter(), 0, 0, -1);
vec3.set(sphere.getColor(), 0.5, 0.5, 0.5);
sphere.setRadius(0.5);


const light = new Light();

vec3.set(light.getCenter(), 0, 1, -1);
vec3.set(light.getColor(), 1.0, 1.0, 1.0);

const updateFunction = (deltatime) => {
    renderer.setUniform("u_sphere.center", [sphere.getCenter()[0], sphere.getCenter()[1], sphere.getCenter()[2]]);
    renderer.setUniform("u_sphere.color", [sphere.getColor()[0], sphere.getColor()[1], sphere.getColor()[2]]);
    renderer.setUniform("u_sphere.radius", [sphere.getRadius()]);

    renderer.setUniform("u_light.center", [light.getCenter()[0], light.getCenter()[1], light.getCenter()[2]]);
    renderer.setUniform("u_light.color", [light.getColor()[0], light.getColor()[1], light.getColor()[2]]);
    renderer.setUniform("u_aspect", [renderer.getAspectRatio()]);
}
renderer.setUpdateFunction(updateFunction);

renderer.start();


