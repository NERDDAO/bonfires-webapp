import { redirect } from "next/navigation";

export default function HyperBlogsPage() {
  redirect("/explore?tab=hyperblogs");
}
