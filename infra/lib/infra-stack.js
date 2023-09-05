const { Stack, RemovalPolicy, SecretValue } = require('aws-cdk-lib');
const { UserPool } = require("aws-cdk-lib/aws-cognito");
const { App, GitHubSourceCodeProvider } = require("@aws-cdk/aws-amplify-alpha");

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

    // Cognito
    const usersPool = new UserPool(this, "Users", {
      userPoolName: "Users",
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

    // Amplify
    const amplifyApp = new App(this, "Front-end-app", {
      description: "Frontend Code",
      sourceCodeProvider: new GitHubSourceCodeProvider({
        owner: config.githubConfig.owner,
        repository: config.githubConfig.repository,
        oauthToken: SecretValue.unsafePlainText(config.githubConfig.oauthToken),
      }),
      environmentVariables: {
        CLIENT_ID: clientID,
        USER_POOL_ID: userPoolID,
      },
    });

    amplifyApp.addBranch(config.githubConfig.productionBranch);
  }
}

module.exports = { InfraStack }
