const jwt = require("jsonwebtoken");
const { MongoClient } = require("mongodb");
const { ObjectID } = require("bson");
var AWS = require('aws-sdk');

AWS.config.update({region: 'ap-south-1'});


var mongoURI = `mongodb+srv://pascoal:N9mn5sXQFpE3bcJj@cluster0.jlhi5.mongodb.net/leave`;
const client = new MongoClient(mongoURI);

exports.handler = async function (event,context){
    
    try {
        let auth = await jwt.verify(event.token,"SOMESECRETJIBBERJABBER");
        if(!auth.is_admin) throw "Invalid Token";
        await client.connect();
        
        let topicARN = `arn:aws:sns:ap-south-1:420019835347:${auth.company_id.toString()}`
        let subs = await new AWS.SNS({apiVersion: '2010-03-31'}).listSubscriptionsByTopic({TopicArn: topicARN}).promise();
        console.log(subs);
        subs.Subscriptions.forEach(async (el)=>{
            console.log(el.SubscriptionArn);
            let subscribePromise = await new AWS.SNS({apiVersion: '2010-03-31'}).unsubscribe({SubscriptionArn : el.SubscriptionArn}).promise();
        })
        var deleteTopicPromise = await new AWS.SNS({apiVersion: '2010-03-31'}).deleteTopic({TopicArn: topicARN}).promise();
        
        var result = await client.db("leave").collection("company").deleteOne({"_id":ObjectID(auth.company_id)});
        var result = await client.db("leave").collection("user").deleteMany({"company_id":ObjectID(auth.company_id)});
        var result = await client.db("leave").collection("leave").deleteMany({"company_id":ObjectID(auth.company_id)});
        if(result.deletedCount === 0) throw "Company Does Not Exist."
        
        

        
        return {"status":"OK","message":"Company Has been Closed"};

    } catch (error) {
        console.log(error);
        return {"status":"FAIL","message":"Failed To Close Company",error};
    } finally {
        await client.close();
    }
}
