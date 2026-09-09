Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
const require_en_US = require('./en-US.js');

//#region src/en-XA.ts
const pseudoCharacterMapWithUppercase = Object.fromEntries(Object.entries({
	a: "å",
	b: "ƀ",
	c: "ç",
	d: "ð",
	e: "é",
	f: "ƒ",
	g: "ğ",
	h: "ħ",
	i: "ï",
	j: "ĵ",
	k: "ķ",
	l: "ľ",
	m: "ɱ",
	n: "ñ",
	o: "ø",
	p: "þ",
	q: "ʠ",
	r: "ř",
	s: "š",
	t: "ŧ",
	u: "ü",
	v: "ṽ",
	w: "ŵ",
	x: "ẋ",
	y: "ÿ",
	z: "ž"
}).flatMap(([source, target]) => [[source, target], [source.toUpperCase(), target.toLocaleUpperCase("en-US")]]));
const tokenOrLetterPattern = /\{\{[^{}]*\}\}|\{[^{}]*\}|[a-zA-Z]/g;
function pseudoLocalizeString(value) {
	return value.replace(tokenOrLetterPattern, (segment) => {
		if (segment.startsWith("{")) return segment;
		return pseudoCharacterMapWithUppercase[segment] ?? segment;
	});
}
function pseudoLocalizeValue(value) {
	if (typeof value === "string") return pseudoLocalizeString(value);
	if (Array.isArray(value)) return value.map((item) => pseudoLocalizeValue(item));
	if (value && typeof value === "object") {
		const localized = {};
		for (const [key, nestedValue] of Object.entries(value)) localized[key] = pseudoLocalizeValue(nestedValue);
		return localized;
	}
	return value;
}
const enXAFromEnUS = pseudoLocalizeValue(require_en_US.enUS);
const enXA = {
	...enXAFromEnUS,
	locale: "en-XA"
};

//#endregion
exports.enXA = enXA;
//# sourceMappingURL=en-XA.js.map