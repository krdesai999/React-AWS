import json
import boto3
import time
import os

AMI = 'ami-05fa00d4c63e32376'
INSTANCE_TYPE = 't2.micro'


def handle_insert(record):
    print("Handling INSERT Event")

    # Get newImage content
    newImage = record['dynamodb']['NewImage']

    # Parse values
    id = newImage['id']['S']
    inputText = newImage['inputText']['S']
    input_file_path = newImage['input_file_path']['S']

    try:
        ec2 = boto3.client('ec2', region_name=os.environ.get("REGION"))
        instance = ec2.create_instances(
            ImageId=AMI,
            InstanceType=INSTANCE_TYPE,
            MaxCount=1,
            MinCount=1
        )

        waiter = ec2.get_waiter('instance_running')
        print("New instance created: ")
        instance_id = instance['Instances'][0]['InstanceId']


        response = ec2.associate_iam_instance_profile(
            IamInstanceProfile={
                'Name': os.environ.get("EC2_ROLE")
            },
                InstanceId=instance_id
            )
        print("Permission assigned!")
        # time.sleep(111)

        ssm = boto3.client("ssm")
        commands = [f"aws s3 cp s3://{os.environ.get('BUCKET_NAME')}/{os.environ.get('APPEND_TO_FILE_SCRIPT')} .",
            "python3 -m pip install boto3",
            f"export TABLE_NAME={os.environ.get('TABLE_NAME')}",
            f"export REGION={os.environ.get('REGION')}",
            f"export BUCKET_NAME={os.environ.get('BUCKET_NAME')}",
            f"python3 {os.environ.get('APPEND_TO_FILE_SCRIPT')} --id '{id}' --inputText '{inputText}' --inputPath '{input_file_path}'",
            f"aws s3 cp {input_file_path.split('/')[-1]} s3://{os.environ.get('BUCKET_NAME')}/output_{input_file_path.split('/')[-1]}"
            ]

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
        ec2.terminate_instances(InstanceIds=[instance_id])
        ec2.get_waiter('instance_terminated')
        print('Terminated instance: ' + str(instance_id))


def lambda_handler(event, context):
    try:
        for record in event["Records"]:
            if record['eventName'] == 'INSERT':
                handle_insert(record)

        return {
                'statusCode': 200,
                'body': json.dumps({'message': 'Success!'})
            }

    except:
       return {
                'statusCode': 400,
                'body': json.dumps({'message': 'Bad request'})
            }
