const socket = io();
var _expenses;
var _isLoaded = false;
var _salaryPeriod;

const $topCategoriesTable = document.getElementById("topCategoriesTable");
const expenseTemplate = document.querySelector("#expenseTemplate").innerHTML;

const $topExpensesTable = document.getElementById("topExpensesTable");

const $nonFixedSumContainer = document.getElementById("nonFixedSumContainer");
const nonFixedSumTemplate = document.querySelector("#nonFixedSumTemplate").innerHTML;

socket.emit("requestExpenses",true);

socket.on("expenses", (expenses) => {

    if (_isLoaded) return;
    
    _expenses = expenses;
	let categorySummary = groupExpensesByCategory(expenses);
	
	for (var key of Object.keys(categorySummary)) {
		var html = Mustache.render(expenseTemplate, {
		  description: key,
		  sum: Math.round(categorySummary[key],2) + " kr"
		});
        $topCategoriesTable.insertAdjacentHTML("beforeend", html);
	  }

    var html2 = Mustache.render(nonFixedSumTemplate, {
        sum: Math.round(calculateNonFixedCosts(expenses)) + " kr"
    });
    
    $nonFixedSumContainer.insertAdjacentHTML("beforeend", html2)

    let topExpenses = getTopSingleExpenses(expenses);

    for (var expense of topExpenses) {
        var html = Mustache.render(expenseTemplate, {
          description: expense.description,
          sum: -1*Math.round(expense.sum,2) + " kr"
        });
        $topExpensesTable.insertAdjacentHTML("beforeend", html);
    }

    _isLoaded = true;
    
})

socket.on("salaryPeriod",(salaryPeriod) => {
    _salaryPeriod = salaryPeriod;
    let DaysSinceSalary = Math.ceil((new Date() - new Date(salaryPeriod.salaryDate)) / (1000 * 60 * 60 * 24));
    document.querySelector("#daysSinceSalary").innerText = DaysSinceSalary;
})

function calculateNonFixedCosts(expenses) {
    return expenses.reduce((total, expense) => {
        if (!expense.isFixedExpense && !expense.description.includes("Sparande") && expense.sum < 0) {
            return total + expense.sum;
        }
        return Math.round(total,2);
    }, 0);
}

function groupExpensesByCategory(expenses) {
    const result = {};
    
    expenses.forEach(expense => {
        if (!expense.isFixedExpense && !expense.category.includes("Sparande")) {
            if (!result[expense.category]) {
                result[expense.category] = 0;
            }
            result[expense.category] += expense.sum;
        }
    });
    
    // Convert object to array, sort, and take 5 biggest
    const sortedCategories = Object.entries(result)
        .sort(([,sumA], [,sumB]) => sumA - sumB)  // Sort in ascending order since numbers are negative
        .slice(0, 5);

    // Convert back to object
    const topCategories = Object.fromEntries(sortedCategories);

    return topCategories;
}

function getTopSingleExpenses(expenses) {
    const filteredExpenses = expenses.filter(expense => 
        !expense.isFixedExpense && !expense.category.includes("Sparande") && expense.sum < 0
    );

    // Sort expenses by sum in descending order and take 5 biggest
    const topExpenses = filteredExpenses.sort((a, b) => a.sum - b.sum)
        .slice(0, 5);

    return topExpenses;
}