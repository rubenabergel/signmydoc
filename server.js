

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
//Twillio credential
var accountSid = 'ACc772c86ab5d54b0c4491c46a5e0f3d4e';
var authToken = '74656c21567f8edd15bcd405ff777828';
var client = require('twilio')(accountSid , authToken);
var formidable = require('formidable');
var hellosign = require('hellosign-sdk/lib/hellosign.js')({key: '9ed69561b84140c1b7a008f42037f5bc150ccc44c8c8784eb4e4197f546d713e'});


var mongoose = require('mongoose');
mongoose.connect('mongodb://rubenabergel:qwerty@dogen.mongohq.com:10091/SignMe');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

var ngrok = require('ngrok/index.js');

ngrok.connect(8080, function (err, url) {
    // https://757c1652.ngrok.com -> 127.0.0.1:8080
});

var Request = mongoose.model('Request', {
    pin : String,
    file : String,
    sender:{
        name : String,
        email: String,
        phonenumber: String

      },
      recipient : {
        name : String,
        email: String,
        phonenumber: String
      },
});

app.get('/', function(req, res){
  res.sendfile('index.html');


io.on('connection', function (socket){
    socket.on('info', function (info){
    var promise = Request.findOne({'pin': info.pin, createAt:info.createdAt}).exec();
    promise.then(function (data) {
        if (data) {
            console.log('you already submited this document the that person')
        } else {

            var newRequest = new Request(info);
            newRequest.save(function (err) {
                sendRequest(info);
                sendText(info.pin, info.recipient.phonenumber);

                if (err) // ...
                    console.log('err', err);
            });
        }
    });

    socket.on('error', function(err) {
    if(err === 'handshake error') {
      console.log('handshake error', err);
    } else {
      console.log('io error', err);
    }
  });

});

});
});
app.post('/callback', function(req, res){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
          if (JSON.parse(fields.json).event.event_type === 'signature_request_signed'){
                var requester = JSON.parse(fields.json).signature_request.requester_email_address ;
                var signer = JSON.parse(fields.json).signature_request.signatures[0].signer_email_address ;
                var promise = Request.findOne({'recipient.email': requester, 'sender.email': signer }).exec();
                    promise.then(function (data) {
                    if (data) {
                        sendText('The document was received, thank you', data.recipient.phonenumber);
                        sendText('Your document was just signed! We sent you a confirmation by email.', data.sender.phonenumber);
                    }
                    if (err) // ...
                    console.log('err', err);
            });
        }
    });
          res.status(200).send('Hello API Event Received');
    });



function sendRequest(info){
var options = {
    test_mode: 1,
    title: 'You have something to sign',
    subject: 'Please sign the doc',
    message: 'Please sign this document. Let me know if you have any questions.',
    signers: [
        {
            email_address: 'ruben.abergel@gmail.com',
            name: 'ruben',
            pin : info.pin

        }
    ],
    file_url: [info.file]
};

hellosign.signatureRequest.send(options)
    .then(function(response){
        //parse response
    })
    .catch(function(err){
         console.log('err',err);
        //catch error
    });
}


function sendText(body, to){
client.sendSms({
    to:to,
    from:'+13154017636',
    body:body
}, function(error, message) {
    if (!error) {
        console.log('Success! The SID for this SMS message is:');
        console.log(message.sid);
        console.log('Message sent on:');
        console.log(message.dateCreated);
    } else {
        console.log('Oops! There was an error.', error);
    }
});
}

// function sendText(body){
// client.sendSms({
//     to:info.recipient.phonenumber,
//     from:'+13154017636',
//     body:info.pin
// }, function(error, message) {
//     if (!error) {
//         console.log('Success! The SID for this SMS message is:');
//         console.log(message.sid);
//         console.log('Message sent on:');
//         console.log(message.dateCreated);
//     } else {
//         console.log('Oops! There was an error.', error);
//     }
// });
// }







var port = process.env.PORT || 8080;
http.listen(port, function (err) {
    console.log('listening on *:8080');
});