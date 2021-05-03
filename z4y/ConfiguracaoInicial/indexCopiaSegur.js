const os = require('os');
const fs = require('fs');
const path = require('path');
const venom = require('venom-bot');
const axios = require('axios');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
//const https = require('https');
const express = require('express');
const cors = require('cors');

venom.create().then((client) => start(client));

function start(client) {
    
    var app = express();
    app.listen(3000, () => {
        console.log("Server running on port 3000");
    });

    app.post("/sendText", async (req, res, next) => {
        console.log(req.query.number + '@c.us', req.query.text);
        await client.sendText(req.query.number + '@c.us', req.query.text)
  	      .then((result) => {
		    console.log('Result: ', res); //return object success
  		    })
  	      .catch((erro) => {
    		    console.error('Error when sending: ', erro); //return object error
  	      });
        res.json(req.query);
    });
}





    //app.post("/sendText", async (req, res, next) => {
      //  console.log(req.query.number + '@c.us', req.query.text);
        //await client.sendText(req.query.number + '@c.us', req.query.text));
        //res.json(req.query);
    //});






















process.stdin.resume();//so the program will not close instantly

async function exitHandler(options, exitCode) {
    if (options.cleanup) {
        console.log('cleanup');
        //await Sessions.getSessions().forEach(async session => {
          //  await Sessions.closeSession(session.sessionName);
        //});
    }
    if (exitCode || exitCode === 0) {
        console.log(exitCode);
    }

    if (options.exit) {
        process.exit();
    }
} //exitHandler 
//do something when app is closing
process.on('exit', exitHandler.bind(null, { cleanup: true }));
//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { exit: true }));
// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));
//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));
