uniform vec3 glowColor;
varying float intensity;
varying vec2 vUv;
uniform float offsetY;
uniform float uTime;
uniform vec3 teColor;
void main(){
    vec2 uv = vUv;
    uv.y += offsetY;

    vec3 glow = glowColor * intensity;
    vec3 color = vec3(step(0.1, uv.y) - step(0.2, uv.y)) - teColor;

    float alpha = clamp(cos(uTime* 3.0) , 0.1, 1.0);

    gl_FragColor = vec4( glow + color, alpha);

}