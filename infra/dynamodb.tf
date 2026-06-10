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

resource "aws_dynamodb_table" "shared_workspace_settings" {
  name         = "${local.name_prefix}-shared-workspace-settings"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "workspaceId"
  tags         = local.common_tags

  attribute {
    name = "workspaceId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "workspace_members" {
  name         = "${local.name_prefix}-workspace-members"
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

  global_secondary_index {
    name            = "workspaceId-index"
    hash_key        = "workspaceId"
    range_key       = "userId"
    projection_type  = "ALL"
  }
}

resource "aws_dynamodb_table" "workspace_invites" {
  name         = "${local.name_prefix}-workspace-invites"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "inviteCode"
  tags         = local.common_tags

  attribute {
    name = "inviteCode"
    type = "S"
  }

  attribute {
    name = "workspaceId"
    type = "S"
  }

  attribute {
    name = "invitedEmail"
    type = "S"
  }

  global_secondary_index {
    name            = "workspaceId-index"
    hash_key        = "workspaceId"
    range_key       = "inviteCode"
    projection_type  = "ALL"
  }

  global_secondary_index {
    name            = "invitedEmail-index"
    hash_key        = "invitedEmail"
    range_key       = "workspaceId"
    projection_type  = "ALL"
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

resource "aws_dynamodb_table" "shared_calendar_connections" {
  name         = "${local.name_prefix}-shared-calendar-connections"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "workspaceId"
  tags         = local.common_tags

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

resource "aws_dynamodb_table" "shared_workspace_state" {
  name         = "${local.name_prefix}-shared-workspace-state"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "workspaceId"
  tags         = local.common_tags

  attribute {
    name = "workspaceId"
    type = "S"
  }
}
