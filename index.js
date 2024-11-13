var socketio = require('socket.io');
const express = require('express');
const http = require('http');
const path = require('path');
const port = process.env.PORT || 8080;
const fileUpload = require('express-fileupload');
const request = require('request');
const Database = require("@replit/database");
const db = new Database();
require('./utils.js');

const salaryPeriod = GetSalaryPeriod();



const app = express();

function sendWebRequestToAPI(url, callback) {
	console.log("sending request")
    request(url, (error, response, body) => {
        if (!error && response.statusCode == 200) {
			console.log("we don't have an error");
			callback(JSON.parse(body).data);
        } else {
            callback(error || new Error('Request to API failed'), null);
        }
    });
}
const url = process.env['API_URL']
sendWebRequestToAPI(url,(data) => {
	db.set("expenses",data);
} )



var server = http.createServer(app);
var io = socketio(server);

const publicDirectoryPath = path.join(__dirname, './public');

app.use(express.static(publicDirectoryPath));





io.on('connection', socket => {
	console.log('User connected');

		GetExpensesForCurrentPeriod((expenses) => {
		socket.emit("expenses",expenses.filter(expense => expense.salaryPeriod == salaryPeriod.salaryPeriod));
	});

	socket.emit("salaryPeriod",salaryPeriod);


});

server.listen(port, '0.0.0.0');


async function GetExpensesForCurrentPeriod(callback) {
	db.get("expenses").then((expenses) => {
		callback(JSON.parse(expenses.value));
	})
};

function GetSalaryPeriod() {
	let payDayThisMonth = new Date();
	payDayThisMonth.setDate(25);

	// Om söndag eller lördag
	var badDays = [0, 6]
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
	    salaryDate: payDayThisMonth
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
	  };
	  return {
	    salaryPeriod: payDayLastMonth.getMonth(),
	    salaryDate: payDayLastMonth
	  };
	}
  }
