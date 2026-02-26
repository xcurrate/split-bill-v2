"use client";

import { useState, useEffect } from "react";
import { Member, Transaction, Item } from "@/lib/types";
import { calculateBalances, calculateSettlement } from "@/lib/calc";

// Seed Data Sample
const SEED_MEMBERS: Member[] = [
  { id: "m1", name: "Alice" },
  { id: "m2", name: "Bob" },
  { id: "m3", name: "Charlie" },
];

const SEED_TRANSACTIONS: Transaction[] = [
  {
    id: "t1",
    name: "Makan Malam Seafood",
    payerId: "m1",
    discount: 50000,
    tax: 25000,
    items: [
      { id: "i1", name: "Kepiting Saus Padang", price: 200000, assignedTo: ["m1", "m2", "m3"] },
      { id: "i2", name: "Nasi Goreng Seafood", price: 50000, assignedTo: ["m2"] },
    ],
  },
];

export default function App() {
  const [isClient, setIsClient] = useState(false);
  const [tab, setTab] = useState<"members" | "transactions" | "settlement">("transactions");
  
  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Load state dari localStorage atau gunakan seed data
  useEffect(() => {
    setIsClient(true);
    const savedMembers = localStorage.getItem("sb_members");
    const savedTransactions = localStorage.getItem("sb_transactions");
    
    if (savedMembers && savedTransactions) {
      setMembers(JSON.parse(savedMembers));
      setTransactions(JSON.parse(savedTransactions));
    } else {
      setMembers(SEED_MEMBERS);
      setTransactions(SEED_TRANSACTIONS);
    }
  }, []);

  // Sync state ke localStorage tiap kali ada perubahan
  useEffect(() => {
    if (isClient) {
      localStorage.setItem("sb_members", JSON.stringify(members));
      localStorage.setItem("sb_transactions", JSON.stringify(transactions));
    }
  }, [members, transactions, isClient]);

  if (!isClient) return <div className="p-6 text-center">Memuat...</div>;

  // MEMBER ACTIONS
  const addMember = () => {
    const name = prompt("Masukkan nama member:");
    if (!name) return;
    setMembers([...members, { id: Date.now().toString(), name }]);
  };
  const removeMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
    // Cleanup reference di assignedTo
    setTransactions(transactions.map(t => ({
      ...t,
      items: t.items.map(i => ({ ...i, assignedTo: i.assignedTo.filter(mid => mid !== id) }))
    })));
  };

  // TRANSACTION ACTIONS
  const addTransaction = () => {
    if (members.length === 0) return alert("Tambah member dulu!");
    const newTrx: Transaction = {
      id: Date.now().toString(),
      name: "Transaksi Baru",
      payerId: members[0].id,
      items: [],
      discount: 0,
      tax: 0,
    };
    setTransactions([newTrx, ...transactions]);
  };
  const removeTransaction = (id: string) => {
    setTransactions(transactions.filter((t) => t.id !== id));
  };
  const updateTransaction = (trxId: string, field: keyof Transaction, value: any) => {
    setTransactions(transactions.map((t) => (t.id === trxId ? { ...t, [field]: value } : t)));
  };

  // ITEM ACTIONS
  const addItem = (trxId: string) => {
    setTransactions(transactions.map(t => {
      if (t.id !== trxId) return t;
      const newItem: Item = { id: Date.now().toString(), name: "Item", price: 0, assignedTo: [] };
      return { ...t, items: [...t.items, newItem] };
    }));
  };
  const updateItem = (trxId: string, itemId: string, field: keyof Item, value: any) => {
    setTransactions(transactions.map(t => {
      if (t.id !== trxId) return t;
      return {
        ...t,
        items: t.items.map(i => (i.id === itemId ? { ...i, [field]: value } : i)),
      };
    }));
  };
  const removeItem = (trxId: string, itemId: string) => {
    setTransactions(transactions.map(t => {
      if (t.id !== trxId) return t;
      return { ...t, items: t.items.filter(i => i.id !== itemId) };
    }));
  };
  const toggleItemMember = (trxId: string, itemId: string, memberId: string) => {
    setTransactions(transactions.map(t => {
      if (t.id !== trxId) return t;
      return {
        ...t,
        items: t.items.map(i => {
          if (i.id !== itemId) return i;
          const assigned = i.assignedTo.includes(memberId)
            ? i.assignedTo.filter(id => id !== memberId)
            : [...i.assignedTo, memberId];
          return { ...i, assignedTo: assigned };
        })
      };
    }));
  };

  // SETTLEMENT
  const balances = calculateBalances(members, transactions);
  const settlements = calculateSettlement(balances);
  
  const handleShare = () => {
    if (settlements.length === 0) return alert("Tidak ada tagihan yang perlu ditransfer.");
    let text = "🧾 *Rekap Split Bill*\n\n";
    settlements.forEach(s => {
      const from = members.find(m => m.id === s.from)?.name || "Unknown";
      const to = members.find(m => m.id === s.to)?.name || "Unknown";
      text += `- ${from} bayar ke ${to} sebesar Rp${s.amount.toLocaleString("id-ID")}\n`;
    });
    navigator.clipboard.writeText(text);
    alert("Hasil rekap disalin ke clipboard!");
  };

  const getMemberName = (id: string) => members.find(m => m.id === id)?.name || "Unknown";

  return (
    <div className="flex flex-col h-full min-h-screen">
      <header className="bg-blue-600 text-white p-4 sticky top-0 z-10 shadow-md">
        <h1 className="text-xl font-bold">🍕 Split Bill MVP</h1>
      </header>

      {/* Tabs */}
      <div className="flex border-b bg-white sticky top-[60px] z-10">
        {(["members", "transactions", "settlement"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-semibold capitalize ${
              tab === t ? "border-b-4 border-blue-600 text-blue-600" : "text-gray-500"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 p-4 pb-20">
        {/* TAB: MEMBERS */}
        {tab === "members" && (
          <div className="space-y-4">
            <button onClick={addMember} className="w-full bg-blue-100 text-blue-700 py-3 rounded-lg font-bold">
              + Tambah Member
            </button>
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.id} className="flex justify-between p-3 bg-white rounded-lg shadow-sm border">
                  <span className="font-medium">{m.name}</span>
                  <button onClick={() => removeMember(m.id)} className="text-red-500 font-bold">✕</button>
                </div>
              ))}
              {members.length === 0 && <p className="text-center text-gray-400 mt-4">Belum ada member.</p>}
            </div>
          </div>
        )}

        {/* TAB: TRANSACTIONS */}
        {tab === "transactions" && (
          <div className="space-y-6">
            <button onClick={addTransaction} className="w-full bg-blue-100 text-blue-700 py-3 rounded-lg font-bold">
              + Tambah Transaksi/Struk
            </button>
            
            {transactions.map((trx) => (
              <div key={trx.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-4">
                <div className="flex justify-between items-start">
                  <input
                    type="text"
                    value={trx.name}
                    onChange={(e) => updateTransaction(trx.id, "name", e.target.value)}
                    className="font-bold text-lg border-b border-dashed border-gray-300 focus:outline-none w-2/3"
                    placeholder="Nama Transaksi"
                  />
                  <button onClick={() => removeTransaction(trx.id)} className="text-red-500 text-sm">Hapus</button>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-xs text-gray-500">Siapa yang nalangin (Payer)?</label>
                  <select
                    value={trx.payerId}
                    onChange={(e) => updateTransaction(trx.id, "payerId", e.target.value)}
                    className="p-2 border rounded-md bg-gray-50"
                  >
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>

                {/* Items */}
                <div className="space-y-3 bg-gray-50 p-3 rounded-lg border">
                  <h4 className="text-sm font-bold text-gray-700">Daftar Item</h4>
                  {trx.items.map((item) => (
                    <div key={item.id} className="bg-white p-3 rounded border border-gray-200 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(trx.id, item.id, "name", e.target.value)}
                          className="flex-1 border-b text-sm focus:outline-none"
                          placeholder="Nama item"
                        />
                        <input
                          type="number"
                          value={item.price || ""}
                          onChange={(e) => updateItem(trx.id, item.id, "price", parseFloat(e.target.value) || 0)}
                          className="w-24 border-b text-sm focus:outline-none text-right"
                          placeholder="Rp Harga"
                        />
                        <button onClick={() => removeItem(trx.id, item.id)} className="text-red-400">✕</button>
                      </div>
                      
                      {/* Split assignment */}
                      <div className="flex flex-wrap gap-2 pt-2 border-t mt-2">
                        {members.map(m => {
                          const isActive = item.assignedTo.includes(m.id);
                          return (
                            <button
                              key={m.id}
                              onClick={() => toggleItemMember(trx.id, item.id, m.id)}
                              className={`text-xs px-2 py-1 rounded-full border ${isActive ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-300"}`}
                            >
                              {m.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <button onClick={() => addItem(trx.id)} className="text-sm text-blue-600 font-semibold w-full text-left mt-2">
                    + Tambah Item
                  </button>
                </div>

                {/* Diskon & Pajak Global Transaksi */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">Diskon (Total Rp)</label>
                    <input
                      type="number"
                      value={trx.discount || ""}
                      onChange={(e) => updateTransaction(trx.id, "discount", parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border rounded-md text-sm"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">Pajak (Total Rp)</label>
                    <input
                      type="number"
                      value={trx.tax || ""}
                      onChange={(e) => updateTransaction(trx.id, "tax", parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border rounded-md text-sm"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            ))}
            {transactions.length === 0 && <p className="text-center text-gray-400 mt-4">Belum ada transaksi.</p>}
          </div>
        )}

        {/* TAB: SETTLEMENT */}
        {tab === "settlement" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-lg mb-4 border-b pb-2">Net Balance (Cek Saldo)</h3>
              {members.map(m => {
                const bal = balances[m.id] || 0;
                return (
                  <div key={m.id} className="flex justify-between py-1 text-sm">
                    <span>{m.name}</span>
                    <span className={`font-mono ${bal < 0 ? 'text-red-500' : bal > 0 ? 'text-green-500' : 'text-gray-400'}`}>
                      {bal > 0 ? '+' : ''}{bal.toLocaleString("id-ID")}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-lg mb-4 border-b pb-2">Siapa Bayar ke Siapa?</h3>
              {settlements.length === 0 ? (
                <p className="text-gray-400 text-sm text-center">Semua sudah impas / tidak ada tagihan.</p>
              ) : (
                <div className="space-y-3">
                  {settlements.map((s, idx) => (
                    <div key={idx} className="flex flex-col bg-gray-50 p-3 rounded-lg border">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-red-600">{getMemberName(s.from)}</span>
                        <span className="text-xs text-gray-400">➡️ bayar ke ➡️</span>
                        <span className="font-semibold text-green-600">{getMemberName(s.to)}</span>
                      </div>
                      <div className="text-center font-mono font-bold text-lg mt-2">
                        Rp {s.amount.toLocaleString("id-ID")}
                      </div>
                    </div>
                  ))}
                  <button onClick={handleShare} className="w-full mt-4 bg-green-500 text-white font-bold py-3 rounded-lg shadow-md active:bg-green-600 transition">
                    Bagikan Hasil (Copy)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
