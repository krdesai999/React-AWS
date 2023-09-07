import { HttpMethods } from "aws-cdk-lib/aws-s3";
const githubConfig = {
  owner: "krdesai999",
  remoteURL: "https://github.com/krdesai999/fovus-project.git",
  oauthToken: "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",
  repository: "fovus-project",
  productionBranch: "main",
};

const s3Config = {
  bucketName: "myinputfileuploadbucket",
  corsRules: {
    allowedMethods: [HttpMethods.GET, HttpMethods.PUT],
    allowedOrigins: ["*"],

    // the properties below are optional
    allowedHeaders: ["*"],
    exposedHeaders: ["ETag", "x-amz-meta-custom-header"],
  },
};

exports.s3Config = s3Config;
exports.githubConfig = githubConfig;
