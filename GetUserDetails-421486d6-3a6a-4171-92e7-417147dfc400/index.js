const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { MongoClient } = require("mongodb");
const { ObjectID } = require("bson");

var mongoURI = `mongodb+srv://pascoal:N9mn5sXQFpE3bcJj@cluster0.jlhi5.mongodb.net/leave`;
const client = new MongoClient(mongoURI);

exports.handler = async function (event,context){
    
    try{
        var auth = jwt.verify(event.token,"SOMESECRETJIBBERJABBER");
        await client.connect();
        if(event.user_id){
            console.log("true")
        }
        //let data = await client.db("leave").collection("user").findOne({"_id":ObjectID(auth._id)});
        const pipeline = [
            {
                $match: {"_id": event.user_id ? ObjectID(event.user_id) : ObjectID(auth._id) }
            },{
                $lookup: {
                  from: 'company',
                  localField: 'company_id',
                  foreignField: '_id',
                  as: 'company'
                }
            },{
                $lookup: {
                  from: 'leave',
                  localField: '_id',
                  foreignField: 'user_id',
                  as: 'leaves'
                }
            },{
                $addFields:{"number_of_leaves": {$sum: "$leaves.number_of_days"}}
            },{
                $project: {"password": 0, "leaves": 0}
            }
        ];
        var data = [];
        const aggCursor = client.db('leave').collection("user").aggregate(pipeline);
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