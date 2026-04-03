#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { HugoSiteStack } from '../lib/site-stack';

const app = new cdk.App();
new HugoSiteStack(app, 'HugoSiteStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION || 'ap-southeast-2'
  },
});
