const jwt = require("jsonwebtoken");
const { MongoClient } = require("mongodb");
const { ObjectID } = require("bson");
const bcrypt = require("bcryptjs");
var AWS = require('aws-sdk');

AWS.config.update({region: 'ap-south-1'});

var mongoURI = `mongodb+srv://pascoal:N9mn5sXQFpE3bcJj@cluster0.jlhi5.mongodb.net/leave`;
const client = new MongoClient(mongoURI);



exports.handler = async function (event,context){
    await client.connect();

    try {
        let companyData = {
            "_id": ObjectID(),
            "name": event.company_name,
            "address": event.company_address,
            "created_time": new Date(),
            "updated_time": new Date()
        };
        let userData = {
            "company_id": companyData._id,
            "fullname": event.fullname,
            "email": event.email,
            "password": await bcrypt.hash(event.password,8),
            "leave_balance": parseInt(15),
            "is_admin": Boolean(true),
            "created_time": companyData.created_time,
            "updated_time": companyData.updated_time
            
        };
        
        var userInsertResult = await client.db("leave").collection("user").insertOne(userData);
        var companyInsertResult = await client.db("leave").collection("company").insertOne(companyData);
        


        var createTopicPromise =  await new AWS.SNS({apiVersion: '2010-03-31'}).createTopic({Name: companyData._id.toString()}).promise();

        var params = {
          Protocol: 'EMAIL', /* required */
          TopicArn: createTopicPromise.TopicArn, /* required */
          Endpoint: userData.email
        };
        
        var subscribePromise = new AWS.SNS({apiVersion: '2010-03-31'}).subscribe(params).promise();


        
        return {"status":"OK","message":"Successful"};

    } catch (error) {
        return {"status":"FAIL","message":"Error Occurred",error};
    } finally {
        await client.close();
    }
};


var data = {
    "fullname": "Pascoal Daniel Fernandes",
    "company_name": "Some Company",
    "company_address": "Somewhere, Some Street, Some City",
    "email": "pascoal@ajency.in",
    "password": "adminpassword"
}

this.handler(data).then(e=>{
    console.log(e);
})