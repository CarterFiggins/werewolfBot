module "ec2_ecs_service_role" {
  source = "github.com/code-butter/aws-tf//iam_role"
  name   = "ecs-ec2-service"
  assume_services = ["ec2.amazonaws.com"]
  attach_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role",
    "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  ]
  inline_policies = [
    {
      sid: "AssignEIPs",
      effect: "Allow"
      actions: [
        "ec2:DescribeAddresses",
        "ec2:AllocateAddress",
        "ec2:DescribeInstances",
        "ec2:AssociateAddress"
      ]
      resources = ["*"]
    }
  ]
}

resource "aws_eip" "ec2_esc_service" {
}

resource "aws_iam_instance_profile" "ec2_ecs_service" {
  name = "ecs-ecs-service"
  role = module.ec2_ecs_service_role.name
}

resource "aws_security_group" "server" {
  vpc_id = module.primary_vpc.vpc_id
  name = "werewolf-bot-server"
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

resource "aws_launch_template" "server" {
  name = "werewolf-bot"
  image_id = data.aws_ssm_parameter.ecs_optimized_ami.value
  instance_type = "t4g.nano"
  metadata_options {
    http_endpoint = "enabled"
    http_put_response_hop_limit = 2
    http_tokens = "optional"
  }
  iam_instance_profile {
    arn = aws_iam_instance_profile.ec2_ecs_service.arn
  }
  user_data = base64encode(templatefile("${path.module}/user_data.sh.tftpl", {
    cluster = aws_ecs_cluster.main.name,
    eip_id = aws_eip.ec2_esc_service.allocation_id
  }))
  network_interfaces {
    associate_public_ip_address = true
    delete_on_termination = true
    security_groups = [aws_security_group.server.id]
  }
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_group" "server" {
  name = "werewolf-bot"
  vpc_zone_identifier = module.primary_vpc.public_subnets
  max_size = 1
  min_size = 1
  desired_capacity = 1
  health_check_type = "EC2"
  health_check_grace_period = 300
  launch_template {
    id = aws_launch_template.server.id
    version = "$Latest"
  }
}