const jwt = require("jsonwebtoken");
const { MongoClient } = require("mongodb");
const { ObjectID } = require("bson");

var mongoURI = `mongodb+srv://pascoal:N9mn5sXQFpE3bcJj@cluster0.jlhi5.mongodb.net/leave`;
const client = new MongoClient(mongoURI);

exports.handler = async function (event,context){
    
    try{
        var auth = jwt.verify(event.token,"SOMESECRETJIBBERJABBER");
        await client.connect();
        var searchQuery={
            "company_id":ObjectID(auth.company_id)
        };
        var searchOptions ={
            projection:{password:0},limit:event.limit,skip:event.skip
        };
        let cursor = client.db("leave").collection("user").find(searchQuery,searchOptions);
        let data = [];
        await cursor.forEach(el=>{
            data.push(el);
        });
        return {"status":"OK","message":"Successful",data};
    } catch(error) {
        console.log(error);
        return {"status":"FAIL","message":"Error Occurred",error};
    } finally {
        await client.close();
    }
    
}
