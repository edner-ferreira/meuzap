const os = require('os');
const fs = require('fs');
const path = require('path');
const venom = require('venom-bot');
const axios = require('axios');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
//const https = require('https');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); 


var app = express();
var session;
var sessions = [];
var client;


app.use(cors());
app.use(express.json());

//body-parse
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

var appPort = process.env.PORT ? process.env.PORT : 3000;

app.listen(appPort, () => {
    console.log("Http server running on port " + appPort);
});//HTTP

app.get("/", function(req, res){
    res.sendFile(__dirname + "/src/home.html");
});

app.get("/message", function(req, res){
    res.sendFile(__dirname + "/src/messages.html");
});

app.get("/start", async (req, res, next) => {
    console.log("starting..." + req.query.sessionName);
    session = await start(req.query.sessionName);
    console.log("session start: " + session.name);

    if (["CONNECTED", "QRCODE", "STARTING"].includes(session.state)) {
        //res.status(200).json({ result: 'success', message: session.state });
        res.sendFile(__dirname + "/src/home.html");
    } else {
        res.status(200).json({ result: 'error', message: session.state });
    }
});//start

//Envia uma mensagem para um contato 
app.post("/sendText", async (req, res, next) => {
    console.log(req.body.number + '@c.us', req.body.message);
    
    await client.sendText(req.body.number + '@c.us', req.body.message).then((result) => {
        console.log('Result: ', result); //return object success
      })
      .catch((erro) => {
        console.error('Error when sending: ', erro); //return object error
      });
    //res.json(req.body);
    res.sendFile(__dirname + "/src/home.html");
});//sendText


//Envia um cotato => Quem vai receber (destino) + contato a ser enviado + nome do contato
app.get("/sendContact", async (req, res, next) => {
    await client
    .sendContactVcard('5511972100922@c.us', '5511941763191@c.us', 'Contato').then((result) => {
        console.log('Result: ', result); //return object success
    })
    .catch((erro) => {
        console.error('Error when sending: ', erro); //return object error
    });
    res.json(req.query);
});//sendContact


//Send @tagged message
app.get("/sendTagged", async (req, res, next) => {
    await client.sendMentioned(
        '5511972100922@c.us',
        'Hello @5511941763191 and @5511984763882!',
        ['5511941763191', '5511984763882']
    );
    res.json(req.query);
});

app.get("/close", async (req, res, next) => {
    var result = await closeSession(req.query.sessionName);
    //res.json(result);
    res.sendFile(__dirname + "/src/home.html");
});//close

app.get("/jason", async (req, res, next) => {
    
    var data = fs.readFileSync('/home/bocao/Documentos/whatsappWeb/test.json', 'utf8');
    var words = JSON.parse(data);
    for(i=0;i<words.length;++i)
    {
        await client.sendText(words[i].number + '@c.us', words[i].message).then((result) => {
        console.log('Result: ', result); //return object success
        console.log(words[i].number + '@c.us', words[i].message);
      })
      .catch((erro) => {
        console.error('Error when sending: ', erro); //return object error
      });
    }
    //console.log(words);
    res.json(words);
});//jason
