import json
import boto3
import time
import os

AMI = 'ami-051f7e7f6c2f40dc1'
INSTANCE_TYPE = 't2.micro'
KEY_NAME = "FirstKeyPair"


def handle_insert(record):
    print("Handling INSERT Event")

    print("Getting new image")
    # Get newImage content
    newImage = record['dynamodb']['NewImage']

    print("Parsing values")
    # Parse values
    id = newImage['id']['S']
    inputText = newImage['input_text']['S']
    input_file_path = newImage['input_file_path']['S']

    try:
        instance_id = os.environ.get("EC2_INSTANCE_ID")

        print("creating ssm client")
        # SSM client creating
        ssm = boto3.client("ssm")

        print("Creating commands")
        # Commands creating
        commands = [f"aws s3 cp s3://{os.environ.get('BUCKET_NAME')}/{os.environ.get('APPEND_TO_FILE_SCRIPT')} .",
                    "python3 -m pip install boto3",
                    f"export TABLE_NAME={os.environ.get('TABLE_NAME')}",
                    f"export REGION={os.environ.get('REGION')}",
                    f"export BUCKET_NAME={os.environ.get('BUCKET_NAME')}",
                    f"python3 {os.environ.get('APPEND_TO_FILE_SCRIPT')} --id '{id}' --inputText '{inputText}' --inputPath '{input_file_path}'",
                    f"aws s3 cp {input_file_path.split('/')[-1]} s3://{os.environ.get('BUCKET_NAME')}/output_{input_file_path.split('/')[-1]}",
                    ]

        print("sending commands")
        # Sending command to ec2
        response = ssm.send_command(
            InstanceIds=[instance_id],
            DocumentName="AWS-RunShellScript",
            Parameters={
                "commands": commands
            },
        )

        print("Getting command id")
        time.sleep(50)
        command_id = response["Command"]["CommandId"]

        # Command output
        output = ssm.get_command_invocation(
            CommandId=command_id, InstanceId=instance_id)
        print(output)
        # print(instance['Instances'][0]['State'])

    except Exception as e:
        print("Exception: ")
        print(e)
    finally:
        # ec2.stop_instances(InstanceIds=[instance_id])
        # ec2.get_waiter('instance_terminated')
        # print('Terminated instance: ' + str(instance_id))
        print("exiting insert handler")


def lambda_handler(event, context):
    try:
        for record in event["Records"]:
            if record['eventName'] == 'INSERT':
                handle_insert(record)

        print("Completed the ec2 trigger")
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Success!'})
        }

    except:
       print("Something went wrong in trigger")
       return {
           'statusCode': 400,
           'body': json.dumps({'message': 'Bad request'})
       }
