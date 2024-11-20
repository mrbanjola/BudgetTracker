var socketio = require("socket.io");
const express = require("express");
const http = require("http");
const path = require("path");
const port = process.env.PORT || 8080;
const request = require("request");
const Database = require("@replit/database");
const db = new Database();
const helpers = require("./helpers");
require("./utils.js");

const salaryPeriod = GetSalaryPeriod();

const app = express();

/*
var resultForFixed = {};
for (let i = 0; i < 12; i++) {
	resultForFixed[i] = helpers.defaultFixedCosts();
};
db.set("fixedExpenses",resultForFixed)
*/

function sendWebRequestToAPI(url, callback) {
	console.log("sending request");
	request(url, (error, response, body) => {
		if (!error && response.statusCode == 200) {
			console.log("we don't have an error");
			callback(JSON.parse(body).data);
		} else {
			callback(error || new Error("Request to API failed"), null);
		}
	});
}
const url = process.env["API_URL"];
sendWebRequestToAPI(url, (data) => {
	db.set("expenses", data);
	let availableCategories = JSON.parse(data)
		.map((expense) => expense.category)
		.filter(helpers.onlyUnique);
	db.set("categories", availableCategories);
});

var server = http.createServer(app);
var io = socketio(server);

const publicDirectoryPath = path.join(__dirname, "./public");

app.use(express.static(publicDirectoryPath));

io.on("connection", (socket) => {
	console.log("User connected");
	socket.on("requestExpenses", (period) => {
		period = period ?? salaryPeriod.salaryPeriod;

		GetAllExpenses((expenses) => {
			if (period) {
				expenses = expenses.filter(
					(expense) => expense.salaryPeriod == period,
				);
			}

			socket.emit("expenses", expenses);
		});
	});
	socket.emit("salaryPeriod", salaryPeriod);

	socket.on("requestBudget", (period) => {
		period = period ?? salaryPeriod.salaryPeriod;
		getBudgetBySalaryPeriod(period, (budget) => {
			socket.emit("budget", budget);
		});
	});

	socket.on("requestExpensesAndBudget", (period) => {
		period = period ?? salaryPeriod.salaryPeriod;

		GetAllExpenses((expenses) => {
			if (period) {
				expenses = expenses.filter(
					(expense) => expense.salaryPeriod == period,
				);
			}

			socket.emit("expenses", expenses);
		});

		getBudgetBySalaryPeriod(period, (budget) => {
			socket.emit("budget", budget);
		});
	});

	socket.on("submitNewBudget", (budget, salaryPeriod) => {
		salaryPeriod = salaryPeriod ?? GetSalaryPeriod().salaryPeriod;

		db.get("budget").then((old) => {
			let current = old.value;
			current[salaryPeriod] = budget;
			db.set("budget", current).then(() => {
				socket.emit("budgetSubmitted");
			});
		});
	});

	socket.on("getBudgetForSalaryPeriod", (salaryPeriod) => {
		console.log(`This dude is requesting the budget for ${salaryPeriod}`);
		getBudgetBySalaryPeriod(salaryPeriod, (budget) => {
			socket.emit("budget", budget);
		});
	});

	socket.on("requestFixedExpenses", (salaryPeriod) => {
		console.log(`Getting fixed expenses for ${salaryPeriod}`)
		db.get("fixedExpenses").then((fixedCosts) => {
			console.log(fixedCosts)
			socket.emit("fixedExpenses", fixedCosts.value[salaryPeriod]);
		});
	});

	socket.on("submitFixedExpenses", (fixedExpenses, salaryPeriod) => {
		console.log("Submitting fixed expenses for " + salaryPeriod);
		console.log(fixedExpenses);
		db.get("fixedExpenses").then((fixedCosts) =>{
			let myCosts = fixedCosts.value;
			myCosts[salaryPeriod] = fixedExpenses;

			db.set("fixedExpenses", myCosts).then(() => {
				socket.emit("fixedExpensesSubmitted");
			});
		})
	})
	
});

server.listen(port, "0.0.0.0");

async function GetAllExpenses(callback) {
	db.get("expenses").then((expenses) => {
		callback(JSON.parse(expenses.value));
	});
}

function GetSalaryPeriod() {
	let payDayThisMonth = new Date();
	payDayThisMonth.setDate(25);

	// Om söndag eller lördag
	var badDays = [0, 6];
	if (badDays.includes(payDayThisMonth.getDay())) {
		if (payDayThisMonth.getDay() == 0) {
			payDayThisMonth = payDayThisMonth.addDays(-2);
		} else {
			payDayThisMonth = payDayThisMonth.addDays(-1);
		}
	}

	if (payDayThisMonth <= new Date()) {
		return {
			salaryPeriod: payDayThisMonth.getMonth(),
			salaryDate: payDayThisMonth,
		};
	} else {
		let payDayLastMonth = new Date(new Date().addMonths(-1));
		payDayLastMonth.setDate(25);

		if (badDays.includes(payDayLastMonth.getDay())) {
			if (payDayLastMonth.getDay() == 0) {
				payDayLastMonth = payDayLastMonth.addDays(-2);
			} else {
				payDayLastMonth = payDayLastMonth.addDays(-1);
			}
		}
		return {
			salaryPeriod: payDayLastMonth.getMonth(),
			salaryDate: payDayLastMonth,
		};
	}
}

function getBudgetBySalaryPeriod(salaryPeriod, callback) {
	db.get("budget").then((budget) => {
		let budgetForPeriod = budget.value[salaryPeriod];
		console.log(`budgetForPeriod: ${budgetForPeriod}`);
		if (!budgetForPeriod) {
			budgetForPeriod = getStandardBudget();
		}
		callback(budgetForPeriod);
	});
}

function getStandardBudget() {
	return {
		Kläder: 0,
		Bar: 0,
		"Taxi & transport": 0,
		Tågresa: 0,
		"Träning & Hälsa": 0,
		Resa: 0,
		Restaurang: 0,
		Prenumerationer: 0,
		Småköp: 0,
		"Second hand": 0,
		Bil: 0,
		Livsmedel: 0,
		"Nöje & underhållning": 0,
		"SL biljett": 0,
	};
}