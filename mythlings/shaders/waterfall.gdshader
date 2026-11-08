shader_type spatial;
render_mode blend_mix, depth_draw_opaque, cull_disabled, unshaded;

uniform sampler2D streak_noise : hint_default_white, filter_linear_mipmap, repeat_enable;
uniform vec3 color_a : source_color = vec3(0.55, 0.82, 0.88);
uniform vec3 color_b : source_color = vec3(0.95, 0.99, 1.0);
uniform float speed = 1.4;

void fragment() {
	float n = texture(streak_noise, vec2(UV.x * 3.0, UV.y * 0.6 - TIME * speed)).r;
	float n2 = texture(streak_noise, vec2(UV.x * 7.0 + 0.4, UV.y * 1.3 - TIME * speed * 1.6)).r;
	float s = smoothstep(0.35, 0.8, n * 0.6 + n2 * 0.5);
	ALBEDO = mix(color_a, color_b, s);
	float side = smoothstep(0.0, 0.12, UV.x) * smoothstep(1.0, 0.88, UV.x);
	ALPHA = (0.55 + s * 0.4) * side;
}
