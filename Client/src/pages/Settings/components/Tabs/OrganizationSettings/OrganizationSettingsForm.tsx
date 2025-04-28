import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Organization } from "@/types/api/organization";
import { FileIcon, Hotel, Upload } from "lucide-react";

interface Props {
  organization: Organization;
}
function OrganizationSettingsForm({ organization }: Props) {
  return (
    <div className="flex flex-col rtl:items-end ltr:items-start">
      <div className="flex rtl:flex-row-reverse ltr:flex-row items-center gap-4">
        <Avatar className="rounded-md size-20">
          <AvatarImage src={organization?.logo} alt={organization?.name} />
          <AvatarFallback className="rounded-md text-white bg-sidebar-primary">
            <Hotel className="size-8" />
          </AvatarFallback>
        </Avatar>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="rounded-2xl" variant="outline">
              <Upload /> Change Logo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit profile</DialogTitle>
              <DialogDescription>
                Make changes to your profile here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="border-2 border-dashed border-gray-200 rounded-lg flex flex-col gap-1 p-6 items-center">
              <FileIcon className="w-12 h-12" />
              <span className="text-sm font-medium text-gray-500">
                Drag and drop a file or click to browse
              </span>
              <span className="text-xs text-gray-500">
                PDF, image, video, or audio
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <Label htmlFor="file" className="text-sm font-medium">
                File
              </Label>
              <Input
                id="file"
                type="file"
                placeholder="File"
                accept="image/*"
              />
            </div>
            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default OrganizationSettingsForm;
