output "api_url" {
  description = "CampusSlot REST API Gateway invoke URL"
  value       = "${aws_api_gateway_stage.prod.invoke_url}/api"
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.user_pool.id
}

output "cognito_client_id" {
  description = "Cognito App Client ID"
  value       = aws_cognito_user_pool_client.web_client.id
}

output "cloudfront_url" {
  description = "CloudFront domain name for the React SPA"
  value       = "https://${aws_cloudfront_distribution.frontend_distribution.domain_name}"
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket hosting the frontend SPA"
  value       = aws_s3_bucket.frontend.id
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for booking notifications"
  value       = aws_sns_topic.booking_notifications.arn
}
