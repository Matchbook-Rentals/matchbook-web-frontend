"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { uploadArticle } from "./_actions";
import { UploadButton } from "@/app/utils/uploadthing";
import React from "react";

export default function UploadArticleForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const [imageMethod, setImageMethod] = useState("url");
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [slug, setSlug] = useState("");
  const [excerptInput, setExcerptInput] = useState("");

  // New state for content entry method and markdown content
  const [contentMethod, setContentMethod] = useState("markdown");
  const [contentInput, setContentInput] = useState("");
  const [convertedMarkdown, setConvertedMarkdown] = useState("");

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      // Basic validation
      const title = formData.get("title") as string;
      // If using markdown entry, contentInput is already set; if using docx, contentInput is set after conversion
      const content = formData.get("content") as string || contentInput;

      if (!title || !content) {
        throw new Error("Title and content are required");
      }

      // If excerpt is blank, use the first 100 words of content
      const excerpt = formData.get("excerpt") as string;
      if (!excerpt || excerpt.trim() === "") {
        const computedExcerpt = content.split(/\s+/).slice(0, 100).join(" ");
        formData.set("excerpt", computedExcerpt);
      }

      // If publishDate is blank, use today's date
      const publishDate = formData.get("publishDate") as string;
      if (!publishDate || publishDate.trim() === "") {
        const today = new Date().toISOString().split('T')[0];
        formData.set("publishDate", today);
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

  async function handleDocxUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    // Create a FormData object to send the docx file
    const formData = new FormData();
    formData.append("docxFile", file);

    try {
      // Call the API endpoint to convert the docx to markdown using pandoc
      const res = await fetch("/api/convert-docx", {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("Conversion failed");

      const markdown = await res.text();
      setConvertedMarkdown(markdown);
      setContentInput(markdown);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Docx conversion failed",
        variant: "destructive",
      });
    }
  }

  function handleUploadFinish(res: any) {
    if (res && res.length > 0) {
      setUploadedImageUrl(res[0].url);
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
          onChange={(e) => {
            const value = e.target.value;
            setTitleInput(value);
            setSlug(value.trim().toLowerCase().replace(/\s+/g, "-"));
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <div className="flex items-center">
          <Input
            id="slug"
            name="slug"
            value={slug}
            readOnly
          />
          <span className="ml-2 text-gray-500 text-sm">(url string like articles/[slug]. Uses title to auto-generate)</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Content Entry Method</Label>
        <div>
          <label>
            <input
              type="radio"
              name="contentMethod"
              value="markdown"
              checked={contentMethod === "markdown"}
              onChange={() => setContentMethod("markdown")}
            /> Markdown Entry
          </label>
          <label className="ml-4">
            <input
              type="radio"
              name="contentMethod"
              value="docx"
              checked={contentMethod === "docx"}
              onChange={() => setContentMethod("docx")}
            /> DOCX Upload
          </label>
        </div>
      </div>

      {contentMethod === "markdown" && (
        <div className="space-y-2">
          <Label htmlFor="content">Content *</Label>
          <Textarea
            id="content"
            name="content"
            placeholder="Full article content (supports Markdown)"
            rows={10}
            required
            value={contentInput}
            onChange={(e) => {
              const newContent = e.target.value;
              setContentInput(newContent);
              if (!excerptInput.trim()) {
                const computedExcerpt = newContent.split(/\s+/).slice(0, 100).join(" ");
                setExcerptInput(computedExcerpt);
              }
            }}
          />
        </div>
      )}

      {contentMethod === "docx" && (
        <div className="space-y-2">
          <Label htmlFor="docxUpload">DOCX Upload</Label>
          <Input
            id="docxUpload"
            name="docxUpload"
            type="file"
            accept=".docx"
            onChange={handleDocxUpload}
          />
          {convertedMarkdown && (
            <>
              <Label htmlFor="content">Converted Markdown</Label>
              <Textarea
                id="content"
                name="content"
                placeholder="Converted markdown content will appear here..."
                rows={10}
                value={convertedMarkdown}
                onChange={(e) => setConvertedMarkdown(e.target.value)}
              />
            </>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea
          id="excerpt"
          name="excerpt"
          placeholder="A brief summary of the article (if left empty, first 100 words of content will be used as the excerpt)"
          rows={3}
          value={excerptInput}
          onChange={(e) => setExcerptInput(e.target.value)}
        />
        <p className="text-sm text-gray-500">This excerpt is the portion of text that is displayed on the overview screen.</p>
      </div>

      <div className="space-y-2">
        <Label>Image Source</Label>
        <div>
          <label>
            <input
              type="radio"
              name="imageSource"
              value="url"
              checked={imageMethod === "url"}
              onChange={() => setImageMethod("url")}
            /> Use Image URL
          </label>
          <label className="ml-4">
            <input
              type="radio"
              name="imageSource"
              value="upload"
              checked={imageMethod === "upload"}
              onChange={() => setImageMethod("upload")}
            /> Upload Image
          </label>
        </div>
      </div>

      {imageMethod === "url" && (
        <div className="space-y-2">
          <Label htmlFor="imageUrl">Featured Image URL</Label>
          <Input
            id="imageUrl"
            name="imageUrl"
            placeholder="https://example.com/image.jpg"
          />
        </div>
      )}

      {imageMethod === "upload" && (
        <div className="space-y-2">
          <Label>Upload Image</Label>
          <UploadButton
            endpoint="imageUploader"
            onClientUploadComplete={handleUploadFinish}
            onUploadError={(error: Error) => alert(error.message)}
          />
          {uploadedImageUrl && (
            <>
              <input type="hidden" name="imageUrl" value={uploadedImageUrl} />
              <img src={uploadedImageUrl} alt="Uploaded image" className="mt-2 max-h-60" />
            </>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="publishDate">Publish Date (optional)</Label>
        <Input
          type="date"
          id="publishDate"
          name="publishDate"
          placeholder="Leave blank to use today's date"
          defaultValue={new Date().toISOString().split('T')[0]}
        />
        <p className="text-sm text-gray-500">If left blank, today&apos;s date will be used.</p>
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

      <div className="space-y-2">
        <Label htmlFor="authorTitle">Author Title (optional)</Label>
        <Input
          id="authorTitle"
          name="authorTitle"
          placeholder="Enter Author Title (if left blank, no title will be rendered to the signature block)"
        />
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