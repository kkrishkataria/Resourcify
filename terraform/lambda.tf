# Pre-built Lambda zip (created by build-lambda.ps1 which bundles node_modules correctly)
locals {
  lambda_zip = "${path.module}/backend_bundle.zip"
}

# 1. CampusSlotApiFunction (REST API handler)
resource "aws_lambda_function" "api_function" {
  function_name    = "CampusSlotApiFunction"
  filename         = local.lambda_zip
  source_code_hash = filebase64sha256(local.lambda_zip)
  role             = aws_iam_role.lambda_exec.arn
  handler          = "src/lambda.handler"
  runtime          = "nodejs20.x"
  memory_size      = 512
  timeout          = 15

  environment {
    variables = {
      NODE_ENV                            = var.environment
      DB_MODE                             = "dynamodb"
      AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1"
      DYNAMODB_TABLE_RESOURCES            = aws_dynamodb_table.resources.name
      DYNAMODB_TABLE_BOOKINGS             = aws_dynamodb_table.bookings.name
      DYNAMODB_TABLE_SLOT_LOCKS           = aws_dynamodb_table.slot_locks.name
      DYNAMODB_TABLE_USERS                = aws_dynamodb_table.users.name
      COGNITO_USER_POOL_ID                = aws_cognito_user_pool.user_pool.id
      COGNITO_CLIENT_ID                   = aws_cognito_user_pool_client.web_client.id
      SNS_BOOKING_NOTIFICATIONS_TOPIC_ARN = aws_sns_topic.booking_notifications.arn
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic,
    aws_iam_role_policy_attachment.lambda_custom_attach
  ]
}

# 2. CampusSlotAutoReleaseFunction (Auto-release expired no-shows)
resource "aws_lambda_function" "auto_release_function" {
  function_name    = "CampusSlotAutoReleaseFunction"
  filename         = local.lambda_zip
  source_code_hash = filebase64sha256(local.lambda_zip)
  role             = aws_iam_role.lambda_exec.arn
  handler          = "src/lambda.scheduledAutoReleaseHandler"
  runtime          = "nodejs20.x"
  memory_size      = 512
  timeout          = 15

  environment {
    variables = {
      NODE_ENV                            = var.environment
      DB_MODE                             = "dynamodb"
      AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1"
      DYNAMODB_TABLE_RESOURCES            = aws_dynamodb_table.resources.name
      DYNAMODB_TABLE_BOOKINGS             = aws_dynamodb_table.bookings.name
      DYNAMODB_TABLE_SLOT_LOCKS           = aws_dynamodb_table.slot_locks.name
      DYNAMODB_TABLE_USERS                = aws_dynamodb_table.users.name
      COGNITO_USER_POOL_ID                = aws_cognito_user_pool.user_pool.id
      COGNITO_CLIENT_ID                   = aws_cognito_user_pool_client.web_client.id
      SNS_BOOKING_NOTIFICATIONS_TOPIC_ARN = aws_sns_topic.booking_notifications.arn
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic,
    aws_iam_role_policy_attachment.lambda_custom_attach
  ]
}

# EventBridge rule (every 5 minutes)
resource "aws_cloudwatch_event_rule" "auto_release_schedule" {
  name                = "CampusSlotAutoReleaseSchedule"
  description         = "Trigger auto-release of expired no-show slot locks every 5 minutes"
  schedule_expression = "rate(5 minutes)"
}

resource "aws_cloudwatch_event_target" "auto_release_target" {
  rule      = aws_cloudwatch_event_rule.auto_release_schedule.name
  target_id = "CampusSlotAutoReleaseLambda"
  arn       = aws_lambda_function.auto_release_function.arn
}

resource "aws_lambda_permission" "allow_eventbridge_auto_release" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auto_release_function.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.auto_release_schedule.arn
}

# ==============================================================================
# API Gateway (REST API)
# ==============================================================================
resource "aws_api_gateway_rest_api" "api" {
  name        = "CampusSlotApi"
  description = "CampusSlot REST API Gateway"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_authorizer" "cognito" {
  name          = "CognitoAuthorizer"
  type          = "COGNITO_USER_POOLS"
  rest_api_id   = aws_api_gateway_rest_api.api.id
  provider_arns = [aws_cognito_user_pool.user_pool.arn]
}

resource "aws_api_gateway_resource" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "proxy_any" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda_integration" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.proxy.id
  http_method             = aws_api_gateway_method.proxy_any.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_function.invoke_arn
}

# Root resource handling
resource "aws_api_gateway_method" "root_any" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_rest_api.api.root_resource_id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "root_lambda_integration" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_rest_api.api.root_resource_id
  http_method             = aws_api_gateway_method.root_any.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_function.invoke_arn
}

# CORS OPTIONS on proxy
resource "aws_api_gateway_method" "proxy_options" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.proxy.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "proxy_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.proxy_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "proxy_options_200" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.proxy_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "proxy_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.proxy_options.http_method
  status_code = aws_api_gateway_method_response.proxy_options_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-user-id,x-user-role,x-user-email,x-user-name'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,GET,POST,PUT,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.proxy_options_integration]
}

# Deployment & Stage
resource "aws_api_gateway_deployment" "deployment" {
  rest_api_id = aws_api_gateway_rest_api.api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.proxy.id,
      aws_api_gateway_method.proxy_any.id,
      aws_api_gateway_integration.lambda_integration.id,
      aws_api_gateway_method.root_any.id,
      aws_api_gateway_integration.root_lambda_integration.id
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_integration.lambda_integration,
    aws_api_gateway_integration.root_lambda_integration
  ]
}

resource "aws_api_gateway_stage" "prod" {
  deployment_id = aws_api_gateway_deployment.deployment.id
  rest_api_id   = aws_api_gateway_rest_api.api.id
  stage_name    = "prod"
}

resource "aws_lambda_permission" "api_gateway_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_function.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}
