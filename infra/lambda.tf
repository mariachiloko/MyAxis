data "archive_file" "api" {
  type        = "zip"
  source_dir  = "${path.module}/lambda-src/api"
  output_path = "${path.module}/api.zip"
}

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  name               = "${local.name_prefix}-lambda"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
  tags               = local.common_tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "lambda_data" {
  statement {
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:Scan"
    ]
    resources = [
      aws_dynamodb_table.users.arn,
      aws_dynamodb_table.workspace_settings.arn,
      aws_dynamodb_table.calendar_connections.arn
    ]
  }
}

resource "aws_iam_role_policy" "lambda_data" {
  name   = "${local.name_prefix}-lambda-data"
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.lambda_data.json
}

resource "aws_lambda_function" "api" {
  function_name    = "${local.name_prefix}-api"
  role             = aws_iam_role.lambda.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.api.output_path
  source_code_hash = data.archive_file.api.output_base64sha256
  timeout          = var.lambda_timeout_seconds
  memory_size      = 256
  tags             = local.common_tags

  environment {
    variables = {
      APP_NAME                   = var.app_name
      USERS_TABLE                = aws_dynamodb_table.users.name
      WORKSPACE_SETTINGS_TABLE   = aws_dynamodb_table.workspace_settings.name
      CALENDAR_CONNECTIONS_TABLE = aws_dynamodb_table.calendar_connections.name
    }
  }
}
