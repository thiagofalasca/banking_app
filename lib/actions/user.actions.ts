"use server";

import { ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { cookies } from "next/headers";
import { parseStringify } from "../utils";
import pluggyClient from "../pluggy";

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_USER_COLLECTION_ID: USER_COLLECTION_ID,
  APPWRITE_BANK_COLLECTION_ID: BANK_COLLECTION_ID,
} = process.env;

export const getUserInfo = async ({
  userId,
}: getUserInfoProps): Promise<User | null> => {
  try {
    const { database } = await createAdminClient();
    const userDocs = await database.listDocuments(
      DATABASE_ID!,
      USER_COLLECTION_ID!,
      [Query.equal("userId", [userId])],
    );
    return parseStringify(userDocs.documents[0]);
  } catch (error) {
    console.error("An error ocurred while gettig the user info: ", error);
    return null;
  }
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
}: SignUpParams): Promise<User | null> => {
  try {
    const { account, database } = await createAdminClient();
    const newUserAccount = await account.create(
      ID.unique(),
      userData.email,
      password,
      `${userData.firstName} ${userData.lastName}`,
    );

    const newUser = await database.createDocument(
      DATABASE_ID!,
      USER_COLLECTION_ID!,
      ID.unique(),
      {
        ...userData,
        userId: newUserAccount.$id,
      },
    );

    const session = await account.createEmailPasswordSession(
      userData.email,
      password,
    );
    cookies().set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });
    return parseStringify(newUser);
  } catch (error) {
    console.error("Error while signing up: ", error);
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
    console.error("An error ocurred while getting the logged-in user: ", error);
    return null;
  }
}

export const logoutAccount = async (): Promise<boolean> => {
  try {
    const { account } = await createSessionClient();
    cookies().delete("appwrite-session");
    await account.deleteSession("current");
    return true;
  } catch (error) {
    console.error("Error while logging out: ", error);
    return false;
  }
};

export const createToken = async (itemId?: string): Promise<string | null> => {
  try {
    const response = await pluggyClient.createConnectToken(itemId);
    return response.accessToken;
  } catch (error) {
    console.error("Error while generating token:", error);
    return null;
  }
};

export const createBankAccount = async ({
  user,
  item,
}: createBankProps): Promise<Bank | null> => {
  try {
    const accounts = (await pluggyClient.fetchAccounts(item.id)).results;
    if (!accounts.length)
      throw new Error("No accounts found for the provided item");
    const { database } = await createAdminClient();
    const bank = await database.createDocument(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      ID.unique(),
      { userId: user.$id, bankId: item.id, accountId: accounts[0].id },
    );
    return parseStringify(bank);
  } catch (error) {
    console.error("Error while creating bank:", error);
    return null;
  }
};

export const getBanks = async ({
  userId,
}: getBanksProps): Promise<Bank[] | null> => {
  try {
    const { database } = await createAdminClient();
    const banks = await database.listDocuments(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal("userId", [userId])],
    );
    return parseStringify(banks.documents);
  } catch (error) {
    console.error("Error while gettin banks: ", error);
    return null;
  }
};

export const getBank = async ({
  documentId,
}: getBankProps): Promise<Bank | null> => {
  try {
    const { database } = await createAdminClient();
    const bank = await database.listDocuments(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal("$id", [documentId])],
    );
    return parseStringify(bank.documents[0]);
  } catch (error) {
    console.error("Error while getting bank: ", error);
    return null;
  }
};
