shader_type spatial;
// Stylised river/pond water: scrolling ripples, fresnel sky tint and shore foam.
// UV.x across the river (0 = bank, 0.5 = middle, 1 = bank), UV.y along the flow.
render_mode blend_mix, depth_draw_opaque, cull_back, diffuse_burley, specular_schlick_ggx;

uniform vec3 shallow_color : source_color = vec3(0.32, 0.72, 0.74);
uniform vec3 deep_color : source_color = vec3(0.08, 0.33, 0.45);
uniform vec3 foam_color : source_color = vec3(0.92, 0.97, 0.96);
uniform sampler2D ripple_noise : hint_default_white, filter_linear_mipmap, repeat_enable;
uniform float flow_speed = 0.35;
uniform float alpha = 0.82;
uniform bool is_pool = false;

varying vec3 world_pos;

void vertex() {
	world_pos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	VERTEX.y += sin(TIME * 1.3 + world_pos.x * 0.4 + world_pos.z * 0.3) * 0.03;
}

void fragment() {
	vec2 flow = is_pool ? world_pos.xz * 0.12 + vec2(TIME * 0.02, TIME * 0.015) : vec2(UV.x * 1.5, UV.y * 0.25 - TIME * flow_speed);
	float n1 = texture(ripple_noise, flow).r;
	float n2 = texture(ripple_noise, flow * 1.9 + vec2(0.3, TIME * 0.05)).r;
	float ripple = (n1 + n2) * 0.5;
	float edge = is_pool ? 0.0 : 1.0 - abs(UV.x - 0.5) * 2.0;
	float depth_f = is_pool ? 0.7 : smoothstep(0.0, 0.7, edge);
	vec3 col = mix(shallow_color, deep_color, depth_f);
	float fres = pow(1.0 - clamp(dot(NORMAL, VIEW), 0.0, 1.0), 3.0);
	col = mix(col, vec3(0.75, 0.88, 0.95), fres * 0.45);
	float foam = (is_pool ? 0.0 : smoothstep(0.18, 0.0, edge)) + smoothstep(0.72, 0.82, ripple) * 0.35;
	col = mix(col, foam_color, clamp(foam, 0.0, 1.0));
	ALBEDO = col;
	ALPHA = mix(alpha, 1.0, clamp(foam, 0.0, 1.0) * 0.6);
	ROUGHNESS = 0.06;
	METALLIC = 0.0;
	SPECULAR = 0.6;
	NORMAL_MAP = vec3(n1 * 0.5 + 0.25, n2 * 0.5 + 0.25, 1.0);
	NORMAL_MAP_DEPTH = 0.6;
}
