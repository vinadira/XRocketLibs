/*CMD
  command: /ondemochequecreated
  help: 
  need_reply: false
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
  group: 
CMD*/

if (!options) return;

let { data } = options;
delete data?.disabledLanguages;
delete data?.enabledCountries;
Bot.setProp("cheque", data);

Bot.runCommand("/democheque");
