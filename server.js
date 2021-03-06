

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
//Twillio credential
var accountSid = 'ACc772c86ab5d54b0c4491c46a5e0f3d4e';
var authToken = '74656c21567f8edd15bcd405ff777828';
var client = require('twilio')(accountSid , authToken);


var formidable = require('formidable');


var hellosign = require('hellosign-sdk/lib/hellosign.js')({key: '9ed69561b84140c1b7a008f42037f5bc150ccc44c8c8784eb4e4197f546d713e'});
var number;

app.get('/', function(req, res){
  res.sendfile('index.html');


io.on('connection', function(socket){
    socket.on('info', function(info){
        number = info.phonenumber;
        sendRequest(info);
        sendText(info);
      })
  });
});

app.post('/callback', function(req, res){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
          if (JSON.parse(fields.json).event.event_type === 'signature_request_signed'){
                        client.sendSms({
                        to:number,
                        from:'+13154017636',
                        body:'Your document was received'
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
          res.status(200).send('Hello API Event Received');
    });
});



var sendRequest = function(info){
var options = {
    test_mode: 1,
    title: 'Ruben Abergel just sent you a doc',
    subject: 'Please sign the doc',
    message: 'Please sign this NDA and then we can discuss more. Let me know if you have any questions.',
    signers: [
        {
            email_address: info.email,
            name: info.name,
            pin : info.pin

        }
    ],
    files: ['NDA.pdf']
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


function sendText(info){
client.sendSms({
    to:info.phonenumber,
    from:'+13154017636',
    body:info.pin
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






var port = process.env.PORT || 3000;
http.listen(port, function (err) {
    console.log('listening on *:3000');
});