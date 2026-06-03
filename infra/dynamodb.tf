resource "aws_dynamodb_table" "users" {
  name         = "${local.name_prefix}-users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  tags         = local.common_tags

  attribute {
    name = "userId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "workspace_settings" {
  name         = "${local.name_prefix}-workspace-settings"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "workspaceId"
  tags         = local.common_tags

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "workspaceId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "calendar_connections" {
  name         = "${local.name_prefix}-calendar-connections"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "workspaceId"
  tags         = local.common_tags

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "workspaceId"
    type = "S"
  }
}
resource "aws_dynamodb_table" "workspace_state" {
  name         = "${local.name_prefix}-workspace-state"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "workspaceId"
  tags         = local.common_tags

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "workspaceId"
    type = "S"
  }
}
