async authorize(credentials): Promise<AppUser | null> {
        try {
          // قبول كل من phone أو username لتفادي أي تعارض في الواجهة
          const rawPhone = (credentials as any)?.phone || (credentials as any)?.username;
          if (!rawPhone || !credentials?.password) {
            console.warn("[AUTH] Missing credentials payload");
            return null;
          }

          const phone = String(rawPhone).trim();
          const password = String(credentials.password);

          // استعلام مباشر متوافق مع Drizzle
          const found = await db
            .select()
            .from(users)
            .where(eq(users.phone, phone))
            .limit(1);

          const user = found[0];
          if (!user) {
            console.warn(`[AUTH] User not found for phone: ${phone}`);
            return null;
          }

          const isActive = (user as any).isActive !== false && (user as any).active !== false;
          if (!isActive) {
            console.warn(`[AUTH] User account is inactive: ${phone}`);
            return null;
          }

          const passwordHash = user.passwordHash || (user as any).password;
          if (!passwordHash) {
            console.warn(`[AUTH] No password hash found for user: ${phone}`);
            return null;
          }

          const verification = await verifyPassword(password, passwordHash);
          if (!verification.isValid) {
            console.warn(`[AUTH] Password verification failed for: ${phone}`);
            return null;
          }

          if (verification.needsRehash) {
            try {
              await db
                .update(users)
                .set({ passwordHash: await hashPassword(password), updatedAt: new Date() })
                .where(eq(users.id, user.id));
            } catch (rehashErr) {
              console.error("[AUTH] Rehash update failed:", rehashErr);
            }
          }

          const role = (user as any).jobRole || (user as any).roleId || "SUPER_ADMIN";
          const systemRoleVal = (user as any).systemRole || "SUPER_ADMIN";
          const branchId = toNullableString((user as any).primaryBranchId || (user as any).branchId);
          const fullNameAr = toNullableString((user as any).fullNameAr || (user as any).name);
          const fullNameEn = toNullableString((user as any).fullNameEn);
          const displayName = fullNameAr || fullNameEn || (user as any).name || phone;

          const result: AppUser = {
            id: String(user.id),
            name: displayName,
            email: null,
            phone: user.phone || phone,
            role,
            systemRole: systemRoleVal as any,
            fullNameAr,
            fullNameEn,
            branchId,
            primaryBranchId: branchId,
          };

          return result;
        } catch (error: any) {
          console.error("[AUTH_CRITICAL_EXCEPTION]:", error);
          return null;
        }
      },