const jwt = require("jsonwebtoken");
const { MongoClient } = require("mongodb");
const { ObjectID } = require("bson");
var nodemailer = require('nodemailer');
const bcrypt = require("bcryptjs");
var AWS = require('aws-sdk');

AWS.config.update({region: 'ap-south-1'});



var mongoURI = `mongodb+srv://pascoal:N9mn5sXQFpE3bcJj@cluster0.jlhi5.mongodb.net/leave`;
const client = new MongoClient(mongoURI);



exports.handler = async function (event,context){


    try {
        let auth = await jwt.verify(event.token,"SOMESECRETJIBBERJABBER");
        if(!auth.is_admin) throw "Invalid Token";
        

        let userData = {
            "company_id": ObjectID(auth.company_id),
            "fullname": event.fullname,
            "email": event.email,
            "password": await bcrypt.hash(event.password,8),
            "leave_balance": parseInt(event.leave_balance),
            "is_admin": Boolean(event.is_admin),
            "created_time": new Date(),
            "updated_time": new Date()
            
        };

        await client.connect();
        var result = await client.db("leave").collection("user").insertOne(userData);

        if(userData.is_admin){
            var params = {
                Protocol: 'EMAIL', /* required */
                TopicArn: `arn:aws:sns:ap-south-1:420019835347:${auth.company_id}`, /* required */
                Endpoint: event.email
              };
              
              var subscribePromise = new AWS.SNS({apiVersion: '2010-03-31'}).subscribe(params).promise();
        }

        var transporter = nodemailer.createTransport({
            host: "smtp-mail.outlook.com", // hostname
            secureConnection: false, // TLS requires secureConnection to be false
            port: 587, // port for secure SMTP
            tls: {
               ciphers:'SSLv3'
            },
            auth: {
                user: 'leavemanagementapp@outlook.com',
                pass: 'qwertyuiop1234567890'
            }
        });

        var mailOptions = {
            from: 'leavemanagementapp@outlook.com', // sender address (who sends)
            to: `${event.email}`, // list of receivers (who receives)
            subject: 'Leave Management Credentials ', // Subject line
            html: `<h1>Leave Management Credentials</h1>
            <p>E-mail: ${event.email} </p>
            <p>Password: ${event.password} </p>
            <p>PLEASE DO NOT SHARE THIS EMAIL TO ANYONE.</p>` // html body
        };

        console.log(await transporter.sendMail(mailOptions));

        return {"status":"OK","message":"Successful"};

    } catch (error) {
        console.log(error);
        return {"status":"FAIL","message":"Error Occurred",error};
    } finally {
        await client.close();
    }
};
