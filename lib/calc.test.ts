import { expect, test } from 'vitest';
import { calculateBalances, calculateSettlement } from './calc';

test('Settlement logic minimizes transfers and calculates proportional discount', () => {
  const members = [
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' },
    { id: '3', name: 'Charlie' }
  ];

  const transactions = [
    {
      id: 't1',
      name: 'Dinner',
      payerId: '1', // Alice pays 100
      discount: 20, // Proportional discount
      tax: 0,
      items: [
        { id: 'i1', name: 'Pizza', price: 60, assignedTo: ['1', '2'] }, // Alice, Bob (Effective 60 - 12 = 48) -> 24 each
        { id: 'i2', name: 'Burger', price: 40, assignedTo: ['3'] }       // Charlie (Effective 40 - 8 = 32) -> 32
      ]
    }
  ];

  // Total paid by Alice = 100 - 20 = 80
  // Alice owes = 24. Net Alice = 80 - 24 = +56 (Creditor)
  // Bob owes = 24. Net Bob = 0 - 24 = -24 (Debtor)
  // Charlie owes = 32. Net Charlie = 0 - 32 = -32 (Debtor)

  const balances = calculateBalances(members, transactions);
  expect(balances['1']).toBe(56);
  expect(balances['2']).toBe(-24);
  expect(balances['3']).toBe(-32);

  const settlements = calculateSettlement(balances);
  expect(settlements.length).toBe(2);
  expect(settlements.find(s => s.from === '3' && s.to === '1')?.amount).toBe(32);
  expect(settlements.find(s => s.from === '2' && s.to === '1')?.amount).toBe(24);
});
