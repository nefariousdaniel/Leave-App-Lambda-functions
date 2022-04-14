const jwt = require("jsonwebtoken");
const { MongoClient } = require("mongodb");
const { ObjectID } = require("bson");

var mongoURI = `mongodb+srv://pascoal:N9mn5sXQFpE3bcJj@cluster0.jlhi5.mongodb.net/leave`;
const client = new MongoClient(mongoURI);

exports.handler = async function (event,context){
    
    try{
        var auth = jwt.verify(event.token,"SOMESECRETJIBBERJABBER");
        await client.connect();
        const pipeline = [
            {
                $sort:{ "created_time":-1 }
            },
            {
                $match: { "user_id":{$eq:ObjectID(auth._id)} }
            },
            {
                $skip: event.skip
            },
            {
                $limit: event.limit
            },
            {
                $project: { "user.password":0 }
            }
            
        ];
        var data = [];
        const aggCursor = client.db('leave').collection("leave").aggregate(pipeline);
        for await (const doc of aggCursor) {
            data.push(doc);
        }
        return {"status":"OK","message":"Successful",data};
    } catch(error) {
        console.log(error);
        return {"status":"FAIL","message":"Error Occurred",error};
    } finally {
        await client.close();
    }
    
}

