# Terraform v3 (syntax fixed for Terraform 1.x)
# aldeia-staging VPC (Ohio us-east-2)
# Compatible syntax for variable blocks and stable NAT creation.

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

# --------------------
# Variables
# --------------------
variable "region" {
  type    = string
  default = "us-east-2"
}

variable "vpc_name" {
  type    = string
  default = "aldeia-staging-vpc"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "cidr_public_az1" {
  type    = string
  default = "10.0.1.0/24"
}

variable "cidr_public_az2" {
  type    = string
  default = "10.0.2.0/24"
}

variable "cidr_app_az1" {
  type    = string
  default = "10.0.10.0/24"
}

variable "cidr_app_az2" {
  type    = string
  default = "10.0.11.0/24"
}

variable "cidr_db_az1" {
  type    = string
  default = "10.0.20.0/24"
}

variable "cidr_db_az2" {
  type    = string
  default = "10.0.21.0/24"
}

# --------------------
# Data sources
# --------------------
data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  azs = slice(data.aws_availability_zones.available.names, 0, 2)
  common_tags = {
    Environment = "staging"
    Project     = "aldeia"
    ManagedBy   = "terraform"
  }
}

# --------------------
# VPC & IGW
# --------------------
resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = merge(local.common_tags, { Name = var.vpc_name })
}

resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id
  tags   = merge(local.common_tags, { Name = "aldeia-staging-igw" })
}

# --------------------
# Subnets
# --------------------
resource "aws_subnet" "public_az1" {
  vpc_id                  = aws_vpc.this.id
  availability_zone       = local.azs[0]
  cidr_block              = var.cidr_public_az1
  map_public_ip_on_launch = true
  tags = merge(local.common_tags, { Name = "public-a", Tier = "public" })
}

resource "aws_subnet" "public_az2" {
  vpc_id                  = aws_vpc.this.id
  availability_zone       = local.azs[1]
  cidr_block              = var.cidr_public_az2
  map_public_ip_on_launch = true
  tags = merge(local.common_tags, { Name = "public-b", Tier = "public" })
}

resource "aws_subnet" "app_az1" {
  vpc_id            = aws_vpc.this.id
  availability_zone = local.azs[0]
  cidr_block        = var.cidr_app_az1
  tags = merge(local.common_tags, { Name = "private-app-a", Tier = "private", Layer = "app" })
}

resource "aws_subnet" "app_az2" {
  vpc_id            = aws_vpc.this.id
  availability_zone = local.azs[1]
  cidr_block        = var.cidr_app_az2
  tags = merge(local.common_tags, { Name = "private-app-b", Tier = "private", Layer = "app" })
}

resource "aws_subnet" "db_az1" {
  vpc_id            = aws_vpc.this.id
  availability_zone = local.azs[0]
  cidr_block        = var.cidr_db_az1
  tags = merge(local.common_tags, { Name = "private-db-a", Tier = "private", Layer = "db" })
}

resource "aws_subnet" "db_az2" {
  vpc_id            = aws_vpc.this.id
  availability_zone = local.azs[1]
  cidr_block        = var.cidr_db_az2
  tags = merge(local.common_tags, { Name = "private-db-b", Tier = "private", Layer = "db" })
}

# --------------------
# NAT Gateway (1x in first public subnet)
# --------------------
resource "aws_eip" "nat" {
  domain = "vpc"
  tags   = merge(local.common_tags, { Name = "aldeia-staging-nat-eip" })
}

resource "aws_nat_gateway" "this" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public_az1.id
  tags          = merge(local.common_tags, { Name = "aldeia-staging-nat" })
  depends_on    = [aws_internet_gateway.this]
}

# --------------------
# Route Tables
# --------------------
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id
  tags   = merge(local.common_tags, { Name = "aldeia-staging-rtb-public" })
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.this.id
}

resource "aws_route_table_association" "public_az1" {
  subnet_id      = aws_subnet.public_az1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_az2" {
  subnet_id      = aws_subnet.public_az2.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.this.id
  tags   = merge(local.common_tags, { Name = "aldeia-staging-rtb-private" })
}

resource "aws_route" "private_egress" {
  route_table_id         = aws_route_table.private.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.this.id
}

resource "aws_route_table_association" "app_az1" {
  subnet_id      = aws_subnet.app_az1.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "app_az2" {
  subnet_id      = aws_subnet.app_az2.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "db_az1" {
  subnet_id      = aws_subnet.db_az1.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "db_az2" {
  subnet_id      = aws_subnet.db_az2.id
  route_table_id = aws_route_table.private.id
}

# --------------------
# Outputs
# --------------------
output "region" { value = var.region }
output "azs" { value = local.azs }
output "vpc_id" { value = aws_vpc.this.id }
output "public_subnets" { value = [aws_subnet.public_az1.id, aws_subnet.public_az2.id] }
output "private_app_subnets" { value = [aws_subnet.app_az1.id, aws_subnet.app_az2.id] }
output "private_db_subnets" { value = [aws_subnet.db_az1.id, aws_subnet.db_az2.id] }
output "igw_id" { value = aws_internet_gateway.this.id }
output "nat_gateway_id" { value = aws_nat_gateway.this.id }
output "public_route_table_id" { value = aws_route_table.public.id }
output "private_route_table_id" { value = aws_route_table.private.id }