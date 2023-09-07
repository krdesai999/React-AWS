import boto3
import os

import argparse

print("Inside append to file in ec2")
argParser = argparse.ArgumentParser()
argParser.add_argument("-i", "--id", help="ID of the row")
argParser.add_argument("-it", "--inputText", help="Input text to be append")
argParser.add_argument("-ip", "--inputPath", help="Input Path of the uploaded file")

print("Parsing the command line arguments")
args = argParser.parse_args()

print("creating client")
s3 = boto3.resource('s3')
dynamodb_client = boto3.client('dynamodb', region_name="us-east-1")

print("getting item from table")
#retrive data from DB
response = dynamodb_client.get_item(
    TableName=os.environ.get("TABLE_NAME"),
    Key={
        'id': {'S': args.id}
    }
)
print(response['Item'])

print("appending to file")
# Append input text to file
with open(args.inputPath.split('/')[-1], "a") as myfile:
    myfile.write("\n"+args.inputText)

print("Updating the table")
#add new entry in DB
data = dynamodb_client.put_item(
    TableName=os.environ.get("TABLE_NAME"),
    Item={
        'id': {
            'S': args.id
        },
        'input_text': {
            'S': args.inputText
        },
        'input_file_path': {
            'S': str(args.inputPath)
        },
        'output_file_path': {
            'S': f"output_{args.inputPath.split('/')[-1]}"
        }
    }
)

print("Complete append file in ec2")