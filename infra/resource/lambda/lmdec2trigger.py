import json
import boto3
import time
import os

AMI = 'ami-05fa00d4c63e32376'
INSTANCE_TYPE = 't2.micro'


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
        print("creating client")
        ec2 = boto3.resource('ec2')
        print("creating ec2")
        instance = ec2.create_instances(
            ImageId=AMI,
            InstanceType=INSTANCE_TYPE,
            MaxCount=1,
            MinCount=1,
            IamInstanceProfile={
                'Name': f'{os.environ.get("EC2_INSTANCE_PROFILE_NAME")}'
            },
        )

        print("New instance created: ")
        print(instance[0])
        instance_id = instance[0].instance_id
        # time.sleep(111)

        # SSM client creating
        ssm = boto3.client("ssm")

        # Commands creating
        commands = [f"aws s3 cp s3://{os.environ.get('BUCKET_NAME')}/{os.environ.get('APPEND_TO_FILE_SCRIPT')} .",
            "python3 -m pip install boto3",
            f"export TABLE_NAME={os.environ.get('TABLE_NAME')}",
            f"export REGION={os.environ.get('REGION')}",
            f"export BUCKET_NAME={os.environ.get('BUCKET_NAME')}",
            f"python3 {os.environ.get('APPEND_TO_FILE_SCRIPT')} --id '{id}' --inputText '{inputText}' --inputPath '{input_file_path}'",
            f"aws s3 cp {input_file_path.split('/')[-1]} s3://{os.environ.get('BUCKET_NAME')}/output_{input_file_path.split('/')[-1]}"
            ]

        # Sending command to ec2
        response = ssm.send_command(
            InstanceIds=[instance_id],
            DocumentName="AWS-RunShellScript",
            Parameters={
                "commands": commands
            },
        )

        time.sleep(50)
        command_id = response["Command"]["CommandId"]

        # Command output
        output = ssm.get_command_invocation(
            CommandId=command_id, InstanceId=instance_id)
        print(output)
        print(instance['Instances'][0]['State'])

    except Exception as e:
        print("Exception: ")
        print(e)
    finally:
        time.sleep(50)
        ec2.terminate()
        ec2 = boto3.client('ec2')

        response = ec2.terminate_instances(
            InstanceIds=[
                instance_id,
            ],
        )
        ec2.terminate_instances(InstanceIds=[instance_id])
        ec2.get_waiter('instance_terminated')
        print('Terminated instance: ' + str(instance_id))


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
