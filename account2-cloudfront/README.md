## Requirements
1. <a href="https://aws.amazon.com/cdk/">AWS Cloud Development Kit</a> (CDK) 2.151.0 or higher
2. [AWS CLI](https://aws.amazon.com/cli/) for testing commands

### Setup Account 2 (Commercial)
1. From the <b>root</b> folder change directories into the <b>account2-cloudfront</b> folder.
2. Make sure to setup your AWS credentials to align with your commercial CloudFront account
3. Run `npm ci` to install all packages required
4. Setup the required environment variables:
   * `CDK_PRESIGNED_URL` set this value to the output `PresignedUrlApiUrl` given from the Account 1 setup
   * `CDK_S3_BUCKET_NAME` set this value to the output `BucketName` given from the Account 1 setup
   * `CDK_S3_BUCKET_REGION` set this value to the output `BucketRegion` given from the Account 1 setup
4. Run `cdk deploy` to deploy
5. Note the output `DemoRedirectUrl` which is the demo URL to validate the system is working.
6. Continue testing by placing files in the GovCloud S3 bucket and validating you can access those files from the CloudFront distribution.

### Cleanup Account 2 (Commercial)
1. From the <b>root</b> folder change directories into the <b>account2-cloudfront</b> folder.
2. Make sure to setup your AWS credentials to align with your commercial CloudFront account
3. Run <b>`cdk destroy`</b>
   - NOTE: if you get an error from CloudFormation deleting the Lambda@Edge function, then you should wait a while and then retry cdk destroy. [Reference documentation](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-edge-delete-replicas.html).

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
