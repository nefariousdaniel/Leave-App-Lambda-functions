const jwt = require("jsonwebtoken");
const { MongoClient } = require("mongodb");
const { ObjectID } = require("bson");
var nodemailer = require('nodemailer');


var mongoURI = `mongodb+srv://pascoal:N9mn5sXQFpE3bcJj@cluster0.jlhi5.mongodb.net/leave`;
const client = new MongoClient(mongoURI);



exports.handler = async function (event,context){

    var maildata = {};
    
    try {
        let auth = await jwt.verify(event.token,"SOMESECRETJIBBERJABBER");
        if(!auth.is_admin) throw "Invalid Token";
        event.leave_id =  ObjectID(event.leave_id);
        event.user_id =  ObjectID(event.user_id);
        event.is_rejected = Boolean(parseInt(0));
        if(event.is_approved === 0) event.is_rejected = Boolean(parseInt(1));
        event.is_approved =  Boolean(parseInt(event.is_approved));
        maildata.is_approved = event.is_approved;

        await client.connect();
        event.number_of_days  = parseInt(0);
        let res = await client.db("leave").collection("leave").findOne({"_id":event.leave_id});
        maildata.start_date = res.start_date.toString();
        maildata.end_date = res.end_date.toString();
        maildata.description = res.description;
        if(event.is_approved){
            let date = new Date(res.start_date).getTime() - new Date(res.end_date).getTime();
            date = date / (1000 * 60 * 60 * 24);
            date = (Math.round(date)-1);
            event.number_of_days = parseInt(date);
        }
        
        var result = await client.db("leave").collection("leave").updateOne({_id:event.leave_id},{$set:{is_approved:event.is_approved,is_rejected:event.is_rejected}});
        if(result.matchedCount === 0) throw "Something went wrong while approving";
        result = await client.db("leave").collection("user").updateOne({email:event.email},{$inc:{leave_balance: event.number_of_days}});


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
            subject: 'Leave Management Status ', // Subject line
            html: `<h1>Leave Management Status</h1>
            <p>Your leave approval from: </p>
            <p>From: ${maildata.start_date}</p>
            <p>To: ${maildata.end_date} </p>
            <p>For: <i>${maildata.description}</i> </p>
            <p>is <b>${maildata.is_approved ? "Approved" : "Rejected"}</b></p>` // html body
        };

        console.log(await transporter.sendMail(mailOptions));

        return {"status":"OK","message":"Successful"};

    } catch (error) {
        console.log(error);
        return {"status":"FAIL","message":"Error Occurred",error};
    } finally {
        await client.close();
    }
}


