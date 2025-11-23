/*CMD
  command: 🏷️ Demo cheque
  help: 
  need_reply: 
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: /democheque
  group: 
CMD*/

const cheque = Bot.getProp("cheque");

if (!cheque) {
  return pay.cheque.createMultiCheque({
    params: {
      currency: "USDT",
      chequePerUser: 1000,
      usersNumber: 1000,
      sendNotifications: true,
      enableCaptcha: false,
      refProgram: 0,
      forPremium: false,
      linkedWallet: false
    },
    onSuccess: "/ondemochequecreated"
  });
}

const { id, currency, total, perUser, users, state, link, activations } = cheque;

Api.sendMessage({
  text: "🏷️ *Demo multi cheque claim*"
    + "\n\n*Cheque ID:* "
    + id
    + "\n*Total cheque:* "
    + users.toLocaleString()
    + "\n*Amount:* "
    + perUser.toLocaleString()
    + " "
    + currency 
    + "\n*Total amount:* "
    + total.toLocaleString()
    + " "
    + currency
    + "\n*Activated:* "
    + activations.toLocaleString(),
  parse_mode: "Markdown",
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: "Claim cheque",
          url: link
        }
      ]
    ]
  }
});
