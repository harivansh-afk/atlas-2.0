'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function HeaderAuth({ asDropdownItem = false }) {
  if (asDropdownItem) {
    return (
      <>
        <DropdownMenuItem asChild>
          <Link href="/sign-in" className="w-full">
            Sign In
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/sign-up" className="w-full">
            Sign Up
          </Link>
        </DropdownMenuItem>
      </>
    );
  }

  return (
    <>
      <Link href="/sign-in">
        <Button variant="outline" size="sm">
          Sign In
        </Button>
      </Link>
      <Link href="/sign-up">
        <Button size="sm">
          Sign Up
        </Button>
      </Link>
    </>
  );
}
