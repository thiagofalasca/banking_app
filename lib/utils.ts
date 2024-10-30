/* eslint-disable no-prototype-builtins */
import { type ClassValue, clsx } from "clsx";
import qs from "query-string";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDateTime = (dateString: Date) => {
  const dateTimeOptions: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  };

  const dateDayOptions: Intl.DateTimeFormatOptions = {
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };

  const dateOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    year: "numeric",
    day: "numeric",
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  };

  const formattedDateTime: string = new Date(dateString).toLocaleString(
    "en-US",
    dateTimeOptions,
  );

  const formattedDateDay: string = new Date(dateString).toLocaleString(
    "en-US",
    dateDayOptions,
  );

  const formattedDate: string = new Date(dateString).toLocaleString(
    "en-US",
    dateOptions,
  );

  const formattedTime: string = new Date(dateString).toLocaleString(
    "en-US",
    timeOptions,
  );

  return {
    dateTime: formattedDateTime,
    dateDay: formattedDateDay,
    dateOnly: formattedDate,
    timeOnly: formattedTime,
  };
};

export function formatAmount(amount: number): string {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

  return formatter.format(amount);
}

export const parseStringify = (value: any) => JSON.parse(JSON.stringify(value));

export const removeSpecialCharacters = (value: string) => {
  return value.replace(/[^\w\s]/gi, "");
};

interface UrlQueryParams {
  params: string;
  key: string;
  value: string;
}

export function formUrlQuery({ params, key, value }: UrlQueryParams) {
  const currentUrl = qs.parse(params);

  currentUrl[key] = value;

  return qs.stringifyUrl(
    {
      url: window.location.pathname,
      query: currentUrl,
    },
    { skipNull: true },
  );
}

export function countTransactionCategories(
  transactions: Transaction[],
): CategoryCount[] {
  const categoryCounts: { [category: string]: number } = {};
  let totalCount = 0;

  transactions &&
    transactions.forEach((transaction) => {
      const category = transaction.category;

      if (categoryCounts.hasOwnProperty(category)) {
        categoryCounts[category]++;
      } else {
        categoryCounts[category] = 1;
      }

      totalCount++;
    });

  const aggregatedCategories: CategoryCount[] = Object.keys(categoryCounts).map(
    (category) => ({
      name: category,
      count: categoryCounts[category],
      totalCount,
    }),
  );

  aggregatedCategories.sort((a, b) => b.count - a.count);
  return aggregatedCategories;
}

export function extractCustomerIdFromUrl(url: string) {
  const parts = url.split("/");
  const customerId = parts[parts.length - 1];
  return customerId;
}

export function encryptId(id: string) {
  return btoa(id);
}

export function decryptId(id: string) {
  return atob(id);
}

export const getTransactionStatus = (date: Date) => {
  const today = new Date();
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(today.getDate() - 2);
  return date > twoDaysAgo ? "Processing" : "Success";
};

export const authFormSchema = (type: string) =>
  z.object({
    // sign up
    firstName:
      type === "sign-in"
        ? z.string().optional()
        : z
            .string()
            .min(3, "First name must be at least 3 characters")
            .max(50, "First name must be at most 50 characters")
            .regex(/^[A-Za-z]+$/, "First name can only contain letters"),
    lastName:
      type === "sign-in"
        ? z.string().optional()
        : z
            .string()
            .min(3, "Last name must be at least 3 characters")
            .max(50, "Last name must be at most 50 characters")
            .regex(/^[A-Za-z]+$/, "Last name can only contain letters"),
    address1:
      type === "sign-in"
        ? z.string().optional()
        : z
            .string()
            .min(5, "Address must be at least 5 characters")
            .max(50, "Address must be at most 50 characters"),
    city:
      type === "sign-in"
        ? z.string().optional()
        : z.string().max(50, "City must be at most 50 characters"),
    state:
      type === "sign-in"
        ? z.string().optional()
        : z
            .string()
            .length(2, "State must be exactly 2 characters")
            .regex(/^[A-Za-z]+$/, "State can only contain letters"),
    postalCode:
      type === "sign-in"
        ? z.string().optional()
        : z
            .string()
            .length(8, "Postal code must br exactly 8 characters")
            .regex(/^\d+$/, "Postal code can only contain numbers"),
    dateOfBirth:
      type === "sign-in"
        ? z.string().optional()
        : z
            .string()
            .regex(
              /^\d{2}-\d{2}-\d{4}$/,
              "Date of birth must be in the format DD-MM-YYYY",
            ),
    // both
    email: z.string().email("Invalid email format"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/\d/, "Password must contain at least one number")
      .regex(/[\W_]/, "Password must contain at least one special character"),
  });
