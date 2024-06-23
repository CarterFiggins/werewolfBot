# Setup

## Discord Application

You will need to create a Discord application here: https://discord.com/developers/applications/

After creating a new application, go into its settings and:

* Get the application ID in "General Information" to use in the CLIENT_ID environment variable. 
* In the "Bot" section:
    * Reset the token. Save the value for use in the TOKEN environment variable.     
    * Give the bot all privileged gateway intents. 
* In the "OAuth2" section:
  * Select the "bot" and "applications.commands" scopes under "OAuth2 URL Generator". 
  * Select "Administrator" under "BOT PERMISSIONS". 
  * Copy the generated URL below that and paste it into a new browser window. 
  * Select the server you wish to invite the bot to. 

### Final Setup

After you have the application running (see below) and the bot added to your server, run `/server-setup` to add the 
appropriate data.

## Environment variables

There are 5 values to set up in the env before the bot will work. Copy the `.env.example` file to `.env` and 
fill in the values for development. 

### TOKEN

This is the discord token that can be found after creating a bot in the discord developers application.

### CLIENT_ID

The client id is also found in the discord developers application.

### MONGO_URI

The uri to connect to mongodb. This is not used when using the Docker development environment outlined below.

### MONGODB_NAME

The name of the mongo database. This is not used when using the Docker development environment outlined below.

### TIME_ZONE_TZ

The time zone for the bot day schedulers. This uses the standard NodeJS standard format.


## Docker Development Environment

At the base of the project there is a Docker Compose project that will give you the basics of what you need to set up 
the application. You can either use it directly or reference it to set up a local environment.

You will need Docker to start. After installing Docker on your machine, you can navigate to the root of this project and 
run: `docker compose up` to get containers running that run the bot, a test MongoDB instance, and a watcher to install 
new libraries from package.json on demand.


## Local Development Environment

Make sure you're in the root of the project when running commands.

### NodeJS

Install the version listed in .tool-versions. This is the standard file for 
[asdf](https://asdf-vm.com/guide/getting-started.html). Make sure that npm is installed as well.

### Install libraries

In the root of the project run: `npm install`

### Other dependencies

Run: `npm install -g npm-watch nodemon`

Make sure you have a MongoDB server running and the environment variable mentioned above points to it.

### Start bot watchers

Run: `npm-watch`



