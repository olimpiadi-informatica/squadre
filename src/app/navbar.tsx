import Link from "next/link";

import {
  Navbar as BaseNavbar,
  NavbarBrand,
  NavbarMenu,
  NavbarMenuItem,
} from "@olinfo/react-components";

import logoDark from "./logo-dark.svg";
import logoLight from "./logo-light.svg";

export function Navbar() {
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
      <NavbarMenu>
        <NavbarMenuItem>
          <Link href="/">Home</Link>
        </NavbarMenuItem>
        <NavbarMenuItem>
          <Link href="/edition">Rankings</Link>
        </NavbarMenuItem>
        <NavbarMenuItem>
          <Link href="/region">Teams</Link>
        </NavbarMenuItem>
        <NavbarMenuItem>
          <Link href="/about">About</Link>
        </NavbarMenuItem>
      </NavbarMenu>
    </BaseNavbar>
  );
}
