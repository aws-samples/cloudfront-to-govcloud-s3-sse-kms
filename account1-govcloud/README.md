## Requirements
1. <a href="https://aws.amazon.com/cdk/">AWS Cloud Development Kit</a> (CDK) 2.151.0 or higher
2. [AWS CLI](https://aws.amazon.com/cli/) for testing commands

### Setup Account 1 (GovCloud)
1. From the <b>root</b> folder change directories into the <b>account1-govcloud</b> folder.
2. Make sure to setup your AWS credentials to align with your GovCloud account
3. Run `npm ci` to install all packages required
4. Run `cdk deploy` to deploy
5. Note the outputs `PresignedUrlApiUrl`, `BucketName`, and `BucketRegion` which will be used as inputs for Account 2 setup

### Cleanup Account 1 (GovCloud)
1. From the <b>root</b> folder change directories into the <b>account1-govcloud</b> folder.
2. Make sure to setup your AWS credentials to align with your GovCloud account
3. Run <b>`cdk destroy`</b>

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
