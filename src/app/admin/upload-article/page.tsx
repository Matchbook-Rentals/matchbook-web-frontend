import { redirect } from "next/navigation";
import { checkRole } from "@/utils/roles";
import UploadArticleForm from "./UploadArticleForm";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function UploadArticlePage() {
  // Check if user has admin role
  const isAdmin = await checkRole("admin");

  if (!isAdmin) {
    redirect("/unauthorized");
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Upload New Blog Article</CardTitle>
          <Link href="/admin">
            <Button variant="outline">Back to Admin Dashboard</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <UploadArticleForm />
        </CardContent>
      </Card>
    </div>
  );
}
