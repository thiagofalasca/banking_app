"use server";

import { ID, Models, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { cookies } from "next/headers";
import { parseStringify } from "../utils";
import { revalidatePath } from "next/cache";
import pluggyClient from "../pluggy";

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_USER_COLLECTION_ID: USER_COLLECTION_ID,
  APPWRITE_BANK_COLLECTION_ID: BANK_COLLECTION_ID,
} = process.env;

export const getUserInfo = async ({
  userId,
}: getUserInfoProps): Promise<User | null> => {
  const { database } = await createAdminClient();
  const user = await database.listDocuments(DATABASE_ID!, USER_COLLECTION_ID!, [
    Query.equal("userId", [userId]),
  ]);
  if (!user.documents || user.documents.length === 0) {
    throw new Error("User not found");
  }
  return parseStringify(user.documents[0]);
};

export const signIn = async ({
  email,
  password,
}: signInProps): Promise<User | null> => {
  try {
    const { account } = await createAdminClient();
    const session = await account.createEmailPasswordSession(email, password);
    cookies().set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });
    const user = await getUserInfo({ userId: session.userId });
    return user;
  } catch (error) {
    console.error("Error signing in: ", error);
    return null;
  }
};

export const signUp = async ({
  password,
  ...userData
}: SignUpParams): Promise<any | null> => {
  try {
    const { account, database } = await createAdminClient();
    const newUserAccount = await account.create(
      ID.unique(),
      userData.email,
      password,
      `${userData.firstName} ${userData.lastName}`
    );
    if (!newUserAccount) throw new Error("Error creating user account");
    const newUser = await database.createDocument(
      DATABASE_ID!,
      USER_COLLECTION_ID!,
      ID.unique(),
      {
        ...userData,
        userId: newUserAccount.$id,
      }
    );
    const session = await account.createEmailPasswordSession(
      userData.email,
      password
    );
    cookies().set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });
    return parseStringify(newUser);
  } catch (error) {
    console.error("Error signing up", error);
    return null;
  }
};

export async function getLoggedInUser(): Promise<User | null> {
  try {
    const { account } = await createSessionClient();
    const result = await account.get();
    const user = await getUserInfo({ userId: result.$id });
    return user;
  } catch (error) {
    console.log(error);
    return null;
  }
}

export const logoutAccount = async () => {
  try {
    const { account } = await createSessionClient();
    cookies().delete("appwrite-session");
    await account.deleteSession("current");
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const createToken = async (itemId?: string) => {
  const response = await pluggyClient.createConnectToken(itemId);
  if (!response) throw new Error("Falha ao gerar o token de conexão.");
  return response.accessToken;
};

export const createBankAccount = async ({
  userId,
  bankId,
  accountId,
}: createBankAccountProps): Promise<Bank | null> => {
  const { database } = await createAdminClient();
  const bankAccount = await database.createDocument(
    DATABASE_ID!,
    BANK_COLLECTION_ID!,
    ID.unique(),
    {
      userId,
      bankId,
      accountId,
    }
  );
  if (!bankAccount.documents || bankAccount.documents.length === 0)
    throw new Error("Error while creating bank account");
  return parseStringify(bankAccount);
};

export const createBank = async ({
  user,
  item,
}: createBankProps): Promise<Bank | null> => {
  try {
    const accounts = (await pluggyClient.fetchAccounts(item.id)).results;
    const newBank = await createBankAccount({
      userId: user.$id,
      bankId: item.id,
      accountId: accounts[0].id,
    });
    return newBank;
  } catch (error) {
    console.error("An error occurred while creating bank:", error);
    return null;
  }
};

export const getBanks = async ({ userId }: getBanksProps) => {
  const { database } = await createAdminClient();
  const banks = await database.listDocuments(
    DATABASE_ID!,
    BANK_COLLECTION_ID!,
    [Query.equal("userId", [userId])]
  );
  if (!banks.documents || banks.documents.length === 0)
    throw new Error("Banks not found");
  return parseStringify(banks.documents);
};

export const getBank = async ({ documentId }: getBankProps) => {
  const { database } = await createAdminClient();
  const bank = await database.listDocuments(DATABASE_ID!, BANK_COLLECTION_ID!, [
    Query.equal("$id", [documentId]),
  ]);
  if (!bank.documents || bank.documents.length === 0)
    throw new Error("Bank not found");
  return parseStringify(bank.documents[0]);
};
