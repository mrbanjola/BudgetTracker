const socket = io();

const $budgetSetterContainer = document.getElementById("budget-section");
const budgetSetterTemplate = document.querySelector(
	"#budgetSetterTemplate",
).innerHTML;
const $mainContainer = document.getElementById("mainContainer");
const budgetSectionTemplate = document.querySelector(
	"#budgetSectionTemplate",
).innerHTML;
const expenseTemplate = document.querySelector("#expenseTemplate").innerHTML;
const $fixedCostsContainer = document.getElementById("fixedCostsForm");
const fixedCostSelectTemplate = document.querySelector(
	"#fixedCostSelectTemplate",
).innerHTML

var _isLoaded = false;
var _expenses;
var _groupedExpenses;
var _totalRemainingBudget = 0;
var _totalBudget = 0;

socket.on("salaryPeriod",(salaryPeriod) => {
	if (_isLoaded) return;
	document.getElementById("salaryPeriodSelect").value = salaryPeriod.salaryPeriod;
})

socket.emit("requestExpenses", 9);
setTimeout(() => {
	socket.emit("requestBudget")
}, 600);

setTimeout(() => {
	socket.emit("requestFixedExpenses", 9);
}, 1000);

socket.on("expenses", (expenses) => {
	console.log("YOYOYO, the expenses are here")
	if (_isLoaded) return;
	_expenses = expenses;
	_groupedExpenses = groupExpensesByCategory(expenses);

	_isLoaded = true;
});

socket.on("budgetSubmitted",() => {
	console.log("New budget been done bby")
})

socket.on("fixedExpenses", (fixedExpenses) => {
	console.log("The fixed costs are here")
	console.table(fixedExpenses)
	renderFixedExpenses(fixedExpenses);
	setFixedExpenseText();
	toggleSalaryPeriodChangeButton();
});



socket.on("budget", async (budget) => {
	console.log("YOYOYO, the budget is here")
	$budgetSetterContainer.innerHTML = "";
	emptyContainer($mainContainer);
	_totalRemainingBudget = 0;
	_totalBudget = 0;
	let tries = 0;
	while (!_isLoaded) {
		tries++;
		if (tries > 20) {
			throw new Error("Budget could not be loaded");
		}
		continue;
	}

	console.table(budget);

	renderBudgetCategories(budget);
	processBudgetCategories(budget);
	fillBudgetCategoryTables(budget);
	updateRemainingBudgetDisplay();
	
	let categories = Object.keys(budget);
	handleBudgetEventListeners(categories);
	handleBudgetTexts(categories);
	document
		.querySelector("#changeSalaryPeriod")
		.addEventListener("click", (e) => {
			e.preventDefault();
			toggleSalaryPeriodChangeButton();
			let salaryPeriod = document.querySelector(
				"#salaryPeriodSelect",
			).value;
			_isLoaded = false;
			_expenses = null;
			socket.emit("requestExpenses", salaryPeriod);
			setTimeout(() => {
				socket.emit("requestBudget", salaryPeriod);
			},600)
			setTimeout(() => {
				socket.emit("requestFixedExpenses", salaryPeriod);
			}, 1100)
			
		});
});

/* FUNCTIONS
sdföldkföldkföls
föadslfaö
aösdlfkölsdfk
*/

function handleBudgetEventListeners(categories) {
	for (let category of categories) {
		document
			.getElementById(cleanUpCategoryName(category))
			.addEventListener("input", (e) => {
				document.getElementById(
					cleanUpCategoryName(category) + "_label",
				).innerText = `${category} - ${e.target.value} kr`;
			});
	}

	document
		.getElementById("submit-new-purchase-button")
		.addEventListener("click", (e) => {
			e.preventDefault();
			let inputs = document
				.getElementById("budget-section")
				.getElementsByTagName("input");

			let result = {};
			

			for (let input of inputs) {
				result[input.name] = input.value;
			};
			let salaryPeriod = document.querySelector("#salaryPeriodSelect").value;

			socket.emit("submitNewBudget", result, salaryPeriod);
			socket.emit("submitFixedExpenses", summarizeFixedExpenseSettings(), salaryPeriod)
		});
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
}

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

