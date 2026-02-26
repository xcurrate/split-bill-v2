import { Member, Transaction, Settlement } from "./types";

const round = (num: number) => Math.round(num * 100) / 100;

export function calculateBalances(members: Member[], transactions: Transaction[]): Record<string, number> {
  const balances: Record<string, number> = {};
  members.forEach((m) => {
    balances[m.id] = 0;
  });

  transactions.forEach((trx) => {
    const rawSubtotal = trx.items.reduce((sum, item) => sum + item.price, 0);
    
    // Total yang dibayar oleh Payer (termasuk diskon dan pajak proporsional di level transaksi)
    const totalPaid = rawSubtotal - trx.discount + trx.tax;
    
    if (balances[trx.payerId] !== undefined) {
      balances[trx.payerId] = round(balances[trx.payerId] + totalPaid);
    }

    trx.items.forEach((item) => {
      // Hitung proporsi harga item terhadap subtotal
      const proportion = rawSubtotal > 0 ? item.price / rawSubtotal : 0;
      
      // Harga efektif item setelah dikenakan diskon dan pajak secara proporsional
      const effectivePrice = item.price - (trx.discount * proportion) + (trx.tax * proportion);

      const splitCount = item.assignedTo.length;
      if (splitCount > 0) {
        const costPerPerson = effectivePrice / splitCount;
        item.assignedTo.forEach((memberId) => {
          if (balances[memberId] !== undefined) {
            balances[memberId] = round(balances[memberId] - costPerPerson);
          }
        });
      }
    });
  });

  return balances;
}

export function calculateSettlement(balances: Record<string, number>): Settlement[] {
  const debtors: { id: string; amount: number }[] = [];
  const creditors: { id: string; amount: number }[] = [];

  for (const [id, balance] of Object.entries(balances)) {
    if (balance < -0.01) debtors.push({ id, amount: round(-balance) });
    if (balance > 0.01) creditors.push({ id, amount: round(balance) });
  }

  // Sort descending untuk meminimalkan jumlah transfer (algoritma greedy)
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    
    const minAmount = Math.min(debtor.amount, creditor.amount);

    settlements.push({
      from: debtor.id,
      to: creditor.id,
      amount: minAmount,
    });

    debtor.amount = round(debtor.amount - minAmount);
    creditor.amount = round(creditor.amount - minAmount);

    if (debtor.amount === 0) i++;
    if (creditor.amount === 0) j++;
  }

  return settlements;
}
