
var _expenses;

const socket = io();

socket.emit("requestExpenses",false);
socket.on("expenses", (expenses) =>{
	_expenses = expenses;

	let salaryBySalaryPeriod = calculateSalaryPerSalaryPeriod(expenses,false);
	salaryPeriods= salaryBySalaryPeriod[0];
	sums=salaryBySalaryPeriod[1];

	generateChart (
		"salaryChart",
		"line",
		salaryPeriods,
		["Summa"],
		[sums]
	);

	let fixedExpensesBySalaryPeriod = calculateFixedExpensesPerSalaryPeriod(expenses)[1];
	generateChart(
		"fixedExpensesChart",
		"line",
		salaryPeriods,
		["Summa"],
		[fixedExpensesBySalaryPeriod]
	);

	let nonFixedExpensesBySalaryPeriod = calculateNonFixedExpensesPerSalaryPeriod(expenses)[1];

	generateChart (
		"nonFixedExpensesChart",
		"line",
		salaryPeriods,
		["Summa"],
		[nonFixedExpensesBySalaryPeriod]
	);

	let swishPerSalaryPeriod = calculateSwishPerSalaryPeriod(expenses);
	swishPerSalaryPeriod.shift();

	generateChart(
		"swishChart",
		"line",
		salaryPeriods,
		["Mottagna","Skickade"],
		swishPerSalaryPeriod
	);

	let restaurantExpenses = calculateExpensesForCategoryBySalaryPeriod(expenses, "Restaurang")[1];

	generateChart(
		"restaurantChart",
		"line",
		salaryPeriods,
		["Summa"],
		[restaurantExpenses]
	);
	
	
})


function generateChart(canvasId, type, labels, dataLabels, data) {
	let ctx = document.getElementById(canvasId);

	if (dataLabels.length != data.length) {
		throw new Error("Labels and data must have the same length");
	}
	let dataSets = [];
	for (let i = 0; i < data.length; i++) {
		dataSets.push({
			label: dataLabels[i],
			data: data[i],
			borderColor: getRandomColor(),
			borderWidth: 1,
			fill: false
		})
	}
	
	new Chart(ctx, {
		type: type,
		data: {
			labels: labels,
			datasets: dataSets
		},
		options: {
			aspectRatio: 1,
			scales: {
				y: {
					beginAtZero: true,
				},
			},
		},
	});
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

function calculateSalaryPerSalaryPeriod(expenses) {
	const result = [0,0,0,0,0,0,0,0,0,0,0,0];
	const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

	for (var expense of expenses) {
		if (expense.category != "Lön") {
			continue;
		}
		result[expense.salaryPeriod] += Number(expense.sum);
	};
	months.unshift(months.pop());
	result.unshift(result.pop());

	return [months,result];
	
};

function calculateFixedExpensesPerSalaryPeriod(expenses) {
	const result = [0,0,0,0,0,0,0,0,0,0,0,0];
	const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

	for (var expense of expenses) {
		if (!expense.isFixedExpense) {
			continue;
		}
		result[expense.salaryPeriod] -= Number(expense.sum);
	};
	months.unshift(months.pop());
	result.unshift(result.pop());

	return [months,result];

}

function calculateNonFixedExpensesPerSalaryPeriod(expenses) {
	const result = [0,0,0,0,0,0,0,0,0,0,0,0];
	const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

	for (var expense of expenses) {
		if (expense.isFixedExpense || expense.isSavings || expense.sum > 0) {
			continue;
		}
		result[expense.salaryPeriod] -= Number(expense.sum);
	};
	months.unshift(months.pop());
	result.unshift(result.pop());

	return [months,result];

}

function calculateSwishPerSalaryPeriod(expenses) {
	let resultIn = [0,0,0,0,0,0,0,0,0,0,0,0];
	let resultOut = [...resultIn];
	const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

	for (var expense of expenses) {
		if (expense.category != "Swish") {
			continue;
		}
		if (expense.sum > 0) {
			resultIn[expense.salaryPeriod] += Number(expense.sum);
		} else {
			resultOut[expense.salaryPeriod] += Number(expense.sum);
		}
		
	};

	months.unshift(months.pop());
	resultIn.unshift(resultIn.pop());
	resultOut.unshift(resultOut.pop());

	return [months,resultIn,resultOut];

}

function calculateExpensesForCategoryBySalaryPeriod(expenses, category) {
	const result = [0,0,0,0,0,0,0,0,0,0,0,0];
	const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

	for (var expense of expenses) {
		if (expense.category != category) {
			continue;
		}
		result[expense.salaryPeriod] -= Number(expense.sum);
	}
	result.unshift(result.pop());
	months.unshift(months.pop());

	return [months,result];
};

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}