function calculateTotalRemainingBudget(expenses, budget) {
	let sum = 0;
	for (let category of Object.keys(budget)) {
		let spent = -expenses[category] ?? 0;
		sum = sum + budget[category] - spent;
	}
	return sum;
}

function handleBudgetTexts(categories) {
	let event = new Event("input", {
		bubbles: true,
	});
	for (let input of $budgetSetterContainer.getElementsByTagName("input")) {
		input.dispatchEvent(event);
	}
}

function emptyContainer(container) {
	while (container.firstElementChild) {
		container.firstElementChild.remove();
	}
}

function renderBudgetCategories(budget) {
	let categories = Object.keys(budget).sort();
	for (var category of categories) {
		var html = Mustache.render(budgetSetterTemplate, {
			category: category,
			cleaned_category: cleanUpCategoryName(category),
			value: budget[category],
		});
		$budgetSetterContainer.insertAdjacentHTML("afterbegin", html);
	}
}

function fillBudgetCategoryTables(budget) {
	for (var category of Object.keys(budget)) {
		if (budget[category] == 0 && !_groupedExpenses[category]) continue;
		for (var expense of _expenses.filter((expense) => expense.category == category)) {
			let tableRow = Mustache.render(expenseTemplate, {
				description: expense.description,
				sum: expense.sum
			});
			console.log(`Trying to add ${tableRow} to ${category}`)
			document.getElementById(`table_${cleanUpCategoryName(expense.category)}`).insertAdjacentHTML("beforeend", tableRow);
		}
	}
}

function processBudgetCategories(budget) {
	let categories = Object.keys(budget);
	for (var category of categories) {
		if (budget[category] == 0 && !_groupedExpenses[category]) continue;
		let spent = _groupedExpenses[category] ?? 0;
		let remaining = Math.floor(budget[category] - -spent);
		console.log(remaining);
		_totalRemainingBudget += remaining;
		_totalBudget += Number(budget[category]);
		let isOverBudget = -spent > budget[category];
		let status = isOverBudget ? "danger" : "success";
		var html2 = Mustache.render(budgetSectionTemplate, {
			category: category,
			cleaned_category: cleanUpCategoryName(category),
			status: status,
			remaining: `${Math.abs(remaining)} ${isOverBudget ? "kr över budget" : "kr kvar"}`,
			percentage: Math.floor((-spent / budget[category]) * 100),
			spent: Math.floor(-spent),
			budgeted: budget[category],
		});
		$mainContainer.insertAdjacentHTML("afterbegin", html2);
	}
}

function updateRemainingBudgetDisplay() {
	document.querySelector("#remainingBudget").innerText = _totalRemainingBudget;
	document.querySelector("#remainingBudget").style.color = _totalRemainingBudget > 0 ? "green" : "red";
	document.querySelector("#remainingBudgetText").innerText = _totalRemainingBudget > 0 ? "kr kvar" : "över budget";
	document.querySelector("#totalBudgetText").innerText = _totalBudget;
}

function summarizeFixedExpenseSettings() {
	return Array.from($fixedCostsContainer.getElementsByTagName("input")).map(expense => {
		let name = expense.attributes["fixed_cost"].value;
		let sum = expense.attributes["amount"].value;
		let isActive = expense.checked;
		return {
			"name": name,
			"sum": Number(sum),
			"isActive": isActive
		};
	})
}

function calculateTotalFixedExpenses() {
	return summarizeFixedExpenseSettings().reduce((sum,expense) => {
		return sum + (Number(expense.isActive) * Number(expense.sum))},0);
};

function renderFixedExpenses(fixedExpenses) {
	
	emptyContainer($fixedCostsContainer);
	
	for (var fixedCost of fixedExpenses) {
		let myHTML = Mustache.render(fixedCostSelectTemplate, {
			name: fixedCost.name,
			cleaned_name: cleanUpCategoryName(fixedCost.name),
			sum: fixedCost.sum,
			isActive: fixedCost.isActive ? "checked" : ""
		});
		$fixedCostsContainer.insertAdjacentHTML("beforeend", myHTML);
	}
}

function setFixedExpenseText() {
	document.querySelector("#fixedExpenseText").innerText = calculateTotalFixedExpenses();
};

function toggleSalaryPeriodChangeButton() {
	let button = document.querySelector("#changeSalaryPeriod");
	button.classList.toggle("disabled");
}