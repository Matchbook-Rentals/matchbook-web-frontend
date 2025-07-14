import { redirect } from 'next/navigation';
import { checkRole } from '@/utils/roles';
import client from '@/lib/prismadb';
import { UTApi } from 'uploadthing/server';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { revalidatePath } from 'next/cache';

const utapi = new UTApi();

export default async function UploadThingAdmin() {
  if (!await checkRole('admin')) {
    redirect('/unauthorized');
  }

  // Server action for mass delete
  async function massDelete(formData: FormData) {
    'use server';
    const router = formData.get('router') as string | null;
    const beforeDate = formData.get('beforeDate') ? new Date(formData.get('beforeDate') as string) : null;
    const afterDate = formData.get('afterDate') ? new Date(formData.get('afterDate') as string) : null;
    const limit = parseInt(formData.get('limit') as string) || null;

    const where: any = {};
    if (router && router !== 'all') where.router = router;
    if (beforeDate) where.uploadedAt = { lt: beforeDate };
    if (afterDate) where.uploadedAt = { gt: afterDate };

    const files = await client.uploadedFile.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
      take: limit || undefined,
    });

    const keys = files.map(f => f.key);
    if (keys.length === 0) return { success: false, message: 'No files match criteria' };

    try {
      await utapi.deleteFiles(keys);
      await client.uploadedFile.deleteMany({ where: { key: { in: keys } } });
      revalidatePath('/admin/uploadthing');
      return { success: true, deleted: keys.length };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Delete failed' };
    }
  }

  // Fetch routers and files (initial load; use client-side for pagination/filtering if needed)
  const routers = await client.uploadedFile.findMany({ select: { router: true }, distinct: ['router'] });
  const files = await client.uploadedFile.findMany({ orderBy: { uploadedAt: 'desc' }, take: 50 }); // Paginate as needed

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>UploadThing Management</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={massDelete} className="space-y-4 mb-6">
            <Select name="router">
              <SelectTrigger>
                <SelectValue placeholder="Select router" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Routers</SelectItem>
                {routers.map(r => <SelectItem key={r.router} value={r.router}>{r.router}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input name="beforeDate" type="date" placeholder="Before date" />
            <Input name="afterDate" type="date" placeholder="After date" />
            <Input name="limit" type="number" placeholder="Last X files (e.g., 300)" />
            <Button type="submit">Mass Delete</Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Router</TableHead>
                <TableHead>Uploaded At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map(file => (
                <TableRow key={file.key}>
                  <TableCell>{file.key}</TableCell>
                  <TableCell>{file.router}</TableCell>
                  <TableCell>{file.uploadedAt.toLocaleString()}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">View Metadata</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>File Metadata</DialogTitle>
                        </DialogHeader>
                        <pre>{JSON.stringify(file, null, 2)}</pre>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
