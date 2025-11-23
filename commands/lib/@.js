/*CMD
  command: @
  help: 
  need_reply: 
  auto_retry_time: 
  folder: lib
  answer: 
  keyboard: 
  aliases: 
  group: 
CMD*/

const { pay, trade } = Libs.XRocket;

pay.useTestnet(); 
trade.useTestnet(); // <- delete this if you want to use mainnet
