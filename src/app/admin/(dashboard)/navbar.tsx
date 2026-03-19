"use client";

import { useRouter } from "next/navigation";

import {
  Navbar as BaseNavbar,
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownMenu,
  NavbarBrand,
  NavbarContent,
} from "@olinfo/react-components";

import logoDark from "~/app/logo-dark.svg";
import logoLight from "~/app/logo-light.svg";
import { authClient } from "~/lib/auth-client";

export function AdminNavbar({ name }: { name: string }) {
  return (
    <BaseNavbar color="bg-base-300 text-base-content">
      <NavbarBrand>
        <picture>
          <source media="(prefers-color-scheme: dark)" srcSet={logoDark.src} />
          <img
            src={logoLight.src}
            width={logoLight.width}
            height={logoLight.height}
            alt="OIS Logo"
            className="h-full w-auto"
          />
        </picture>
      </NavbarBrand>
      <NavbarContent>
        <UserDropdown name={name} />
      </NavbarContent>
    </BaseNavbar>
  );
}

function UserDropdown({ name }: { name: string }) {
  return (
    <Dropdown className="dropdown-end">
      <DropdownButton>
        <div className="truncate uppercase max-sm:hidden md:max-lg:hidden">{name}</div>
      </DropdownButton>
      <DropdownMenu>
        <LogoutButton />
      </DropdownMenu>
    </Dropdown>
  );
}

function LogoutButton() {
  const router = useRouter();

  return (
    <DropdownItem>
      <button
        type="button"
        onClick={async () => {
          await authClient.signOut();
          router.push("/admin/login");
        }}>
        Esci
      </button>
    </DropdownItem>
  );
}
