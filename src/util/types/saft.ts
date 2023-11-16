export interface User {
  email: string;
  firstname: string;
  lastname: string;
  fields: {
    amountinvested: string;
    walletofinvestement?: string;
    nationality?: string;
    datesofbirth?: string;
    id?: string;
  };
  operationLevel: "custom";
  operationCustomModes: ["email"];
}

export interface AnvilFields {
  title: string;
  data: {
    name: {
      firstName: string;
      lastName: string;
    };
    email: string;
    walletOfInvestment: string;
    amountInvested: string;
    dateOfSignature: string;
    id?: string;
    nationality?: string;
    dateOfBirth?: string;
  };
}
