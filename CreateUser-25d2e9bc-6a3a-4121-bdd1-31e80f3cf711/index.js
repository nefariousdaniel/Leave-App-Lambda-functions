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


var data = {
    fullname: "some guy",
    email: "nefariousdaniel@gmail.com",
    password: "qwertyuiop",
    is_admin: Boolean(true),
    leave_balance: 15,
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MjU1YWZmZmZlZDc3ZGRkMzliNzA0N2UiLCJjb21wYW55X2lkIjoiNjI1NWFmZmVmZWQ3N2RkZDM5YjcwNDdjIiwiZnVsbG5hbWUiOiJQYXNjb2FsIERhbmllbCBGZXJuYW5kZXMiLCJlbWFpbCI6InBhc2NvYWxAYWplbmN5LmluIiwibGVhdmVfYmFsYW5jZSI6MTUsImlzX2FkbWluIjp0cnVlLCJjcmVhdGVkX3RpbWUiOiIyMDIyLTA0LTEyVDE2OjU5OjQyLjA3N1oiLCJ1cGRhdGVkX3RpbWUiOiIyMDIyLTA0LTEyVDE2OjU5OjQyLjA3N1oiLCJpYXQiOjE2NDk3ODMwMjB9.BCphgoRUitusIqb14MHx3rFLzx72xImwFyv-c0oO_kY"
}

this.handler(data).then(e=>{
    console.log(e)
})