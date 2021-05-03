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
// const parser = require('xml2json');
// const node_xj = require("xls-to-json");

var app = express();
var session;
//var sessions = [];
var client;
app.use(express.static('public'));

app.use(cors());
app.use(express.json());

//body-parse
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

var appPort = process.env.PORT ? process.env.PORT : 3000;

app.listen(appPort, () => {
    console.log("Http server running on port " + appPort);
    //pausecomp(3000);
    console.log("O sistema esta pronto!!!");
});//HTTP

app.get("/", function(req, res){
    res.sendFile(__dirname + "/html/ltr/index.html");
});

app.get("/message", function(req, res){
    res.sendFile(__dirname + "/html/ltr/messages.html");
});

app.get("/showqrcode", function(req, res){
    res.sendFile(__dirname + "/html/ltr/ShowQRCode.html");
});

app.get("/verificanumero", function(req, res){
    res.sendFile(__dirname + "/html/ltr/verificanumero.html");
});

app.get("/verificanumerolista", function(req, res){
    res.sendFile(__dirname + "/html/ltr/verificanumerolista.html");
});

app.get("/sendtextandpdf", function(req, res){
    res.sendFile(__dirname + "/html/ltr/sendtextandpdflista.html");
});

app.get("/start", async (req, res, next) => {
    console.log("starting..." + req.query.sessionName);
    session = await start(req.query.sessionName);
    console.log("session start: " + session.name);
    
    if (["CONNECTED", "QRCODE", "STARTING"].includes(session.state)) {
        //res.status(200).json({ result: 'success', message: session.state });
        res.sendFile(__dirname + "/html/ltr/index.html");
    } else {
        res.status(200).json({ result: 'error', message: session.state });
    }
});//start

app.post("/verificanum", async (req, res, next) => {
    var numverificado = await numeroExiste(req.body.number + '@c.us');
    console.log(numverificado + " - " + req.body.number + '@c.us');
    if(numverificado == 200){
        const html = '<html><head><meta name="viewport" content="width=device-width,' +
                  ' minimum-scale=0.1"><title>qrcode (264×264)</title></head>' +
                  '<body style="margin: 0px;background: #ffffff;text-align-last: center;">' +
                  '<h1>' + req.body.number + ' - OK</h1><br><a href="/">Inicio</a></body></html>';

                res.writeHead(200, {
                });
                res.end(html);
    }else{
        const html = '<html><head><meta name="viewport" content="width=device-width,' +
                  ' minimum-scale=0.1"><title>qrcode (264×264)</title></head>' +
                  '<body style="margin: 0px;background: #ffffff;text-align-last: center;">' +
                  '<h1>' + req.body.number + ' - Não possui whatsapp</h1><br><a href="/">Inicio</a></body></html>';

                res.writeHead(200, {
                });
                res.end(html);
    }
    //res.json(res.body);
});//verificanum

app.post("/verificanumlista", async (req, res, next) => {
    var arquivoJson = '/home/richard/Documentos/ProjetoWhatsapp/z4y/basedados/' + req.body.files;
    var data = fs.readFileSync(arquivoJson, 'utf8');
    var words = JSON.parse(data);
    var arraylista = [];
    
    for(i=0, j = 0;i<words.length;i++){
        var numverificado = await numeroExiste(words[i].number + '@c.us');
        if(numverificado == 200){
            arraylista[j] = words[i];
            j++;
        }          
    }
    fs.writeFile('/home/richard/Documentos/ProjetoWhatsapp/z4y/basedados/listaverificada.json', JSON.stringify(arraylista), function(err){
        if(err){'Veja o seu pdf'
            return console.log('erro')
        }
        console.log('Arquivo Criado');
    });
    //res.json(res.body);
    res.sendFile(__dirname + "/html/ltr/index.html");
});//verificanumlista

//Envia uma mensagem para um contato 
app.post("/sendText", async (req, res, next) => {
    var auxNum = await numeroExiste(req.body.number + '@c.us');
    if(auxNum == 200){
        await session.client.sendText(req.body.number + '@c.us', req.body.message).then((result) => {
            // console.log('Result: ', result); //return object success
            console.log("MSG enviada para " + req.body.number + " - OK");    
        })
        .catch((erro) => {
        console.error('Error when sending: ', erro); //return object error
        });
        //res.json(req.body);
    }else{
        console.log("MSG enviada para " + req.body.number + " - FALHOU PQ NAO TEM ZAP!!!");
    }
    res.sendFile(__dirname + "/html/ltr/messages.html");
});//sendText

