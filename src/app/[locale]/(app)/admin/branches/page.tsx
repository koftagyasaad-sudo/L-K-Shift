import { getBranchesAction, type BranchData } from "@/actions/branchActions";
import BranchesClient from "./BranchesClient";

export const dynamic = "force-dynamic";

export default async function AdminBranchesPage() {
  const branchesList = await getBranchesAction();

  const formattedBranches: BranchData[] = (branchesList || []).map((b: any) => {
    const nameAr = b.nameAr || b.name || "فرع بدون اسم";
    const nameEn = b.nameEn || "";
    const displayName = b.name || nameAr || nameEn || "فرع بدون اسم";

    return {
      id: String(b.id ?? ""),
      name: displayName,
      nameAr,
      nameEn,
      address: b.address || "",
      latitude:
        b.latitude !== null && b.latitude !== undefined
          ? String(b.latitude)
          : "",
      longitude:
        b.longitude !== null && b.longitude !== undefined
          ? String(b.longitude)
          : "",
      geofenceRadius:
        typeof b.geofenceRadius === "number"
          ? b.geofenceRadius
          : typeof b.radiusMeters === "number"
            ? b.radiusMeters
            : Number(b.geofenceRadius || b.radiusMeters || 100) || 100,
      radiusMeters:
        typeof b.radiusMeters === "number"
          ? b.radiusMeters
          : typeof b.geofenceRadius === "number"
            ? b.geofenceRadius
            : Number(b.radiusMeters || b.geofenceRadius || 100) || 100,
      isActive: b.isActive !== false && b.isActive !== 0,
      googleMapsUrl: b.googleMapsUrl || b.mapsUrl || "",
      phone: b.phone || "",
      managerName: b.managerName || "",
      createdAt: b.createdAt ? String(b.createdAt) : undefined,
      updatedAt: b.updatedAt ? String(b.updatedAt) : undefined,
    } as BranchData;
  });

  return <BranchesClient initialBranches={formattedBranches} />;
}
