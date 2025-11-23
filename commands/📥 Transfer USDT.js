/*CMD
  command: 📥 Transfer USDT
  help: 
  need_reply: 
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: /transferusdt
  group: 
CMD*/

if (!content) {
  return pay.app.initTransfer({
    params: {
      tgUserId: user.telegramid,
      currency: "USDT",
      amount: 1000,
      transferId: Math.floor(Date.now() / 1000).toString(),
       description: "@MsLyliaBot sent you a gift of $1,000 USDT. Enjoy!"
    },
    onSuccess: "/transferusdt"
  });
}

const { id, currency, tgUserId, amount, description } = options?.data;

Bot.sendMessage(
  "*Transfer ID:* "
  + id
  + "\n*Amount:* "
  + amount.toLocaleString()
  + " "
  + currency
  + "\n*Destination:* "
  + tgUserId
  + "\n*Description:* "
  + description
);
