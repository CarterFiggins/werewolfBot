resource "aws_security_group" "server" {
  vpc_id = module.primary_vpc.vpc_id
  egress {
    from_port = 0
    to_port = 0
    protocol = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

data "aws_ssm_parameter" "ecs_optimized_ami" {
  name = "/aws/service/ecs/optimized-ami/amazon-linux-2023/arm64/recommended/image_id"
}

resource "aws_launch_configuration" "server" {
  image_id      = data.aws_ssm_parameter.ecs_optimized_ami.value
  instance_type = "t4g.nano"
  security_groups = [aws_security_group.server.id]
  user_data = <<-EOF
    #!/bin/bash
    echo ECS_CLUSTER=${aws_ecs_cluster.main.name} >> /etc/ecs/ecs.config
  EOF
}

resource "aws_autoscaling_group" "server" {
  launch_configuration = aws_launch_configuration.server.id
  vpc_zone_identifier = module.primary_vpc.public_subnets
  max_size = 1
  min_size = 1
  desired_capacity = 1
  health_check_type = "EC2"
  health_check_grace_period = 300
}