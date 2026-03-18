# Infrastructure Deployment

This directory contains the AWS infrastructure managed via AWS CDK for the Hugo static site.

## Infrastructure Architecture

The infrastructure consists of:
- **Amazon S3**: Hosts the static website files.
- **Amazon CloudFront**: Acts as the Content Delivery Network (CDN) with Origin Access Control (OAC) for secure access to the S3 bucket.

## Deployment Instructions

### Prerequisites

- AWS Account
- GitHub repository secrets configured
- AWS CDK bootstrapped in your target region

### IAM Configuration

To deploy this project via GitHub Actions, you need to create an IAM User or Role with the following permissions.

#### Required Permissions

The following IAM policy provides the necessary permissions for the CDK deployment, S3 content sync, and CloudFront invalidation.

*Note: Replace `<YOUR_BUCKET_NAME>` with the bucket name defined in `lib/site-stack.ts` (currently `campbell-reid-content`).*

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "CDKDeployment",
            "Effect": "Allow",
            "Action": [
                "cloudformation:*",
                "s3:*",
                "iam:PassRole",
                "iam:GetRole",
                "iam:CreateRole",
                "iam:DeleteRole",
                "iam:PutRolePolicy",
                "iam:DeleteRolePolicy",
                "iam:AttachRolePolicy",
                "iam:DetachRolePolicy",
                "cloudfront:*",
                "sts:AssumeRole"
            ],
            "Resource": "*"
        },
        {
            "Sid": "S3Sync",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:ListBucket",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": [
                "arn:aws:s3:::<YOUR_BUCKET_NAME>",
                "arn:aws:s3:::<YOUR_BUCKET_NAME>/*"
            ]
        },
        {
            "Sid": "CloudFrontInvalidation",
            "Effect": "Allow",
            "Action": [
                "cloudfront:CreateInvalidation"
            ],
            "Resource": "*"
        }
    ]
}
```

*Note: While `*` is used for some resources to simplify CDK's management of varied assets, you should restrict these to your specific account and region in production environments.*

### GitHub Secrets Setup

Add the following secrets to your GitHub repository under **Settings > Secrets and variables > Actions**:

1. `AWS_ACCESS_KEY_ID`: The access key for your IAM user.
2. `AWS_SECRET_ACCESS_KEY`: The secret key for your IAM user.
3. `AWS_REGION`: The AWS region where you want to deploy (e.g., `us-east-1`).

## Infrastructure Management

The infrastructure code is located in this directory.

```bash
npm install
npm run build
npx cdk deploy
```
