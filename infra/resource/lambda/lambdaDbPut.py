import json
import os
import boto3


def lambda_handler(event, context):
    try:
        client = boto3.client('dynamodb')

        body = json.loads(event["body"])
        id = body["id"]
        input_text = body["input_text"]
        input_file_path = body["input_file_path"]

        data = {
            'id': {
                'S': str(id)
            },
            'input_text': {
                'S': input_text
            },
            'input_file_path': {
                'S': input_file_path
            }
        }
        # print(data)
        result = client.put_item(
            TableName=os.environ.get("TABLE_NAME", "filedb"),
            Item=data
        )
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            },
            'body': "Success"
        }
    except:
        return {
            'statusCode': 404,
            'headers': {
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            },
            'body': "Something went wrong!"
        }
