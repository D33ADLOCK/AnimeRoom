"use client";

import { Star } from "lucide-react";
import React, { useState } from "react";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

type BuyButtonPropType = {
  buttonColor: string;
  buttonHover: string;
  credits: number;
  packageId: string;
};

export default function BuyButton({
  buttonColor,
  buttonHover,
  credits,
  packageId,
}: BuyButtonPropType) {
  const [isLoading, setIsLoading] = useState(false);

  const { mutateAsync: createPayment } = api.payment.startPayment.useMutation();

  const onClick = async (packageId: string) => {
    setIsLoading(true);

    const payment = await createPayment({ packageId });

    if (!payment.url) throw new Error("Payment url missing");

    window.location.href = payment.url;
    setIsLoading(false);
  };

  return (
    <Button
      onClick={() => onClick(packageId)}
      size="default"
      className={`mt-6 w-full rounded-none border-[3px] border-black ${buttonColor} py-6 text-sm font-black tracking-widest text-black uppercase shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none sm:py-6 sm:text-sm ${buttonHover}`}
    >
      <Star className="mr-2 h-4 w-4 fill-black" />{" "}
      {isLoading ? "Loading... " : `Buy ${credits} Credits `}
    </Button>
  );
}
