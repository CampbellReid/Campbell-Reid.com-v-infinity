# Infrastructure Deployment

This directory contains the AWS infrastructure managed via AWS CDK for the Hugo static site.

## Infrastructure Architecture

The infrastructure consists of:
- **Amazon S3**: Hosts the static website files.
- **Amazon CloudFront**: Acts as the Content Delivery Network (CDN) with Origin Access Control (OAC) for secure access to the S3 bucket.
- **AWS Certificate Manager (ACM)**: Manages the SSL/TLS certificate for custom domains.

## Deployment Instructions

### Prerequisites

- AWS Account with an OIDC Identity Provider configured for GitHub.
- GitHub repository secrets configured.
- AWS CDK bootstrapped in your target region.

### IAM Configuration (OIDC)

To deploy this project via GitHub Actions, you should use **OpenID Connect (OIDC)** instead of static Access Keys. 

#### 1. Create Identity Provider
In the AWS IAM Console, add a new Identity Provider:
- **Provider Type**: OpenID Connect
- **Provider URL**: `https://token.actions.githubusercontent.com`
- **Audience**: `sts.amazonaws.com`

#### 2. Create IAM Role
Create an IAM Role (e.g., `GitHubActionsRole`) with a **Trust Policy** that restricts access to your specific repository and branch:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Federated": "arn:aws:iam::<AWS_ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
            },
            "Action": "sts:AssumeRoleWithWebIdentity",
            "Condition": {
                "StringEquals": {
                    "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
                },
                "StringLike": {
                    "token.actions.githubusercontent.com:sub": "repo:CampbellReid/Campbell-Reid.com-v-infinity:*"
                }
            }
        }
    ]
}
```

#### 3. Assign Permissions
Attach a policy to this role providing the necessary permissions for CloudFormation, S3, CloudFront, and IAM.

### GitHub Secrets Setup

Add the following secrets to your GitHub repository under **Settings > Secrets and variables > Actions**:

1. `AWS_ROLE_TO_ASSUME`: The full ARN of the IAM Role created above.
2. `AWS_REGION`: Your target AWS region (e.g., `ap-southeast-2`).
3. `CERTIFICATE_ARN`: The ARN of your validated ACM certificate in `us-east-1`.
4. `SITE_BUCKET`: The name of your S3 bucket (e.g., `campbell-reid-content`).

## Local Development

To deploy or test from your local machine, set the required environment variables first:

```powershell
$env:CERTIFICATE_ARN="your-cert-arn"
$env:SITE_BUCKET="your-bucket-name"
cd infra
npm install
npm run build
npx cdk deploy
```
