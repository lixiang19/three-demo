const container = document.querySelector(".container");
const popupWrapper = document.querySelector(".popup-wrapper");
const canvasEl = document.querySelector("#canvas");
const openBtns = Array.from(document.querySelectorAll(".open-btn"));
const closeBtn = document.querySelector("#close-btn");
const popupEl = document.querySelector(".popup");

let renderer, scene, camera, clock, material;
initScene();

popupEl.style.visibility = "visible";

closeBtn.addEventListener("click", onModalClose);
popupWrapper.addEventListener("click", (e) => {
    if (e.target.classList.contains("popup-wrapper")) {
        onModalClose();
    }
});
openBtns.forEach(b => {
    b.addEventListener("click", openPopup);
});


// call at start for codepen preview
gsap.delayedCall(.85, onModalClose);




function onModalClose() {
    popupWrapper.style.pointerEvents = "none";
    domtoimage.toPng(popupEl)
        .then(data => {
            const img = new Image();
            img.src = data;
            burnElement(new THREE.Texture(img));
            closePopup();
        })
        .catch(error => {
            console.error("oops, something went wrong!", error);
        });
}

function burnElement(texture) {
    texture.needsUpdate = true;

    material.uniforms.u_texture.value = texture;
    material.uniforms.u_time.value = 0;
    material.uniforms.u_ratio.value = popupEl.clientWidth / popupEl.clientHeight;
    material.uniforms.u_size.value = Math.max(popupEl.clientWidth, popupEl.clientHeight)

    renderer.setSize(popupEl.clientWidth, popupEl.clientHeight);

    const sourceRect = popupEl.getBoundingClientRect();
    canvasEl.style.position = "fixed";
    canvasEl.style.top = sourceRect.top + "px";
    canvasEl.style.left = sourceRect.left + "px";

    render();
}

function openPopup() {
    popupWrapper.style.display = "flex";
    gsap.to(popupWrapper, {
        duration: .2,
        background: "rgba(0, 0, 0, .2)",
        ease: "power1.out",
        onComplete: () => {
            popupEl.style.visibility = "visible";
        }
    })

}

function closePopup() {
    popupEl.style.visibility = "hidden";
    gsap.to(popupWrapper, {
        duration: .55,
        background: "rgba(0, 0, 0, 0)",
        ease: "power1.out",
        onComplete: () => {
            popupWrapper.style.display = "none";
            renderer.setSize(0, 0);
            popupWrapper.style.pointerEvents = "auto";
        }
    })
}


