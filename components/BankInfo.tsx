"use client";

import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { formUrlQuery, formatAmount } from "@/lib/utils";

const BankInfo = ({ account, appwriteItemId }: BankInfoProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleBankChange = () => {
    const newUrl = formUrlQuery({
      params: searchParams.toString(),
      key: "id",
      value: account?.appwriteItemId,
    });
    router.push(newUrl, { scroll: false });
  };

  return (
    <div onClick={handleBankChange} className="bank-info">
      <figure className="flex-center h-fit rounded-full bg-blue-100">
        <Image
          src="/icons/connect-bank.svg"
          width={20}
          height={20}
          alt={"Bank Icon"}
          className="m-2 min-w-5"
        />
      </figure>
      <div className="flex w-full flex-1 flex-col justify-center gap-1">
        <div className="bank-info_content">
          <h2 className="text-16 line-clamp-1 flex-1 font-bold text-blue-900">
            {account.name}
          </h2>
          <p className="text-12 rounded-full px-3 py-1 font-medium text-blue-700">
            {account.number}
          </p>
        </div>
        <p className="text-16 font-medium text-blue-700">
          {formatAmount(account.currentBalance)}
        </p>
      </div>
    </div>
  );
};

export default BankInfo;
