shader_type spatial;
// Flowing lava: dark crust drifting over bright magma.
render_mode unshaded, cull_back;

uniform sampler2D flow_noise : hint_default_white, filter_linear_mipmap, repeat_enable;
uniform vec3 hot : source_color = vec3(1.0, 0.55, 0.12);
uniform vec3 core : source_color = vec3(1.0, 0.9, 0.5);
uniform vec3 crust : source_color = vec3(0.16, 0.08, 0.06);
uniform float speed = 0.06;

varying vec3 world_pos;

void vertex() {
	world_pos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	VERTEX.y += sin(TIME * 0.7 + world_pos.x * 0.3 + world_pos.z * 0.2) * 0.04;
}

void fragment() {
	vec2 uv = vec2(UV.x * 1.2, UV.y * 0.2 - TIME * speed);
	float n1 = texture(flow_noise, uv).r;
	float n2 = texture(flow_noise, uv * 2.3 + vec2(0.4, TIME * 0.03)).r;
	float c = smoothstep(0.45, 0.75, n1 * 0.6 + n2 * 0.5);
	float edge = 1.0 - abs(UV.x - 0.5) * 2.0;
	vec3 col = mix(hot, crust, c);
	col = mix(col, core, smoothstep(0.82, 1.0, n2) * (1.0 - c));
	col = mix(crust * 1.4, col, smoothstep(0.0, 0.25, edge));
	ALBEDO = col * (1.2 + 0.3 * sin(TIME * 1.5 + world_pos.z * 0.2));
}
