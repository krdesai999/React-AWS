const {
  IdentityPool,
  UserPoolAuthenticationProvider,
} = require("@aws-cdk/aws-cognito-identitypool-alpha");

const { Stack, RemovalPolicy, SecretValue, CfnOutput } = require("aws-cdk-lib");
const { UserPool } = require("aws-cdk-lib/aws-cognito");
const { App, GitHubSourceCodeProvider } = require("@aws-cdk/aws-amplify-alpha");
const { BlockPublicAccess, Bucket } = require("aws-cdk-lib/aws-s3");

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
      signInAliases: {
        email: true,
        username: true,
      },
      autoVerify: {
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
        userPool: [
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
      },
    });

    amplifyApp.addBranch(config.githubConfig.productionBranch);

    // Print out in the console; url of the amplify lauched portal
    new CfnOutput(this, "FrontEndUrl", {
      value: amplifyApp.defaultDomain,
      description: "URL for the deployed react app",
      exportName: "FrontEndUrl",
    });
  }
}

module.exports = { InfraStack };
