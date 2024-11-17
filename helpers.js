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

// Make available to main file.
module.exports = {
	onlyUnique,
	getBudgetableCategories
};