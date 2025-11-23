/*CMD
  command: 💵 Withdraw USDT
  help: 
  need_reply: true
  auto_retry_time: 
  folder: 

  <<ANSWER
Withdraw $1,000 USDT to an external address 

Please send a valid ETH address to withdraw:
  ANSWER
  keyboard: Cancel
  aliases: 
  group: 
CMD*/

if (/^Cancel/i.test(message)) {
  return Bot.runCommand("/start");
}

if (!/^0x[a-fA-F0-9]{40}$/.test(message)) {
  Bot.sendMessage("Only provide a valid Ethereum address. This is not an Ethereum address: " + message);
  return Bot.runCommand("/start");
}

pay.app.initWithdrawal({
  params: {
    network: "ETH",
    address: message,
    currency: "USDT",
    amount: 1000,
    withdrawalId: Math.floor(Date.now() / 1000).toString()
  },
  onSuccess: "/onwithdrawnusdt"
});
