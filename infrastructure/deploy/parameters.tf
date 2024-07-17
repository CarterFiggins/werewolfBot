data "aws_ssm_parameter" "discord_token" {
  name = "discord-token"
}

data "aws_ssm_parameter" "discord_app_id" {
  name = "discord-app-id"
}

data "aws_ssm_parameter" "mongo_uri" {
  name = "mongo-uri"
}

data "aws_ssm_parameter" "mongo_db_name" {
  name = "mongo-db-name"
}

data "aws_ssm_parameter" "time_zone" {
  name = "time-zone"
}

data "aws_ssm_parameter" "bot_deployed_tag" {
  name = "bot-deployed-tag"
}