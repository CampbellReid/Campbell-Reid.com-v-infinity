import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

export class HugoSiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. S3 Bucket for Static Content
    const bucketName = process.env.SITE_BUCKET || 'campbell-reid-content';
    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      bucketName: bucketName,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
    });

    // 2. CloudFront Origin Access Control (OAC)
    const oac = new cloudfront.CfnOriginAccessControl(this, 'SiteOAC', {
      originAccessControlConfig: {
        name: 'HugoSiteOAC',
        originAccessControlOriginType: 's3',
        signingBehavior: 'always',
        signingProtocol: 'sigv4',
      },
    });

    // 3. CloudFront Function for Directory Indexes
    const rewriteFunction = new cloudfront.Function(this, 'RewriteFunction', {
      code: cloudfront.FunctionCode.fromInline(`
        function handler(event) {
          var request = event.request;
          var uri = request.uri;
          
          // Check whether the URI is missing a file name.
          if (uri.endsWith('/')) {
            request.uri += 'index.html';
          } 
          // Check whether the URI is missing a file extension.
          else if (!uri.includes('.')) {
            request.uri += '/index.html';
          }
          
          return request;
        }
      `),
    });

    // 4. CloudFront Distribution
    const certArn = process.env.CERTIFICATE_ARN;
    if (!certArn) {
      throw new Error('CERTIFICATE_ARN environment variable is required');
    }

    const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
      defaultRootObject: 'index.html',
      domainNames: ['campbellreid.com', 'www.campbellreid.com'],
      certificate: acm.Certificate.fromCertificateArn(this, 'SiteCert', certArn),
      defaultBehavior: {
        origin: new origins.S3Origin(siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        functionAssociations: [
          {
            function: rewriteFunction,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          },
        ],
      },
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/404.html',
        },
      ],
    });

    // 5. Overwrite Origin Access Control for S3 (CDK L2 doesn't fully support OAC yet in some versions)
    const cfnDistribution = distribution.node.defaultChild as cloudfront.CfnDistribution;
    cfnDistribution.addPropertyOverride('DistributionConfig.Origins.0.S3OriginConfig.OriginAccessIdentity', '');
    cfnDistribution.addPropertyOverride('DistributionConfig.Origins.0.OriginAccessControlId', oac.getAtt('Id'));

    // 5. Bucket Policy to allow CloudFront Access
    siteBucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [siteBucket.arnForObjects('*')],
      principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
      conditions: {
        StringEquals: {
          'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`,
        },
      },
    }));

    new cdk.CfnOutput(this, 'SiteDistributionId', {
      value: distribution.distributionId,
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: siteBucket.bucketName,
    });
  }
}
