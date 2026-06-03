# Deploy to AWS

## What this is

Deploy the public MyAxis app with Terraform and GitHub Actions.

## When you are ready

You can deploy when these are true:

- The repo is on GitHub.
- Terraform files are in place.
- The AWS account is ready.
- Cognito is set up.
- GitHub Actions variables are ready.
- You are okay with the public app using the cloud backend.

## Deploy checklist

1. Create or confirm your AWS account.
2. Pick a region and keep it consistent.
3. Run `terraform init` in the `infra/` folder.
4. Review the Terraform plan.
5. Create the AWS resources.
6. Copy the Terraform outputs you need.
7. Set the GitHub repository variables.
8. Set the Cognito callback and logout URLs.
9. Build the app with the deploy variables.
10. Push to `main` and let GitHub Actions deploy.
11. Open the site and test login, dashboard load, and Home calendar sync.

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
- Bedrock for AI replies and motivation quotes if you want the AWS-native AI path

## What to check after deploy

- The site opens from CloudFront.
- Login works.
- The dashboard loads the saved workspace.
- Home calendar sync works.
- The backend sync status looks healthy.
- Motivation quotes should be cached for the day so opening the app does not call the model every time.

## What to keep private

- Do not commit API keys.
- Do not commit calendar tokens.
- Do not commit personal backup files.
