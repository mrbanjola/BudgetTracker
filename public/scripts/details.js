const socket = io();
var _isLoaded = false;
var _salaryPeriod;
var _expenses;

const expenseTemplate = document.querySelector("#expenseTemplate").innerHTML;
const $fixedExpensesTable = document.getElementById("fixedExpensesTable");
const tableSectionTemplate = document.getElementById("tableSectionTemplate").innerHTML;
const $mainContainer = document.getElementById("mainContainer");

socket.emit("requestExpenses",true);

socket.on("expenses", (expenses) => {
	
	if (_isLoaded) return;
	_expenses = expenses;

	let fixedExpenses = expenses.filter(expense => {
		return(expense.isFixedExpense && !expense.isSavings)
	});
	let total = 0;
	for (var expense of fixedExpenses) {
		var html = Mustache.render(expenseTemplate, {
			textColor: expense.sum > 0 ? "green" : "red",
			description: expense.description,
			sum: Math.round(expense.sum,2) + " kr"
		});
		$fixedExpensesTable.insertAdjacentHTML("beforeend", html);
		total += expense.sum;
	};

	var html = Mustache.render(expenseTemplate, {
		textColor: total > 0 ? "green" : "red",
		description: "Totalt",
		sum: Math.round(total,2) + " kr"
	});
	$fixedExpensesTable.insertAdjacentHTML("beforeend", html);

	let categorizedExpenses = categorizeExpenses(expenses);
	console.table(categorizedExpenses);

	for (var category of Object.keys(categorizedExpenses)) {
		let sum =0;
		var html = Mustache.render(tableSectionTemplate, {
			category: category,
			id: cleanUpCategoryName(category)
		});
		$mainContainer.insertAdjacentHTML("beforeend", html);
		var createdTable = document.getElementById(cleanUpCategoryName(category)+"Table");
		for (var expense of categorizedExpenses[category]) {
			let expenseRow = Mustache.render(expenseTemplate, {
					textColor: expense.sum > 0 ? "green" : "red",
					description: expense.description,
					sum: expense.sum
				});
			createdTable.insertAdjacentHTML("beforeend", expenseRow);
			sum += expense.sum;
			
		};
		let totalRow = Mustache.render(expenseTemplate, {
				textColor: sum > 0 ? "green" : "red",
				description: "Totalt",
				sum: Math.ceil(sum) + " kr" 
			});
		createdTable.insertAdjacentHTML("beforeend", totalRow);
	}

	
	

});

function cleanUpCategoryName(categoryName) {
	let myRegex = new RegExp("[ÅÄÖåäö]","g");
	// å Is replace separately to avoid lån/lön confusion
	return categoryName.replaceAll("å","a").replaceAll(/ /g, "_").replaceAll(".", "_").replaceAll("&", "-").replaceAll(myRegex, "");
}

function categorizeExpenses(expenses) {
    const categorizedExpenses = {};

    expenses.forEach(expense => {
        const category = expense.category;
        if (!categorizedExpenses[category]) {
            categorizedExpenses[category] = [];
        }
        categorizedExpenses[category].push(expense);
    });

    return categorizedExpenses;
}