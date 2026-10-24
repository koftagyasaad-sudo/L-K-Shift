import { getEmployeesAction } from "@/actions/employeeActions";
import { getBranchesAction } from "@/actions/branchActions";
import { getRolesAction } from "@/actions/roleActions";
import AdminEmployeesPage from "../admin/employees/page";

export default async function GeneralEmployeesPage() {
  return <AdminEmployeesPage />;
}
