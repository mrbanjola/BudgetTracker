const socket = io();
var _expenses;
var _isLoaded = false;
var _salaryPeriod;

const $topCategoriesTable = document.getElementById("topCategoriesTable");
const expenseTemplate = document.querySelector("#expenseTemplate").innerHTML;

const $topExpensesTable = document.getElementById("topExpensesTable");

const $nonFixedSumContainer = document.getElementById("nonFixedSumContainer");
const nonFixedSumTemplate = document.querySelector(
    "#nonFixedSumTemplate",
).innerHTML;

const $budgetSetterContainer = document.getElementById("budget-section");
const budgetSetterTemplate = document.querySelector(
    "#budgetSetterTemplate",
).innerHTML;

socket.emit("requestExpenses", true);

socket.on("budgetSubmitted", () => {
    console.log("Nice bazonkas, budget is home.")
})

socket.on("budget", (budget) => {
    console.log(budget);
    let categories = Object.keys(budget);
    for (var category of categories) {
        var html = Mustache.render(budgetSetterTemplate, {
            category: category,
            cleaned_category: cleanUpCategoryName(category),
            value: budget[category]
        });
        $budgetSetterContainer.insertAdjacentHTML("afterbegin", html);
    };

    
    handleBudgetEventListeners(categories);
    handleBudgetTexts(categories);
});

socket.on("expenses", (expenses) => {
    if (_isLoaded) return;

    _expenses = expenses;
    let categorySummary = groupExpensesByCategory(expenses);

    for (var key of Object.keys(categorySummary)) {
        var html = Mustache.render(expenseTemplate, {
            description: key,
            sum: Math.round(categorySummary[key], 2) + " kr",
        });
        $topCategoriesTable.insertAdjacentHTML("beforeend", html);
    }

    var html2 = Mustache.render(nonFixedSumTemplate, {
        sum: Math.round(calculateNonFixedCosts(expenses)) + " kr",
    });

    $nonFixedSumContainer.insertAdjacentHTML("beforeend", html2);

    let topExpenses = getTopSingleExpenses(expenses);

    for (var expense of topExpenses) {
        var html = Mustache.render(expenseTemplate, {
            description: expense.description,
            sum: -1 * Math.round(expense.sum, 2) + " kr",
        });
        $topExpensesTable.insertAdjacentHTML("beforeend", html);
    }

    _isLoaded = true;
});

socket.on("salaryPeriod", (salaryPeriod) => {
    _salaryPeriod = salaryPeriod;
    let DaysSinceSalary = Math.ceil(
        (new Date() - new Date(salaryPeriod.salaryDate)) /
            (1000 * 60 * 60 * 24),
    );
    document.querySelector("#daysSinceSalary").innerText = DaysSinceSalary;
});

function calculateNonFixedCosts(expenses) {
    return expenses.reduce((total, expense) => {
        if (!expense.isFixedExpense && !expense.isSavings && expense.sum < 0) {
            return total + expense.sum;
        }
        return Math.round(total, 2);
    }, 0);
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

    // Convert object to array, sort, and take 5 biggest
    const sortedCategories = Object.entries(result)
        .sort(([, sumA], [, sumB]) => sumA - sumB) // Sort in ascending order since numbers are negative
        .slice(0, 5);

    // Convert back to object
    const topCategories = Object.fromEntries(sortedCategories);

    return topCategories;
}

function getTopSingleExpenses(expenses) {
    const filteredExpenses = expenses.filter(
        (expense) =>
            !expense.isFixedExpense && !expense.isSavings && expense.sum < 0,
    );

    // Sort expenses by sum in descending order and take 5 biggest
    const topExpenses = filteredExpenses
        .sort((a, b) => a.sum - b.sum)
        .slice(0, 5);

    return topExpenses;
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

function handleBudgetTexts(categories) {
    let event = new Event('input', {
        bubbles: true,
    });
    for (let input of $budgetSetterContainer.getElementsByTagName("input")) {
        input.dispatchEvent(event);
    }
}