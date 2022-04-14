const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { MongoClient } = require("mongodb");

var mongoURI = `mongodb+srv://pascoal:N9mn5sXQFpE3bcJj@cluster0.jlhi5.mongodb.net/leave`;
const client = new MongoClient(mongoURI);

exports.handler = async function (event,context){
    
    try {
        await client.connect();
        let data = await client.db("leave").collection("user").findOne({"email":event.email});
        if(await bcrypt.compare(event.password,data.password) == false){
            throw "Password Does Not Match";
        }
        delete data.password;
        let token = jwt.sign(data,"SOMESECRETJIBBERJABBER");
        return {"status":"OK","message":"Auth Successful","token":token};

    } catch (error) {        
        console.log(error);
        return {"status":"FAIL","message":"Auth Fail"};
    } finally {
        await client.close();
    }
    
}

