const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { MongoClient } = require("mongodb");
const { ObjectID } = require("bson");


var mongoURI = `mongodb+srv://pascoal:N9mn5sXQFpE3bcJj@cluster0.jlhi5.mongodb.net/leave`;
const client = new MongoClient(mongoURI);

exports.handler = async function (event,context){
    
    try {
        let auth = await jwt.verify(event.token,"SOMESECRETJIBBERJABBER");
        if(!auth.is_admin) throw "Invalid Token";
        await client.connect();
        var result = await client.db("leave").collection("user").deleteOne({"_id":ObjectID(event.user_id)});
        var result2 = await client.db("leave").collection("leave").deleteMany({"user_id":ObjectID(event.user_id)});
        if(result.deletedCount === 0) throw "Account Does Not Exist."
        return {"status":"OK","message":"Successfully Deleted User"};

    } catch (error) {
        console.log(error);
        return {"status":"FAIL","message":"Failed To Delete User",error};
    } finally {
        await client.close();
    }
}