app.get("/sendTextGeneric", async (req, res, next) => {
    // var auxNum = await numeroExiste(req.body.number + '@c.us');
    // if(auxNum == 200){
    //     await session.client.sendText(req.body.number + '@c.us', req.body.message).then((result) => {
    //         // console.log('Result: ', result); //return object success
    //         console.log("MSG enviada para " + req.body.number + " - OK");    
    //     })
    //     .catch((erro) => {
    //     console.error('Error when sending: ', erro); //return object error
    //     });
    //     
    // }else{
    //     console.log("MSG enviada para " + req.body.number + " - FALHOU PQ NAO TEM ZAP!!!");
    // }
    // res.sendFile(__dirname + "/src/messages.html");
    res.status(200).json({ result: 'success', message:  'mensagem enviada com sucesso!'});
});//sendText

// Send file (venom will take care of mime types, just need the path)
// you can also upload an image using a valid HTTP protocol
app.post("/sendtextandpdflista", async (req, res, next) => {
    //LER ARQUIVO JSON 
    var data = fs.readFileSync('/home/richard/Documentos/ProjetoWhatsapp/z4y/basedados/' + req.body.files, 'utf8');
    var words = JSON.parse(data);
    var j = 1;
    var pathPdf = '/home/richard/Documentos/ProjetoWhatsapp/z4y/pdf/';
    var mensagem = req.body.message;

    for(i=0;i<words.length;i++){
        if(req.body.message.indexOf('$NOME$') != -1){
            req.body.message = req.body.message.replace('$NOME$', words[i].name);
        }
        if(req.body.message.indexOf('$PROFISSAO$') != -1){
            req.body.message = req.body.message.replace('$PROFISSAO$', words[i].profession);
        }
        var auxNum = await numeroExiste(words[i].number + '@c.us');
        if(auxNum == 200){
            await session.client.sendText(words[i].number + '@c.us', req.body.message).then((result) => {
            })
            .catch((erro) => {
                console.error('Error when sending: ', erro); //return object error
            });
            await session.client.sendFile(words[i].number + '@c.us', pathPdf + words[i].number + ".PDF",
                words[i].number).then((result) => {
                console.log("MSG: " + j + " - " + words[i].number + " - OK");
            })
            .catch((erro) => {
                console.error('Error when sending: ', erro); //return object error
            });
        }else{
            console.log("MSG: " + j + " - " + words[i].number + " FALHOU PQ NAO TEM ZAP!!!");
        }
        req.body.message = mensagem;
        j++;
    }
    res.sendFile(__dirname + "/html/ltr/index.html");
});//sendTextAndPdf

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
    res.sendFile(__dirname + "/html/ltr/index.html");
});//close

app.get("/enviarmessagelista", async (req, res, next) => {
    res.sendFile(__dirname + "/html/ltr/messageslista.html");
});//enviarmessagelista

//Envia mensagem para uma lista em um arquivo json
app.post("/enviarlista", async (req, res, next) => {
    //LER ARQUIVO JSON 
    var arquivoJson = '/home/richard/Documentos/ProjetoWhatsapp/z4y/basedados/' + req.body.files;
    var data = fs.readFileSync(arquivoJson, 'utf8');
    var words = JSON.parse(data);
    var mensagem = req.body.message;
    var j = 1;
    
    for(i=0;i<words.length;i++){ 
        if(req.body.message.indexOf('$NOME$') != -1){
            req.body.message = req.body.message.replace('$NOME$', words[i].name);
        }
        if(req.body.message.indexOf('$PROFISSAO$') != -1){
            req.body.message = req.body.message.replace('$PROFISSAO$', words[i].profession);
        }
        var auxNum = await numeroExiste(words[i].number + '@c.us');
        if(auxNum == 200){
            await session.client.sendText(words[i].number + '@c.us', req.body.message).then((result) => {
            console.log("MSG: " + j + " - " + words[i].number + ' - OK');
            })
            .catch((erro) => {
                console.error('Error when sending: ', erro); //return object error
            });
        }else{
            console.log("MSG: " + j + " - " + words[i].number + " - FALHOU PQ NAO TEM ZAP!!!");
        }
        j++;
        req.body.message = mensagem;
    }
    res.sendFile(__dirname + "/html/ltr/index.html");
});//enviarLista

