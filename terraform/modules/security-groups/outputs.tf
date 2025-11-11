# Security Groups Module Outputs

output "alb_security_group_id" {
  description = "ID of ALB security group"
  value       = aws_security_group.alb.id
}

output "app_security_group_id" {
  description = "ID of application security group"
  value       = aws_security_group.app.id
}

output "db_security_group_id" {
  description = "ID of database security group"
  value       = aws_security_group.db.id
}

output "redis_security_group_id" {
  description = "ID of Redis security group"
  value       = aws_security_group.redis.id
}