function initScene() {
    renderer = new THREE.WebGLRenderer({
        alpha: true,
        canvas: canvasEl
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-.5, .5, .5, -.5, 1, 1);
    clock = new THREE.Clock()

    material = new THREE.ShaderMaterial({
        uniforms: {
            u_time: {type: "f", value: 0},
            u_ratio: {type: "f", value: 0},
            u_size: {type: "f", value: 0},
            u_texture: {type: "t", value: null}
        },
        vertexShader: document.getElementById("vertexShader").textContent,
        fragmentShader: document.getElementById("fragmentShader").textContent,
		  transparent: true
    });
    const planeGeometry = new THREE.PlaneGeometry(2, 2);
    scene.add(new THREE.Mesh(planeGeometry, material));
}

function render() {
    material.uniforms.u_time.value += clock.getDelta();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
}
<div class="container">

<h1>Burning HTML elements with WebGL</h1>

<div class="intro">

    <p>Selected DOM element (let's say pop-up <code>&lt;div&gt;</code>) is getting burned ‍🔥 within GLSL shader.</p>
    <button class="open-btn btn">open popup again</button>

    <p>
        Let me quickly explain how it works. To understand the code, you'll need at least a basic understanding of JS, Three.js, and GLSL.
        When the user presses the button, we do the following:
    </p>
    <ul>
        <li>Turn the pop-up DOM element into a texture</li>
        <li>Create Three.js plane, let it render custom shader code, and position it exactly over the DOM element</li>
        <li>Hide the original <code>&lt;div&gt;</code>, passing the texture and other data to Three.js</li>
        <li>Render a custom GLSL shader on the Three.js plane</li>
        <li>Animate mask and some overlaying colors while processing the texture with GLSL shader</li>
    </ul>
</div>

<div class="tutorial">
    Now, let's break it down.

    <h2>Turning the selected <code>&lt;div&gt;</code> into a texture</h2>
    <p>
        We can't apply WebGL effect directly to the DOM element. Only data can be passed to the shader.
        Luckily, texture is data, so we convert the element into a texture, and then transform this static image.
    </p>
    <p>
        Taking a "screenshot" of a DOM element isn't something that can be achieved with native JS methods, but there are many libraries available.
        I've tried <a href="https://github.com/niklasvh/html2canvas">html2canvas</a> and <a href="https://github.com/tsayen/dom-to-image" target="_blank">dom-to-image</a> (I ended up with the second one).
        Both libraries worked fine for a simple pop-up window, but you may face issues with complex DOM objects and unsupported CSS.
        This is because these libs do lots of stuff to get the image: they recursively clone the DOM element, apply all the styles, embed objects, and render the result to canvas.
        Things can get wrong, you know.
    </p>
    <h2>Creating Three.js scene to render the shader</h2>
    <p>
        As for enviroment to run the shader, Three.js is not the only way.
        But it's easy and I'm just used to it.
    </p>
    <p>
        I create a new <code>THREE.Scene</code>, the <code>THREE.OrthographicCamera</code>, and the <code>THREE.Plane</code> that takes the whole scene space.
        To match the Three.js <code>&lt;canvas&gt;</code> to the original HTML element, we:
    </p>
    <ul>
        <li>Set the <code>&lt;canvas&gt;</code> size with JS method <code>renderer.setSize</code></li>
        <li>Position the <code>&lt;canvas&gt;</code> on the screen by copying CSS properties from the pop-up <code>&lt;div&gt;</code> bounding box.</li>
    </ul>
    <p>
        Once this is done, we hide the original pop-up element.
    </p>
    <h2>Passing the texture to the shader</h2>
    <p>
        To tun custom shader on the Three.js plane, we use <code>THREE.ShaderMaterial</code> and create both vertex and fragment shaders.
        Along with the texture, we pass other uniforms there: the time elapsed since the click, area size in pixels, and pop-up ratio.
    </p>
    <h2>The shader magic</h2>
    <p>
        The vertex shader doesn't do anything special; we simply use it to pass the <code>UV</code> coordinates to the fragment shader.
    </p>
    <p>
        The fun stuff begins in the fragment shader. First, we render the texture as it is, then we apply the additional layers to it.
    </p>
    <p>
        For both masking and coloring, we use Fractal Brownian Motion - a noise that's perfectly described in <a href="https://thebookofshaders.com/13/" target="_blank">the Book Of Shaders</a>.
        With FBM, we calculate a <code>noise_mask</code> (ensuring the noise frequency is kinda consistent for different canvas sizes).
        The <code>noise_mask</code> is further adjusted by an <code>edges_mask</code>, which makes the fire start on the edges of the images.
    </p>
    <p>
        We pass <code>noise_mask</code> to the <code>smoothstep</code> function.
        With <code>smoothstep</code> edges changing from 0 to 1, we can go from zero-level masking to full coverage of area.
        Using the same <code>noise_mask</code> with different edge limits, we can calculate the following from time and coordinate:
    </p>
    <ul>
        <li>The output alpha channel</li>
        <li>The mixing factor between the original texture color and the block color</li>
        <li>The mixing factor between the original texture color and a yellow/red mixture (this is also done using the noise).</li>
    </ul>
    <p>
        This quick tutorial is only here because the pop-up looks better with some text in the background. If you'd like me to make a proper tutorial or if you have any questions about the code, please reach out on <a href="https://twitter.com/uuuuuulala" target="_blank">Twitter</a>.
    </p>
</div>

<button class="open-btn btn">open popup again</button>


<div class="popup-wrapper">
    <canvas id="canvas"></canvas>
    <div class="popup">
        <label for="fname">First name</label>
        <input type="text" id="fname" name="fname" value="Ksenia">
        <label for="lname">Last name</label>
        <input type="text" id="lname" name="lname" value="Kondrashova">
        <label for="field">What's up</label>
        <input type="text" id="field" name="field" value="" autocomplete="off">
        <button id="close-btn" class="btn">send</button>
    </div>
</div>
</div>

<script type="x-shader/x-fragment" id="fragmentShader">
varying vec2 vUv;
uniform float u_size;
uniform float u_ratio;
uniform float u_time;
uniform sampler2D u_texture;

float random (in vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233)))*43758.5453123);
}
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}
float fbm (in vec2 st) {
    float value = 0.0;
    float amplitude = .5;
    float frequency = 0.;
    for (int i = 0; i < 4; i++) {
        value += amplitude * noise(st);
        st *= 2.;
        amplitude *= .5;
    }
    return value;
}


void main() {
    vec2 uv = vUv;
    uv.y /= u_ratio;

    vec4 base = texture2D(u_texture, vUv);
    float t = pow(3. * u_time, .9);

    float edges_mask = max(.4, pow(length(vUv - vec2(.5)), .5));
    float noise_mask = fbm(vec2(.01 * u_size * uv)) / edges_mask;
    noise_mask -= .06 * length(base.rgb);

    vec3 color = mix(base.rgb, vec3(0.), smoothstep(noise_mask - .15, noise_mask - .1, t));
    vec3 fire_color = fbm(6. * vUv + .1 * t) * vec3(6., 1.4, .0);
    color = mix(color, fire_color, smoothstep(noise_mask - .1, noise_mask - .05, t));
    color -= .3 * fbm(3. * vUv) * pow(t, 4.);

    float opacity = 1. - smoothstep(noise_mask - .01, noise_mask, t);

    gl_FragColor = vec4(color, opacity);
}


</script>

<script type="x-shader/x-vertex" id="vertexShader">
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.);
}
</script>