variable "app_name" {
  type        = string
  description = "Public app name used for AWS resource naming."
  default     = "myaxis"
}

variable "aws_region" {
  type        = string
  description = "AWS region for serverless resources."
  default     = "us-east-1"
}

variable "tags" {
  type        = map(string)
  description = "Additional tags to merge onto all resources."
  default     = {}
}

variable "allowed_origins" {
  type        = list(string)
  description = "CORS origins allowed to call the API."
  default     = ["http://localhost:8000", "http://127.0.0.1:8000"]
}

variable "cognito_callback_urls" {
  type        = list(string)
  description = "Allowed OAuth callback URLs for the Cognito app client."
  default     = ["http://localhost:8000/"]
}

variable "cognito_logout_urls" {
  type        = list(string)
  description = "Allowed OAuth logout URLs for the Cognito app client."
  default     = ["http://localhost:8000/"]
}

variable "lambda_timeout_seconds" {
  type        = number
  description = "Default timeout for the API Lambda."
  default     = 10
}

variable "ai_model" {
  type        = string
  description = "Default AI model for the Lambda backend."
  default     = "amazon.nova-micro-v1:0"
}
