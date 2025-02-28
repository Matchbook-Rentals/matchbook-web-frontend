import { redirect } from "next/navigation";
import { checkRole } from "@/utils/roles";
import UploadArticleForm from "./UploadArticleForm";

export default async function UploadArticlePage() {
  // Check if user has admin role
  const isAdmin = await checkRole("admin");

  if (!isAdmin) {
    redirect("/unauthorized");
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Upload New Blog Article</h1>
      <UploadArticleForm />
    </div>
  );
}
