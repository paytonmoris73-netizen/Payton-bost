import { improve, parseIngredients, parseSteps } from "../src/improve";
import { substitutesFor } from "../src/substitutions";
const r = improve({ title: "t", ingredients: parseIngredients("2 chicken breast\n1 cup cream\n2 tbsp honey\n1 cup rice"), steps: parseSteps("Cook the chicken until golden.\nAdd cream and honey.") }, ["vegan", "less-sweet", "creamier"], {});
console.log(JSON.stringify(r.improved, null, 1)); console.log(r.changes); console.log(r.unchanged);
const s = substitutesFor("butter", { allergies: ["soy"], diet: ["vegan"] }); console.log(s.ok.map(x=>x.with), s.blocked.map(b=>b.sub.with+": "+b.reason));
const t = substitutesFor("milk", { allergies: ["soy","tree nuts"] }); console.log(t.ok.map(x=>x.with), t.blocked.map(b=>b.reason));
