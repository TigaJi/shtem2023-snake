AWS.config.update({
  region: "us-east-1",
  credentials: new AWS.CognitoIdentityCredentials({
    IdentityPoolId: "us-east-1:e081c1eb-4713-46ba-a01a-6045649e6630",
  }),
});

const s3 = new AWS.S3({
  params: {
    Bucket: "snake-container",
  },
});
