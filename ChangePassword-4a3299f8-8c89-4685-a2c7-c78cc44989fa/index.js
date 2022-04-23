const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {MongoClient} = require("mongodb");
const { ObjectID } = require("bson");

var mongoURI = `mongodb+srv://pascoal:N9mn5sXQFpE3bcJj@cluster0.jlhi5.mongodb.net/leave`;
const client = new MongoClient(mongoURI);

exports.handler = async (event) => {
     
    try {
        let auth = await jwt.verify(event.token,"SOMESECRETJIBBERJABBER");
        let id = ObjectID(event.user_id);
        delete event.user_id;
        delete event.token;

        await client.connect();
        var result = await client.db("leave").collection("user").findOne({"_id":id});

        if(await bcrypt.compare(event.currentpassword,result.password)){
            var result = await client.db("leave").collection("user").updateOne({"_id":id},{$set:{"password": await bcrypt.hash(event.newpassword,8)}});
            return {
                "status": "OK",
                "message": "Password Changed"
            }
        }
        else{
            return {
                "status": "FAIL",
                "message": "Current Password Does Not Match"
            }
        }

    } catch (error) {
        console.log(error);
        return {"status":"FAIL","message":"Error Occurred",error};
    } finally {
        await client.close();
    }
};

