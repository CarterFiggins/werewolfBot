const _ = require("lodash");

function parseSettingTime(time) {
  const [hour, minute] = _.map(time.split(":"), _.parseInt);

  let error = null;
  if (!hour || hour < 0 || hour > 23 || !minute || minute < 0 || minute > 59) {
    error = true;
  }

  return { hour, minute, error };
}

module.exports = {
  parseSettingTime,
};
