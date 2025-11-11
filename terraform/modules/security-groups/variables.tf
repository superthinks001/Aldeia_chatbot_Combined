# Security Groups Module Variables

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "enable_ssh_access" {
  description = "Enable SSH access to application instances"
  type        = bool
  default     = false
}

variable "bastion_security_group_id" {
  description = "Security group ID of bastion host (if SSH access enabled)"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
