const jwt = require("jsonwebtoken");
const { MongoClient } = require("mongodb");
const { ObjectID } = require("bson");
var AWS = require('aws-sdk');

AWS.config.update({region: 'ap-south-1'});

var sqs = new AWS.SQS({apiVersion: '2012-11-05'});


var mongoURI = `mongodb+srv://pascoal:eNgUpJZ8PWKmibmB@cluster0.jlhi5.mongodb.net/leave`;
const client = new MongoClient(mongoURI);

var sqsdata = {};

exports.handler = async function (event,context){

    
    try {
        let auth = await jwt.verify(event.token,"SOMESECRETJIBBERJABBER");
        if(!auth.is_admin) throw "Invalid Token";
        event.leave_id =  ObjectID(event.leave_id);
        event.user_id =  ObjectID(event.user_id);
        event.is_rejected = Boolean(parseInt(0));
        if(event.is_approved === 0) event.is_rejected = Boolean(parseInt(1));
        event.is_approved =  Boolean(parseInt(event.is_approved));

        await client.connect();
        event.number_of_days  = parseInt(0);
        let res = await client.db("leave").collection("leave").findOne({"_id":event.leave_id});
        sqsdata.leave = res;
        if(event.is_approved){
            let date = new Date(res.start_date).getTime() - new Date(res.end_date).getTime();
            date = date / (1000 * 60 * 60 * 24);
            date = (Math.round(date)-1);
            event.number_of_days = parseInt(date);
        }
        
        var result = await client.db("leave").collection("leave").updateOne({_id:event.leave_id},{$set:{is_approved:event.is_approved,is_rejected:event.is_rejected}});
        if(result.matchedCount === 0) throw "Something went wrong while approving";
        result = await client.db("leave").collection("user").updateOne({email:event.email},{$inc:{leave_balance: event.number_of_days}});
        var userResult = await client.db("leave").collection("user").findOne({"_id":sqsdata.leave.user_id});
        sqsdata.user = userResult;
        sqsdata.approvedBy = auth;

        console.log(sqsdata)
        
        const SQSMessage = {
            MessageBody:JSON.stringify(sqsdata),
            QueueUrl:"https://sqs.ap-south-1.amazonaws.com/420019835347/LeaveAppIntegrationQueue",
            DelaySeconds:10,
        }

        var SQSResult =  await sqs.sendMessage(SQSMessage).promise();

        return {"status":"OK","message":"Successful"};

    } catch (error) {
        console.log(error);
        return {"status":"FAIL","message":"Error Occurred",error};
    } finally {
        await client.close();
    }
}