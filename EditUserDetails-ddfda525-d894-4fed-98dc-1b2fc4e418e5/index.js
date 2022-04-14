const jwt = require("jsonwebtoken");
const { MongoClient } = require("mongodb");
const { ObjectID } = require("bson");

var mongoURI = `mongodb+srv://pascoal:N9mn5sXQFpE3bcJj@cluster0.jlhi5.mongodb.net/leave`;
const client = new MongoClient(mongoURI);



exports.handler = async function (event,context){
    
    try {
        let auth = await jwt.verify(event.token,"SOMESECRETJIBBERJABBER");
        if(!auth.is_admin) throw "Invalid Token";
        let id = ObjectID(event.user_id);
        delete event.user_id;
        delete event.token;
        event.leave_balance = Number(event.leave_balance);
        event.updated_time = new Date();
        await client.connect();
        var result = await client.db("leave").collection("user").updateOne({_id:id},{$set:event});
        if(result.matchedCount === 0) throw "Something went wrong while approving";
        return {"status":"OK","message":"Successfully Edited Details"};

    } catch (error) {
        console.log(error);
        return {"status":"FAIL","message":"Error Occurred",error};
    } finally {
        await client.close();
    }
}


