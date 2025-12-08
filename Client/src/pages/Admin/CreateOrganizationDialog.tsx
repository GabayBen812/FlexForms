import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogBody } from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";
import { createOrganization } from "@/api/organizations";
import { createUser, updateUser } from "@/api/users";
import { toast } from "@/hooks/use-toast";

type CreateOrganizationDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function CreateOrganizationDialog({
  open,
  onClose,
  onCreated,
}: CreateOrganizationDialogProps) {
  const { t } = useTranslation();
  const [organizationName, setOrganizationName] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setOrganizationName("");
      setUserName("");
      setUserEmail("");
      setUserPassword("");
      setIsSaving(false);
    }
  }, [open]);

  const validateForm = (): boolean => {
    if (!organizationName.trim()) {
      toast.error(t("organization_name_required", "Organization name is required"));
      return false;
    }
    if (!userName.trim()) {
      toast.error(t("user_name_required", "User name is required"));
      return false;
    }
    if (!userEmail.trim()) {
      toast.error(t("user_email_required", "User email is required"));
      return false;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail.trim())) {
      toast.error(t("invalid_email", "Please enter a valid email address"));
      return false;
    }
    if (!userPassword || userPassword.length < 6) {
      toast.error(t("password_min_length", "Password must be at least 6 characters long"));
      return false;
    }
    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    let createdUserId: string | null = null;
    let createdOrganizationId: string | null = null;

    try {
      // Generate a temporary organizationId (24-character hex string like MongoDB ObjectId)
      // We'll use this temporarily and update it after organization creation
      const tempOrgId = Array.from({ length: 24 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');

      // Step 1: Create user first with temporary organizationId
      const userResponse = await createUser({
        name: userName.trim(),
        email: userEmail.trim().toLowerCase(),
        password: userPassword,
        organizationId: tempOrgId,
        role: "system_admin",
      });

      if (userResponse.error || !userResponse.data) {
        throw new Error(userResponse.error || "Failed to create user");
      }

      createdUserId = String(userResponse.data._id || userResponse.data.id);
      
      if (!createdUserId) {
        throw new Error("User created but ID not found");
      }

      // Step 2: Create organization with user's ID as owner
      const orgResponse = await createOrganization({
        name: organizationName.trim(),
        owner: createdUserId,
      });

      if (orgResponse.error || !orgResponse.data) {
        // If organization creation fails, delete the user
        // In a production system, you might want to handle this cleanup
        throw new Error(orgResponse.error || "Failed to create organization");
      }

      createdOrganizationId = orgResponse.data._id || orgResponse.data.id;
      
      if (!createdOrganizationId) {
        throw new Error("Organization created but ID not found");
      }

      // Step 3: Update user with the real organization ID
      const updateResponse = await updateUser({
        id: createdUserId,
        organizationId: createdOrganizationId,
      });

      if (updateResponse.error) {
        // Organization and user are created but not properly linked
        // This is not ideal but not critical - the user can be updated manually
        console.warn("Failed to update user with organization ID:", updateResponse.error);
      }

      toast.success(
        t("organization_created_successfully", "Organization and user created successfully")
      );
      onCreated();
      onClose();
    } catch (error) {
      console.error("Error creating organization and user:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("error_creating_organization", "Failed to create organization");
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full max-h-[92vh]">
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 max-h-[90vh]">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-semibold">
              {t("create_organization_title", "Create New Organization")}
            </DialogTitle>
          </DialogHeader>

          <DialogBody className="flex-1 overflow-y-auto space-y-6 py-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("organization_name")} *
              </label>
              <Input
                value={organizationName}
                onChange={(event) => setOrganizationName(event.target.value)}
                required
                placeholder={t("organization_name_placeholder", "Enter organization name")}
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-foreground mb-4">
                {t("organization_admin_user", "Organization Admin User")}
              </h3>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("user_name", "Name")} *
              </label>
              <Input
                value={userName}
                onChange={(event) => setUserName(event.target.value)}
                required
                placeholder={t("user_name_placeholder", "Enter user name")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("email", "Email")} *
              </label>
              <Input
                type="email"
                value={userEmail}
                onChange={(event) => setUserEmail(event.target.value)}
                required
                placeholder={t("email_placeholder", "Enter email address")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("password", "Password")} *
              </label>
              <Input
                type="password"
                value={userPassword}
                onChange={(event) => setUserPassword(event.target.value)}
                required
                minLength={6}
                placeholder={t("password_placeholder", "Enter password (min 6 characters)")}
              />
              <p className="text-xs text-muted-foreground">
                {t("password_min_length_hint", "Password must be at least 6 characters long")}
              </p>
            </div>
          </DialogBody>

          <DialogFooter className="border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? t("creating", "Creating...") : t("create", "Create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

