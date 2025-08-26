import { redirect } from "next/navigation";
import { checkRole } from "@/utils/roles";
import UploadArticleForm from "./UploadArticleForm";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookText } from "lucide-react";

export default async function UploadArticlePage() {
  // Check if user has dev role
  const isDev = await checkRole("admin_dev");

  if (!isDev) {
    redirect("/unauthorized");
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <BookText className="h-6 w-6 text-primary" />
            <CardTitle>Upload New Blog Article</CardTitle>
          </div>
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
