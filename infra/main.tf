provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}

locals {
  name_prefix = lower(var.app_name)
  common_tags = merge(var.tags, {
    Project   = var.app_name
    ManagedBy = "Terraform"
  })
}
