shader_type spatial;
// Wind-swayed foliage for MultiMesh grass, flowers and canopies.
// Vertex colour = base colour; COLOR.a (or UV.y for grass) = sway weight.
render_mode diffuse_burley, specular_disabled, cull_disabled;

uniform float wind_strength = 0.12;
uniform float wind_speed = 1.6;
uniform vec2 wind_dir = vec2(1.0, 0.35);
uniform bool use_instance_color = true;
uniform float tip_brighten = 0.35;
uniform float height_ref = 0.5;
uniform bool weight_from_alpha = false;

varying float sway_w;

void vertex() {
	vec3 wp = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	sway_w = weight_from_alpha ? COLOR.a : clamp(VERTEX.y / height_ref, 0.0, 1.0);
	float t = TIME * wind_speed + wp.x * 0.13 + wp.z * 0.09;
	float s = sin(t) * 0.7 + sin(t * 2.3 + 1.7) * 0.3;
	vec2 d = normalize(wind_dir);
	VERTEX.xz += d * s * wind_strength * sway_w * sway_w;
	if (use_instance_color) {
		// Per-instance tint from a hash of the instance origin (works on every renderer).
		vec3 o = MODEL_MATRIX[3].xyz;
		float h = fract(sin(dot(o.xz, vec2(12.9898, 78.233))) * 43758.5453);
		COLOR.rgb *= mix(vec3(0.82, 0.92, 0.78), vec3(1.12, 1.08, 0.86), h);
	}
}

void fragment() {
	vec3 c = COLOR.rgb * (1.0 + tip_brighten * (weight_from_alpha ? 0.0 : sway_w));
	ALBEDO = c;
	ROUGHNESS = 0.9;
	BACKLIGHT = c * 0.35;
}
