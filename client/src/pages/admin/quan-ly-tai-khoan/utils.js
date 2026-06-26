import { ROLES } from "./constants";

export const getRoleName = (vaitro) => {
  if (!vaitro) return "Chưa phân quyền";
  const found = ROLES.find((r) => r.value === vaitro);
  return found ? found.label : vaitro;
};

export const locTaiKhoan = (accounts, searchTerm) =>
  accounts.filter((account) => {
    const fullName = `${account.ho || ""} ${account.ten || ""}`.toLowerCase();
    const email = (account.email || "").toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });
