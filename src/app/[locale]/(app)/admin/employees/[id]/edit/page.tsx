"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  getEmployeeByIdAction,
  saveEmployeeAction,
} from "@/actions/employeeActions";
import { getBranchesAction } from "@/actions/branchActions";
import { getRolesAction } from "@/actions/roleActions";
import {
  User,
  Phone,
  Lock,
  Building2,
  ShieldCheck,
  Briefcase,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  Save,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default function EditEmployeePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { locale, id } = resolvedParams;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [branches, setBranches] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [branchId, setBranchId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [department, setDepartment] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [monthlySalary, setMonthlySalary] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [empRes, branchRes, roleRes] = await Promise.all([
          getEmployeeByIdAction(id),
          getBranchesAction(),
          getRolesAction(),
        ]);

        if (branchRes.success && Array.isArray(branchRes.data)) {
          setBranches(branchRes.data);
        }
        if (roleRes.success && Array.isArray(roleRes.data)) {
          setRoles(roleRes.data);
        }

        if (empRes.success && empRes.data) {
          const emp = empRes.data;
          setName(emp.name || "");
          setPhone(emp.phone || emp.employee_code || "");
          setBranchId(emp.branchId || emp.branch_id || "");
          setRoleId(emp.roleId || emp.role_id || "");
          setDepartment(emp.department || "");
          setJobTitle(emp.jobTitle || "");
          setMonthlySalary(
            emp.monthlySalary || emp.monthly_salary || emp.base_salary || ""
          );
          setIsActive(emp.isActive ?? true);
        } else {
          setError(empRes.error || "تعذر العثور على الموظف");
        }
      } catch (err) {
        console.error("Failed to load employee details:", err);
        setError("حدث خطأ أثناء تحميل بيانات الموظف");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error("يرجى إدخال اسم الموظف ورقم الهاتف / كود الدخول");
      return;
    }

    setSaving(true);
    try {
      const res = await saveEmployeeAction({
        id,
        name: name.trim(),
        phone: phone.trim(),
        employee_code: phone.trim(),
        password: password.trim() || undefined,
        branchId: branchId || null,
        branch_id: branchId || null,
        roleId: roleId || null,
        role_id: roleId || null,
        department: department.trim() || null,
        jobTitle: jobTitle.trim() || null,
        monthlySalary: monthlySalary ? String(monthlySalary) : null,
        monthly_salary: monthlySalary ? String(monthlySalary) : null,
        base_salary: monthlySalary ? String(monthlySalary) : null,
        isActive,
      });

      if (res.success) {
        toast.success("تم تحديث بيانات الموظف بنجاح");
        router.push(`/${locale}/admin/employees`);
      } else {
        toast.error(res.error || "فشل تحديث بيانات الموظف");
      }
    } catch (err) {
      toast.error("حدث خطأ غير متوقع أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const isRtl = locale === "ar";
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Link
          href={`/${locale}/admin/employees`}
          className="inline-flex items-center px-4 py-2 rounded-lg border border-input bg-background hover:bg-accent text-sm font-medium mb-4"
        >
          <BackIcon className="h-4 w-4 me-2" />
          العودة لقائمة الموظفين
        </Link>
        <div className="p-6 rounded-xl border border-destructive/50 bg-destructive/10 text-center text-destructive font-medium">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link
          href={`/${locale}/admin/employees`}
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-input bg-background hover:bg-accent transition-colors"
        >
          <BackIcon className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">تعديل بيانات الموظف</h1>
          <p className="text-sm text-muted-foreground">
            تحديث المعلومات الشخصية، التكليف بالفرع، والراتب
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold border-b pb-3 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            البيانات الأساسية
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">اسم الموظف *</label>
              <div className="relative">
                <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="محمد أحمد"
                  className="w-full h-10 ps-9 pe-3 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">رقم الهاتف / كود الدخول *</label>
              <div className="relative">
                <Phone className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01012345678"
                  className="w-full h-10 ps-9 pe-3 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-semibold">كلمة المرور الجديدة (اختياري)</label>
            <div className="relative">
              <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="اتركها فارغة للحفاظ على كلمة المرور الحالية"
                className="w-full h-10 ps-9 pe-3 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold border-b pb-3 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            التكليف والصلاحيات
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">الفرع المخصص</label>
              <div className="relative">
                <Building2 className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full h-10 ps-9 pe-3 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="">بدون فرع مخصص</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {isRtl ? b.nameAr : b.nameEn || b.nameAr}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">الدور المخصص (Custom Role)</label>
              <div className="relative">
                <ShieldCheck className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="w-full h-10 ps-9 pe-3 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="">موظف عادي (Default Employee)</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name || r.nameAr || r.nameEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">القسم</label>
              <div className="relative">
                <Briefcase className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="المبيعات / التشغيل"
                  className="w-full h-10 ps-9 pe-3 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">المسمى الوظيفي</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="محاسب / مشرف"
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">الراتب الشهري</label>
              <div className="relative">
                <DollarSign className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="number"
                  value={monthlySalary}
                  onChange={(e) => setMonthlySalary(e.target.value)}
                  placeholder="5000"
                  className="w-full h-10 ps-9 pe-3 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center justify-between w-full sm:w-auto gap-4">
            <span className="text-sm font-semibold">حالة الحساب</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Link
              href={`/${locale}/admin/employees`}
              className="px-4 py-2 rounded-lg border border-input text-sm font-medium hover:bg-muted text-center"
            >
              إلغاء
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  حفظ التغييرات
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
