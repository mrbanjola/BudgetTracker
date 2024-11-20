// Hjälpfunktion för att få unika värden från en lista
function onlyUnique(value, index, array) {
  return array.indexOf(value) === index;
}

function getBudgetableCategories(categories) {
	let nonBudgetableCategories = [
		"Bankavgifter",
		"Xtraspar",
		"Insättning Sparande",
		"Försäkring",
		"Uttag Sparande",
		"Övrigt",
		"Telefon",
		"Bostad",
		"Lån",
		"CSN",
		"Lön",
		"Swish"
	];
	let result = [];
	for (var category of categories) {
		if (!nonBudgetableCategories.includes(category)) {
			result.push(category);
		}
	}
	return result;
}
function defaultFixedCosts() {
	return [
			{
				"name": "TRYGG-HANSA",
				"sum": -78,
				"isActive": true
			},
			{
				"name": "Kth-Hallen",
				"sum": -499,
				"isActive": true
			},
			{
				"name": "Telia Sverig",
				"sum": -539,
				"isActive": true
			},
			{
				"name": "GODEL I SVER",
				"sum": -70,
				"isActive": true
			},
			{
				"name": "Ellevio (pub",
				"sum": -190,
				"isActive": true
			},
			{
				"name": "Bahnhof",
				"sum": -429,
				"isActive": true
			},
			{
				"name": "Svenska Bostäder",
				"sum": -5699,
				"isActive": true
			},
			{
				"name": "SANTANDER",
				"sum": -1589,
				"isActive": true
			},
			{
				"name": "REPLIT, INC.",
				"sum": -54,
				"isActive": true
			},
			{
				"name": "Autogiro Assistanbol",
				"sum": -49,
				"isActive": true
			},
			{
				"name": "Autogiro Folksam",
				"sum": -192,
				"isActive": true
			},
			{
				"name": "STRAVA",
				"sum": -99,
				"isActive": true
			},
			{
				"name": "GOOGLE Lagring",
				"sum": -19,
				"isActive": true
			},
			{
				"name": "CSN",
				"sum": -2187,
				"isActive": false
			},
			{
				"name": "LF MOTOR",
				"sum": -362,
				"isActive": true
			},
			{
				"name": "Köavgift Bostadsförmedlingen",
				"sum": -200,
				"isActive": false
			},
			{
				"name": "SV INGENJ",
				"sum": -180,
				"isActive": false
			},
			{
				"name": "SKYCIV ENGINEERING",
				"sum": -130,
				"isActive": true
			}
		];

};

// Make available to main file.
module.exports = {
	onlyUnique,
	getBudgetableCategories,
	defaultFixedCosts
};

