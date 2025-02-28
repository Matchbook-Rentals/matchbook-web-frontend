"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { uploadArticle } from "./_actions";

export default function UploadArticleForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      // Basic validation
      const title = formData.get("title") as string;
      const content = formData.get("content") as string;

      if (!title || !content) {
        throw new Error("Title and content are required");
      }

      // Call the server action
      const result = await uploadArticle(formData);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Show success message
      setSuccess(true);
      toast({
        title: "Article uploaded successfully",
        description: "Your article has been saved to the database.",
        variant: "default",
      });

      // Reset form
      const form = document.getElementById("upload-article-form") as HTMLFormElement;
      form.reset();
    } catch (err: any) {
      setError(err.message || "Failed to upload article");
      toast({
        title: "Error",
        description: err.message || "Failed to upload article",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      id="upload-article-form"
      action={handleSubmit}
      className="space-y-6 max-w-2xl"
    >
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          Article uploaded successfully!
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          name="title"
          placeholder="Article Title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea
          id="excerpt"
          name="excerpt"
          placeholder="A brief summary of the article"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content *</Label>
        <Textarea
          id="content"
          name="content"
          placeholder="Full article content (supports Markdown)"
          rows={10}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageUrl">Featured Image URL</Label>
        <Input
          id="imageUrl"
          name="imageUrl"
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="authorName">Author Name</Label>
        <Input
          id="authorName"
          name="authorName"
          placeholder="The Matchbook Team"
          defaultValue="The Matchbook Team"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="published" name="published" />
        <Label htmlFor="published">Publish immediately</Label>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? "Uploading..." : "Upload Article"}
      </Button>
    </form>
  );
}