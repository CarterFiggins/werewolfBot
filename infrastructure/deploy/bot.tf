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

resource "aws_ecs_task_definition" "bot" {
  family                = "discord-werewolf"
  container_definitions = jsonencode([
    {
      name: "bot",
      image: "${data.aws_ecr_repository.bot.repository_url}:${data.aws_ssm_parameter.bot_deployed_tag.value}",
      cpu: 2,
      memory: 512
      essential: true,
      environment: [ for key, value in local.environment_variables : { name = upper(key), value = value } ]
      secrets: [ for key, arn in local.secret_variables: { name = upper(key), valueFrom: arn }]
    }
  ])
}

resource "aws_ecs_service" "bot" {
  cluster = data.aws_ecs_cluster.main.id
  name         = "bot"
  desired_count = 1
  launch_type = "EC2"
  task_definition = aws_ecs_task_definition.bot.id
}