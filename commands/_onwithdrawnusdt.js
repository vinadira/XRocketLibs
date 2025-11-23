/*CMD
  command: /onwithdrawnusdt
  help: 
  need_reply: 
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
  group: 
CMD*/

if (!options) return;

const { network, currency, amount, address, withdrawalId, status } = options?.data;

Bot.sendKeyboard(
  "💰 Merchant balance,\n📥 Transfer USDT, 💵 Withdraw USDT,\n🏷️ Demo cheque, 📄 Demo invoices",
  "💵 *Withdraw has been initiated!*"
  + "\n\nAmount: "
  + amount.toLocaleString()
  + " "
  + currency
  + "\nNetwork: "
  + network 
  + "\nWithdrawal ID: "
  + withdrawalId
  + "\nDestination: "
  + address
  + "\nStatus: "
  + status
);
