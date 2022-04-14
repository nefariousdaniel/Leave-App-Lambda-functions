const jwt = require("jsonwebtoken");
const { MongoClient } = require("mongodb");
const { ObjectID } = require("bson");
var AWS = require('aws-sdk');

AWS.config.update({region: 'ap-south-1'});

var sqs = new AWS.SQS({apiVersion: '2012-11-05'});


var mongoURI = `mongodb+srv://pascoal:N9mn5sXQFpE3bcJj@cluster0.jlhi5.mongodb.net/leave`;
const client = new MongoClient(mongoURI);

exports.handler = async function (event,context){
    
    try {
        let auth = await jwt.verify(event.token,"SOMESECRETJIBBERJABBER");
        event.user_id = ObjectID(auth._id);
        event.start_date = new Date(event.start_date)
        event.end_date = new Date(event.end_date);
        event.is_approved = Boolean(0);
        event.is_rejected = Boolean(0);
        event.created_time = new Date();
        event.company_id = ObjectID(auth.company_id);
        delete event.token;
        await client.connect();
        var result = await client.db("leave").collection("leave").insertOne(event);

        const message = {
            MessageBody:JSON.stringify({
                start_date: event.start_date,
                end_date: event.end_date,
                description: event.description,
                fullname: auth.fullname,
                TopicArn: `arn:aws:sns:ap-south-1:420019835347:${auth.company_id}`
            }),
            QueueUrl:"https://sqs.ap-south-1.amazonaws.com/420019835347/LeaveQueue",
            DelaySeconds:0,
        }
        
        var sqsResult =  await sqs.sendMessage(message).promise();
                
        console.log(sqsResult);
        return {"status":"OK","message":"Successfully Created Request"};

    } catch (error) {
        console.log(error);
        return {"status":"FAIL","message":"Error Occurred",error};
    } finally {
        await client.close();
    }
    
}