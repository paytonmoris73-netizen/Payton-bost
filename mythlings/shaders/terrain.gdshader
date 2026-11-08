shader_type spatial;
// Vertex-coloured terrain with cheap world-space detail breakup (mobile friendly).
render_mode diffuse_burley, specular_disabled;

uniform sampler2D detail_noise : hint_default_white, filter_linear_mipmap, repeat_enable;
uniform float detail_scale = 0.11;
uniform float detail_strength = 0.28;

varying vec3 world_pos;

void vertex() {
	world_pos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
}

void fragment() {
	float n = texture(detail_noise, world_pos.xz * detail_scale).r;
	float n2 = texture(detail_noise, world_pos.xz * detail_scale * 0.17 + vec2(0.37)).r;
	vec3 c = COLOR.rgb;
	c *= mix(1.0 - detail_strength, 1.0 + detail_strength * 0.6, n);
	c = mix(c, c * vec3(1.05, 1.08, 0.9), smoothstep(0.45, 0.75, n2) * 0.6);
	ALBEDO = c;
	ROUGHNESS = 0.95;
}