app.get("/qrcode", async (req, res, next) => {
    console.log("qrcode..." + req.query.sessionName);
    var sessionFunc = getSession(req.query.sessionName);

    if (sessionFunc !== false) {
        if (sessionFunc.status !== 'isLogged') {
            if (req.query.image) {
                sessionFunc.qrcode = session.qrcode.replace('data:image/png;base64,', '');
                const imageBuffer = Buffer.from(session.qrcode, 'base64');

                const html = '<html><head><meta name="viewport" content="width=device-width,' +
                  ' minimum-scale=0.1"><title>qrcode (264×264)</title></head>' +
                  '<body style="margin: 0px;background: #ffffff;text-align-last: center;">' +
                  '<img style="-webkit-user-select: none;margin: auto;cursor: zoom-in;padding: 100px;' +
                  'width: 300px;height: 300px;" src="data:image/png;base64,'+ sessionFunc.qrcode +'" width="150"' +
                  ' height="150"><br><a href="/">Inicio</a></body></html>';

                res.writeHead(200, {
                    //'Content-Type': 'image/png',
                    //'Content-Length': imageBuffer.length
                });
                //res.end(imageBuffer);
                res.end(html);
            } else {
                res.status(200).json({ result: "success", message: session.state, qrcode: session.qrcode });
            }
        } else {
            res.status(200).json({ result: "error", message: session.state });
        }
    } else {
        res.status(200).json({ result: "error", message: "NOTFOUND" });
    }
});//qrcode

// verifica se a msg foi vista ✔️✔️
app.get("/verificasemsgvista", async (req, res, next) =>{
    var verificaMsgVista = await session.client.sendSeen('5511972100922@c.us');
        console.log("Se o numero viu a msg - " + verificaMsgVista);
    
    res.sendFile(__dirname + "/html/ltr/index.html");
});

app.get('*', function(req, res, next) {
    res.sendFile(__dirname + "/html/ltr/error-404.html");
});

// Check if the number exists
async function numeroExiste(numeroCel){
    var data;
    await session.client.checkNumberStatus(numeroCel).then((result) => {
        if(result.status == 200){
            data = result.status;
            // console.log("entrou no 200");
        }else{
            data = result.status;
            // console.log("entrou no 400");
        }
        })
        .catch((erro) => {
            console.error('Error when sending: ', erro); //return object error
        });
        //console.log("data " + data);
        return data;        
}; // function numeroExiste

//##################FUNCAO DE SLEEP###########################
async function pausecomp(millis){
    var date = new Date();
    var curDate = null;
    do 
    { 
        curDate = new Date(); 
        console.log("Espere um minuto........");
    }while(curDate-date < millis);
};

async function iniciarEscrita(){
    // Stop typing...
    await session.client.startTyping('5511972100922@c.us');
    // await sleep(1000);
    await pararEscrita();
};//Function iniciarEscrita

async function pararEscrita(){
    // Start typing...
    await session.client.stopTyping('5511972100922@c.us');
    //await sleep(1000);
};//Function iniciarEscrita

async function start(sessionName) {
    try {
        session = getSession(sessionName);
        console.log("Session inicio>>>" + " sessionName " + sessionName);
        if (session.state === undefined) { //create new session
            console.log("session == undefined");
            session = await addSesssion(sessionName);
        } else if (["CLOSED"].includes(session.state)) { //restart session
            console.log("session.state == CLOSED");
            session.state = "STARTING";
            session.status = 'notLogged';
            session.client = initSession(sessionName);
            console.log("session.client: " + session.client);
            //setup(sessionName);
        } else if (["CONFLICT", "UNPAIRED", "UNLAUNCHED"].includes(session.state)) {
            console.log("client.useHere()");
            session.client.then(client => {
                client.useHere();
            });
        } else {
            console.log("session.state: " + session.state);
        }
        console.log("funcao start");
        return session;
    }catch(error) {
        console.error(error);
        process.exit(1);
    }
}; //function start 

