locals {
  environment_variables = {
    mongodb_name: data.aws_ssm_parameter.mongo_db_name.value,
    time_zone_tz: data.aws_ssm_parameter.time_zone.value
  }
  secret_variables = {
    token: data.aws_ssm_parameter.discord_token.arn,
    client_id: data.aws_ssm_parameter.discord_app_id.arn,
    mongo_uri: data.aws_ssm_parameter.mongo_uri.arn
  }
}

resource "aws_cloudwatch_log_group" "werewolf_task" {
  name = "werewolf-bot-task"
  retention_in_days = 30
}

module "bot_execution_role" {
  source = "github.com/code-butter/aws-tf//iam_role"
  name = "werewolf-bot-execution"
  assume_services = ["ecs-tasks.amazonaws.com"]
  attach_policy_arns = ["arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"]
  inline_policies = [
    {
      sid: "GlobalResources",
      effect: "Allow",
      resources: ["*"],
      actions: [
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath",
        "sts:GetServiceBearerToken",
        "ssm:PutParameter"
      ]
    },
  ]
}

module "bot_task_role" {
  source = "github.com/code-butter/aws-tf//iam_role"
  name = "werewolf-bot-task"
  assume_services = ["ecs-tasks.amazonaws.com"]
}

resource "aws_ecs_task_definition" "bot" {
  family                = "discord-werewolf"
  container_definitions = jsonencode([
    {
      name: "bot",
      image: "${data.aws_ecr_repository.bot.repository_url}:${data.aws_ssm_parameter.bot_deployed_tag.value}",
      cpu: 2048,
      memory: 256,
      essential: true,
      environment: [ for key, value in local.environment_variables : { name = upper(key), value = value } ],
      secrets: [ for key, arn in local.secret_variables: { name = upper(key), valueFrom: arn }]
      logConfiguration: {
        logDriver: "awslogs"
        options: {
          "awslogs-group": aws_cloudwatch_log_group.werewolf_task.name
          "awslogs-region": var.primary_region
          "awslogs-stream-prefix" = "werewolf-bot"
        }
      }
    }
  ])
  network_mode = "host"
  execution_role_arn = module.bot_execution_role.arn
  task_role_arn = module.bot_task_role.arn
}

resource "aws_ecs_service" "bot" {
  cluster = data.aws_ecs_cluster.main.id
  enable_execute_command = true
  name         = "bot"
  desired_count = 1
  launch_type = "EC2"
  task_definition = aws_ecs_task_definition.bot.arn
}