/*CMD
  command: 💰 Merchant balance
  help: 
  need_reply: 
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: /merchantbalance
  group: 
CMD*/

if (!options) {
  return pay.app.info({
    onSuccess: "/merchantbalance"
  });
}

const { name, feePercents, balances } = options?.data;

Bot.sendMessage(
  "*Merchant:* "
  + name
  + "\n*Fee percents:* "
  + feePercents
  + "%"
  + (balances.length > 0 
  ? "\n"
    + balances.map(bal => {
      const { currency, balance } = bal;
      return "\n"
        + currency 
        + ": "
        + balance.toLocaleString()
    })
  : "")
);
