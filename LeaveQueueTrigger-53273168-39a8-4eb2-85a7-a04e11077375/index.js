var AWS = require('aws-sdk');
AWS.config.update({region: 'ap-south-1'});

exports.handler = async (event,context) => {
    try{
        let el = JSON.parse(event.Records[0].body);
        let text = `Leave Request from ${el.fullname} from ${new Date(el.start_date).toGMTString()} to ${new Date(el.end_date).toGMTString()}`;
        text = text + `(((${el.description})))`;
        let messageParams = {
            Subject: `Leave Request - ${el.fullname}`,
            Message: text,
            TopicArn:el.TopicArn,
        };
        var publishTextPromise = await new AWS.SNS({apiVersion: '2010-03-31'}).publish(messageParams).promise();
        console.log(publishTextPromise);
        
    } catch(error) {
        console.log(error);
        return {
            statusCode: 400,
            error: JSON.stringify(error),
        };
    }
};
