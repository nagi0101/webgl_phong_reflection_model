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
        this.events = {};
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
          this.emitEvent('resize');
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

    listenEvent = (name, callback) => {
        this.events[name] = callback;
    }

    clearEvent = (name) => {
        delete this.events[name];
    }

    emitEvent = (name) => {
        const handler = this.events[name];
        handler && handler();
    }

}

const {vec3} = glMatrix;

class Sphere {
    constructor(center = vec3.create(), radius = 0.5, color = vec3.create(), ambient = 0.0, diffuse = 0.0, specular = 0.0, specularAlpha = 100){
        this.center = center;
        this.radius = radius;
        this.color = color;
        this.ambient = ambient;
        this.diffuse = diffuse;
        this.specular = specular;
        this.specularAlpha = specularAlpha;
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

    setAmbient = (ambient) => {
        this.ambient = ambient;
    }
    
    getAmbient = () => {
        return this.ambient;
    }

    setDiffuse = (diffuse) => {
        this.diffuse = diffuse;
    }
    
    getDiffuse = () => {
        return this.diffuse;
    }

    setSpecular = (specular) => {
        this.specular = specular;
    }
    
    getSpecular = () => {
        return this.specular;
    }

    setSpecularAlpha = (specularAlpha) => {
        this.specularAlpha = specularAlpha;
    }
    
    getSpecularAlpha = () => {
        return this.specularAlpha;
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
    float ambient;
    float diffuse;
    float specular;
    float specularAlpha;
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
    vec3 eyePos = vec3(0, 0, 2);
    ray.start = vec3(screenLoc, 0);
    ray.dir = normalize(ray.start - eyePos);

    float deter = getDeter(ray);
    float d = -dot(ray.dir, ray.start - u_sphere.center) - sqrt(deter);

    if (deter >= 0.0 && d >= 0.0) {
        Hit hit;
        hit.d = d;
        hit.point = ray.start + d * ray.dir;
        hit.normal = normalize(hit.point - u_sphere.center);

        
        vec3 ambient = u_sphere.ambient * u_light.color;

        vec3 dirToLight = normalize(u_light.center - hit.point);
        vec3 diffuse = max(dot(dirToLight, hit.normal), 0.0) * u_sphere.diffuse * u_light.color;

        vec3 specReflectDir = 2.0 * dot(hit.normal, dirToLight) * hit.normal - dirToLight;
        vec3 specular = pow(max(dot(-ray.dir, specReflectDir), 0.0), u_sphere.specularAlpha) * u_sphere.specular * u_light.color;
        
        
        vec3 pixelColor = (ambient + diffuse + specular) * u_sphere.color;

        outColor = vec4(pixelColor, 1);
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

sphere.setCenter(vec3.fromValues(0, 0, -1));
sphere.setColor(vec3.fromValues(0.5, 0.5, 0.5));
sphere.setRadius(0.5);
sphere.setAmbient(0.1);
sphere.setDiffuse(1.0);
sphere.setSpecular(1);
sphere.setSpecularAlpha(5);


const light = new Light();

light.setCenter(vec3.fromValues(-0.5, 1, 0.5));
light.setColor(vec3.fromValues(1.0, 1.0, 1.0));

const updateFunction = (deltatime) => {
    renderer.setUniform("u_sphere.center", [sphere.getCenter()[0], sphere.getCenter()[1], sphere.getCenter()[2]]);
    renderer.setUniform("u_sphere.color", [sphere.getColor()[0], sphere.getColor()[1], sphere.getColor()[2]]);
    renderer.setUniform("u_sphere.radius", [sphere.getRadius()]);
    renderer.setUniform("u_sphere.ambient", [sphere.getAmbient()]);
    renderer.setUniform("u_sphere.diffuse", [sphere.getDiffuse()]);
    renderer.setUniform("u_sphere.specular", [sphere.getSpecular()]);
    renderer.setUniform("u_sphere.specularAlpha", [sphere.getSpecularAlpha()]);

    renderer.setUniform("u_light.center", [light.getCenter()[0], light.getCenter()[1], light.getCenter()[2]]);
    renderer.setUniform("u_light.color", [light.getColor()[0], light.getColor()[1], light.getColor()[2]]);
    renderer.setUniform("u_aspect", [renderer.getAspectRatio()]);
}
renderer.setUpdateFunction(updateFunction);

renderer.start();




function createSlider(name, min, max, initialValue, callback){
    const uiContainer = document.querySelector("#ui");
    
    const sliderContainer = document.createElement('div');
    sliderContainer.style.display = "flex";
    sliderContainer.id = name;
    
    const nametag = document.createElement('p');
    nametag.innerText = name;
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min;
    slider.max = max;
    slider.step = 0.01;
    slider.value = initialValue;
    slider.oninput = (e) => {
        const value = e.target.value
        const valuetag = e.target.nextElementSibling;
        valuetag.innerText = value.toString().substring(0, 4);
        callback(value);
    }
    
    const value = document.createElement('p');
    value.innerText = slider.value;

    
    sliderContainer.appendChild(nametag);
    sliderContainer.appendChild(slider);
    sliderContainer.appendChild(value);
    uiContainer.appendChild(sliderContainer);
    
    return sliderContainer;
}

const xSlider = createSlider("sphere.x", -2.0, 2.0, sphere.getCenter()[0], (value)=>{sphere.getCenter()[0] = value;});
createSlider("sphere.y", -1.0, 1.0, sphere.getCenter()[1], (value)=>{sphere.getCenter()[1] = value;});
createSlider("sphere.z", -4.0, 0.0, sphere.getCenter()[2], (value)=>{sphere.getCenter()[2] = value;});

createSlider("sphere.r", 0.0, 1.0, sphere.getColor()[0], (value)=>{sphere.getColor()[0] = value;});
createSlider("sphere.g", 0.0, 1.0, sphere.getColor()[1], (value)=>{sphere.getColor()[1] = value;});
createSlider("sphere.b", 0.0, 1.0, sphere.getColor()[2], (value)=>{sphere.getColor()[2] = value;});

createSlider("sphere.radius", 0.1, 1.0, sphere.getRadius(), (value)=>{sphere.setRadius(value);});
createSlider("sphere.ambient", 0.0, 1.0, sphere.getAmbient(), (value)=>{sphere.setAmbient(value);});
createSlider("sphere.diffuse", 0.0, 1.0, sphere.getDiffuse(), (value)=>{sphere.setDiffuse(value);});
createSlider("sphere.specular", 0.0, 1.0, sphere.getSpecular(), (value)=>{sphere.setSpecular(value);});
createSlider("sphere.specularAlpha", 0.0, 100.0, sphere.getSpecularAlpha(), (value)=>{sphere.setSpecularAlpha(value);});


createSlider("light.x", -2.0, 2.0, light.getCenter()[0], (value)=>{light.getCenter()[0] = value;});
createSlider("light.y", -1.0, 1.0, light.getCenter()[1], (value)=>{light.getCenter()[1] = value;});
createSlider("light.z", -2.0, 2.0, light.getCenter()[2], (value)=>{light.getCenter()[2] = value;});

createSlider("light.r", 0.0, 1.0, light.getColor()[0], (value)=>{light.getColor()[0] = value;});
createSlider("light.g", 0.0, 1.0, light.getColor()[1], (value)=>{light.getColor()[1] = value;});
createSlider("light.b", 0.0, 1.0, light.getColor()[2], (value)=>{light.getColor()[2] = value;});



renderer.listenEvent("resize", ()=>{
    const inputElement = xSlider.querySelector("input");
    const aspect = renderer.getAspectRatio();
    inputElement.min = -aspect;
    inputElement.max = aspect;
});

