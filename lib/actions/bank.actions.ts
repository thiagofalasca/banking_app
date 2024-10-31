"use server";

import { parseStringify } from "../utils";
import { getBanks, getBank } from "./user.actions";
import pluggyClient from "../pluggy";

export const getAccounts = async ({
  userId,
}: getAccountsProps): Promise<AccountsResult | null> => {
  try {
    const banks = await getBanks({ userId });
    const accounts = await Promise.all(
      banks?.map(async (bank: Bank) => {
        const accountData = await pluggyClient.fetchAccount(bank.accountId);
        const institution = await getInstitution({
          institutionId: accountData.itemId,
        });
        const account = {
          id: accountData.id,
          currentBalance: accountData.balance,
          institutionId: institution.id,
          name: accountData.name,
          marketingName: accountData.marketingName,
          number: accountData.number,
          type: accountData.type,
          appwriteItemId: bank.$id,
        };
        return account;
      })
    );
    const totalBanks = accounts.length;
    const totalCurrentBalance = accounts.reduce((total, account) => {
      return total + account.currentBalance;
    }, 0);
    return parseStringify({ data: accounts, totalBanks, totalCurrentBalance });
  } catch (error) {
    console.error("An error occurred while getting the accounts:", error);
    return null;
  }
};

export const getAccount = async ({
  appwriteItemId,
}: getAccountProps): Promise<AccountResult | null> => {
  try {
    const bank = await getBank({ documentId: appwriteItemId });
    const accountData = await pluggyClient.fetchAccount(bank.accountId);
    const institution = await getInstitution({
      institutionId: accountData.itemId,
    });
    const transactions = await getTransactions({
      accountId: accountData.id,
    });
    const account = {
      id: accountData.id,
      currentBalance: accountData.balance,
      institutionId: institution.id,
      name: accountData.name,
      marketingName: accountData.marketingName!,
      number: accountData.number,
      type: accountData.type,
      appwriteItemId: bank.$id,
    };
    return { data: account, transactions };
  } catch (error) {
    console.error("An error occurred while getting the account:", error);
    return null;
  }
};

export const getInstitution = async ({
  institutionId,
}: getInstitutionProps) => {
  const institution = await pluggyClient.fetchItem(institutionId);
  if (!institution) throw new Error("Institution not found");
  return institution;
};

export const getTransactions = async ({ accountId }: getTransactionsProps) => {
  const response = await pluggyClient.fetchTransactions(accountId);
  if (!response) throw new Error("Error while getting transactions");
  const transactions = response.results.map((transaction) => ({
    id: transaction.id,
    name: transaction.description,
    paymentChannel: transaction.paymentData?.paymentMethod,
    type: transaction.type,
    accountId: transaction.accountId,
    amount: transaction.amount,
    pending: transaction.status,
    category: transaction.category || "",
    date: transaction.date,
    image: "/icons/logo.svg",
  }));
  return transactions;
};
