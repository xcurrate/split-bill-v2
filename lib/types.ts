export type Member = {
  id: string;
  name: string;
};

export type Item = {
  id: string;
  name: string;
  price: number;
  assignedTo: string[]; // array of Member IDs
};

export type Transaction = {
  id: string;
  name: string;
  payerId: string;
  items: Item[];
  discount: number;
  tax: number;
};

export type Settlement = {
  from: string;
  to: string;
  amount: number;
};
