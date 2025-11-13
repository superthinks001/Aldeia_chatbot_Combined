# Production Environment - Variables

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-2" # Ohio
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "aldeia"
}

variable "owner" {
  description = "Owner of the infrastructure"
  type        = string
  default     = "DevOps Team"
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.1.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-2a", "us-east-2b"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.1.1.0/24", "10.1.2.0/24"]
}

variable "private_app_subnet_cidrs" {
  description = "CIDR blocks for private application subnets"
  type        = list(string)
  default     = ["10.1.10.0/24", "10.1.11.0/24"]
}

variable "private_db_subnet_cidrs" {
  description = "CIDR blocks for private database subnets"
  type        = list(string)
  default     = ["10.1.20.0/24", "10.1.21.0/24"]
}

# VPC Features
variable "enable_dns_hostnames" {
  description = "Enable DNS hostnames in VPC"
  type        = bool
  default     = true
}

variable "enable_dns_support" {
  description = "Enable DNS support in VPC"
  type        = bool
  default     = true
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway"
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Use single NAT Gateway (false for HA in production)"
  type        = bool
  default     = false
}

variable "enable_flow_logs" {
  description = "Enable VPC Flow Logs for production monitoring"
  type        = bool
  default     = false # Set to true after creating CloudWatch log group
}

# ALB Configuration
variable "acm_certificate_arn" {
  description = "ARN of ACM certificate for HTTPS"
  type        = string
  default     = ""
}

variable "enable_alb_deletion_protection" {
  description = "Enable deletion protection on ALB"
  type        = bool
  default     = true
}

variable "enable_alb_access_logs" {
  description = "Enable ALB access logs to S3"
  type        = bool
  default     = false # Set to true after creating S3 bucket
}

variable "alb_access_logs_bucket" {
  description = "S3 bucket name for ALB access logs"
  type        = string
  default     = ""
}
