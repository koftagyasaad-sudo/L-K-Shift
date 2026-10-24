import { getBranchesAction, type BranchData } from "@/actions/branchActions";
import { BranchEmployeeManager } from "@/components/admin/branch-employee-manager";

export default async function BranchesPage() {
  const branchesList = await getBranchesAction();

  const formattedBranches: BranchData[] = (branchesList || []).map((b: any) => ({
    id: String(b.id || Math.random().toString()),
    nameAr: b.nameAr || b.name || "فرع بدون اسم",
    nameEn: b.nameEn || "",
    address: b.address || "",
    latitude: String(b.latitude || "30.0444"),
    longitude: String(b.longitude || "31.2357"),
    geofenceRadius: Number(b.geofenceRadius || b.radiusMeters || 100),
    radiusMeters: Number(b.radiusMeters || b.geofenceRadius || 100),
    isActive: b.isActive ?? true,
  }));

  return (
    <div className="container mx-auto py-6">
      <BranchEmployeeManager initialBranches={formattedBranches} />
    </div>
  );
}
