const {
  IdentityPool,
  UserPoolAuthenticationProvider,
} = require("@aws-cdk/aws-cognito-identitypool-alpha");

const { Stack, RemovalPolicy, SecretValue, CfnOutput, Duration } = require("aws-cdk-lib");
const { UserPool } = require("aws-cdk-lib/aws-cognito");
const { App, GitHubSourceCodeProvider } = require("@aws-cdk/aws-amplify-alpha");
const { BlockPublicAccess, Bucket } = require("aws-cdk-lib/aws-s3");
const {RestApi, LambdaIntegration, CognitoUserPoolsAuthorizer, AuthorizationType, Cors} = require('aws-cdk-lib/aws-apigateway');
const {Function, Runtime, Code} = require('aws-cdk-lib/aws-lambda');
const { Table, AttributeType } = require('aws-cdk-lib/aws-dynamodb');

const config = require("../config.js");

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

    const auth = new CognitoUserPoolsAuthorizer(
      this,
      "dynamo-put-Authorizer",
      {
        cognitoUserPools: [usersPool],
      }
    );

    // Api gateway
    const dbAPI = new RestApi(this, "insert-to-dynamo-api");
    dbAPI.root.addMethod("POST", new LambdaIntegration(lambdaDbPut), {
      authorizer: auth,
      authorizationType: AuthorizationType.COGNITO,
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
      value: dbAPI.root.url,
      description: "apigatewayURL",
      exportName: "apigatewayURL",
    });
  }
}

module.exports = { InfraStack };
