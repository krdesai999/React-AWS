const {
  IdentityPool,
  UserPoolAuthenticationProvider,
} = require("@aws-cdk/aws-cognito-identitypool-alpha");

const { Instance, InstanceType, InstanceClass, InstanceSize, AmazonLinuxImage, AmazonLinuxGeneration, Vpc, IpAddresses } = require("aws-cdk-lib/aws-ec2");

const {
  Stack,
  RemovalPolicy,
  SecretValue,
  CfnOutput,
  Duration,
} = require("aws-cdk-lib");
const { UserPool } = require("aws-cdk-lib/aws-cognito");
const { App, GitHubSourceCodeProvider } = require("@aws-cdk/aws-amplify-alpha");
const { BlockPublicAccess, Bucket } = require("aws-cdk-lib/aws-s3");
const {
  RestApi,
  LambdaIntegration,
  CognitoUserPoolsAuthorizer,
  AuthorizationType,
  Cors,
} = require("aws-cdk-lib/aws-apigateway");
const {
  Function,
  Runtime,
  Code,
  StartingPosition,
} = require("aws-cdk-lib/aws-lambda");
const {
  Table,
  AttributeType,
  StreamViewType,
} = require("aws-cdk-lib/aws-dynamodb");
const { DynamoEventSource } = require("aws-cdk-lib/aws-lambda-event-sources");

const config = require("../config.js");
const {
  Role,
  ServicePrincipal,
  ManagedPolicy,
  InstanceProfile,
  PolicyStatement,
  Effect,
} = require("aws-cdk-lib/aws-iam");
const { BucketDeployment, Source } = require("aws-cdk-lib/aws-s3-deployment");

class InfraStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    const vpc = new Vpc(this, "Vpc", {
      ipAddresses: IpAddresses.cidr("10.0.0.0/16"),
    });
    vpc.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // Role for ec2
    const ec2Role = new Role(this, "ec2Role", {
      assumedBy: new ServicePrincipal("ec2.amazonaws.com"),
    });

    ec2Role.applyRemovalPolicy(RemovalPolicy.DESTROY);

    const ec2 = new Instance(this, "targetInstance", {
      vpc: vpc,
      instanceType: InstanceType.of(
        InstanceClass.T2,
        InstanceSize.MICRO
      ),
      machineImage: new AmazonLinuxImage({
        generation: AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      role: ec2Role,
    });

    ec2.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // Cognito user pool
    const usersPool = new UserPool(this, "Users", {
      userPoolName: "UsersTest",
      signInCaseSensitive: false,
      selfSignUpEnabled: true,
      autoVerify: {
        email: true,
      },
      signInAliases: {
        email: true,
      },
      passwordPolicy: {
        minLength: 6,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const userPoolID = usersPool.userPoolId;

    // Client ID
    const client = usersPool.addClient("ReactApp");
    const clientID = client.userPoolClientId;

    // identity pool
    const identityPool = new IdentityPool(this, "myIdentityPool", {
      identityPoolName: "myidentitypool",
      authenticationProviders: {
        userPools: [
          new UserPoolAuthenticationProvider({
            userPool: usersPool,
            userPoolClient: client,
          }),
        ],
      },
    });

    identityPool.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // s3
    const myS3 = new Bucket(this, config.s3Config.bucketName, {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const appendToFile = "appendToFile.py";
    new BucketDeployment(this, "DeployWebsite", {
      sources: [Source.asset(`resource/ec2Script`)],
      destinationBucket: myS3,
    });

    myS3.addCorsRule(config.s3Config.corsRules);

    // Grant permission to authenticated users
    myS3.grantPut(identityPool.authenticatedRole);

    //Dynamodb table definition
    const filedb = new Table(this, "filedb", {
      partitionKey: { name: "id", type: AttributeType.STRING },
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Insert to dynamodb lambda function
    const lambdaDbPut = new Function(this, "lambdaDbPut", {
      functionName: "lambdaDbPut",
      runtime: Runtime.PYTHON_3_9,
      timeout: Duration.seconds(20),
      code: Code.fromAsset("resource/lambda"),
      handler: "lambdaDbPut.lambda_handler",
      environment: {
        TABLE_NAME: filedb.tableName,
      },
    });

    lambdaDbPut.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // permissions to lambda to dynamo table
    filedb.grantWriteData(lambdaDbPut);

    // Cognito authorizer
    const auth = new CognitoUserPoolsAuthorizer(this, "dynamo-put-Authorizer", {
      cognitoUserPools: [usersPool],
    });

    // Api gateway
    const UploadtoDbAPI = new RestApi(this, "insert-to-dynamo-api", {
      defaultCorsPreflightOptions: {
        allowOrigins: ["*"],
        allowMethods: Cors.ALL_METHODS,
      },
    });

    UploadtoDbAPI.applyRemovalPolicy(RemovalPolicy.DESTROY);

    UploadtoDbAPI.root.addMethod("POST", new LambdaIntegration(lambdaDbPut), {
      authorizer: auth,
      authorizationType: AuthorizationType.COGNITO,
    });

    ec2Role.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMFullAccess")
    );

    // Granting necessary permissions to ec2 instance to be created
    ec2Role.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess")
    );
    ec2Role.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess")
    );
    ec2Role.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMFullAccess")
    );
    ec2Role.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
    );

    const ec2InstanceProfile = new InstanceProfile(this, "ec2InstanceProfile", {
      Role: ec2Role,
    });

    ec2InstanceProfile.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // lambda trigger ec2 creation
    const lmdec2trigger = new Function(this, "lmdec2trigger", {
      functionName: "lmdec2trigger",
      runtime: Runtime.PYTHON_3_9,
      timeout: Duration.seconds(900),
      code: Code.fromAsset("resource/lambda"),
      handler: "lmdec2trigger.lambda_handler",
      environment: {
        TABLE_NAME: filedb.tableName,
        BUCKET_NAME: myS3.bucketName,
        EC2_INSTANCE_PROFILE_NAME: ec2InstanceProfile.instanceProfileName,
        REGION: this.region,
        APPEND_TO_FILE_SCRIPT: appendToFile,
        EC2_INSTANCE_ID: ec2.instanceId,
      },
    });

    lmdec2trigger.applyRemovalPolicy(RemovalPolicy.DESTROY);

    lmdec2trigger.role.addToPolicy(
      new PolicyStatement({
        resources: [ec2InstanceProfile.role.roleArn],
        effect: Effect.ALLOW,
        actions: ["iam:PassRole"],
      })
    );

    lmdec2trigger.role.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMFullAccess")
    );
    lmdec2trigger.role.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2FullAccess")
    );
    lmdec2trigger.addEventSource(
      new DynamoEventSource(filedb, {
        startingPosition: StartingPosition.TRIM_HORIZON,
        batchSize: 1,
      })
    );

    // Amplify
    const amplifyApp = new App(this, "Front-end-app", {
      description: "Frontend Code",
      sourceCodeProvider: new GitHubSourceCodeProvider({
        owner: config.githubConfig.owner,
        repository: config.githubConfig.repository,
        oauthToken: SecretValue.unsafePlainText(config.githubConfig.oauthToken),
      }),
      environmentVariables: {
        S3_BUCKET: myS3.bucketName,
        USER_POOL_ID: userPoolID,
        IDENTITY_POOL_ID: identityPool.identityPoolId,
        CLIENT_ID: clientID,
        REGION: this.region,
        API_BASE_URL: UploadtoDbAPI.root.url,
      },
    });

    amplifyApp.addBranch(config.githubConfig.productionBranch);

    // Print out in the console; url of the amplify lauched portal
    new CfnOutput(this, "FrontEndUrl", {
      value:
        config.githubConfig.productionBranch + "/" + amplifyApp.defaultDomain,
      description: "URL for the deployed react app",
      exportName: "FrontEndUrl",
    });

    new CfnOutput(this, "bucketname", {
      value: myS3.bucketName,
      description: "bucket name",
      exportName: "bucketname",
    });

    new CfnOutput(this, "userPoolID", {
      value: userPoolID,
      description: "userPoolID",
      exportName: "userPoolID",
    });

    new CfnOutput(this, "clientID", {
      value: clientID,
      description: "clientID",
      exportName: "clientID",
    });

    new CfnOutput(this, "identityPool.identityPoolId", {
      value: identityPool.identityPoolId,
      description: "identityPool.identityPoolId",
      exportName: "identityPoolId",
    });

    new CfnOutput(this, "apigatewayURL", {
      value: UploadtoDbAPI.root.url,
      description: "apigatewayURL",
      exportName: "apigatewayURL",
    });
  }
}

module.exports = { InfraStack };
