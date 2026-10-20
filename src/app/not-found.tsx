import { redirect } from "next/navigation";

export default function NotFound() {
  redirect("/shop/404.html");
}
