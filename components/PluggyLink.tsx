"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import type {
  ConnectEventPayload,
  PluggyConnect as PluggyConnectType,
} from "react-pluggy-connect";
import type { Item } from "pluggy-sdk";
import { createToken, createBankAccount } from "@/lib/actions/user.actions";
import { Button } from "./ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

const PluggyConnect = dynamic(
  () =>
    (import("react-pluggy-connect") as any).then(
      (mod: { PluggyConnect: any }) => mod.PluggyConnect
    ),
  { ssr: false }
) as typeof PluggyConnectType;

const PluggyLink = ({ user, variant }: PluggyLinkProps) => {
  const [connectToken, setConnectToken] = useState("");
  const [connecting, setConnecting] = useState<boolean>(false);
  const [item, setItem] = useState<Item | null>(null);
  const router = useRouter();

  const generateToken = useCallback(async (itemId?: string) => {
    const accessToken = await createToken(itemId);
    if (!accessToken) {
      console.error("Error while generating token");
      return;
    }
    setConnectToken(accessToken);
  }, []);

  useEffect(() => {
    generateToken();
  }, [generateToken]);

  const onSuccess = useCallback(async (itemData: { item: Item }) => {
    const bank = await createBankAccount({ user, item: itemData.item });
    if (!bank) {
      console.error("Erro while creating bank");
      return;
    }
    router.push("/");
  }, []);

  const onError = useCallback((error: any) => {
    console.log("Oops, there was an error: ", error);
  }, []);

  const handleEvent = useCallback((payload: ConnectEventPayload) => {
    const { event } = payload;
    console.log("[event]", event);
  }, []);

  const handleClose = useCallback(() => {
    setConnecting(false);
  }, []);

  const handleOpenConnectInCreateMode = useCallback(async () => {
    if (!connectToken) {
      console.error("Not detected token!");
      return;
    }
    if (item) {
      setItem(null);
    }
    setConnecting(true);
  }, [item, connectToken]);

  return (
    <>
      {variant === "primary" ? (
        <>
          <Button
            onClick={handleOpenConnectInCreateMode}
            className="pluggylink-primary"
          >
            Connect bank
          </Button>
          {connecting && connectToken &&
            createPortal(
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  zIndex: 9999,
                }}
              >
                <PluggyConnect
                  updateItem={item?.id}
                  connectToken={connectToken!}
                  includeSandbox={true}
                  onSuccess={onSuccess}
                  onError={onError}
                  onClose={handleClose}
                  onEvent={handleEvent}
                />
              </div>,
              document.body
            )}
        </>
      ) : (
        <>
          <Button
            onClick={handleOpenConnectInCreateMode}
            className="pluggylink-default"
          >
            <Image
              src="/icons/connect-bank.svg"
              alt="connect bank"
              width={24}
              height={24}
            />
            <p className="sidebar-label">Connect bank</p>
          </Button>
          {connecting && connectToken &&
            createPortal(
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  zIndex: 9999,
                }}
              >
                <PluggyConnect
                  updateItem={item?.id}
                  connectToken={connectToken!}
                  includeSandbox={true}
                  onSuccess={onSuccess}
                  onError={onError}
                  onClose={handleClose}
                  onEvent={handleEvent}
                />
              </div>,
              document.body
            )}
        </>
      )}
    </>
  );
};

export default PluggyLink;
