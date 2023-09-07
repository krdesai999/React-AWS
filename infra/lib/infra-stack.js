const {
  IdentityPool,
  UserPoolAuthenticationProvider,
} = require("@aws-cdk/aws-cognito-identitypool-alpha");

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

    // Amplify
    // const amplifyApp = new App(this, "Front-end-app", {
    //   description: "Frontend Code",
    //   sourceCodeProvider: new GitHubSourceCodeProvider({
    //     owner: config.githubConfig.owner,
    //     repository: config.githubConfig.repository,
    //     oauthToken: SecretValue.unsafePlainText(config.githubConfig.oauthToken),
    //   }),
    //   environmentVariables: {
    //     S3_BUCKET: myS3.bucketName,
    //     USER_POOL_ID: userPoolID,
    //     IDENTITY_POOL_ID: identityPool.identityPoolId,
    //     CLIENT_ID: clientID,
    //   },
    // });

    // amplifyApp.addBranch(config.githubConfig.productionBranch);

    // Print out in the console; url of the amplify lauched portal
    // new CfnOutput(this, "FrontEndUrl", {
    //   value: amplifyApp.defaultDomain,
    //   description: "URL for the deployed react app",
    //   exportName: "FrontEndUrl",
    // });

    //Dynamodb table definition
    const filedb = new Table(this, "filedb", {
      partitionKey: { name: "id", type: AttributeType.STRING },
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
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

    UploadtoDbAPI.root.addMethod("POST", new LambdaIntegration(lambdaDbPut), {
      authorizer: auth,
      authorizationType: AuthorizationType.COGNITO,
    });

    const ec2Role = new Role(this, "ec2Role", {
      assumedBy: new ServicePrincipal("ec2.amazonaws.com"),
    });

    // Granting necessary permissions to ec2 instance to be created
    myS3.grantReadWrite(ec2Role);
    filedb.grantReadWriteData(ec2Role);

    const ec2InstanceProfile = InstanceProfile(this, "ec2InstanceProfile", {
      Role: ec2Role,
    });

    // lambda trigger ec2 creation
    const lmdec2trigger = new Function(this, "lmdec2trigger", {
      functionName: "lmdec2trigger",
      runtime: Runtime.PYTHON_3_9,
      timeout: Duration.seconds(20),
      code: Code.fromAsset("resource/lambda"),
      handler: "lmdec2trigger.lambda_handler",
      environment: {
        TABLE_NAME: filedb.tableName,
        BUCKET_NAME: myS3.bucketName,
        EC2_INSTANCE_PROFILE_NAME: ec2InstanceProfile.instanceProfileName,
        REGION: this.region,
        APPEND_TO_FILE_SCRIPT: appendToFile,
      },
    });

    lmdec2trigger.addEventSource(
      new DynamoEventSource(filedb, {
        startingPosition: StartingPosition.TRIM_HORIZON,
        batchSize: 1,
      })
    );

    lmdec2trigger.role?.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2FullAccess")
    );

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
