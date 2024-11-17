const socket = io();

const $budgetSetterContainer = document.getElementById("budget-section");
const budgetSetterTemplate = document.querySelector(
	"#budgetSetterTemplate",
).innerHTML;
const $mainContainer = document.getElementById("mainContainer");
const budgetSectionTemplate = document.querySelector(
	"#budgetSectionTemplate").innerHTML;


var _isLoaded = false;
var _expenses;
var _groupedExpenses;
var _totalRemainingBudget = 0;

socket.emit("requestExpenses",true);

socket.on("expenses", (expenses) => {

	if (_isLoaded) return;
	_expenses = expenses;
	_groupedExpenses = groupExpensesByCategory(expenses);

	_isLoaded = true;
})

socket.on("budget", (budget) => {
	let tries = 0;
	while (!_isLoaded) {
		tries++;
		if (tries > 100) {
			throw new Error("Budget could not be loaded");
		}
		continue;
	}

	console.table(budget);
	let categories = Object.keys(budget);
	for (var category of categories) {
		var html = Mustache.render(budgetSetterTemplate, {
			category: category,
			cleaned_category: cleanUpCategoryName(category),
			value: budget[category]
		});
		$budgetSetterContainer.insertAdjacentHTML("afterbegin", html);	

		if (budget[category] == 0 && !_groupedExpenses[category]) continue;
		let spent = _groupedExpenses[category] ?? 0;
		let remaining = Math.floor(budget[category] - -spent);
		console.log(remaining)
		_totalRemainingBudget += remaining;
		let isOverBudget = (-spent) > budget[category];
		let status = isOverBudget ? "danger" : "success";
		var html2 = Mustache.render(budgetSectionTemplate, {
			category: category,
			cleaned_category: cleanUpCategoryName(category),
			status: status,
			remaining: `${Math.abs(remaining)} ${isOverBudget ? "kr över budget" : "kr kvar"}`,
			percentage: Math.floor(-spent / budget[category]*100),
			spent: Math.floor(-spent),
			budgeted: budget[category]
		});
		$mainContainer.insertAdjacentHTML("afterbegin", html2);
	};

	document.querySelector("#remainingBudget").innerText = _totalRemainingBudget;
	document.querySelector("#remainingBudget").style.color = _totalRemainingBudget > 0 ? "green" : "red";
	document.querySelector("#remainingBudgetText").innerText = _totalRemainingBudget > 0 ? "kr kvar" : "över budget";
	handleBudgetEventListeners(categories);
	handleBudgetTexts(categories);
});


/* FUNCTIONS
sdföldkföldkföls
föadslfaö
aösdlfkölsdfk
*/


function handleBudgetEventListeners(categories) {
	for (let category of categories) {
		document.getElementById(cleanUpCategoryName(category)).addEventListener("input",(e) => {
			document.getElementById(
				cleanUpCategoryName(category) + "_label",
			).innerText = `${category} - ${e.target.value} kr`;
		});
	};

	document.getElementById("submit-new-purchase-button").addEventListener("click", (e) => {
		e.preventDefault();
		let inputs = document.getElementById("budget-section").getElementsByTagName("input");

		let result = {};

		for (let input of inputs) {
			result[input.name] = input.value;
		}

		socket.emit("submitNewBudget", result);

	})
}

function cleanUpCategoryName(categoryName) {
	let myRegex = new RegExp("[ÅÄÖåäö]", "g");
	// å Is replace separately to avoid lån/lön confusion
	return categoryName
		.replaceAll("å", "a")
		.replaceAll(/ /g, "_")
		.replaceAll(".", "_")
		.replaceAll("&", "-")
		.replaceAll(myRegex, "");
};

function groupExpensesByCategory(expenses) {
	const result = {};

	expenses.forEach((expense) => {
		if (!expense.isFixedExpense && !expense.isSavings) {
			if (!result[expense.category]) {
				result[expense.category] = 0;
			}
			result[expense.category] += expense.sum;
		}
	});

	return result;
}

function calculateTotalRemainingBudget(expenses,budget) {
	let sum = 0;
	for (let category of Object.keys(budget)) {
		let spent = -expenses[category] ?? 0;
		sum = sum + budget[category] -spent;
	}
	return sum;
}

function handleBudgetTexts(categories) {
	let event = new Event('input', {
		bubbles: true,
	});
	for (let input of $budgetSetterContainer.getElementsByTagName("input")) {
		input.dispatchEvent(event);
	}
}