async function getSession(sessionName) {
    var foundSession = false;

    if(session === undefined){
        return foundSession;
    }
    else{
        foundSession = session;
    }
    console.log("funcao getSession  == " + foundSession.state);
    console.log("###funcao getSession###");
    return foundSession;
    
}; //function getSession

async function addSesssion(sessionName) {
    var newSession = {
        name: sessionName,
        hook:null,
        qrcode: false,
        client: false,
        status: 'notLogged',
        state: 'STARTING'
    }
    session = newSession;
    console.log("newSession.state: " + newSession.state);

    //setup session
    newSession.client = initSession(sessionName);
//   setup(sessionName);

    console.log("###funcao adddSession###");
    return newSession;
}; //function addSession


async function initSession(sessionName) {

    var sessionFunc = getSession(sessionName);
    sessionFunc.browserSessionToken = null;

        session.client = await venom.create(
        sessionName,
        (base64Qr, asciiQR, attempts) => {
            // session.state = "QRCODE";
            session.qrcode = base64Qr;
            console.log('Number attempts read qrcode: ', attempts);
            console.log('Terminal qrcode: ', asciiQR);
            // console.log('base64 qrcode: ', base64Qr);
        },
        // statusFind
        (statusSession, session) => {
            console.log('#### status = ' + statusSession + ' sessionName = ' + session + '####');
        }, {
            headless: true,
            devtools: false,
            //useChrome: false,
            debug: false,
            logQR: false,
            //Coloquei recente
            createPathFileToken: false,
            browserArgs: [
                '--log-level=3',
                '--no-default-browser-check',
                '--disable-site-isolation-trials',
                '--no-experiments',
                '--ignore-gpu-blacklist',
                '--ignore-certificate-errors',
                '--ignore-certificate-errors-spki-list',
                '--disable-gpu',
                '--disable-extensions',
                '--disable-default-apps',
                '--enable-features=NetworkService',
                '--disable-setuid-sandbox',
                '--no-sandbox',
                // Extras
                '--disable-webgl',
                '--disable-threaded-animation',
                '--disable-threaded-scrolling',
                '--disable-in-process-stack-traces',
                '--disable-histogram-customizer',
                '--disable-gl-extensions',
                '--disable-composited-antialiasing',
                '--disable-canvas-aa',
                '--disable-3d-apis',
                '--disable-accelerated-2d-canvas',
                '--disable-accelerated-jpeg-decoding',
                '--disable-accelerated-mjpeg-decode',
                '--disable-app-list-dismiss-on-blur',
                '--disable-accelerated-video-decode',
            ],
            refreshQR: 15000,
            autoClose: 60 * 60 * 24 * 365, //never
            disableSpins: true
        },
    );
    // var browserSessionToken = await session.client.getSessionTokenBrowser();
    console.log("###funcao initSession###");
    return client;
}; //function initSession


async function closeSession(sessionName) {
   // var filePath = '/home/bocao/Documentos/whatsappWeb/meuzap/tokens/session1.data.json'; 
    var sessionFunc = getSession(sessionName);
    if (sessionFunc) { //só adiciona se não existir
        console.log("entrou no if close");
        if (sessionFunc.state != "CLOSED") {
            if (sessionFunc.client)
                await session.client.then(async client => {
                    try {
                        await client.close();
                    } catch (error) {
                        console.log("client.close(): " + error.message);
                    }
                    sessionFunc.state = "CLOSED";
                    sessionFunc.client = false;
                    console.log("client.close - session.state: " + sessionFunc.state);
                });
            //fs.unlinkSync(filePath);
            return { result: "success", message: "CLOSED" };
        } else { //close
            return { result: "success", message: sessionFunc.state };
        }
    } else {
        return { result: "error", message: "NOTFOUND" };
    }
}; //close

process.stdin.resume();//so the program will not close instantly

async function exitHandler(options, exitCode) {

    console.log("entrou no exitHandler");
    if (options.cleanup) {
        console.log('cleanup');
    }
    if (exitCode || exitCode === 0) {
        console.log(exitCode);
        console.log("entrou no exitCode === 0");
    }
    if (options.exit) {
        console.log("entrou no exit");
        process.exit();
    }
}; //exitHandler 
//do something when app is closing
process.on('exit', exitHandler.bind(null, { cleanup: true }));
//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { exit: true }));
// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));
//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));