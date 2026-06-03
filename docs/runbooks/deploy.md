# Deploy to AWS

## What this is

Deploy the public MyAxis app with Terraform and GitHub Actions.

## How it works

1. Terraform creates the AWS resources.
2. The frontend builds into `dist/`.
3. GitHub Actions uploads the build to S3.
4. CloudFront serves the site.

## Main pieces

- S3 for the static site
- CloudFront for fast delivery
- Cognito for login
- DynamoDB for user and workspace data
- Lambda and API Gateway for backend requests

## What to keep private

- Do not commit API keys.
- Do not commit calendar tokens.
- Do not commit personal backup files.
